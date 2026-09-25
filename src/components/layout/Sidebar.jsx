import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ConciergeBell, CalendarRange, BookOpenCheck, LogIn, LogOut, Users, BedDouble, SprayCan, Wrench, CreditCard, FileText, BarChart3, Percent, ShieldCheck, ScrollText, Settings, Hotel, X } from 'lucide-react';
import { useAuth } from '../../store/auth';
import { useUI } from '../../store/ui';
import { cx } from '../common/ui';

const NAV = [
  { group: 'FRONT DESK', items: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, show: (u, c) => c('dashboard.view') },
    { to: '/reception', label: 'Front Desk / New Booking', icon: ConciergeBell, show: (u, c) => c('bookings.create') },
    { to: '/bookings', label: 'All Bookings', icon: BookOpenCheck, show: (u, c) => c('bookings.view') },
    { to: '/check-in', label: 'Check-in', icon: LogIn, show: (u, c) => c('checkin.perform') },
    { to: '/check-out', label: 'Check-out', icon: LogOut, show: (u, c) => c('checkout.perform') },
    { to: '/calendar', label: 'Room Calendar', icon: CalendarRange, show: (u, c) => c('calendar.view') },
    { to: '/guests', label: 'Guests', icon: Users, show: (u, c) => c('guests.view') },
  ] },
  { group: 'ROOM MANAGEMENT', items: [
    { to: '/rooms', label: 'Rooms & Setup', icon: BedDouble, show: (u, c) => c('rooms.view') && !(u.role === 'Housekeeping') },
  ] },
  { group: 'OPERATIONS', items: [
    { to: '/housekeeping', label: 'Housekeeping', icon: SprayCan, show: (u, c) => c('housekeeping.view') },
    { to: '/maintenance', label: 'Maintenance', icon: Wrench, show: (u, c) => c('maintenance.view') },
  ] },
  { group: 'FINANCE', items: [
    { to: '/payments', label: 'Payments & Expenses', icon: CreditCard, show: (u, c) => c('payments.view') },
    { to: '/invoices', label: 'Invoices', icon: FileText, show: (u, c) => c('invoices.view') },
  ] },
  { group: 'REPORTS', items: [
    { to: '/reports', label: 'Reports', icon: BarChart3, show: (u, c) => c('reports.view') },
    { to: '/audit-logs', label: 'Activity Logs', icon: ScrollText, show: (u, c) => c('audit.view') },
  ] },
  { group: 'ADMINISTRATION', items: [
    { to: '/users', label: 'Users', icon: Users, show: (u, c) => c('users.view') },
    { to: '/roles', label: 'Roles & Permissions', icon: ShieldCheck, show: (u, c) => c('roles.view') },
    { to: '/settings', label: 'Settings', icon: Settings, show: (u, c) => c('settings.manage') },
  ] },
];

export default function Sidebar() {
  const location = useLocation();
  const user = useAuth((s) => s.user); const can = useAuth((s) => s.can); const { sidebar, toggleSidebar } = useUI();
  const groups = NAV.map((g) => ({ ...g, items: g.items.filter((i) => i.show(user, can)) })).filter((g) => g.items.length);

  const isNavItemActive = (to) => {
    const currentPath = location.pathname + location.search;
    if (to.includes('?')) return currentPath === to;
    return currentPath === to || (location.pathname === to && !location.search);
  };

  return <>
    {sidebar && <div className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden" onClick={() => toggleSidebar(false)} />}
    <aside className={cx('fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-[#0F172A] text-slate-300 transition-transform lg:static lg:translate-x-0', sidebar ? 'translate-x-0' : '-translate-x-full')}>
      <div className="flex h-16 items-center justify-between border-b border-slate-800/60 px-5">
        <div className="flex items-center gap-3 text-white">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20"><Hotel className="h-5 w-5" /></span>
          <div>
            <span className="block text-base font-extrabold leading-none tracking-tight">Hotel Bliss</span>
            <span className="mt-0.5 block text-[10px] font-medium text-slate-400">Property Management System</span>
          </div>
        </div>
        <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => toggleSidebar(false)} aria-label="Close menu"><X className="h-5 w-5" /></button>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3.5 pb-6 pt-4" aria-label="Main">
        {groups.map((g) => <div key={g.group}>
          <p className="mb-2 px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">{g.group}</p>
          <div className="space-y-1">
            {g.items.map((i) => {
              const active = isNavItemActive(i.to);
              return (
                <NavLink
                  key={i.to}
                  to={i.to}
                  onClick={() => toggleSidebar(false)}
                  className={cx('flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold transition-all', active ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white')}
                >
                  <i.icon className="h-4 w-4 shrink-0" />
                  {i.label}
                </NavLink>
              );
            })}
          </div>
        </div>)}
      </nav>
      <div className="p-3.5 border-t border-slate-800/60">
        <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-3 text-xs text-slate-300 flex items-center gap-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Hotel className="h-4 w-4" />
          </div>
          <div>
            <p className="font-bold text-slate-200 text-xs">Need Help?</p>
            <p className="text-[11px] text-slate-400">Contact support</p>
          </div>
        </div>
      </div>
    </aside></>;
}
