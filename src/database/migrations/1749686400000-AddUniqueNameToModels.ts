import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueNameToModels1749686400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      WITH ranked AS (
        SELECT id,
               ROW_NUMBER() OVER (
                 PARTITION BY name, brand_id
                 ORDER BY id ASC
               ) AS rn
        FROM models
        WHERE deleted_at IS NULL
      )
      UPDATE models SET deleted_at = GETDATE()
      WHERE id IN (SELECT id FROM ranked WHERE rn > 1)
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX UQ_models_name_brand_id
      ON models (name, brand_id)
      WHERE deleted_at IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX UQ_models_name_brand_id ON models`);
  }
}
