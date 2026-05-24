import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1779567032002 implements MigrationInterface {
    name = 'InitialSchema1779567032002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Extensão necessária para uuid_generate_v4() usado nas PKs.
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TABLE "customers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(140) NOT NULL, "document" character varying(11) NOT NULL, "email" character varying(160) NOT NULL, "phone" character varying(20), "city" character varying(80) NOT NULL, "state" character varying(2) NOT NULL, CONSTRAINT "PK_133ec679a801fab5e070f73d3ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_68c9c024a07c49ad6a2072d23c" ON "customers" ("document") `);
        await queryRunner.query(`CREATE TABLE "dealerships" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(140) NOT NULL, "city" character varying(80) NOT NULL, "region" character varying(40) NOT NULL, CONSTRAINT "PK_d0437fe70985654646502a6c805" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "vehicles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "vin" character varying(17) NOT NULL, "model" character varying(60) NOT NULL, "model_year" integer NOT NULL, "purchase_date" date NOT NULL, "odometer" integer NOT NULL DEFAULT '0', "customer_id" uuid NOT NULL, "dealership_id" uuid, CONSTRAINT "PK_18d8646b59304dce4af3a9e35b6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_8288ce015b69c5856cf54e07a6" ON "vehicles" ("vin") `);
        await queryRunner.query(`CREATE TYPE "public"."predictions_segment_enum" AS ENUM('fiel', 'abandono', 'esquecido', 'economico')`);
        await queryRunner.query(`CREATE TABLE "predictions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "customer_id" uuid NOT NULL, "vehicle_id" uuid, "segment" "public"."predictions_segment_enum" NOT NULL, "evasion_risk" double precision NOT NULL, "confidence" double precision NOT NULL, "features" jsonb NOT NULL, "model_version" character varying(40) NOT NULL, CONSTRAINT "PK_b92c9e4db595214b289f5e28adc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_be230a3b4c90e56a4e8d836143" ON "predictions" ("customer_id") `);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'analyst', 'customer')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(120) NOT NULL, "email" character varying(160) NOT NULL, "password_hash" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'analyst', CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_c1cda98f67cb9c79a1f1153e627" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_371f6685a624dd92448a1d7cc3c" FOREIGN KEY ("dealership_id") REFERENCES "dealerships"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "predictions" ADD CONSTRAINT "FK_be230a3b4c90e56a4e8d8361437" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "predictions" ADD CONSTRAINT "FK_32f06efefa7fd0180cd1caabc8e" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "predictions" DROP CONSTRAINT "FK_32f06efefa7fd0180cd1caabc8e"`);
        await queryRunner.query(`ALTER TABLE "predictions" DROP CONSTRAINT "FK_be230a3b4c90e56a4e8d8361437"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_371f6685a624dd92448a1d7cc3c"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_c1cda98f67cb9c79a1f1153e627"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_be230a3b4c90e56a4e8d836143"`);
        await queryRunner.query(`DROP TABLE "predictions"`);
        await queryRunner.query(`DROP TYPE "public"."predictions_segment_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8288ce015b69c5856cf54e07a6"`);
        await queryRunner.query(`DROP TABLE "vehicles"`);
        await queryRunner.query(`DROP TABLE "dealerships"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_68c9c024a07c49ad6a2072d23c"`);
        await queryRunner.query(`DROP TABLE "customers"`);
    }

}
