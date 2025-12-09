import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from 'prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './task/tasks.module';

import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { WorkspaceModule } from './workspace/workspace.module';

@Module({
  imports: [
    AuthModule, 
    PrismaModule, 
    UsersModule, 
    ProjectsModule, 
    TasksModule,

    // 👇 Configuración GraphQL
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      context: ({ req }) => ({ req }), // importante para JWT en GraphQL
    }),

    WorkspaceModule, // nuestro módulo de GraphQL para meWorkspace
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
