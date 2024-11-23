import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { IG_GRAPH_BASE_URL } from '@libs';

@Injectable()
export class WebhooksService {
  constructor(private readonly httpService: HttpService) {}

  async handleMessage(messaging: any) {
    //* MESSAGING
    //    {
    //     "field": "messages",
    //     "value": {
    //         "sender": {
    //             "id": "12334"
    //         },
    //         "recipient": {
    //             "id": "23245"
    //         },
    //         "timestamp": "1527459824",
    //         "message": {
    //             "mid": "random_mid",
    //             "text": "random_text"
    //         }
    //     }
    // }
    const senderId = messaging.value.sender.id;
    const message = messaging.value.message.text;

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

    const url = `${IG_GRAPH_BASE_URL}${process.env.trial_IG_ACCOUNT_ID}/messages`;
    const data = {
      recipient: { id: recipientId },
      message: 'TextTextText',
    };
    const headers = {
      Authorization: `Bearer IGQWRPT2JxaWNUeVBIXzh2cU85ZAGRvdC14TlF6X19ycnN0eEYwV1Jjclk2NzZAnaTRpRHE1dDljT0dBdGJHV0xEclZA2SjZALRzRqMXhKR3ZAVOGNlYnhNcS1XUjlvcFAydEsyVGxIWW90Um9STlZAoLWtfbzg0NXhabUkZD`,
      'Content-Type': 'application/json',
    };
    // const url = `${FB_GRAPH_BASE_URL}${1334833581016718}/messages?recipient=${JSON.stringify(
    //   {
    //     id: process.env.trial_IG_ACCOUNT_ID,
    //   },
    // )}&message=${'TestText'}&access_token=EAAWIAUbZAXgwBO00yU44sDQcLZAaUZBZBZCwh8Mzs0glGsHiSqSL4pG8VGkoryA8PPjgK68h52Nz9HR3HUnZCg6gWEZAxwu4r2AmSI5J7IVomwoLCuqfbwU3eSZAAwTP56j9tB20FTtyGHo0TMiYZAb3fCEkxv3XAH3FSZAhVjvTZCzutUCpaHe2miaOzEIBkFFkXcxPRJkNlIHi5iSkW26h7wZD`;

    console.log('url : ', url);
    console.log('body : ', data);
    try {
      const response = await firstValueFrom(
        this.httpService.post(url, data, { headers }),
      );
      console.log('Quick reply sent successfully:', response.data);
    } catch (error) {
      console.error(
        'Error sending quick reply:',
        error.response?.data || error.message,
      );
    }
  }

  verifySignature(payload: Record<any, any>, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.IG_APP_SECRET)
      .update(Buffer.from(JSON.stringify(payload)))
      .digest('hex');
    const pureSignature = signature.split('=')[1];

    console.log('pureSignature : ', pureSignature);
    console.log('expectedSignature : ', expectedSignature);

    return expectedSignature === pureSignature;
  }
}
