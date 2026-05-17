import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { S3Service } from 'src/s3/s3.service';

@Controller('files')
export class FilesController {
  constructor(private readonly s3Service: S3Service) {}

  @Get(':key')
  async getFile(@Param('key') key: string, @Res() res: Response) {
    try {
      const { stream, contentType } = await this.s3Service.getFileStream(key);

      res.set({
        'Content-Type': contentType,
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=86400',
      });

      stream.pipe(res);
    } catch {
      throw new NotFoundException('File not found');
    }
  }
}
