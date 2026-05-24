/**
 * Perfis comportamentais hipotetizados pela Ford (enunciado de ML).
 * O Motor de ML classifica o cliente, no momento da compra, em um destes segmentos.
 */
export enum CustomerSegment {
  /** Retorna consistentemente à rede oficial, independente de preço. */
  FIEL = 'fiel',
  /** Faz no máximo a 1ª revisão e sai da rede atrás de alternativas mais baratas. */
  ABANDONO = 'abandono',
  /** Perde o timing da manutenção, tenta voltar depois e se frustra. */
  ESQUECIDO = 'esquecido',
  /** Mantém relacionamento, mas é muito sensível a preço/promoções. */
  ECONOMICO = 'economico',
}
