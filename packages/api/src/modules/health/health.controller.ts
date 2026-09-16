import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private health: HealthService) {}

  @Get()
  liveness() {
    return this.health.liveness();
  }

  @Get('ready')
  readiness() {
    return this.health.readiness();
  }
}
