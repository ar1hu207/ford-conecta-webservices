import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from './entities/user.entity';
import { UserRole } from './enums/user-role.enum';
import { JwtPayload } from './strategies/jwt.strategy';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  /** Auto-cadastro: sempre cria um usuário com papel CUSTOMER (dono do veículo). */
  async register(dto: RegisterDto): Promise<UserProfile> {
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
    return this.toProfile(saved);
  }

  async login(dto: LoginDto) {
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
      email: user.email,
      role: user.role,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: process.env.JWT_EXPIRES_IN ?? '3600s',
      user: this.toProfile(user),
    };
  }

  async findById(id: string): Promise<UserProfile> {
    const user = await this.users.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return this.toProfile(user);
  }

  async listUsers(): Promise<UserProfile[]> {
    const users = await this.users.find({ order: { createdAt: 'ASC' } });
    return users.map((u) => this.toProfile(u));
  }

  /** Remove o hash de senha antes de devolver o usuário. */
  private toProfile(user: User): UserProfile {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
