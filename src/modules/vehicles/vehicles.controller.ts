import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotAcceptableException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ApiErrors, ApiProtected } from '../../common/decorators/api-errors.decorator';
import { CreatedResource } from '../../common/decorators/created-resource.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { objectToXml } from '../../common/utils/xml.util';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { assertCustomerAccess } from '../auth/policies/customer-access.policy';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Vehicle } from './entities/vehicle.entity';
import { VehiclesService } from './vehicles.service';

/** Representações suportadas de um veículo (negociação de conteúdo via Accept). */
const VEHICLE_MEDIA_TYPES = ['application/json', 'application/xml'];

@ApiTags('vehicles')
@ApiProtected()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ANALYST)
  @CreatedResource('Veículo criado.', Vehicle)
  @ApiOperation({ summary: 'Cadastra um veículo (admin, analyst)' })
  @ApiErrors(400, 404, 409)
  create(@Body() dto: CreateVehicleDto): Promise<Vehicle> {
    return this.vehiclesService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ANALYST)
  @ApiOperation({ summary: 'Lista veículos, paginado (admin, analyst)' })
  @ApiOkResponse({ description: 'Página de veículos.' })
  @ApiErrors(400)
  findAll(@Query() query: PaginationQueryDto) {
    return this.vehiclesService.findAll(query);
  }

  @Get(':id')
  @ApiProduces(...VEHICLE_MEDIA_TYPES)
  @ApiOperation({
    summary: 'Detalha um veículo em JSON ou XML',
    description:
      'A representação é escolhida pelo header Accept (application/json é o padrão; ' +
      'application/xml devolve a ficha técnica em XML). customer só vê os próprios veículos.',
  })
  @ApiOkResponse({ type: Vehicle })
  @ApiErrors(400, 404, 406)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Vehicle | string> {
    res.vary('Accept');
    const mediaType = req.accepts(VEHICLE_MEDIA_TYPES);
    if (!mediaType) {
      throw new NotAcceptableException(
        `Formatos suportados: ${VEHICLE_MEDIA_TYPES.join(', ')}`,
      );
    }

    const vehicle = await this.vehiclesService.findOne(id);
    assertCustomerAccess(user, vehicle.customerId);

    if (mediaType === 'application/xml') {
      res.type('application/xml; charset=utf-8');
      return this.toXml(vehicle);
    }
    return vehicle;
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.ANALYST)
  @ApiOperation({ summary: 'Atualiza parcialmente um veículo (admin, analyst)' })
  @ApiOkResponse({ type: Vehicle })
  @ApiErrors(400, 404, 409)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehicleDto,
  ): Promise<Vehicle> {
    return this.vehiclesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um veículo (admin)' })
  @ApiNoContentResponse({ description: 'Veículo removido.' })
  @ApiErrors(400, 404)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.vehiclesService.remove(id);
  }

  private toXml(v: Vehicle): string {
    return objectToXml('vehicle', {
      id: v.id,
      vin: v.vin,
      model: v.model,
      modelYear: v.modelYear,
      purchaseDate: v.purchaseDate,
      odometer: v.odometer,
      customer: v.customer
        ? {
            id: v.customer.id,
            name: v.customer.name,
            city: v.customer.city,
            state: v.customer.state,
          }
        : null,
      dealership: v.dealership
        ? {
            id: v.dealership.id,
            name: v.dealership.name,
            city: v.dealership.city,
            region: v.dealership.region,
          }
        : null,
    });
  }
}
