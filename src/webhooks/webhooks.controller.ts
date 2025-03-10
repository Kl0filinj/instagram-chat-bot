import { Cron } from '@nestjs/schedule';
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

  @Get('health')
  test() {
    return this.webhooksService.test();
    // return 'hello !';
  }

  @Cron('0 0 */2 * *')
  handleCron() {
    return this.webhooksService.clearUsersActivity();
  }

  // @Post('ice-breakers')
  // setIceBreakers() {
  //   return this.webhooksService.setIceBreakers();
  // }

  @Get()
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ): string {
    const VERIFY_TOKEN = process.env.FB_WEBHOOK_SECRET;
    // console.log('hub.mode : ', mode);
    // console.log('hub.mode : ', token);
    // console.log('hub.mode : ', challenge);

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
    console.log('####-####-####-####-####-####-####-####');
    console.log('signature : ', signature);
    console.log('payload : ', payload);
    // if (!this.webhooksService.verifySignature(payload, signature)) {
    //   throw new ForbiddenException('Invalid signature');
    // }
    console.log('verifySignature PASSED !@@! : ');

    return this.webhooksService.handleIncomingWebhook(payload);
  }
}
