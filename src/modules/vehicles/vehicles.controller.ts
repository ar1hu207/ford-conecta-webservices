import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { objectToXml } from '../../common/utils/xml.util';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehiclesService } from './vehicles.service';

@ApiTags('vehicles')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ANALYST)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cadastra um veículo' })
  @ApiCreatedResponse({ description: 'Veículo criado.' })
  @ApiConflictResponse({ description: 'VIN já cadastrado.' })
  @ApiNotFoundResponse({ description: 'Cliente ou concessionária inexistente.' })
  create(@Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista veículos (paginado)' })
  @ApiOkResponse({ description: 'Página de veículos.' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.vehiclesService.findAll(query);
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Lista os veículos de um cliente' })
  @ApiOkResponse({ description: 'Veículos do cliente.' })
  findByCustomer(@Param('customerId', ParseUUIDPipe) customerId: string) {
    return this.vehiclesService.findByCustomer(customerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalha um veículo' })
  @ApiOkResponse({ description: 'Veículo encontrado.' })
  @ApiNotFoundResponse({ description: 'Veículo não encontrado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Get(':id/xml')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  @ApiProduces('application/xml')
  @ApiOperation({
    summary: 'Ficha técnica do veículo em XML',
    description: 'Mesma entidade entregue em XML (padrão XML, além de JSON).',
  })
  @ApiOkResponse({ description: 'Ficha técnica em XML.' })
  @ApiNotFoundResponse({ description: 'Veículo não encontrado.' })
  async findOneXml(@Param('id', ParseUUIDPipe) id: string): Promise<string> {
    const v = await this.vehiclesService.findOne(id);
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

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.ANALYST)
  @ApiOperation({ summary: 'Atualiza um veículo' })
  @ApiOkResponse({ description: 'Veículo atualizado.' })
  @ApiNotFoundResponse({ description: 'Veículo não encontrado.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um veículo (somente ADMIN)' })
  @ApiNoContentResponse({ description: 'Veículo removido.' })
  @ApiNotFoundResponse({ description: 'Veículo não encontrado.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehiclesService.remove(id);
  }
}
