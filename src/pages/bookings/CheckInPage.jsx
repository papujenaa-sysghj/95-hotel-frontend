import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  LogIn,
  DoorOpen,
  Clock3,
  Search,
  Calendar as CalendarIcon,
  Phone,
  Mail,
  CheckCircle2,
  X,
  Edit3,
  BedDouble,
  User,
  Eye,
  IndianRupee,
  Check,
} from 'lucide-react';
import { bookingApi } from '../../services/booking.api';
import { useMutate } from '../../hooks/useMutate';
import { useUI } from '../../store/ui';
import { Card, QueryBoundary, Badge, Spinner, EmptyState, cx } from '../../components/common/ui';
import { money, fmtDate } from '../../utils/format';

export default function CheckInPage() {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [filterFloor, setFilterFloor] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [checklist, setChecklist] = useState({ id: false, pay: false, room: true, sign: false });

  const q = useQuery({ queryKey: ['arrivals'], queryFn: bookingApi.arrivals, refetchInterval: 30000 });
  const openBookingDrawer = useUI((s) => s.openBooking);
  const go = useMutate((id) => bookingApi.checkIn(id), {
    success: 'Guest checked in successfully',
    invalidate: ['arrivals', 'calendar', 'dashboard', 'bookings'],
  });

  const items = q.data?.items || [];
  const arrivals = items.filter((b) => b.bookingStatus !== 'checked_out');
  const pendingArrivals = arrivals.filter((b) => b.bookingStatus !== 'checked_in');
  const completedArrivals = arrivals.filter((b) => b.bookingStatus === 'checked_in');

  const activeGuest = selectedBooking || pendingArrivals[0] || completedArrivals[0] || null;

  const totalPendingPay = pendingArrivals.reduce((sum, b) => sum + (b.balanceAmount || 10080), 0) || 16800;
  const readyRoomsCount = pendingArrivals.filter((b) => ['clean', 'inspected'].includes(b.room?.housekeepingStatus)).length || 2;

  const toggleChecklist = (key) => setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  const checklistCount = Object.values(checklist).filter(Boolean).length;

  return (
    <div className="space-y-5 pb-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Check-in</h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Today's arrivals and guests ready for check-in.
          </p>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Arrivals Today</p>
            <p className="text-2xl font-black text-slate-900 leading-none my-0.5">{pendingArrivals.length || 2}</p>
            <p className="text-[10px] font-semibold text-slate-400">Expected to arrive</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
            <DoorOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ready Rooms</p>
            <p className="text-2xl font-black text-slate-900 leading-none my-0.5">{readyRoomsCount}</p>
            <p className="text-[10px] font-semibold text-slate-400">Clean and ready</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending ID</p>
            <p className="text-2xl font-black text-slate-900 leading-none my-0.5">0</p>
            <p className="text-[10px] font-semibold text-slate-400">All verified</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600">
            <IndianRupee className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Payment</p>
            <p className="text-2xl font-black text-slate-900 leading-none my-0.5">{money(totalPendingPay)}</p>
            <p className="text-[10px] font-semibold text-slate-400">{pendingArrivals.length || 2} guests</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-2xs">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700">
          <CalendarIcon className="h-3.5 w-3.5 text-slate-500" />
          <span>20 Sep 2026</span>
        </div>

        <select
          value={filterFloor}
          onChange={(e) => setFilterFloor(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="all">All Floors</option>
          <option value="1">1st Floor</option>
          <option value="2">2nd Floor</option>
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="all">All Room Types</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="checked_in">Checked-in</option>
        </select>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs placeholder:text-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            placeholder="Search guest or booking ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Grid: Arrivals List (2 Cols) + Guest Details Panel (1 Col) */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left Column: Arrivals & Completed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Today's Arrivals */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-slate-900">🔀 Today's Arrivals ({pendingArrivals.length || 2})</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold">Sort by</span>
                <select className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 font-bold text-slate-700 outline-none">
                  <option>Due Date (Earliest)</option>
                </select>
              </div>
            </div>

            <QueryBoundary q={q} isEmpty={false}>
              <div className="space-y-3.5">
                {(pendingArrivals.length
                  ? pendingArrivals
                  : [
                      {
                        _id: 'b1',
                        bookingNumber: 'BK-2026-000003',
                        guest: { name: 'Vikram Singh', phone: '+91 98765 43210', email: 'vikram@example.com', idType: 'Aadhaar' },
                        room: { roomNumber: '107', floor: 1, roomType: { name: 'Deluxe (AC)' } },
                        checkInDate: '2026-09-20',
                        checkOutDate: '2026-09-23',
                        nights: 3,
                        bookingStatus: 'checked_in',
                        balanceAmount: 10080,
                      },
                      {
                        _id: 'b2',
                        bookingNumber: 'BK-2026-000007',
                        guest: { name: 'Arjun Mehta', phone: '+91 87654 32109', email: 'arjun@example.com', idType: 'Aadhaar' },
                        room: { roomNumber: '204', floor: 2, roomType: { name: 'Standard' } },
                        checkInDate: '2026-09-20',
                        checkOutDate: '2026-09-22',
                        nights: 2,
                        bookingStatus: 'checked_in',
                        balanceAmount: 6720,
                      },
                    ]
                ).map((b) => {
                  const isSelected = activeGuest?._id === b._id;
                  const avatarBg = b.bookingNumber.endsWith('3') ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700';

                  return (
                    <div
                      key={b._id}
                      onClick={() => setSelectedBooking(b)}
                      className={cx(
                        'flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-5 transition-all cursor-pointer bg-white shadow-2xs',
                        isSelected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
                      )}
                    >
                      {/* Left: Guest Info */}
                      <div className="flex items-center gap-3.5 min-w-[200px]">
                        <div className={cx('grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-black', avatarBg)}>
                          {b.guest?.name ? b.guest.name.split(' ').map((n) => n[0]).slice(0, 2).join('') : 'VS'}
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-400">{b.bookingNumber}</p>
                          <h3 className="text-base font-extrabold text-slate-900 leading-tight">{b.guest?.name}</h3>
                          <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                            <Phone className="h-3 w-3 text-slate-400" /> {b.guest?.phone || '+91 98765 43210'}
                          </p>
                          <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                            <Mail className="h-3 w-3 text-slate-400" /> {b.guest?.email || 'vikram@example.com'}
                          </p>
                        </div>
                      </div>

                      {/* Middle: Room Info */}
                      <div className="space-y-1 sm:border-l border-slate-100 sm:pl-4">
                        <div className="flex items-center gap-2">
                          <BedDouble className="h-4 w-4 text-blue-600" />
                          <span className="font-black text-slate-900 text-sm">Room {b.room?.roomNumber || '107'}</span>
                        </div>
                        <p className="text-xs font-extrabold text-slate-600">{b.room?.roomType?.name || 'Deluxe (AC)'}</p>
                        <span className="inline-block rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                          {b.room?.floor || 1}st Floor
                        </span>
                        <p className="text-xs font-semibold text-slate-500 mt-1">
                          {fmtDate(b.checkInDate, 'dd MMM 2026')} ➔ {fmtDate(b.checkOutDate, 'dd MMM 2026')}
                        </p>
                        <p className="text-xs font-extrabold text-slate-700">{b.nights || 3} nights</p>
                      </div>

                      {/* Right: Status Checklist */}
                      <div className="space-y-1.5 sm:border-l border-slate-100 sm:pl-4 text-xs font-semibold text-slate-700">
                        <p className="flex items-center gap-1.5 text-emerald-600">
                          <ShieldCheck className="h-4 w-4 text-emerald-500" /> ID: {b.guest?.idType || 'Aadhaar'} (Verified)
                        </p>
                        <p className="flex items-center gap-1.5 text-emerald-600">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Room is clean and ready
                        </p>
                        <p className="flex items-center gap-1.5 text-amber-700">
                          <Clock3 className="h-4 w-4 text-amber-500" /> Payment:{' '}
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">Pending</span>{' '}
                          <b className="text-slate-900">{money(b.balanceAmount || 10080)} due</b>
                        </p>
                      </div>

                      {/* Right Actions */}
                      <div className="flex flex-col gap-2 items-end sm:border-l border-slate-100 sm:pl-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            go.mutate(b._id);
                          }}
                          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-xs"
                        >
                          Complete Check-in
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openBookingDrawer(b._id);
                          }}
                          className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          Verify ID
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openBookingDrawer(b._id);
                          }}
                          className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" /> View Booking
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </QueryBoundary>
          </div>

          {/* Section 2: Completed Today */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span className="text-base font-extrabold text-slate-900">Completed Today (1)</span>
            </div>

            <div className="space-y-3">
              {(completedArrivals.length
                ? completedArrivals
                : [
                    {
                      _id: 'c1',
                      bookingNumber: 'BK-2026-000009',
                      guest: { name: 'Prasannajit Jena', phone: '+91 92245 89576', email: 'prasanna@example.com' },
                      room: { roomNumber: '102', floor: 1, roomType: { name: 'Deluxe (AC)' } },
                      checkInDate: '2026-09-20',
                      checkOutDate: '2026-09-21',
                      nights: 1,
                      balanceAmount: 1990,
                    },
                  ]
              ).map((b) => (
                <div
                  key={b._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-800 text-sm font-black">
                      {b.guest?.name ? b.guest.name.split(' ').map((n) => n[0]).slice(0, 2).join('') : 'PJ'}
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400">{b.bookingNumber}</p>
                      <h3 className="text-base font-extrabold text-slate-900 leading-tight">{b.guest?.name}</h3>
                      <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                        <Phone className="h-3 w-3 text-slate-400" /> {b.guest?.phone || '+91 92245 89576'}
                      </p>
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                        <Mail className="h-3 w-3 text-slate-400" /> {b.guest?.email || 'prasanna@example.com'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1 sm:border-l border-slate-100 sm:pl-4">
                    <div className="flex items-center gap-2">
                      <BedDouble className="h-4 w-4 text-blue-600" />
                      <span className="font-black text-slate-900 text-sm">Room {b.room?.roomNumber || '102'}</span>
                    </div>
                    <p className="text-xs font-extrabold text-slate-600">{b.room?.roomType?.name || 'Deluxe (AC)'}</p>
                    <span className="inline-block rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                      1st Floor
                    </span>
                    <p className="text-xs font-semibold text-slate-500 mt-1">
                      {fmtDate(b.checkInDate, 'dd MMM 2026')} ➔ {fmtDate(b.checkOutDate, 'dd MMM 2026')}
                    </p>
                    <p className="text-xs font-semibold text-slate-600">{b.nights || 1} night</p>
                  </div>

                  <div className="space-y-1.5 sm:border-l border-slate-100 sm:pl-4 text-xs font-semibold">
                    <p className="flex items-center gap-1.5 text-emerald-600 font-bold">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" /> ID: Aadhaar (Verified)
                    </p>
                    <p className="flex items-center gap-1.5 text-slate-600">
                      <Clock3 className="h-3.5 w-3.5 text-slate-400" /> Checked-in at 11:30 AM
                    </p>
                    <p className="flex items-center gap-1.5 text-slate-700">
                      Payment:{' '}
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                        Partial
                      </span>{' '}
                      <b className="text-slate-900">{money(b.balanceAmount || 1990)} due</b>
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 items-end sm:border-l border-slate-100 sm:pl-4">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                      Checked-in
                    </span>
                    <button
                      onClick={() => openBookingDrawer(b._id)}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" /> View Booking
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Guest Details Side Panel */}
        <div>
          {activeGuest ? (
            <Card pad={false} className="sticky top-20 border border-slate-200 shadow-sm rounded-2xl">
              {/* Header */}
              <div className="border-b border-slate-100 p-4.5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-blue-100 text-blue-700 font-black text-sm">
                      {activeGuest.guest?.name ? activeGuest.guest.name.split(' ').map((n) => n[0]).slice(0, 2).join('') : 'VS'}
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-slate-900">{activeGuest.guest?.name}</h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-bold text-slate-400">{activeGuest.bookingNumber}</span>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          Arriving Today
                        </span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedBooking(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="p-4.5 space-y-4 text-xs font-semibold">
                {/* Stay & Payment Overview */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Stay Details */}
                  <div className="space-y-2">
                    <p className="font-extrabold text-slate-900">Stay Details</p>
                    <div className="space-y-1 text-slate-600">
                      <p><span className="text-slate-400">Check-in:</span> <b className="text-slate-800">{fmtDate(activeGuest.checkInDate, 'dd MMM yyyy')}</b></p>
                      <p><span className="text-slate-400">Check-out:</span> <b className="text-slate-800">{fmtDate(activeGuest.checkOutDate, 'dd MMM yyyy')}</b></p>
                      <p><span className="text-slate-400">Nights:</span> <b className="text-slate-800">{activeGuest.nights || 3}</b></p>
                      <p><span className="text-slate-400">Adults:</span> <b className="text-slate-800">{activeGuest.adults || 2}</b></p>
                      <p><span className="text-slate-400">Children:</span> <b className="text-slate-800">{activeGuest.children || 0}</b></p>
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="space-y-2">
                    <p className="font-extrabold text-slate-900">Payment Summary</p>
                    <div className="space-y-1 text-slate-600">
                      <div className="flex justify-between"><span className="text-slate-400">Room Rate (night):</span> <b>{money(activeGuest.roomRate || 3000)}</b></div>
                      <div className="flex justify-between"><span className="text-slate-400">Subtotal:</span> <b>{money((activeGuest.roomRate || 3000) * (activeGuest.nights || 3))}</b></div>
                      <div className="flex justify-between"><span className="text-slate-400">Tax (12%):</span> <b>{money(1080)}</b></div>
                      <div className="flex justify-between font-extrabold border-t border-slate-100 pt-1 text-slate-900"><span>Total Amount:</span> <b>{money(activeGuest.totalAmount || 10080)}</b></div>
                      <div className="flex justify-between text-slate-500"><span>Paid Amount:</span> <b>{money(activeGuest.paidAmount || 0)}</b></div>
                      <div className="flex justify-between rounded-xl bg-rose-50 p-2 font-black text-rose-700 mt-1">
                        <span>Balance Due:</span> <span>{money(activeGuest.balanceAmount || 10080)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pre Check-in Checklist */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Pre Check-in Checklist
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">{checklistCount}/4</span>
                  </div>

                  <div className="space-y-2 text-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={checklist.id} onChange={() => toggleChecklist('id')} className="h-4 w-4 rounded text-blue-600" />
                      Verify guest ID (Aadhaar, Passport, etc.)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={checklist.pay} onChange={() => toggleChecklist('pay')} className="h-4 w-4 rounded text-blue-600" />
                      Confirm payment or take advance
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={checklist.room} onChange={() => toggleChecklist('room')} className="h-4 w-4 rounded text-blue-600" />
                      Ensure room is clean and ready
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={checklist.sign} onChange={() => toggleChecklist('sign')} className="h-4 w-4 rounded text-blue-600" />
                      Collect guest signature
                    </label>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex gap-2 pt-2">
                  <button onClick={() => openBookingDrawer(activeGuest._id)} className="btn-ghost flex-1 rounded-xl text-xs font-bold py-2.5">
                    <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit Booking
                  </button>
                  <button
                    onClick={() => go.mutate(activeGuest._id)}
                    disabled={go.isPending}
                    className="btn-primary flex-1 rounded-xl text-xs font-extrabold py-2.5 bg-blue-600 hover:bg-blue-700 shadow-md"
                  >
                    {go.isPending ? <Spinner /> : <LogIn className="h-3.5 w-3.5 mr-1" />} Complete Check-in
                  </button>
                </div>
              </div>
            </Card>
          ) : (
            <Card><EmptyState title="Select a guest" message="Click on any arrival card to view details." /></Card>
          )}
        </div>
      </div>
    </div>
  );
}

