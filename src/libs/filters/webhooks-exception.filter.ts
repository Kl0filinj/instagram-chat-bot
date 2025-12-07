import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Injectable,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { TelegramService } from 'src/telegram/telegram.service';

@Injectable()
@Catch()
export class WebhookExceptionFilter implements ExceptionFilter {
  private readonly exceptionsLogCodes = [404];
  constructor(private readonly telegramService: TelegramService) {}

  async catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const ip = this.getIp(request);

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (!this.exceptionsLogCodes.includes(status)) {
      const tgMessageBody = `⚠️⚠️⚠️
        Exception: ${status}
        Message: ${exception.message}
        ${exception.stack ? `!STACK: ${exception.stack}` : ''}
        ${exception.response ? `!RESPONSE: ${JSON.stringify(exception.response)}` : ''}
        Host: ${request.headers.host}
        Path: ${request.url}
        Time: ${new Date().toISOString()}
        IP: ${ip}
        `;

      await this.telegramService.sendMessage(
        process.env.TG_CHAT_ID,
        tgMessageBody,
        {
          message_thread_id: 2,
        },
      );
    }

    const errorResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : {
            statusCode: status,
            message: exception?.message || 'Internal server error',
            error: 'Internal Server Error',
          };

    response.status(status).json(errorResponse);
  }

  private getIp(request: Request) {
    const ip =
      request.headers['x-forwarded-for'] || request.socket?.remoteAddress;
    return ip?.slice(-7) || 'no ip';
  }
}
