import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiErrors, ApiProtected } from '../../common/decorators/api-errors.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Roles } from './decorators/roles.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { UserRole } from './enums/user-role.enum';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { UsersService } from './users.service';

/** Administração de usuários: somente o papel admin. */
@ApiTags('users')
@ApiProtected()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Lista usuários (admin)' })
  @ApiOkResponse({ description: 'Página de usuários.' })
  @ApiErrors(400)
  findAll(@Query() query: PaginationQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalha um usuário (admin)' })
  @ApiOkResponse({ type: UserProfileDto })
  @ApiErrors(400, 404)
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserProfileDto> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Altera papel e/ou cliente vinculado de um usuário (admin)',
    description:
      'É assim que a concessionária liga a conta do App ao cadastro do cliente. ' +
      'Só o papel customer pode ter cliente vinculado.',
  })
  @ApiOkResponse({ type: UserProfileDto })
  @ApiErrors(400, 404, 409)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserProfileDto> {
    return this.usersService.update(id, dto);
  }
}
