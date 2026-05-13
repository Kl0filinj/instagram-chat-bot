import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { IG_GRAPH_BASE_URL } from '../constants';
import { catchError, firstValueFrom, map, retry } from 'rxjs';
import {
  IgUserProfileIfoDto,
  QuickReplyItemDto,
  SendTemplateDto,
} from '../dto';
import { SendMessageType } from '../common';
import { Readable } from 'stream';
import { I18nService } from 'nestjs-i18n';
import { TokenService } from 'src/token/token.service';

const META_TOKEN_EXPIRED_CODE = 190;

@Injectable()
export class HttpRepository implements OnModuleInit {
  private readonly logger = new Logger(HttpRepository.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly tokenService: TokenService,
  ) {}

  onModuleInit() {
    this.httpService.axiosRef.interceptors.response.use(
      (response) => response,
      async (error) => {
        const metaErrorCode = error?.response?.data?.error?.code;
        const originalRequest = error?.config;

        if (
          metaErrorCode === META_TOKEN_EXPIRED_CODE &&
          originalRequest &&
          !originalRequest._isRetryAfterRefresh
        ) {
          this.logger.warn(
            'Received Meta error 190 (token expired) — refreshing token and retrying',
          );

          await this.tokenService.refreshToken();

          const newToken = await this.tokenService.getAccessToken();
          originalRequest._isRetryAfterRefresh = true;
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;

          return this.httpService.axiosRef(originalRequest);
        }

        return Promise.reject(error);
      },
    );
  }

  private async buildAuthHeaders() {
    const token = await this.tokenService.getAccessToken();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async sendQuickReply(
    igId: string,
    replyText: string,
    replyOptions: QuickReplyItemDto[],
  ) {
    const igAccountId = await this.tokenService.getIgAccountId();
    const url = `${IG_GRAPH_BASE_URL}${igAccountId}/messages`;

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
    const headers = await this.buildAuthHeaders();

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
    const igAccountId = await this.tokenService.getIgAccountId();
    const url = `${IG_GRAPH_BASE_URL}${igAccountId}/messages`;

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
    const headers = await this.buildAuthHeaders();

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

    const igAccountId = await this.tokenService.getIgAccountId();
    const url = `${IG_GRAPH_BASE_URL}${igAccountId}/messages`;

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
                buttons,
              },
            ],
          },
        },
      },
    };

    const headers = await this.buildAuthHeaders();

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
    return;
  }

  async getIgImageFile(url: string) {
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
    const igAccountId = await this.tokenService.getIgAccountId();
    const url = `${IG_GRAPH_BASE_URL}${igAccountId}/follows`;

    const token = await this.tokenService.getAccessToken();
    const headers = { Authorization: `Bearer ${token}` };

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
    const url = `https://graph.instagram.com/${igId}?fields=id,username,profile_pic`;

    const token = await this.tokenService.getAccessToken();
    const headers = { Authorization: `Bearer ${token}` };

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

    return {
      avatarUrl: response?.profile_pic ?? '',
      username: response?.username,
    };
  }

  async setIceBreakers(i18n: I18nService) {
    const iceBreakersData = {
      platform: 'instagram',
      ice_breakers: [
        {
          call_to_actions: [
            {
              question: i18n.t('common.ICE_BREAKERS.start', { lang: 'en' }),
              payload: 'registration:init',
            },
          ],
          locale: 'default',
        },
        {
          call_to_actions: [
            {
              question: i18n.t('common.ICE_BREAKERS.start', { lang: 'de' }),
              payload: 'registration:init',
            },
          ],
          locale: 'de_DE',
        },
      ],
    };

    const token = '';
    //* Use page token here, token above is expired

    const response = await firstValueFrom(
      this.httpService
        .post(
          `https://graph.facebook.com/v22.0/me/messenger_profile?access_token=${token}`,
          iceBreakersData,
        )
        .pipe(
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

    return response;
  }
}
