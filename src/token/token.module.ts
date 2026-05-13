import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { TokenService } from './token.service';
import { TelegramService } from 'src/telegram/telegram.service';

@Module({
  imports: [HttpModule, ScheduleModule.forRoot()],
  providers: [TokenService, TelegramService],
  exports: [TokenService],
})
export class TokenModule {}
