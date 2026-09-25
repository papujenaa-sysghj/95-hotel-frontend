import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentApi } from '../../services/payment.api';
import { bookingApi } from '../../services/booking.api';
import { useUI } from '../../store/ui';
import { PageHeader, Card, DataTable, QueryBoundary, Tabs, Badge, Pager, EmptyState } from '../../components/common/ui';
import { fmtDateTime, money, humanize } from '../../utils/format';

export default function PaymentsPage() {
  const open = useUI((s) => s.openBooking); const [tab, setTab] = useState('due'); const [method, setMethod] = useState(''); const [page, setPage] = useState(1);
  const pays = useQuery({ queryKey: ['payments', method, page], queryFn: () => paymentApi.list({ method: method || undefined, page, limit: 25 }), enabled: tab === 'history', placeholderData: (p) => p });
  const due = useQuery({ queryKey: ['bookings', 'due'], queryFn: () => bookingApi.list({ status: 'confirmed,checked_in,hold', limit: 200 }), enabled: tab === 'due' });
  const owing = (due.data?.items || []).filter((b) => b.balanceAmount > 0);
  return <>
    <PageHeader title="Payments" subtitle="Collect balances and review every payment received." />
    <Tabs tabs={[{ key: 'due', label: 'Balances due' }, { key: 'history', label: 'Payment history' }]} value={tab} onChange={setTab} />
    {tab === 'due' ? <Card pad={false}><QueryBoundary q={due} isEmpty={!owing.length} empty={<EmptyState title="Nothing outstanding" message="All active bookings are paid in full." />}>
      <DataTable rows={owing} onRowClick={(b) => open(b._id)} columns={[{ key: 'n', header: 'Booking', render: (b) => <b>{b.bookingNumber}</b> }, { key: 'g', header: 'Guest', render: (b) => b.guest?.name }, { key: 'r', header: 'Room', render: (b) => b.room?.roomNumber }, { key: 'p', header: 'Payment', render: (b) => <Badge status={b.paymentStatus} /> }, { key: 't', header: 'Total', render: (b) => money(b.totalAmount) }, { key: 'b', header: 'Balance', className: 'text-right', render: (b) => <b className="text-red-600">{money(b.balanceAmount)}</b> }]} /></QueryBoundary></Card> :
      <Card pad={false}><div className="border-b border-slate-100 p-4"><select className="input w-48" value={method} onChange={(e) => { setMethod(e.target.value); setPage(1); }} aria-label="Method"><option value="">All methods</option>{['cash', 'upi', 'card', 'bank_transfer', 'other'].map((m) => <option key={m} value={m}>{humanize(m)}</option>)}</select></div>
        <QueryBoundary q={pays} isEmpty={!pays.data?.items.length} empty={<EmptyState title="No payments recorded" />}><DataTable rows={pays.data?.items || []} columns={[{ key: 'id', header: 'Payment', render: (p) => <b>{p.paymentId}</b> }, { key: 'b', header: 'Booking', render: (p) => p.booking?.bookingNumber }, { key: 'g', header: 'Guest', render: (p) => p.guest?.name }, { key: 'm', header: 'Method', render: (p) => humanize(p.method) }, { key: 'd', header: 'Date', render: (p) => fmtDateTime(p.paidAt) }, { key: 'u', header: 'Received by', render: (p) => p.receivedBy?.name }, { key: 'a', header: 'Amount', className: 'text-right', render: (p) => <b className={p.type === 'refund' ? 'text-red-600' : ''}>{p.type === 'refund' ? '− ' : ''}{money(p.amount)}</b> }]} />
          <Pager page={page} total={pays.data?.total || 0} limit={25} onPage={setPage} /></QueryBoundary></Card>}</>;
}
