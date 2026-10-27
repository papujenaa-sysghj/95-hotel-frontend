import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Download,
  FileText,
  Calendar,
  DollarSign,
  TrendingUp,
  CreditCard,
  BedDouble,
  Receipt,
  Users,
  Search,
  Filter,
  CheckCircle2,
  CalendarRange,
  Percent,
  LayoutGrid,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import api, { unwrap, downloadFile, errMsg } from '../../services/api';
import { toast } from '../../store/toast';
import { PageHeader, Card, DataTable, QueryBoundary, Tabs, EmptyState, Field, Stat, Badge } from '../../components/common/ui';
import { humanize, iso, today, addDays, money } from '../../utils/format';

const REPORT_TABS = [
  { key: 'daywise', label: '📅 Day-Wise Audit', desc: 'Daily room occupancy, check-ins, revenues, taxes, and cashflow' },
  { key: 'monthly', label: '📆 Monthly Summary', desc: 'Consolidated month-by-month financial, ADR, RevPAR, and occupancy report' },
  { key: 'bookings', label: '📋 A-Z Bookings', desc: 'Comprehensive itemized registry of all guest bookings and stay charges' },
  { key: 'tax', label: '🧾 GST & Tax', desc: 'Taxable values, CGST, SGST, and total GST tax breakdown' },
  { key: 'payments', label: '💳 Payments Ledger', desc: 'Transactions by Cash, UPI, Card, settlements and refunds' },
  { key: 'occupancy', label: '🏨 Occupancy', desc: 'Occupancy percentages and room night trends' },
  { key: 'revenue', label: '💰 Revenue', desc: 'Gross billed vs net collected trends' },
  { key: 'rooms', label: '🚪 Room Matrix', desc: 'Performance and revenue breakdown by individual room and type' },
  { key: 'discounts', label: '🏷️ Discounts', desc: 'Discounts given and authorized staff records' },
  { key: 'staff', label: '👥 Staff Performance', desc: 'Bookings created, collections, and staff activity' },
];

const MONEY_COLUMNS = new Set([
  'collected',
  'refunded',
  'net',
  'amount',
  'revenue',
  'roomRevenue',
  'extraCharges',
  'extraRevenue',
  'totalRevenue',
  'grossBilled',
  'netCollected',
  'netRevenue',
  'balancePending',
  'balanceAmount',
  'taxableAmount',
  'totalTax',
  'cgst',
  'sgst',
  'invoiceAmount',
  'paymentsCollected',
  'discount',
  'discountsGiven',
  'subtotal',
  'totalAmount',
  'paidAmount',
  'adr',
  'revPar',
  'roomRate',
]);

export default function ReportsPage() {
  const [type, setType] = useState('daywise');
  
  // Date range defaults to current month
  const now = new Date();
  const firstDayOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const firstDayOfNextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  
  const [from, setFrom] = useState(iso(firstDayOfMonth));
  const [to, setTo] = useState(iso(firstDayOfNextMonth));
  const [group, setGroup] = useState('day');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('this_month');

  // Quick preset handlers
  const applyPreset = (presetKey) => {
    setSelectedPreset(presetKey);
    const curr = today();
    if (presetKey === 'today') {
      setFrom(iso(curr));
      setTo(iso(addDays(curr, 1)));
    } else if (presetKey === 'yesterday') {
      setFrom(iso(addDays(curr, -1)));
      setTo(iso(curr));
    } else if (presetKey === 'last_7') {
      setFrom(iso(addDays(curr, -7)));
      setTo(iso(addDays(curr, 1)));
    } else if (presetKey === 'this_month') {
      setFrom(iso(new Date(Date.UTC(curr.getUTCFullYear(), curr.getUTCMonth(), 1))));
      setTo(iso(new Date(Date.UTC(curr.getUTCFullYear(), curr.getUTCMonth() + 1, 1))));
    } else if (presetKey === 'last_month') {
      setFrom(iso(new Date(Date.UTC(curr.getUTCFullYear(), curr.getUTCMonth() - 1, 1))));
      setTo(iso(new Date(Date.UTC(curr.getUTCFullYear(), curr.getUTCMonth(), 1))));
    } else if (presetKey === 'this_year') {
      setFrom(iso(new Date(Date.UTC(curr.getUTCFullYear(), 0, 1))));
      setTo(iso(new Date(Date.UTC(curr.getUTCFullYear() + 1, 0, 1))));
    }
  };

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
  const rawRows = d?.rows || [];
  const columns = d?.columns || [];

  // Filter rows with search query
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rawRows;
    const qLower = searchQuery.toLowerCase();
    return rawRows.filter((r) =>
      Object.values(r).some((v) => String(v ?? '').toLowerCase().includes(qLower))
    );
  }, [rawRows, searchQuery]);

  // Aggregate KPI summary stats
  const summaryStats = useMemo(() => {
    let gross = 0;
    let net = 0;
    let nights = 0;
    let tax = 0;
    let discount = 0;
    let balance = 0;
    let bookingsCount = 0;

    filteredRows.forEach((r) => {
      gross += Number(r.grossBilled || r.totalAmount || r.totalRevenue || r.invoiceAmount || 0);
      net += Number(r.netCollected || r.netRevenue || r.net || (r.type === 'payment' ? r.amount : r.type === 'refund' ? -r.amount : 0));
      nights += Number(r.roomNights || r.roomNightsSold || r.nightsOccupied || r.nights || 0);
      tax += Number(r.tax || r.totalTax || 0);
      discount += Number(r.discount || r.discountsGiven || 0);
      balance += Number(r.balancePending || r.balanceAmount || 0);
      bookingsCount += Number(r.bookingsCount || r.checkIns || (r.bookingNumber ? 1 : 0));
    });

    return { gross, net, nights, tax, discount, balance, bookingsCount };
  }, [filteredRows]);

  // Column totals
  const columnTotals = useMemo(() => {
    const totals = {};
    columns.forEach((c) => {
      if (MONEY_COLUMNS.has(c) || ['roomNights', 'roomNightsSold', 'nightsOccupied', 'checkIns', 'checkOuts', 'nights', 'count', 'bookingsCreated', 'actions'].includes(c)) {
        totals[c] = filteredRows.reduce((sum, r) => sum + (Number(r[c]) || 0), 0);
      }
    });
    return totals;
  }, [filteredRows, columns]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <PageHeader
        title="A-to-Z Reports & Intelligence"
        subtitle="Comprehensive day-wise, monthly, and financial audit registers."
        actions={
          <div className="flex items-center gap-2">
            <button
              className="btn-ghost flex items-center gap-1.5 text-xs font-bold min-h-[40px] px-3.5 bg-white border border-slate-200 shadow-2xs hover:bg-slate-50"
              onClick={() => exp('csv')}
            >
              <Download className="h-4 w-4 text-emerald-600" /> Export CSV
            </button>
            <button
              className="btn-ghost flex items-center gap-1.5 text-xs font-bold min-h-[40px] px-3.5 bg-white border border-slate-200 shadow-2xs hover:bg-slate-50"
              onClick={() => exp('pdf')}
            >
              <FileText className="h-4 w-4 text-rose-600" /> Export PDF
            </button>
          </div>
        }
      />

      {/* Tabs Navigation */}
      <div className="overflow-x-auto pb-1 scrollbar-thin">
        <Tabs tabs={REPORT_TABS.map((t) => ({ key: t.key, label: t.label }))} value={type} onChange={setType} />
      </div>

      {/* Date Presets & Filter Panel */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
        {/* Quick Range Presets */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <CalendarRange className="h-4 w-4 text-brand-600" />
            <span>Quick Range:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              ['today', 'Today (Day-wise)'],
              ['yesterday', 'Yesterday'],
              ['last_7', 'Last 7 Days'],
              ['this_month', 'This Month'],
              ['last_month', 'Last Month'],
              ['this_year', 'This Year'],
            ].map(([pk, pLabel]) => (
              <button
                key={pk}
                onClick={() => applyPreset(pk)}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  selectedPreset === pk
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {pLabel}
              </button>
            ))}
          </div>
        </div>

        {/* Date Inputs & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="From Date">
            <input
              type="date"
              className="input text-xs font-bold"
              value={from}
              onChange={(e) => {
                setSelectedPreset('custom');
                setFrom(e.target.value);
              }}
            />
          </Field>
          <Field label="To Date">
            <input
              type="date"
              className="input text-xs font-bold"
              value={to}
              onChange={(e) => {
                setSelectedPreset('custom');
                setTo(e.target.value);
              }}
            />
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
            <Field label="Filter Search">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search table records..."
                  className="input pl-9 text-xs font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </Field>
          )}

          {['occupancy', 'revenue'].includes(type) && (
            <Field label="Filter Search">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search records..."
                  className="input pl-9 text-xs font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </Field>
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Stat
          label="Gross Invoiced"
          value={money(summaryStats.gross)}
          icon={DollarSign}
          tone="text-emerald-700 bg-emerald-50"
          hint="Total billed in range"
        />
        <Stat
          label="Net Collected"
          value={money(summaryStats.net)}
          icon={CreditCard}
          tone="text-blue-700 bg-blue-50"
          hint="Payments minus refunds"
        />
        <Stat
          label="Room Nights"
          value={summaryStats.nights}
          icon={BedDouble}
          tone="text-indigo-700 bg-indigo-50"
          hint="Occupied nights"
        />
        <Stat
          label="GST / Tax"
          value={money(summaryStats.tax)}
          icon={Receipt}
          tone="text-purple-700 bg-purple-50"
          hint="Taxes collected"
        />
        <Stat
          label="Discounts"
          value={money(summaryStats.discount)}
          icon={Percent}
          tone="text-amber-700 bg-amber-50"
          hint="Discounts granted"
        />
        <Stat
          label="Pending Due"
          value={money(summaryStats.balance)}
          icon={TrendingUp}
          tone="text-rose-700 bg-rose-50"
          hint="Outstanding balances"
        />
      </div>

      <QueryBoundary
        q={q}
        isEmpty={!rawRows.length}
        empty={
          <Card>
            <EmptyState title="No data records found" message="Try expanding the date range or selecting another preset." />
          </Card>
        }
      >
        {/* Visual Charts */}
        {type === 'daywise' && rawRows.length > 0 && (
          <Card title="Daily Financial & Occupancy Flow" className="mb-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(val, name) => [typeof val === 'number' && name !== 'Occupancy %' ? money(val) : `${val}%`, name]} />
                  <Legend />
                  <Bar dataKey="grossBilled" name="Gross Invoiced" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="netCollected" name="Net Collected" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="occupancyPct" name="Occupancy %" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {type === 'monthly' && rawRows.length > 0 && (
          <Card title="Monthly Revenue & ADR Performance" className="mb-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(val, name) => [typeof val === 'number' && name !== 'Occupancy %' ? money(val) : `${val}%`, name]} />
                  <Legend />
                  <Bar dataKey="grossBilled" name="Gross Invoiced" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="netRevenue" name="Net Revenue" fill="#059669" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="adr" name="ADR (Avg Daily Rate)" fill="#D97706" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {type === 'tax' && rawRows.length > 0 && (
          <Card title="Tax & GST Collection Flow" className="mb-4">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="bookingNumber" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(val, name) => [money(val), name]} />
                  <Legend />
                  <Bar dataKey="taxableAmount" name="Taxable Value" fill="#64748B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cgst" name="CGST" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="sgst" name="SGST" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="totalTax" name="Total GST" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Tabular Data Breakdown */}
        <Card
          title={
            <div className="flex items-center justify-between gap-2 w-full">
              <span>
                {REPORT_TABS.find((t) => t.key === type)?.label || humanize(type)} Breakdown
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Showing {filteredRows.length} of {rawRows.length} records
              </span>
            </div>
          }
          pad={false}
        >
          {filteredRows.length === 0 ? (
            <EmptyState
              title="No report data available for the selected period."
              message="Try selecting a different date range or filter preset."
            />
          ) : (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <DataTable
                rowKey="__i"
                rows={filteredRows.map((r, i) => ({ ...r, __i: i }))}
              columns={columns.map((c) => ({
                key: c,
                header: humanize(c.replace(/([A-Z])/g, ' $1')),
                className: MONEY_COLUMNS.has(c)
                  ? 'text-right font-extrabold text-slate-800'
                  : ['occupancyPct', 'taxPercent'].includes(c)
                  ? 'text-right font-bold text-slate-700'
                  : 'text-left',
                render: (r) => {
                  const val = r[c];
                  if (MONEY_COLUMNS.has(c)) return money(val);
                  if (c === 'occupancyPct' || c === 'taxPercent') return `${val ?? 0}%`;
                  if (c === 'customerName') {
                    return (
                      <div className="font-bold text-slate-900">
                        {val || 'Guest'}
                      </div>
                    );
                  }
                  if (c === 'mobileNo' || c === 'guestPhone') {
                    return (
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700 font-mono text-xs bg-slate-100 px-2 py-0.5 rounded-md">
                        📞 {val || '-'}
                      </span>
                    );
                  }
                  if (c === 'bookingNumber') {
                    return <span className="font-mono font-bold text-brand-700">{val}</span>;
                  }
                  if (c === 'bookingStatus' || c === 'paymentStatus' || c === 'currentStatus') {
                    return <Badge status={val} />;
                  }
                  if (typeof val === 'string') return val;
                  return val ?? '-';
                },
              }))}
            />

            {/* Grand Totals Footer Bar */}
            {filteredRows.length > 0 && (
              <div className="border-t-2 border-slate-300 bg-slate-100/80 px-4 py-3 font-black text-xs text-slate-900 flex items-center justify-between">
                <span>Total Summary ({filteredRows.length} rows):</span>
                <div className="flex flex-wrap gap-4 text-right">
                  {columns.map((c) => {
                    if (columnTotals[c] !== undefined) {
                      return (
                        <div key={c} className="text-xs">
                          <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px] mr-1">
                            {humanize(c)}:
                          </span>
                          <span className="font-extrabold text-slate-900">
                            {MONEY_COLUMNS.has(c) ? money(columnTotals[c]) : columnTotals[c].toLocaleString()}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
      </QueryBoundary>
    </div>
  );
}

