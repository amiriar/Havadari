import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTeamNameToCards1746783000000 implements MigrationInterface {
  name = 'AddTeamNameAndMarketValueToCards1746783000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "teamName" character varying(96)`,
    );
    await queryRunner.query(
      `ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "marketValue" bigint`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cards" DROP COLUMN IF EXISTS "marketValue"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cards" DROP COLUMN IF EXISTS "teamName"`,
    );
  }
}
