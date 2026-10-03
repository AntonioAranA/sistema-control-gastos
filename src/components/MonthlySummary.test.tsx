import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MonthlySummary } from './MonthlySummary';

describe('MonthlySummary', () => {
  it('expone los indicadores con texto y no solo color', () => {
    render(
      <MonthlySummary
        summary={{ income: 100000, expense: 40000, balance: 60000 }}
        budgetLimit={80000}
        budgetStatus={{ percentage: 50, exceeded: false, remaining: 40000 }}
        showDemoAction={false}
        onLoadDemo={vi.fn()}
        onReviewBudget={vi.fn()}
      />
    );
    expect(screen.getByText('Ingresos')).toBeInTheDocument();
    expect(screen.getByText('Gastos')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });
});
