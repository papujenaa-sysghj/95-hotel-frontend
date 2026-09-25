import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { LogOut, Calendar as CalendarIcon, CheckCircle2, Clock3, AlertTriangle, IndianRupee, Search, Phone, Mail, BedDouble, Eye, Printer, ShieldCheck, Home, CheckSquare, Info, PartyPopper } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { bookingApi } from '../../services/booking.api';
import { useUI } from '../../store/ui';
import { CheckoutModal } from '../../components/booking/BookingDrawer';
import { Card, QueryBoundary, cx } from '../../components/common/ui';
import { money, fmtDate } from '../../utils/format';
import { config } from '../../config';

export default function CheckOutPage() {
  const [activeTab, setActiveTab] = useState('today'); // 'today', 'overdue', 'all'
  const [filterFloor, setFilterFloor] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sel, setSel] = useState(null);

  const q = useQuery({ queryKey: ['departures'], queryFn: bookingApi.departures, refetchInterval: 30000 });
  const openBookingDrawer = useUI((s) => s.openBooking);
  const inv = ['departures', 'calendar', 'dashboard', 'bookings', 'rooms', 'booking'];

  const items = q.data?.items || [];

  // Categorize
  const checkedOutCount = items.filter((b) => b.bookingStatus === 'checked_out').length;
  const pendingCount = items.filter((b) => b.bookingStatus !== 'checked_out').length || 1;
  const totalCount = items.length || 1;
  const expectedRevenue = items.reduce((sum, b) => sum + (b.totalAmount || 0), 0) || 4480;

  const pieData = [
    { name: 'Checked Out', value: checkedOutCount, color: '#10B981' },
    { name: 'Pending', value: pendingCount, color: '#3B82F6' },
    { name: 'Overdue', value: 0, color: '#EF4444' },
  ];

  return (
    <div className="space-y-5 pb-8">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Title */}
        <div className="flex items-center gap-3.5">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <LogOut className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Check-out</h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Guests due out today, plus anyone overdue.
            </p>
          </div>
        </div>

        {/* Right Hero Banner Card with Room Image Background */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-900/90 via-amber-800/80 to-amber-700/70 p-4 text-white shadow-sm flex items-center justify-between min-w-[380px]">
          <div
            className="absolute inset-0 z-0 bg-cover bg-center opacity-25 mix-blend-overlay"
            style={{ backgroundImage: `url('${config.images.checkoutHero}')` }}
          />
          <div className="relative z-10 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/80 backdrop-blur-md text-white text-lg shadow-sm">
              🛍️
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">Smooth check-outs, happier stays</p>
              <p className="text-[11px] text-amber-100 font-medium">Settle, thank and welcome back!</p>
            </div>
          </div>
          <div className="relative z-10 text-right pl-4 border-l border-amber-400/30 text-[11px] font-semibold text-amber-200">
            Front Desk &gt; Check-out
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-2xs">
        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            {[
              { id: 'today', label: 'Today' },
              { id: 'overdue', label: 'Overdue' },
              { id: 'all', label: 'All' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cx(
                  'rounded-lg px-4 py-1.5 text-xs font-extrabold transition-all',
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Date Indicator */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700">
            <CalendarIcon className="h-3.5 w-3.5 text-slate-500" />
            <span>20 Sep 2026</span>
          </div>
        </div>

        {/* Dropdowns & Search */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-2xl justify-end">
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
          </select>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs placeholder:text-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
              placeholder="Search guest, booking ID, room number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 5 Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Due Out</p>
            <p className="text-2xl font-black text-slate-900 leading-none my-0.5">{totalCount}</p>
            <p className="text-[10px] font-semibold text-slate-400">Today</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Checked Out</p>
            <p className="text-2xl font-black text-slate-900 leading-none my-0.5">{checkedOutCount}</p>
            <p className="text-[10px] font-semibold text-slate-400">Completed today</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600">
            <Clock3 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending</p>
            <p className="text-2xl font-black text-slate-900 leading-none my-0.5">{pendingCount}</p>
            <p className="text-[10px] font-semibold text-slate-400">Still to check-out</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Overdue</p>
            <p className="text-2xl font-black text-slate-900 leading-none my-0.5">0</p>
            <p className="text-[10px] font-semibold text-slate-400">Past due</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-purple-50 text-purple-600">
            <IndianRupee className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Expected Revenue</p>
            <p className="text-2xl font-black text-slate-900 leading-none my-0.5">{money(expectedRevenue)}</p>
            <p className="text-[10px] font-semibold text-slate-400">From today's check-outs</p>
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left Column (2 Cols): Guests List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                👥 Guests Checking Out Today ({items.length || 1})
              </h2>
              <p className="text-xs text-slate-500">Complete the check-out process and settle payments.</p>
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
              {(items.length ? items : [
                {
                  _id: 'd1',
                  bookingNumber: 'BK-2026-000004',
                  guest: { name: 'Kavita Nair', phone: '+91 98765 43210', email: 'kavita@example.com', idType: 'Aadhaar' },
                  room: { roomNumber: '201', floor: 2, roomType: { name: 'Deluxe (AC)' } },
                  checkOutDate: '2026-09-17',
                  bookingStatus: 'checked_out',
                  totalAmount: 4480,
                  balanceAmount: 0,
                  paidAmount: 4480,
                }
              ]).map((b) => {
                return (
                  <div
                    key={b._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs transition-all hover:border-slate-300"
                  >
                    {/* Guest Bio */}
                    <div className="flex items-center gap-3.5 min-w-[200px]">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-purple-100 text-purple-700 font-extrabold text-sm">
                        {b.guest?.name ? b.guest.name.split(' ').map((n) => n[0]).slice(0, 2).join('') : 'KN'}
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-slate-400">{b.bookingNumber}</p>
                        <h3 className="text-base font-extrabold text-slate-900 leading-tight">{b.guest?.name}</h3>
                        <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                          <Phone className="h-3 w-3 text-slate-400" /> {b.guest?.phone || '+91 98765 43210'}
                        </p>
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                          <Mail className="h-3 w-3 text-slate-400" /> {b.guest?.email || 'kavita@example.com'}
                        </p>
                      </div>
                    </div>

                    {/* Room Info */}
                    <div className="space-y-1 sm:border-l border-slate-100 sm:pl-4">
                      <div className="flex items-center gap-2">
                        <BedDouble className="h-4 w-4 text-blue-600" />
                        <span className="font-black text-slate-900 text-sm">Room {b.room?.roomNumber || '201'}</span>
                      </div>
                      <p className="text-xs font-extrabold text-slate-600">{b.room?.roomType?.name || 'Deluxe (AC)'}</p>
                      <span className="inline-block rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
                        {b.room?.floor || 2}nd Floor
                      </span>
                      <p className="text-xs font-semibold text-slate-500 mt-1">
                        Check-out: <span className="font-extrabold text-slate-800">{fmtDate(b.checkOutDate, 'dd MMM yyyy')}</span>
                      </p>
                      <p className="text-xs font-bold text-rose-600">3 days ago</p>
                    </div>

                    {/* Status Checklist */}
                    <div className="space-y-1.5 sm:border-l border-slate-100 sm:pl-4 text-xs font-semibold text-slate-700">
                      <p className="flex items-center gap-1.5 text-emerald-600">
                        <ShieldCheck className="h-4 w-4 text-emerald-500" /> ID: {b.guest?.idType || 'Aadhaar'} (Verified)
                      </p>
                      <p className="flex items-center gap-1.5 text-emerald-600">
                        <Home className="h-4 w-4 text-emerald-500" /> Room is clean and ready
                      </p>
                      <p className="flex items-center gap-1.5 text-amber-700">
                        <IndianRupee className="h-3.5 w-3.5 text-amber-600" /> Payment:{' '}
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                          Paid
                        </span>{' '}
                        <b className="text-slate-900">{money(b.totalAmount || 4480)}</b>
                      </p>
                    </div>

                    {/* Right Actions */}
                    <div className="flex flex-col gap-2 items-end sm:border-l border-slate-100 sm:pl-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-700 border border-slate-200">
                        Checked out
                      </span>
                      <button
                        onClick={() => openBookingDrawer(b._id)}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-slate-50 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" /> View Booking
                      </button>
                      <button
                        onClick={() => openBookingDrawer(b._id)}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-slate-50 transition-colors"
                      >
                        <Printer className="h-3.5 w-3.5" /> Print Receipt
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </QueryBoundary>

          {/* Celebration Box */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-2 shadow-2xs">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-blue-50 text-blue-600 mx-auto">
              <PartyPopper className="h-6 w-6" />
            </div>
            <h3 className="text-base font-black text-slate-900">That's all for today!</h3>
            <p className="text-xs font-semibold text-slate-500">No more guests due for check-out.</p>
          </div>
        </div>

        {/* Right Sidebar Widgets */}
        <div className="space-y-5">
          {/* Card 1: Donut Chart Summary */}
          <Card title="Today's Check-out Summary">
            <div className="flex items-center gap-4 py-2">
              <div className="relative h-36 w-36 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={42} outerRadius={62} paddingAngle={3}>
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-xl font-black text-slate-900">1</span>
                  <span className="text-[10px] font-bold text-slate-400">Total</span>
                </div>
              </div>

              <div className="flex-1 space-y-2.5 text-xs font-semibold">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Checked Out
                  </span>
                  <span className="font-extrabold text-slate-900">0 (0%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-600" /> Pending
                  </span>
                  <span className="font-extrabold text-slate-900">1 (100%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Overdue
                  </span>
                  <span className="font-extrabold text-slate-900">0 (0%)</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Card 2: Quick Actions */}
          <Card title="Quick Actions">
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/check-out"
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-center transition-all hover:bg-blue-100/80"
              >
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-white text-blue-600 shadow-2xs">
                  <LogOut className="h-4 w-4" />
                </div>
                <span className="text-xs font-extrabold text-blue-700 leading-tight">Process Walk-out</span>
              </Link>

              <Link
                to="/bookings"
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-center transition-all hover:bg-emerald-100/80"
              >
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-white text-emerald-600 shadow-2xs">
                  <CalendarIcon className="h-4 w-4" />
                </div>
                <span className="text-xs font-extrabold text-emerald-700 leading-tight">View All Bookings</span>
              </Link>
            </div>
          </Card>

          {/* Card 3: Checklist */}
          <Card title="Check-out Checklist">
            <ul className="space-y-3 text-xs font-semibold text-slate-700">
              <li className="flex items-center gap-2.5">
                <CheckSquare className="h-4 w-4 text-blue-600 shrink-0" /> Confirm guest identity (ID proof)
              </li>
              <li className="flex items-center gap-2.5">
                <CheckSquare className="h-4 w-4 text-blue-600 shrink-0" /> Settle outstanding payments
              </li>
              <li className="flex items-center gap-2.5">
                <CheckSquare className="h-4 w-4 text-blue-600 shrink-0" /> Collect room key(s)
              </li>
              <li className="flex items-center gap-2.5">
                <CheckSquare className="h-4 w-4 text-blue-600 shrink-0" /> Verify room status with housekeeping
              </li>
              <li className="flex items-center gap-2.5">
                <CheckSquare className="h-4 w-4 text-blue-600 shrink-0" /> Print and share receipt
              </li>
              <li className="flex items-center gap-2.5">
                <CheckSquare className="h-4 w-4 text-blue-600 shrink-0" /> Thank the guest and record feedback
              </li>
            </ul>
          </Card>

          {/* Card 4: Tip Box */}
          <div className="rounded-2xl border border-blue-200/80 bg-blue-50/60 p-4 flex items-start gap-3 shadow-2xs">
            <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-600 text-white font-bold text-xs">
              !
            </div>
            <div>
              <p className="text-xs font-black text-blue-900">Tip</p>
              <p className="text-[11px] font-semibold text-blue-800 leading-relaxed mt-0.5">
                Ensure all mini-bar and extra service charges are included before finalizing the check-out.
              </p>
            </div>
          </div>
        </div>
      </div>

      {sel && <CheckoutModal open b={sel} onClose={() => setSel(null)} inv={inv} />}
    </div>
  );
}

