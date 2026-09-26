import { CustomerSegment } from '../enums/customer-segment.enum';
import { PaymentMethod, PurchaseChannel } from '../enums/purchase.enums';
import { HeuristicPredictionStrategy } from './heuristic-prediction.strategy';
import { PredictionFeatures } from './prediction-strategy.interface';

describe('HeuristicPredictionStrategy', () => {
  const strategy = new HeuristicPredictionStrategy();

  const features = (overrides: Partial<PredictionFeatures> = {}): PredictionFeatures => ({
    age: 35,
    monthlyIncome: 10000,
    vehiclePrice: 150000,
    paymentMethod: PaymentMethod.FINANCING,
    region: 'Sudeste',
    purchaseChannel: PurchaseChannel.DEALERSHIP,
    hasTradeIn: true,
    warrantyMonths: 24,
    ...overrides,
  });

  it('cliente à vista, maduro, com garantia longa e folga financeira → fiel, risco baixo', () => {
    const out = strategy.predict(
      features({
        paymentMethod: PaymentMethod.CASH,
        age: 55,
        monthlyIncome: 60000,
        warrantyMonths: 48,
      }),
    );
    expect(out.segment).toBe(CustomerSegment.FIEL);
    expect(out.evasionRisk).toBeLessThan(0.2);
  });

  it('financiado, caro para a renda, garantia mínima e online → abandono, risco alto', () => {
    const out = strategy.predict(
      features({
        monthlyIncome: 5000,
        vehiclePrice: 250000,
        warrantyMonths: 12,
        purchaseChannel: PurchaseChannel.ONLINE,
        hasTradeIn: false,
      }),
    );
    expect(out.segment).toBe(CustomerSegment.ABANDONO);
    expect(out.evasionRisk).toBeGreaterThanOrEqual(0.85);
  });

  it('jovem em leasing comprando online → esquecido', () => {
    const out = strategy.predict(
      features({
        age: 23,
        paymentMethod: PaymentMethod.LEASING,
        purchaseChannel: PurchaseChannel.ONLINE,
        hasTradeIn: false,
        warrantyMonths: 12,
        vehiclePrice: 100000,
      }),
    );
    expect(out.segment).toBe(CustomerSegment.ESQUECIDO);
  });

  it('risco e confiança ficam sempre em [0, 1] e a versão do modelo é informada', () => {
    const out = strategy.predict(features());
    expect(out.evasionRisk).toBeGreaterThanOrEqual(0);
    expect(out.evasionRisk).toBeLessThanOrEqual(1);
    expect(out.confidence).toBeGreaterThan(0);
    expect(out.confidence).toBeLessThanOrEqual(1);
    expect(out.modelVersion).toBe('heuristic-v1');
  });

  it('é determinística: a mesma entrada gera a mesma saída', () => {
    expect(strategy.predict(features())).toEqual(strategy.predict(features()));
  });
});
