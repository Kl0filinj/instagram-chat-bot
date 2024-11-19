import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ReportsModule } from './reports/reports.module';
import { ConfigModule } from '@nestjs/config';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [PrismaModule, ReportsModule, ConfigModule, WebhooksModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
