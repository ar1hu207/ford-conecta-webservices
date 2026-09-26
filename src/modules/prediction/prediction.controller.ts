import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiErrors, ApiProtected } from '../../common/decorators/api-errors.decorator';
import { CreatedResource } from '../../common/decorators/created-resource.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PredictDto } from './dto/predict.dto';
import { PredictionResponseDto } from './dto/prediction-response.dto';
import { PredictionService } from './prediction.service';

/**
 * Predições são dado interno da concessionária (risco de evasão do cliente):
 * somente admin e analyst. O papel customer não tem acesso.
 */
@ApiTags('predictions')
@ApiProtected()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.ANALYST)
@Controller('predictions')
export class PredictionController {
  constructor(private readonly predictionService: PredictionService) {}

  @Post()
  @CreatedResource('Predição gerada.', PredictionResponseDto)
  @ApiOperation({
    summary: 'Gera e persiste uma predição de perfil + risco de evasão',
    description:
      'Recebe apenas features do momento da compra (sem comportamento futuro) e ' +
      'retorna o perfil estimado, o risco de evasão e a ação de retenção recomendada.',
  })
  @ApiErrors(400, 404)
  predict(@Body() dto: PredictDto): Promise<PredictionResponseDto> {
    return this.predictionService.predict(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lista de risco (Cockpit): predições ordenadas por maior risco de evasão',
  })
  @ApiOkResponse({ description: 'Página de predições.' })
  @ApiErrors(400)
  findAll(@Query() query: PaginationQueryDto) {
    return this.predictionService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalha uma predição' })
  @ApiOkResponse({ type: PredictionResponseDto })
  @ApiErrors(400, 404)
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PredictionResponseDto> {
    return this.predictionService.findOne(id);
  }
}
