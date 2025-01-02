import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { REDIS_CLIENT, RedisClient } from '../constants';

@Injectable()
export class RedisRepository {
  private localizationKey = 'lang:';

  constructor(
    @Inject(forwardRef(() => REDIS_CLIENT))
    private readonly redisClient: RedisClient,
  ) {}

  async setUserLocalizationLang(igId: string, language: string) {
    return this.redisClient.set(`${this.localizationKey}${igId}`, language);
  }

  async getUserLocalizationLang(igId: string) {
    return this.redisClient.get(`${this.localizationKey}${igId}`);
  }
}
