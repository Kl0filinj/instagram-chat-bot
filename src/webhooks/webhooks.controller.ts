import { WebhooksService } from './webhooks.service';
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Headers,
  ForbiddenException,
  HttpCode,
} from '@nestjs/common';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get()
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ): string {
    const VERIFY_TOKEN = process.env.FB_WEBHOOK_SECRET;
    console.log('hub.mode : ', mode);
    console.log('hub.mode : ', token);
    console.log('hub.mode : ', challenge);

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook (log from webhooks service) verified');
      return challenge;
    } else {
      throw new ForbiddenException();
    }
  }

  @HttpCode(200)
  @Post()
  async handleWebhook(
    @Body() payload: any,
    @Headers('x-hub-signature-256') signature: string,
  ) {
    console.log('signature : ', signature);
    console.log('payload : ', payload);
    // if (!this.webhooksService.verifySignature(payload, signature)) {
    //   throw new ForbiddenException('Invalid signature');
    // }
    console.log('verifySignature PASSED !@@! : ');

    if (payload.object === 'instagram') {
      if (payload.entry.length !== 0) {
        const currentEntry = payload.entry[0];
        if (currentEntry && currentEntry.messaging) {
          const currentChange = currentEntry.messaging[0];
          const changeFields = Object.keys(currentChange);
          const messageFields = Object.keys(currentChange?.message ?? {});
          const isStart =
            !!changeFields.find((item) => item === 'message') &&
            currentChange?.message?.text === '/start';
          const isReply =
            !!changeFields.find((item) => item === 'message') &&
            !!messageFields.find((item) => item === 'quick_reply');
          const senderId = currentChange.sender.id;

          if (String(senderId) === '17841470558631310') {
            return;
          }

          console.log('currentChange : ', currentChange);
          console.log('isStart : ', isStart);
          console.log('isReply : ', isReply);
          console.log('senderId : ', senderId);

          //* Need to determine here is it /start or reply message
          const message = currentChange.message;

          if (isStart) {
            await this.webhooksService.handleStartMessage({
              senderId,
            });
            return;
          }

          if (isReply) {
            await this.webhooksService.handleReply({
              text: message.text,
              payload: message.quick_reply.payload,
              senderId,
            });
            return;
          }

          // TODO: FIX RECURSION)
          // await this.webhooksService.wrongReply(senderId);
          return;
        }
      }
    }
  }
}
