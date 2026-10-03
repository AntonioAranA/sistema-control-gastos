import { DatabaseBackup, X } from 'lucide-react';
import { useState } from 'react';
import type { AppData } from '../types';

interface Props {
  data: AppData;
  onImport: (data: AppData) => Promise<void>;
  onImported: () => void;
  onDismiss: () => void;
}
export function LocalDataImport({ data, onImport, onImported, onDismiss }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const count = data.movements.length;
  return (
    <aside className="local-import" aria-label="Datos locales encontrados">
      <DatabaseBackup />
      <div>
        <strong>Encontramos datos guardados en este navegador</strong>
        <p>
          {count} movimiento{count === 1 ? '' : 's'}, presupuestos y metas pueden importarse a tu
          cuenta. No se borrarán hasta completar la operación.
        </p>
        {error && <span role="alert">{error}</span>}
      </div>
      <button
        className="button primary"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          void onImport(data)
            .then(onImported)
            .catch((cause) => {
              setError(cause instanceof Error ? cause.message : 'No fue posible importar');
              setBusy(false);
            });
        }}
      >
        {busy ? 'Importando…' : 'Importar ahora'}
      </button>
      <button className="icon-button" onClick={onDismiss} aria-label="Cerrar aviso">
        <X />
      </button>
    </aside>
  );
}
