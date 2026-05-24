import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDealershipDto } from './dto/create-dealership.dto';
import { Dealership } from './entities/dealership.entity';

@Injectable()
export class DealershipsService {
  constructor(
    @InjectRepository(Dealership)
    private readonly dealerships: Repository<Dealership>,
  ) {}

  create(dto: CreateDealershipDto): Promise<Dealership> {
    return this.dealerships.save(this.dealerships.create(dto));
  }

  findAll(): Promise<Dealership[]> {
    return this.dealerships.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Dealership> {
    const dealership = await this.dealerships.findOne({ where: { id } });
    if (!dealership) {
      throw new NotFoundException('Concessionária não encontrada');
    }
    return dealership;
  }
}
