import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDeletedAtToModels1749600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasColumn('models', 'deleted_at');
    if (!exists) {
      await queryRunner.addColumn(
        'models',
        new TableColumn({ name: 'deleted_at', type: 'datetime2', isNullable: true }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasColumn('models', 'deleted_at');
    if (exists) {
      await queryRunner.dropColumn('models', 'deleted_at');
    }
  }
}
