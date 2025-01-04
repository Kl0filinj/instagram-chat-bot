import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ReportsModule } from './reports/reports.module';
import { ConfigModule } from '@nestjs/config';
import { WebhooksModule } from './webhooks/webhooks.module';
import { HelpersModule } from './webhooks/helpers/helpers.module';

@Module({
  imports: [
    PrismaModule,
    ReportsModule,
    ConfigModule,
    WebhooksModule,
    HelpersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
