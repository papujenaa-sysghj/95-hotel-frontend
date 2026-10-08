import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BedDouble,
  LogOut,
  LogIn,
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
  Users,
  UserPlus,
  Trash2,
  Upload,
  MapPin,
  Globe,
  Tag,
  Receipt,
} from 'lucide-react';
import api, { unwrap, openPdf, openDocUrl, errMsg } from '../../services/api';
import { bookingApi } from '../../services/booking.api';
import { paymentApi } from '../../services/payment.api';
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
                <Badge status={b.bookingStatus} />
                <Badge status={b.paymentStatus} />
              </div>
            </div>

            {/* Cancellation Notice Banner */}
            {b.bookingStatus === 'cancelled' && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-rose-900 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 font-black text-sm text-rose-800">
                  <Ban className="h-4.5 w-4.5 text-rose-600 shrink-0" />
                  <span>This Booking is Cancelled</span>
                </div>
                {b.cancelReason && (
                  <p className="text-xs font-semibold text-rose-700">
                    <span className="font-bold text-rose-900">Reason:</span> {b.cancelReason}
                  </p>
                )}
                {b.updatedAt && (
                  <p className="text-[11px] text-rose-600 font-medium">
                    Updated {fmtDateTime(b.updatedAt)}
                  </p>
                )}
              </div>
            )}

            {/* Guest Header Card */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 shadow-2xs">
              <div className="flex items-center gap-3.5">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-700 font-black text-sm">
                  {b.guest?.name ? b.guest.name.split(' ').map((n) => n[0]).slice(0, 2).join('') : 'G'}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">{b.guest?.name || 'Guest'}</h3>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs font-semibold text-slate-500">
                    {b.guest?.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-slate-400" />
                        {b.guest.phone}
                      </span>
                    )}
                    {b.guest?.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-slate-400" />
                        {b.guest.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Primary Guest & Co-Guests Aadhaar / ID Proof Documents */}
            <div className="space-y-2.5">
              {/* Primary Guest Document */}
              {b.guest?.idDocumentUrl ? (
                <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-900">{b.guest?.name} ({b.guest?.idType || 'Aadhaar Card'})</p>
                      <p className="text-[11px] font-semibold text-emerald-700">{b.guest?.idNumber ? `ID Number: ${b.guest.idNumber}` : 'Guest ID Proof Document'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => openDocUrl(b.guest.idDocumentUrl)}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-extrabold text-white hover:bg-emerald-700 shadow-2xs transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" /> View ID Card
                  </button>
                </div>
              ) : b.guest?.idNumber ? (
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-3 px-4 text-xs font-semibold text-slate-700">
                  <span><b>{b.guest?.name} ({b.guest.idType || 'Aadhaar'}):</b> {b.guest.idNumber}</span>
                  <span className="text-[11px] text-slate-400 italic">No document file attached</span>
                </div>
              ) : null}

              {/* Co-Guests Documents */}
              {b.coGuests && b.coGuests.length > 0 && (
                <div className="space-y-2 pt-1">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-1">
                    Co-Guests & Additional Occupants ({b.coGuests.length})
                  </p>
                  {b.coGuests.map((cg, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-700 font-bold text-xs">
                          {idx + 2}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{cg.name || `Occupant #${idx + 2}`}</p>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {cg.idType || 'Aadhaar'}: {cg.idNumber || 'No ID number'}
                          </p>
                        </div>
                      </div>
                      {cg.idDocumentUrl ? (
                        <button
                          onClick={() => openDocUrl(cg.idDocumentUrl)}
                          className="flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-300 px-2.5 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                        >
                          <Eye className="h-3.5 w-3.5 text-emerald-600" /> View ID
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No file</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4 Tile Grid: Room, Check-in, Check-out, Duration */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <BedDouble className="h-3.5 w-3.5 text-blue-600" /> Room
                </div>
                <p className="mt-1.5 text-sm font-black text-slate-900">{b.room?.roomNumber ? `Room ${b.room.roomNumber}` : 'Unassigned'} {b.room?.floor !== undefined ? `· Fl ${b.room.floor}` : ''}</p>
                <p className="text-[11px] font-bold text-blue-600">{b.roomType?.name || 'Standard'}</p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <Calendar className="h-3.5 w-3.5 text-blue-600" /> Check-in
                </div>
                <p className="mt-1.5 text-sm font-black text-slate-900">{fmtDate(b.checkInDate, 'dd MMM yyyy')}</p>
                <p className="text-[11px] font-semibold text-slate-400">12:00 PM</p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <Calendar className="h-3.5 w-3.5 text-blue-600" /> Check-out
                </div>
                <p className="mt-1.5 text-sm font-black text-slate-900">{fmtDate(b.checkOutDate, 'dd MMM yyyy')}</p>
                <p className="text-[11px] font-semibold text-slate-400">11:00 AM</p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <Moon className="h-3.5 w-3.5 text-blue-600" /> Duration
                </div>
                <p className="mt-1.5 text-sm font-black text-slate-900">{b.nights || 1} Night{b.nights > 1 ? 's' : ''}</p>
                <p className="text-[11px] font-semibold text-slate-500">{b.adults || 1} Adult{b.adults > 1 ? 's' : ''}{b.children ? `, ${b.children} Child` : ''}</p>
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
                <span className="text-lg font-black text-rose-600">{money(b.balanceAmount || 0)}</span>
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
                <p className="font-bold text-slate-800 mt-0.5">{b.createdBy?.name || 'Staff'}</p>
              </div>
              <div>
                <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Created</p>
                <p className="font-bold text-slate-800 mt-0.5">{fmtDateTime(b.createdAt) || '—'}</p>
              </div>
              <div>
                <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Notes</p>
                <p className="font-bold text-slate-800 mt-0.5">{b.notes || 'None'}</p>
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
                {['hold', 'confirmed'].includes(b.bookingStatus) && can('checkin.perform') && (
                  <button
                    onClick={() => checkIn.mutate()}
                    disabled={checkIn.isPending}
                    className="flex items-center justify-between rounded-xl bg-emerald-600 p-3 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      {checkIn.isPending ? <Spinner /> : <LogIn className="h-4 w-4" />} Check in
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
                {['hold', 'confirmed'].includes(b.bookingStatus) && can('bookings.cancel') && (
                  <button
                    onClick={() => setModal('cancel')}
                    className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors shadow-2xs"
                  >
                    <Ban className="h-4 w-4 text-rose-600" /> Cancel booking
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
  const [tab, setTab] = useState('guest'); // 'guest' | 'party' | 'pricing' | 'notes'
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadingCoDocs, setUploadingCoDocs] = useState({});

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    idType: 'Aadhaar',
    idNumber: '',
    idDocumentUrl: '',
    nationality: 'Indian',
    adults: 1,
    children: 0,
    coGuests: [],
    roomRate: 0,
    extraBedCharge: 0,
    otherCharges: 0,
    discount: 0,
    source: 'reception',
    notes: '',
  });

  useEffect(() => {
    if (open && b) {
      setTab('guest');
      setForm({
        name: b.guest?.name || '',
        phone: b.guest?.phone || '',
        email: b.guest?.email || '',
        address: b.guest?.address || '',
        idType: b.guest?.idType || 'Aadhaar',
        idNumber: b.guest?.idNumber || '',
        idDocumentUrl: b.guest?.idDocumentUrl || '',
        nationality: b.guest?.nationality || 'Indian',
        adults: b.adults || 1,
        children: b.children || 0,
        coGuests: Array.isArray(b.coGuests)
          ? b.coGuests.map((cg) => ({
              name: cg.name || '',
              idType: cg.idType || 'Aadhaar',
              idNumber: cg.idNumber || '',
              idDocumentUrl: cg.idDocumentUrl || '',
            }))
          : [],
        roomRate: b.roomRate ?? 0,
        extraBedCharge: b.extraBedCharge ?? 0,
        otherCharges: b.otherCharges ?? 0,
        discount: b.discount ?? 0,
        source: b.source || 'reception',
        notes: b.notes || '',
      });
    }
  }, [open, b]);

  const setField = (k) => (e) => setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const updateCoGuest = (idx, field, val) => {
    setForm((prev) => {
      const copy = [...prev.coGuests];
      if (!copy[idx]) copy[idx] = { name: '', idType: 'Aadhaar', idNumber: '', idDocumentUrl: '' };
      copy[idx] = { ...copy[idx], [field]: val };
      return { ...prev, coGuests: copy };
    });
  };

  const addCoGuest = () => {
    setForm((prev) => ({
      ...prev,
      adults: Number(prev.adults || 1) + 1,
      coGuests: [...prev.coGuests, { name: '', idType: 'Aadhaar', idNumber: '', idDocumentUrl: '' }],
    }));
  };

  const removeCoGuest = (idx) => {
    setForm((prev) => ({
      ...prev,
      adults: Math.max(1, Number(prev.adults || 1) - 1),
      coGuests: prev.coGuests.filter((_, i) => i !== idx),
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploadingDoc(true);
    try {
      const res = await unwrap(api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }));
      const urlStr = typeof res === 'string' ? res : res?.url || res?.data?.url || '';
      setForm((prev) => ({ ...prev, idDocumentUrl: urlStr }));
      toast.success('ID document uploaded successfully');
    } catch (err) {
      toast.error(errMsg(err, 'Failed to upload document'));
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleCoGuestFileUpload = async (idx, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploadingCoDocs((prev) => ({ ...prev, [idx]: true }));
    try {
      const res = await unwrap(api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }));
      const urlStr = typeof res === 'string' ? res : res?.url || res?.data?.url || '';
      updateCoGuest(idx, 'idDocumentUrl', urlStr);
      toast.success(`ID document uploaded for Co-Guest ${idx + 1}`);
    } catch (err) {
      toast.error(errMsg(err, 'Failed to upload document'));
    } finally {
      setUploadingCoDocs((prev) => ({ ...prev, [idx]: false }));
    }
  };

  // Calculations for live preview
  const nights = b?.nights || 1;
  const numRate = Math.max(0, Number(form.roomRate) || 0);
  const numExtra = Math.max(0, Number(form.extraBedCharge) || 0);
  const numOther = Math.max(0, Number(form.otherCharges) || 0);
  const numDisc = Math.max(0, Number(form.discount) || 0);
  const roomTotal = numRate * nights;
  const subtotal = roomTotal + numExtra + numOther;
  const discountError = numDisc > subtotal ? 'Discount cannot exceed subtotal' : null;
  const taxable = Math.max(0, subtotal - numDisc);
  const taxPercent = b?.taxPercent || 0;
  const tax = Math.round(taxable * (taxPercent / 100));
  const newTotal = taxable + tax;
  const paid = b?.paidAmount || 0;
  const newBalance = Math.max(0, newTotal - paid);

  const m = useMutate((body) => bookingApi.update(b._id, body), {
    success: 'Booking details updated successfully',
    invalidate: inv,
    onSuccess: onClose,
  });

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error('Primary guest name is required');
      setTab('guest');
      return;
    }
    if (discountError) {
      toast.error(discountError);
      setTab('pricing');
      return;
    }

    const payload = {
      guest: {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        idType: form.idType,
        idNumber: form.idNumber.trim(),
        idDocumentUrl: form.idDocumentUrl,
        nationality: form.nationality,
      },
      adults: Math.max(1, Number(form.adults) || 1),
      children: Math.max(0, Number(form.children) || 0),
      coGuests: form.coGuests.filter((cg) => cg.name && cg.name.trim()),
      extraBedCharge: numExtra,
      otherCharges: numOther,
      discount: numDisc,
      notes: form.notes,
      source: form.source,
      ...(can('bookings.edit_rate') ? { roomRate: numRate } : {}),
    };

    m.mutate(payload);
  };

  const tabs = [
    { id: 'guest', label: 'Primary Guest', icon: User },
    { id: 'party', label: `Party & Co-Guests (${form.adults}A, ${form.children}C)`, icon: Users },
    { id: 'pricing', label: 'Rates & Pricing', icon: Receipt },
    { id: 'notes', label: 'Source & Notes', icon: FileText },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={`Edit Total Booking • ${b?.bookingNumber || ''}`}
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="text-xs font-semibold text-slate-500 hidden sm:block">
            Room <b className="text-slate-800">{b?.room?.roomNumber}</b> · {fmtDate(b?.checkInDate, 'dd MMM')} → {fmtDate(b?.checkOutDate, 'dd MMM')} ({nights} {nights === 1 ? 'night' : 'nights'})
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-ghost" onClick={onClose} disabled={m.isPending}>
              Cancel
            </button>
            <button className="btn-primary" disabled={m.isPending || !!discountError} onClick={handleSave}>
              {m.isPending && <Spinner />}Save all changes
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar gap-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                type="button"
                className={`flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${
                  active
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Primary Guest */}
        {tab === 'guest' && (
          <div className="space-y-4 pt-1">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Guest Full Name" required>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    className="input pl-9"
                    value={form.name}
                    onChange={setField('name')}
                    placeholder="e.g. Rahul Sharma"
                    required
                  />
                </div>
              </Field>

              <Field label="Phone Number" required>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    className="input pl-9"
                    value={form.phone}
                    onChange={setField('phone')}
                    placeholder="+91 9876543210"
                    required
                  />
                </div>
              </Field>

              <Field label="Email Address">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    className="input pl-9"
                    value={form.email}
                    onChange={setField('email')}
                    placeholder="guest@example.com"
                  />
                </div>
              </Field>

              <Field label="Nationality">
                <div className="relative">
                  <Globe className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    className="input pl-9"
                    value={form.nationality}
                    onChange={setField('nationality')}
                    placeholder="Indian"
                  />
                </div>
              </Field>

              <Field label="ID Proof Type">
                <select className="input" value={form.idType} onChange={setField('idType')}>
                  <option value="Aadhaar">Aadhaar Card</option>
                  <option value="Passport">Passport</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Voter ID">Voter ID</option>
                  <option value="PAN Card">PAN Card</option>
                  <option value="Other">Other ID</option>
                </select>
              </Field>

              <Field label="ID Document Number">
                <input
                  type="text"
                  className="input font-mono"
                  value={form.idNumber}
                  onChange={setField('idNumber')}
                  placeholder="e.g. 1234 5678 9012"
                />
              </Field>

              <Field label="Address / City" className="sm:col-span-2">
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    className="input pl-9"
                    value={form.address}
                    onChange={setField('address')}
                    placeholder="City, State, Country"
                  />
                </div>
              </Field>

              {/* ID Document Upload */}
              <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-blue-600" /> ID Document Attachment
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {form.idDocumentUrl ? 'ID document is attached.' : 'Upload guest Aadhaar/Passport photo or PDF scan.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {form.idDocumentUrl && (
                      <button
                        type="button"
                        onClick={() => openDocUrl(form.idDocumentUrl)}
                        className="btn-ghost text-xs px-2.5 py-1.5 flex items-center gap-1 text-blue-600"
                      >
                        <Eye className="h-3.5 w-3.5" /> View Uploaded
                      </button>
                    )}
                    <label className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 cursor-pointer">
                      {uploadingDoc ? <Spinner /> : <Upload className="h-3.5 w-3.5" />}
                      <span>{form.idDocumentUrl ? 'Replace Document' : 'Upload ID'}</span>
                      <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Party & Co-Guests */}
        {tab === 'party' && (
          <div className="space-y-4 pt-1">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Adults (Age 12+)">
                <input
                  type="number"
                  min="1"
                  className="input"
                  value={form.adults}
                  onChange={(e) => {
                    const newAdults = Math.max(1, Number(e.target.value) || 1);
                    setForm((prev) => {
                      const needed = Math.max(0, newAdults - 1);
                      const copy = [...prev.coGuests];
                      while (copy.length < needed) copy.push({ name: '', idType: 'Aadhaar', idNumber: '', idDocumentUrl: '' });
                      return { ...prev, adults: newAdults, coGuests: copy.slice(0, needed) };
                    });
                  }}
                />
              </Field>

              <Field label="Children (Age 0-11)">
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={form.children}
                  onChange={setField('children')}
                />
              </Field>
            </div>

            {/* Co-guests list */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-blue-600" /> Additional Co-Guests ({form.coGuests.length})
                </h4>
                <button
                  type="button"
                  onClick={addCoGuest}
                  className="btn-ghost text-xs px-2.5 py-1 text-blue-600 font-bold flex items-center gap-1"
                >
                  <UserPlus className="h-3.5 w-3.5" /> + Add Co-Guest
                </button>
              </div>

              {!form.coGuests.length ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
                  No additional co-guests registered. Click "+ Add Co-Guest" or increase Adults to add party members.
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {form.coGuests.map((cg, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">Co-Guest #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeCoGuest(idx)}
                          className="text-rose-500 hover:text-rose-700 text-xs flex items-center gap-1 font-semibold"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <input
                          className="input text-xs"
                          placeholder="Full Name"
                          value={cg.name}
                          onChange={(e) => updateCoGuest(idx, 'name', e.target.value)}
                        />
                        <select
                          className="input text-xs"
                          value={cg.idType}
                          onChange={(e) => updateCoGuest(idx, 'idType', e.target.value)}
                        >
                          <option value="Aadhaar">Aadhaar</option>
                          <option value="Passport">Passport</option>
                          <option value="Driving License">Driving License</option>
                          <option value="Voter ID">Voter ID</option>
                          <option value="Other">Other</option>
                        </select>
                        <input
                          className="input text-xs"
                          placeholder="ID Number"
                          value={cg.idNumber}
                          onChange={(e) => updateCoGuest(idx, 'idNumber', e.target.value)}
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        {cg.idDocumentUrl && (
                          <button
                            type="button"
                            onClick={() => openDocUrl(cg.idDocumentUrl)}
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" /> View ID Document
                          </button>
                        )}
                        <label className="btn-secondary text-[11px] px-2.5 py-1 flex items-center gap-1 cursor-pointer">
                          {uploadingCoDocs[idx] ? <Spinner /> : <Upload className="h-3 w-3" />}
                          <span>{cg.idDocumentUrl ? 'Replace ID' : 'Upload ID'}</span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*,application/pdf"
                            onChange={(e) => handleCoGuestFileUpload(idx, e)}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Rates & Pricing */}
        {tab === 'pricing' && (
          <div className="space-y-4 pt-1">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Room Rate (₹ / night)"
                hint={!can('bookings.edit_rate') ? 'Admin or Manager permission required to alter room rate.' : undefined}
              >
                <input
                  type="number"
                  min="0"
                  className="input font-bold"
                  disabled={!can('bookings.edit_rate')}
                  value={form.roomRate}
                  onChange={setField('roomRate')}
                />
              </Field>

              <Field label="Extra Bed Charge (₹)">
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={form.extraBedCharge}
                  onChange={setField('extraBedCharge')}
                />
              </Field>

              <Field label="Other Charges / Services (₹)">
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={form.otherCharges}
                  onChange={setField('otherCharges')}
                />
              </Field>

              <Field
                label="Discount (₹)"
                hint={!can('bookings.give_discount') ? 'Admin permission required to give discounts.' : undefined}
                error={discountError}
              >
                <input
                  type="number"
                  min="0"
                  className="input"
                  disabled={!can('bookings.give_discount')}
                  value={form.discount}
                  onChange={setField('discount')}
                />
              </Field>
            </div>

            {/* Live Financial Breakdown Card */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-800 border-b border-slate-200 pb-2">
                <span>Calculated Financial Breakdown</span>
                <span className="text-slate-500 font-normal">{nights} {nights === 1 ? 'Night' : 'Nights'} Stay</span>
              </div>
              <Row k={`Room Charges (${money(numRate)} × ${nights} nights)`} v={money(roomTotal)} />
              {numExtra > 0 && <Row k="Extra Bed" v={money(numExtra)} />}
              {numOther > 0 && <Row k="Other Charges" v={money(numOther)} />}
              <Row k="Subtotal" v={money(subtotal)} strong />
              {numDisc > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Discount</span>
                  <span>- {money(numDisc)}</span>
                </div>
              )}
              {taxPercent > 0 && <Row k={`Tax (${taxPercent}%)`} v={money(tax)} />}
              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-black text-slate-900">
                <span>Total Amount</span>
                <span>{money(newTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Amount Paid</span>
                <span className="font-bold">{money(paid)}</span>
              </div>
              <div className={`flex justify-between text-sm font-black ${newBalance > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                <span>{newBalance > 0 ? 'Balance Pending' : 'Fully Paid'}</span>
                <span>{money(newBalance)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Source & Notes */}
        {tab === 'notes' && (
          <div className="space-y-4 pt-1">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Booking Source">
                <select className="input capitalize" value={form.source} onChange={setField('source')}>
                  <option value="reception">Reception / Desk</option>
                  <option value="walk_in">Walk-in Guest</option>
                  <option value="phone">Phone Booking</option>
                  <option value="other">Other / Online</option>
                </select>
              </Field>
            </div>

            <Field label="Special Requests & Internal Notes" hint="Visible across Reception, Front Desk and Invoices.">
              <textarea
                className="input"
                rows={4}
                value={form.notes}
                onChange={setField('notes')}
                placeholder="e.g. Early check-in requested, high floor preference, airport taxi required..."
              />
            </Field>
          </div>
        )}
      </div>
    </Modal>
  );
}

function ExtendModal({ open, b, onClose, inv }) {
  const [inDate, setInDate] = useState('');
  const [outDate, setOutDate] = useState('');

  useEffect(() => {
    if (open && b) {
      setInDate(iso(utcDate(b.checkInDate)));
      setOutDate(iso(utcDate(b.checkOutDate)));
    }
  }, [open, b]);

  const isCheckedIn = b?.bookingStatus === 'checked_in';
  const currentIn = inDate || (b ? iso(utcDate(b.checkInDate)) : '');
  const currentOut = outDate || (b ? iso(utcDate(b.checkOutDate)) : '');

  const inD = currentIn ? new Date(currentIn + 'T00:00:00Z') : null;
  const outD = currentOut ? new Date(currentOut + 'T00:00:00Z') : null;
  const diffNights = inD && outD ? Math.round((outD - inD) / 86400000) : 0;
  const isValid = diffNights >= 1;

  const m = useMutate((body) => bookingApi.extend(b._id, body), {
    success: 'Stay updated. Charges recalculated.',
    invalidate: inv,
    onSuccess: () => {
      setInDate('');
      setOutDate('');
      onClose();
    },
  });

  const handleSave = () => {
    if (!isValid) return;
    m.mutate({
      checkInDate: currentIn,
      checkOutDate: currentOut,
    });
  };

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
          <button className="btn-primary" disabled={!isValid || m.isPending} onClick={handleSave}>
            {m.isPending && <Spinner />}Save new dates
          </button>
        </>
      }
    >
      <div className="space-y-3.5">
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-900">
          <p className="font-bold text-blue-950 mb-0.5">Current Reservation Range</p>
          <p>
            {fmtDate(b.checkInDate, 'dd MMM yyyy')} → {fmtDate(b.checkOutDate, 'dd MMM yyyy')}{' '}
            <span className="font-semibold text-blue-700">({b.nights} {b.nights === 1 ? 'night' : 'nights'})</span>
          </p>
        </div>

        <Field
          label="New check-in date"
          hint={
            isCheckedIn
              ? 'Guest is already checked in. Check-in date cannot be changed.'
              : 'Adjust if client wants to come earlier or change arrival date.'
          }
        >
          <input
            type="date"
            className="input"
            disabled={isCheckedIn}
            value={currentIn}
            max={currentOut ? iso(addDays(utcDate(currentOut), -1)) : undefined}
            onChange={(e) => setInDate(e.target.value)}
          />
        </Field>

        <Field label="New check-out date">
          <input
            type="date"
            className="input"
            min={currentIn ? iso(addDays(utcDate(currentIn), 1)) : undefined}
            value={currentOut}
            onChange={(e) => setOutDate(e.target.value)}
          />
        </Field>

        {isValid ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-800">
            <p className="font-bold text-emerald-900">
              New Duration: {diffNights} {diffNights === 1 ? 'night' : 'nights'}
            </p>
            <p className="mt-0.5 text-emerald-700 text-[11px]">
              {fmtDate(currentIn, 'dd MMM yyyy')} → {fmtDate(currentOut, 'dd MMM yyyy')} · Room availability is checked before saving.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-semibold text-rose-700">
            Check-out date must be at least 1 day after check-in date.
          </div>
        )}
      </div>
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
              className={`rounded-xl border p-3 text-left text-sm ${sel === r._id ? 'border-brand-600 bg-brand-50' : 'border-slate-200'
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

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

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
          <button className="btn-ghost" onClick={onClose} disabled={m.isPending}>
            Keep booking
          </button>
          <button className="btn-danger" disabled={reason.trim().length < 3 || m.isPending} onClick={() => m.mutate()}>
            {m.isPending && <Spinner />}Cancel booking
          </button>
        </>
      }
    >
      <Field label="Reason for cancelling" hint="Please provide a reason (min 3 characters).">
        <input
          className="input"
          placeholder="e.g. Guest requested cancellation / Plan changed"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          autoFocus
        />
      </Field>
      {b.paidAmount > 0 && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-800">
          ⚠️ <b>{money(b.paidAmount)}</b> has been collected for this booking. Record a refund separately from Payments if it is being returned.
        </div>
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
