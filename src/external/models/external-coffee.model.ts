import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ExternalCoffee {
  @Field(() => String, { nullable: true })
  id?: string | null;

  @Field(() => String)
  title: string;
}