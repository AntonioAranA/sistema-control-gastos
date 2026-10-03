import { ChevronLeft, ChevronRight } from 'lucide-react';
import { monthLabel, shiftMonth } from '../lib/date';
import type { YearMonth } from '../types';

interface MonthPickerProps {
  value: YearMonth;
  onChange: (month: YearMonth) => void;
}

export function MonthPicker({ value, onChange }: MonthPickerProps) {
  return (
    <div className="month-picker" aria-label="Mes seleccionado">
      <button
        className="icon-button"
        onClick={() => onChange(shiftMonth(value, -1))}
        aria-label="Mes anterior"
      >
        <ChevronLeft />
      </button>
      <span>{monthLabel(value)}</span>
      <button
        className="icon-button"
        onClick={() => onChange(shiftMonth(value, 1))}
        aria-label="Mes siguiente"
      >
        <ChevronRight />
      </button>
    </div>
  );
}
