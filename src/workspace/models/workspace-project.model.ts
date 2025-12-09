import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('WorkspaceProject')
export class WorkspaceProject {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  // @Field({ nullable: true })
  // createdAt?: Date | null;

  // @Field({ nullable: true })
  // updatedAt?: Date | null;

}
