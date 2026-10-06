import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Search, RefreshCw, Calendar as CalendarIcon, SlidersHorizontal } from 'lucide-react';
import { startOfMonth, endOfMonth, getDaysInMonth, addMonths, subMonths, format } from 'date-fns';
import { bookingApi } from '../../services/booking.api';
import { roomApi } from '../../services/room.api';
import { useUI } from '../../store/ui';
import { useCan } from '../../store/auth';
import { useMutate } from '../../hooks/useMutate';
import RoomCalendar from '../../components/calendar/RoomCalendar';
import { PageHeader, ErrorState, Skeleton, ConfirmDialog, cx } from '../../components/common/ui';
import { STATUS, iso, today, addDays, parseISO, fmtDate, utcDate } from '../../utils/format';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const LEGEND = ['confirmed', 'checked_in', 'checked_out', 'hold', 'maintenance', 'cancelled', 'temp_non_ac'];

export default function RoomCalendarPage() {
  const can = useCan();
  const { openBooking, openWizard } = useUI();

  // Selected Month as main timeline range (defaults to current month)
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(today()));

  const [f, setF] = useState({ roomType: '', floor: '', status: '', bookingStatus: '', q: '' });
  const [dq, setDq] = useState('');
  const [pending, setPending] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDq(f.q.trim()), 350);
    return () => clearTimeout(t);
  }, [f.q]);

  // Full month date range calculations: from 1st of month to 1st of next month
  const from = startOfMonth(currentMonth);
  const days = getDaysInMonth(currentMonth);
  const to = startOfMonth(addMonths(currentMonth, 1));

  const params = {
    from: iso(from),
    to: iso(to),
    ...Object.fromEntries(Object.entries({ ...f, q: dq }).filter(([, v]) => v))
  };

  const cal = useQuery({
    queryKey: ['room-calendar', params],
    queryFn: () => bookingApi.calendar(params),
    placeholderData: (p) => p,
    refetchInterval: 60000
  });

  const types = useQuery({
    queryKey: ['room-types'],
    queryFn: roomApi.types,
    staleTime: 300000
  });

  const floors = useMemo(() => [...new Set((cal.data?.rooms || []).map((r) => r.floor))].sort(), [cal.data]);
  const invalidate = ['room-calendar', 'calendar', 'bookings', 'dashboard', 'booking'];
  const move = useMutate(({ id, body }) => bookingApi.move(id, body), { success: 'Booking updated', invalidate });

  const onMove = (b, room, newStart) => {
    const nights = b.nights;
    const inDate = b.bookingStatus === 'checked_in' ? utcDate(b.checkInDate) : newStart;
    const outDate = b.bookingStatus === 'checked_in' ? utcDate(b.checkOutDate) : addDays(newStart, nights);
    const oldRoom = cal.data?.rooms.find((r) => r._id === (b.room?._id || b.room));
    const same = room._id === (b.room?._id || b.room) && iso(inDate) === iso(utcDate(b.checkInDate));
    if (same) return;
    setPending({ b, room, oldRoom, inDate, outDate });
  };

  const data = cal.data;
  const confirmMove = () => {
    const p = pending;
    move.mutate(
      { id: p.b._id, body: { room: p.room._id, checkInDate: iso(p.inDate), checkOutDate: iso(p.outDate), reason: 'Moved on room calendar' } },
      { onSettled: () => setPending(null) }
    );
  };

  const onResize = (b, delta) => {
    const out = addDays(utcDate(b.checkOutDate), delta);
    move.mutate({ id: b._id, body: { checkOutDate: iso(out) } });
  };

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const currentYear = currentMonth.getFullYear();
  const currentMonthIdx = currentMonth.getMonth();

  const handleSelectMonth = (idx) => {
    setCurrentMonth(new Date(currentYear, idx, 1));
  };

  const handleSelectYear = (yr) => {
    setCurrentMonth(new Date(Number(yr), currentMonthIdx, 1));
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Room Calendar"
        subtitle="Timeline view of hotel room inventory, drag and drop bookings or extend/shorten stays."
        actions={
          <>
            {cal.isFetching && <RefreshCw className="h-4 w-4 animate-spin text-slate-400" aria-label="Refreshing" />}
            {can('bookings.create') && <button className="btn-primary" onClick={() => openWizard()}>+ New Booking</button>}
          </>
        }
      />

      {/* Month Navigation Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Stepper: [<] Month Year [>] */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50/80 p-1">
            <button
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors shadow-2xs"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              title="Previous month"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Interactive Month & Year Selectors */}
            <div className="flex items-center px-1.5">
              <select
                value={currentMonthIdx}
                onChange={(e) => handleSelectMonth(Number(e.target.value))}
                className="text-sm font-extrabold text-slate-800 bg-transparent py-0.5 px-1 focus:outline-none cursor-pointer"
              >
                {MONTHS.map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>

              <select
                value={currentYear}
                onChange={(e) => handleSelectYear(e.target.value)}
                className="text-sm font-extrabold text-slate-800 bg-transparent py-0.5 px-1 focus:outline-none cursor-pointer"
              >
                {[2024, 2025, 2026, 2027, 2028, 2029].map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>

            <button
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors shadow-2xs"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              title="Next month"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Today Button */}
          <button
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            onClick={() => setCurrentMonth(startOfMonth(today()))}
          >
            <CalendarIcon className="h-3.5 w-3.5 text-blue-600" />
            Today
          </button>
        </div>

        {/* Date span pill */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <span className="hidden sm:inline-block px-3 py-1.5 rounded-xl bg-slate-100/80 text-slate-700 border border-slate-200/60">
            {`${fmtDate(from, 'd MMMM')} – ${fmtDate(addDays(from, days - 1), 'd MMMM yyyy')}`} ({days} days)
          </span>
        </div>
      </div>


      {/* Filters */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <select className="input" value={f.roomType} onChange={set('roomType')} aria-label="Room type">
          <option value="">All room types</option>
          {(types.data?.items || []).map((t) => (
            <option key={t._id} value={t._id}>{t.name}</option>
          ))}
        </select>

        <select className="input" value={f.floor} onChange={set('floor')} aria-label="Floor">
          <option value="">All floors</option>
          {floors.map((x) => (
            <option key={x} value={x}>Floor {x}</option>
          ))}
        </select>

        <select className="input" value={f.status} onChange={set('status')} aria-label="Room status">
          <option value="">Any room status</option>
          {['available', 'occupied', 'cleaning', 'maintenance', 'out_of_service'].map((s) => (
            <option key={s} value={s}>{STATUS[s].label}</option>
          ))}
        </select>

        <select className="input" value={f.bookingStatus} onChange={set('bookingStatus')} aria-label="Booking status">
          <option value="">Any booking status</option>
          {['confirmed', 'checked_in', 'checked_out', 'hold'].map((s) => (
            <option key={s} value={s}>{STATUS[s].label}</option>
          ))}
        </select>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Guest, booking ID or room"
            value={f.q}
            onChange={set('q')}
            aria-label="Search room calendar"
          />
        </div>
      </div>

      {/* Main Room Calendar Grid */}
      {cal.isLoading ? (
        <Skeleton className="h-[460px] w-full rounded-xl" />
      ) : cal.isError && !data ? (
        <div className="card">
          <ErrorState error={cal.error} onRetry={() => cal.refetch()} />
        </div>
      ) : (
        <RoomCalendar
          data={data}
          from={from}
          days={days}
          colW={60}
          editable={can('calendar.edit')}

          onOpen={(b) => openBooking(b._id)}
          onMove={onMove}
          onResize={onResize}
          onEmptyClick={(room, idx) =>
            can('bookings.create') &&
            openWizard({
              roomId: room._id,
              checkIn: iso(addDays(from, idx)),
              checkOut: iso(addDays(from, idx + 1))
            })
          }
        />
      )}

      {/* Legend & Summary Pill Counters */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-semibold text-slate-600" aria-label="Legend">
          {LEGEND.map((k) => (
            <li key={k} className="flex items-center gap-1.5">
              <i className={cx('h-3 w-3 rounded', STATUS[k].bar)} />
              {STATUS[k].label}
            </li>
          ))}
        </ul>

        {data && (
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <Pill l="Total" v={data.summary.total} />
            <Pill l="Occupied" v={data.summary.occupied} c="bg-blue-50 text-blue-700" />
            <Pill l="Available" v={data.summary.available} c="bg-emerald-50 text-emerald-700" />
            <Pill l="Cleaning" v={data.summary.cleaning} c="bg-amber-50 text-amber-700" />
            <Pill l="Maintenance" v={data.summary.maintenance + data.summary.out_of_service} c="bg-orange-50 text-orange-700" />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!pending}
        onClose={() => setPending(null)}
        onConfirm={confirmMove}
        busy={move.isPending}
        confirmLabel="Move booking"
        title="Move this booking?"
        message={
          pending &&
          `${pending.b.guest?.name}: Room ${pending.oldRoom?.roomNumber ?? ''} ${fmtDate(pending.b.checkInDate, 'd MMM')}–${fmtDate(pending.b.checkOutDate, 'd MMM')}  →  Room ${pending.room.roomNumber} ${fmtDate(pending.inDate, 'd MMM')}–${fmtDate(pending.outDate, 'd MMM')}. The server will check the room is free first.`
        }
      />
    </div>
  );
}

const Pill = ({ l, v, c = 'bg-slate-100 text-slate-700' }) => (
  <span className={cx('rounded-full px-3 py-1', c)}>{v} {l}</span>
);
