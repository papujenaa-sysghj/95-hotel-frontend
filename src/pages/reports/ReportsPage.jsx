import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import api, { unwrap, downloadFile, errMsg } from '../../services/api';
import { toast } from '../../store/toast';
import { PageHeader, Card, DataTable, QueryBoundary, Tabs, EmptyState, Field } from '../../components/common/ui';
import { humanize, iso, today, addDays, money } from '../../utils/format';

const TYPES = [['occupancy', 'Occupancy'], ['revenue', 'Revenue'], ['bookings', 'Bookings'], ['discounts', 'Discounts'], ['payments', 'Payments'], ['rooms', 'Rooms'], ['staff', 'Staff']];
const MONEY = ['collected', 'refunded', 'net', 'amount', 'revenue', 'paymentsCollected', 'discount', 'subtotal', 'totalAmount', 'discountsGiven'];
export default function ReportsPage() {
  const [type, setType] = useState('occupancy'); const [from, setFrom] = useState(iso(addDays(today(), -30))); const [to, setTo] = useState(iso(addDays(today(), 1))); const [group, setGroup] = useState('day');
  const params = { from, to, group };
  const q = useQuery({ queryKey: ['report', type, params], queryFn: () => unwrap(api.get(`/reports/${type}`, { params })) });
  const exp = (format) => downloadFile(`/reports/${type}?${new URLSearchParams({ ...params, format })}`, `${type}-report.${format}`).catch((e) => toast.error(errMsg(e, 'Export failed.')));
  const d = q.data; const chartKey = type === 'occupancy' ? 'occupancyPct' : type === 'revenue' ? 'net' : null;
  return <>
    <PageHeader title="Reports" subtitle="Pick a report and a date range, then export it." actions={<><button className="btn-ghost" onClick={() => exp('csv')}><Download className="h-4 w-4" />CSV</button><button className="btn-ghost" onClick={() => exp('pdf')}><FileText className="h-4 w-4" />PDF</button></>} />
    <Tabs tabs={TYPES.map(([key, label]) => ({ key, label }))} value={type} onChange={setType} />
    <div className="mb-4 grid gap-3 sm:grid-cols-4"><Field label="From"><input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} /></Field><Field label="To"><input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
      {['occupancy', 'revenue'].includes(type) && <Field label="Group by"><select className="input" value={group} onChange={(e) => setGroup(e.target.value)}>{['day', 'week', 'month', 'year'].map((g) => <option key={g} value={g}>{humanize(g)}ly</option>)}</select></Field>}</div>
    <QueryBoundary q={q} isEmpty={!d?.rows.length} empty={<Card><EmptyState title="No data for this range" message="Try a wider date range." /></Card>}>
      {chartKey && <Card className="mb-4"><div className="h-56"><ResponsiveContainer><BarChart data={d?.rows}><CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" /><XAxis dataKey="period" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip formatter={(v) => (type === 'revenue' ? money(v) : `${v}%`)} /><Bar dataKey={chartKey} fill="#2563EB" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>}
      <Card pad={false}><DataTable rowKey="__i" rows={(d?.rows || []).map((r, i) => ({ ...r, __i: i }))} columns={(d?.columns || []).map((c) => ({ key: c, header: humanize(c.replace(/([A-Z])/g, ' $1')), className: MONEY.includes(c) ? 'text-right' : '', render: (r) => (MONEY.includes(c) ? money(r[c]) : c === 'occupancyPct' ? `${r[c]}%` : typeof r[c] === 'string' ? humanize(r[c]) : r[c]) }))} /></Card></QueryBoundary></>;
}
