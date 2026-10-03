import { useState } from 'react';
import { formatCLP } from '../lib/format';

interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: number;
  required?: boolean;
  ariaLabel?: string;
}

export function CurrencyInput({
  value,
  onChange,
  placeholder = '0',
  min = 0,
  required,
  ariaLabel
}: CurrencyInputProps) {
  const [focused, setFocused] = useState(false);
  const clean = (input: string): string => input.replace(/[^0-9]/g, '');
  return (
    <input
      aria-label={ariaLabel}
      inputMode="numeric"
      type="text"
      value={focused || !value ? value : formatCLP(Number(value))}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(event) => onChange(clean(event.target.value))}
      placeholder={placeholder}
      required={required}
      data-min={min}
    />
  );
}
