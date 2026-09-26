import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiErrors, ApiProtected } from '../../common/decorators/api-errors.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PredictionResponseDto } from './dto/prediction-response.dto';
import { PredictionService } from './prediction.service';

/** Sub-recurso: histórico de predições de um cliente (/customers/:customerId/predictions). */
@ApiTags('predictions')
@ApiProtected()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.ANALYST)
@Controller('customers/:customerId/predictions')
export class CustomerPredictionsController {
  constructor(private readonly predictionService: PredictionService) {}

  @Get()
  @ApiOperation({ summary: 'Histórico de predições de um cliente (admin, analyst)' })
  @ApiOkResponse({ type: PredictionResponseDto, isArray: true })
  @ApiErrors(400, 404)
  findByCustomer(
    @Param('customerId', ParseUUIDPipe) customerId: string,
  ): Promise<PredictionResponseDto[]> {
    return this.predictionService.findByCustomer(customerId);
  }
}
