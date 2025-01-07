import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { HttpModule } from '@nestjs/axios';
import { HttpRepository, RedisModule, RedisRepository } from '@libs';
import { ScheduleModule } from '@nestjs/schedule';
import { AcceptLanguageResolver, I18nModule } from 'nestjs-i18n';
import { HelpersService } from './helpers/helpers.service';
import * as path from 'path';
import { S3Service } from 'src/s3/s3.service';

@Module({
  imports: [
    HttpModule,
    ScheduleModule.forRoot(),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/../i18n/'),
        watch: true,
      },
      resolvers: [AcceptLanguageResolver],
    }),
    RedisModule.forRoot(process.env.REDIS_URL),
  ],
  controllers: [WebhooksController],
  providers: [
    S3Service,
    WebhooksService,
    HttpRepository,
    RedisRepository,
    HelpersService,
  ],
})
export class WebhooksModule {}
