import {
  DeleteObjectCommand,
  // GetObjectCommand, // only needed for presigned URLs
  GetObjectCommand,
  PutObjectCommand,
  PutObjectCommandInput,
  PutObjectCommandOutput,
  S3Client,
} from '@aws-sdk/client-s3';
// import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { Readable } from 'stream';

@Injectable()
export class S3Service {
  private readonly region: string;
  private readonly bucket: string;
  private readonly s3: S3Client;

  constructor() {
    this.region = process.env.AWS_S3_REGION || 'eu-north-1';
    this.bucket = process.env.AWS_S3_BUCKET_NAME;
    this.s3 = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_S3_ACCESS_KEY,
        secretAccessKey: process.env.AWS_S3_SECRET_KEY,
      },
    });
  }

  async uploadFile(file: Express.Multer.File) {
    const randomValue = Math.floor(Math.random() * 1000000);
    const hashedFileName = crypto
      .createHash('md5')
      .update(`${file.originalname}-${randomValue}`)
      .digest('hex');
    const ext = file.mimetype.split('/')[1];
    const key = `${hashedFileName}.${ext}`;

    const input: PutObjectCommandInput = {
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ContentDisposition: 'inline',
    };
    // console.log('input : ', input);

    try {
      const response: PutObjectCommandOutput = await this.s3.send(
        new PutObjectCommand(input),
      );
      if (response.$metadata.httpStatusCode === 200) {
        return key;
      }
      throw new Error();
    } catch (error) {
      console.log('S3 ERROR : ', error.message ?? error);
      throw new Error();
    }
  }

  async getFileUrl(key: string, _expiresIn: number = 3600) {
    if (key.includes('http')) {
      return key;
    }
    // const command = new GetObjectCommand({
    //   Bucket: this.bucket,
    //   Key: key,
    // });
    // return await getSignedUrl(this.s3, command, { expiresIn });
    const serverDomain = process.env.SERVER_DOMAIN?.trim();
    if (serverDomain) {
      const normalizedServerDomain = serverDomain.endsWith('/')
        ? serverDomain.slice(0, -1)
        : serverDomain;
      return `${normalizedServerDomain}/files/${key}`;
    }

    // Fallback URL
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

    // Presigned URL (private bucket) — commented out because Instagram cannot
    // fetch presigned S3 URLs when rendering template card images
    // const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    // return await getSignedUrl(this.s3, command, { expiresIn });
  }

  /**
   * Get a URL for a file to be cached in Redis
   */
  async getSignedUrlForCache(key: string): Promise<string> {
    // return this.getFileUrl(key, 86400); // 24 hours
    return this.getFileUrl(key);
  }

  async getFileStream(
    key: string,
  ): Promise<{ stream: Readable; contentType: string }> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    const response = await this.s3.send(command);
    return {
      stream: response.Body as Readable,
      contentType: response.ContentType || 'application/octet-stream',
    };
  }

  /**
   * Delete a file from S3 by its key
   * @param key - The S3 object key to delete
   */
  async deleteFile(key: string): Promise<void> {
    if (!key || key.includes('http')) {
      console.warn('Invalid S3 key provided for deletion:', key);
      return;
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.s3.send(command);
      console.log('S3 file deleted successfully:', key, response.$metadata);
    } catch (error) {
      console.error(
        'Error deleting file from S3:',
        error.message ?? error,
        'Key:',
        key,
      );
      throw new Error(`Failed to delete file from S3: ${key}`);
    }
  }
}
