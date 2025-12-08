import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { REDIS_CLIENT, RedisClient } from '../constants';

@Injectable()
export class RedisRepository {
  private localizationKey = 'lang:';
  private fileUrlKey = 'file:url:';
  private readonly FILE_URL_TTL = 86400; // 24 hours in seconds

  constructor(
    @Inject(forwardRef(() => REDIS_CLIENT))
    private readonly redisClient: RedisClient,
  ) {}

  async setUserLocalizationLang(igId: string, language: string) {
    return this.redisClient.set(`${this.localizationKey}${igId}`, language);
  }

  async getUserLocalizationLang(igId: string) {
    return this.redisClient.get(`${this.localizationKey}${igId}`);
  }

  /**
   * Cache a signed file URL in Redis with 24 hour expiration
   * @param fileId - The unique file ID
   * @param signedUrl - The signed URL from S3
   */
  async setFileSignedUrl(fileId: string, signedUrl: string): Promise<void> {
    await this.redisClient.setEx(
      `${this.fileUrlKey}${fileId}`,
      this.FILE_URL_TTL,
      signedUrl,
    );
  }

  /**
   * Get a cached signed file URL from Redis
   * @param fileId - The unique file ID
   * @returns The signed URL if cached and not expired, null otherwise
   */
  async getFileSignedUrl(fileId: string): Promise<string | null> {
    return this.redisClient.get(`${this.fileUrlKey}${fileId}`);
  }

  /**
   * Delete a cached signed file URL from Redis
   * @param fileId - The unique file ID
   */
  async deleteFileSignedUrl(fileId: string): Promise<void> {
    await this.redisClient.del(`${this.fileUrlKey}${fileId}`);
  }
}
