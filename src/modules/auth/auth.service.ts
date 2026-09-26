import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { buildJwtConfig } from '../../config/jwt.config';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginResponseDto, UserProfileDto } from './dto/user-profile.dto';
import { User } from './entities/user.entity';
import { UserRole } from './enums/user-role.enum';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Auto-cadastro: sempre cria um usuário com papel CUSTOMER e sem cliente
   * vinculado. O vínculo com o cadastro de cliente é feito por um admin
   * (PATCH /users/:id), porque o e-mail informado aqui não é verificado.
   */
  async register(dto: RegisterDto): Promise<UserProfileDto> {
    const exists = await this.users.findOne({ where: { email: dto.email } });
    if (exists) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);
    const user = this.users.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: UserRole.CUSTOMER,
    });
    const saved = await this.users.save(user);
    return UserProfileDto.from(saved);
  }

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.users.findOne({ where: { email: dto.email } });
    // Mensagem genérica: não revela se o e-mail existe (Cybersecurity).
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordOk = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      cid: user.customerId,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: buildJwtConfig().expiresIn,
      user: UserProfileDto.from(user),
    };
  }
}
