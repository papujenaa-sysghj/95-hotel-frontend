import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Calendar as CalendarIcon,
  Search,
  SlidersHorizontal,
  BedDouble,
  LogIn,
  LogOut,
  AlertTriangle
} from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  getDaysInMonth,
  getDay,
  addMonths,
  subMonths,
  format,
  isToday
} from 'date-fns';
import { cx } from '../common/ui';
import { iso, today } from '../../utils/format';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function MonthlyCalendarContent({
  currentMonth,
  onMonthChange,
  calendarData,
  isLoading,
  isFetching,
  onRefetch,
  onDateClick,
  onNewBooking,
  onOpenMobileMenu
}) {
  const [selectedFloor, setSelectedFloor] = useState('all');
  const [selectedRoomType, setSelectedRoomType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const rawRooms = calendarData?.rooms || [];

  // Extract unique room types and floors
  const roomTypes = useMemo(() => {
    const map = new Map();
    rawRooms.forEach((r) => {
      if (r.roomType && r.roomType._id) {
        map.set(String(r.roomType._id), r.roomType.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [rawRooms]);

  const floors = useMemo(() => {
    return [...new Set(rawRooms.map((r) => r.floor))].sort((a, b) => a - b);
  }, [rawRooms]);

  // Filtered rooms based on taskbar filters
  const rooms = useMemo(() => {
    return rawRooms.filter((r) => {
      if (selectedFloor !== 'all' && String(r.floor) !== String(selectedFloor)) return false;
      if (selectedRoomType !== 'all' && String(r.roomType?._id || r.roomType) !== String(selectedRoomType)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNumber = String(r.roomNumber).toLowerCase().includes(q);
        const matchType = (r.roomType?.name || '').toLowerCase().includes(q);
        if (!matchNumber && !matchType) return false;
      }
      return true;
    });
  }, [rawRooms, selectedFloor, selectedRoomType, searchQuery]);

  const totalRoomsCount = rooms.length;

  // Calculate day-by-day stats for the entire month
  const monthStats = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(currentMonth);
    const days = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dateStr = format(dateObj, 'yyyy-MM-dd');

      let occupiedCount = 0;
      let arrivalsCount = 0;
      let departuresCount = 0;
      let exceptionsCount = 0;
      let dailyEstRevenue = 0;

      rooms.forEach((room) => {
        // Maintenance / Blocks
        const hasBlock = (room.blocks || []).some((b) => {
          const bFrom = new Date(b.blockFrom).toISOString().split('T')[0];
          const bTo = new Date(b.blockTo).toISOString().split('T')[0];
          return dateStr >= bFrom && dateStr <= bTo;
        });

        if (hasBlock || room.status === 'maintenance' || room.status === 'out_of_service') {
          exceptionsCount++;
        }

        // Bookings
        (room.bookings || []).forEach((b) => {
          const inDate = new Date(b.checkInDate).toISOString().split('T')[0];
          const outDate = new Date(b.checkOutDate).toISOString().split('T')[0];

          if (inDate === dateStr) {
            arrivalsCount++;
          }
          if (outDate === dateStr) {
            departuresCount++;
          }
          // Hotel night logic: occupied on [inDate, outDate)
          if (dateStr >= inDate && dateStr < outDate) {
            occupiedCount++;
            dailyEstRevenue += (b.roomRate || room.basePrice || 2500);
          }
        });
      });

      const effectiveTotal = Math.max(1, totalRoomsCount);
      const occupancyPercentage = Math.round((occupiedCount / effectiveTotal) * 100);

      days.push({
        day,
        date: dateObj,
        dateStr,
        occupiedCount,
        totalRooms: totalRoomsCount,
        occupancyPercentage,
        arrivalsCount,
        departuresCount,
        exceptionsCount,
        dailyEstRevenue
      });
    }

    return days;
  }, [currentMonth, rooms, totalRoomsCount]);

  // Aggregate monthly overall stats & financial calculations
  const aggregateStats = useMemo(() => {
    if (monthStats.length === 0) {
      return {
        avgOccupancy: 0,
        totalArrivals: 0,
        totalDepartures: 0,
        totalExceptions: 0,
        estimatedRevenue: 0,
        taxAmount: 0,
        grossTotal: 0,
        adr: 0
      };
    }
    const sumOcc = monthStats.reduce((acc, d) => acc + d.occupancyPercentage, 0);
    const totalArrivals = monthStats.reduce((acc, d) => acc + d.arrivalsCount, 0);
    const totalDepartures = monthStats.reduce((acc, d) => acc + d.departuresCount, 0);
    const totalExceptions = (calendarData?.rooms || []).filter(
      (r) => r.status === 'maintenance' || r.status === 'out_of_service'
    ).length;

    const totalEstimatedRev = monthStats.reduce((acc, d) => acc + d.dailyEstRevenue, 0);
    const estimatedTax = Math.round(totalEstimatedRev * 0.12);
    const grossRevenue = totalEstimatedRev + estimatedTax;

    const totalOccupiedNights = monthStats.reduce((acc, d) => acc + d.occupiedCount, 0);
    const adr = totalOccupiedNights > 0 ? Math.round(totalEstimatedRev / totalOccupiedNights) : 0;

    return {
      avgOccupancy: Math.round(sumOcc / monthStats.length),
      totalArrivals,
      totalDepartures,
      totalExceptions,
      estimatedRevenue: totalEstimatedRev,
      taxAmount: estimatedTax,
      grossTotal: grossRevenue,
      adr
    };
  }, [monthStats, calendarData]);

  // Grid padding for starting day of week
  const startDayOfWeek = getDay(startOfMonth(currentMonth));
  const paddingDays = Array.from({ length: startDayOfWeek });

  const totalCells = paddingDays.length + monthStats.length;
  const numRows = Math.ceil(totalCells / 7);

  const handleSelectMonth = (mIdx) => {
    const newD = new Date(currentMonth.getFullYear(), mIdx, 1);
    onMonthChange(newD);
  };

  const handleSelectYear = (yr) => {
    const newD = new Date(Number(yr), currentMonth.getMonth(), 1);
    onMonthChange(newD);
  };

  const currentYear = currentMonth.getFullYear();
  const currentMonthIdx = currentMonth.getMonth();

  return (
    <div className="flex flex-col h-full min-h-0 space-y-2">

      {/* 1. Top Header & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200/80 pb-2 shrink-0">
        <div className="flex items-center justify-between sm:justify-start gap-2 min-w-0">
          {/* Mobile Operations Sidebar Trigger */}
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-xs active:bg-slate-100"
              title="Open Operations Menu"
              aria-label="Open Operations Menu"
            >
              <CalendarIcon className="h-4 w-4 text-blue-600" />
              <span className="hidden xs:inline">Menu</span>
            </button>
          )}

          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5 truncate">
              <span>{MONTHS[currentMonthIdx]} {currentYear}</span>
              {isFetching && (
                <RefreshCw className="h-3 w-3 animate-spin text-blue-600 shrink-0" title="Syncing..." />
              )}
            </h1>
            <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate hidden sm:block">
              Full-month operational timeline & occupancy
            </p>
          </div>

          {/* Month Stepper & Selector */}
          <div className="flex items-center gap-1 ml-auto sm:ml-2">
            <div className="flex items-center rounded-xl border border-slate-200 bg-white shadow-xs p-0.5">
              <button
                onClick={() => onMonthChange(subMonths(currentMonth, 1))}
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                title="Previous Month"
                aria-label="Previous Month"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => onMonthChange(today())}
                className="px-2 py-0.5 text-[11px] font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border-x border-slate-100"
              >
                Today
              </button>
              <button
                onClick={() => onMonthChange(addMonths(currentMonth, 1))}
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                title="Next Month"
                aria-label="Next Month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Compact dropdowns for desktop / larger tablets */}
            <div className="hidden md:flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-0.5 shadow-xs">
              <select
                value={currentMonthIdx}
                onChange={(e) => handleSelectMonth(Number(e.target.value))}
                className="text-xs font-bold text-slate-800 bg-transparent py-1 px-1.5 focus:outline-none cursor-pointer"
              >
                {MONTHS.map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>

              <select
                value={currentYear}
                onChange={(e) => handleSelectYear(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent py-1 px-1 focus:outline-none cursor-pointer border-l border-slate-100"
              >
                {[2024, 2025, 2026, 2027, 2028].map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right side: High-density KPI strip & Action button */}
        <div className="flex items-center justify-between sm:justify-end gap-2">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="sm:hidden flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
            <span>Filters</span>
          </button>

          {/* Desktop Summary KPIs */}
          <div className="hidden xl:flex items-center gap-2 bg-white border border-slate-200/90 rounded-xl px-3 py-1 text-xs shadow-xs">
            <div className="flex items-center gap-1.5 pr-2 border-r border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Occupancy</span>
              <span className="font-extrabold text-blue-600">{aggregateStats.avgOccupancy}%</span>
            </div>
            <div className="flex items-center gap-1.5 pr-2 border-r border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Arrivals</span>
              <span className="font-extrabold text-emerald-600">{aggregateStats.totalArrivals}</span>
            </div>
            <div className="flex items-center gap-1.5 pr-2 border-r border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Departures</span>
              <span className="font-extrabold text-rose-600">{aggregateStats.totalDepartures}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Rooms</span>
              <span className="font-extrabold text-slate-800">{totalRoomsCount}</span>
            </div>
          </div>

          <button
            onClick={() => onNewBooking()}
            className="flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ Booking</span>
          </button>
        </div>
      </div>

      {/* 2. Responsive Filters Bar & Legend */}
      <div className={cx(
        'rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 shadow-xs shrink-0',
        showMobileFilters ? 'block' : 'hidden sm:block'
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="hidden sm:flex items-center gap-1 text-slate-400 text-xs font-bold">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filter:</span>
            </div>

            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              className="flex-1 sm:flex-initial rounded-lg border border-slate-200 bg-slate-50/70 px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">All Floors</option>
              {floors.map((fl) => (
                <option key={fl} value={fl}>Floor {fl}</option>
              ))}
            </select>

            <select
              value={selectedRoomType}
              onChange={(e) => setSelectedRoomType(e.target.value)}
              className="flex-1 sm:flex-initial rounded-lg border border-slate-200 bg-slate-50/70 px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">All Room Types</option>
              {roomTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>

            <div className="relative w-full sm:w-32">
              <Search className="absolute left-2.5 top-2 h-3 w-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-1 pl-7 pr-2 text-xs placeholder:text-slate-400 focus:outline-none focus:bg-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 text-[10px] sm:text-[11px] font-semibold text-slate-600 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <span className="text-[9px] uppercase font-bold text-slate-400">Legend:</span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> 0-30%
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> 31-70%
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-rose-500" /> 71-100%
            </span>
          </div>
        </div>
      </div>

      {/* 3. 7-Day Monthly Grid: Full Width and Full Height Fit */}
      <div className="flex-1 min-h-0 flex flex-col rounded-xl sm:rounded-2xl border-2 border-slate-300 bg-white shadow-sm overflow-hidden w-full">

        {/* Weekday Header Row */}
        <div className="grid grid-cols-7 border-b-2 border-slate-300 bg-slate-100 text-center divide-x divide-slate-300 shrink-0">
          {WEEKDAYS.map((dayName, idx) => (
            <div
              key={dayName}
              className={cx(
                'py-2 uppercase tracking-wider text-[10px] sm:text-[11px] font-black truncate px-0.5',
                (idx === 0 || idx === 6) ? 'text-blue-800 bg-blue-50/60' : 'text-slate-800'
              )}
            >
              <span className="sm:hidden">{dayName.slice(0, 2)}</span>
              <span className="hidden sm:inline">{dayName}</span>
            </div>
          ))}
        </div>

        {/* Days Grid: Exactly fits full screen height across all rows */}
        <div
          className="grid grid-cols-7 flex-1 min-h-0 divide-x divide-y divide-slate-300/90 bg-slate-50/20"
          style={{ gridTemplateRows: `repeat(${numRows}, minmax(0, 1fr))` }}
        >
          {paddingDays.map((_, idx) => (
            <div key={`pad-${idx}`} className="h-full min-h-0 bg-slate-100/40 p-2 select-none border-b border-slate-300/90" />
          ))}

          {monthStats.map((d) => {
            const todayCell = isToday(d.date);
            const availableCount = Math.max(0, d.totalRooms - d.occupiedCount);

            let barColor = 'bg-emerald-500';
            if (d.occupancyPercentage > 70) {
              barColor = 'bg-rose-500';
            } else if (d.occupancyPercentage > 30) {
              barColor = 'bg-amber-500';
            }

            return (
              <div
                key={d.day}
                onClick={() => onDateClick(d.date, d)}
                className={cx(
                  'group relative h-full min-h-0 cursor-pointer bg-white p-1 sm:p-2.5 transition-all duration-150 flex flex-col justify-between hover:bg-blue-50/50 hover:shadow-md hover:z-10',
                  todayCell && 'ring-2 ring-inset ring-blue-500 bg-blue-50/30'
                )}
              >
                {/* Top: Day Number & Occupancy */}
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={cx(
                        'flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg text-[11px] sm:text-xs font-extrabold transition-all',
                        todayCell
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 ring-1 sm:ring-2 ring-blue-300'
                          : 'text-slate-800 group-hover:text-blue-600 group-hover:bg-blue-50'
                      )}
                    >
                      {d.day}
                    </span>

                    <div className="text-right">
                      <div className="flex items-baseline gap-1 justify-end">
                        <span className="text-[10px] sm:text-xs font-black text-slate-800">
                          {d.occupancyPercentage}%
                        </span>
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400 hidden sm:block -mt-0.5">
                        {d.occupiedCount}/{d.totalRooms}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-1 sm:mt-1.5 h-1 sm:h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={cx('h-full transition-all rounded-full', barColor)}
                      style={{ width: `${Math.min(100, Math.max(0, d.occupancyPercentage))}%` }}
                    />
                  </div>
                </div>

                {/* Middle: Availability summary (hidden on very small viewports if tight) */}
                <div className="my-0.5 hidden xs:flex sm:flex items-center justify-between text-[9px] sm:text-[10px] font-medium text-slate-500">
                  <span className="text-slate-600 font-semibold truncate">
                    <span className="text-emerald-600 font-bold">{availableCount}</span> free
                  </span>
                  {d.dailyEstRevenue > 0 && (
                    <span className="text-slate-400 font-medium hidden md:inline">
                      ₹{(d.dailyEstRevenue / 1000).toFixed(1)}k
                    </span>
                  )}
                </div>

                {/* Bottom: Arrivals & Departures Badges */}
                <div className="pt-0.5 sm:pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-[11px] font-bold">
                  <div className="flex items-center gap-0.5 sm:gap-1.5">
                    <span
                      className={cx(
                        'inline-flex items-center gap-0.5 px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded text-[9px] sm:text-[10px] font-bold transition-colors',
                        d.arrivalsCount > 0
                          ? 'text-emerald-800 bg-emerald-100/80 border border-emerald-200/60'
                          : 'text-slate-400 bg-slate-50'
                      )}
                      title={`${d.arrivalsCount} Arrivals`}
                    >
                      <span className="text-[8px] sm:text-[9px] font-black text-emerald-600">A</span> {d.arrivalsCount}
                    </span>

                    <span
                      className={cx(
                        'inline-flex items-center gap-0.5 px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded text-[9px] sm:text-[10px] font-bold transition-colors',
                        d.departuresCount > 0
                          ? 'text-rose-800 bg-rose-100/80 border border-rose-200/60'
                          : 'text-slate-400 bg-slate-50'
                      )}
                      title={`${d.departuresCount} Departures`}
                    >
                      <span className="text-[8px] sm:text-[9px] font-black text-rose-600">D</span> {d.departuresCount}
                    </span>
                  </div>

                  {d.exceptionsCount > 0 && (
                    <span
                      className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-amber-500 ring-1 sm:ring-2 ring-amber-200"
                      title={`${d.exceptionsCount} maintenance / block exceptions`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
