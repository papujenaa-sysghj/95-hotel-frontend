import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Search, Eye, FileText, ShieldCheck } from 'lucide-react';
import { bookingApi } from '../../services/booking.api';
import { openDocUrl } from '../../services/api';
import { useUI } from '../../store/ui';
import { PageHeader, Card, DataTable, QueryBoundary, Badge, Pager, EmptyState } from '../../components/common/ui';
import { fmtDate, money, STATUS } from '../../utils/format';

export default function BookingsPage() {
  const [sp] = useSearchParams();
  const open = useUI((s) => s.openBooking);
  const [f, setF] = useState({ q: '', status: sp.get('status') || '', paymentStatus: '' });
  const [page, setPage] = useState(1);

  const q = useQuery({
    queryKey: ['bookings', f, page],
    queryFn: () => bookingApi.list({ ...Object.fromEntries(Object.entries(f).filter(([, v]) => v)), page, limit: 20 }),
    placeholderData: (p) => p,
  });

  const set = (k) => (e) => {
    setF({ ...f, [k]: e.target.value });
    setPage(1);
  };

  return (
    <>
      <PageHeader title="All Bookings" subtitle="Comprehensive list of every reservation with guest identity documents." />
      <Card pad={false}>
        <div className="grid gap-2 border-b border-slate-100 p-4 sm:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Guest, phone, booking ID, room"
              value={f.q}
              onChange={set('q')}
              aria-label="Search bookings"
            />
          </div>
          <select className="input" value={f.status} onChange={set('status')} aria-label="Booking status">
            <option value="">All booking statuses</option>
            {['confirmed', 'hold', 'checked_in', 'checked_out', 'cancelled', 'no_show'].map((s) => (
              <option key={s} value={s}>
                {STATUS[s].label}
              </option>
            ))}
          </select>
          <select className="input" value={f.paymentStatus} onChange={set('paymentStatus')} aria-label="Payment status">
            <option value="">All payment statuses</option>
            {['pending', 'partial', 'paid', 'refunded'].map((s) => (
              <option key={s} value={s}>
                {STATUS[s].label}
              </option>
            ))}
          </select>
        </div>
        <QueryBoundary q={q} isEmpty={!q.data?.items.length} empty={<EmptyState title="No bookings found" message="Change the filters or create a new booking." />}>
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <DataTable
            rows={q.data?.items || []}
            onRowClick={(b) => open(b._id)}
            columns={[
              { key: 'n', header: 'Booking', render: (b) => <b>{b.bookingNumber}</b> },
              {
                key: 'g',
                header: 'Guest',
                render: (b) => (
                  <div>
                    <span className="font-bold text-slate-900">{b.guest?.name}</span>
                    <span className="block text-xs text-slate-500">{b.guest?.phone}</span>
                  </div>
                ),
              },
              {
                key: 'id',
                header: 'Identity Card / Aadhaar',
                render: (b) => {
                  const docUrl = b.guest?.idDocumentUrl;
                  const idType = b.guest?.idType || 'Aadhaar Card';
                  const idNum = b.guest?.idNumber;
                  if (docUrl) {
                    return (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDocUrl(docUrl);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-extrabold text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition shadow-2xs"
                        title="Click to view/download ID document"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="truncate max-w-[110px]">{idType}</span>
                        <Eye className="h-3 w-3 text-emerald-600 ml-0.5" />
                      </button>
                    );
                  }
                  if (idNum) {
                    return (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700">
                        <FileText className="h-3 w-3 text-slate-400" />
                        <span className="font-bold">{idType}:</span> {idNum}
                      </span>
                    );
                  }
                  return <span className="text-xs text-slate-400 italic">No document</span>;
                },
              },
              { key: 'r', header: 'Room', render: (b) => `${b.room?.roomNumber} · ${b.roomType?.name || ''}` },
              { key: 'd', header: 'Stay', render: (b) => `${fmtDate(b.checkInDate, 'dd MMM')} → ${fmtDate(b.checkOutDate, 'dd MMM')} (${b.nights}n)` },
              { key: 's', header: 'Status', render: (b) => <Badge status={b.bookingStatus} /> },
              { key: 'p', header: 'Payment', render: (b) => <Badge status={b.paymentStatus} /> },
              {
                key: 't',
                header: 'Total',
                className: 'text-right',
                render: (b) => (
                  <span>
                    <b>{money(b.totalAmount)}</b>
                    {Boolean(b.discount) && <span className="block text-xs font-bold text-emerald-600">-{money(b.discount)} off</span>}
                    {b.balanceAmount > 0 && <span className="block text-xs text-red-600">{money(b.balanceAmount)} due</span>}
                  </span>
                ),
              },
            ]}
          />
        </div>

        {/* Mobile Card List View (< md) */}
        <div className="divide-y divide-slate-100 md:hidden">
          {(q.data?.items || []).map((b) => (
            <div
              key={b._id}
              onClick={() => open(b._id)}
              className="p-4 active:bg-slate-50 transition-colors space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-black text-sm text-slate-900">{b.guest?.name || 'Guest'}</p>
                  <p className="text-xs font-bold text-blue-600">{b.bookingNumber}</p>
                </div>
                <Badge status={b.bookingStatus} />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Room</span>
                  <span className="font-bold text-slate-900">Room {b.room?.roomNumber || '—'}</span>
                  <span className="text-[11px] text-slate-500 block truncate">{b.roomType?.name}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Dates</span>
                  <span className="font-bold text-slate-900">{fmtDate(b.checkInDate, 'dd MMM')} → {fmtDate(b.checkOutDate, 'dd MMM')}</span>
                  <span className="text-[11px] text-slate-500 block">({b.nights} nights)</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <div>
                  <span className="font-black text-slate-900 text-sm">{money(b.totalAmount)}</span>
                  {b.balanceAmount > 0 && (
                    <span className="block text-[11px] font-bold text-red-600">{money(b.balanceAmount)} balance</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge status={b.paymentStatus} />
                  <button
                    onClick={(e) => { e.stopPropagation(); open(b._id); }}
                    className="btn-ghost btn-sm text-xs font-bold px-3 py-1.5"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Pager page={page} total={q.data?.total || 0} limit={20} onPage={setPage} />
      </QueryBoundary>
    </Card>
    </>
  );
}
