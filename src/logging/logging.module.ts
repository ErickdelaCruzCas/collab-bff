// src/logging/logging.module.ts
import { Module } from '@nestjs/common';
import { RequestContextService } from './request-context.service';
import { RequestContextInterceptor } from './request-context.interceptor';

@Module({
  providers: [RequestContextService, RequestContextInterceptor],
  exports: [RequestContextService, RequestContextInterceptor],
})
export class LoggingModule {}
