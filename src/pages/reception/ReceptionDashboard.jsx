import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Footprints, LogIn, LogOut, CreditCard, ArrowRightLeft, SprayCan, Printer, BedDouble, DoorOpen, DoorClosed, Clock3, Plane, Grid, ListFilter } from 'lucide-react';
import { dashboardApi } from '../../services/resource.api';
import { bookingApi } from '../../services/booking.api';
import { useUI } from '../../store/ui';
import { useCan } from '../../store/auth';
import { Card, Stat, QueryBoundary, Badge } from '../../components/common/ui';
import { RoomStatusGrid, RoomLegend } from '../../components/dashboard/widgets';
import { fmtDate, money, today, iso, addDays } from '../../utils/format';

export default function ReceptionDashboard() {
  const nav = useNavigate();
  const { openWizard, openBooking } = useUI();
  const can = useCan();
  const todayStr = new Date().toISOString().slice(0, 10);
  const [statusDate, setStatusDate] = useState(todayStr);
  const [overviewFilter, setOverviewFilter] = useState('all');
  const [selectedFloor, setSelectedFloor] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  const q = useQuery({ queryKey: ['dashboard', 'reception', statusDate], queryFn: () => dashboardApi.summary({ date: statusDate }), refetchInterval: 45000 });
  const up = useQuery({ queryKey: ['bookings', 'upcoming'], queryFn: () => bookingApi.list({ status: 'confirmed,hold', from: iso(addDays(today(), 1)), limit: 5 }) });
  const pend = useQuery({ queryKey: ['bookings', 'pending-pay'], queryFn: () => bookingApi.list({ status: 'confirmed,checked_in', limit: 100 }) });

  const s = q.data?.stats;
  const owing = (pend.data?.items || []).filter((b) => b.balanceAmount > 0).slice(0, 5);

  const TOP_ACTIONS = [
    { label: 'New Booking', icon: Plus, bg: 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 hover:bg-blue-700', onClick: () => openWizard(), perm: 'bookings.create' },
    { label: 'Walk-in Guest', icon: Footprints, bg: 'bg-emerald-100/70 text-emerald-800 hover:bg-emerald-200/80 border border-emerald-200', onClick: () => openWizard({ walkIn: true }), perm: 'bookings.create' },
    { label: 'Check-in', icon: LogIn, bg: 'bg-blue-100/70 text-blue-800 hover:bg-blue-200/80 border border-blue-200', link: '/check-in', perm: 'checkin.perform' },
    { label: 'Check-out', icon: LogOut, bg: 'bg-orange-100/70 text-orange-800 hover:bg-orange-200/80 border border-orange-200', link: '/check-out', perm: 'checkout.perform' },
    { label: 'Take Payment', icon: CreditCard, bg: 'bg-purple-100/70 text-purple-800 hover:bg-purple-200/80 border border-purple-200', link: '/payments', perm: 'payments.create' },
    { label: 'Change Room', icon: ArrowRightLeft, bg: 'bg-amber-100/70 text-amber-800 hover:bg-amber-200/80 border border-amber-200', link: '/bookings?status=checked_in,confirmed', perm: 'bookings.edit' },
    { label: 'Room Status', icon: SprayCan, bg: 'bg-teal-100/70 text-teal-800 hover:bg-teal-200/80 border border-teal-200', link: '/housekeeping', perm: 'housekeeping.view' },
    { label: 'Print Invoice', icon: Printer, bg: 'bg-violet-100/70 text-violet-800 hover:bg-violet-200/80 border border-violet-200', link: '/invoices', perm: 'invoices.view' },
  ].filter((a) => can(a.perm));

  const filteredRooms = (q.data?.roomGrid || []).filter((r) => {
    if (selectedFloor !== 'all' && (r.floor || Math.floor(parseInt(r.roomNumber) / 100)) !== Number(selectedFloor)) return false;
    if (selectedType !== 'all' && r.roomType !== selectedType) return false;
    return true;
  });

  return (
    <div className="space-y-5 pb-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-50 via-white to-amber-50/30 p-5 shadow-2xs">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">Front Desk</h1>
          <p className="mt-0.5 text-xs font-medium text-slate-500 sm:text-sm">
            Manage today's arrivals, departures and rooms with ease.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-amber-200/60 bg-amber-50/40 p-2.5 shadow-2xs">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500 text-white shadow-xs">🛎️</span>
          <div>
            <p className="text-xs font-extrabold text-slate-900">Great service</p>
            <p className="text-[11px] font-semibold text-amber-800">creates great stays.</p>
          </div>
        </div>
      </div>

      {/* Top Action Buttons Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {TOP_ACTIONS.map((a) => {
          const btn = (
            <div className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-extrabold transition-all cursor-pointer min-h-[44px] text-center ${a.bg}`}>
              <a.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{a.label}</span>
            </div>
          );
          return a.link ? <Link key={a.label} to={a.link}>{btn}</Link> : <div key={a.label} onClick={a.onClick}>{btn}</div>;
        })}
      </div>

      {/* 6 Stat Cards Row */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
        <Stat
          loading={q.isLoading}
          label="Total Rooms"
          value={s?.totalRooms ?? 0}
          icon={BedDouble}
          tone="bg-blue-50 text-blue-600"
        />
        <Stat
          loading={q.isLoading}
          label="Occupied"
          value={s?.occupied ?? 0}
          hint={s?.totalRooms ? `${Math.round(((s.occupied || 0) / s.totalRooms) * 100)}%` : '0%'}
          icon={DoorClosed}
          tone="bg-blue-50 text-blue-600"
        />
        <Stat
          loading={q.isLoading}
          label="Available"
          value={s?.available ?? 0}
          hint={s?.totalRooms ? `${Math.round(((s.available || 0) / s.totalRooms) * 100)}%` : '0%'}
          icon={DoorOpen}
          tone="bg-emerald-50 text-emerald-600"
        />
        <Stat
          loading={q.isLoading}
          label="Arrivals Today"
          value={s?.todayCheckIns ?? 0}
          hint={s?.todayCheckIns ? `${s.todayCheckIns} scheduled` : undefined}
          icon={LogIn}
          tone="bg-blue-50 text-blue-600"
        />
        <Stat
          loading={q.isLoading}
          label="Departures Today"
          value={s?.todayCheckOuts ?? 0}
          hint={s?.todayCheckOuts ? `${s.todayCheckOuts} scheduled` : undefined}
          icon={LogOut}
          tone="bg-orange-50 text-orange-600"
        />
        <Stat
          loading={q.isLoading}
          label="Pending Payments"
          value={money(s?.pendingPayments || 0)}
          hint={s?.pendingCount ? `${s.pendingCount} booking${s.pendingCount === 1 ? '' : 's'}` : 'All settled'}
          icon={Clock3}
          tone="bg-rose-50 text-rose-600"
        />
      </div>

      {/* Room Status (Quick View) */}
      <Card
        title="Room Status (Quick View)"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={statusDate}
              onChange={(e) => setStatusDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition cursor-pointer shadow-2xs"
            />
            {statusDate !== todayStr && (
              <button
                type="button"
                onClick={() => setStatusDate(todayStr)}
                className="rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-100 transition"
              >
                Today
              </button>
            )}
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 outline-none"
            >
              <option value="all">All Floors</option>
              <option value="1">1st Floor</option>
              <option value="2">2nd Floor</option>
              <option value="3">3rd Floor</option>
              <option value="4">4th Floor</option>
              <option value="5">5th Floor</option>
            </select>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 outline-none"
            >
              <option value="all">All Room Types</option>
            </select>
          </div>
        }
        pad
      >
        <QueryBoundary q={q} skeleton={<RoomStatusGrid loading />}>
          <RoomStatusGrid rooms={filteredRooms} date={statusDate} filter={overviewFilter} onFilterChange={setOverviewFilter} />
          <RoomLegend activeFilter={overviewFilter} onSelectFilter={setOverviewFilter} />
        </QueryBoundary>
      </Card>

      {/* Bottom 4 Columns Grid Widgets */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Today's Arrivals */}
        <Card
          title={`Today's Arrivals (${q.data?.arrivals?.length || 0})`}
          action={
            <Link to="/check-in" className="text-xs font-bold text-blue-600 hover:text-blue-700">
              View All
            </Link>
          }
          pad={false}
        >
          <QueryBoundary q={q}>
            {q.data?.arrivals?.length ? (
              <div className="divide-y divide-slate-100">
                {q.data.arrivals.slice(0, 4).map((b) => (
                  <div key={b._id} onClick={() => openBooking(b._id)} className="flex items-center justify-between p-3.5 hover:bg-slate-50/80 transition-all cursor-pointer">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{b.guest?.name}</p>
                      <p className="text-[11px] font-medium text-slate-500">Room {b.room?.roomNumber || 'TBD'} · {b.actualCheckIn ? fmtDateTime(b.actualCheckIn).split(', ')[1] : 'Expected today'}</p>
                    </div>
                    <Badge status={b.bookingStatus} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <LogIn className="h-9 w-9 text-slate-300 mb-2" />
                <p className="text-xs font-extrabold text-slate-700">No arrivals today</p>
                <p className="text-[11px] text-slate-400 mt-0.5">No guest check-ins scheduled for today.</p>
              </div>
            )}
          </QueryBoundary>
        </Card>

        {/* Today's Departures */}
        <Card
          title={`Today's Departures (${q.data?.departures?.length || 0})`}
          action={
            <Link to="/check-out" className="text-xs font-bold text-blue-600 hover:text-blue-700">
              View All
            </Link>
          }
          pad={false}
        >
          <QueryBoundary q={q}>
            {q.data?.departures?.length ? (
              <div className="divide-y divide-slate-100">
                {q.data.departures.map((b) => (
                  <div key={b._id} onClick={() => openBooking(b._id)} className="flex items-center justify-between p-3.5 hover:bg-slate-50/80 cursor-pointer">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{b.guest?.name}</p>
                      <p className="text-[11px] font-medium text-slate-500">Room {b.room?.roomNumber}</p>
                    </div>
                    <Badge status={b.bookingStatus} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Plane className="h-9 w-9 text-slate-300 mb-2" />
                <p className="text-xs font-extrabold text-slate-700">No departures today</p>
                <p className="text-[11px] text-slate-400 mt-0.5">You're all caught up!</p>
              </div>
            )}
          </QueryBoundary>
        </Card>

        {/* Upcoming Bookings */}
        <Card
          title={`Upcoming Bookings (${up.data?.items?.length || 0})`}
          action={
            <Link to="/bookings" className="text-xs font-bold text-blue-600 hover:text-blue-700">
              View All
            </Link>
          }
          pad={false}
        >
          <QueryBoundary q={up}>
            {up.data?.items?.length ? (
              <div className="divide-y divide-slate-100">
                {up.data.items.slice(0, 5).map((b) => (
                  <div key={b._id} onClick={() => openBooking(b._id)} className="flex items-center justify-between p-3.5 hover:bg-slate-50/80 cursor-pointer">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{b.guest?.name}</p>
                      <p className="text-[11px] font-medium text-slate-500">Room {b.room?.roomNumber || 'TBD'} · {fmtDate(b.checkInDate, 'dd MMM')}</p>
                    </div>
                    <Badge status={b.bookingStatus} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Clock3 className="h-9 w-9 text-slate-300 mb-2" />
                <p className="text-xs font-extrabold text-slate-700">No upcoming bookings</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Future reservations will appear here.</p>
              </div>
            )}
          </QueryBoundary>
        </Card>

        {/* Payments to Collect */}
        <Card
          title={`Payments to Collect (${owing.length})`}
          action={
            <Link to="/payments" className="text-xs font-bold text-blue-600 hover:text-blue-700">
              View All
            </Link>
          }
          pad={false}
        >
          <QueryBoundary q={pend}>
            {owing.length ? (
              <div className="divide-y divide-slate-100">
                {owing.slice(0, 5).map((b) => (
                  <div key={b._id} onClick={() => openBooking(b._id)} className="flex items-center justify-between p-3.5 hover:bg-slate-50/80 cursor-pointer">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{b.guest?.name}</p>
                      <p className="text-[11px] font-medium text-slate-500">Room {b.room?.roomNumber || 'N/A'}</p>
                    </div>
                    <span className="text-xs font-extrabold text-red-600">{money(b.balanceAmount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CreditCard className="h-9 w-9 text-slate-300 mb-2" />
                <p className="text-xs font-extrabold text-slate-700">All balances settled</p>
                <p className="text-[11px] text-slate-400 mt-0.5">No pending guest payments.</p>
              </div>
            )}
          </QueryBoundary>
        </Card>
      </div>
    </div>
  );
}

