import type { AppData, Category, Movement, YearMonth } from '../types';

const escapeCsvCell = (value: string | number): string =>
  `"${String(value).replaceAll('"', '""')}"`;
export const downloadFile = (content: string, filename: string, type: string): void => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
export const exportMovementsCsv = (
  movements: Movement[],
  categories: Category[],
  month: YearMonth
): void => {
  const names = new Map(categories.map(({ id, name }) => [id, name]));
  const rows = movements.map((item) => [
    item.date,
    item.type === 'income' ? 'Ingreso' : 'Gasto',
    names.get(item.categoryId) ?? '',
    item.description,
    item.amount,
    item.expenseNature === 'fixed' ? 'Fijo' : 'Variable'
  ]);
  const csv = [['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Monto CLP', 'Naturaleza'], ...rows]
    .map((row) => row.map(escapeCsvCell).join(';'))
    .join('\n');
  downloadFile(`\uFEFF${csv}`, `movimientos-${month}.csv`, 'text/csv;charset=utf-8');
};
export const exportBackup = (data: AppData): void =>
  downloadFile(
    JSON.stringify(data, null, 2),
    `respaldo-finanzas-${new Date().toISOString().slice(0, 10)}.json`,
    'application/json'
  );
export const readJsonFile = async (file: File): Promise<unknown> =>
  JSON.parse(await file.text()) as unknown;
export const parseCsv = (text: string, categories: Category[]): Movement[] => {
  const names = new Map(
    categories.map((category) => [category.name.toLocaleLowerCase('es'), category.id])
  );
  return text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .slice(1)
    .filter(Boolean)
    .flatMap((line) => {
      const [date, type, category, description, amount, nature] = line
        .split(';')
        .map((cell) => cell.replace(/^"|"$/g, '').replaceAll('""', '"'));
      const numericAmount = Number(amount);
      if (!date || !description || !Number.isFinite(numericAmount) || numericAmount <= 0) return [];
      return [
        {
          id: crypto.randomUUID(),
          date,
          description,
          amount: Math.round(numericAmount),
          type: type?.toLocaleLowerCase('es') === 'ingreso' ? 'income' : 'expense',
          categoryId: names.get(category?.toLocaleLowerCase('es') ?? '') ?? 'otros',
          expenseNature: nature?.toLocaleLowerCase('es') === 'fijo' ? 'fixed' : 'variable',
          recurrence: 'none',
          createdAt: new Date().toISOString()
        } satisfies Movement
      ];
    });
};

export interface CsvImportPreview {
  accepted: Movement[];
  duplicateCount: number;
  rejected: Array<{ row: number; reason: string }>;
}

export const previewCsvImport = (
  text: string,
  categories: Category[],
  existing: Movement[]
): CsvImportPreview => {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .slice(1)
    .filter(Boolean);
  const accepted = parseCsv(text, categories);
  const rejected = lines.flatMap((line, index) => {
    const cells = line.split(';');
    return cells.length < 5 || !Number.isFinite(Number(cells[4]?.replace(/^"|"$/g, '')))
      ? [{ row: index + 2, reason: 'Formato o monto inválido' }]
      : [];
  });
  const duplicate = (candidate: Movement) =>
    existing.some(
      (item) =>
        item.date === candidate.date &&
        item.amount === candidate.amount &&
        item.description.toLocaleLowerCase('es') === candidate.description.toLocaleLowerCase('es')
    );
  const duplicateCount = accepted.filter(duplicate).length;
  return { accepted: accepted.filter((item) => !duplicate(item)), duplicateCount, rejected };
};
