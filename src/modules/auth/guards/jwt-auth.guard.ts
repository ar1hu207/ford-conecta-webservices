import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Exige um JWT válido (Bearer) na requisição. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
