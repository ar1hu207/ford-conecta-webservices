import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import dataSource from '../config/data-source';
import { User } from '../modules/auth/entities/user.entity';
import { UserRole } from '../modules/auth/enums/user-role.enum';
import { Customer } from '../modules/customers/entities/customer.entity';
import { Dealership } from '../modules/dealerships/entities/dealership.entity';
import { Vehicle } from '../modules/vehicles/entities/vehicle.entity';

/**
 * Popula o banco com dados iniciais (idempotente: não duplica se já houver dados).
 * Rode: npm run seed   (após docker up + migration:run)
 */
async function run(): Promise<void> {
  await dataSource.initialize();
  // eslint-disable-next-line no-console
  console.log('🌱 Seed iniciado...');

  const users = dataSource.getRepository(User);
  const dealerships = dataSource.getRepository(Dealership);
  const customers = dataSource.getRepository(Customer);
  const vehicles = dataSource.getRepository(Vehicle);

  // ---- Usuários (admin + analista) ----
  if ((await users.count()) === 0) {
    await users.save([
      users.create({
        name: 'Administrador',
        email: 'admin@fordconecta.com',
        passwordHash: await bcrypt.hash('Admin@12345', 10),
        role: UserRole.ADMIN,
      }),
      users.create({
        name: 'Analista Pós-venda',
        email: 'analista@fordconecta.com',
        passwordHash: await bcrypt.hash('Analyst@12345', 10),
        role: UserRole.ANALYST,
      }),
    ]);
    console.log('  ✔ Usuários criados (admin@fordconecta.com / analista@fordconecta.com)');
  } else {
    console.log('  • Usuários já existem, pulando.');
  }

  // ---- Concessionárias ----
  let dealershipList = await dealerships.find();
  if (dealershipList.length === 0) {
    dealershipList = await dealerships.save([
      dealerships.create({ name: 'Ford Center Norte', city: 'São Paulo', region: 'Sudeste' }),
      dealerships.create({ name: 'Ford Sul', city: 'Porto Alegre', region: 'Sul' }),
      dealerships.create({ name: 'Ford Nordeste', city: 'Recife', region: 'Nordeste' }),
    ]);
    console.log(`  ✔ ${dealershipList.length} concessionárias criadas`);
  } else {
    console.log('  • Concessionárias já existem, pulando.');
  }

  // ---- Clientes + veículos ----
  if ((await customers.count()) === 0) {
    const seedData = [
      {
        name: 'João da Silva',
        document: '11111111111',
        email: 'joao@example.com',
        phone: '+5511990001111',
        city: 'São Paulo',
        state: 'SP',
        vehicle: { vin: '9BFZK54P5J8000001', model: 'Ranger', modelYear: 2024, purchaseDate: '2024-03-15', odometer: 18000 },
        dealershipIdx: 0,
      },
      {
        name: 'Maria Souza',
        document: '22222222222',
        email: 'maria@example.com',
        phone: '+5551990002222',
        city: 'Porto Alegre',
        state: 'RS',
        vehicle: { vin: '9BFZK54P5J8000002', model: 'Territory', modelYear: 2023, purchaseDate: '2023-09-10', odometer: 31000 },
        dealershipIdx: 1,
      },
      {
        name: 'Carlos Pereira',
        document: '33333333333',
        email: 'carlos@example.com',
        phone: '+5581990003333',
        city: 'Recife',
        state: 'PE',
        vehicle: { vin: '9BFZK54P5J8000003', model: 'Bronco Sport', modelYear: 2025, purchaseDate: '2025-01-20', odometer: 6000 },
        dealershipIdx: 2,
      },
      {
        name: 'Ana Oliveira',
        document: '44444444444',
        email: 'ana@example.com',
        phone: '+5511990004444',
        city: 'Campinas',
        state: 'SP',
        vehicle: { vin: '9BFZK54P5J8000004', model: 'Maverick', modelYear: 2024, purchaseDate: '2024-07-05', odometer: 12000 },
        dealershipIdx: 0,
      },
    ];

    for (const item of seedData) {
      const customer = await customers.save(
        customers.create({
          name: item.name,
          document: item.document,
          email: item.email,
          phone: item.phone,
          city: item.city,
          state: item.state,
        }),
      );
      await vehicles.save(
        vehicles.create({
          ...item.vehicle,
          customerId: customer.id,
          dealershipId: dealershipList[item.dealershipIdx]?.id,
        }),
      );
    }
    console.log(`  ✔ ${seedData.length} clientes + veículos criados`);
  } else {
    console.log('  • Clientes já existem, pulando.');
  }

  await dataSource.destroy();
  console.log('🌱 Seed concluído.');
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Erro no seed:', err);
  process.exit(1);
});
