import axe from 'axe-core';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MonthlySummary } from './MonthlySummary';

describe('accesibilidad', () => {
  it('no presenta infracciones automáticas en el resumen', async () => {
    const { container } = render(
      <MonthlySummary
        summary={{ income: 100000, expense: 40000, balance: 60000 }}
        budgetLimit={80000}
        budgetStatus={{ percentage: 50, exceeded: false, remaining: 40000 }}
        showDemoAction={false}
        onLoadDemo={vi.fn()}
        onReviewBudget={vi.fn()}
      />
    );
    const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(result.violations).toEqual([]);
  });
});
