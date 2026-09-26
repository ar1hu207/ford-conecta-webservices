import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDealershipDto } from './dto/create-dealership.dto';
import { UpdateDealershipDto } from './dto/update-dealership.dto';
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

  async update(id: string, dto: UpdateDealershipDto): Promise<Dealership> {
    const dealership = await this.findOne(id);
    Object.assign(dealership, dto);
    return this.dealerships.save(dealership);
  }

  /** Veículos da concessionária removida ficam sem concessionária (FK ON DELETE SET NULL). */
  async remove(id: string): Promise<void> {
    const result = await this.dealerships.delete(id);
    if (!result.affected) {
      throw new NotFoundException('Concessionária não encontrada');
    }
  }
}
