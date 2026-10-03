import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import type { AuthUser } from '../common/auth-user';
import { BudgetsService } from './budgets.service';
import { UpsertBudgetDto } from './dto/budget.dto';
@ApiTags('budgets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly service: BudgetsService) {}
  @Get() list(@CurrentUser() user: AuthUser) {
    return this.service.list(user.id);
  }
  @Get(':month') get(@CurrentUser() user: AuthUser, @Param('month') month: string) {
    return this.service.get(user.id, month);
  }
  @Put() upsert(@CurrentUser() user: AuthUser, @Body() dto: UpsertBudgetDto) {
    return this.service.upsert(user.id, dto);
  }
}
