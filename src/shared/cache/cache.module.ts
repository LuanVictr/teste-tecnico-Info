import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Keyv from 'keyv';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      isGlobal: true,
      useFactory: async (config: ConfigService) => {
        const host = config.get<string>('REDIS_HOST', 'localhost');
        const port = config.get<string>('REDIS_PORT', '6379');
        const password = config.get<string>('REDIS_PASSWORD');
        const ttl = Number(config.get<string>('CACHE_TTL_SECONDS', '60')) * 1000;

        const auth = password ? `:${password}@` : '';
        const redisUrl = `redis://${auth}${host}:${port}`;

        // Use the raw KeyvRedis adapter (default export) wrapped with the CJS Keyv
        // so @nestjs/cache-manager v3's instanceof check passes correctly
        const { default: KeyvRedis } = await import('@keyv/redis');
        const adapter = new (KeyvRedis as any)(redisUrl, { noNamespaceAffectsAll: true });
        const store = new Keyv({ store: adapter, ttl });

        return {
          stores: [store],
          ttl,
        };
      },
    }),
  ],
  exports: [CacheModule],
})
export class AppCacheModule {}
