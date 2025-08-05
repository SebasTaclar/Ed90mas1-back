import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { Logger } from './Logger';
import { ValidationError } from './exceptions';

export class BlobStorageService {
  private teamLogosContainer: ContainerClient;
  private tournamentBannersContainer: ContainerClient;
  private playerPhotosContainer: ContainerClient;
  private readonly teamLogosContainerName = 'team-logos';
  private readonly tournamentBannersContainerName = 'tournament-banners';
  private readonly playerPhotosContainerName = 'player-photos';

  constructor(private logger: Logger) {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

    if (!connectionString) {
      throw new Error('AZURE_STORAGE_CONNECTION_STRING environment variable is not configured');
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    this.teamLogosContainer = blobServiceClient.getContainerClient(this.teamLogosContainerName);
    this.tournamentBannersContainer = blobServiceClient.getContainerClient(
      this.tournamentBannersContainerName
    );
    this.playerPhotosContainer = blobServiceClient.getContainerClient(
      this.playerPhotosContainerName
    );

    // Crear contenedores si no existen
    this.initializeContainers();
  }

  private async initializeContainers(): Promise<void> {
    try {
      await this.teamLogosContainer.createIfNotExists({
        access: 'blob', // Permite acceso público a las imágenes
      });
      await this.tournamentBannersContainer.createIfNotExists({
        access: 'blob', // Permite acceso público a las imágenes
      });
      await this.playerPhotosContainer.createIfNotExists({
        access: 'blob', // Permite acceso público a las imágenes
      });
      this.logger.logInfo('Blob containers initialized successfully');
    } catch (error) {
      this.logger.logError('Error initializing blob containers', error);
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
        throw new ValidationError('File data must be a Buffer');
      }

      // Validar tipo de archivo
      if (!this.isValidImageType(contentType)) {
        throw new ValidationError(
          `Invalid file type: ${contentType}. Only PNG, JPG, and JPEG are allowed`
        );
      }

      // Validar tamaño (5MB máximo)
      if (fileBuffer.length > 5 * 1024 * 1024) {
        throw new ValidationError('File size too large. Maximum size is 5MB');
      }

      // Validar que el buffer no esté vacío
      if (fileBuffer.length === 0) {
        throw new ValidationError('File buffer is empty');
      }

      // Generar nombre único para el archivo
      const fileExtension = this.getFileExtension(fileName);
      const uniqueFileName = `team-${teamId}-${Date.now()}${fileExtension}`;

      // Subir archivo
      const blockBlobClient = this.teamLogosContainer.getBlockBlobClient(uniqueFileName);

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
        throw new ValidationError('Invalid logo URL');
      }

      const blockBlobClient = this.teamLogosContainer.getBlockBlobClient(fileName);
      await blockBlobClient.deleteIfExists();

      this.logger.logInfo('Team logo deleted successfully', { fileName });
    } catch (error) {
      this.logger.logError('Error deleting team logo', error);
      throw error;
    }
  }

  async uploadTournamentBanner(
    tournamentId: number,
    fileBuffer: Buffer,
    fileName: string,
    contentType: string
  ): Promise<string> {
    try {
      this.logger.logInfo('Starting tournament banner upload', {
        tournamentId,
        fileName,
        contentType,
        fileSize: fileBuffer.length,
        isBuffer: Buffer.isBuffer(fileBuffer),
      });

      // Validar que es un Buffer válido
      if (!Buffer.isBuffer(fileBuffer)) {
        throw new ValidationError('File data must be a Buffer');
      }

      // Validar tipo de archivo
      if (!this.isValidImageType(contentType)) {
        throw new ValidationError(
          `Invalid file type: ${contentType}. Only PNG, JPG, and JPEG are allowed`
        );
      }

      // Validar tamaño (5MB máximo)
      if (fileBuffer.length > 5 * 1024 * 1024) {
        throw new ValidationError('File size too large. Maximum size is 5MB');
      }

      // Validar que el buffer no esté vacío
      if (fileBuffer.length === 0) {
        throw new ValidationError('File buffer is empty');
      }

      // Generar nombre único para el archivo
      const fileExtension = this.getFileExtension(fileName);
      const uniqueFileName = `tournament-${tournamentId}-${Date.now()}${fileExtension}`;

      // Subir archivo
      const blockBlobClient = this.tournamentBannersContainer.getBlockBlobClient(uniqueFileName);

      this.logger.logInfo('Uploading tournament banner to blob storage', {
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

      const bannerUrl = blockBlobClient.url;

      this.logger.logInfo('Tournament banner uploaded successfully', {
        tournamentId,
        fileName: uniqueFileName,
        url: bannerUrl,
      });

      return bannerUrl;
    } catch (error) {
      this.logger.logError('Error uploading tournament banner', error);
      throw error;
    }
  }

  async deleteTournamentBanner(bannerUrl: string): Promise<void> {
    try {
      // Extraer nombre del archivo de la URL
      const fileName = this.extractFileNameFromUrl(bannerUrl);

      if (!fileName) {
        throw new ValidationError('Invalid banner URL');
      }

      const blockBlobClient = this.tournamentBannersContainer.getBlockBlobClient(fileName);
      await blockBlobClient.deleteIfExists();

      this.logger.logInfo('Tournament banner deleted successfully', { fileName });
    } catch (error) {
      this.logger.logError('Error deleting tournament banner', error);
      throw error;
    }
  }

  async uploadPlayerPhoto(
    playerId: number,
    fileBuffer: Buffer,
    fileName: string,
    contentType: string
  ): Promise<string> {
    try {
      this.logger.logInfo('Starting player photo upload', {
        playerId,
        fileName,
        contentType,
        fileSize: fileBuffer.length,
      });

      if (!this.isValidImageType(contentType)) {
        throw new ValidationError('Invalid file type. Only PNG and JPEG are supported');
      }

      // Crear nombre único para el archivo
      const timestamp = Date.now();
      const fileExtension = this.getFileExtension(fileName);
      const uniqueFileName = `player-${playerId}-${timestamp}${fileExtension}`;

      const blockBlobClient = this.playerPhotosContainer.getBlockBlobClient(uniqueFileName);

      await blockBlobClient.uploadData(fileBuffer, {
        blobHTTPHeaders: {
          blobContentType: contentType,
        },
      });

      const photoUrl = blockBlobClient.url;

      this.logger.logInfo('Player photo uploaded successfully', {
        playerId,
        fileName: uniqueFileName,
        url: photoUrl,
      });

      return photoUrl;
    } catch (error) {
      this.logger.logError('Error uploading player photo', error);
      throw error;
    }
  }

  async deletePlayerPhoto(photoUrl: string): Promise<void> {
    try {
      // Extraer nombre del archivo de la URL
      const fileName = this.extractFileNameFromUrl(photoUrl);

      if (!fileName) {
        throw new ValidationError('Invalid photo URL');
      }

      const blockBlobClient = this.playerPhotosContainer.getBlockBlobClient(fileName);
      await blockBlobClient.deleteIfExists();

      this.logger.logInfo('Player photo deleted successfully', { fileName });
    } catch (error) {
      this.logger.logError('Error deleting player photo', error);
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
