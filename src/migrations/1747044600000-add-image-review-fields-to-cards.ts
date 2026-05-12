import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddImageReviewFieldsToCards1747044600000
  implements MigrationInterface
{
  name = 'AddImageReviewFieldsToCards1747044600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "imageMismatchFlag" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "imageMismatchNote" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "imageReviewedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "imageReviewedByUserId" character varying(64)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cards" DROP COLUMN IF EXISTS "imageReviewedByUserId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cards" DROP COLUMN IF EXISTS "imageReviewedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cards" DROP COLUMN IF EXISTS "imageMismatchNote"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cards" DROP COLUMN IF EXISTS "imageMismatchFlag"`,
    );
  }
}
