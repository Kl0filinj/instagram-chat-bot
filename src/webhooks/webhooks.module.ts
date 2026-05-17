import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { HttpModule } from '@nestjs/axios';
import { HttpRepository, RedisModule, RedisRepository } from '@libs';
import * as http from 'http';
import * as https from 'https';
import { ScheduleModule } from '@nestjs/schedule';
import { AcceptLanguageResolver, I18nModule } from 'nestjs-i18n';
import { HelpersService } from './helpers/helpers.service';
import * as path from 'path';
import { FilesModule } from 'src/files/files.module';
import { TelegramService } from 'src/telegram/telegram.service';
import { APP_FILTER } from '@nestjs/core';
import { WebhookExceptionFilter } from 'src/libs/filters/webhooks-exception.filter';
import { TokenModule } from 'src/token/token.module';

@Module({
  imports: [
    HttpModule.register({
      httpAgent: new http.Agent({ keepAlive: true }),
      httpsAgent: new https.Agent({ keepAlive: true }),
    }),
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
    FilesModule,
    TokenModule,
  ],
  controllers: [WebhooksController],
  providers: [
    WebhooksService,
    HttpRepository,
    RedisRepository,
    HelpersService,
    TelegramService,
    {
      provide: APP_FILTER,
      useClass: WebhookExceptionFilter,
    },
  ],
})
export class WebhooksModule {}
