import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PredictDto } from './dto/predict.dto';
import { PredictionService } from './prediction.service';

@ApiTags('predictions')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.ANALYST)
@Controller('predictions')
export class PredictionController {
  constructor(private readonly predictionService: PredictionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Gera e persiste uma predição de perfil + risco de evasão',
    description:
      'Recebe apenas features do momento da compra (sem comportamento futuro) e ' +
      'retorna o perfil estimado, o risco de evasão e a ação de retenção recomendada.',
  })
  @ApiCreatedResponse({ description: 'Predição gerada.' })
  @ApiNotFoundResponse({ description: 'Cliente não encontrado.' })
  predict(@Body() dto: PredictDto) {
    return this.predictionService.predict(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista de risco (Cockpit): predições ordenadas por maior risco de evasão',
  })
  @ApiOkResponse({ description: 'Página de predições.' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.predictionService.findAll(query);
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Histórico de predições de um cliente' })
  @ApiOkResponse({ description: 'Predições do cliente.' })
  findByCustomer(@Param('customerId', ParseUUIDPipe) customerId: string) {
    return this.predictionService.findByCustomer(customerId);
  }
}
