import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildJwtConfig } from '../../config/jwt.config';
import { CustomersModule } from '../customers/customers.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { RolesGuard } from './guards/roles.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    CustomersModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => {
        const config = buildJwtConfig();
        return {
          secret: config.secret,
          signOptions: {
            algorithm: config.algorithm,
            expiresIn: config.expiresIn,
            issuer: config.issuer,
            audience: config.audience,
          },
        };
      },
    }),
  ],
  controllers: [AuthController, UsersController],
  providers: [AuthService, UsersService, JwtStrategy, RolesGuard],
  exports: [AuthService, UsersService],
})
export class AuthModule {}
