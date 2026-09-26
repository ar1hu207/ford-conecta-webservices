/** Algoritmo fixo: assinatura e verificação só aceitam HS256 (bloqueia "alg: none" e troca de algoritmo). */
export const JWT_ALGORITHM = 'HS256' as const;

/** Tamanho mínimo do segredo HMAC (256 bits ≈ 32 caracteres). */
const MIN_SECRET_LENGTH = 32;

export interface JwtConfig {
  secret: string;
  /** Validade do access token, em segundos. */
  expiresIn: number;
  issuer: string;
  audience: string;
  algorithm: typeof JWT_ALGORITHM;
}

/**
 * Fonte única da configuração do JWT, usada na emissão (JwtModule) e na
 * validação (JwtStrategy). Falha no boot se o segredo estiver ausente ou fraco:
 * não existe segredo padrão embutido no código.
 */
export function buildJwtConfig(env: NodeJS.ProcessEnv = process.env): JwtConfig {
  const secret = env.JWT_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET ausente ou com menos de ${MIN_SECRET_LENGTH} caracteres. Defina-o no .env.`,
    );
  }

  // Aceita "3600" ou "3600s" (formato antigo do .env).
  const expiresIn = parseInt(env.JWT_EXPIRES_IN ?? '3600', 10);
  if (!Number.isFinite(expiresIn) || expiresIn <= 0) {
    throw new Error('JWT_EXPIRES_IN deve ser um número de segundos maior que zero.');
  }

  return {
    secret,
    expiresIn,
    issuer: env.JWT_ISSUER ?? 'ford-conecta-api',
    audience: env.JWT_AUDIENCE ?? 'ford-conecta-clients',
    algorithm: JWT_ALGORITHM,
  };
}
