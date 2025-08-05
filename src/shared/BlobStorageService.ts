import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { Logger } from './Logger';

export class BlobStorageService {
  private containerClient: ContainerClient;
  private readonly containerName = 'team-logos';

  constructor(private logger: Logger) {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

    if (!connectionString) {
      throw new Error('AZURE_STORAGE_CONNECTION_STRING environment variable is not configured');
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    this.containerClient = blobServiceClient.getContainerClient(this.containerName);

    // Crear contenedor si no existe
    this.initializeContainer();
  }

  private async initializeContainer(): Promise<void> {
    try {
      await this.containerClient.createIfNotExists({
        access: 'blob', // Permite acceso público a las imágenes
      });
      this.logger.logInfo('Blob container initialized successfully');
    } catch (error) {
      this.logger.logError('Error initializing blob container', error);
      throw error;
    }
  }

  async uploadTeamLogo(
    teamId: number,
    fileBuffer: Buffer,
    fileName: string,
    contentType: string
  ): Promise<string> {
    try {
      this.logger.logInfo('Starting team logo upload', {
        teamId,
        fileName,
        contentType,
        fileSize: fileBuffer.length,
        isBuffer: Buffer.isBuffer(fileBuffer),
      });

      // Validar que es un Buffer válido
      if (!Buffer.isBuffer(fileBuffer)) {
        throw new Error('File data must be a Buffer');
      }

      // Validar tipo de archivo
      if (!this.isValidImageType(contentType)) {
        throw new Error(`Invalid file type: ${contentType}. Only PNG, JPG, and JPEG are allowed`);
      }

      // Validar tamaño (5MB máximo)
      if (fileBuffer.length > 5 * 1024 * 1024) {
        throw new Error('File size too large. Maximum size is 5MB');
      }

      // Validar que el buffer no esté vacío
      if (fileBuffer.length === 0) {
        throw new Error('File buffer is empty');
      }

      // Generar nombre único para el archivo
      const fileExtension = this.getFileExtension(fileName);
      const uniqueFileName = `team-${teamId}-${Date.now()}${fileExtension}`;

      // Subir archivo
      const blockBlobClient = this.containerClient.getBlockBlobClient(uniqueFileName);

      this.logger.logInfo('Uploading to blob storage', {
        uniqueFileName,
        contentType,
        bufferLength: fileBuffer.length,
      });

      await blockBlobClient.uploadData(fileBuffer, {
        blobHTTPHeaders: {
          blobContentType: contentType,
          blobCacheControl: 'public, max-age=31536000', // Cache por 1 año
        },
      });

      const logoUrl = blockBlobClient.url;

      this.logger.logInfo('Team logo uploaded successfully', {
        teamId,
        fileName: uniqueFileName,
        url: logoUrl,
      });

      return logoUrl;
    } catch (error) {
      this.logger.logError('Error uploading team logo', error);
      throw error;
    }
  }

  async deleteTeamLogo(logoUrl: string): Promise<void> {
    try {
      // Extraer nombre del archivo de la URL
      const fileName = this.extractFileNameFromUrl(logoUrl);

      if (!fileName) {
        throw new Error('Invalid logo URL');
      }

      const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);
      await blockBlobClient.deleteIfExists();

      this.logger.logInfo('Team logo deleted successfully', { fileName });
    } catch (error) {
      this.logger.logError('Error deleting team logo', error);
      throw error;
    }
  }

  private isValidImageType(contentType: string): boolean {
    const validTypes = ['image/png', 'image/jpg', 'image/jpeg'];
    return validTypes.includes(contentType.toLowerCase());
  }

  private getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot > 0 ? fileName.substring(lastDot) : '.jpg';
  }

  private extractFileNameFromUrl(url: string): string | null {
    try {
      const urlParts = url.split('/');
      return urlParts[urlParts.length - 1];
    } catch {
      return null;
    }
  }
}
