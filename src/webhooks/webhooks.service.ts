import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { FB_GRAPH_BASE_URL } from '@libs';

@Injectable()
export class WebhooksService {
  constructor(private readonly httpService: HttpService) {}

  async handleMessage(messaging: any) {
    const senderId = messaging.sender.id;
    const message = messaging.message.text;

    //TODO: Add logic
    // const reply = await this.generateReply(message);

    await this.sendQuickReply(senderId, 'Text message 1');
  }

  async sendQuickReply(recipientId: string, text: string) {
    const quickResponseTemplate = {
      text,
      quick_replies: [
        {
          content_type: 'text',
          title: 'Option 1',
          payload: 'OPTION_1',
        },
        {
          content_type: 'text',
          title: 'Option 2',
          payload: 'OPTION_2',
        },
      ],
    };

    const url = `${FB_GRAPH_BASE_URL}${process.env.IG_ACCOUNT_ID}/messages`;
    const params = {
      recipient: { id: recipientId },
      message: quickResponseTemplate,
      messaging_type: 'RESPONSE',
      access_token: process.env.ACCESS_TOKEN,
    };

    try {
      const response = await firstValueFrom(this.httpService.post(url, params));
      console.log('Quick reply sent successfully:', response.data);
    } catch (error) {
      console.error(
        'Error sending quick reply:',
        error.response?.data || error.message,
      );
    }
  }

  verifySignature(payload: string, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.FB_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(`sha256=${expectedSignature}`),
      Buffer.from(signature),
    );
  }

  // async subscribeToWebhooks() {
  //   const url = `https://graph.instagram.com/v21.0/<IG_USER_ID>/subscribed_apps?subscribed_fields=messages,messaging_postbacks&access_token=<ACCESS_TOKEN>`;

  //   try {
  //     const response = await firstValueFrom(
  //       this.httpService.post(url, {
  //         params: {
  //           subscribed_fields: 'messages,messaging_postbacks',
  //           access_token: accessToken,
  //         },
  //       }),
  //     );
  //     console.log('Quick reply sent successfully:', response);
  //   } catch (error) {
  //     //   console.log('Error: ', error.request);
  //     console.error(
  //       'Error sending quick reply:',
  //       error.response?.data || error.message,
  //     );
  //   }
  // }
}
