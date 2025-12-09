// src/workspace/workspace.resolver.ts
import {
  Resolver,
  Query,
  Context,
  ResolveField,
  Parent,
  Int,
  Args,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Workspace } from './models/workspace.model';
import { WorkspaceUser } from './models/workspace-user.model';
import { WorkspaceProject } from './models/workspace-project.model';
import { WorkspaceTask } from './models/workspace-task.model';
import { UsersService } from '../users/users.service';
import { ProjectsService } from '../projects/projects.service';
import { TasksService } from 'src/task/tasks.service';
import { GqlAuthGuard } from 'src/auth/gpl-auth.guard';

@Resolver(() => Workspace)
export class WorkspaceResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly projectsService: ProjectsService,
    private readonly tasksService: TasksService,
  ) {}

  // 1) Query raíz: NO carga nada caro, sólo userId
  @UseGuards(GqlAuthGuard)
  @Query(() => Workspace, { name: 'meWorkspace' })
  meWorkspace(@Context() ctx: any): Workspace {
    const userId = ctx.req.user.userId;
    return { userId } as Workspace;
  }

  // 2) Campo me: sólo se ejecuta si el cliente lo pide
  @ResolveField(() => WorkspaceUser)
  async me(@Parent() workspace: Workspace): Promise<WorkspaceUser> {
    const user = await this.usersService.findByIdOrThrow(workspace.userId);
    return {
      id: user.id,
      email: user.email,
      name: user.name ?? undefined,
    };
  }

  // 3) Campo projects: sólo se ejecuta si se pide en la query
  @ResolveField(() => [WorkspaceProject])
  async projects(@Parent() workspace: Workspace): Promise<WorkspaceProject[]> {
    const projects = await this.projectsService.findAllByOwnerOrThrow(workspace.userId);

    return projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description ?? undefined,
    }));
  }

  // 4) Campo tasks: con args de paginación; sólo se ejecuta si se pide
  @ResolveField(() => [WorkspaceTask])
  async tasks(
    @Parent() workspace: Workspace,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
  ): Promise<WorkspaceTask[]> {
    const page = await this.tasksService.findAll(workspace.userId, {
      limit: limit ?? 50,
      offset: offset ?? 0,
    } as any);

    return page.items.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description ?? undefined,
      status: t.status,
      projectId: t.projectId,
    }));
  }
}
