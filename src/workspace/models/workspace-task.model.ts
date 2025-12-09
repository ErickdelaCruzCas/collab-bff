import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('WorkspaceTask')
export class WorkspaceTask {
  @Field(() => Int)
  id: number;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  status: string;

  @Field(() => Int)
  projectId: number;
}
