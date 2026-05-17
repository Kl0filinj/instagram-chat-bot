import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Req,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { S3Service } from 'src/s3/s3.service';

@Controller('files')
export class FilesController {
  constructor(private readonly s3Service: S3Service) {}

  // @Get(':key')
  // async getFile(
  //   @Param('key') key: string,
  //   @Res() res: Response,
  //   @Req() req: Request,
  // ) {
  //   try {
  //     console.log('@@ LOG: ', key, req.headers);
  //     const { stream, contentType, contentLength } =
  //       await this.s3Service.getFileStream(key);

  //     const headers: Record<string, string | number> = {
  //       'Content-Type': contentType,
  //       'Content-Disposition': 'inline',
  //       'Cache-Control': 'public, max-age=86400',
  //     };

  //     // Content-Length eliminates chunked transfer encoding so Meta's
  //     // image fetcher can buffer the response correctly for template rendering.
  //     if (contentLength !== undefined) {
  //       headers['Content-Length'] = contentLength;
  //     }

  //     res.set(headers);
  //     stream.pipe(res);
  //   } catch {
  //     throw new NotFoundException('File not found');
  //   }
  // }
}
