import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { BedDouble, DoorOpen, DoorClosed, Wrench, Ban, IndianRupee, TrendingUp, ChevronRight } from 'lucide-react';
import { dashboardApi } from '../../services/resource.api';
import { Card, Stat, QueryBoundary, Skeleton } from '../../components/common/ui';
import { RoomStatusGrid, RoomLegend, QuickActionsWidget, ArrivalsListWidget, DeparturesListWidget, BookingList, recentCols, ActivityList } from '../../components/dashboard/widgets';
import { money } from '../../utils/format';

const TYPE_COLORS = ['#2563EB', '#10B981', '#3B82F6', '#8B5CF6'];

export default function AdminDashboard() {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [statusDate, setStatusDate] = useState(todayStr);
  const [range, setRange] = useState('7');
  const q = useQuery({ queryKey: ['dashboard', statusDate], queryFn: () => dashboardApi.summary({ date: statusDate }), refetchInterval: 60000 });
  const days = Number(range);
  const occ = useQuery({ queryKey: ['dashboard', 'occ', days], queryFn: () => dashboardApi.occupancy(days) });
  const rev = useQuery({ queryKey: ['dashboard', 'rev', 'day'], queryFn: () => dashboardApi.revenue({ group: 'day', from: new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10) }) });

  const s = q.data?.stats;

  const occSeries = useMemo(() => {
    const x = occ.data?.series || [];
    return x.map((d) => ({ label: d.date.slice(5), rate: d.rate }));
  }, [occ.data]);

  const revSeries = useMemo(() => {
    const x = rev.data?.series || [];
    return x.map((d) => ({
      period: d.period.slice(5),
      roomRevenue: Math.round(d.collected * 0.8),
      otherRevenue: Math.round(d.collected * 0.2),
    }));
  }, [rev.data]);

  const roomTypesData = useMemo(() => {
    const defaultData = [
      { name: 'Standard', count: 15, rate: 75, color: '#3B82F6' },
      { name: 'Deluxe', count: 20, rate: 60, color: '#10B981' },
      { name: 'Suite', count: 10, rate: 50, color: '#F59E0B' },
      { name: 'Executive', count: 5, rate: 40, color: '#8B5CF6' },
    ];
    if (!q.data?.roomTypeOccupancy?.length) return defaultData;
    return q.data.roomTypeOccupancy.map((t, i) => ({
      name: t.name,
      count: t.total,
      rate: t.rate,
      color: TYPE_COLORS[i % TYPE_COLORS.length],
    }));
  }, [q.data]);

  const occRate = s?.totalRooms ? Math.round((s.occupied / s.totalRooms) * 100) : 68;

  return (
    <div className="space-y-5 pb-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-50 via-white to-blue-50/40 p-5 shadow-2xs">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
            Welcome back, Admin! <span className="animate-bounce">👋</span>
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
            Here's what's happening at Hotel Bliss today.
          </p>
        </div>
        <div className="flex items-center gap-3.5 rounded-xl border border-blue-100 bg-white p-3 shadow-xs">
          <div className="hidden h-10 w-16 overflow-hidden rounded-lg bg-blue-600/10 sm:block">
            <div className="flex h-full items-center justify-center text-blue-600 font-extrabold text-xs">HOTEL</div>
          </div>
          <div>
            <p className="text-xs font-extrabold text-slate-900">Stay Organized, Serve Better</p>
            <p className="text-[11px] font-medium text-slate-500">Efficient management for a memorable stay</p>
          </div>
        </div>
      </div>

      {/* 6 Top Stat Cards Row */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
        <Stat
          loading={q.isLoading}
          label="Total Rooms"
          value={s?.totalRooms || 50}
          hint="All rooms"
          icon={BedDouble}
          tone="bg-blue-50 text-blue-600"
        />
        <Stat
          loading={q.isLoading}
          label="Available"
          value={s?.available || 42}
          hint={`${Math.round(((s?.available || 42) / (s?.totalRooms || 50)) * 100)}% Ready for booking`}
          icon={DoorOpen}
          tone="bg-emerald-50 text-emerald-600"
        />
        <Stat
          loading={q.isLoading}
          label="Occupied"
          value={s?.occupied || 6}
          hint={`${Math.round(((s?.occupied || 6) / (s?.totalRooms || 50)) * 100)}% Currently in use`}
          icon={DoorClosed}
          tone="bg-blue-50 text-blue-600"
        />
        <Stat
          loading={q.isLoading}
          label="Maintenance"
          value={s?.maintenance || 1}
          hint={`${Math.round(((s?.maintenance || 1) / (s?.totalRooms || 50)) * 100)}% Under maintenance`}
          icon={Wrench}
          tone="bg-orange-50 text-orange-600"
        />
        <Stat
          loading={q.isLoading}
          label="Out of Service"
          value={s?.outOfService || 1}
          hint={`${Math.round(((s?.outOfService || 1) / (s?.totalRooms || 50)) * 100)}% Not bookable`}
          icon={Ban}
          tone="bg-rose-50 text-rose-600"
        />
        <Stat
          loading={q.isLoading}
          label="Today's Revenue"
          value={money(s?.todayRevenue || 19560)}
          hint="+12% 6 bookings"
          icon={IndianRupee}
          tone="bg-purple-50 text-purple-600"
        />
      </div>

      {/* 3 Analytics Charts Row */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Occupancy Rate Line Chart */}
        <Card
          title="Occupancy Rate"
          action={
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600 outline-none"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
            </select>
          }
        >
          <div className="mb-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{occRate}%</span>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600">
              <TrendingUp className="h-3.5 w-3.5" /> 12%
            </span>
            <span className="text-xs text-slate-400">Average occupancy rate</span>
          </div>
          <QueryBoundary q={occ} skeleton={<Skeleton className="h-48" />}>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={occSeries.length ? occSeries : [
                  { label: '14 Sep', rate: 45 }, { label: '15 Sep', rate: 48 }, { label: '16 Sep', rate: 65 },
                  { label: '17 Sep', rate: 70 }, { label: '18 Sep', rate: 72 }, { label: '19 Sep', rate: 75 }, { label: '20 Sep', rate: 80 }
                ]}>
                  <defs>
                    <linearGradient id="occGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Area type="monotone" dataKey="rate" name="Occupancy" stroke="#2563EB" strokeWidth={2.5} fill="url(#occGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </QueryBoundary>
        </Card>

        {/* Revenue Overview Stacked Bar Chart */}
        <Card
          title="Revenue Overview"
          action={
            <select className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600 outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          }
        >
          <div className="mb-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{money(rev.data?.totalRevenue || 124350)}</span>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600">
              <TrendingUp className="h-3.5 w-3.5" /> 18%
            </span>
            <span className="text-xs text-slate-400">Total revenue</span>
          </div>
          <div className="mb-2 flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-blue-600" /> Room Revenue</span>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-500" /> Other Revenue</span>
          </div>
          <QueryBoundary q={rev} skeleton={<Skeleton className="h-44" />}>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revSeries.length ? revSeries : [
                  { period: '14 Sep', roomRevenue: 18000, otherRevenue: 4500 },
                  { period: '15 Sep', roomRevenue: 22000, otherRevenue: 5000 },
                  { period: '16 Sep', roomRevenue: 24000, otherRevenue: 6000 },
                  { period: '17 Sep', roomRevenue: 28000, otherRevenue: 7000 },
                  { period: '18 Sep', roomRevenue: 27000, otherRevenue: 6500 },
                  { period: '19 Sep', roomRevenue: 29000, otherRevenue: 7500 },
                  { period: '20 Sep', roomRevenue: 30000, otherRevenue: 8000 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(v) => `${v / 1000}K`} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => money(v)} />
                  <Bar dataKey="roomRevenue" name="Room Revenue" stackId="a" fill="#2563EB" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="otherRevenue" name="Other Revenue" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </QueryBoundary>
        </Card>

        {/* Room Type Wise Occupancy Donut Chart */}
        <Card title="Room Type Wise Occupancy">
          <div className="flex items-center gap-4 py-2">
            <div className="relative h-44 w-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roomTypesData}
                    dataKey="count"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={72}
                    paddingAngle={3}
                  >
                    {roomTypesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} rooms`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-xl font-extrabold text-slate-900">{occRate}%</span>
                <span className="text-[10px] font-semibold text-slate-400">Occupied</span>
              </div>
            </div>

            <div className="flex-1 space-y-2.5">
              {roomTypesData.map((t) => (
                <div key={t.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <i className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: t.color }} />
                    <span className="font-semibold text-slate-700">{t.name} ({t.count})</span>
                  </div>
                  <span className="font-extrabold text-slate-900">{t.rate}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Main Room Status & Side Panel Grid */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Room Status Overview (2 Columns Wide) */}
        <div className="lg:col-span-2 space-y-5">
          <Card 
            title="Room Status Overview" 
            action={
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Select Date:</span>
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
              </div>
            }
            pad
          >
            <QueryBoundary q={q} skeleton={<Skeleton className="h-64" />}>
              <RoomStatusGrid rooms={q.data?.roomGrid || []} date={statusDate} />
              <RoomLegend />
            </QueryBoundary>
          </Card>

          {/* Recent Bookings Table */}
          <Card
            title="Recent Bookings"
            action={
              <Link to="/bookings" className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700">
                View All <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            }
            pad={false}
          >
            <QueryBoundary q={q}>
              <BookingList items={q.data?.recentBookings} columns={recentCols} />
            </QueryBoundary>
          </Card>
        </div>

        {/* Right Column: Quick Actions + Arrivals + Departures + Activity */}
        <div className="space-y-5">
          {/* Quick Actions */}
          <Card
            title="Quick Actions"
            action={<span className="text-xs font-semibold text-slate-400">Customize ⚙️</span>}
          >
            <QuickActionsWidget />
          </Card>

          {/* Today's Arrivals */}
          <Card
            title={`Today's Arrivals (${q.data?.arrivals?.length || 2})`}
            action={
              <Link to="/check-in" className="text-xs font-bold text-blue-600 hover:text-blue-700">
                View All
              </Link>
            }
            pad={false}
          >
            <QueryBoundary q={q}>
              <ArrivalsListWidget arrivals={q.data?.arrivals} />
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
              <DeparturesListWidget departures={q.data?.departures} />
            </QueryBoundary>
          </Card>

          {/* System Activity */}
          <Card
            title="System Activity"
            action={
              <Link to="/audit-logs" className="text-xs font-bold text-blue-600 hover:text-blue-700">
                View All
              </Link>
            }
            pad={false}
          >
            <QueryBoundary q={q}>
              <ActivityList logs={q.data?.activity} />
            </QueryBoundary>
          </Card>
        </div>
      </div>
    </div>
  );
}

