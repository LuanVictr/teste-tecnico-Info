import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  nickname: string;

  @Column({ length: 150 })
  name: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ select: false })
  password: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'datetime2', nullable: true })
  deleted_at: Date;
}
