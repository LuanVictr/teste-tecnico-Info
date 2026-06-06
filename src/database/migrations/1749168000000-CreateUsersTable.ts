import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUsersTable1749168000000 implements MigrationInterface {
  name = 'CreateUsersTable1749168000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'nickname', type: 'nvarchar', length: '50', isNullable: false },
          { name: 'name', type: 'nvarchar', length: '150', isNullable: false },
          { name: 'email', type: 'nvarchar', length: '255', isNullable: false, isUnique: true },
          { name: 'password', type: 'nvarchar', length: '255', isNullable: false },
          {
            name: 'created_at',
            type: 'datetime2',
            default: 'GETDATE()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'datetime2',
            default: 'GETDATE()',
            isNullable: false,
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
