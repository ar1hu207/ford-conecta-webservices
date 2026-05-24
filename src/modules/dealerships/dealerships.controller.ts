import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
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
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { DealershipsService } from './dealerships.service';
import { CreateDealershipDto } from './dto/create-dealership.dto';

@ApiTags('dealerships')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dealerships')
export class DealershipsController {
  constructor(private readonly dealershipsService: DealershipsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cria uma concessionária (somente ADMIN)' })
  @ApiCreatedResponse({ description: 'Concessionária criada.' })
  create(@Body() dto: CreateDealershipDto) {
    return this.dealershipsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista concessionárias' })
  @ApiOkResponse({ description: 'Lista de concessionárias.' })
  findAll() {
    return this.dealershipsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalha uma concessionária' })
  @ApiOkResponse({ description: 'Concessionária encontrada.' })
  @ApiNotFoundResponse({ description: 'Concessionária não encontrada.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.dealershipsService.findOne(id);
  }
}
