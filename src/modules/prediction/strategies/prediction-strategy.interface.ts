import { CustomerSegment } from '../enums/customer-segment.enum';
import { PaymentMethod, PurchaseChannel } from '../enums/purchase.enums';

/** Token de injeção da estratégia de predição. */
export const PREDICTION_STRATEGY = 'PREDICTION_STRATEGY';

/** Features de entrada — exclusivamente do momento da compra. */
export interface PredictionFeatures {
  age: number;
  monthlyIncome: number;
  vehiclePrice: number;
  paymentMethod: PaymentMethod;
  region: string;
  purchaseChannel: PurchaseChannel;
  hasTradeIn: boolean;
  warrantyMonths: number;
}

/** Saída padronizada de qualquer estratégia de predição. */
export interface PredictionOutput {
  segment: CustomerSegment;
  evasionRisk: number;
  confidence: number;
  modelVersion: string;
}

/**
 * Contrato da estratégia de predição (padrão Strategy / SOA).
 * Hoje implementado por uma heurística transparente; pode ser trocado por uma
 * estratégia que carrega o modelo de ML treinado ou chama um serviço Python,
 * sem alterar o restante da aplicação.
 */
export interface PredictionStrategy {
  predict(features: PredictionFeatures): PredictionOutput;
}
