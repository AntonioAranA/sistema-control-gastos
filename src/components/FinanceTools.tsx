import { CalendarPlus, FileDown, FileInput, RefreshCw, Trash2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type { AppData, Category, Movement, YearMonth } from '../types';
import {
  exportBackup,
  previewCsvImport,
  readJsonFile,
  type CsvImportPreview
} from '../lib/dataTransfer';

interface FinanceToolsProps {
  data: AppData;
  month: YearMonth;
  categories: Category[];
  onGenerateRecurring: (month: YearMonth) => Promise<number>;
  onImportMovements: (movements: Movement[]) => void;
  onRestore: (value: unknown) => void;
  onClearData: () => void;
  onNotify: (message: string) => void;
}

export function FinanceTools(props: FinanceToolsProps) {
  const csvInput = useRef<HTMLInputElement>(null);
  const jsonInput = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<CsvImportPreview>();
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearPhrase, setClearPhrase] = useState('');
  const generate = async () => {
    const count = await props.onGenerateRecurring(props.month);
    props.onNotify(
      count
        ? `${count} movimiento${count === 1 ? '' : 's'} generado${count === 1 ? '' : 's'}.`
        : 'No hay movimientos recurrentes pendientes.'
    );
  };
  const prepareCsv = async (file?: File) => {
    if (file)
      setPreview(previewCsvImport(await file.text(), props.categories, props.data.movements));
  };
  const restore = async (file?: File) => {
    if (!file) return;
    try {
      props.onRestore(await readJsonFile(file));
      props.onNotify('Respaldo restaurado.');
    } catch {
      props.onNotify('El archivo de respaldo no es válido.');
    }
  };
  return (
    <>
      <div className="finance-tools">
        <button className="button secondary" onClick={() => void generate()}>
          <RefreshCw />
          Generar recurrentes
        </button>
        <button className="button secondary" onClick={() => csvInput.current?.click()}>
          <FileInput />
          Importar CSV
        </button>
        <button className="button secondary" onClick={() => exportBackup(props.data)}>
          <FileDown />
          Respaldo
        </button>
        <button className="button secondary" onClick={() => jsonInput.current?.click()}>
          <CalendarPlus />
          Restaurar
        </button>
        <button className="button ghost danger-text" onClick={() => setConfirmClear(true)}>
          <Trash2 />
          Borrar datos
        </button>
        <input
          ref={csvInput}
          className="sr-only"
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => void prepareCsv(event.target.files?.[0])}
        />
        <input
          ref={jsonInput}
          className="sr-only"
          type="file"
          accept=".json,application/json"
          onChange={(event) => void restore(event.target.files?.[0])}
        />
      </div>
      {preview && (
        <div className="modal-backdrop">
          <section
            className="modal import-preview"
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-title"
          >
            <div className="modal-heading">
              <div>
                <p className="eyebrow">Revisión</p>
                <h2 id="import-title">Importar movimientos</h2>
              </div>
              <button
                className="icon-button"
                onClick={() => setPreview(undefined)}
                aria-label="Cerrar"
              >
                <X />
              </button>
            </div>
            <div className="import-stats">
              <div>
                <strong>{preview.accepted.length}</strong>
                <span>válidos</span>
              </div>
              <div>
                <strong>{preview.duplicateCount}</strong>
                <span>duplicados omitidos</span>
              </div>
              <div>
                <strong>{preview.rejected.length}</strong>
                <span>rechazados</span>
              </div>
            </div>
            {preview.rejected.length > 0 && (
              <ul className="rejected-list">
                {preview.rejected.map((item) => (
                  <li key={item.row}>
                    Fila {item.row}: {item.reason}
                  </li>
                ))}
              </ul>
            )}
            <div className="form-actions">
              <button className="button ghost" onClick={() => setPreview(undefined)}>
                Cancelar
              </button>
              <button
                className="button primary"
                disabled={!preview.accepted.length}
                onClick={() => {
                  props.onImportMovements(preview.accepted);
                  props.onNotify(`${preview.accepted.length} movimientos importados.`);
                  setPreview(undefined);
                }}
              >
                Importar válidos
              </button>
            </div>
          </section>
        </div>
      )}
      {confirmClear && (
        <div className="modal-backdrop">
          <section className="confirm-dialog" role="alertdialog" aria-modal="true">
            <Trash2 />
            <h2>Borrar todos los datos</h2>
            <p>
              Se eliminarán movimientos, presupuestos, categorías personalizadas y metas. Escribe{' '}
              <strong>BORRAR</strong> para confirmar.
            </p>
            <input
              value={clearPhrase}
              onChange={(event) => setClearPhrase(event.target.value)}
              aria-label="Confirmación para borrar"
              placeholder="BORRAR"
              autoFocus
            />
            <div className="form-actions">
              <button
                className="button ghost"
                onClick={() => {
                  setConfirmClear(false);
                  setClearPhrase('');
                }}
              >
                Cancelar
              </button>
              <button
                className="button danger"
                disabled={clearPhrase !== 'BORRAR'}
                onClick={() => {
                  props.onClearData();
                  setConfirmClear(false);
                  setClearPhrase('');
                  props.onNotify('Todos los datos fueron eliminados.');
                }}
              >
                Borrar definitivamente
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
