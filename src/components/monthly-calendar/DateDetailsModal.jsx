import React from 'react';
import { X, Calendar, LogIn, LogOut, BedDouble, AlertTriangle, Plus } from 'lucide-react';
import { fmtDate, STATUS } from '../../utils/format';
import { cx } from '../common/ui';

export default function DateDetailsModal({
  date,
  rooms = [],
  dayStats = {},
  onClose,
  onNewBooking,
  onOpenBooking
}) {
  if (!date) return null;

  const dateStr = date.toISOString().split('T')[0];

  const arrivals = [];
  const departures = [];
  const stayovers = [];
  const exceptions = [];

  rooms.forEach((room) => {
    const activeBlocks = (room.blocks || []).filter((block) => {
      const bFrom = new Date(block.blockFrom).toISOString().split('T')[0];
      const bTo = new Date(block.blockTo).toISOString().split('T')[0];
      return dateStr >= bFrom && dateStr <= bTo;
    });

    if (activeBlocks.length > 0 || room.status === 'maintenance' || room.status === 'out_of_service') {
      exceptions.push({
        room,
        blocks: activeBlocks,
        status: room.status
      });
    }

    (room.bookings || []).forEach((b) => {
      const inDate = new Date(b.checkInDate).toISOString().split('T')[0];
      const outDate = new Date(b.checkOutDate).toISOString().split('T')[0];

      if (inDate === dateStr) {
        arrivals.push({ booking: b, room });
      } else if (outDate === dateStr) {
        departures.push({ booking: b, room });
      } else if (dateStr > inDate && dateStr < outDate) {
        stayovers.push({ booking: b, room });
      }
    });
  });

  const occPercent = dayStats.occupancyPercentage ?? (
    rooms.length > 0 ? Math.round(((stayovers.length + arrivals.length) / rooms.length) * 100) : 0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex h-full sm:h-auto max-h-[100dvh] sm:max-h-[90vh] w-full max-w-2xl flex-col rounded-none sm:rounded-2xl bg-white shadow-2xl overflow-hidden border-0 sm:border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 shrink-0">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {fmtDate(date, 'EEEE, d MMMM yyyy')}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
                Day Schedule & Occupancy Breakdown
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Day Metrics Bar */}
        <div className="grid grid-cols-4 border-b border-slate-100 bg-white px-3 sm:px-6 py-2.5 sm:py-3 divide-x divide-slate-100 text-center text-xs">
          <div>
            <span className="block text-[10px] sm:text-[11px] text-slate-400 font-medium">Occupancy</span>
            <span className="text-xs sm:text-sm font-extrabold text-blue-600">{occPercent}%</span>
          </div>
          <div>
            <span className="block text-[10px] sm:text-[11px] text-slate-400 font-medium">Arrivals</span>
            <span className="text-xs sm:text-sm font-extrabold text-emerald-600">{arrivals.length}</span>
          </div>
          <div>
            <span className="block text-[10px] sm:text-[11px] text-slate-400 font-medium">Departures</span>
            <span className="text-xs sm:text-sm font-extrabold text-rose-600">{departures.length}</span>
          </div>
          <div>
            <span className="block text-[10px] sm:text-[11px] text-slate-400 font-medium">Exceptions</span>
            <span className="text-xs sm:text-sm font-extrabold text-amber-600">{exceptions.length}</span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 custom-scrollbar pb-safe">
          
          {/* Arrivals List */}
          <section>
            <div className="flex items-center gap-2 mb-2.5">
              <LogIn className="h-4 w-4 text-emerald-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Arrivals ({arrivals.length})
              </h4>
            </div>
            {arrivals.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 p-3 text-center text-xs text-slate-400">
                No arrivals scheduled for this date.
              </p>
            ) : (
              <div className="grid gap-2">
                {arrivals.map(({ booking, room }) => (
                  <div
                    key={booking._id}
                    onClick={() => onOpenBooking(booking._id)}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 hover:bg-emerald-50/50 hover:border-emerald-200 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 font-extrabold text-xs grid place-items-center">
                        {room.roomNumber}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{booking.guest?.name || 'Guest'}</p>
                        <p className="text-[11px] text-slate-500">{booking.bookingNumber} • {booking.nights} night(s)</p>
                      </div>
                    </div>
                    <span className={cx('text-[10px] font-bold px-2 py-0.5 rounded-md uppercase', STATUS[booking.bookingStatus]?.badge || 'bg-slate-100 text-slate-700')}>
                      {STATUS[booking.bookingStatus]?.label || booking.bookingStatus}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Departures List */}
          <section>
            <div className="flex items-center gap-2 mb-2.5">
              <LogOut className="h-4 w-4 text-rose-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Departures ({departures.length})
              </h4>
            </div>
            {departures.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 p-3 text-center text-xs text-slate-400">
                No departures scheduled for this date.
              </p>
            ) : (
              <div className="grid gap-2">
                {departures.map(({ booking, room }) => (
                  <div
                    key={booking._id}
                    onClick={() => onOpenBooking(booking._id)}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 hover:bg-rose-50/50 hover:border-rose-200 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-rose-100 text-rose-700 font-extrabold text-xs grid place-items-center">
                        {room.roomNumber}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{booking.guest?.name || 'Guest'}</p>
                        <p className="text-[11px] text-slate-500">
                          {booking.bookingNumber} • Balance: ₹{(booking.balanceAmount || 0).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <span className={cx('text-[10px] font-bold px-2 py-0.5 rounded-md uppercase', STATUS[booking.bookingStatus]?.badge || 'bg-slate-100 text-slate-700')}>
                      {STATUS[booking.bookingStatus]?.label || booking.bookingStatus}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Stay-overs List */}
          <section>
            <div className="flex items-center gap-2 mb-2.5">
              <BedDouble className="h-4 w-4 text-blue-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                In-House Stay-Overs ({stayovers.length})
              </h4>
            </div>
            {stayovers.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 p-3 text-center text-xs text-slate-400">
                No stay-overs on this date.
              </p>
            ) : (
              <div className="grid gap-2 max-h-48 overflow-y-auto">
                {stayovers.map(({ booking, room }) => (
                  <div
                    key={booking._id}
                    onClick={() => onOpenBooking(booking._id)}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-2.5 hover:bg-blue-50/50 hover:border-blue-200 transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                        {room.roomNumber}
                      </span>
                      <span className="text-xs font-medium text-slate-800">{booking.guest?.name || 'Guest'}</span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Out: {fmtDate(booking.checkOutDate, 'd MMM')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Exceptions / Maintenance */}
          {exceptions.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Maintenance & Blocks ({exceptions.length})
                </h4>
              </div>
              <div className="grid gap-2">
                {exceptions.map(({ room, blocks, status }) => (
                  <div
                    key={room._id}
                    className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/50 p-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-amber-900">Room {room.roomNumber} ({room.roomType?.name})</p>
                      <p className="text-[11px] text-amber-700">
                        {blocks.length > 0 ? blocks.map(b => b.issue).join(', ') : `Status: ${status}`}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-bold rounded text-[10px] uppercase">
                      Blocked
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>

        {/* Footer actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-slate-100 bg-slate-50/80 px-4 sm:px-6 py-3 sm:py-3.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto rounded-xl border border-slate-300 px-4 py-2.5 sm:py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 active:bg-slate-200"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onNewBooking(dateStr);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 sm:py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ New Booking on {fmtDate(date, 'd MMM')}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
