import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrors, ApiProtected } from '../../common/decorators/api-errors.decorator';
import { CreatedResource } from '../../common/decorators/created-resource.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { assertCustomerAccess } from '../auth/policies/customer-access.policy';
import { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from './entities/customer.entity';

@ApiTags('customers')
@ApiProtected()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ANALYST)
  @CreatedResource('Cliente criado.', Customer)
  @ApiOperation({ summary: 'Cria um cliente (admin, analyst)' })
  @ApiErrors(400, 409)
  create(@Body() dto: CreateCustomerDto): Promise<Customer> {
    return this.customersService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ANALYST)
  @ApiOperation({ summary: 'Lista clientes, paginado (admin, analyst)' })
  @ApiOkResponse({ description: 'Página de clientes.' })
  @ApiErrors(400)
  findAll(@Query() query: PaginationQueryDto) {
    return this.customersService.findAll(query);
  }

  // Declarada antes de ':id' para que "me" não seja lido como um id.
  @Get('me')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Cadastro de cliente do usuário autenticado (customer)' })
  @ApiOkResponse({ type: Customer })
  @ApiErrors(404)
  findMine(@CurrentUser() user: AuthenticatedUser): Promise<Customer> {
    if (!user.customerId) {
      throw new NotFoundException('Nenhum cliente vinculado a este usuário');
    }
    return this.customersService.findOne(user.customerId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Detalha um cliente com seus veículos',
    description: 'admin e analyst veem qualquer cliente; customer só o próprio.',
  })
  @ApiOkResponse({ type: Customer })
  @ApiErrors(400, 404)
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Customer> {
    assertCustomerAccess(user, id);
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.ANALYST)
  @ApiOperation({ summary: 'Atualiza parcialmente um cliente (admin, analyst)' })
  @ApiOkResponse({ type: Customer })
  @ApiErrors(400, 404, 409)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ): Promise<Customer> {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um cliente (admin)' })
  @ApiNoContentResponse({ description: 'Cliente removido.' })
  @ApiErrors(400, 404)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.customersService.remove(id);
  }
}
