import { buildJwtConfig } from './jwt.config';

describe('buildJwtConfig', () => {
  const strongSecret = 'x'.repeat(32);

  it('recusa subir sem JWT_SECRET', () => {
    expect(() => buildJwtConfig({})).toThrow(/JWT_SECRET/);
  });

  it('recusa segredo com menos de 32 caracteres', () => {
    expect(() => buildJwtConfig({ JWT_SECRET: 'curto' })).toThrow(/32 caracteres/);
  });

  it('usa HS256, 3600s e issuer/audience padrão quando só o segredo é informado', () => {
    expect(buildJwtConfig({ JWT_SECRET: strongSecret })).toEqual({
      secret: strongSecret,
      expiresIn: 3600,
      issuer: 'ford-conecta-api',
      audience: 'ford-conecta-clients',
      algorithm: 'HS256',
    });
  });

  it('aceita a expiração no formato antigo "900s"', () => {
    expect(buildJwtConfig({ JWT_SECRET: strongSecret, JWT_EXPIRES_IN: '900s' }).expiresIn).toBe(900);
  });

  it.each(['0', '-10', 'abc'])('recusa JWT_EXPIRES_IN=%s', (value) => {
    expect(() => buildJwtConfig({ JWT_SECRET: strongSecret, JWT_EXPIRES_IN: value })).toThrow(
      /JWT_EXPIRES_IN/,
    );
  });
});
