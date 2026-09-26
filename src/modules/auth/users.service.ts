import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination-query.dto';
import { CustomersService } from '../customers/customers.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserProfileDto } from './dto/user-profile.dto';
import { User } from './entities/user.entity';
import { UserRole } from './enums/user-role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    // Reuso de serviço (SOA): valida que o cliente a vincular existe.
    private readonly customersService: CustomersService,
  ) {}

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<UserProfileDto>> {
    const { page, limit } = query;
    const [data, total] = await this.users.findAndCount({
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data: data.map((u) => UserProfileDto.from(u)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<UserProfileDto> {
    return UserProfileDto.from(await this.findEntity(id));
  }

  /**
   * Troca de papel e/ou vínculo com cliente. Regra: só o papel CUSTOMER pode
   * ter cliente vinculado, e cada cliente pertence a no máximo um usuário.
   */
  async update(id: string, dto: UpdateUserDto): Promise<UserProfileDto> {
    const user = await this.findEntity(id);

    const role = dto.role ?? user.role;
    let customerId =
      dto.customerId !== undefined ? dto.customerId : user.customerId;

    if (role !== UserRole.CUSTOMER) {
      if (dto.customerId) {
        throw new BadRequestException(
          'Somente usuários com papel customer podem ser vinculados a um cliente',
        );
      }
      // Promoção para admin/analyst desfaz o vínculo com cliente.
      customerId = null;
    }

    if (customerId && customerId !== user.customerId) {
      await this.customersService.findOne(customerId); // 404 se não existir
      const owner = await this.users.findOne({ where: { customerId } });
      if (owner && owner.id !== user.id) {
        throw new ConflictException('Este cliente já está vinculado a outro usuário');
      }
    }

    user.role = role;
    user.customerId = customerId;
    return UserProfileDto.from(await this.users.save(user));
  }

  private async findEntity(id: string): Promise<User> {
    const user = await this.users.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return user;
  }
}
