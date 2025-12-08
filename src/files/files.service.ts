import { RedisRepository } from '@libs';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { S3Service } from 'src/s3/s3.service';

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly redisRepository: RedisRepository,
  ) {}

  /**
   * Upload a file to S3 and create a File record in the database
   * @param file - The file to upload
   * @returns The created File record
   */
  async uploadFile(file: Express.Multer.File) {
    const s3Key = await this.s3Service.uploadFile(file);

    const fileRecord = await this.prisma.file.create({
      data: {
        s3Key,
        mimeType: file.mimetype,
        size: file.size,
      },
    });

    return fileRecord;
  }

  /**
   * Get a signed URL for a file, using Redis cache if available
   * If the URL is not in cache or has expired, request a new one from S3
   * and cache it for 24 hours
   * @param fileId - The File ID from the database
   * @returns The signed URL
   */
  async getFileUrl(fileId: string): Promise<string | null> {
    if (!fileId) {
      return null;
    }

    const cachedUrl = await this.redisRepository.getFileSignedUrl(fileId);
    if (cachedUrl) {
      return cachedUrl;
    }

    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return null;
    }

    // Generate new signed URL (24 hour expiration)
    const signedUrl = await this.s3Service.getSignedUrlForCache(file.s3Key);
    await this.redisRepository.setFileSignedUrl(fileId, signedUrl);

    return signedUrl;
  }

  /**
   * Get a signed URL for a file by S3 key (used for backward compatibility)
   * @param s3Key - The S3 key
   * @returns The signed URL
   */
  async getFileUrlByS3Key(s3Key: string): Promise<string> {
    return this.s3Service.getSignedUrlForCache(s3Key);
  }

  /**
   * Delete a file from S3 and database
   * @param fileId - The File ID from the database
   */
  async deleteFile(fileId: string): Promise<void> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (file) {
      await this.redisRepository.deleteFileSignedUrl(fileId);
      await this.prisma.file.delete({
        where: { id: fileId },
      });
      await this.s3Service.deleteFile(file.s3Key);
    }
  }

  /**
   * Get file record by ID
   * @param fileId - The File ID
   * @returns The File record
   */
  async getFileById(fileId: string) {
    return this.prisma.file.findUnique({
      where: { id: fileId },
    });
  }

  /**
   * Get file record by S3 key
   * @param s3Key - The S3 key
   * @returns The File record
   */
  async getFileByS3Key(s3Key: string) {
    return this.prisma.file.findUnique({
      where: { s3Key },
    });
  }

  /**
   * Invalidate the cached URL for a file
   * @param fileId - The File ID
   */
  async invalidateFileCache(fileId: string): Promise<void> {
    await this.redisRepository.deleteFileSignedUrl(fileId);
  }
}
