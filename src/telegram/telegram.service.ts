import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const TelegramBot = require('node-telegram-bot-api');

@Injectable()
export class TelegramService {
  private readonly telegramBot = new TelegramBot(process.env.TG_ACCESS_TOKEN);

  constructor() {}

  async sendMessage(
    chatId: string,
    message: string,
    options?: any,
  ): Promise<void> {
    await this.telegramBot.sendMessage(chatId, message, options);
  }
}
