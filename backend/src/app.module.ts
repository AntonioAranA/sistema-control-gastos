import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { MovementsModule } from './movements/movements.module';
import { BudgetsModule } from './budgets/budgets.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { HealthModule } from './health/health.module';
import { GoalsModule } from './goals/goals.module';
import { SafeExceptionFilter } from './common/safe-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    CategoriesModule,
    MovementsModule,
    BudgetsModule,
    AnalyticsModule,
    HealthModule,
    GoalsModule
  ],
  providers: [
    { provide: APP_FILTER, useClass: SafeExceptionFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard }
  ]
})
export class AppModule {}
