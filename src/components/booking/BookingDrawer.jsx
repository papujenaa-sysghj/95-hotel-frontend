import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BedDouble,
  LogOut,
  Pencil,
  ArrowRightLeft,
  CalendarPlus,
  CreditCard,
  Printer,
  Ban,
  Phone,
  Mail,
  User,
  Calendar,
  Clock,
  Moon,
  FileText,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { bookingApi } from '../../services/booking.api';
import { paymentApi } from '../../services/payment.api';
import { openPdf, openDocUrl, errMsg } from '../../services/api';
import { useUI } from '../../store/ui';
import { useCan } from '../../store/auth';
import { useMutate } from '../../hooks/useMutate';
import { toast } from '../../store/toast';
import { Drawer, Modal, Badge, Field, Spinner, ErrorState, Skeleton } from '../common/ui';
import { fmtDate, fmtDateTime, money, iso, utcDate, addDays } from '../../utils/format';

const KEYS = ['calendar', 'bookings', 'dashboard', 'arrivals', 'departures', 'payments', 'rooms', 'availability'];

export default function BookingDrawer() {
  const { bookingId, closeBooking } = useUI();
  const can = useCan();
  const [modal, setModal] = useState(null);

  const q = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingApi.get(bookingId),
    enabled: !!bookingId,
  });

  const b = q.data?.booking;
  const done = () => setModal(null);
  const inv = [...KEYS, 'booking'];

  const checkIn = useMutate(() => bookingApi.checkIn(bookingId), { success: 'Guest checked in', invalidate: inv });
  const noShow = useMutate(() => bookingApi.noShow(bookingId), { success: 'Marked as no-show', invalidate: inv, onSuccess: done });
  const active = b && ['hold', 'confirmed', 'checked_in'].includes(b.bookingStatus);

  return (
    <Drawer open={!!bookingId} onClose={closeBooking} title="" width="max-w-[560px]">
      {q.isLoading ? (
        <div className="space-y-4 p-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-2xl" />
          ))}
        </div>
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={q.refetch} />
      ) : (
        b && (
          <div className="space-y-5 pb-20 text-slate-800">
            {/* Header: Title & Status Pills */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-600 shadow-2xs">
                  <BedDouble className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 leading-tight">Booking Details</h2>
                  <p className="text-xs font-bold text-slate-400">{b.bookingNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Checked-in
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Pending
                </span>
              </div>
            </div>

            {/* Guest Header Card */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 shadow-2xs">
              <div className="flex items-center gap-3.5">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-700 font-black text-sm">
                  {b.guest?.name ? b.guest.name.split(' ').map((n) => n[0]).slice(0, 2).join('') : 'VS'}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">{b.guest?.name || 'Vikram Singh'}</h3>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs font-semibold text-slate-500">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-slate-400" />
                      {b.guest?.phone || '+91 98765 43210'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3 text-slate-400" />
                      {b.guest?.email || 'vikram@example.com'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Aadhaar / ID Proof Document Info Card */}
            {b.guest?.idDocumentUrl ? (
              <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-900">{b.guest?.idType || 'Aadhaar Card'} Document Attached</p>
                    <p className="text-[11px] font-semibold text-emerald-700">{b.guest?.idNumber ? `ID Number: ${b.guest.idNumber}` : 'Guest ID Proof Document'}</p>
                  </div>
                </div>
                <button
                  onClick={() => openDocUrl(b.guest.idDocumentUrl)}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-extrabold text-white hover:bg-emerald-700 shadow-2xs transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" /> View Aadhaar / ID Card
                </button>
              </div>
            ) : b.guest?.idNumber ? (
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-3 px-4 text-xs font-semibold text-slate-700">
                <span><b>{b.guest.idType || 'ID Proof'}:</b> {b.guest.idNumber}</span>
                <span className="text-[11px] text-slate-400 italic">No document file attached</span>
              </div>
            ) : null}

            {/* 4 Tile Grid: Room, Check-in, Check-out, Duration */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <BedDouble className="h-3.5 w-3.5 text-blue-600" /> Room
                </div>
                <p className="mt-1.5 text-sm font-black text-slate-900">{b.room?.roomNumber || '107'} · Floor {b.room?.floor || 1}</p>
                <p className="text-[11px] font-bold text-blue-600">{b.roomType?.name || 'Deluxe (AC)'}</p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <Calendar className="h-3.5 w-3.5 text-blue-600" /> Check-in
                </div>
                <p className="mt-1.5 text-sm font-black text-slate-900">{fmtDate(b.checkInDate, 'dd MMM yyyy')}</p>
                <p className="text-[11px] font-semibold text-slate-400">2:16 PM</p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <Calendar className="h-3.5 w-3.5 text-blue-600" /> Check-out
                </div>
                <p className="mt-1.5 text-sm font-black text-slate-900">{fmtDate(b.checkOutDate, 'dd MMM yyyy')}</p>
                <p className="text-[11px] font-semibold text-slate-400">2:16 PM</p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <Moon className="h-3.5 w-3.5 text-blue-600" /> Duration
                </div>
                <p className="mt-1.5 text-sm font-black text-slate-900">{b.nights || 3} Nights</p>
                <p className="text-[11px] font-semibold text-slate-500">{b.adults || 2} Adults, {b.children || 0} Children</p>
              </div>
            </div>

            {/* Financial Summary Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4.5 space-y-3.5 shadow-2xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <FileText className="h-4 w-4 text-blue-600" />
                <h4 className="text-sm font-extrabold text-slate-900">Financial Summary</h4>
              </div>

              <div className="space-y-2 text-xs font-medium text-slate-600">
                <div className="flex justify-between">
                  <span>Room Rate (per night)</span>
                  <span className="font-bold text-slate-900">{money(b.roomRate || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>× {b.nights || 1} Nights</span>
                  <span className="font-bold text-slate-900">{money((b.roomRate || 0) * (b.nights || 1))}</span>
                </div>
                {Boolean(b.extraBedCharge) && (
                  <div className="flex justify-between">
                    <span>Extra Bed</span>
                    <span className="font-bold text-slate-900">{money(b.extraBedCharge)}</span>
                  </div>
                )}
                {Boolean(b.otherCharges) && (
                  <div className="flex justify-between">
                    <span>Other Charges</span>
                    <span className="font-bold text-slate-900">{money(b.otherCharges)}</span>
                  </div>
                )}
                {Boolean(b.discount) && (
                  <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                    <span>Discount</span>
                    <span>- {money(b.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tax ({b.taxPercent || 0}%)</span>
                  <span className="font-bold text-slate-900">{money(b.tax || 0)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2 text-sm font-black text-slate-900">
                  <span>Total Amount</span>
                  <span>{money(b.totalAmount || 0)}</span>
                </div>
              </div>

              {/* Balance Due Banner */}
              <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 text-rose-900">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                  <div>
                    <p className="text-xs font-black text-rose-700">Balance Due</p>
                    <p className="text-[11px] font-semibold text-rose-500">Paid Amount: {money(b.paidAmount || 0)}</p>
                  </div>
                </div>
                <span className="text-lg font-black text-rose-600">{money(b.balanceAmount || 10080)}</span>
              </div>
            </div>

            {/* Meta / Audit Grid */}
            <div className="grid grid-cols-2 gap-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 text-xs">
              <div>
                <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Source</p>
                <p className="font-bold text-slate-800 capitalize mt-0.5">{b.source?.replace('_', ' ') || 'Reception'}</p>
              </div>
              <div>
                <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Created by</p>
                <p className="font-bold text-slate-800 mt-0.5">{b.createdBy?.name || 'Riya Sharma'}</p>
              </div>
              <div>
                <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Created</p>
                <p className="font-bold text-slate-800 mt-0.5">{fmtDateTime(b.createdAt) || '20 Sep 2026, 2:16 PM'}</p>
              </div>
              <div>
                <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Notes</p>
                <p className="font-bold text-slate-800 mt-0.5">{b.notes || 'DEMO Booking'}</p>
              </div>
            </div>

            {/* Quick Actions Header & Grid */}
            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-extrabold text-slate-900">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-2.5">
                {b.bookingStatus === 'checked_in' && can('checkout.perform') && (
                  <button
                    onClick={() => setModal('checkout')}
                    className="flex items-center justify-between rounded-xl bg-rose-600 p-3 text-xs font-bold text-white hover:bg-rose-700 shadow-xs transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <LogOut className="h-4 w-4" /> Check out
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
                {active && can('bookings.edit') && (
                  <button
                    onClick={() => setModal('edit')}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                  >
                    <Pencil className="h-4 w-4 text-blue-600" /> Edit booking
                  </button>
                )}
                {active && can('bookings.edit') && (
                  <button
                    onClick={() => setModal('room')}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                  >
                    <ArrowRightLeft className="h-4 w-4 text-blue-600" /> Change room
                  </button>
                )}
                {active && can('bookings.edit') && (
                  <button
                    onClick={() => setModal('extend')}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                  >
                    <CalendarPlus className="h-4 w-4 text-blue-600" /> Extend / shorten stay
                  </button>
                )}
                {b.bookingStatus !== 'cancelled' && can('payments.create') && b.balanceAmount > 0 && (
                  <button
                    onClick={() => setModal('pay')}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                  >
                    <CreditCard className="h-4 w-4 text-blue-600" /> Take payment
                  </button>
                )}
                {can('invoices.view') && (
                  <button
                    onClick={() => openPdf(`/invoices/${b._id}/pdf`).catch((e) => toast.error(errMsg(e)))}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                  >
                    <Printer className="h-4 w-4 text-blue-600" /> Print invoice
                  </button>
                )}
              </div>

              {/* Bottom Sticky Action Bar */}
              {b.bookingStatus === 'checked_in' && (
                <div className="pt-2">
                  <button
                    onClick={() => setModal('checkout')}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-sm font-extrabold text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all"
                  >
                    <LogOut className="h-4 w-4" /> Check out <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Modals */}
            <EditModal open={modal === 'edit'} b={b} onClose={done} inv={inv} />
            <ExtendModal open={modal === 'extend'} b={b} onClose={done} inv={inv} />
            <RoomModal open={modal === 'room'} b={b} onClose={done} inv={inv} />
            <PayModal open={modal === 'pay' || modal === 'refund'} refund={modal === 'refund'} b={b} onClose={done} inv={inv} />
            <CancelModal open={modal === 'cancel'} b={b} onClose={done} inv={inv} />
            <CheckoutModal open={modal === 'checkout'} b={b} onClose={done} inv={inv} />
          </div>
        )
      )}
    </Drawer>
  );
}

const Grid = ({ items }) => (
  <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
    {items.map(([k, v]) => (
      <div key={k}>
        <dt className="text-xs font-semibold text-slate-500">{k}</dt>
        <dd className="text-sm font-semibold capitalize text-slate-900">{v}</dd>
      </div>
    ))}
  </dl>
);

const Row = ({ k, v, strong, warn }) => (
  <div className={`flex justify-between py-0.5 ${strong ? 'font-bold' : ''} ${warn ? 'text-red-600' : ''}`}>
    <span className={strong ? '' : 'text-slate-500'}>{k}</span>
    <span>{v}</span>
  </div>
);

function EditModal({ open, b, onClose, inv }) {
  const can = useCan();
  const [v, setV] = useState(null);
  const s = v || {
    adults: b.adults,
    children: b.children,
    extraBedCharge: b.extraBedCharge,
    otherCharges: b.otherCharges,
    discount: b.discount,
    roomRate: b.roomRate,
    notes: b.notes || '',
  };
  const m = useMutate((body) => bookingApi.update(b._id, body), { success: 'Booking updated', invalidate: inv, onSuccess: onClose });
  const set = (k) => (e) => setV({ ...s, [k]: e.target.value });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit booking"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={m.isPending}
            onClick={() =>
              m.mutate({
                adults: +s.adults,
                children: +s.children,
                extraBedCharge: +s.extraBedCharge,
                otherCharges: +s.otherCharges,
                discount: +s.discount,
                notes: s.notes,
                ...(can('bookings.edit_rate') && +s.roomRate !== b.roomRate ? { roomRate: +s.roomRate } : {}),
              })
            }
          >
            {m.isPending && <Spinner />}Save changes
          </button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          ['adults', 'Adults'],
          ['children', 'Children'],
          ['extraBedCharge', 'Extra bed'],
          ['otherCharges', 'Other charges'],
        ].map(([k, l]) => (
          <Field key={k} label={l}>
            <input type="number" min="0" className="input" value={s[k]} onChange={set(k)} />
          </Field>
        ))}
        <Field label="Discount" hint={!can('bookings.give_discount') ? 'Admin permission required to give discounts.' : undefined}>
          <input type="number" min="0" className="input" disabled={!can('bookings.give_discount')} value={s.discount} onChange={set('discount')} />
        </Field>
        <Field label="Room rate" hint={!can('bookings.edit_rate') ? 'Only managers can change the rate.' : undefined}>
          <input type="number" className="input" disabled={!can('bookings.edit_rate')} value={s.roomRate} onChange={set('roomRate')} />
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          <textarea className="input" rows={2} value={s.notes} onChange={set('notes')} />
        </Field>
      </div>
    </Modal>
  );
}

function ExtendModal({ open, b, onClose, inv }) {
  const [out, setOut] = useState('');
  const val = out || iso(utcDate(b.checkOutDate));
  const m = useMutate((d) => bookingApi.extend(b._id, { checkOutDate: d }), {
    success: 'Stay updated. Charges recalculated.',
    invalidate: inv,
    onSuccess: () => {
      setOut('');
      onClose();
    },
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Extend or shorten stay"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={m.isPending} onClick={() => m.mutate(val)}>
            {m.isPending && <Spinner />}Save new dates
          </button>
        </>
      }
    >
      <p className="mb-3 text-sm text-slate-500">
        Currently {fmtDate(b.checkInDate, 'dd MMM')} → {fmtDate(b.checkOutDate, 'dd MMM')}. The server checks the room is free before
        saving.
      </p>
      <Field label="New check-out date">
        <input
          type="date"
          className="input"
          min={iso(addDays(utcDate(b.checkInDate), 1))}
          value={val}
          onChange={(e) => setOut(e.target.value)}
        />
      </Field>
    </Modal>
  );
}

function RoomModal({ open, b, onClose, inv }) {
  const [sel, setSel] = useState(null);
  const [reason, setReason] = useState('');
  const q = useQuery({
    queryKey: ['availability', 'change', b._id, b.checkInDate, b.checkOutDate],
    enabled: open,
    queryFn: () =>
      bookingApi.availability({ checkInDate: iso(utcDate(b.checkInDate)), checkOutDate: iso(utcDate(b.checkOutDate)) }),
  });
  const m = useMutate(() => bookingApi.changeRoom(b._id, { room: sel, reason: reason || 'Room change' }), {
    success: 'Guest moved to the new room',
    invalidate: inv,
    onSuccess: () => {
      setSel(null);
      onClose();
    },
  });
  const rooms = (q.data?.rooms || []).filter(
    (r) => r._id !== b.room?._id && (b.bookingStatus !== 'checked_in' || ['clean', 'inspected'].includes(r.housekeepingStatus))
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Change room (now Room ${b.room?.roomNumber})`}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={!sel || m.isPending} onClick={() => m.mutate()}>
            {m.isPending && <Spinner />}Move guest
          </button>
        </>
      }
    >
      {q.isLoading ? (
        <Skeleton className="h-32" />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={q.refetch} />
      ) : !rooms.length ? (
        <p className="text-sm text-slate-500">
          No other room is free for the whole stay{b.bookingStatus === 'checked_in' ? ' and ready for a guest' : ''}.
        </p>
      ) : (
        <div className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
          {rooms.map((r) => (
            <button
              key={r._id}
              onClick={() => setSel(r._id)}
              className={`rounded-xl border p-3 text-left text-sm ${
                sel === r._id ? 'border-brand-600 bg-brand-50' : 'border-slate-200'
              }`}
            >
              <b>Room {r.roomNumber}</b> · {r.roomType?.name}
              <br />
              <span className="text-xs text-slate-500">
                {r.sellableIsAC ? 'AC' : 'Non-AC'} · {money(r.sellablePrice)}/night
              </span>
            </button>
          ))}
        </div>
      )}
      <Field label="Reason" className="mt-3">
        <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. AC not working" />
      </Field>
    </Modal>
  );
}

function PayModal({ open, refund, b, onClose, inv }) {
  const [amt, setAmt] = useState('');
  const [method, setMethod] = useState('cash');
  const max = refund ? b.paidAmount : b.balanceAmount;
  const val = amt === '' ? max : amt;
  const m = useMutate((body) => (refund ? paymentApi.refund(b._id, body) : paymentApi.take(b._id, body)), {
    success: refund ? 'Refund recorded' : 'Payment recorded',
    invalidate: inv,
    onSuccess: () => {
      setAmt('');
      onClose();
    },
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={refund ? 'Refund payment' : 'Take payment'}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={m.isPending || !(+val > 0)} onClick={() => m.mutate({ amount: +val, method })}>
            {m.isPending && <Spinner />}
            {refund ? 'Record refund' : 'Record payment'}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-slate-500">
          {refund ? `Paid so far ${money(b.paidAmount)}.` : `Balance due ${money(b.balanceAmount)}.`}
        </p>
        <Field label="Amount">
          <input type="number" className="input" max={max} value={val} onChange={(e) => setAmt(e.target.value)} />
        </Field>
        <Field label="Method">
          <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
            {[
              ['cash', 'Cash'],
              ['upi', 'UPI'],
              ['card', 'Card'],
              ['bank_transfer', 'Bank transfer'],
              ['other', 'Other'],
            ].map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </Modal>
  );
}

function CancelModal({ open, b, onClose, inv }) {
  const [reason, setReason] = useState('');
  const m = useMutate(() => bookingApi.cancel(b._id, reason), {
    success: 'Booking cancelled. The room is free again.',
    invalidate: inv,
    onSuccess: onClose,
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Cancel this booking?"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            Keep booking
          </button>
          <button className="btn-danger" disabled={reason.length < 3 || m.isPending} onClick={() => m.mutate()}>
            {m.isPending && <Spinner />}Cancel booking
          </button>
        </>
      }
    >
      <Field label="Reason for cancelling">
        <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
      </Field>
      {b.paidAmount > 0 && (
        <p className="mt-2 text-sm font-medium text-amber-700">
          {money(b.paidAmount)} has been paid. Record a refund separately if it is being returned.
        </p>
      )}
    </Modal>
  );
}

function CheckoutModal({ open, b, onClose, inv }) {
  const can = useCan();
  const [method, setMethod] = useState('cash');
  const [discountVal, setDiscountVal] = useState(b?.discount || 0);

  useEffect(() => {
    if (b) setDiscountVal(b.discount || 0);
  }, [b]);

  const subtotal = b ? (b.subtotal ?? (b.roomRate * b.nights + (b.extraBedCharge || 0) + (b.otherCharges || 0))) : 0;
  const numDiscount = Math.max(0, Number(discountVal) || 0);
  const discountError = numDiscount > subtotal ? 'Discount cannot exceed subtotal' : null;
  const taxable = Math.max(0, subtotal - numDiscount);
  const taxPercent = b?.taxPercent || 0;
  const tax = Math.round(taxable * (taxPercent / 100));
  const newTotal = taxable + tax;
  const paid = b?.paidAmount || 0;
  const newBalance = Math.max(0, newTotal - paid);

  const m = useMutate((body) => bookingApi.checkOut(b._id, body), {
    success: 'Guest checked out. Room marked dirty.',
    invalidate: inv,
    onSuccess: onClose,
  });

  const handleCheckout = () => {
    const payload = {
      discount: numDiscount,
      ...(newBalance > 0 ? { payment: { amount: newBalance, method } } : {}),
    };
    m.mutate(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Check out guest"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={m.isPending || !!discountError || (newBalance > 0 && !can('payments.create'))}
            onClick={handleCheckout}
          >
            {m.isPending && <Spinner />}
            {newBalance > 0 ? `Collect ${money(newBalance)} & check out` : 'Complete check-out'}
          </button>
        </>
      }
    >
      <Row k="Subtotal" v={money(subtotal)} />
      <div className="my-2.5">
        <Field label="Discount (₹)" hint={!can('bookings.give_discount') ? 'Admin permission required to give discounts.' : undefined} error={discountError}>
          <input
            type="number"
            min="0"
            className="input font-semibold"
            disabled={!can('bookings.give_discount')}
            value={discountVal}
            onChange={(e) => setDiscountVal(e.target.value)}
            placeholder="0"
          />
        </Field>
      </div>
      {taxPercent > 0 && <Row k={`Tax (${taxPercent}%)`} v={money(tax)} />}
      <Row k="Total" v={money(newTotal)} strong />
      <Row k="Paid" v={money(paid)} />
      <Row k="Balance" v={money(newBalance)} strong warn={newBalance > 0} />
      {newBalance > 0 && (
        <div className="mt-3">
          <p className="mb-2 text-sm font-semibold text-red-600">{money(newBalance)} balance pending</p>
          <Field label="Payment method">
            <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
              {['cash', 'upi', 'card', 'bank_transfer', 'other'].map((k) => (
                <option key={k} value={k}>
                  {k.replace('_', ' ')}
                </option>
              ))}
            </select>
          </Field>
          {!can('payments.create') && <p className="mt-2 text-xs text-slate-500">You can't take payments. Ask a cashier to collect the balance.</p>}
        </div>
      )}
    </Modal>
  );
}

export { CheckoutModal };
