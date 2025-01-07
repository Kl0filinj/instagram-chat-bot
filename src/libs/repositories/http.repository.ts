import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { IG_GRAPH_BASE_URL } from '../constants';
import { catchError, firstValueFrom, map, retry } from 'rxjs';
import {
  IgUserProfileIfoDto,
  QuickReplyItemDto,
  SendTemplateDto,
} from '../dto';
import { SendMessageType } from '../common';
import { Readable } from 'stream';

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

  async sendMessage(igId: string, payload: string, type: SendMessageType) {
    const url = `${IG_GRAPH_BASE_URL}${process.env.trial_IG_ACCOUNT_ID}/messages`;

    const dataOptions: Record<SendMessageType, any> = {
      text: {
        recipient: { id: igId },
        message: {
          text: payload,
        },
      },
      image: {
        recipient: { id: igId },
        message: {
          attachment: {
            type: 'image',
            payload: {
              url: payload,
            },
          },
        },
      },
    };
    const currentData = dataOptions[type];

    const headers = {
      Authorization: `Bearer ${process.env.trial_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    };

    console.log('url : ', url);
    console.log('body : ', currentData);
    try {
      const response = await firstValueFrom(
        this.httpService.post(url, currentData, { headers }),
      );
      console.log('Text message sent successfully:', response.data);
    } catch (error) {
      console.error(
        'Error sending Text message:',
        error.response?.data || error.message,
      );
    }
  }

  async sendTemplate(igId: string, payload: SendTemplateDto) {
    const { title, subtitle, image_url, buttons } = payload;

    const url = `${IG_GRAPH_BASE_URL}${process.env.trial_IG_ACCOUNT_ID}/messages`;

    const data = {
      recipient: { id: igId },
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'generic',
            elements: [
              {
                title,
                image_url,
                subtitle,
                // default_action: {
                //   type: 'web_url',
                //   url: '<THE_WEBSITE_URL>',
                // },
                buttons,
              },
            ],
          },
        },
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
      console.log('Template sent successfully:', response.data);
    } catch (error) {
      console.error(
        'Error sending Template:',
        error.response?.data || error.message,
      );
    }
  }

  async getIgImageFile(url: string) {
    console.log('url : ', url);
    const response = await firstValueFrom(
      this.httpService.get(url, { responseType: 'arraybuffer' }).pipe(
        retry({
          count: 5,
          delay: 100,
          resetOnSuccess: true,
        }),
        catchError((error) => {
          console.error(
            'Error geting IG file:',
            error.response?.data || error.message,
          );
          throw new Error();
        }),
      ),
    );

    const buffer = Buffer.from(response.data);
    const urlObj = new URL(url);
    const originalname = urlObj.searchParams.get('asset_id');

    const multerFile: Express.Multer.File = {
      fieldname: 'file',
      originalname,
      encoding: '7bit',
      mimetype: response.headers['content-type'],
      buffer: buffer,
      size: buffer.length,
      destination: '',
      filename: '',
      path: '',
      stream: Readable.from(buffer),
    };

    return multerFile;
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
    console.log('Followers get successfully:', response.data);
    return response;
  }

  async getProfileInfo(igId: string): Promise<IgUserProfileIfoDto> {
    // const url =
    //   'https://www.instagram.com/api/v1/users/web_profile_info/?username=kl0filinj';
    // const url = 'https://i.instagram.com/api/v1/users/922129809859449/info/';
    const url = `https://graph.instagram.com/${igId}?fields=id,username,profile_pic`;

    const headers = {
      Authorization: `Bearer ${process.env.trial_ACCESS_TOKEN}`,
    };

    // const headers = {
    //   'user-agent':
    //     'Mozilla/5.0 (iPhone; CPU iPhone OS 12_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 105.0.0.11.118 (iPhone11,8; iOS 12_3_1; en_US; en-US; scale=2.00; 828x1792; 165586599)',
    // };
    console.log('url : ', url);

    const response = await firstValueFrom(
      this.httpService.get(url, { headers }).pipe(
        map((resp) => {
          console.log('RESP DATA : ', resp.data);
          return resp.data;
        }),
        catchError((error) => {
          console.error(
            'Error geting profile picture:',
            error.response?.data || error.message,
          );
          throw new Error();
        }),
      ),
    );

    // {
    //   id: string;
    //   username: string;
    //   profile_pic: string;
    // }

    return {
      avatarUrl: response?.profile_pic ?? '', // TODO: Find cool plug
      username: response?.username,
    };
  }
}
