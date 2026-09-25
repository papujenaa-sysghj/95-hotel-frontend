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
      guestName: '', phone: '9876543210', phonePrefix: '+91', email: '', address: '', idType: 'Aadhaar', idNumber: '', idDocumentUrl: '', nationality: 'Indian',
      checkInDate: opts.checkIn || t, checkOutDate: opts.checkOut || iso(addDays(today(), 1)), adults: 1, children: 0, roomRate: 0, extraBedCharge: 0, otherCharges: 0, discount: 0,
      payAmount: 0, payMethod: 'cash', notes: '', checkInNow: walkIn
    }
  });
  const [uploadingDoc, setUploadingDoc] = useState(false);

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

  const v = f.watch(); const nights = Math.max(0, differenceInCalendarDays(parseISO(v.checkOutDate || t), parseISO(v.checkInDate || t)));
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
    create.mutate({
      guest: { name: v.guestName, phone: v.phone, email: v.email || undefined, address: v.address || undefined, idType: v.idType || undefined, idNumber: v.idNumber || undefined, idDocumentUrl: v.idDocumentUrl || undefined, ...(known?._id && { _id: known._id }) },
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
        <div className="flex w-full items-center justify-between">
          <button className="btn-ghost text-xs font-bold rounded-xl px-5 py-2.5" onClick={step > 0 ? () => setStep(step - 1) : onClose} disabled={create.isPending}>
            {step > 0 ? 'Back' : 'Cancel'}
          </button>
          {step < 5 ? (
            <button className="btn-primary text-xs font-bold px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20" onClick={next}>
              Continue to {STEPS[step + 1]?.label} <ArrowRight className="h-4 w-4 ml-1" />
            </button>
          ) : (
            <button className="btn-primary text-xs font-bold px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20" onClick={submit} disabled={create.isPending}>
              {create.isPending && <Spinner />} Confirm Booking
            </button>
          )}
        </div>
      }
    >
      {/* Custom Header */}
      <div className="mb-6 flex items-start justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100/80 shadow-2xs">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">{walkIn ? 'Walk-in Guest Reservation' : 'New Booking'}</h2>
            <p className="text-xs font-medium text-slate-500">Create a new reservation for a guest</p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* 6 Step Stepper */}
      <div className="mb-6 overflow-x-auto pb-2">
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

              <Field label="Aadhaar / ID Card Document Upload" className="sm:col-span-2">
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
                          <p className="text-xs font-bold text-slate-800">Upload Aadhaar Card / ID Document</p>
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

              <Field label="Special Requests / Notes (Optional)" className="sm:col-span-2">
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
                <li className="flex items-center gap-1.5 text-emerald-700"><Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" /> Search existing guest to save time</li>
                <li className="flex items-center gap-1.5 text-emerald-700"><Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" /> ID proof is required for check-in</li>
                <li className="flex items-center gap-1.5 text-emerald-700"><Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" /> You can add special requests later</li>
                <li className="flex items-center gap-1.5 text-emerald-700"><Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" /> Guest will be saved to your database</li>
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
              <>This stay is <b>{nights} night{nights > 1 ? 's' : ''}</b>. The room is held for those nights and is free again on the check-out date.</>
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
              ['Guest Name', `${v.guestName} (${v.phone})`],
              ['Room Selected', `${room?.roomNumber} · ${room?.roomType?.name}`],
              ['Dates', `${v.checkInDate} → ${v.checkOutDate} (${nights} nights)`],
              ['Occupants', `${v.adults} Adults, ${v.children} Children`],
              ['Total Amount', money(totals.total)],
              ['Paying Now', payMode === 'unpaid' ? 'Unpaid' : money(v.payAmount)],
            ].map(([k, val]) => (
              <div key={k}>
                <dt className="font-semibold text-slate-400">{k}</dt>
                <dd className="font-bold text-slate-900 text-sm mt-0.5">{val}</dd>
              </div>
            ))}
          </dl>

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

