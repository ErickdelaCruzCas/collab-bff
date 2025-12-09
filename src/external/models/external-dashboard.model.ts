import { Field, ObjectType } from '@nestjs/graphql';
import { ExternalCoffee } from './external-coffee.model';
import { ExternalBeer } from './external-beer.model';
import { ExternalCharacter } from './external-character.model';

@ObjectType()
class ExternalError {
  @Field()
  service: string;

  @Field()
  message: string;
}

@ObjectType()
export class ExternalDashboard {
  @Field(() => [ExternalCoffee])
  coffees: ExternalCoffee[];

  @Field(() => [ExternalBeer])
  beers: ExternalBeer[];

  @Field(() => [ExternalCharacter])
  characters: ExternalCharacter[];
  
  @Field(() => [ExternalError])
  errors: ExternalError[];
}