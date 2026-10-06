import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText, BarChart3, Filter } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import api, { unwrap, downloadFile, errMsg } from '../../services/api';
import { toast } from '../../store/toast';
import { PageHeader, Card, DataTable, QueryBoundary, Tabs, EmptyState, Field } from '../../components/common/ui';
import { humanize, iso, today, addDays, money } from '../../utils/format';

const TYPES = [
  ['occupancy', 'Occupancy'],
  ['revenue', 'Revenue'],
  ['bookings', 'Bookings'],
  ['discounts', 'Discounts'],
  ['payments', 'Payments'],
  ['rooms', 'Rooms'],
  ['staff', 'Staff'],
];

const MONEY = [
  'collected',
  'refunded',
  'net',
  'amount',
  'revenue',
  'paymentsCollected',
  'discount',
  'subtotal',
  'totalAmount',
  'discountsGiven',
];

export default function ReportsPage() {
  const [type, setType] = useState('occupancy');
  const [from, setFrom] = useState(iso(addDays(today(), -30)));
  const [to, setTo] = useState(iso(addDays(today(), 1)));
  const [group, setGroup] = useState('day');

  const params = { from, to, group };
  const q = useQuery({
    queryKey: ['report', type, params],
    queryFn: () => unwrap(api.get(`/reports/${type}`, { params })),
  });

  const exp = (format) =>
    downloadFile(`/reports/${type}?${new URLSearchParams({ ...params, format })}`, `${type}-report.${format}`).catch(
      (e) => toast.error(errMsg(e, 'Export failed.'))
    );

  const d = q.data;
  const chartKey = type === 'occupancy' ? 'occupancyPct' : type === 'revenue' ? 'net' : null;

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        title="Reports"
        subtitle="Analyze occupancy, revenue, bookings, and financial performance."
        actions={
          <div className="flex items-center gap-2">
            <button className="btn-ghost flex items-center gap-1.5 text-xs font-bold min-h-[40px]" onClick={() => exp('csv')}>
              <Download className="h-4 w-4" /> CSV
            </button>
            <button className="btn-ghost flex items-center gap-1.5 text-xs font-bold min-h-[40px]" onClick={() => exp('pdf')}>
              <FileText className="h-4 w-4" /> PDF
            </button>
          </div>
        }
      />

      <Tabs tabs={TYPES.map(([key, label]) => ({ key, label }))} value={type} onChange={setType} />

      {/* Responsive Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="From Date">
            <input type="date" className="input text-xs font-bold" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="To Date">
            <input type="date" className="input text-xs font-bold" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
          {['occupancy', 'revenue'].includes(type) ? (
            <Field label="Group by">
              <select className="input text-xs font-bold" value={group} onChange={(e) => setGroup(e.target.value)}>
                {['day', 'week', 'month', 'year'].map((g) => (
                  <option key={g} value={g}>
                    {humanize(g)}ly
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <div className="hidden sm:block" />
          )}
        </div>
      </div>

      <QueryBoundary
        q={q}
        isEmpty={!d?.rows?.length}
        empty={
          <Card>
            <EmptyState title="No data for this range" message="Try selecting a wider date range." />
          </Card>
        }
      >
        {chartKey && (
          <Card title={`${humanize(type)} Overview`} className="mb-4">
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d?.rows || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                  <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    tickFormatter={(v) => (type === 'revenue' ? `${v / 1000}k` : `${v}%`)}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip formatter={(v) => (type === 'revenue' ? money(v) : `${v}%`)} />
                  <Bar dataKey={chartKey} fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        <Card title="Data Breakdown" pad={false}>
          <div className="overflow-x-auto">
            <DataTable
              rowKey="__i"
              rows={(d?.rows || []).map((r, i) => ({ ...r, __i: i }))}
              columns={(d?.columns || []).map((c) => ({
                key: c,
                header: humanize(c.replace(/([A-Z])/g, ' $1')),
                className: MONEY.includes(c) ? 'text-right font-extrabold' : '',
                render: (r) =>
                  MONEY.includes(c)
                    ? money(r[c])
                    : c === 'occupancyPct'
                    ? `${r[c]}%`
                    : typeof r[c] === 'string'
                    ? humanize(r[c])
                    : r[c],
              }))}
            />
          </div>
        </Card>
      </QueryBoundary>
    </div>
  );
}
