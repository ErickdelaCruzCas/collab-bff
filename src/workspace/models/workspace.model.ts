import { Field, HideField, ObjectType } from '@nestjs/graphql';
import { WorkspaceUser } from './workspace-user.model';
import { WorkspaceProject } from './workspace-project.model';
import { WorkspaceTask } from './workspace-task.model';

@ObjectType()
export class Workspace {

  @HideField()
  userId: number; // sólo para resolvers internos, no sale en el schema

  @Field(() => WorkspaceUser)
  me: WorkspaceUser | null;

  @Field(() => [WorkspaceProject])
  projects: WorkspaceProject[] | null;

  @Field(() => [WorkspaceTask])
  tasks: WorkspaceTask[] | null;
}
