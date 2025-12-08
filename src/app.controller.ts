import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth(): any {
    return {
      status: 'ok',
      service: 'collab-bff',
      uptimeSeconds: process.uptime(),
      timestamp: new Date().toISOString(),
      version: this.appService.getVersion(),
    };
  }
}
