import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiErrors, ApiProtected } from '../../common/decorators/api-errors.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { assertCustomerAccess } from '../auth/policies/customer-access.policy';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { Vehicle } from './entities/vehicle.entity';
import { VehiclesService } from './vehicles.service';

/** Sub-recurso: veículos de um cliente (/customers/:customerId/vehicles). */
@ApiTags('vehicles')
@ApiProtected()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers/:customerId/vehicles')
export class CustomerVehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @ApiOperation({
    summary: 'Lista os veículos de um cliente',
    description: 'admin e analyst veem qualquer cliente; customer só os próprios veículos.',
  })
  @ApiOkResponse({ type: Vehicle, isArray: true })
  @ApiErrors(400, 404)
  findByCustomer(
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Vehicle[]> {
    assertCustomerAccess(user, customerId);
    return this.vehiclesService.findByCustomer(customerId);
  }
}
