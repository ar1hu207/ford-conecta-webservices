import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Vincula o usuário (papel customer) ao cadastro de cliente, para que o dono do
 * veículo só acesse os próprios dados.
 */
export class LinkUserToCustomer1790000000000 implements MigrationInterface {
  name = 'LinkUserToCustomer1790000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "customer_id" uuid`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_users_customer_id" ON "users" ("customer_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_users_customer_id" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_customer_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_users_customer_id"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "customer_id"`);
  }
}
