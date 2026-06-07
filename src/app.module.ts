import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ModelsModule } from './models/models.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { BrandsModule } from './brands/brands.module';
import { AppCacheModule } from './shared/cache/cache.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mssql',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: parseInt(config.get<string>('DB_PORT', '1433'), 10),
        username: config.get<string>('DB_USERNAME', 'sa'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE', 'fleet_management'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        synchronize: false,
        migrationsRun: true,
        options: {
          encrypt: false,
          trustServerCertificate: true,
        },
      }),
    }),
    AppCacheModule,
    AuthModule,
    ModelsModule,
    VehiclesModule,
    BrandsModule,
  ],
})
export class AppModule {}
