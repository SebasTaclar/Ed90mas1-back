import { Context, HttpRequest } from '@azure/functions';
import { Logger } from '../src/shared/Logger';
import { withAuthenticatedApiHandler } from '../src/shared/apiHandler';
import { ApiResponseBuilder } from '../src/shared/ApiResponse';
import { getTeamService, getBlobStorageService } from '../src/shared/serviceProvider';
import { AuthenticatedUser } from '../src/shared/authMiddleware';
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
      if (name === 'logoFile') {
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

    bb.on('error', (err: Error) => {
      reject(err);
    });

    bb.on('finish', () => {
      if (!fileFound) {
        resolve(null);
      }
    });

    // Convertir el body string a buffer para busboy
    const bodyBuffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body, 'utf8');
    bb.write(bodyBuffer);
    bb.end();
  });
};

const funcUploadTeamLogo = async (
  _context: Context,
  req: HttpRequest,
  log: Logger,
  user: AuthenticatedUser
): Promise<unknown> => {
  const teamId = parseInt(req.params?.id);

  log.logInfo(
    `Uploading logo for team ID: ${teamId} - Requested by: ${user.email} (Role: ${user.role})`
  );

  const teamService = getTeamService(log);
  const blobStorageService = getBlobStorageService(log);

  // Verificar que el equipo existe y el usuario tiene permisos
  const existingTeam = await teamService.getTeamById(teamId);

  // Verificar permisos: solo admin o dueño del equipo
  if (user.role !== 'admin' && user.id !== existingTeam.user.id.toString()) {
    return ApiResponseBuilder.error('Forbidden: You can only upload logos for your own team', 403);
  }

  // Parsear multipart data
  let parsedFile: ParsedFile | null;
  try {
    parsedFile = await parseMultipartData(req);
  } catch (error) {
    log.logError('Error parsing multipart data', error);
    return ApiResponseBuilder.error('Error parsing uploaded file', 400);
  }

  if (!parsedFile) {
    return ApiResponseBuilder.error(
      'No file uploaded. Please use key "logoFile" in form-data',
      400
    );
  }

  const { buffer: fileBuffer, filename, mimetype } = parsedFile;

  // Validar que el archivo no esté vacío
  if (fileBuffer.length === 0) {
    return ApiResponseBuilder.error('Uploaded file is empty', 400);
  }

  // Verificar que sea realmente un archivo de imagen válido
  const fileSignature = fileBuffer.slice(0, 4);
  let contentType = mimetype;

  // Detectar tipo de archivo por signature (más confiable que mimetype)
  if (
    fileSignature[0] === 0x89 &&
    fileSignature[1] === 0x50 &&
    fileSignature[2] === 0x4e &&
    fileSignature[3] === 0x47
  ) {
    contentType = 'image/png';
  } else if (fileSignature[0] === 0xff && fileSignature[1] === 0xd8) {
    contentType = 'image/jpeg';
  } else {
    return ApiResponseBuilder.error('Invalid image file. Only PNG and JPEG are supported', 400);
  }

  log.logInfo('Processed file upload details', {
    originalFilename: filename,
    mimetype,
    detectedContentType: contentType,
    bufferLength: fileBuffer.length,
    signature: Array.from(fileSignature)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' '),
  });

  // Eliminar logo anterior si existe
  if (existingTeam.logoPath) {
    await blobStorageService.deleteTeamLogo(existingTeam.logoPath);
  }

  // Subir nuevo logo
  const logoUrl = await blobStorageService.uploadTeamLogo(
    teamId,
    fileBuffer,
    filename,
    contentType
  );

  // Actualizar equipo con nueva URL
  await teamService.updateTeam(teamId, { logoPath: logoUrl }, user);

  return ApiResponseBuilder.success({ logoUrl }, 'Team logo uploaded successfully');
};

export default withAuthenticatedApiHandler(funcUploadTeamLogo);
