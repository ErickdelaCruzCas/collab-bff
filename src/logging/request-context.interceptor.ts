import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { RequestContextService } from './request-context.service';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestContextInterceptor.name);

  constructor(private readonly requestContext: RequestContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // HTTP o GraphQL
    const isGraphQL = context.getType<'graphql'>() === 'graphql';

    let req: any;
    let info: { type: string; name: string };

    if (isGraphQL) {
      const gqlCtx = GqlExecutionContext.create(context);
      const ctx = gqlCtx.getContext();
      req = ctx.req;
      const gqlInfo = gqlCtx.getInfo();
      info = {
        type: 'GraphQL',
        name: gqlInfo.fieldName, // p.ej. meWorkspace, externalDashboard
      };
    } else {
      const httpCtx = context.switchToHttp();
      req = httpCtx.getRequest();
      info = {
        type: 'HTTP',
        name: `${req.method} ${req.url}`,
      };
    }

    const existingId = req.headers['x-request-id'] as string | undefined;
    const requestId = existingId || uuidv4();
    const userId = req.user?.userId;

    // Para que otros servicios puedan loguear con contexto
    return this.requestContext.runWith(
      { requestId, userId },
      () => {
        this.logger.log(
          `➡️ [${info.type}] IN reqId=${requestId} name=${info.name} userId=${userId ?? 'anon'}`,
        );

        const start = Date.now();

        return next.handle().pipe(
          tap({
            next: () => {
              const duration = Date.now() - start;
              this.logger.log(
                `✅ [${info.type}] OUT reqId=${requestId} name=${info.name} duration=${duration}ms`,
              );
            },
            error: (err) => {
              const duration = Date.now() - start;
              this.logger.error(
                `❌ [${info.type}] ERROR reqId=${requestId} name=${info.name} duration=${duration}ms msg=${err?.message}`,
              );
            },
          }),
        );
      },
    );
  }
}
