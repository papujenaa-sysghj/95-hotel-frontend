import React, { useState, useMemo } from 'react';
import { BedDouble, Search, Plus } from 'lucide-react';
import { STATUS } from '../../utils/format';
import { cx } from '../common/ui';
import AddRoomModal from './AddRoomModal';

export default function MonthlyRoomStatusView({
  calendarData,
  onOpenBooking
}) {
  const [filterFloor, setFilterFloor] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [addRoomOpen, setAddRoomOpen] = useState(false);

  const rooms = calendarData?.rooms || [];

  const floors = useMemo(() => {
    return [...new Set(rooms.map((r) => r.floor))].sort((a, b) => a - b);
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      if (filterFloor !== 'all' && String(r.floor) !== String(filterFloor)) return false;
      if (filterStatus !== 'all' && r.status !== filterStatus) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const numMatch = String(r.roomNumber).toLowerCase().includes(q);
        const typeMatch = (r.roomType?.name || '').toLowerCase().includes(q);
        if (!numMatch && !typeMatch) return false;
      }
      return true;
    });
  }, [rooms, filterFloor, filterStatus, search]);

  const statusCounts = useMemo(() => {
    const counts = { available: 0, occupied: 0, cleaning: 0, maintenance: 0, out_of_service: 0 };
    rooms.forEach((r) => {
      if (counts[r.status] !== undefined) counts[r.status]++;
    });
    return counts;
  }, [rooms]);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-100 text-blue-700">
              <BedDouble className="h-4 w-4" />
            </span>
            Room Inventory Status Matrix
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Live operational status across all {rooms.length} rooms
          </p>
        </div>

        {/* Filter controls and Add Room */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setAddRoomOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all"
          >
            <Plus className="h-3.5 w-3.5" /> Add Room / Floor
          </button>

          <div className="relative w-48">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search room..."
              className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
            value={filterFloor}
            onChange={(e) => setFilterFloor(e.target.value)}
          >
            <option value="all">All Floors</option>
            {floors.map((fl) => (
              <option key={fl} value={fl}>Floor {fl}</option>
            ))}
          </select>

          <select
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="available">Available ({statusCounts.available})</option>
            <option value="occupied">Occupied ({statusCounts.occupied})</option>
            <option value="cleaning">Cleaning ({statusCounts.cleaning})</option>
            <option value="maintenance">Maintenance ({statusCounts.maintenance})</option>
            <option value="out_of_service">Out of Service ({statusCounts.out_of_service})</option>
          </select>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div
          onClick={() => setFilterStatus(filterStatus === 'available' ? 'all' : 'available')}
          className={cx(
            'cursor-pointer rounded-xl border p-3 transition-all',
            filterStatus === 'available' ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:border-emerald-300'
          )}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Available</span>
          <div className="text-xl font-extrabold text-emerald-700 mt-0.5">{statusCounts.available}</div>
        </div>

        <div
          onClick={() => setFilterStatus(filterStatus === 'occupied' ? 'all' : 'occupied')}
          className={cx(
            'cursor-pointer rounded-xl border p-3 transition-all',
            filterStatus === 'occupied' ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20' : 'border-slate-200 bg-white hover:border-blue-300'
          )}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Occupied</span>
          <div className="text-xl font-extrabold text-blue-700 mt-0.5">{statusCounts.occupied}</div>
        </div>

        <div
          onClick={() => setFilterStatus(filterStatus === 'cleaning' ? 'all' : 'cleaning')}
          className={cx(
            'cursor-pointer rounded-xl border p-3 transition-all',
            filterStatus === 'cleaning' ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20' : 'border-slate-200 bg-white hover:border-amber-300'
          )}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Cleaning</span>
          <div className="text-xl font-extrabold text-amber-700 mt-0.5">{statusCounts.cleaning}</div>
        </div>

        <div
          onClick={() => setFilterStatus(filterStatus === 'maintenance' ? 'all' : 'maintenance')}
          className={cx(
            'cursor-pointer rounded-xl border p-3 transition-all',
            filterStatus === 'maintenance' ? 'border-orange-500 bg-orange-50/60 ring-2 ring-orange-500/20' : 'border-slate-200 bg-white hover:border-orange-300'
          )}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700">Maintenance</span>
          <div className="text-xl font-extrabold text-orange-700 mt-0.5">{statusCounts.maintenance}</div>
        </div>

        <div
          onClick={() => setFilterStatus(filterStatus === 'out_of_service' ? 'all' : 'out_of_service')}
          className={cx(
            'cursor-pointer rounded-xl border p-3 transition-all',
            filterStatus === 'out_of_service' ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-500/20' : 'border-slate-200 bg-white hover:border-rose-300'
          )}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Out of Service</span>
          <div className="text-xl font-extrabold text-rose-700 mt-0.5">{statusCounts.out_of_service}</div>
        </div>
      </div>

      {/* Room Grid */}
      <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs overflow-y-auto custom-scrollbar">
        {filteredRooms.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-12 text-center">
            <BedDouble className="h-12 w-12 text-slate-300 stroke-1 mb-3" />
            <p className="text-sm font-bold text-slate-700">No rooms found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredRooms.map((room) => {
              const activeBooking = (room.bookings || []).find(
                (b) => b.bookingStatus === 'checked_in'
              );

              return (
                <div
                  key={room._id}
                  className={cx(
                    'flex flex-col justify-between rounded-xl border p-3 transition-all hover:shadow-xs',
                    room.status === 'available' && 'border-emerald-200 bg-emerald-50/30 hover:border-emerald-400',
                    room.status === 'occupied' && 'border-blue-200 bg-blue-50/30 hover:border-blue-400',
                    room.status === 'cleaning' && 'border-amber-200 bg-amber-50/30 hover:border-amber-400',
                    (room.status === 'maintenance' || room.status === 'out_of_service') && 'border-rose-200 bg-rose-50/30 hover:border-rose-400'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-sm font-extrabold text-slate-900 block">
                        Room {room.roomNumber}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500">
                        {room.roomType?.name || 'Standard'} • Fl {room.floor}
                      </span>
                    </div>
                    <span className={cx('h-2.5 w-2.5 rounded-full', STATUS[room.status]?.dot || 'bg-slate-400')} />
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className={cx('text-[10px] font-bold uppercase', STATUS[room.status]?.text || 'text-slate-600')}>
                      {STATUS[room.status]?.label || room.status}
                    </span>

                    {activeBooking && (
                      <button
                        onClick={() => onOpenBooking(activeBooking._id)}
                        className="text-[10px] font-bold text-blue-600 hover:underline truncate max-w-[80px]"
                        title={activeBooking.guest?.name}
                      >
                        {activeBooking.guest?.name || 'Guest'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddRoomModal open={addRoomOpen} onClose={() => setAddRoomOpen(false)} />
    </div>
  );
}

