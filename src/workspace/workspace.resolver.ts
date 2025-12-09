// src/workspace/workspace.resolver.ts
import { UseGuards } from '@nestjs/common';
import { Args, Context, Int, Query, Resolver } from '@nestjs/graphql';
import { Workspace } from './models/workspace.model';
import { UsersService } from '../users/users.service';
import { ProjectsService } from '../projects/projects.service';
import { GqlAuthGuard } from 'src/auth/gpl-auth.guard';
import { TasksService } from 'src/task/tasks.service';

@Resolver(() => Workspace)
export class WorkspaceResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly projectsService: ProjectsService,
    private readonly tasksService: TasksService,
  ) {}

  @UseGuards(GqlAuthGuard)
  @Query(() => Workspace, { name: 'meWorkspace' })
  async meWorkspace(
    @Context() ctx: any,
    @Args('tasksLimit', { type: () => Int, nullable: true }) tasksLimit?: number,
  ): Promise<Workspace> {
    const userId = ctx.req.user.userId;

    const me = await this.usersService.findByIdOrThrow(userId);

    const projects = await this.projectsService.findAllByOwnerOrThrow(userId);

    const tasksPage = await this.tasksService.findAll(userId, {
      limit: tasksLimit ?? 50,
      offset: 0,
    } as any);

    return {
      me: {
        id: me.id,
        email: me.email,
        name: me.name ?? undefined,
      },
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description ?? undefined, // 👈 null → undefined
      })),
      tasks: tasksPage.items.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description ?? undefined,
        status: t.status,
        projectId: t.projectId,
      })),
    };
  }
}
