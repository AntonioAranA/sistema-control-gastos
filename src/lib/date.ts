import type { IsoDate, YearMonth } from '../types';

export const todayLocal = (): IsoDate => {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

export const currentMonth = (): YearMonth => todayLocal().slice(0, 7);

export const monthLabel = (month: YearMonth): string => {
  const [year, monthNumber] = month.split('-').map(Number);
  if (!year || !monthNumber) return month;
  const label = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric' }).format(
    new Date(year, monthNumber - 1, 1)
  );
  return label.charAt(0).toUpperCase() + label.slice(1);
};

export const formatDate = (value: IsoDate): string => {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(year, month - 1, day));
};

export const shiftMonth = (month: YearMonth, delta: number): YearMonth => {
  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(year ?? 0, (monthNumber ?? 1) - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

export const shiftDateByMonth = (value: IsoDate, delta: number): IsoDate => {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  const target = new Date(year, month - 1 + delta, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(Math.min(day, lastDay)).padStart(2, '0')}`;
};
