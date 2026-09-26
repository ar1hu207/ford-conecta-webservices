import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PaginatedResult,
  PaginationQueryDto,
} from '../../common/dto/pagination-query.dto';
import { CustomersService } from '../customers/customers.service';
import { PredictDto } from './dto/predict.dto';
import { PredictionResponseDto } from './dto/prediction-response.dto';
import { Prediction } from './entities/prediction.entity';
import { CustomerSegment } from './enums/customer-segment.enum';
import {
  PREDICTION_STRATEGY,
  PredictionStrategy,
} from './strategies/prediction-strategy.interface';

/** Estratégia de retenção sugerida por perfil (coerente com o comportamento observado). */
const RETENTION_ACTIONS: Record<CustomerSegment, string> = {
  [CustomerSegment.FIEL]:
    'Manter relacionamento premium: revisões agendadas automaticamente e programa de fidelidade.',
  [CustomerSegment.ABANDONO]:
    'Oferta agressiva na 1ª revisão (preço-âncora) + contato proativo antes do vencimento da garantia.',
  [CustomerSegment.ESQUECIDO]:
    'Lembretes multicanal (push/SMS) com agendamento em 1 clique antes do vencimento de cada revisão.',
  [CustomerSegment.ECONOMICO]:
    'Pacotes de manutenção com preço fechado e promoções sazonais comunicadas no App.',
};

@Injectable()
export class PredictionService {
  constructor(
    @InjectRepository(Prediction)
    private readonly predictions: Repository<Prediction>,
    private readonly customersService: CustomersService,
    @Inject(PREDICTION_STRATEGY)
    private readonly strategy: PredictionStrategy,
  ) {}

  async predict(dto: PredictDto): Promise<PredictionResponseDto> {
    // Garante que o cliente existe (404 caso contrário).
    await this.customersService.findOne(dto.customerId);

    const features = {
      age: dto.age,
      monthlyIncome: dto.monthlyIncome,
      vehiclePrice: dto.vehiclePrice,
      paymentMethod: dto.paymentMethod,
      region: dto.region,
      purchaseChannel: dto.purchaseChannel,
      hasTradeIn: dto.hasTradeIn,
      warrantyMonths: dto.warrantyMonths,
    };

    const output = this.strategy.predict(features);

    const prediction = this.predictions.create({
      customerId: dto.customerId,
      vehicleId: dto.vehicleId,
      segment: output.segment,
      evasionRisk: output.evasionRisk,
      confidence: output.confidence,
      features,
      modelVersion: output.modelVersion,
    });
    const saved = await this.predictions.save(prediction);

    return this.toResponse(saved);
  }

  /** Lista de risco para o Cockpit: ordenada por maior risco de evasão. */
  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<PredictionResponseDto>> {
    const { page, limit } = query;
    const [data, total] = await this.predictions.findAndCount({
      relations: { customer: true },
      order: { evasionRisk: 'DESC', createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      data: data.map((p) => this.toResponse(p)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<PredictionResponseDto> {
    const prediction = await this.predictions.findOne({ where: { id } });
    if (!prediction) {
      throw new NotFoundException('Predição não encontrada');
    }
    return this.toResponse(prediction);
  }

  async findByCustomer(customerId: string): Promise<PredictionResponseDto[]> {
    await this.customersService.findOne(customerId); // 404 se o cliente não existir
    const list = await this.predictions.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
    });
    return list.map((p) => this.toResponse(p));
  }

  private toResponse(p: Prediction): PredictionResponseDto {
    return {
      id: p.id,
      customerId: p.customerId,
      vehicleId: p.vehicleId ?? null,
      segment: p.segment,
      evasionRisk: p.evasionRisk,
      confidence: p.confidence,
      recommendedAction: RETENTION_ACTIONS[p.segment],
      modelVersion: p.modelVersion,
      features: p.features,
      createdAt: p.createdAt,
    };
  }
}
