import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';
import { ModelsService } from './models.service';
import { CreateModelDto } from './dto/create-model.dto';
import { UpdateModelDto } from './dto/update-model.dto';
import { ListModelsDto } from './dto/list-models.dto';

@ApiTags('Modelos')
@ApiBearerAuth()
@Controller('models')
export class ModelsController {
  constructor(private readonly modelsService: ModelsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar modelo', description: 'Cria um novo modelo de veículo.' })
  @ApiResponse({ status: 201, description: 'Modelo criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  create(@Body() body: CreateModelDto, @CurrentUser() currentUser: AuthUser) {
    return this.modelsService.create(body, currentUser.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar modelos', description: 'Retorna lista paginada de modelos.' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findAll(@Query() filters: ListModelsDto) {
    return this.modelsService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar modelo por ID' })
  @ApiResponse({ status: 200, description: 'Modelo encontrado' })
  @ApiResponse({ status: 404, description: 'Modelo não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.modelsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar modelo' })
  @ApiResponse({ status: 200, description: 'Modelo atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Modelo não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() changes: UpdateModelDto,
    @CurrentUser() currentUser: AuthUser,
  ) {
    return this.modelsService.update(id, changes, currentUser.userId);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remover modelo',
    description: 'Remove um modelo. Retorna 409 se houver veículos associados.',
  })
  @ApiResponse({ status: 200, description: 'Modelo removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Modelo não encontrado' })
  @ApiResponse({ status: 409, description: 'Modelo possui veículos associados' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.modelsService.remove(id);
  }
}
