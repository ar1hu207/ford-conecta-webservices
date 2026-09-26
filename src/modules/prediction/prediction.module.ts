import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersModule } from '../customers/customers.module';
import { CustomerPredictionsController } from './customer-predictions.controller';
import { Prediction } from './entities/prediction.entity';
import { PredictionController } from './prediction.controller';
import { PredictionService } from './prediction.service';
import { HeuristicPredictionStrategy } from './strategies/heuristic-prediction.strategy';
import { PREDICTION_STRATEGY } from './strategies/prediction-strategy.interface';

@Module({
  imports: [TypeOrmModule.forFeature([Prediction]), CustomersModule],
  controllers: [PredictionController, CustomerPredictionsController],
  providers: [
    PredictionService,
    // Estratégia injetável: troque por uma que sirva o modelo de ML real
    // alterando apenas esta linha (Open/Closed + SOA).
    { provide: PREDICTION_STRATEGY, useClass: HeuristicPredictionStrategy },
  ],
})
export class PredictionModule {}
