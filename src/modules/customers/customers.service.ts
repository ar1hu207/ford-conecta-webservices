import {
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
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from './entities/customer.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customers: Repository<Customer>,
  ) {}

  async create(dto: CreateCustomerDto): Promise<Customer> {
    const exists = await this.customers.findOne({
      where: { document: dto.document },
    });
    if (exists) {
      throw new ConflictException('Já existe um cliente com este CPF');
    }
    const customer = this.customers.create(dto);
    return this.customers.save(customer);
  }

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<Customer>> {
    const { page, limit } = query;
    const [data, total] = await this.customers.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customers.findOne({
      where: { id },
      relations: { vehicles: true },
    });
    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);

    if (dto.document && dto.document !== customer.document) {
      const clash = await this.customers.findOne({
        where: { document: dto.document },
      });
      if (clash) {
        throw new ConflictException('Já existe um cliente com este CPF');
      }
    }

    Object.assign(customer, dto);
    return this.customers.save(customer);
  }

  async remove(id: string): Promise<void> {
    const result = await this.customers.delete(id);
    if (!result.affected) {
      throw new NotFoundException('Cliente não encontrado');
    }
  }
}
