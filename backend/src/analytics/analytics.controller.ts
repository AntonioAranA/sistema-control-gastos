import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import type { AuthUser } from '../common/auth-user';
import { AnalyticsService } from './analytics.service';
@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}
  @Get('summary') summary(@CurrentUser() user: AuthUser, @Query('month') month?: string) {
    return this.service.summary(user.id, month);
  }
  @Get('expenses-by-category') categories(
    @CurrentUser() user: AuthUser,
    @Query('month') month?: string
  ) {
    return this.service.byCategory(user.id, month);
  }
  @Get('monthly-evolution') evolution(
    @CurrentUser() user: AuthUser,
    @Query('month') month?: string
  ) {
    return this.service.evolution(user.id, month);
  }
}
