import { BadRequestException } from '@nestjs/common';

export const parseDateOnly = (value: string): Date => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new BadRequestException('La fecha debe usar YYYY-MM-DD');
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value)
    throw new BadRequestException('La fecha no es válida');
  return date;
};
export const dateOnly = (date: Date): string => date.toISOString().slice(0, 10);
export const monthRange = (month: string): { start: Date; end: Date } => {
  if (!/^\d{4}-\d{2}$/.test(month)) throw new BadRequestException('El mes debe usar YYYY-MM');
  const [year, number] = month.split('-').map(Number);
  if (!year || !number || number < 1 || number > 12)
    throw new BadRequestException('El mes no es válido');
  return {
    start: new Date(Date.UTC(year, number - 1, 1)),
    end: new Date(Date.UTC(year, number, 1))
  };
};
export const currentSantiagoMonth = (): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit'
  })
    .format(new Date())
    .slice(0, 7);
