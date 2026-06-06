import { ConflictException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { User } from './users.entity';
import { paginate } from '../shared/pagination/paginate.helper';
import { PaginationDto } from '../shared/pagination/pagination.dto';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    await this.seedAdminUser();
  }

  private async seedAdminUser() {
    const email = this.config.getOrThrow<string>('SEED_USER_EMAIL');
    const existing = await this.repo.findOne({ where: { email } });
    if (existing) return;

    const saltRounds = parseInt(this.config.getOrThrow<string>('BCRYPT_SALT_ROUNDS'), 10);
    const password = await bcrypt.hash(
      this.config.getOrThrow<string>('SEED_USER_PASSWORD'),
      saltRounds,
    );

    await this.repo.save({
      nickname: this.config.getOrThrow<string>('SEED_USER_NICKNAME'),
      name: this.config.getOrThrow<string>('SEED_USER_NAME'),
      email,
      password,
    });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findById(id: number): Promise<User> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`Usuário com id ${id} não encontrado`);
    return user;
  }

  async findAll(dto: PaginationDto) {
    const [items, total] = await this.repo.findAndCount({
      skip: (dto.page - 1) * dto.limit,
      take: dto.limit,
      order: { created_at: 'DESC' },
    });
    return paginate(items, total, dto.page, dto.limit);
  }

  async create(data: { nickname: string; name: string; email: string; password: string }) {
    const existing = await this.repo.findOne({ where: { email: data.email } });
    if (existing) throw new ConflictException(`Email '${data.email}' já está em uso`);

    const saltRounds = parseInt(this.config.get<string>('BCRYPT_SALT_ROUNDS', '10'), 10);
    const password = await bcrypt.hash(data.password, saltRounds);
    const user = this.repo.create({ ...data, password });
    return this.repo.save(user);
  }

  async update(
    id: number,
    data: Partial<{ nickname: string; name: string; email: string; password: string }>,
  ) {
    const user = await this.findById(id);
    const saltRounds = parseInt(this.config.get<string>('BCRYPT_SALT_ROUNDS', '10'), 10);
    if (data.password) data.password = await bcrypt.hash(data.password, saltRounds);
    Object.assign(user, data);
    return this.repo.save(user);
  }

  async remove(id: number) {
    const user = await this.findById(id);
    await this.repo.remove(user);
    return { message: 'Usuário removido com sucesso' };
  }
}
