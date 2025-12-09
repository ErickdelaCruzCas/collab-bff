// src/external/external.resolver.ts
import { UseGuards, Logger } from '@nestjs/common';
import { Resolver, Query } from '@nestjs/graphql';
import { ExternalDashboard } from './models/external-dashboard.model';
import { ExternalService } from './external.service';
import { GqlAuthGuard } from 'src/auth/gpl-auth.guard';

type PartialError = { service: string; message: string };

@Resolver(() => ExternalDashboard)
export class ExternalResolver {
  private readonly logger = new Logger(ExternalResolver.name);

  constructor(private readonly externalService: ExternalService) {}

  @UseGuards(GqlAuthGuard)
  @Query(() => ExternalDashboard, { name: 'externalDashboard' })
  async externalDashboard(): Promise<ExternalDashboard> {
    const started = Date.now();
    this.logger.log('➡️ [externalDashboard] aggregation START');

    const errors: PartialError[] = [];

    // Hacemos las promesas "fault-tolerant"
    const safe = <T>(label: string, p: Promise<T>): Promise<T | null> =>
      p.catch((err) => {
        const msg = err?.message ?? 'Unknown error';
        errors.push({ service: label, message: msg });
        this.logger.error(`❌ [${label}] failed but continuing – ${msg}`);
        return null; // devolvemos null para poder seguir
      });

    // No usamos Promise.all directamente, sino las versiones tolerantes
    const [coffees, beers, characters] = await Promise.all([
      safe('coffees', this.externalService.fetchCoffees()),
      safe('beers', this.externalService.fetchBeers()),
      safe('characters', this.externalService.fetchCharacters()),
    ]);

    const duration = Date.now() - started;

    this.logger.log(
      `✅ [externalDashboard] completed with partial tolerance in ${duration}ms ` +
        `(errors=${errors.length})`,
    );

    return {
      coffees: coffees ?? [],
      beers: beers ?? [],
      characters: characters ?? [],
      errors, // << añadimos los errores al modelo
    };
  }
}
