import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';
import { User } from '../../src/modules/auth/entities/user.entity';
import { UserRole } from '../../src/modules/auth/enums/user-role.enum';
import { Customer } from '../../src/modules/customers/entities/customer.entity';
import { Dealership } from '../../src/modules/dealerships/entities/dealership.entity';
import { Vehicle } from '../../src/modules/vehicles/entities/vehicle.entity';

/** Senha de todos os usuários de fixture. */
export const PASSWORD = 'Senha@12345';

export interface Fixtures {
  users: { admin: User; analyst: User; customer: User; orphan: User };
  customers: { own: Customer; other: Customer };
  vehicles: { own: Vehicle; other: Vehicle };
  dealership: Dealership;
  tokens: { admin: string; analyst: string; customer: string; orphan: string };
}

/** Sobe a API com a mesma configuração global do main.ts (pipes, filtro, prefixo). */
export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication({ logger: false });
  configureApp(app);
  await app.init();
  return app;
}

/** Recria o schema do banco de teste do zero, rodando as migrations. */
export async function resetDatabase(app: INestApplication): Promise<void> {
  const ds = app.get(DataSource);
  const database = String(ds.options.database);
  if (!database.endsWith('_test')) {
    throw new Error(`Recusando apagar o banco "${database}": não é um banco de teste.`);
  }
  await ds.dropDatabase();
  await ds.runMigrations();
}

export async function login(
  app: INestApplication,
  email: string,
  password = PASSWORD,
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password })
    .expect(200);
  return res.body.accessToken as string;
}

/**
 * Massa de dados comum:
 * - admin, analyst, customer (vinculado ao cliente "own") e orphan (customer sem vínculo);
 * - dois clientes (own e other), cada um com um veículo, e uma concessionária.
 */
export async function seedFixtures(app: INestApplication): Promise<Fixtures> {
  const ds = app.get(DataSource);
  const users = ds.getRepository(User);
  const customers = ds.getRepository(Customer);
  const vehicles = ds.getRepository(Vehicle);
  const dealerships = ds.getRepository(Dealership);

  const dealership = await dealerships.save(
    dealerships.create({ name: 'Ford Teste', city: 'São Paulo', region: 'Sudeste' }),
  );
  const own = await customers.save(
    customers.create({
      name: 'Cliente Dono',
      document: '10000000001',
      email: 'dono@example.com',
      city: 'São Paulo',
      state: 'SP',
    }),
  );
  const other = await customers.save(
    customers.create({
      name: 'Outro Cliente',
      document: '10000000002',
      email: 'outro@example.com',
      city: 'Recife',
      state: 'PE',
    }),
  );
  const ownVehicle = await vehicles.save(
    vehicles.create({
      vin: '9BFZK54P5J8100001',
      model: 'Ranger',
      modelYear: 2024,
      purchaseDate: '2024-03-15',
      odometer: 18000,
      customerId: own.id,
      dealershipId: dealership.id,
    }),
  );
  const otherVehicle = await vehicles.save(
    vehicles.create({
      vin: '9BFZK54P5J8100002',
      model: 'Territory',
      modelYear: 2023,
      purchaseDate: '2023-09-10',
      customerId: other.id,
      dealershipId: dealership.id,
    }),
  );

  // Custo 4 no bcrypt só para a suíte ficar rápida; a verificação é a mesma.
  const passwordHash = await bcrypt.hash(PASSWORD, 4);
  const makeUser = (email: string, role: UserRole, customerId: string | null = null) =>
    users.save(users.create({ name: email.split('@')[0], email, passwordHash, role, customerId }));

  const admin = await makeUser('admin@test.com', UserRole.ADMIN);
  const analyst = await makeUser('analyst@test.com', UserRole.ANALYST);
  const customer = await makeUser('customer@test.com', UserRole.CUSTOMER, own.id);
  const orphan = await makeUser('orphan@test.com', UserRole.CUSTOMER);

  return {
    users: { admin, analyst, customer, orphan },
    customers: { own, other },
    vehicles: { own: ownVehicle, other: otherVehicle },
    dealership,
    tokens: {
      admin: await login(app, admin.email),
      analyst: await login(app, analyst.email),
      customer: await login(app, customer.email),
      orphan: await login(app, orphan.email),
    },
  };
}

/** Confere o envelope padrão de erro (ErrorResponseDto) e que nada interno vazou. */
export function expectErrorEnvelope(body: Record<string, unknown>, status: number): void {
  expect(body).toEqual(
    expect.objectContaining({
      statusCode: status,
      error: expect.any(String),
      message: expect.anything(),
      path: expect.any(String),
      timestamp: expect.any(String),
    }),
  );
  expect(body).not.toHaveProperty('stack');
}
