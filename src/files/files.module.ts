import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { S3Module } from 'src/s3/s3.module';
import { RedisModule, RedisRepository } from '@libs';

@Module({
  imports: [PrismaModule, S3Module, RedisModule],
  controllers: [FilesController],
  providers: [FilesService, RedisRepository],
  exports: [FilesService],
})
export class FilesModule {}
