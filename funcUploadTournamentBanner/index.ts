import { Context, HttpRequest } from '@azure/functions';
import { Logger } from '../src/shared/Logger';
import { withAuthenticatedApiHandler } from '../src/shared/apiHandler';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { getTournamentService, getBlobStorageService } from '../src/shared/serviceProvider';
import { AuthenticatedUser } from '../src/shared/authMiddleware';
import { AuthorizationError, ValidationError } from '../src/shared/exceptions';
import * as busboy from 'busboy';
import { Readable } from 'stream';

interface ParsedFile {
  buffer: Buffer;
  filename: string;
  mimetype: string;
}

const parseMultipartData = (req: HttpRequest): Promise<ParsedFile | null> => {
  return new Promise((resolve, reject) => {
    const contentType = req.headers['content-type'];

    if (!contentType || !contentType.includes('multipart/form-data')) {
      return resolve(null);
    }

    const bb = busboy({ headers: { 'content-type': contentType } });
    let fileFound = false;

    bb.on('file', (name: string, file: Readable, info: { filename: string; mimeType: string }) => {
      if (name === 'bannerFile') {
        fileFound = true;
        const chunks: Buffer[] = [];

        file.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        file.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve({
            buffer,
            filename: info.filename,
            mimetype: info.mimeType,
          });
        });

        file.on('error', (err: Error) => {
          reject(err);
        });
      } else {
        file.resume(); // Ignorar otros campos
      }
    });

    bb.on('finish', () => {
      if (!fileFound) {
        resolve(null);
      }
    });

    bb.on('error', (err: Error) => {
      reject(err);
    });

    // Convertir el body del request a stream
    if (req.body) {
      if (Buffer.isBuffer(req.body)) {
        bb.write(req.body);
        bb.end();
      } else if (typeof req.body === 'string') {
        bb.write(Buffer.from(req.body, 'utf-8'));
        bb.end();
      } else {
        reject(new Error('Invalid request body format'));
      }
    } else {
      reject(new Error('No request body provided'));
    }
  });
};

const funcUploadTournamentBanner = async (
  _context: Context,
  _req: HttpRequest,
  log: Logger,
  user: AuthenticatedUser
): Promise<unknown> => {
  const tournamentId = parseInt(_req.params?.id);

  log.logInfo(
    `Uploading banner for tournament ID: ${tournamentId} - Requested by: ${user.email} (Role: ${user.role})`
  );

  // Verificar permisos - solo admins pueden subir banners de torneos
  if (user.role !== 'admin') {
    throw new AuthorizationError('Only administrators can upload tournament banners');
  }

  const tournamentService = getTournamentService(log);
  const blobStorageService = getBlobStorageService(log);

  const tournament = await tournamentService.getTournamentById(tournamentId);

  // Parsear el archivo del multipart/form-data
  let parsedFile: ParsedFile | null;
  try {
    parsedFile = await parseMultipartData(_req);
  } catch (error) {
    log.logError('Error parsing multipart data', error);
    throw new ValidationError('Error parsing uploaded file');
  }

  if (!parsedFile) {
    throw new ValidationError('No banner file provided in bannerFile field');
  }

  log.logInfo('File parsed successfully', {
    filename: parsedFile.filename,
    mimetype: parsedFile.mimetype,
    size: parsedFile.buffer.length,
  });

  // Eliminar banner anterior si existe
  if (tournament.bannerPath) {
    try {
      await blobStorageService.deleteTournamentBanner(tournament.bannerPath);
      log.logInfo('Previous tournament banner deleted', { url: tournament.bannerPath });
    } catch (error) {
      log.logWarning('Failed to delete previous tournament banner', error);
      // Continuar con la subida aunque falle la eliminación
    }
  }

  // Subir nuevo banner
  const bannerUrl = await blobStorageService.uploadTournamentBanner(
    tournamentId,
    parsedFile.buffer,
    parsedFile.filename,
    parsedFile.mimetype
  );

  // Actualizar tournament con nueva URL del banner
  const updatedTournament = await tournamentService.updateTournament(tournamentId, {
    bannerPath: bannerUrl,
  });

  log.logInfo('Tournament banner uploaded and updated successfully', {
    tournamentId,
    bannerUrl,
  });

  return ApiResponseBuilder.success({
    tournament: updatedTournament,
    bannerUrl,
    message: 'Tournament banner uploaded successfully',
  });
};

export default withAuthenticatedApiHandler(funcUploadTournamentBanner);
