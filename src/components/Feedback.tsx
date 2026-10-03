import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import type { Movement } from '../types';

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="toast" role="status">
      <CheckCircle2 />
      <span>{message}</span>
      <button onClick={onClose} aria-label="Cerrar aviso">
        <X />
      </button>
    </div>
  );
}

interface ConfirmDeleteProps {
  movement: Movement;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDelete({ movement, onConfirm, onCancel }: ConfirmDeleteProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
      >
        <AlertTriangle />
        <h2 id="confirm-title">Eliminar movimiento</h2>
        <p id="confirm-description">
          Se eliminará “{movement.description}”. Esta acción no se puede deshacer.
        </p>
        <div className="form-actions">
          <button className="button ghost" onClick={onCancel}>
            Cancelar
          </button>
          <button className="button danger" onClick={onConfirm}>
            Eliminar
          </button>
        </div>
      </section>
    </div>
  );
}
