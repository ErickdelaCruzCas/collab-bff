import { Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { WorkspaceResolver } from './workspace.resolver';
import { UsersModule } from 'src/users/users.module';
import { ProjectsModule } from 'src/projects/projects.module';
import { TasksModule } from 'src/task/tasks.module';


@Module({
  imports: [PrismaModule, UsersModule, ProjectsModule, TasksModule],
  providers: [WorkspaceResolver],
})
export class WorkspaceModule {}
