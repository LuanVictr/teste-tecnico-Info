import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/users.entity';

@Entity('brands')
export class Brand {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'nvarchar', length: 100, unique: true })
  name: string;

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

  // Populated after models are loaded
  @OneToMany('Model', 'brand')
  models: unknown[];
}
