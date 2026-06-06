import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      isGlobal: true,
      useFactory: (config: ConfigService) => {
        const password = config.get<string>('REDIS_PASSWORD');
        return {
          store: redisStore,
          socket: {
            host: config.get<string>('REDIS_HOST', 'localhost'),
            port: parseInt(config.get<string>('REDIS_PORT', '6379'), 10),
          },
          ...(password && { password }),
          ttl: config.get<number>('CACHE_TTL_SECONDS', 60) * 1000,
        };
      },
    }),
  ],
  exports: [CacheModule],
})
export class AppCacheModule {}
