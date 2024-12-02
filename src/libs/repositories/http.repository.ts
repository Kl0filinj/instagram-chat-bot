import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { IG_GRAPH_BASE_URL } from '../constants';
import { catchError, firstValueFrom, map } from 'rxjs';
import { QuickReplyItemDto } from '../dto';

@Injectable()
export class HttpRepository {
  constructor(private readonly httpService: HttpService) {}

  async sendQuickReply(
    igId: string,
    replyText: string,
    replyOptions: QuickReplyItemDto[],
  ) {
    const url = `${IG_GRAPH_BASE_URL}${process.env.trial_IG_ACCOUNT_ID}/messages`;

    const replyOptionsWithType: QuickReplyItemDto[] = replyOptions.map(
      (item) => ({ ...item, content_type: 'text' }),
    );
    const data = {
      recipient: { id: igId },
      messaging_type: 'RESPONSE',
      message: {
        text: replyText,
        quick_replies: replyOptionsWithType,
      },
    };
    const headers = {
      Authorization: `Bearer ${process.env.trial_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    };

    console.log('url : ', url);
    console.log('body : ', data);
    try {
      const response = await firstValueFrom(
        this.httpService.post(url, data, { headers }),
      );
      console.log('Quick reply sent successfully:', response.data);
    } catch (error) {
      console.error(
        'Error sending Quick reply:',
        error.response?.data || error.message,
      );
    }
  }

  async sendMessage(igId: string, text: string) {
    const url = `${IG_GRAPH_BASE_URL}${process.env.trial_IG_ACCOUNT_ID}/messages`;

    const data = {
      recipient: { id: igId },
      message: {
        text,
      },
    };
    const headers = {
      Authorization: `Bearer ${process.env.trial_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    };

    console.log('url : ', url);
    console.log('body : ', data);
    try {
      const response = await firstValueFrom(
        this.httpService.post(url, data, { headers }),
      );
      console.log('Text message sent successfully:', response.data);
    } catch (error) {
      console.error(
        'Error sending Text message:',
        error.response?.data || error.message,
      );
    }
  }

  async getFollowers() {
    const url = `${IG_GRAPH_BASE_URL}${process.env.trial_IG_ACCOUNT_ID}/follows`;

    const headers = {
      Authorization: `Bearer ${process.env.trial_ACCESS_TOKEN}`,
    };
    console.log('url : ', url);
    const response = await firstValueFrom(
      this.httpService.get(url, { headers }).pipe(
        map((resp) => {
          console.log('RESP DATA : ', resp.data);
          return resp.data;
        }),
        catchError((error) => {
          console.error(
            'Error geting followers:',
            error.response?.data || error.message,
          );
          throw new Error();
        }),
      ),
    );
    console.log('Quick reply sent successfully:', response.data);
    return response;
  }
}
