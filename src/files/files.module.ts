import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { S3Module } from 'src/s3/s3.module';
import { RedisModule, RedisRepository } from '@libs';

@Module({
  imports: [PrismaModule, S3Module, RedisModule],
  providers: [FilesService, RedisRepository],
  exports: [FilesService],
})
export class FilesModule {}
