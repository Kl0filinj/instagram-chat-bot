import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { JwtModule } from '@nestjs/jwt';
import { AtStrategy } from '@libs';
import { S3Module } from 'src/s3/s3.module';

@Module({
  controllers: [AdminController],
  providers: [AdminService, AtStrategy],
  imports: [
    JwtModule.register({
      secret: process.env.ADMIN_JWT_SECRET,
      signOptions: {
        expiresIn: '1d',
      },
    }),
    S3Module,
  ],
})
export class AdminModule {}
