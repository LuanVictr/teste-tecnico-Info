import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const TABLES = ['users', 'models', 'vehicles', 'brands'];

export class AddDeletedAtToUsers1749513600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of TABLES) {
      const exists = await queryRunner.hasColumn(table, 'deleted_at');
      if (!exists) {
        await queryRunner.addColumn(
          table,
          new TableColumn({ name: 'deleted_at', type: 'datetime2', isNullable: true }),
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of TABLES) {
      const exists = await queryRunner.hasColumn(table, 'deleted_at');
      if (exists) {
        await queryRunner.dropColumn(table, 'deleted_at');
      }
    }
  }
}
