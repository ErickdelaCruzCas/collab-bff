// src/external/external.module.ts
import { Module } from '@nestjs/common';
import { ExternalService } from './external.service';
import { ExternalResolver } from './external.resolver';

@Module({
  providers: [ExternalService, ExternalResolver],
  exports: [ExternalService],
})
export class ExternalModule {}