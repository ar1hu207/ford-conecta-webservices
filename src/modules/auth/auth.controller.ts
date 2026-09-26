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
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ApiErrors, ApiProtected } from '../../common/decorators/api-errors.decorator';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginResponseDto, UserProfileDto } from './dto/user-profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthenticatedUser } from './strategies/jwt.strategy';
import { UsersService } from './users.service';

/**
 * Limite mais apertado para as rotas públicas de credencial (força bruta e
 * cadastro em massa). Lido a cada requisição para poder ser ajustado por env.
 */
const CREDENTIALS_THROTTLE = {
  default: {
    limit: () => parseInt(process.env.LOGIN_THROTTLE_LIMIT ?? '5', 10),
    ttl: () => parseInt(process.env.LOGIN_THROTTLE_TTL ?? '60000', 10),
  },
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle(CREDENTIALS_THROTTLE)
  @ApiOperation({ summary: 'Auto-cadastro de usuário (público; papel customer)' })
  @ApiCreatedResponse({ description: 'Usuário criado.', type: UserProfileDto })
  @ApiErrors(400, 409, 429)
  register(@Body() dto: RegisterDto): Promise<UserProfileDto> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle(CREDENTIALS_THROTTLE)
  @ApiOperation({ summary: 'Autentica e emite um access token JWT (público)' })
  @ApiOkResponse({ description: 'Token emitido.', type: LoginResponseDto })
  @ApiErrors(400, 401, 429)
  login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiProtected()
  @ApiOperation({ summary: 'Perfil do usuário autenticado (qualquer papel)' })
  @ApiOkResponse({ description: 'Perfil do usuário.', type: UserProfileDto })
  me(@CurrentUser() user: AuthenticatedUser): Promise<UserProfileDto> {
    return this.usersService.findOne(user.userId);
  }
}
