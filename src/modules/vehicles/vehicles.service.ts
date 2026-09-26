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
import { CustomersService } from '../customers/customers.service';
import { DealershipsService } from '../dealerships/dealerships.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { Vehicle } from './entities/vehicle.entity';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicles: Repository<Vehicle>,
    // Reuso de serviços (SOA): validação de cliente e concessionária.
    private readonly customersService: CustomersService,
    private readonly dealershipsService: DealershipsService,
  ) {}

  async create(dto: CreateVehicleDto): Promise<Vehicle> {
    // Garante que o cliente existe (lança 404 caso contrário).
    await this.customersService.findOne(dto.customerId);
    if (dto.dealershipId) {
      await this.dealershipsService.findOne(dto.dealershipId);
    }

    const exists = await this.vehicles.findOne({ where: { vin: dto.vin } });
    if (exists) {
      throw new ConflictException('Já existe um veículo com este VIN');
    }

    const vehicle = this.vehicles.create(dto);
    return this.vehicles.save(vehicle);
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<Vehicle>> {
    const { page, limit } = query;
    const [data, total] = await this.vehicles.findAndCount({
      relations: { customer: true, dealership: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findByCustomer(customerId: string): Promise<Vehicle[]> {
    await this.customersService.findOne(customerId); // 404 se o cliente não existir
    return this.vehicles.find({
      where: { customerId },
      relations: { dealership: true },
      order: { purchaseDate: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Vehicle> {
    const vehicle = await this.vehicles.findOne({
      where: { id },
      relations: { customer: true, dealership: true },
    });
    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado');
    }
    return vehicle;
  }

  async update(id: string, dto: UpdateVehicleDto): Promise<Vehicle> {
    const vehicle = await this.findOne(id);

    if (dto.dealershipId) {
      await this.dealershipsService.findOne(dto.dealershipId);
    }

    if (dto.vin && dto.vin !== vehicle.vin) {
      const clash = await this.vehicles.findOne({ where: { vin: dto.vin } });
      if (clash) {
        throw new ConflictException('Já existe um veículo com este VIN');
      }
    }

    Object.assign(vehicle, dto);
    return this.vehicles.save(vehicle);
  }

  async remove(id: string): Promise<void> {
    const result = await this.vehicles.delete(id);
    if (!result.affected) {
      throw new NotFoundException('Veículo não encontrado');
    }
  }
}
