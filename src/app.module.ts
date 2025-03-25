import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ReportsModule } from './reports/reports.module';
import { ConfigModule } from '@nestjs/config';
import { WebhooksModule } from './webhooks/webhooks.module';
import { HelpersModule } from './webhooks/helpers/helpers.module';
import { S3Module } from './s3/s3.module';
import { AdminModule } from './admin/admin.module';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [
    PrismaModule,
    ReportsModule,
    ConfigModule,
    WebhooksModule,
    HelpersModule,
    S3Module,
    AdminModule,
    TelegramModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
