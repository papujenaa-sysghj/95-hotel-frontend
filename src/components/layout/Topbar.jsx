import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Menu, Search, Bell, Plus, Footprints, LogOut, KeyRound, ChevronDown, CheckCheck, BellOff, Info, AlertTriangle, Calendar, Wrench, Sparkles } from 'lucide-react';
import api, { unwrap } from '../../services/api';
import { authApi } from '../../services/auth.api';
import { bookingApi } from '../../services/booking.api';
import { useAuth } from '../../store/auth';
import { useUI } from '../../store/ui';
import { fmtDate, timeAgo } from '../../utils/format';
import { Badge, Spinner, cx } from '../common/ui';

function useOutside(ref, fn) { useEffect(() => { const h = (e) => ref.current && !ref.current.contains(e.target) && fn(); document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, [ref, fn]); }

function GlobalSearch() {
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [open, setOpen] = useState(false);
  const [mobileModal, setMobileModal] = useState(false);
  const ref = useRef(null);
  const openBooking = useUI((s) => s.openBooking);
  const can = useAuth((s) => s.can);

  useEffect(() => {
    const t = setTimeout(() => setDq(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  useOutside(ref, () => setOpen(false));

  const res = useQuery({
    queryKey: ['search', dq],
    queryFn: () => bookingApi.list({ q: dq, limit: 8 }),
    enabled: dq.length >= 2 && can('bookings.view')
  });

  return (
    <>
      {/* Desktop Inline Search */}
      <div ref={ref} className="relative hidden w-full max-w-md md:block">
        <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        <input
          className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-16 text-xs placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all min-h-[40px]"
          placeholder="Search guest, booking, room, phone..."
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          aria-label="Global search"
        />
        <kbd className="pointer-events-none absolute right-3 top-2.5 inline-flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-400 shadow-2xs">Ctrl K</kbd>

        {open && dq.length >= 2 && (
          <div className="absolute left-0 right-0 top-12 z-50 max-h-96 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
            {res.isLoading && <div className="flex items-center gap-2 p-3 text-sm text-slate-500"><Spinner />Searching…</div>}
            {res.isError && <p className="p-3 text-sm text-red-600">Search failed. Try again.</p>}
            {res.data && !res.data.items.length && <p className="p-3 text-sm text-slate-500">No bookings match “{dq}”.</p>}
            {res.data?.items.map((b) => (
              <button
                key={b._id}
                onClick={() => { openBooking(b._id); setOpen(false); setQ(''); }}
                className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-slate-50 transition-colors"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold text-slate-900">
                    {b.guest?.name} <span className="font-normal text-slate-400">· Room {b.room?.roomNumber}</span>
                  </span>
                  <span className="block text-xs text-slate-500">
                    {b.bookingNumber} · {fmtDate(b.checkInDate, 'dd MMM')} – {fmtDate(b.checkOutDate, 'dd MMM')}
                  </span>
                </span>
                <Badge status={b.bookingStatus} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Search Button */}
      <button
        onClick={() => setMobileModal(true)}
        className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200/80 bg-slate-50/80 text-slate-600 md:hidden hover:bg-slate-100 active:scale-95"
        aria-label="Open mobile search"
      >
        <Search className="h-4.5 w-4.5" />
      </button>

      {/* Mobile Full-Screen Search Dialog */}
      {mobileModal && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white p-4 md:hidden">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                autoFocus
                className="input pl-10 pr-3 w-full"
                placeholder="Search guest, room, booking..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <button
              onClick={() => { setMobileModal(false); setQ(''); }}
              className="btn-ghost btn-sm px-3"
            >
              Cancel
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pt-3">
            {dq.length < 2 ? (
              <p className="p-4 text-center text-xs text-slate-400">Type 2 or more characters to search...</p>
            ) : res.isLoading ? (
              <div className="flex items-center justify-center gap-2 p-6 text-sm text-slate-500"><Spinner />Searching…</div>
            ) : res.isError ? (
              <p className="p-4 text-center text-sm text-red-600">Search failed.</p>
            ) : !res.data?.items.length ? (
              <p className="p-4 text-center text-sm text-slate-500">No bookings match “{dq}”.</p>
            ) : (
              <div className="space-y-1">
                {res.data.items.map((b) => (
                  <button
                    key={b._id}
                    onClick={() => { openBooking(b._id); setMobileModal(false); setQ(''); }}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-left active:bg-blue-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-slate-900 truncate">
                        {b.guest?.name} <span className="font-medium text-slate-500">· Room {b.room?.roomNumber}</span>
                      </p>
                      <p className="text-xs text-slate-500">
                        {b.bookingNumber} · {fmtDate(b.checkInDate, 'dd MMM')} – {fmtDate(b.checkOutDate, 'dd MMM')}
                      </p>
                    </div>
                    <Badge status={b.bookingStatus} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function getNotificationIcon(type) {
  switch (type) {
    case 'maintenance': return <Wrench className="h-4 w-4 text-amber-500" />;
    case 'housekeeping': return <Sparkles className="h-4 w-4 text-emerald-500" />;
    case 'booking': return <Calendar className="h-4 w-4 text-blue-500" />;
    case 'alert': return <AlertTriangle className="h-4 w-4 text-red-500" />;
    default: return <Info className="h-4 w-4 text-slate-500" />;
  }
}

function Notifications() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const qc = useQueryClient();
  useOutside(ref, () => setOpen(false));
  const q = useQuery({ queryKey: ['notifications'], queryFn: () => unwrap(api.get('/notifications')), refetchInterval: 30000 });
  const items = q.data?.notifications || [];
  const unreadCount = items.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read');
      qc.invalidateQueries({ queryKey: ['notifications'] });
    } catch { /* ignore */ }
  };

  return (
    <div ref={ref} className="relative">
      <button
        className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200/80 bg-slate-50/80 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95"
        aria-label={`Notifications, ${unreadCount} unread`}
        onClick={() => setOpen(!open)}
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-blue-600 px-1 text-[10px] font-extrabold text-white shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-12 z-50 w-auto sm:w-96 rounded-2xl border border-slate-200/90 bg-white shadow-2xl transition-all">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">Notifications</span>
              {unreadCount > 0 && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-600">{unreadCount} new</span>}
            </div>
            {unreadCount > 0 && (
              <button className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline min-h-[36px] px-2" onClick={handleMarkAllRead}>
                <CheckCheck className="h-3.5 w-3.5" />Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
            {q.isLoading ? (
              <div className="flex items-center justify-center p-8 text-xs text-slate-400 gap-2"><Spinner /> Loading notifications…</div>
            ) : q.isError ? (
              <div className="p-6 text-center text-xs text-red-500">Failed to load notifications.</div>
            ) : !items.length ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-400 mb-2"><BellOff className="h-5 w-5" /></div>
                <p className="text-sm font-semibold text-slate-700">No notifications</p>
                <p className="text-xs text-slate-400">You're all caught up with room & booking updates.</p>
              </div>
            ) : (
              items.map((n) => (
                <div key={n._id} className={cx('flex items-start gap-3 p-3.5 transition hover:bg-slate-50/80', !n.read ? 'bg-blue-50/30' : 'bg-white')}>
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-slate-100/80 border border-slate-200/50">{getNotificationIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className={cx('text-xs font-bold truncate', !n.read ? 'text-slate-900' : 'text-slate-700')}>{n.title}</p>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">{timeAgo(n.createdAt)}</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-snug line-clamp-2">{n.message}</p>
                  </div>
                  {!n.read && <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-1" aria-label="Unread" />}
                </div>
              ))
            )}
          </div>
          <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2.5 text-center rounded-b-2xl">
            <span className="text-[10px] font-medium text-slate-400">Live notifications update automatically</span>
          </div>
        </div>
      )}
    </div>
  );
}

function LiveClock() {
  const [timeStr, setTimeStr] = useState('');
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const datePart = now.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
      const timePart = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      setTimeStr(`${datePart}  ${timePart}`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="hidden items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2 text-xs font-semibold text-slate-600 md:flex">
      <span>{timeStr}</span>
    </div>
  );
}

export default function Topbar() {
  const user = useAuth((s) => s.user);
  const { toggleSidebar } = useUI();
  const nav = useNavigate();
  const [menu, setMenu] = useState(false);
  const ref = useRef(null);
  useOutside(ref, () => setMenu(false));

  const logout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    useAuth.getState().logoutLocal();
    nav('/login');
  };

  const initials = user?.name ? user.name.split(' ').map((s) => s[0]).slice(0, 2).join('') : 'DA';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-2.5 border-b border-slate-200/80 bg-white/95 px-3 sm:px-4 backdrop-blur-md lg:px-6">
      <div className="flex items-center gap-2">
        <button
          className="grid h-10 w-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 active:scale-95 lg:hidden"
          onClick={() => toggleSidebar()}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm font-black tracking-tight text-slate-900 lg:hidden truncate max-w-[120px] xs:max-w-none">
          Hotel Bliss
        </span>
      </div>

      <GlobalSearch />

      <div className="flex items-center gap-2">
        <LiveClock />
        <Notifications />
        <div ref={ref} className="relative">
          <button
            className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/50 p-1 pr-2 sm:pr-2.5 transition hover:bg-slate-100 active:scale-95 min-h-[40px]"
            onClick={() => setMenu(!menu)}
            aria-label="User profile menu"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#0F172A] text-xs font-black text-white shadow-xs">
              {initials}
            </span>
            <div className="hidden text-left sm:block">
              <p className="text-xs font-extrabold leading-tight text-slate-900 truncate max-w-[110px]">{user?.name || 'Demo Admin'}</p>
              <p className="text-[10px] font-medium text-slate-500 truncate max-w-[110px]">{user?.role || 'Super Admin'}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
          </button>
          {menu && (
            <div className="absolute right-0 top-12 w-56 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl z-50">
              <div className="border-b border-slate-100 px-3 py-2.5">
                <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.role}</p>
              </div>
              <button
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 min-h-[44px]"
                onClick={() => { setMenu(false); nav('/profile'); }}
              >
                <KeyRound className="h-4 w-4 text-slate-500" />
                Password & sessions
              </button>
              <button
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 min-h-[44px]"
                onClick={logout}
              >
                <LogOut className="h-4 w-4 text-red-500" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
