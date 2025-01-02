import { createClient, RedisClientOptions } from 'redis';
import { REDIS_CLIENT } from '../constants';

export const createRedisClientProvider = (options: RedisClientOptions) => ({
  provide: REDIS_CLIENT,
  useFactory: async () => {
    const client = createClient(options);
    await client.connect();
    return client;
  },
});
