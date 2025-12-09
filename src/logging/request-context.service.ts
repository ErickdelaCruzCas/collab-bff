import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContextData {
  requestId: string;
  userId?: number;
}

@Injectable()
export class RequestContextService {
  private readonly als = new AsyncLocalStorage<RequestContextData>();

  runWith<T>(data: RequestContextData, fn: () => T): T {
    return this.als.run(data, fn);
  }

  getRequestId(): string | undefined {
    return this.als.getStore()?.requestId;
  }

  getUserId(): number | undefined {
    return this.als.getStore()?.userId;
  }
}
