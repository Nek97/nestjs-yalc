import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestEntity } from './test.entity';
import { TestResolver } from './test.resolver';
import { UserEntity } from './entities/user.entity';
import { PostEntity } from './entities/post.entity';
import { UserModule } from './modules/user/user.module';
import { GqlComplexityPlugin } from '@nestjs-yalc/graphql/plugins/gql-complexity.plugin';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      entities: [TestEntity, UserEntity, PostEntity],
      synchronize: true,
      logging: false,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'dummy-schema.gql',
      playground: false,
      buildSchemaOptions: {
        fieldMiddleware: [], // The field middlewares are specified on decorators
      },
    }),
    UserModule,
  ],
  providers: [
    TestResolver,
    GqlComplexityPlugin,
  ],
})
export class AppModule {}
