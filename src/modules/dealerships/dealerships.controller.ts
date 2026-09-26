import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { DealershipsService } from './dealerships.service';
import { CreateDealershipDto } from './dto/create-dealership.dto';
import { UpdateDealershipDto } from './dto/update-dealership.dto';
import { Dealership } from './entities/dealership.entity';

@ApiTags('dealerships')
@ApiProtected()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dealerships')
export class DealershipsController {
  constructor(private readonly dealershipsService: DealershipsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @CreatedResource('Concessionária criada.', Dealership)
  @ApiOperation({ summary: 'Cria uma concessionária (admin)' })
  @ApiErrors(400)
  create(@Body() dto: CreateDealershipDto): Promise<Dealership> {
    return this.dealershipsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista concessionárias (qualquer papel)' })
  @ApiOkResponse({ type: Dealership, isArray: true })
  findAll(): Promise<Dealership[]> {
    return this.dealershipsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalha uma concessionária (qualquer papel)' })
  @ApiOkResponse({ type: Dealership })
  @ApiErrors(400, 404)
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Dealership> {
    return this.dealershipsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualiza parcialmente uma concessionária (admin)' })
  @ApiOkResponse({ type: Dealership })
  @ApiErrors(400, 404)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDealershipDto,
  ): Promise<Dealership> {
    return this.dealershipsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma concessionária (admin)' })
  @ApiNoContentResponse({ description: 'Concessionária removida.' })
  @ApiErrors(400, 404)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.dealershipsService.remove(id);
  }
}
