import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { buildJwtConfig } from '../../../config/jwt.config';
import { User } from '../entities/user.entity';
import { UserRole } from '../enums/user-role.enum';

/**
 * Claims do access token. Carrega só o necessário para autorizar:
 * sub (id do usuário), role e cid (cliente vinculado, quando houver).
 * iat/exp/iss/aud são preenchidos pela biblioteca na emissão.
 */
export interface JwtPayload {
  sub: string;
  role: UserRole;
  cid?: string | null;
}

/** Contexto do usuário autenticado, anexado a request.user. */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
  customerId: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {
    const config = buildJwtConfig();
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.secret,
      algorithms: [config.algorithm],
      issuer: config.issuer,
      audience: config.audience,
    });
  }

  /**
   * Roda depois que assinatura, expiração, issuer e audience já foram validados.
   * O usuário é relido do banco: se foi removido o token deixa de valer, e uma
   * troca de papel vale na hora, sem esperar o token expirar.
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.users.findOne({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('Token inválido');
    }
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      customerId: user.customerId,
    };
  }
}
