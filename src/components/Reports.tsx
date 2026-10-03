import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';
import { calculateSummary, movementsForMonth, spentByCategory } from '../lib/calculations';
import { formatCLP } from '../lib/format';
import { monthLabel, shiftMonth } from '../lib/date';
import type { Category, Movement } from '../types';

const colors = [
  '#b45309',
  '#78716c',
  '#0f766e',
  '#b91c1c',
  '#57534e',
  '#a16207',
  '#0369a1',
  '#6b7280'
];
export function Reports({
  movements,
  categories,
  month
}: {
  movements: Movement[];
  categories: Category[];
  month: string;
}) {
  const names = new Map(categories.map(({ id, name }) => [id, name]));
  const totals = spentByCategory(movementsForMonth(movements, month));
  const categoryData = Object.entries(totals)
    .map(([id, value]) => ({ name: names.get(id) ?? 'Otros', value }))
    .sort((a, b) => b.value - a.value);
  const months = Array.from({ length: 6 }, (_, index) => shiftMonth(month, index - 5));
  const monthlyData = months.map((item) => {
    const summary = calculateSummary(movementsForMonth(movements, item));
    return {
      month: monthLabel(item).split(' ')[0]?.slice(0, 3) ?? item,
      Gastos: summary.expense,
      Ingresos: summary.income
    };
  });
  const monthMovements = movementsForMonth(movements, month).filter(
    (item) => item.type === 'expense'
  );
  const fixedTotal = monthMovements
    .filter((item) => item.expenseNature === 'fixed')
    .reduce((sum, item) => sum + item.amount, 0);
  const variableTotal = monthMovements
    .filter((item) => item.expenseNature === 'variable')
    .reduce((sum, item) => sum + item.amount, 0);
  const topCategoryIds = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => id);
  const categoryTrendData = months.map((item) => {
    const monthTotals = spentByCategory(movementsForMonth(movements, item));
    return {
      month: monthLabel(item).split(' ')[0]?.slice(0, 3) ?? item,
      ...Object.fromEntries(topCategoryIds.map((id) => [names.get(id) ?? id, monthTotals[id] ?? 0]))
    };
  });
  if (categoryData.length === 0 && movements.length === 0)
    return (
      <div className="empty reports-empty">
        <p>Aún no hay datos para graficar.</p>
        <span>Carga datos de demostración o registra tus primeros movimientos.</span>
      </div>
    );
  return (
    <div className="reports-grid">
      <section className="expense-nature">
        <div>
          <span>Gastos fijos</span>
          <strong>{formatCLP(fixedTotal)}</strong>
        </div>
        <div>
          <span>Gastos variables</span>
          <strong>{formatCLP(variableTotal)}</strong>
        </div>
        <div className="nature-bar">
          <span
            style={{
              width: `${fixedTotal + variableTotal ? (fixedTotal / (fixedTotal + variableTotal)) * 100 : 0}%`
            }}
          />
        </div>
      </section>
      <section className="chart-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Distribución</p>
            <h2>Gastos por categoría</h2>
          </div>
        </div>
        {categoryData.length ? (
          <div className="pie-layout">
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={index} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCLP(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="legend">
              {categoryData.map((item, index) => (
                <li key={item.name}>
                  <span style={{ background: colors[index % colors.length] }} />
                  <div>
                    <strong>{item.name}</strong>
                    <small>{formatCLP(item.value)}</small>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="empty compact">
            <p>Sin gastos este mes.</p>
          </div>
        )}
      </section>
      <section className="chart-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Últimos seis meses</p>
            <h2>Evolución mensual</h2>
          </div>
        </div>
        <div className="line-chart">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={monthlyData} margin={{ top: 10, right: 12, bottom: 0, left: 5 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                opacity={0.12}
              />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis
                tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
                tickLine={false}
                axisLine={false}
                width={48}
              />
              <Tooltip formatter={(value) => formatCLP(Number(value))} />
              <Line
                type="monotone"
                dataKey="Gastos"
                stroke="#b91c1c"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="Ingresos"
                stroke="#0f766e"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="line-legend">
          <span>
            <i className="income-dot" />
            Ingresos
          </span>
          <span>
            <i className="expense-dot" />
            Gastos
          </span>
        </div>
      </section>
      {topCategoryIds.length > 0 && (
        <section className="chart-section category-trend">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Tendencia</p>
              <h2>Categorías principales</h2>
            </div>
          </div>
          <div className="line-chart">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={categoryTrendData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="currentColor"
                  opacity={0.12}
                />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis
                  tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                />
                <Tooltip formatter={(value) => formatCLP(Number(value))} />
                {topCategoryIds.map((id, index) => (
                  <Line
                    key={id}
                    type="monotone"
                    dataKey={names.get(id) ?? id}
                    stroke={colors[index]}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  );
}
