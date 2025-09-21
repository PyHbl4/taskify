import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import appConfig, { AppConfig } from './config/app.config';
import ormConfig from './config/orm.config';
import tokensConfig from './config/tokens.config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, tokensConfig, ormConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (
        configService: ConfigService,
      ): Promise<TypeOrmModuleOptions> => {
        const app = configService.getOrThrow<AppConfig>('app');
        const baseOptions = configService.getOrThrow<DataSourceOptions>('orm');
        const isTest = app.nodeEnv === 'test';

        return {
          ...(baseOptions as TypeOrmModuleOptions),
          autoLoadEntities: true,
          synchronize: isTest,
          dropSchema: isTest,
        } satisfies TypeOrmModuleOptions;
      },
      dataSourceFactory: async (options) => {
        const { autoLoadEntities: _autoLoadEntities, ...dataSourceOptions } =
          options as TypeOrmModuleOptions;
        if (process.env.NODE_ENV === 'test') {
          const { DataType, newDb } = await import('pg-mem');
          const db = newDb({ autoCreateForeignKeyIndices: true });
          db.public.registerFunction({
            name: 'current_database',
            returns: DataType.text,
            implementation: () => 'test',
          });
          db.public.registerFunction({
            name: 'version',
            returns: DataType.text,
            implementation: () => 'pg-mem',
          });
          const dataSource = db.adapters.createTypeormDataSource(
            dataSourceOptions as DataSourceOptions,
          );
          await dataSource.initialize();
          return dataSource;
        }

        const dataSource = new DataSource(dataSourceOptions as DataSourceOptions);
        await dataSource.initialize();
        return dataSource;
      },
    }),
    AuthModule,
    UsersModule,
    ProjectsModule,
    TasksModule,
  ],
})
export class AppModule {}
