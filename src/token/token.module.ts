import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { TokenService } from './token.service';
import { TelegramService } from 'src/telegram/telegram.service';
import * as http from 'http';
import * as https from 'https';

@Module({
  imports: [
    HttpModule.register({
      httpAgent: new http.Agent({ keepAlive: true }),
      httpsAgent: new https.Agent({ keepAlive: true }),
    }),
    ScheduleModule.forRoot(),
  ],
  providers: [TokenService, TelegramService],
  exports: [TokenService],
})
export class TokenModule {}
