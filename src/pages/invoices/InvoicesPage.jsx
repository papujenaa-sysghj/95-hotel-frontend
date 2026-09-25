import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Printer, Download, Search } from 'lucide-react';
import { bookingApi } from '../../services/booking.api';
import { openPdf, downloadFile, errMsg } from '../../services/api';
import { toast } from '../../store/toast';
import { PageHeader, Card, DataTable, QueryBoundary, Badge, Pager, EmptyState } from '../../components/common/ui';
import { fmtDate, money } from '../../utils/format';

export default function InvoicesPage() {
  const [q, setQ] = useState(''); const [page, setPage] = useState(1);
  const list = useQuery({ queryKey: ['bookings', 'invoices', q, page], queryFn: () => bookingApi.list({ q: q || undefined, status: 'confirmed,checked_in,checked_out', page, limit: 20 }), placeholderData: (p) => p });
  const run = (fn) => fn().catch((e) => toast.error(errMsg(e, 'Could not generate the invoice.')));
  return <>
    <PageHeader title="Invoices" subtitle="Print or download the invoice for any booking." />
    <Card pad={false}><div className="border-b border-slate-100 p-4"><div className="relative max-w-sm"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input className="input pl-9" placeholder="Guest, phone, booking ID or room" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} aria-label="Search invoices" /></div></div>
      <QueryBoundary q={list} isEmpty={!list.data?.items.length} empty={<EmptyState title="No bookings to invoice" />}>
        <DataTable rows={list.data?.items || []} columns={[{ key: 'n', header: 'Booking', render: (b) => <b>{b.bookingNumber}</b> }, { key: 'g', header: 'Guest', render: (b) => b.guest?.name }, { key: 'r', header: 'Room', render: (b) => b.room?.roomNumber }, { key: 'd', header: 'Stay', render: (b) => `${fmtDate(b.checkInDate, 'dd MMM')} → ${fmtDate(b.checkOutDate, 'dd MMM')}` }, { key: 's', header: 'Payment', render: (b) => <Badge status={b.paymentStatus} /> }, { key: 't', header: 'Total', render: (b) => <b>{money(b.totalAmount)}</b> },
          { key: 'a', header: '', className: 'text-right', render: (b) => <div className="flex justify-end gap-1.5"><button className="btn-ghost btn-sm" onClick={() => run(() => openPdf(`/invoices/${b._id}/pdf`))}><Printer className="h-3.5 w-3.5" />Print</button><button className="btn-ghost btn-sm" onClick={() => run(() => downloadFile(`/invoices/${b._id}/pdf`, `invoice-${b.bookingNumber}.pdf`))}><Download className="h-3.5 w-3.5" />PDF</button></div> }]} />
        <Pager page={page} total={list.data?.total || 0} limit={20} onPage={setPage} /></QueryBoundary></Card></>;
}
