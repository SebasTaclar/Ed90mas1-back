import { Context, HttpRequest } from '@azure/functions';
import { Logger } from '../src/shared/Logger';
import { withAuthenticatedApiHandler } from '../src/shared/apiHandler';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { getPlayerService, getBlobStorageService } from '../src/shared/serviceProvider';
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
      if (name === 'photoFile') {
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

const funcUploadPlayerPhoto = async (
  _context: Context,
  _req: HttpRequest,
  log: Logger,
  user: AuthenticatedUser
): Promise<unknown> => {
  const playerId = parseInt(_req.params?.id);

  log.logInfo(
    `Uploading photo for player ID: ${playerId} - Requested by: ${user.email} (Role: ${user.role})`
  );

  // Verificar permisos: admin o team owner pueden subir fotos de jugadores
  if (user.role !== 'admin' && user.role !== 'team') {
    throw new AuthorizationError('Only administrators or team owners can upload player photos');
  }

  const playerService = getPlayerService(log);
  const blobStorageService = getBlobStorageService(log);

  const player = await playerService.getPlayerById(playerId);

  // Si es rol "team", verificar que es owner del equipo del jugador
  if (user.role === 'team') {
    // Comparar como números para evitar problemas de tipo
    const userId = Number(user.id);
    const teamUserId = Number(player.team.user?.id);

    if (userId !== teamUserId) {
      throw new AuthorizationError('You can only upload photos for players from your own team');
    }
  }

  // Parsear el archivo del multipart/form-data
  let parsedFile: ParsedFile | null;
  try {
    parsedFile = await parseMultipartData(_req);
  } catch (error) {
    log.logError('Error parsing multipart data', error);
    throw new ValidationError('Error parsing uploaded file');
  }

  if (!parsedFile) {
    throw new ValidationError('No photo file provided in photoFile field');
  }

  log.logInfo('File parsed successfully', {
    filename: parsedFile.filename,
    mimetype: parsedFile.mimetype,
    size: parsedFile.buffer.length,
  });

  // Eliminar foto anterior si existe
  if (player.profilePhotoPath) {
    try {
      await blobStorageService.deletePlayerPhoto(player.profilePhotoPath);
      log.logInfo('Previous player photo deleted', { url: player.profilePhotoPath });
    } catch (error) {
      log.logWarning('Failed to delete previous player photo', error);
      // Continuar con la subida aunque falle la eliminación
    }
  }

  // Subir nueva foto
  const photoUrl = await blobStorageService.uploadPlayerPhoto(
    playerId,
    parsedFile.buffer,
    parsedFile.filename,
    parsedFile.mimetype
  );

  // Actualizar player con nueva URL de la foto
  const updatedPlayer = await playerService.updatePlayer(playerId, {
    profilePhotoPath: photoUrl,
  });

  log.logInfo('Player photo uploaded and updated successfully', {
    playerId,
    photoUrl,
  });

  return ApiResponseBuilder.success({
    player: updatedPlayer,
    photoUrl,
    message: 'Player photo uploaded successfully',
  });
};

export default withAuthenticatedApiHandler(funcUploadPlayerPhoto);
