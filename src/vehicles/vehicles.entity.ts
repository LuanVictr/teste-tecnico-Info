import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Model } from '../models/models.entity';
import { User } from '../users/users.entity';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'nvarchar', length: 10, unique: true })
  license_plate: string;

  @Column({ type: 'nvarchar', length: 17, unique: true })
  chassis: string;

  @Column({ type: 'nvarchar', length: 11, unique: true })
  renavam: string;

  @Column({ type: 'smallint' })
  year: number;

  @Column()
  model_id: number;

  @ManyToOne(() => Model, { nullable: false, onDelete: 'NO ACTION', eager: false })
  @JoinColumn({ name: 'model_id' })
  model: Model;

  @CreateDateColumn({ type: 'datetime2' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  updated_at: Date;

  @Column({ nullable: true })
  created_by: number;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @DeleteDateColumn({ type: 'datetime2', nullable: true })
  deleted_at: Date;
}
