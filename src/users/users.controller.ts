import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../shared/pagination/pagination.dto';

@ApiTags('Usuários')
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Criar usuário', description: 'Cria um novo usuário. Email deve ser único. Senha nunca é retornada na resposta.' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso (sem campo password)' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Email já cadastrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  create(@Body() body: CreateUserDto) {
    return this.usersService.create(body);
  }

  @Get()
  @ApiOperation({ summary: 'Listar usuários', description: 'Retorna lista paginada. Password nunca é exposto.' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findAll(@Query() pagination: PaginationDto) {
    return this.usersService.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  @ApiResponse({ status: 200, description: 'Usuário encontrado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar usuário', description: 'Todos os campos são opcionais. Se password for enviado, será rehashado automaticamente.' })
  @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 409, description: 'Email já em uso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  update(@Param('id', ParseIntPipe) id: number, @Body() changes: UpdateUserDto) {
    return this.usersService.update(id, changes);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover usuário', description: 'Soft delete do usuário.' })
  @ApiResponse({ status: 200, description: 'Usuário removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
