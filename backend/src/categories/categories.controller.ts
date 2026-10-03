import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import type { AuthUser } from '../common/auth-user';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
@ApiTags('categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}
  @Get() list(@CurrentUser() user: AuthUser) {
    return this.service.list(user.id);
  }
  @Post() create(@CurrentUser() user: AuthUser, @Body() dto: CreateCategoryDto) {
    return this.service.create(user.id, dto);
  }
  @Patch(':id') update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto
  ) {
    return this.service.update(user.id, id, dto);
  }
  @Delete(':id') @HttpCode(204) remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(user.id, id);
  }
}
