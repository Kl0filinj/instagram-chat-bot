import { DynamicModule, Global } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { createRedisClientProvider } from './redis.provider';

@Global()
@Module({})
export class RedisModule {
  static forRoot(url: string): DynamicModule {
    const RedisClientProvider = createRedisClientProvider({
      url,
    });
    return {
      module: RedisModule,
      providers: [RedisClientProvider],
      exports: [RedisClientProvider],
    };
  }
}
