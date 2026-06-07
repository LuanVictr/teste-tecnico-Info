import { ConflictException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { User } from './users.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { paginate } from '../shared/pagination/paginate.helper';
import { PaginationDto } from '../shared/pagination/pagination.dto';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    await this.seedAdminUser();
  }

  private async seedAdminUser() {
    const email = this.config.getOrThrow<string>('SEED_USER_EMAIL');
    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) return;

    const saltRounds = parseInt(this.config.getOrThrow<string>('BCRYPT_SALT_ROUNDS'), 10);
    const password = await bcrypt.hash(
      this.config.getOrThrow<string>('SEED_USER_PASSWORD'),
      saltRounds,
    );

    await this.userRepository.save({
      nickname: this.config.getOrThrow<string>('SEED_USER_NICKNAME'),
      name: this.config.getOrThrow<string>('SEED_USER_NAME'),
      email,
      password,
    });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`Usuário com id ${id} não encontrado`);
    return user;
  }

  async findAll(pagination: PaginationDto) {
    const [users, total] = await this.userRepository.findAndCount({
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
      order: { created_at: 'DESC' },
    });
    return paginate(users, total, pagination.page, pagination.limit);
  }

  async create(data: CreateUserDto) {
    const existing = await this.userRepository.findOne({ where: { email: data.email } });
    if (existing) throw new ConflictException(`Email '${data.email}' já está em uso`);

    const saltRounds = parseInt(this.config.get<string>('BCRYPT_SALT_ROUNDS', '10'), 10);
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);
    const user = this.userRepository.create({ ...data, password: hashedPassword });
    return this.userRepository.save(user);
  }

  async update(id: number, changes: UpdateUserDto) {
    const user = await this.findById(id);
    const saltRounds = parseInt(this.config.get<string>('BCRYPT_SALT_ROUNDS', '10'), 10);
    if (changes.password) {
      changes.password = await bcrypt.hash(changes.password, saltRounds);
    }
    Object.assign(user, changes);
    return this.userRepository.save(user);
  }

  async remove(id: number) {
    const user = await this.findById(id);
    await this.userRepository.softRemove(user);
    return { message: 'Usuário removido com sucesso' };
  }
}
