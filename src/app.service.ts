import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  // Later we can read from env or package.json
  getVersion(): string {
    return '0.0.1';
  }
}
