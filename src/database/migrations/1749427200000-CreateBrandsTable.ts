import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateBrandsTable1749427200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'brands',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'name', type: 'nvarchar', length: '100', isNullable: false, isUnique: true },
          { name: 'created_at', type: 'datetime2', default: 'GETDATE()', isNullable: false },
          { name: 'updated_at', type: 'datetime2', default: 'GETDATE()', isNullable: false },
          { name: 'created_by', type: 'int', isNullable: true },
          { name: 'deleted_at', type: 'datetime2', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'brands',
      new TableForeignKey({
        name: 'FK_brands_created_by',
        columnNames: ['created_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // Wire up the existing brand_id column in models to the new brands table
    await queryRunner.createForeignKey(
      'models',
      new TableForeignKey({
        name: 'FK_models_brand_id',
        columnNames: ['brand_id'],
        referencedTableName: 'brands',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('models', 'FK_models_brand_id');
    await queryRunner.dropForeignKey('brands', 'FK_brands_created_by');
    await queryRunner.dropTable('brands');
  }
}
