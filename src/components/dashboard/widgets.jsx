import { Link } from 'react-router-dom';
import { BedDouble, DoorOpen, DoorClosed, Wrench, Ban, UserCheck, UserPlus, LogIn, LogOut, CreditCard, Printer, Percent, CheckCircle2, ChevronRight, Plane } from 'lucide-react';
import { Card, Badge, EmptyState, Skeleton, DataTable, cx } from '../common/ui';
import { fmtDate, fmtDateTime, money, STATUS, humanize, timeAgo } from '../../utils/format';
import { useUI } from '../../store/ui';

export const ROOM_STYLES = {
  available: 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100/70',
  occupied: 'bg-red-50 border-red-200 text-red-800 hover:bg-red-100/70',
  cleaning: 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100/70',
  maintenance: 'bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100/70',
  out_of_service: 'bg-rose-50/70 border-rose-300 text-rose-800 hover:bg-rose-100/70',
  temp_non_ac: 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100/70',
};

export function RoomStatusGrid({ rooms, loading }) {
  const openBooking = useUI((s) => s.openBooking);
  if (loading) return <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>;

  // Group rooms by floor (1 to 5)
  const floorMap = {};
  rooms.forEach((r) => {
    const fl = r.floor || Math.floor(parseInt(r.roomNumber) / 100) || 1;
    (floorMap[fl] ||= []).push(r);
  });

  const floors = [1, 2, 3, 4, 5];

  return (
    <div className="space-y-3.5">
      {floors.map((fl) => {
        const floorRooms = (floorMap[fl] || []).sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));
        const ordinal = ['1st', '2nd', '3rd', '4th', '5th'][fl - 1] || `${fl}th`;
        return (
          <div key={fl} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span className="w-20 shrink-0 text-xs font-bold text-slate-500">{ordinal} Floor</span>
            <div className="grid flex-1 grid-cols-5 gap-2 sm:grid-cols-10">
              {floorRooms.map((r) => {
                const styleKey = r.isTemporary ? 'temp_non_ac' : r.status;
                const styleClass = ROOM_STYLES[styleKey] || 'bg-slate-50 border-slate-200 text-slate-700';
                return (
                  <button
                    key={r._id}
                    onClick={() => r.currentBookingId && openBooking(r.currentBookingId)}
                    title={`Room ${r.roomNumber} · ${r.isTemporary ? 'Non-AC (Temporary)' : STATUS[r.status]?.label}`}
                    className={cx('flex flex-col items-center justify-center rounded-xl border p-2 transition-all hover:scale-102 hover:shadow-xs', styleClass)}
                  >
                    <span className="text-xs font-extrabold tracking-tight">{r.roomNumber}</span>
                    <span className="mt-0.5 truncate text-[10px] font-semibold opacity-90">
                      {r.isTemporary ? 'Non-AC' : STATUS[r.status]?.label || 'Available'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export const RoomLegend = () => (
  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs font-semibold text-slate-600">
      <li className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Available</li>
      <li className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-red-500" /> Occupied</li>
      <li className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Cleaning</li>
      <li className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-orange-500" /> Maintenance</li>
      <li className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-rose-600" /> Out of service</li>
      <li className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-purple-500" /> Non-AC (Temporary)</li>
    </ul>
    <Link to="/rooms" className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700">
      View All Rooms <ChevronRight className="h-3.5 w-3.5" />
    </Link>
  </div>
);

export function QuickActionsWidget() {
  const { openWizard } = useUI();
  const actions = [
    { label: 'New Booking', icon: UserPlus, bg: 'bg-blue-50 text-blue-600 hover:bg-blue-100/80 border-blue-100', onClick: () => openWizard() },
    { label: 'Walk-in Guest', icon: UserCheck, bg: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100/80 border-emerald-100', onClick: () => openWizard({ walkIn: true }) },
    { label: 'Discount Report', icon: Percent, bg: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100/80 border-indigo-100', link: '/reports?type=discounts' },
    { label: 'Check-in', icon: LogIn, bg: 'bg-orange-50 text-orange-600 hover:bg-orange-100/80 border-orange-100', link: '/check-in' },
    { label: 'Check-out', icon: LogOut, bg: 'bg-rose-50 text-rose-600 hover:bg-rose-100/80 border-rose-100', link: '/check-out' },
    { label: 'Take Payment', icon: CreditCard, bg: 'bg-purple-50 text-purple-600 hover:bg-purple-100/80 border-purple-100', link: '/payments' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
      {actions.map((a) => {
        const content = (
          <div className={cx('flex flex-col items-center justify-center gap-2 rounded-2xl border p-3.5 text-center transition-all cursor-pointer hover:shadow-xs hover:scale-101', a.bg)}>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-white/80 shadow-2xs">
              <a.icon className="h-4 w-4" />
            </div>
            <span className="text-xs font-extrabold tracking-tight">{a.label}</span>
          </div>
        );
        return a.link ? <Link key={a.label} to={a.link}>{content}</Link> : <div key={a.label} onClick={a.onClick}>{content}</div>;
      })}
    </div>
  );
}

export function ArrivalsListWidget({ arrivals }) {
  const openBooking = useUI((s) => s.openBooking);
  if (!arrivals?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <LogIn className="h-8 w-8 text-slate-300 mb-2" />
        <p className="text-xs font-semibold text-slate-500">No arrivals scheduled for today</p>
      </div>
    );
  }
  return (
    <div className="divide-y divide-slate-100">
      {arrivals.slice(0, 3).map((b) => {
        const initials = b.guest?.name ? b.guest.name.split(' ').map((n) => n[0]).slice(0, 2).join('') : 'G';
        return (
          <div key={b._id} className="flex items-center justify-between p-3.5 hover:bg-slate-50/80 transition-all">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-100 text-xs font-extrabold text-blue-700">
                {initials}
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900">{b.guest?.name}</p>
                <p className="text-[11px] font-medium text-slate-500">
                  Room {b.room?.roomNumber || 'TBD'} · {b.actualCheckIn ? fmtDateTime(b.actualCheckIn).split(', ')[1] : '2:00 PM'}
                </p>
              </div>
            </div>
            <button onClick={() => openBooking(b._id)} className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-100">
              Check-in
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function DeparturesListWidget({ departures }) {
  if (!departures?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Plane className="h-9 w-9 text-slate-300 mb-2" />
        <p className="text-xs font-extrabold text-slate-700">No departures today</p>
        <p className="text-[11px] text-slate-400 mt-0.5">You're all caught up!</p>
      </div>
    );
  }
  return <BookingList items={departures} columns={departureCols} />;
}

export function BookingList({ items, columns, empty = 'No bookings' }) {
  const open = useUI((s) => s.openBooking);
  if (!items?.length) return <EmptyState title={empty} />;

  return (
    <div>
      {/* Mobile Card View */}
      <div className="divide-y divide-slate-100 md:hidden">
        {items.map((b) => (
          <div
            key={b._id || b.bookingNumber}
            onClick={() => open(b._id)}
            className="flex items-center justify-between p-3.5 active:bg-slate-50 transition cursor-pointer"
          >
            <div className="space-y-1 pr-2 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-blue-600 text-xs">{b.bookingNumber}</span>
                <Badge status={b.bookingStatus} />
              </div>
              <p className="font-bold text-slate-900 text-xs truncate">{b.guest?.name || 'Guest'}</p>
              <p className="text-[11px] text-slate-500">
                Room {b.room?.roomNumber || 'TBD'} · {fmtDate(b.checkInDate, 'dd MMM')} → {fmtDate(b.checkOutDate, 'dd MMM')}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-extrabold text-slate-900 text-xs">{money(b.totalAmount)}</p>
              <ChevronRight className="h-4 w-4 text-slate-400 ml-auto mt-1" />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <DataTable rows={items} onRowClick={(b) => open(b._id)} columns={columns} />
      </div>
    </div>
  );
}

export const recentCols = [
  { key: 'bookingNumber', header: '#', render: (b) => <span className="font-extrabold text-blue-600">{b.bookingNumber}</span> },
  { key: 'guest', header: 'Guest Name', render: (b) => <span className="font-bold text-slate-900">{b.guest?.name}</span> },
  { key: 'room', header: 'Room', render: (b) => <span className="font-semibold text-slate-700">{b.room?.roomNumber}</span> },
  { key: 'in', header: 'Check-in', render: (b) => <span className="text-xs font-medium text-slate-600">{fmtDate(b.checkInDate, 'dd MMM')}</span> },
  { key: 'out', header: 'Check-out', render: (b) => <span className="text-xs font-medium text-slate-600">{fmtDate(b.checkOutDate, 'dd MMM')}</span> },
  { key: 'status', header: 'Status', render: (b) => <Badge status={b.bookingStatus} /> },
  { key: 'amt', header: 'Amount', className: 'text-right', render: (b) => <b className="font-extrabold text-slate-900">{money(b.totalAmount)}</b> },
];

export const arrivalCols = [
  { key: 'guest', header: 'Guest', render: (b) => <span className="font-semibold text-slate-900">{b.guest?.name}</span> },
  { key: 'room', header: 'Room', render: (b) => <span className="font-semibold">{b.room?.roomNumber}</span> },
  { key: 't', header: 'Time', render: (b) => <span className="text-xs text-slate-500">{b.actualCheckIn ? fmtDateTime(b.actualCheckIn).split(', ')[1] : 'Expected'}</span> },
  { key: 's', header: 'Status', render: (b) => <Badge status={b.bookingStatus} /> },
];

export const departureCols = [
  { key: 'guest', header: 'Guest', render: (b) => <span className="font-semibold text-slate-900">{b.guest?.name}</span> },
  { key: 'room', header: 'Room', render: (b) => <span className="font-semibold">{b.room?.roomNumber}</span> },
  { key: 't', header: 'Time', render: (b) => <span className="text-xs text-slate-500">{b.actualCheckOut ? fmtDateTime(b.actualCheckOut).split(', ')[1] : 'Due today'}</span> },
  { key: 's', header: 'Checkout', render: (b) => b.bookingStatus === 'checked_out' ? <Badge status="checked_out">Done</Badge> : <Badge status="hold">Pending</Badge> },
];

export function ActivityList({ logs }) {
  if (!logs?.length) return <EmptyState title="No activity yet" />;

  const getIcon = (action) => {
    if (action.includes('maintenance')) return <div className="grid h-7 w-7 place-items-center rounded-full bg-orange-100 text-orange-600"><Wrench className="h-3.5 w-3.5" /></div>;
    if (action.includes('payment')) return <div className="grid h-7 w-7 place-items-center rounded-full bg-blue-100 text-blue-600"><CreditCard className="h-3.5 w-3.5" /></div>;
    if (action.includes('login')) return <div className="grid h-7 w-7 place-items-center rounded-full bg-purple-100 text-purple-600"><UserCheck className="h-3.5 w-3.5" /></div>;
    return <div className="grid h-7 w-7 place-items-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /></div>;
  };

  return (
    <ul className="divide-y divide-slate-100">
      {logs.slice(0, 5).map((l) => (
        <li key={l._id} className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-slate-50/70 transition-all">
          <div className="flex items-start gap-3">
            {getIcon(l.action || '')}
            <div>
              <p className="text-xs font-bold text-slate-900">{l.summary || humanize(l.action)}</p>
              <p className="text-[11px] font-medium text-slate-400">{l.userName || 'System'}</p>
            </div>
          </div>
          <span className="shrink-0 text-[11px] font-medium text-slate-400">{timeAgo(l.createdAt)}</span>
        </li>
      ))}
    </ul>
  );
}

export { Card };

