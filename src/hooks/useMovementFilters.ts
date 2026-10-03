import { useEffect, useMemo, useState } from 'react';
import type { Category, Movement, MovementType } from '../types';

export const MOVEMENT_SORTS = ['date-desc', 'date-asc', 'amount-desc', 'amount-asc'] as const;
export type MovementSort = (typeof MOVEMENT_SORTS)[number];
export type MovementTypeFilter = MovementType | 'all';

export interface MovementFilters {
  search: string;
  type: MovementTypeFilter;
  categoryId: string;
  dateFrom: string;
  dateTo: string;
  sort: MovementSort;
  nature: 'all' | 'fixed' | 'variable';
}

const INITIAL_FILTERS: MovementFilters = {
  search: '',
  type: 'all',
  categoryId: 'all',
  dateFrom: '',
  dateTo: '',
  sort: 'date-desc',
  nature: 'all'
};

const loadFilters = (): MovementFilters => {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem('movement-filters') ?? 'null');
    if (typeof saved !== 'object' || saved === null) return INITIAL_FILTERS;
    return { ...INITIAL_FILTERS, ...saved } as MovementFilters;
  } catch {
    return INITIAL_FILTERS;
  }
};

export const isMovementTypeFilter = (value: string): value is MovementTypeFilter =>
  value === 'all' || value === 'income' || value === 'expense';

export const isMovementSort = (value: string): value is MovementSort =>
  MOVEMENT_SORTS.some((sort) => sort === value);

const sortMovements = (movements: Movement[], sort: MovementSort): Movement[] =>
  [...movements].sort((first, second) => {
    switch (sort) {
      case 'date-desc':
        return second.date.localeCompare(first.date);
      case 'date-asc':
        return first.date.localeCompare(second.date);
      case 'amount-desc':
        return second.amount - first.amount;
      case 'amount-asc':
        return first.amount - second.amount;
    }
  });

export const useMovementFilters = (movements: Movement[], categories: Category[]) => {
  const [filters, setFilters] = useState<MovementFilters>(loadFilters);
  useEffect(() => localStorage.setItem('movement-filters', JSON.stringify(filters)), [filters]);

  const filteredMovements = useMemo(() => {
    const categoryNames = new Map(categories.map(({ id, name }) => [id, name]));
    const searchTerm = filters.search.toLocaleLowerCase('es');

    const matches = movements.filter((movement) => {
      const searchableText =
        `${movement.description} ${categoryNames.get(movement.categoryId) ?? ''}`.toLocaleLowerCase(
          'es'
        );

      return (
        (!searchTerm || searchableText.includes(searchTerm)) &&
        (filters.type === 'all' || movement.type === filters.type) &&
        (filters.categoryId === 'all' || movement.categoryId === filters.categoryId) &&
        (filters.nature === 'all' || movement.expenseNature === filters.nature) &&
        (!filters.dateFrom || movement.date >= filters.dateFrom) &&
        (!filters.dateTo || movement.date <= filters.dateTo)
      );
    });

    return sortMovements(matches, filters.sort);
  }, [movements, categories, filters]);

  const updateFilter = <Key extends keyof MovementFilters>(
    key: Key,
    value: MovementFilters[Key]
  ): void => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const setDateRange = (dateFrom: string, dateTo: string): void =>
    setFilters((current) => ({ ...current, dateFrom, dateTo }));

  const resetFilters = (): void => setFilters(INITIAL_FILTERS);
  const activeFilterCount = [
    filters.search,
    filters.type !== 'all',
    filters.categoryId !== 'all',
    filters.nature !== 'all',
    filters.dateFrom,
    filters.dateTo
  ].filter(Boolean).length;
  return {
    filters,
    filteredMovements,
    updateFilter,
    setDateRange,
    resetFilters,
    activeFilterCount
  };
};
