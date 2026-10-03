import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { Category } from '../types';
import { PageTitle } from './PageTitle';

interface Props {
  categories: Category[];
  onCreate: (category: Category) => Promise<Category>;
  onUpdate: (category: Category) => void;
  onDelete: (id: string) => void;
}

export function CategoriesPanel({ categories, onCreate, onUpdate, onDelete }: Props) {
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    setError('');
    try {
      await onCreate({ id: '', name: trimmed, isDefault: false });
      setName('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo crear la categoría.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="content">
      <PageTitle
        eyebrow="Organización"
        title="Categorías"
        description="Administra tus categorías personalizadas."
      />
      <form className="inline-create" onSubmit={(event) => void create(event)}>
        <input
          value={name}
          maxLength={40}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nueva categoría"
          aria-label="Nueva categoría"
          required
        />
        <button className="button primary" type="submit" disabled={busy}>
          <Plus /> Agregar
        </button>
      </form>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <ul className="category-list" aria-label="Categorías">
        {categories.map((category) => (
          <li key={category.id}>
            {editingId === category.id ? (
              <>
                <input
                  value={editingName}
                  maxLength={40}
                  onChange={(event) => setEditingName(event.target.value)}
                  aria-label={`Nombre de ${category.name}`}
                />
                <button
                  className="icon-button"
                  aria-label="Guardar categoría"
                  onClick={() => {
                    onUpdate({ ...category, name: editingName.trim() });
                    setEditingId(null);
                  }}
                >
                  <Check />
                </button>
                <button
                  className="icon-button"
                  aria-label="Cancelar edición"
                  onClick={() => setEditingId(null)}
                >
                  <X />
                </button>
              </>
            ) : (
              <>
                <span>
                  {category.name}
                  {category.isDefault ? <small>Inicial</small> : null}
                </span>
                {!category.isDefault && (
                  <div className="category-actions">
                    <button
                      className="icon-button"
                      aria-label={`Editar ${category.name}`}
                      onClick={() => {
                        setEditingId(category.id);
                        setEditingName(category.name);
                      }}
                    >
                      <Pencil />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`Eliminar ${category.name}`}
                      onClick={() => {
                        if (window.confirm(`¿Eliminar la categoría «${category.name}»?`))
                          onDelete(category.id);
                      }}
                    >
                      <Trash2 />
                    </button>
                  </div>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
