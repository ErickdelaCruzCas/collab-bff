import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ExternalCharacter {
  @Field(() => String, { nullable: true })
  id?: string | null;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  species?: string | null;
}