import { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CalendarPlus,
  Copy,
  Download,
  Edit3,
  Search,
  Trash2
} from 'lucide-react';
import {
  isMovementSort,
  isMovementTypeFilter,
  useMovementFilters
} from '../hooks/useMovementFilters';
import { formatDate } from '../lib/date';
import { formatCLP } from '../lib/format';
import type { Category, Movement } from '../types';
import { api } from '../lib/api';

interface MovementHistoryProps {
  movements: Movement[];
  categories: Category[];
  onEdit: (movement: Movement) => void;
  onDelete: (movement: Movement) => void;
  onDuplicate: (movement: Movement) => void;
  onMoveNextMonth: (movement: Movement) => void;
  onBulkDelete: (ids: string[]) => void;
  onBulkCategory: (ids: string[], categoryId: string) => void;
}

export function MovementHistory(props: MovementHistoryProps) {
  const {
    movements,
    categories,
    onEdit,
    onDelete,
    onDuplicate,
    onMoveNextMonth,
    onBulkDelete,
    onBulkCategory
  } = props;
  const {
    filters,
    filteredMovements,
    updateFilter,
    setDateRange,
    resetFilters,
    activeFilterCount
  } = useMovementFilters(movements, categories);
  const categoryNames = new Map(categories.map(({ id, name }) => [id, name]));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const pageSize = 25;
  const pageCount = Math.max(1, Math.ceil(filteredMovements.length / pageSize));
  const visible = filteredMovements.slice(
    (Math.min(page, pageCount) - 1) * pageSize,
    Math.min(page, pageCount) * pageSize
  );
  const toggleSelected = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <section className="history">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Detalle</p>
          <h2>Movimientos</h2>
        </div>
        <div className="history-meta">
          <span className="result-count">
            {filteredMovements.length} {filteredMovements.length === 1 ? 'registro' : 'registros'}
          </span>
          <button
            className="icon-button"
            aria-label="Exportar movimientos filtrados"
            title="Exportar estos resultados"
            onClick={() =>
              void api.downloadCsv({
                search: filters.search,
                from: filters.dateFrom,
                to: filters.dateTo,
                categoryId: filters.categoryId === 'all' ? '' : filters.categoryId,
                type: filters.type === 'all' ? '' : filters.type,
                expenseNature: filters.nature === 'all' ? '' : filters.nature,
                sortBy: filters.sort.startsWith('amount') ? 'amount' : 'date',
                sortOrder: filters.sort.endsWith('asc') ? 'asc' : 'desc'
              })
            }
          >
            <Download />
          </button>
        </div>
      </div>

      <button
        className="filter-toggle"
        onClick={() => setFiltersOpen((value) => !value)}
        aria-expanded={filtersOpen}
      >
        Filtros {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
      </button>
      <div className={`filters ${filtersOpen ? 'open' : ''}`}>
        <label className="search">
          <Search />
          <span className="sr-only">Buscar</span>
          <input
            value={filters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
            placeholder="Buscar descripción o categoría"
          />
        </label>
        <select
          aria-label="Filtrar por clasificación"
          value={filters.nature}
          onChange={(event) =>
            updateFilter(
              'nature',
              event.target.value === 'fixed'
                ? 'fixed'
                : event.target.value === 'variable'
                  ? 'variable'
                  : 'all'
            )
          }
        >
          <option value="all">Fijos y variables</option>
          <option value="fixed">Fijos</option>
          <option value="variable">Variables</option>
        </select>
        <select
          aria-label="Filtrar por tipo"
          value={filters.type}
          onChange={(event) => {
            if (isMovementTypeFilter(event.target.value)) updateFilter('type', event.target.value);
          }}
        >
          <option value="all">Todos los tipos</option>
          <option value="expense">Gastos</option>
          <option value="income">Ingresos</option>
        </select>
        <select
          aria-label="Filtrar por categoría"
          value={filters.categoryId}
          onChange={(event) => updateFilter('categoryId', event.target.value)}
        >
          <option value="all">Todas las categorías</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <DateFilter
          label="Desde"
          value={filters.dateFrom}
          onChange={(value) => updateFilter('dateFrom', value)}
        />
        <DateFilter
          label="Hasta"
          value={filters.dateTo}
          onChange={(value) => updateFilter('dateTo', value)}
        />
        <select
          aria-label="Ordenar movimientos"
          value={filters.sort}
          onChange={(event) => {
            if (isMovementSort(event.target.value)) updateFilter('sort', event.target.value);
          }}
        >
          <option value="date-desc">Más recientes</option>
          <option value="date-asc">Más antiguos</option>
          <option value="amount-desc">Mayor monto</option>
          <option value="amount-asc">Menor monto</option>
        </select>
      </div>
      <div className="quick-filters">
        <span>Período rápido:</span>
        <button
          onClick={() => {
            const today = new Date().toLocaleDateString('en-CA');
            setDateRange(today, today);
          }}
        >
          Hoy
        </button>
        <button
          onClick={() => {
            const now = new Date();
            const monday = new Date(now);
            monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
            setDateRange(monday.toLocaleDateString('en-CA'), now.toLocaleDateString('en-CA'));
          }}
        >
          Esta semana
        </button>
        <button onClick={() => setDateRange('', '')}>Todo</button>
        {activeFilterCount > 0 && (
          <button className="clear-filters" onClick={resetFilters}>
            Limpiar {activeFilterCount} filtro{activeFilterCount === 1 ? '' : 's'}
          </button>
        )}
      </div>

      {selected.size > 0 && (
        <div className="bulk-actions">
          <strong>{selected.size} seleccionados</strong>
          <select
            defaultValue=""
            aria-label="Cambiar categoría seleccionados"
            onChange={(event) => {
              if (event.target.value) {
                onBulkCategory([...selected], event.target.value);
                setSelected(new Set());
              }
            }}
          >
            <option value="" disabled>
              Cambiar categoría…
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <button
            className="button danger"
            onClick={() => {
              onBulkDelete([...selected]);
              setSelected(new Set());
            }}
          >
            Eliminar
          </button>
          <button className="button ghost" onClick={() => setSelected(new Set())}>
            Cancelar
          </button>
        </div>
      )}

      {filteredMovements.length === 0 ? (
        <div className="empty">
          <p>No hay movimientos que coincidan.</p>
          <span>Prueba ajustando los filtros o registra uno nuevo.</span>
        </div>
      ) : (
        <>
          <MovementTable
            movements={visible}
            categoryNames={categoryNames}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onMoveNextMonth={onMoveNextMonth}
            selected={selected}
            onToggleSelected={toggleSelected}
          />
          <MovementList
            movements={visible}
            categoryNames={categoryNames}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onMoveNextMonth={onMoveNextMonth}
            selected={selected}
            onToggleSelected={toggleSelected}
          />
          {pageCount > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
                Anterior
              </button>
              <span>
                Página {Math.min(page, pageCount)} de {pageCount}
              </span>
              <button disabled={page >= pageCount} onClick={() => setPage((value) => value + 1)}>
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

interface DateFilterProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function DateFilter({ label, value, onChange }: DateFilterProps) {
  return (
    <label className="date-filter">
      <span>{label}</span>
      <input type="date" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

interface MovementCollectionProps {
  movements: Movement[];
  categoryNames: Map<string, string>;
  onEdit: (movement: Movement) => void;
  onDelete: (movement: Movement) => void;
  onDuplicate: (movement: Movement) => void;
  onMoveNextMonth: (movement: Movement) => void;
  selected: Set<string>;
  onToggleSelected: (id: string) => void;
}

function MovementTable({
  movements,
  categoryNames,
  onEdit,
  onDelete,
  onDuplicate,
  onMoveNextMonth,
  selected,
  onToggleSelected
}: MovementCollectionProps) {
  return (
    <div className="movement-table">
      <table>
        <thead>
          <tr>
            <th>
              <span className="sr-only">Seleccionar</span>
            </th>
            <th>Fecha</th>
            <th>Descripción</th>
            <th>Categoría</th>
            <th>Tipo</th>
            <th className="number">Monto</th>
            <th>
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {movements.map((movement) => (
            <tr key={movement.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selected.has(movement.id)}
                  onChange={() => onToggleSelected(movement.id)}
                  aria-label={`Seleccionar ${movement.description}`}
                />
              </td>
              <td>{formatDate(movement.date)}</td>
              <td
                className="description"
                onDoubleClick={() => onEdit(movement)}
                title="Doble clic para editar"
              >
                {movement.description}
                {movement.notes && <small className="movement-note">{movement.notes}</small>}
              </td>
              <td>{categoryNames.get(movement.categoryId) ?? 'Sin categoría'}</td>
              <td>
                <MovementTypeLabel movement={movement} />
              </td>
              <td className={`number amount ${movement.type}`}>
                <SignedAmount movement={movement} />
              </td>
              <td>
                <MovementActions
                  movement={movement}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onDuplicate={onDuplicate}
                  onMoveNextMonth={onMoveNextMonth}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MovementList({
  movements,
  categoryNames,
  onEdit,
  onDelete,
  onDuplicate,
  onMoveNextMonth,
  selected,
  onToggleSelected
}: MovementCollectionProps) {
  return (
    <div className="movement-list">
      {movements.map((movement) => (
        <article key={movement.id}>
          <input
            type="checkbox"
            checked={selected.has(movement.id)}
            onChange={() => onToggleSelected(movement.id)}
            aria-label={`Seleccionar ${movement.description}`}
          />
          <div className="movement-main">
            <span className={`movement-mark ${movement.type}`} aria-hidden="true">
              {movement.type === 'income' ? <ArrowUp /> : <ArrowDown />}
            </span>
            <div>
              <strong>{movement.description}</strong>
              {movement.notes && <small className="movement-note">{movement.notes}</small>}
              <span>
                {formatDate(movement.date)} · {categoryNames.get(movement.categoryId)}
              </span>
            </div>
          </div>
          <div className="movement-side">
            <strong className={movement.type}>
              <SignedAmount movement={movement} />
            </strong>
            <MovementActions
              movement={movement}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onMoveNextMonth={onMoveNextMonth}
            />
          </div>
        </article>
      ))}
    </div>
  );
}

function MovementTypeLabel({ movement }: { movement: Movement }) {
  const isIncome = movement.type === 'income';
  return (
    <span className={`type-label ${movement.type}`}>
      {isIncome ? <ArrowUp /> : <ArrowDown />}
      {isIncome ? 'Ingreso' : 'Gasto'}
    </span>
  );
}

function SignedAmount({ movement }: { movement: Movement }) {
  return (
    <>
      {movement.type === 'income' ? '+' : '−'}
      {formatCLP(movement.amount)}
    </>
  );
}

function MovementActions({
  movement,
  onEdit,
  onDelete,
  onDuplicate,
  onMoveNextMonth
}: Omit<
  MovementCollectionProps,
  'movements' | 'categoryNames' | 'selected' | 'onToggleSelected'
> & { movement: Movement }) {
  return (
    <>
      <div className="row-actions">
        <button onClick={() => onEdit(movement)} aria-label={`Editar ${movement.description}`}>
          <Edit3 />
        </button>
        <button
          onClick={() => onDuplicate(movement)}
          aria-label={`Duplicar ${movement.description}`}
        >
          <Copy />
        </button>
        <button
          onClick={() => onMoveNextMonth(movement)}
          aria-label={`Copiar ${movement.description} al mes siguiente`}
        >
          <CalendarPlus />
        </button>
        <button onClick={() => onDelete(movement)} aria-label={`Eliminar ${movement.description}`}>
          <Trash2 />
        </button>
      </div>
      <details className="compact-actions">
        <summary aria-label={`Acciones para ${movement.description}`}>•••</summary>
        <div>
          <button onClick={() => onEdit(movement)}>
            <Edit3 />
            Editar
          </button>
          <button onClick={() => onDuplicate(movement)}>
            <Copy />
            Duplicar
          </button>
          <button onClick={() => onMoveNextMonth(movement)}>
            <CalendarPlus />
            Mes siguiente
          </button>
          <button onClick={() => onDelete(movement)}>
            <Trash2 />
            Eliminar
          </button>
        </div>
      </details>
    </>
  );
}
