import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, ChevronRight, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { paymentApi } from '../../services/payment.api';
import { bookingApi } from '../../services/booking.api';
import { useUI } from '../../store/ui';
import { PageHeader, Card, DataTable, QueryBoundary, Tabs, Badge, Pager, EmptyState, cx } from '../../components/common/ui';
import { fmtDateTime, fmtDate, money, humanize } from '../../utils/format';

export default function PaymentsPage() {
  const open = useUI((s) => s.openBooking);
  const [tab, setTab] = useState('due');
  const [method, setMethod] = useState('');
  const [page, setPage] = useState(1);

  const pays = useQuery({
    queryKey: ['payments', method, page],
    queryFn: () => paymentApi.list({ method: method || undefined, page, limit: 25 }),
    enabled: tab === 'history',
    placeholderData: (p) => p,
  });

  const due = useQuery({
    queryKey: ['bookings', 'due'],
    queryFn: () => bookingApi.list({ status: 'confirmed,checked_in,hold', limit: 200 }),
    enabled: tab === 'due',
  });

  const owing = (due.data?.items || []).filter((b) => b.balanceAmount > 0);

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        title="Payments"
        subtitle="Collect balances and review every payment received across cash, UPI, card, and bank transfers."
      />

      <Tabs
        tabs={[
          { key: 'due', label: `Balances Due (${owing.length})` },
          { key: 'history', label: 'Payment History' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'due' ? (
        <Card pad={false}>
          <QueryBoundary
            q={due}
            isEmpty={!owing.length}
            empty={<EmptyState title="Nothing outstanding" message="All active bookings are paid in full." />}
          >
            {/* Mobile Balances Due Cards (< md) */}
            <div className="divide-y divide-slate-100 md:hidden">
              {owing.map((b) => (
                <div
                  key={b._id}
                  onClick={() => open(b._id)}
                  className="flex items-center justify-between p-4 active:bg-slate-50 transition cursor-pointer"
                >
                  <div className="space-y-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-blue-600 text-xs">{b.bookingNumber}</span>
                      <Badge status={b.paymentStatus} />
                    </div>
                    <p className="font-bold text-slate-900 text-sm truncate">{b.guest?.name || 'Guest'}</p>
                    <p className="text-xs text-slate-500">
                      Room {b.room?.roomNumber || 'TBD'} · Total {money(b.totalAmount)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] font-bold text-slate-400">Balance Due</p>
                    <p className="font-black text-rose-600 text-base">{money(b.balanceAmount)}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        open(b._id);
                      }}
                      className="mt-1 rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-extrabold text-blue-700"
                    >
                      Collect Pay
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (>= md) */}
            <div className="hidden md:block">
              <DataTable
                rows={owing}
                onRowClick={(b) => open(b._id)}
                columns={[
                  { key: 'n', header: 'Booking', render: (b) => <b>{b.bookingNumber}</b> },
                  { key: 'g', header: 'Guest', render: (b) => b.guest?.name },
                  { key: 'r', header: 'Room', render: (b) => b.room?.roomNumber },
                  { key: 'p', header: 'Payment', render: (b) => <Badge status={b.paymentStatus} /> },
                  { key: 't', header: 'Total', render: (b) => money(b.totalAmount) },
                  {
                    key: 'b',
                    header: 'Balance',
                    className: 'text-right',
                    render: (b) => <b className="text-red-600">{money(b.balanceAmount)}</b>,
                  },
                ]}
              />
            </div>
          </QueryBoundary>
        </Card>
      ) : (
        <Card pad={false}>
          <div className="border-b border-slate-100 p-3 sm:p-4">
            <select
              className="input w-full sm:w-48 text-xs font-bold"
              value={method}
              onChange={(e) => {
                setMethod(e.target.value);
                setPage(1);
              }}
              aria-label="Method"
            >
              <option value="">All payment methods</option>
              {['cash', 'upi', 'card', 'bank_transfer', 'other'].map((m) => (
                <option key={m} value={m}>
                  {humanize(m)}
                </option>
              ))}
            </select>
          </div>

          <QueryBoundary
            q={pays}
            isEmpty={!pays.data?.items?.length}
            empty={<EmptyState title="No payments recorded" />}
          >
            {/* Mobile Payment History Cards (< md) */}
            <div className="divide-y divide-slate-100 md:hidden">
              {(pays.data?.items || []).map((p) => {
                const isRefund = p.type === 'refund';
                return (
                  <div key={p._id || p.paymentId} className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-blue-600 text-xs">{p.paymentId}</span>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                            {humanize(p.method)}
                          </span>
                        </div>
                        <p className="font-bold text-slate-900 text-sm mt-0.5">{p.guest?.name || 'Guest'}</p>
                        {p.booking?.bookingNumber && (
                          <p className="text-[11px] text-slate-500 font-semibold">Booking: {p.booking.bookingNumber}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={cx('font-black text-base', isRefund ? 'text-rose-600' : 'text-emerald-700')}>
                          {isRefund ? '− ' : '+ '}{money(p.amount)}
                        </p>
                        <p className="text-[10px] text-slate-400">{fmtDateTime(p.paidAt)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table (>= md) */}
            <div className="hidden md:block">
              <DataTable
                rows={pays.data?.items || []}
                columns={[
                  { key: 'id', header: 'Payment', render: (p) => <b>{p.paymentId}</b> },
                  { key: 'b', header: 'Booking', render: (p) => p.booking?.bookingNumber },
                  { key: 'g', header: 'Guest', render: (p) => p.guest?.name },
                  { key: 'm', header: 'Method', render: (p) => humanize(p.method) },
                  { key: 'd', header: 'Date', render: (p) => fmtDateTime(p.paidAt) },
                  { key: 'u', header: 'Received by', render: (p) => p.receivedBy?.name },
                  {
                    key: 'a',
                    header: 'Amount',
                    className: 'text-right',
                    render: (p) => (
                      <b className={p.type === 'refund' ? 'text-red-600' : 'text-emerald-700'}>
                        {p.type === 'refund' ? '− ' : ''}
                        {money(p.amount)}
                      </b>
                    ),
                  },
                ]}
              />
            </div>

            <Pager page={page} total={pays.data?.total || 0} limit={25} onPage={setPage} />
          </QueryBoundary>
        </Card>
      )}
    </div>
  );
}
