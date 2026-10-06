import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { Check, BedDouble, Snowflake, Wind, Calendar, Search, User, Camera, Lightbulb, ArrowRight, X, Mail, MapPin, CreditCard as IdCard, Globe, FileText, Phone, Send, ShieldCheck, UserPlus } from 'lucide-react';
import api, { unwrap, errMsg, openDocUrl } from '../../services/api';
import { bookingApi } from '../../services/booking.api';
import { useUI } from '../../store/ui';
import { useCan } from '../../store/auth';
import { useMutate } from '../../hooks/useMutate';
import { guestStep, stayStep, pricingStep, calcTotals } from '../../validations/booking';
import { Modal, Field, Spinner, ErrorState, EmptyState, Skeleton, cx } from '../common/ui';
import { differenceInCalendarDays, parseISO, iso, today, addDays, money } from '../../utils/format';

const STEPS = [
  { label: 'Guest Details', sub: 'Basic information' },
  { label: 'Stay Details', sub: 'Dates & guests' },
  { label: 'Select Room', sub: 'Choose available room' },
  { label: 'Pricing', sub: 'Rate & charges' },
  { label: 'Payment', sub: 'Collect payment' },
  { label: 'Confirm', sub: 'Review & save' },
];

const stepSchemas = [guestStep, stayStep, null, pricingStep, null, null];

export default function BookingWizard() {
  const { wizard, closeWizard, openBooking } = useUI();
  return wizard ? <WizardInner key={JSON.stringify(wizard)} opts={wizard} onClose={closeWizard} onDone={(id) => { closeWizard(); openBooking(id); }} /> : null;
}

function WizardInner({ opts, onClose, onDone }) {
  const can = useCan(); const walkIn = !!opts.walkIn; const [step, setStep] = useState(0); const [room, setRoom] = useState(null); const [payMode, setPayMode] = useState('unpaid'); const [known, setKnown] = useState(null);
  const [guestMode, setGuestMode] = useState('new'); // 'new' or 'search'
  const t = iso(today());
  const f = useForm({
    mode: 'onTouched',
    defaultValues: {
      guestName: '', phone: '', phonePrefix: '+91', email: '', address: '', idType: 'Aadhaar', idNumber: '', idDocumentUrl: '', nationality: 'Indian',
      checkInDate: opts.checkIn || t, checkOutDate: opts.checkOut || iso(addDays(today(), 1)), adults: opts.adults || 1, children: 0, roomRate: 0, extraBedCharge: 0, otherCharges: 0, discount: 0,
      payAmount: 0, payMethod: 'cash', notes: '', checkInNow: walkIn
    }
  });
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [coGuests, setCoGuests] = useState([]);
  const [uploadingCoGuestDocs, setUploadingCoGuestDocs] = useState({});

  const v = f.watch();

  // Keep coGuests array aligned with the number of adults
  useEffect(() => {
    const needed = Math.max(0, (Number(v.adults) || 1) - 1);
    setCoGuests((prev) => {
      const copy = [...prev];
      while (copy.length < needed) {
        copy.push({ name: '', idType: 'Aadhaar', idNumber: '', idDocumentUrl: '' });
      }
      return copy;
    });
  }, [v.adults]);

  const updateCoGuest = (idx, field, val) => {
    setCoGuests((prev) => {
      const copy = [...prev];
      if (!copy[idx]) copy[idx] = { name: '', idType: 'Aadhaar', idNumber: '', idDocumentUrl: '' };
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const addCoGuest = () => {
    const newAdults = (Number(v.adults) || 1) + 1;
    f.setValue('adults', newAdults);
  };

  const removeCoGuest = (idx) => {
    setCoGuests((prev) => prev.filter((_, i) => i !== idx));
    const newAdults = Math.max(1, (Number(v.adults) || 1) - 1);
    f.setValue('adults', newAdults);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploadingDoc(true);
    try {
      const res = await unwrap(api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }));
      const urlStr = typeof res === 'string' ? res : (res?.url || res?.data?.url || '');
      f.setValue('idDocumentUrl', urlStr);
    } catch (err) {
      f.setError('root', { message: errMsg(err, 'Failed to upload document') });
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleCoGuestFileUpload = async (idx, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploadingCoGuestDocs((prev) => ({ ...prev, [idx]: true }));
    try {
      const res = await unwrap(api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }));
      const urlStr = typeof res === 'string' ? res : (res?.url || res?.data?.url || '');
      updateCoGuest(idx, 'idDocumentUrl', urlStr);
    } catch (err) {
      f.setError('root', { message: errMsg(err, `Failed to upload document for Guest ${idx + 2}`) });
    } finally {
      setUploadingCoGuestDocs((prev) => ({ ...prev, [idx]: false }));
    }
  };

  const nights = Math.max(0, differenceInCalendarDays(parseISO(v.checkOutDate || t), parseISO(v.checkInDate || t)));
  const settings = useQuery({ queryKey: ['settings'], queryFn: () => unwrap(api.get('/settings')), staleTime: 300000 });
  const taxPercent = settings.data?.hotel?.booking?.taxPercent ?? 0;
  const totals = useMemo(() => calcTotals({ ...v, roomRate: Number(v.roomRate), nights, taxPercent, discount: Number(v.discount) }), [v.roomRate, v.extraBedCharge, v.otherCharges, v.discount, nights, taxPercent]);

  const avail = useQuery({
    queryKey: ['availability', v.checkInDate, v.checkOutDate, v.adults, v.children], enabled: step === 2 && nights > 0,
    queryFn: () => bookingApi.availability({ checkInDate: v.checkInDate, checkOutDate: v.checkOutDate, adults: v.adults, children: v.children })
  });

  useEffect(() => { if (opts.roomId && avail.data && !room) { const r = avail.data.rooms.find((x) => x._id === opts.roomId); if (r) pick(r); } }, [avail.data]);
  const pick = (r) => { setRoom(r); f.setValue('roomRate', r.sellablePrice); };

  const create = useMutate((b) => bookingApi.create(b), { success: (d) => `Booking ${d.booking.bookingNumber} created`, invalidate: ['calendar', 'bookings', 'dashboard', 'arrivals'], onSuccess: (d) => onDone(d.booking._id) });
  const lookup = async () => { const p = f.getValues('phone'); if (p.length < 7) return; try { const d = await unwrap(api.get('/guests', { params: { q: p, limit: 1 } })); setKnown(d.items[0] || null); } catch { setKnown(null); } };
  const useKnown = () => { Object.entries({ guestName: known.name, email: known.email || '', address: known.address || '', idType: known.idType || 'Aadhaar', idNumber: known.idNumber || '', idDocumentUrl: known.idDocumentUrl || '' }).forEach(([k, val]) => f.setValue(k, val)); setKnown(null); };

  const next = async () => {
    const schema = stepSchemas[step];
    if (schema) { const r = schema.safeParse(v); if (!r.success) { r.error.issues.forEach((i) => f.setError(i.path[0], { message: i.message })); return; } }
    if (step === 2 && !room) return f.setError('root', { message: 'Choose a room to continue.' });
    if (step === 4) { const amt = Number(v.payAmount) || 0; if (payMode !== 'unpaid' && amt <= 0) return f.setError('payAmount', { message: 'Enter the amount received.' }); if (amt > totals.total) return f.setError('payAmount', { message: `Amount cannot exceed the total of ${money(totals.total)}.` }); }
    setStep(step + 1);
  };

  const submit = () => {
    const amt = payMode === 'unpaid' ? 0 : Number(v.payAmount);
    const validCoGuests = coGuests.filter((cg) => cg.name?.trim() || cg.idNumber?.trim() || cg.idDocumentUrl);
    create.mutate({
      guest: { name: v.guestName, phone: v.phone, email: v.email || undefined, address: v.address || undefined, idType: v.idType || undefined, idNumber: v.idNumber || undefined, idDocumentUrl: v.idDocumentUrl || undefined, ...(known?._id && { _id: known._id }) },
      coGuests: validCoGuests,
      room: room._id, checkInDate: v.checkInDate, checkOutDate: v.checkOutDate, adults: Number(v.adults), children: Number(v.children),
      ...(can('bookings.edit_rate') ? { roomRate: Number(v.roomRate) } : {}),
      extraBedCharge: Number(v.extraBedCharge), otherCharges: Number(v.otherCharges), discount: Number(v.discount), source: walkIn ? 'walk_in' : 'reception', notes: v.notes || undefined,
      checkInNow: v.checkInNow && v.checkInDate === t, ...(amt > 0 && { payment: { amount: amt, method: v.payMethod } })
    });
  };
  const err = (k) => f.formState.errors[k]?.message;

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={null}
      footer={
        <div className="flex flex-col-reverse sm:flex-row w-full items-stretch sm:items-center justify-between gap-2.5">
          <button
            className="btn-ghost text-xs font-bold rounded-xl px-5 py-3 sm:py-2.5 w-full sm:w-auto min-h-[44px]"
            onClick={step > 0 ? () => setStep(step - 1) : onClose}
            disabled={create.isPending}
          >
            {step > 0 ? '← Back' : 'Cancel'}
          </button>
          {step < 5 ? (
            <button
              className="btn-primary text-xs font-bold px-6 py-3 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 w-full sm:w-auto min-h-[44px]"
              onClick={next}
            >
              Continue to {STEPS[step + 1]?.label} <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          ) : (
            <button
              className="btn-primary text-xs font-bold px-6 py-3 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 w-full sm:w-auto min-h-[44px]"
              onClick={submit}
              disabled={create.isPending}
            >
              {create.isPending && <Spinner />} Confirm Booking
            </button>
          )}
        </div>
      }
    >
      {/* Custom Header */}
      <div className="mb-4 sm:mb-6 flex items-start justify-between border-b border-slate-100 pb-3 sm:pb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100/80 shadow-2xs shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
              {walkIn ? 'Walk-in Guest Reservation' : 'New Booking'}
            </h2>
            <p className="text-[11px] sm:text-xs font-medium text-slate-500">Create a new reservation for a guest</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition shrink-0"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Step Bar (< sm) */}
      <div className="sm:hidden mb-4 rounded-xl bg-slate-50 border border-slate-200/80 p-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
          <span className="text-blue-600">Step {step + 1} of 6</span>
          <span className="truncate ml-2">{STEPS[step]?.label}</span>
        </div>
        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${((step + 1) / 6) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop Stepper (sm+) */}
      <div className="hidden sm:block mb-6 overflow-x-auto pb-2 cal-scroll">
        <ol className="flex items-center justify-between min-w-[640px] px-2" aria-label="Progress">
          {STEPS.map((s, i) => (
            <li key={s.label} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={cx(
                    'grid h-7 w-7 place-items-center rounded-full text-xs font-extrabold transition-all',
                    i < step ? 'bg-blue-600 text-white' : i === step ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-xs' : 'bg-slate-100 text-slate-500'
                  )}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <div>
                  <p className={cx('text-xs font-bold leading-none', i === step ? 'text-blue-600' : 'text-slate-800')}>{s.label}</p>
                  <p className="text-[10px] font-medium text-slate-400">{s.sub}</p>
                </div>
              </div>
              {i < STEPS.length - 1 && <span className="mx-2 h-0.5 w-6 bg-slate-200 shrink-0" />}
            </li>
          ))}
        </ol>
      </div>

      {/* Step 0: Guest Details */}
      {step === 0 && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Form Panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Guest Details</h3>
                  <p className="text-[11px] text-slate-500">Enter guest information or search existing guest</p>
                </div>
              </div>
              <div className="inline-flex rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setGuestMode('new')}
                  className={cx('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition', guestMode === 'new' ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-2xs' : 'text-slate-600 hover:text-slate-900')}
                >
                  <UserPlus className="h-3.5 w-3.5" /> New Guest
                </button>
                <button
                  type="button"
                  onClick={() => { setGuestMode('search'); lookup(); }}
                  className={cx('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition', guestMode === 'search' ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-2xs' : 'text-slate-600 hover:text-slate-900')}
                >
                  <Search className="h-3.5 w-3.5" /> Search Guest
                </button>
              </div>
            </div>

            {known && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-3 text-xs text-blue-900 flex items-center justify-between">
                <span>Returning guest found: <b>{known.name}</b></span>
                <button type="button" className="font-bold underline text-blue-700" onClick={useKnown}>Use Details</button>
              </div>
            )}

            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field label="Full Name *" error={err('guestName')}>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input className="input pl-9" placeholder="Enter full name" {...f.register('guestName')} autoFocus />
                </div>
              </Field>

              <Field label="Phone Number *" error={err('phone')}>
                <div className="flex gap-1.5">
                  <select className="input w-20 shrink-0 font-semibold" {...f.register('phonePrefix')}>
                    <option>+91</option>
                    <option>+1</option>
                    <option>+44</option>
                  </select>
                  <div className="relative flex-1">
                    <Phone className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input className="input pl-9" inputMode="tel" placeholder="9876543210" {...f.register('phone')} onBlur={lookup} />
                  </div>
                </div>
              </Field>

              <Field label="Email" error={err('email')}>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input className="input pl-9" type="email" placeholder="guest@example.com" {...f.register('email')} />
                </div>
              </Field>

              <Field label="Address">
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <textarea className="input pl-9 h-16 py-2 resize-none" placeholder="Enter complete address" {...f.register('address')} />
                </div>
              </Field>

              <Field label="ID Type">
                <select className="input" {...f.register('idType')}>
                  {['Aadhaar', 'Passport', 'Driving licence', 'Voter ID', 'Other'].map((x) => <option key={x}>{x}</option>)}
                </select>
              </Field>

              <Field label="ID Number">
                <div className="relative">
                  <IdCard className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input className="input pl-9" placeholder="Enter ID number" {...f.register('idNumber')} />
                </div>
              </Field>

              <Field label="Aadhaar / ID Card Document Upload (Optional)" className="sm:col-span-2">
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-3">
                  {v.idDocumentUrl ? (
                    <div className="flex items-center justify-between w-full gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-900">
                      <span className="flex items-center gap-2 truncate">
                        <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                        Aadhaar / ID Card Document Attached
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          className="rounded-md bg-white px-2 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-300 hover:bg-emerald-100"
                          onClick={() => openDocUrl(v.idDocumentUrl)}
                        >
                          View Document
                        </button>
                        <button
                          type="button"
                          className="rounded-md bg-white px-2 py-1 text-[11px] font-bold text-red-600 border border-red-200 hover:bg-red-50"
                          onClick={() => f.setValue('idDocumentUrl', '')}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                          <Camera className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">Upload Aadhaar Card / ID Document (Optional)</p>
                          <p className="text-[10px] text-slate-400">Scan or photo of Aadhaar Card, Passport or DL (Image or PDF)</p>
                        </div>
                      </div>
                      <label className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700 cursor-pointer shadow-2xs transition">
                        {uploadingDoc ? <Spinner /> : <Camera className="h-3.5 w-3.5" />}
                        {uploadingDoc ? 'Uploading...' : 'Choose File'}
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} disabled={uploadingDoc} />
                      </label>
                    </div>
                  )}
                </div>
              </Field>

              <Field label="Nationality" className="sm:col-span-2">
                <div className="relative">
                  <Globe className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <select className="input pl-9" {...f.register('nationality')}>
                    {['Indian', 'Foreigner', 'NRI'].map((x) => <option key={x}>{x}</option>)}
                  </select>
                </div>
              </Field>
            </div>

            {/* Additional Occupants / Co-Guests Section (e.g. 2nd, 3rd guest in room) */}
            <div className="pt-3 border-t border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    Additional Occupants / Co-Guests ({coGuests.length})
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    If multiple customers are staying in this room, enter their Aadhaar / ID details (upload is optional).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addCoGuest}
                  className="flex items-center gap-1 rounded-xl bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-2xs"
                >
                  <UserPlus className="h-3.5 w-3.5" /> + Add Co-Guest
                </button>
              </div>

              {coGuests.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-3.5 text-center text-xs text-slate-400 bg-slate-50/50">
                  Single guest reservation. Click <b>"+ Add Co-Guest"</b> or increase Adults count if multiple customers are staying in this room.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {coGuests.map((cg, idx) => (
                    <div key={idx} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                        <span className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                          <span className="grid h-5 w-5 place-items-center rounded-full bg-blue-600 text-white text-[10px] font-black">
                            {idx + 2}
                          </span>
                          Occupant #{idx + 2} (Aadhaar / ID Details)
                        </span>
                        <button
                          type="button"
                          onClick={() => removeCoGuest(idx)}
                          className="text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline"
                        >
                          ✕ Remove
                        </button>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label={`Occupant #${idx + 2} Full Name`}>
                          <div className="relative">
                            <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                              className="input pl-9"
                              placeholder="Enter co-guest full name"
                              value={cg.name || ''}
                              onChange={(e) => updateCoGuest(idx, 'name', e.target.value)}
                            />
                          </div>
                        </Field>

                        <Field label="ID Type">
                          <select
                            className="input"
                            value={cg.idType || 'Aadhaar'}
                            onChange={(e) => updateCoGuest(idx, 'idType', e.target.value)}
                          >
                            {['Aadhaar', 'Passport', 'Driving licence', 'Voter ID', 'Other'].map((x) => (
                              <option key={x}>{x}</option>
                            ))}
                          </select>
                        </Field>

                        <Field label="ID / Aadhaar Number (Optional)" className="sm:col-span-2">
                          <div className="relative">
                            <IdCard className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                              className="input pl-9"
                              placeholder="Enter Aadhaar or ID Number"
                              value={cg.idNumber || ''}
                              onChange={(e) => updateCoGuest(idx, 'idNumber', e.target.value)}
                            />
                          </div>
                        </Field>

                        {/* Co-Guest ID Card Document Upload (Optional) */}
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Aadhaar / ID Document Upload (Optional - Not Mandatory)
                          </label>
                          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-3">
                            {cg.idDocumentUrl ? (
                              <div className="flex items-center justify-between w-full gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-900">
                                <span className="flex items-center gap-2 truncate">
                                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                                  Occupant #{idx + 2} ID Document Attached
                                </span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    className="rounded-md bg-white px-2 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-300 hover:bg-emerald-100"
                                    onClick={() => openDocUrl(cg.idDocumentUrl)}
                                  >
                                    View Document
                                  </button>
                                  <button
                                    type="button"
                                    className="rounded-md bg-white px-2 py-1 text-[11px] font-bold text-red-600 border border-red-200 hover:bg-red-50"
                                    onClick={() => updateCoGuest(idx, 'idDocumentUrl', '')}
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2.5">
                                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                                    <Camera className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-slate-800">Upload Occupant #{idx + 2} Aadhaar / ID Proof</p>
                                    <p className="text-[10px] text-slate-400">Optional file upload (Image or PDF)</p>
                                  </div>
                                </div>
                                <label className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700 cursor-pointer shadow-2xs transition">
                                  {uploadingCoGuestDocs[idx] ? <Spinner /> : <Camera className="h-3.5 w-3.5" />}
                                  {uploadingCoGuestDocs[idx] ? 'Uploading...' : 'Choose File'}
                                  <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    className="hidden"
                                    onChange={(e) => handleCoGuestFileUpload(idx, e)}
                                    disabled={uploadingCoGuestDocs[idx]}
                                  />
                                </label>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Special Requests / Notes */}
            <div className="pt-2">
              <Field label="Special Requests / Notes (Optional)">
                <div className="relative">
                  <FileText className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <textarea className="input pl-9 h-16 py-2 resize-none" placeholder="Any special request, preference or notes..." {...f.register('notes')} />
                </div>
              </Field>
            </div>
          </div>

          {/* Right Panel Widgets */}
          <div className="space-y-4">
            {/* Guest Summary Card */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50/20 p-4">
              <div className="flex items-center gap-2 mb-3 text-blue-900">
                <Send className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-xs font-bold">Guest Information</p>
                  <p className="text-[10px] text-slate-400">Quick summary</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-2xs">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-400">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{v.guestName || 'New Guest'}</p>
                  <p className="text-[11px] text-slate-400">{v.phone ? `${v.phonePrefix} ${v.phone}` : 'Guest details will appear here'}</p>
                  {coGuests.length > 0 && (
                    <p className="text-[10px] font-bold text-blue-600 mt-1">
                      + {coGuests.length} Co-Guest{coGuests.length > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Tips Box */}
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/30 p-4">
              <div className="flex items-center gap-2 mb-2 text-amber-900">
                <Lightbulb className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-bold">Quick Tips</span>
              </div>
              <ul className="space-y-1.5 text-[11px] font-medium text-slate-700">
                <li className="flex items-center gap-1.5 text-emerald-700"><Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" /> If 3 guests in 1 room, add Aadhaar details for all 3</li>
                <li className="flex items-center gap-1.5 text-emerald-700"><Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" /> Aadhaar card upload is optional</li>
                <li className="flex items-center gap-1.5 text-emerald-700"><Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" /> Search existing guest to save time</li>
                <li className="flex items-center gap-1.5 text-emerald-700"><Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" /> All guest data stored securely</li>
              </ul>
            </div>

            {/* Data Privacy Box */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 flex items-start gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-600">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-blue-900">Data Privacy</p>
                <p className="text-[11px] font-medium text-slate-600 leading-tight mt-0.5">
                  Guest information is stored securely and used only for hotel operations.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Stay Details */}
      {step === 1 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Check-in Date *" error={err('checkInDate')}>
            <input type="date" className="input" min={t} {...f.register('checkInDate')} />
          </Field>
          <Field label="Check-out Date *" error={err('checkOutDate')}>
            <input type="date" className="input" min={v.checkInDate} {...f.register('checkOutDate')} />
          </Field>
          <Field label="Adults *" error={err('adults')}>
            <input type="number" min="1" className="input" {...f.register('adults')} />
          </Field>
          <Field label="Children" error={err('children')}>
            <input type="number" min="0" className="input" {...f.register('children')} />
          </Field>
          <p className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 text-xs text-blue-900 sm:col-span-2">
            {nights > 0 ? (
              <>This stay is <b>{nights} night{nights > 1 ? 's' : ''}</b> for <b>{v.adults || 1} Adult{Number(v.adults) > 1 ? 's' : ''}</b>. The room is held for those nights and is free again on the check-out date.</>
            ) : (
              'Pick the dates to see the number of nights.'
            )}
          </p>
        </div>
      )}

      {/* Step 2: Select Room */}
      {step === 2 && (
        <div>
          {err('root') && <p className="mb-3 text-xs font-bold text-red-600">{err('root')}</p>}
          {avail.isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
          ) : avail.isError ? (
            <ErrorState error={avail.error} onRetry={() => avail.refetch()} />
          ) : !avail.data?.rooms?.length ? (
            <EmptyState title="No rooms free for these dates" message="Try different dates, or check the room calendar." />
          ) : (
            <div className="grid max-h-[46vh] gap-3 overflow-y-auto sm:grid-cols-2">
              {avail.data.rooms.map((r) => {
                return (
                  <button
                    key={r._id}
                    onClick={() => pick(r)}
                    className={cx(
                      'rounded-2xl border p-3.5 text-left transition-all',
                      room?._id === r._id ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 font-bold text-slate-900">
                        <BedDouble className="h-4 w-4 text-blue-600" /> Room {r.roomNumber}
                      </span>
                      <span className="font-extrabold text-blue-600">{money(r.sellablePrice)}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {r.roomType?.name} · Floor {r.floor} ·{' '}
                      <span className={cx('inline-flex items-center gap-1 font-semibold', r.sellableIsAC ? 'text-sky-600' : 'text-purple-600')}>
                        {r.sellableIsAC ? <Snowflake className="h-3 w-3" /> : <Wind className="h-3 w-3" />}
                        {r.sellableIsAC ? 'AC' : 'Non-AC'}
                      </span>
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Pricing */}
      {step === 3 && (
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Field label="Room Rate Per Night" hint={!can('bookings.edit_rate') ? 'Only managers can change rate.' : undefined}>
            <input type="number" className="input" disabled={!can('bookings.edit_rate')} {...f.register('roomRate')} />
          </Field>
          <Field label="Nights">
            <input className="input" disabled value={nights} />
          </Field>
          <Field label="Extra Bed Charge">
            <input type="number" min="0" className="input" {...f.register('extraBedCharge')} />
          </Field>
          <Field label="Other Charges">
            <input type="number" min="0" className="input" {...f.register('otherCharges')} />
          </Field>
          <Field label="Discount" hint={!can('bookings.give_discount') ? 'Admin permission required to give discounts.' : undefined} error={Number(v.discount) > totals.subtotal ? 'Discount cannot exceed subtotal.' : undefined}>
            <input type="number" min="0" className="input" disabled={!can('bookings.give_discount')} {...f.register('discount')} />
          </Field>
          <Field label="Notes">
            <input className="input" placeholder="Optional notes" {...f.register('notes')} />
          </Field>
          <Totals totals={totals} taxPercent={taxPercent} className="sm:col-span-2" />
        </div>
      )}

      {/* Step 4: Payment */}
      {step === 4 && (
        <div className="space-y-4">
          <Totals totals={totals} taxPercent={taxPercent} />
          <div className="grid grid-cols-3 gap-2">
            {[
              ['unpaid', 'Unpaid'],
              ['partial', 'Partial'],
              ['full', 'Paid in full'],
            ].map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setPayMode(k);
                  f.setValue('payAmount', k === 'full' ? totals.total : k === 'unpaid' ? 0 : '');
                }}
                className={cx(
                  'rounded-xl border px-3 py-2.5 text-xs font-bold transition-all',
                  payMode === k ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs' : 'border-slate-200 hover:bg-slate-50'
                )}
              >
                {l}
              </button>
            ))}
          </div>

          {payMode !== 'unpaid' && (
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field label="Amount Received" error={err('payAmount')}>
                <input type="number" min="1" className="input" {...f.register('payAmount')} />
              </Field>
              <Field label="Payment Method">
                <select className="input" {...f.register('payMethod')}>
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
          )}
        </div>
      )}

      {/* Step 5: Confirm */}
      {step === 5 && (
        <div className="space-y-4 text-xs">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
            {[
              ['Primary Guest', `${v.guestName} (${v.phone})`],
              ['Room Selected', `${room?.roomNumber} · ${room?.roomType?.name}`],
              ['Dates', `${v.checkInDate} → ${v.checkOutDate} (${nights} nights)`],
              ['Occupants Count', `${v.adults} Adults, ${v.children} Children`],
              ['Total Amount', money(totals.total)],
              ['Paying Now', payMode === 'unpaid' ? 'Unpaid' : money(v.payAmount)],
            ].map(([k, val]) => (
              <div key={k}>
                <dt className="font-semibold text-slate-400">{k}</dt>
                <dd className="font-bold text-slate-900 text-sm mt-0.5">{val}</dd>
              </div>
            ))}
          </dl>

          {/* Occupants / Aadhaar List Summary */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Occupants & ID Details ({1 + coGuests.filter((cg) => cg.name || cg.idNumber).length})
            </h4>
            <div className="space-y-2">
              {/* Primary Guest */}
              <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="font-bold text-slate-900">1. {v.guestName}</span>
                  <span className="text-slate-500 ml-2">({v.idType || 'Aadhaar'}: {v.idNumber || 'Not entered'})</span>
                </div>
                {v.idDocumentUrl ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Doc Uploaded
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">No doc upload</span>
                )}
              </div>

              {/* Co-Guests */}
              {coGuests.map((cg, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <span className="font-bold text-slate-900">{idx + 2}. {cg.name || `Occupant #${idx + 2}`}</span>
                    <span className="text-slate-500 ml-2">({cg.idType || 'Aadhaar'}: {cg.idNumber || 'Not entered'})</span>
                  </div>
                  {cg.idDocumentUrl ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Doc Uploaded
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">No doc upload</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {v.checkInDate === t && (
            <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer">
              <input type="checkbox" className="h-4 w-4 rounded text-blue-600" {...f.register('checkInNow')} />
              Check guest in immediately upon confirmation
            </label>
          )}
        </div>
      )}
    </Modal>
  );
}

export function Totals({ totals, taxPercent, className }) {
  return (
    <dl className={cx('space-y-1.5 rounded-2xl border border-slate-200/80 bg-slate-50 p-4 text-xs', className)}>
      <div className="flex justify-between"><dt className="text-slate-500 font-medium">Subtotal</dt><dd className="font-bold text-slate-900">{money(totals.subtotal)}</dd></div>
      <div className="flex justify-between"><dt className="text-slate-500 font-medium">Tax ({taxPercent}%)</dt><dd className="font-bold text-slate-900">{money(totals.tax)}</dd></div>
      <div className="flex justify-between border-t border-slate-200 pt-2 text-sm"><dt className="font-extrabold text-slate-900">Total Amount</dt><dd className="font-extrabold text-blue-600">{money(totals.total)}</dd></div>
    </dl>
  );
}

