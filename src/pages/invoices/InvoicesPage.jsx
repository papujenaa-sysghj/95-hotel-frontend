import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Printer, Download, Search, FileText, Eye } from 'lucide-react';
import { bookingApi } from '../../services/booking.api';
import { openPdf, downloadFile, errMsg } from '../../services/api';
import { toast } from '../../store/toast';
import { useUI } from '../../store/ui';
import { PageHeader, Card, DataTable, QueryBoundary, Badge, Pager, EmptyState, cx } from '../../components/common/ui';
import { fmtDate, money } from '../../utils/format';

export default function InvoicesPage() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const openBooking = useUI((s) => s.openBooking);

  const list = useQuery({
    queryKey: ['bookings', 'invoices', q, page],
    queryFn: () =>
      bookingApi.list({
        q: q || undefined,
        status: 'confirmed,checked_in,checked_out',
        page,
        limit: 20,
      }),
    placeholderData: (p) => p,
  });

  const run = (fn) => fn().catch((e) => toast.error(errMsg(e, 'Could not generate the invoice.')));

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        title="Invoices"
        subtitle="Print, view, or download PDF tax invoices for any guest booking."
      />

      <Card pad={false}>
        <div className="border-b border-slate-100 p-3 sm:p-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              className="input pl-9 text-xs"
              placeholder="Guest, phone, booking ID or room"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              aria-label="Search invoices"
            />
          </div>
        </div>

        <QueryBoundary
          q={list}
          isEmpty={!list.data?.items?.length}
          empty={<EmptyState title="No bookings to invoice" />}
        >
          {/* Mobile Invoices Card View (< md) */}
          <div className="divide-y divide-slate-100 md:hidden">
            {(list.data?.items || []).map((b) => (
              <div key={b._id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-blue-600 text-xs">{b.bookingNumber}</span>
                      <Badge status={b.paymentStatus} />
                    </div>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{b.guest?.name || 'Guest'}</p>
                    <p className="text-xs text-slate-500">
                      Room {b.room?.roomNumber || 'TBD'} · {fmtDate(b.checkInDate, 'dd MMM')} → {fmtDate(b.checkOutDate, 'dd MMM')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900 text-base">{money(b.totalAmount)}</p>
                    <p className="text-[10px] text-slate-400">Total Bill</p>
                  </div>
                </div>

                {/* Mobile Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => openBooking(b._id)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 min-h-[40px]"
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </button>
                  <button
                    onClick={() => run(() => openPdf(`/invoices/${b._id}/pdf`))}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 min-h-[40px]"
                  >
                    <Printer className="h-3.5 w-3.5" /> Print
                  </button>
                  <button
                    onClick={() => run(() => downloadFile(`/invoices/${b._id}/pdf`, `invoice-${b.bookingNumber}.pdf`))}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-2xs min-h-[40px]"
                  >
                    <Download className="h-3.5 w-3.5" /> PDF
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table (>= md) */}
          <div className="hidden md:block">
            <DataTable
              rows={list.data?.items || []}
              columns={[
                { key: 'n', header: 'Booking', render: (b) => <b>{b.bookingNumber}</b> },
                { key: 'g', header: 'Guest', render: (b) => b.guest?.name },
                { key: 'r', header: 'Room', render: (b) => b.room?.roomNumber },
                {
                  key: 'd',
                  header: 'Stay',
                  render: (b) => `${fmtDate(b.checkInDate, 'dd MMM')} → ${fmtDate(b.checkOutDate, 'dd MMM')}`,
                },
                { key: 's', header: 'Payment', render: (b) => <Badge status={b.paymentStatus} /> },
                { key: 't', header: 'Total', render: (b) => <b>{money(b.totalAmount)}</b> },
                {
                  key: 'a',
                  header: '',
                  className: 'text-right',
                  render: (b) => (
                    <div className="flex justify-end gap-1.5">
                      <button className="btn-ghost btn-sm" onClick={() => run(() => openPdf(`/invoices/${b._id}/pdf`))}>
                        <Printer className="h-3.5 w-3.5" /> Print
                      </button>
                      <button
                        className="btn-ghost btn-sm"
                        onClick={() =>
                          run(() => downloadFile(`/invoices/${b._id}/pdf`, `invoice-${b.bookingNumber}.pdf`))
                        }
                      >
                        <Download className="h-3.5 w-3.5" /> PDF
                      </button>
                    </div>
                  ),
                },
              ]}
            />
          </div>

          <Pager page={page} total={list.data?.total || 0} limit={20} onPage={setPage} />
        </QueryBoundary>
      </Card>
    </div>
  );
}
