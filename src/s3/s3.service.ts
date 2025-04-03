import {
  GetObjectCommand,
  PutObjectCommand,
  PutObjectCommandInput,
  PutObjectCommandOutput,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

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
      Metadata: {
        'Content-Type': file.mimetype,
        'Content-Disposition': `inline`,
      },
    };
    console.log('input : ', input);

    try {
      const response: PutObjectCommandOutput = await this.s3.send(
        new PutObjectCommand(input),
      );
      // console.log('S3 RESPONSE : ', response);
      if (response.$metadata.httpStatusCode === 200) {
        return key;
      }
      throw new Error();
    } catch (error) {
      console.log('S3 ERROR : ', error.message ?? error);
      throw new Error();
    }
  }

  async getFileUrl(key: string) {
    if (key.includes('http')) {
      return key;
    }
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return await getSignedUrl(this.s3, command); //* Maybe return the expiration { expiresIn: 3600 }
  }
}
