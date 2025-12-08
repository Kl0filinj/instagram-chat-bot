import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { JwtModule } from '@nestjs/jwt';
import { AtStrategy } from '@libs';
import { FilesModule } from 'src/files/files.module';

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
    FilesModule,
  ],
})
export class AdminModule {}
