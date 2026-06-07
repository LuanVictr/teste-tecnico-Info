import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateVehiclesTable1749340800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'vehicles',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'license_plate', type: 'nvarchar', length: '10', isNullable: false },
          { name: 'chassis', type: 'nvarchar', length: '17', isNullable: false },
          { name: 'renavam', type: 'nvarchar', length: '11', isNullable: false },
          { name: 'year', type: 'smallint', isNullable: false },
          { name: 'model_id', type: 'int', isNullable: false },
          { name: 'created_at', type: 'datetime2', default: 'GETDATE()', isNullable: false },
          { name: 'updated_at', type: 'datetime2', default: 'GETDATE()', isNullable: false },
          { name: 'created_by', type: 'int', isNullable: true },
          { name: 'deleted_at', type: 'datetime2', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'vehicles',
      new TableIndex({ name: 'UQ_vehicles_license_plate', columnNames: ['license_plate'], isUnique: true }),
    );
    await queryRunner.createIndex(
      'vehicles',
      new TableIndex({ name: 'UQ_vehicles_chassis', columnNames: ['chassis'], isUnique: true }),
    );
    await queryRunner.createIndex(
      'vehicles',
      new TableIndex({ name: 'UQ_vehicles_renavam', columnNames: ['renavam'], isUnique: true }),
    );
    await queryRunner.createIndex(
      'vehicles',
      new TableIndex({ name: 'IX_vehicles_model_id', columnNames: ['model_id'] }),
    );
    await queryRunner.createIndex(
      'vehicles',
      new TableIndex({ name: 'IX_vehicles_year', columnNames: ['year'] }),
    );

    await queryRunner.createForeignKey(
      'vehicles',
      new TableForeignKey({
        name: 'FK_vehicles_model_id',
        columnNames: ['model_id'],
        referencedTableName: 'models',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
    await queryRunner.createForeignKey(
      'vehicles',
      new TableForeignKey({
        name: 'FK_vehicles_created_by',
        columnNames: ['created_by'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('vehicles', 'FK_vehicles_created_by');
    await queryRunner.dropForeignKey('vehicles', 'FK_vehicles_model_id');
    await queryRunner.dropTable('vehicles');
  }
}
