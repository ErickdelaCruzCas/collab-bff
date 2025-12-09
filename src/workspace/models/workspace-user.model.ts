import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('WorkspaceUser')
export class WorkspaceUser {
  @Field(() => Int)
  id: number;

  @Field()
  email: string;

  @Field({ nullable: true })
  name?: string;
}
