import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ExternalBeer {
  @Field(() => String, { nullable: true })
  id?: string | null;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  style?: string | null;
}