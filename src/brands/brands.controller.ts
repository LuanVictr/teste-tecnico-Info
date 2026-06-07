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
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { ListBrandsDto } from './dto/list-brands.dto';

@ApiTags('🏷️ Marcas')
@ApiBearerAuth()
@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar marca', description: 'Cria uma nova marca de veículo.' })
  @ApiResponse({ status: 201, description: 'Marca criada com sucesso' })
  @ApiResponse({ status: 409, description: 'Marca com mesmo nome já existe' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  create(@Body() body: CreateBrandDto, @CurrentUser() currentUser: AuthUser) {
    return this.brandsService.create(body, currentUser.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar marcas', description: 'Retorna lista paginada de marcas.' })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findAll(@Query() filters: ListBrandsDto) {
    return this.brandsService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar marca por ID', description: 'Retorna a marca com seus modelos associados.' })
  @ApiResponse({ status: 200, description: 'Marca encontrada com modelos' })
  @ApiResponse({ status: 404, description: 'Marca não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.brandsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar marca' })
  @ApiResponse({ status: 200, description: 'Marca atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Marca não encontrada' })
  @ApiResponse({ status: 409, description: 'Nome já em uso por outra marca' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() changes: UpdateBrandDto,
    @CurrentUser() currentUser: AuthUser,
  ) {
    return this.brandsService.update(id, changes, currentUser.userId);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remover marca',
    description: 'Remove a marca. Retorna 409 se houver modelos associados.',
  })
  @ApiResponse({ status: 200, description: 'Marca removida com sucesso' })
  @ApiResponse({ status: 404, description: 'Marca não encontrada' })
  @ApiResponse({ status: 409, description: 'Marca possui modelos associados' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.brandsService.remove(id);
  }
}
