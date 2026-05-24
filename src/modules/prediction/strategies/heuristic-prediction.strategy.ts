import { Injectable } from '@nestjs/common';
import { CustomerSegment } from '../enums/customer-segment.enum';
import { PaymentMethod, PurchaseChannel } from '../enums/purchase.enums';
import {
  PredictionFeatures,
  PredictionOutput,
  PredictionStrategy,
} from './prediction-strategy.interface';

/**
 * Estratégia HEURÍSTICA (placeholder explicável) que mira os 4 perfis hipotetizados
 * pela Ford. Serve como stub do Motor de ML real: a interface PredictionStrategy
 * permite trocar esta implementação por uma que carregue o modelo treinado
 * (notebook de ML) sem mudar controller/service.
 *
 * Usa SOMENTE features do momento da compra (sem data leakage).
 */
@Injectable()
export class HeuristicPredictionStrategy implements PredictionStrategy {
  private readonly version = 'heuristic-v1';

  predict(f: PredictionFeatures): PredictionOutput {
    const annualIncome = Math.max(f.monthlyIncome * 12, 1);
    const priceToIncome = f.vehiclePrice / annualIncome;

    const cash = f.paymentMethod === PaymentMethod.CASH;
    const financed = f.paymentMethod === PaymentMethod.FINANCING;
    const leasing = f.paymentMethod === PaymentMethod.LEASING;
    const longWarranty = f.warrantyMonths >= 36;
    const minWarranty = f.warrantyMonths <= 12;
    const online = f.purchaseChannel === PurchaseChannel.ONLINE;
    const dealership = f.purchaseChannel === PurchaseChannel.DEALERSHIP;
    const young = f.age < 30;
    const mature = f.age >= 45;
    const stretched = priceToIncome > 1.0; // paga > 1 ano de renda no veículo
    const comfortable = priceToIncome < 0.4;

    const scores: Record<CustomerSegment, number> = {
      [CustomerSegment.FIEL]: 1,
      [CustomerSegment.ABANDONO]: 1,
      [CustomerSegment.ESQUECIDO]: 1,
      [CustomerSegment.ECONOMICO]: 1,
    };

    // Cliente fiel: paga à vista, garantia longa, maduro, folga financeira.
    if (cash) scores[CustomerSegment.FIEL] += 1.5;
    if (longWarranty) scores[CustomerSegment.FIEL] += 1.2;
    if (mature) scores[CustomerSegment.FIEL] += 0.8;
    if (comfortable) scores[CustomerSegment.FIEL] += 1.0;
    if (f.hasTradeIn) scores[CustomerSegment.FIEL] += 0.5;
    if (dealership) scores[CustomerSegment.FIEL] += 0.4;

    // Cliente de abandono: financiado, esticado, garantia mínima, canal online.
    if (financed) scores[CustomerSegment.ABANDONO] += 1.0;
    if (stretched) scores[CustomerSegment.ABANDONO] += 1.5;
    if (minWarranty) scores[CustomerSegment.ABANDONO] += 1.3;
    if (online) scores[CustomerSegment.ABANDONO] += 0.8;
    if (!f.hasTradeIn) scores[CustomerSegment.ABANDONO] += 0.4;

    // Cliente esquecido: jovem, online, garantia mínima, leasing (perde o timing).
    if (young) scores[CustomerSegment.ESQUECIDO] += 1.2;
    if (online) scores[CustomerSegment.ESQUECIDO] += 0.8;
    if (minWarranty) scores[CustomerSegment.ESQUECIDO] += 0.7;
    if (leasing) scores[CustomerSegment.ESQUECIDO] += 0.6;

    // Cliente econômico: financiado, troca, garantia média, sensível a preço.
    if (financed) scores[CustomerSegment.ECONOMICO] += 0.8;
    if (f.hasTradeIn) scores[CustomerSegment.ECONOMICO] += 0.7;
    if (!longWarranty && !minWarranty) scores[CustomerSegment.ECONOMICO] += 0.8;
    if (!stretched && !comfortable) scores[CustomerSegment.ECONOMICO] += 0.6;

    const ranked = (Object.entries(scores) as [CustomerSegment, number][]).sort(
      (a, b) => b[1] - a[1],
    );
    const segment = ranked[0][0];

    // Confiança via softmax sobre os scores.
    const exps = ranked.map(([, s]) => Math.exp(s));
    const sumExp = exps.reduce((acc, v) => acc + v, 0);
    const confidence = exps[0] / sumExp;

    // Risco de evasão: baseline por perfil + ajustes finos.
    const baseRisk: Record<CustomerSegment, number> = {
      [CustomerSegment.FIEL]: 0.1,
      [CustomerSegment.ECONOMICO]: 0.45,
      [CustomerSegment.ESQUECIDO]: 0.6,
      [CustomerSegment.ABANDONO]: 0.85,
    };
    let risk = baseRisk[segment];
    if (stretched) risk += 0.05;
    if (minWarranty) risk += 0.05;
    if (cash) risk -= 0.05;
    if (longWarranty) risk -= 0.05;
    risk = Math.min(1, Math.max(0, risk));

    return {
      segment,
      evasionRisk: this.round3(risk),
      confidence: this.round3(confidence),
      modelVersion: this.version,
    };
  }

  private round3(value: number): number {
    return Math.round(value * 1000) / 1000;
  }
}
