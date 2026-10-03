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
import { GoalsService } from './goals.service';
import { CreateContributionDto, CreateGoalDto, UpdateGoalDto } from './dto/goal.dto';
@ApiTags('goals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('goals')
export class GoalsController {
  constructor(private readonly service: GoalsService) {}
  @Get() list(@CurrentUser() user: AuthUser) {
    return this.service.list(user.id);
  }
  @Post() create(@CurrentUser() user: AuthUser, @Body() dto: CreateGoalDto) {
    return this.service.create(user.id, dto);
  }
  @Patch(':id') update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateGoalDto
  ) {
    return this.service.update(user.id, id, dto);
  }
  @Post(':id/contributions') contribute(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateContributionDto
  ) {
    return this.service.contribute(user.id, id, dto);
  }
  @Delete(':id') @HttpCode(204) remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(user.id, id);
  }
}
