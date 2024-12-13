import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { HttpModule } from '@nestjs/axios';
import { HttpRepository } from '@libs';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [HttpModule, ScheduleModule.forRoot()],
  controllers: [WebhooksController],
  providers: [WebhooksService, HttpRepository],
})
export class WebhooksModule {}
