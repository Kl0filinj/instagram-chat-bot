import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { TelegramService } from 'src/telegram/telegram.service';

const TOKEN_REFRESH_URL = 'https://graph.instagram.com/refresh_access_token';
const TOKEN_ROW_ID = 'primary';
const TOKEN_REFRESH_THRESHOLD_DAYS = 10;

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  private cachedToken: string | null = null;
  private cachedIgAccountId: string | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly telegramService: TelegramService,
  ) {}

  async getAccessToken(): Promise<string> {
    if (this.cachedToken) {
      return this.cachedToken;
    }

    const record = await this.prisma.instagramToken.findUnique({
      where: { id: TOKEN_ROW_ID },
    });

    if (!record) {
      throw new Error('No Instagram token found in DB — check env seed');
    }

    this.cachedToken = record.accessToken;
    return record.accessToken;
  }

  async getIgAccountId(): Promise<string> {
    if (this.cachedIgAccountId) {
      return this.cachedIgAccountId;
    }

    const record = await this.prisma.instagramToken.findUnique({
      where: { id: TOKEN_ROW_ID },
    });

    if (!record) {
      throw new Error('No Instagram token record found in DB — check env seed');
    }

    this.cachedIgAccountId = record.igAccountId;
    return record.igAccountId;
  }

  private invalidateCache() {
    this.cachedToken = null;
    this.cachedIgAccountId = null;
  }

  async refreshToken(): Promise<void> {
    this.logger.log('Attempting Instagram token refresh...');

    const record = await this.prisma.instagramToken.findUnique({
      where: { id: TOKEN_ROW_ID },
    });

    if (!record) {
      this.logger.error('Cannot refresh: no token record in DB');
      await this.sendTelegramAlert(
        '❌ Instagram token refresh FAILED: no token record found in DB',
      );
      return;
    }
    console.log('@@ REFRESH: Existing token: ', record.accessToken);

    try {
      const response = await firstValueFrom(
        this.httpService.get(TOKEN_REFRESH_URL, {
          params: {
            grant_type: 'ig_refresh_token',
            access_token: record.accessToken,
          },
        }),
      );

      console.log('@@ REFRESH: Response: ', response.data);
      const { access_token, expires_in } = response.data;

      const refreshedAt = new Date();
      const expiresAt = new Date(refreshedAt.getTime() + expires_in * 1000);

      await this.prisma.instagramToken.update({
        where: { id: TOKEN_ROW_ID },
        data: {
          accessToken: access_token,
          expiresAt,
          refreshedAt,
        },
      });
      console.log('@@ REFRESH: Updated token: ', access_token);

      this.invalidateCache();

      this.logger.log(
        `Instagram token refreshed successfully. New expiry: ${expiresAt.toISOString()}`,
      );

      await this.sendTelegramAlert(
        `✅ Instagram token refreshed successfully.\nNew expiry: ${expiresAt.toUTCString()}`,
      );
    } catch (error) {
      const errMsg =
        error?.response?.data?.error?.message ||
        error?.message ||
        String(error);
      this.logger.error(`Instagram token refresh FAILED: ${errMsg}`);

      await this.sendTelegramAlert(
        `❌ Instagram token refresh FAILED.\nError: ${errMsg}\nNext attempt at next scheduled check.`,
      );
    }
  }

  private isTokenExpiringSoon(expiresAt: Date): boolean {
    const now = new Date();
    const thresholdMs = TOKEN_REFRESH_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;
    return expiresAt.getTime() - now.getTime() < thresholdMs;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkAndRefreshToken() {
    this.logger.log('Daily token expiry check running...');

    const record = await this.prisma.instagramToken.findUnique({
      where: { id: TOKEN_ROW_ID },
    });

    if (!record) {
      this.logger.warn('No token record found during daily check');
      await this.sendTelegramAlert(
        '⚠️ Daily token check: no Instagram token record found in DB',
      );
      return;
    }

    if (this.isTokenExpiringSoon(record.expiresAt)) {
      this.logger.log(
        `Token expires at ${record.expiresAt.toISOString()} — refreshing now`,
      );
      await this.refreshToken();
    } else {
      this.logger.log(
        `Token is healthy. Expires: ${record.expiresAt.toISOString()}`,
      );
    }
  }

  private async sendTelegramAlert(message: string) {
    const chatId = process.env.TG_CHAT_ID;
    if (!chatId) return;

    try {
      await this.telegramService.sendMessage(chatId, message, {
        message_thread_id: 2,
      });
    } catch (err) {
      this.logger.warn(`Failed to send Telegram alert: ${err?.message}`);
    }
  }
}
