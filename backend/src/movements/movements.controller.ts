import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import type { AuthUser } from '../common/auth-user';
import { MovementsService } from './movements.service';
import {
  BulkCategoryDto,
  BulkDeleteDto,
  CreateMovementDto,
  ImportMovementsDto,
  MovementQueryDto,
  UpdateMovementDto
} from './dto/movement.dto';

@ApiTags('movements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('movements')
export class MovementsController {
  constructor(private readonly service: MovementsService) {}
  @Get() list(@CurrentUser() user: AuthUser, @Query() query: MovementQueryDto) {
    return this.service.list(user.id, query);
  }
  @Get('all') all(@CurrentUser() user: AuthUser) {
    return this.service.all(user.id);
  }
  @Get('export.csv') @Header('Content-Type', 'text/csv; charset=utf-8') async csv(
    @CurrentUser() user: AuthUser,
    @Query() query: MovementQueryDto,
    @Res() response: Response
  ) {
    response.setHeader('Content-Disposition', 'attachment; filename="movimientos.csv"');
    response.send(`\uFEFF${await this.service.csv(user.id, query)}`);
  }
  @Post('import') import(@CurrentUser() user: AuthUser, @Body() dto: ImportMovementsDto) {
    return this.service.import(user.id, dto.movements);
  }
  @Post('bulk-delete') bulkDelete(@CurrentUser() user: AuthUser, @Body() dto: BulkDeleteDto) {
    return this.service.bulkDelete(user.id, dto.ids);
  }
  @Post('bulk-category') bulkCategory(@CurrentUser() user: AuthUser, @Body() dto: BulkCategoryDto) {
    return this.service.bulkCategory(user.id, dto);
  }
  @Post() create(@CurrentUser() user: AuthUser, @Body() dto: CreateMovementDto) {
    return this.service.create(user.id, dto);
  }
  @Patch(':id') update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateMovementDto
  ) {
    return this.service.update(user.id, id, dto);
  }
  @Delete(':id') @HttpCode(204) remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(user.id, id);
  }
}
