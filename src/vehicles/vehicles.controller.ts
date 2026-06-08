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
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { ListVehiclesDto } from './dto/list-vehicles.dto';

@ApiTags('Veículos')
@ApiBearerAuth()
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar veículo', description: 'Registra um novo veículo na frota.' })
  @ApiResponse({ status: 201, description: 'Veículo registrado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Modelo não encontrado' })
  @ApiResponse({ status: 409, description: 'Placa, chassi ou RENAVAM já cadastrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  create(@Body() body: CreateVehicleDto, @CurrentUser() currentUser: AuthUser) {
    return this.vehiclesService.create(body, currentUser.userId);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar veículos',
    description: 'Retorna lista paginada de veículos. Filtrável por modelId e year.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'modelId', required: false, type: Number })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso (pode ser cacheada)' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findAll(@Query() filters: ListVehiclesDto) {
    return this.vehiclesService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar veículo por ID' })
  @ApiResponse({ status: 200, description: 'Veículo encontrado (pode ser cacheado)' })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar veículo' })
  @ApiResponse({ status: 200, description: 'Veículo atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Veículo ou modelo não encontrado' })
  @ApiResponse({ status: 409, description: 'Placa, chassi ou RENAVAM duplicado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() changes: UpdateVehicleDto,
    @CurrentUser() currentUser: AuthUser,
  ) {
    return this.vehiclesService.update(id, changes, currentUser.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover veículo', description: 'Remove o veículo (soft delete).' })
  @ApiResponse({ status: 200, description: 'Veículo removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() currentUser: AuthUser) {
    return this.vehiclesService.remove(id, currentUser.userId);
  }
}
