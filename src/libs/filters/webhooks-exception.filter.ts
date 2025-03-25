/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { TelegramService } from 'src/telegram/telegram.service';

@Injectable()
@Catch()
export class WebhookExceptionFilter implements ExceptionFilter {
  constructor(private readonly telegramService: TelegramService) {}

  async catch(exception: any) {
    await this.telegramService.sendMessage(
      process.env.TG_CHAT_ID,
      exception?.message,
      {
        message_thread_id: 2,
      },
    );
  }
}
