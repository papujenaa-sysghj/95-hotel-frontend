import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Search, RefreshCw } from 'lucide-react';
import { bookingApi } from '../../services/booking.api';
import { roomApi } from '../../services/room.api';
import { useUI } from '../../store/ui';
import { useCan } from '../../store/auth';
import { useMutate } from '../../hooks/useMutate';
import RoomCalendar from '../../components/calendar/RoomCalendar';
import { PageHeader, ErrorState, Skeleton, ConfirmDialog, cx } from '../../components/common/ui';
import { STATUS, iso, today, addDays, parseISO, fmtDate, utcDate } from '../../utils/format';
import { startOfMonth, getDaysInMonth, format } from 'date-fns';

const VIEWS = [{ k: 'day', l: 'Day', n: 1, w: 320 }, { k: '7', l: '7 days', n: 7, w: 104 }, { k: '14', l: '14 days', n: 14, w: 70 }, { k: 'month', l: 'Month', n: 31, w: 44 }];
const LEGEND = ['confirmed', 'checked_in', 'checked_out', 'hold', 'maintenance', 'cancelled', 'temp_non_ac'];

export default function CalendarPage() {
  const can = useCan(); const { openBooking, openWizard } = useUI();
  const [view, setView] = useState('14'); const [anchor, setAnchor] = useState(today());
  const [f, setF] = useState({ roomType: '', floor: '', status: '', bookingStatus: '', q: '' }); const [dq, setDq] = useState(''); const [pending, setPending] = useState(null);
  useEffect(() => { const t = setTimeout(() => setDq(f.q.trim()), 350); return () => clearTimeout(t); }, [f.q]);

  const cfg = VIEWS.find((v) => v.k === view);
  const from = view === 'month' ? startOfMonth(anchor) : anchor; const days = view === 'month' ? getDaysInMonth(anchor) : cfg.n;
  const params = { from: iso(from), to: iso(addDays(from, days)), ...Object.fromEntries(Object.entries({ ...f, q: dq }).filter(([, v]) => v)) };
  const cal = useQuery({ queryKey: ['calendar', params], queryFn: () => bookingApi.calendar(params), placeholderData: (p) => p, refetchInterval: 60000 });
  const types = useQuery({ queryKey: ['room-types'], queryFn: roomApi.types, staleTime: 300000 });
  const floors = useMemo(() => [...new Set((cal.data?.rooms || []).map((r) => r.floor))].sort(), [cal.data]);

  const step = view === 'month' ? 0 : days; const go = (dir) => setAnchor(view === 'month' ? new Date(anchor.getFullYear(), anchor.getMonth() + dir, 1) : addDays(anchor, dir * Math.max(1, step)));
  const invalidate = ['calendar', 'bookings', 'dashboard', 'booking'];
  const move = useMutate(({ id, body }) => bookingApi.move(id, body), { success: 'Booking updated', invalidate });

  // Drag/drop → ask to confirm, then let the SERVER validate availability. Nothing is saved locally.
  const onMove = (b, room, newStart) => {
    const nights = b.nights; const inDate = b.bookingStatus === 'checked_in' ? utcDate(b.checkInDate) : newStart; const outDate = b.bookingStatus === 'checked_in' ? utcDate(b.checkOutDate) : addDays(newStart, nights);
    const oldRoom = data?.rooms.find((r) => r._id === (b.room?._id || b.room)); const same = room._id === (b.room?._id || b.room) && iso(inDate) === iso(utcDate(b.checkInDate)); if (same) return;
    setPending({ b, room, oldRoom, inDate, outDate });
  };
  const data = cal.data;
  const confirmMove = () => { const p = pending; move.mutate({ id: p.b._id, body: { room: p.room._id, checkInDate: iso(p.inDate), checkOutDate: iso(p.outDate), reason: 'Moved on calendar' } }, { onSettled: () => setPending(null) }); };
  const onResize = (b, delta) => { const out = addDays(utcDate(b.checkOutDate), delta); move.mutate({ id: b._id, body: { checkOutDate: iso(out) } }); };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return <>
    <PageHeader title="Room calendar" subtitle="Drag a booking to another room or date, or pull its right edge to extend or shorten the stay."
      actions={<>{cal.isFetching && <RefreshCw className="h-4 w-4 animate-spin text-slate-400" aria-label="Refreshing" />}{can('bookings.create') && <button className="btn-primary" onClick={() => openWizard()}>New booking</button>}</>} />
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <div className="flex items-center rounded-lg border border-slate-200 bg-white"><button className="p-2 hover:bg-slate-50" onClick={() => go(-1)} aria-label="Previous"><ChevronLeft className="h-4 w-4" /></button><button className="border-x border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50" onClick={() => setAnchor(today())}>Today</button><button className="p-2 hover:bg-slate-50" onClick={() => go(1)} aria-label="Next"><ChevronRight className="h-4 w-4" /></button></div>
      <input type="date" className="input w-40" value={iso(anchor)} onChange={(e) => e.target.value && setAnchor(parseISO(e.target.value))} aria-label="Jump to date" />
      <span className="text-sm font-bold text-slate-700">{view === 'month' ? format(anchor, 'MMMM yyyy') : `${fmtDate(from, 'd MMM')} – ${fmtDate(addDays(from, days - 1), 'd MMM yyyy')}`}</span>
      <div className="ml-auto flex rounded-lg bg-slate-100 p-1">{VIEWS.map((v) => <button key={v.k} onClick={() => setView(v.k)} className={cx('rounded-md px-3 py-1 text-sm font-semibold', view === v.k ? 'bg-white shadow-sm' : 'text-slate-500')}>{v.l}</button>)}</div></div>
    <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
      <select className="input" value={f.roomType} onChange={set('roomType')} aria-label="Room type"><option value="">All room types</option>{(types.data?.items || []).map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}</select>
      <select className="input" value={f.floor} onChange={set('floor')} aria-label="Floor"><option value="">All floors</option>{floors.map((x) => <option key={x} value={x}>Floor {x}</option>)}</select>
      <select className="input" value={f.status} onChange={set('status')} aria-label="Room status"><option value="">Any room status</option>{['available', 'occupied', 'cleaning', 'maintenance', 'out_of_service'].map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}</select>
      <select className="input" value={f.bookingStatus} onChange={set('bookingStatus')} aria-label="Booking status"><option value="">Any booking status</option>{['confirmed', 'checked_in', 'checked_out', 'hold'].map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}</select>
      <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input className="input pl-9" placeholder="Guest, booking ID or room" value={f.q} onChange={set('q')} aria-label="Search calendar" /></div></div>

    {cal.isLoading ? <Skeleton className="h-[420px] w-full" /> : cal.isError && !data ? <div className="card"><ErrorState error={cal.error} onRetry={() => cal.refetch()} /></div> :
      <RoomCalendar data={data} from={from} days={days} colW={cfg.w} editable={can('calendar.edit')} onOpen={(b) => openBooking(b._id)} onMove={onMove} onResize={onResize}
        onEmptyClick={(room, idx) => can('bookings.create') && openWizard({ roomId: room._id, checkIn: iso(addDays(from, idx)), checkOut: iso(addDays(from, idx + 1)) })} />}
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-semibold text-slate-600" aria-label="Legend">{LEGEND.map((k) => <li key={k} className="flex items-center gap-1.5"><i className={cx('h-3 w-3 rounded', STATUS[k].bar)} />{STATUS[k].label}</li>)}</ul>
      {data && <div className="flex flex-wrap gap-2 text-xs font-bold"><Pill l="Total" v={data.summary.total} /><Pill l="Occupied" v={data.summary.occupied} c="bg-blue-50 text-blue-700" /><Pill l="Available" v={data.summary.available} c="bg-emerald-50 text-emerald-700" /><Pill l="Cleaning" v={data.summary.cleaning} c="bg-amber-50 text-amber-700" /><Pill l="Maintenance" v={data.summary.maintenance + data.summary.out_of_service} c="bg-orange-50 text-orange-700" /></div>}</div>

    <ConfirmDialog open={!!pending} onClose={() => setPending(null)} onConfirm={confirmMove} busy={move.isPending} confirmLabel="Move booking" title="Move this booking?"
      message={pending && `${pending.b.guest?.name}: Room ${pending.oldRoom?.roomNumber ?? ''} ${fmtDate(pending.b.checkInDate, 'd MMM')}–${fmtDate(pending.b.checkOutDate, 'd MMM')}  →  Room ${pending.room.roomNumber} ${fmtDate(pending.inDate, 'd MMM')}–${fmtDate(pending.outDate, 'd MMM')}. The server will check the room is free first.`} />
  </>;
}
const Pill = ({ l, v, c = 'bg-slate-100 text-slate-700' }) => <span className={cx('rounded-full px-3 py-1', c)}>{v} {l}</span>;
