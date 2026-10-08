import { useState, useEffect } from 'react';
import {
  Users,
  User,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  Eye,
  DoorOpen,
  BedDouble,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Modal, Field, Spinner } from '../common/ui';
import { openDocUrl } from '../../services/api';
import { bookingApi } from '../../services/booking.api';
import { useMutate } from '../../hooks/useMutate';
import { useCan } from '../../store/auth';
import { fmtDate, money } from '../../utils/format';

export function CheckInModal({ open, b, onClose, inv }) {
  const can = useCan();
  const [collectPay, setCollectPay] = useState(false);
  const [payAmt, setPayAmt] = useState('');
  const [payMethod, setPayMethod] = useState('cash');

  useEffect(() => {
    if (open && b) {
      const bal = b.balanceAmount || 0;
      setCollectPay(bal > 0);
      setPayAmt(bal > 0 ? String(bal) : '0');
      setPayMethod('cash');
    }
  }, [open, b]);

  const m = useMutate(
    (payload) => bookingApi.checkIn(b._id, payload),
    {
      success: 'Guest checked in successfully',
      invalidate: inv || ['arrivals', 'calendar', 'dashboard', 'bookings', 'rooms'],
      onSuccess: onClose,
    }
  );

  if (!b) return null;

  const totalPeople = (Number(b.adults) || 1) + (Number(b.children) || 0);
  const bal = b.balanceAmount || 0;
  const numPay = Number(payAmt) || 0;
  const isPayValid = !collectPay || (numPay > 0 && numPay <= bal + 0.01);

  const handleCheckIn = () => {
    const payload = {};
    if (collectPay && numPay > 0) {
      payload.payment = {
        amount: numPay,
        method: payMethod,
      };
    }
    m.mutate(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={`Check In Guest • Room ${b.room?.roomNumber || ''}`}
      footer={
        <div className="flex w-full items-center justify-between">
          <button className="btn-ghost" onClick={onClose} disabled={m.isPending}>
            Cancel
          </button>
          <button
            className="btn-primary flex items-center gap-1.5"
            disabled={m.isPending || !isPayValid}
            onClick={handleCheckIn}
          >
            {m.isPending && <Spinner />}
            {collectPay && numPay > 0 ? `Collect ${money(numPay)} & Complete Check-in` : 'Confirm Check-in'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Top Summary Banner */}
        <div className="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/70 p-3.5 text-xs text-blue-900">
          <div>
            <p className="font-extrabold text-sm text-blue-950">Room {b.room?.roomNumber} · {b.room?.roomType?.name || 'Deluxe'}</p>
            <p className="text-blue-700 font-semibold mt-0.5">
              {fmtDate(b.checkInDate, 'dd MMM yyyy')} → {fmtDate(b.checkOutDate, 'dd MMM yyyy')} ({b.nights || 1} {(b.nights || 1) === 1 ? 'night' : 'nights'})
            </p>
          </div>
          <span className="rounded-xl bg-blue-600 px-3 py-1 font-black text-white text-xs">
            {b.bookingNumber}
          </span>
        </div>

        {/* Section 1: Guest Information & How Many People */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-blue-600" /> Guest Details ({totalPeople} {totalPeople === 1 ? 'Person' : 'People'})
            </span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
              {b.adults || 1} Adults{b.children > 0 ? `, ${b.children} Children` : ''}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-800 font-black text-sm">
              {b.guest?.name ? b.guest.name.slice(0, 2).toUpperCase() : 'G'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold text-slate-900 truncate">{b.guest?.name || 'Primary Guest'}</p>
              <p className="text-xs text-slate-500 font-medium">{b.guest?.phone || 'No phone'} {b.guest?.email ? `· ${b.guest.email}` : ''}</p>
            </div>
          </div>

          {/* Co-Guests (if any) */}
          {Array.isArray(b.coGuests) && b.coGuests.length > 0 && (
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Accompanying Co-Guests:</p>
              <div className="space-y-1">
                {b.coGuests.map((cg, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1 text-xs">
                    <span className="font-semibold text-slate-800">#{i + 1} {cg.name}</span>
                    <span className="text-slate-500">{cg.idType || 'Aadhaar'} {cg.idNumber ? `(${cg.idNumber})` : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section 2: ID Verification */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> ID Proof Verification
            </span>
            <span className="flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" /> ID Verified
            </span>
          </div>

          <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl text-xs">
            <div>
              <p className="font-bold text-slate-800">{b.guest?.idType || 'Aadhaar Card'}</p>
              <p className="text-slate-500 font-mono text-[11px]">{b.guest?.idNumber || 'ID document checked at front desk'}</p>
            </div>
            {b.guest?.idDocumentUrl ? (
              <button
                type="button"
                onClick={() => openDocUrl(b.guest.idDocumentUrl)}
                className="btn-ghost text-xs text-blue-600 font-bold flex items-center gap-1 hover:underline"
              >
                <Eye className="h-3.5 w-3.5" /> View Uploaded ID
              </button>
            ) : (
              <span className="text-[11px] text-slate-400 font-semibold">Physical ID Checked</span>
            )}
          </div>
        </div>

        {/* Section 3: Amount Paid & Payment on Check-In */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <CreditCard className="h-4 w-4 text-blue-600" /> Payment & Financial Summary
            </span>
            <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${bal > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
              {bal > 0 ? 'Balance Pending' : 'Fully Paid'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-slate-50 p-2.5">
              <p className="text-[10px] font-bold uppercase text-slate-400">Total Stay</p>
              <p className="text-sm font-black text-slate-900">{money(b.totalAmount || 0)}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-800">
              <p className="text-[10px] font-bold uppercase text-emerald-600">Paid So Far</p>
              <p className="text-sm font-black">{money(b.paidAmount || 0)}</p>
            </div>
            <div className="rounded-xl bg-rose-50 p-2.5 text-rose-800">
              <p className="text-[10px] font-bold uppercase text-rose-600">Balance Due</p>
              <p className="text-sm font-black">{money(bal)}</p>
            </div>
          </div>

          {/* Payment collection option if balance > 0 */}
          {bal > 0 && can('payments.create') && (
            <div className="pt-2 border-t border-slate-100 space-y-2.5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={collectPay}
                  onChange={(e) => setCollectPay(e.target.checked)}
                  className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Collect payment / advance now during check-in</span>
              </label>

              {collectPay && (
                <div className="grid grid-cols-2 gap-2.5 pt-1 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                  <Field label="Amount to Collect (₹)">
                    <input
                      type="number"
                      max={bal}
                      min="1"
                      className="input font-bold"
                      value={payAmt}
                      onChange={(e) => setPayAmt(e.target.value)}
                    />
                  </Field>
                  <Field label="Payment Method">
                    <select
                      className="input capitalize"
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                    >
                      <option value="cash">Cash</option>
                      <option value="upi">UPI / QR Code</option>
                      <option value="card">Debit / Credit Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="other">Other</option>
                    </select>
                  </Field>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
