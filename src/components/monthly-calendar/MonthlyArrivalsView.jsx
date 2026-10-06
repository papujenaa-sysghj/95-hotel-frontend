import React, { useState, useMemo } from 'react';
import { LogIn, Search, Calendar, User, Phone, CheckCircle2, BedDouble, Plus } from 'lucide-react';
import { fmtDate, STATUS } from '../../utils/format';
import { cx } from '../common/ui';

export default function MonthlyArrivalsView({
  calendarData,
  currentMonth,
  onOpenBooking,
  onNewBooking,
  onCheckInAction
}) {
  const [query, setQuery] = useState('');
  const rooms = calendarData?.rooms || [];

  const arrivalsList = useMemo(() => {
    const monthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
    const list = [];

    rooms.forEach((room) => {
      (room.bookings || []).forEach((b) => {
        const inDate = new Date(b.checkInDate).toISOString().split('T')[0];
        if (inDate.startsWith(monthStr)) {
          list.push({
            booking: b,
            room,
            inDate,
            guestName: b.guest?.name || 'Guest',
            guestPhone: b.guest?.phone || '',
            bookingNumber: b.bookingNumber,
            status: b.bookingStatus,
            balance: b.balanceAmount || 0,
            nights: b.nights
          });
        }
      });
    });

    return list.sort((a, b) => a.inDate.localeCompare(b.inDate));
  }, [rooms, currentMonth]);

  const filteredArrivals = useMemo(() => {
    if (!query.trim()) return arrivalsList;
    const q = query.toLowerCase();
    return arrivalsList.filter((a) =>
      a.guestName.toLowerCase().includes(q) ||
      a.bookingNumber.toLowerCase().includes(q) ||
      String(a.room.roomNumber).toLowerCase().includes(q) ||
      a.guestPhone.includes(q)
    );
  }, [arrivalsList, query]);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
              <LogIn className="h-4 w-4" />
            </span>
            Monthly Arrivals
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Scheduled guest check-ins for {fmtDate(currentMonth, 'MMMM yyyy')} ({arrivalsList.length} total)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs placeholder:text-slate-400 focus:border-blue-500 focus:outline-none shadow-xs"
              placeholder="Search guest, room or booking ID..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button
            onClick={onNewBooking}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            New Booking
          </button>
        </div>
      </div>

      {/* Content Table */}
      <div className="flex-1 rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden flex flex-col">
        {filteredArrivals.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
            <LogIn className="h-12 w-12 text-slate-300 stroke-1 mb-3" />
            <p className="text-sm font-bold text-slate-700">No arrivals found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              {query ? 'No arrivals matched your search filter.' : `No guest check-ins scheduled for ${fmtDate(currentMonth, 'MMMM yyyy')}.`}
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* Mobile Card List (< md) */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredArrivals.map((item) => (
                <div
                  key={item.booking._id}
                  className="p-3.5 space-y-2.5 active:bg-slate-50 cursor-pointer"
                  onClick={() => onOpenBooking(item.booking._id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100 text-xs">
                      <BedDouble className="h-3 w-3" />
                      Room {item.room.roomNumber}
                    </span>
                    <span className={cx('text-[10px] font-bold px-2 py-0.5 rounded-md uppercase', STATUS[item.status]?.badge || 'bg-slate-100 text-slate-700')}>
                      {STATUS[item.status]?.label || item.status}
                    </span>
                  </div>

                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{item.guestName}</h4>
                      {item.guestPhone && <p className="text-xs text-slate-500">{item.guestPhone}</p>}
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">#{item.bookingNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-800">{fmtDate(item.booking.checkInDate, 'EEE, d MMM')}</p>
                      <p className="text-[11px] text-slate-500">{item.nights} {item.nights === 1 ? 'night' : 'nights'}</p>
                      <p className="text-xs font-bold text-slate-700 mt-0.5">₹{item.balance.toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                    {item.status === 'confirmed' || item.status === 'hold' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCheckInAction(item.booking._id);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Check-in Guest
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenBooking(item.booking._id);
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 text-center"
                      >
                        View Details
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (>= md) */}
            <table className="hidden md:table w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Room</th>
                  <th className="py-3 px-4">Guest</th>
                  <th className="py-3 px-4">Booking Ref</th>
                  <th className="py-3 px-4">Nights</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Balance</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredArrivals.map((item) => (
                  <tr
                    key={item.booking._id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => onOpenBooking(item.booking._id)}
                  >
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {fmtDate(item.booking.checkInDate, 'EEE, d MMM')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                        <BedDouble className="h-3.5 w-3.5" />
                        Room {item.room.roomNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      <div>{item.guestName}</div>
                      {item.guestPhone && <div className="text-[11px] text-slate-400">{item.guestPhone}</div>}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-600">
                      {item.bookingNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {item.nights} {item.nights === 1 ? 'night' : 'nights'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={cx('text-[10px] font-bold px-2 py-0.5 rounded-md uppercase', STATUS[item.status]?.badge || 'bg-slate-100 text-slate-700')}>
                        {STATUS[item.status]?.label || item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">
                      ₹{item.balance.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {item.status === 'confirmed' || item.status === 'hold' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCheckInAction(item.booking._id);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-all"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Check-in
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenBooking(item.booking._id);
                          }}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
