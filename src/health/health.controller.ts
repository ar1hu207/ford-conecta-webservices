import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { Response } from 'express';
import { DataSource } from 'typeorm';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Status da API e do banco (público)' })
  @ApiOkResponse({ description: 'API e banco no ar.' })
  @ApiServiceUnavailableResponse({ description: 'Banco de dados indisponível.' })
  async check(@Res({ passthrough: true }) res: Response) {
    let database = 'up';
    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      database = 'down';
      // Orquestradores e load balancers leem o status HTTP, não o corpo.
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }

    return {
      status: database === 'up' ? 'ok' : 'degraded',
      service: 'ford-conecta-webservices',
      database,
      timestamp: new Date().toISOString(),
    };
  }
}
