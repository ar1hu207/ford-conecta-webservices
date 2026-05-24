import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from './enums/user-role.enum';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AuthenticatedUser } from './strategies/jwt.strategy';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Auto-cadastro de usuário (papel: customer)' })
  @ApiCreatedResponse({ description: 'Usuário criado com sucesso.' })
  @ApiConflictResponse({ description: 'E-mail já cadastrado.' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autentica e retorna um token JWT (Bearer)' })
  @ApiOkResponse({ description: 'Token emitido.' })
  @ApiUnauthorizedResponse({ description: 'Credenciais inválidas.' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Dados do usuário autenticado' })
  @ApiOkResponse({ description: 'Perfil do usuário.' })
  @ApiUnauthorizedResponse({ description: 'Token ausente ou inválido.' })
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.findById(user.userId);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Lista todos os usuários (somente ADMIN)' })
  @ApiOkResponse({ description: 'Lista de usuários.' })
  @ApiForbiddenResponse({ description: 'Sem permissão (requer papel admin).' })
  listUsers() {
    return this.authService.listUsers();
  }
}
