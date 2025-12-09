import { Field, ObjectType } from '@nestjs/graphql';
import { WorkspaceUser } from './workspace-user.model';
import { WorkspaceProject } from './workspace-project.model';
import { WorkspaceTask } from './workspace-task.model';

@ObjectType()
export class Workspace {
  @Field(() => WorkspaceUser)
  me: WorkspaceUser | null;

  @Field(() => [WorkspaceProject])
  projects: WorkspaceProject[] | null;

  @Field(() => [WorkspaceTask])
  tasks: WorkspaceTask[] | null;
}
