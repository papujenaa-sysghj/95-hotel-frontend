import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import {
  BedDouble,
  DoorOpen,
  Users,
  Wrench,
  Ban,
  Search,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Snowflake,
  Wind,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import CrudPage from '../../components/common/CrudPage';
import { resource } from '../../services/resource.api';
import { roomApi } from '../../services/room.api';
import { useMutate } from '../../hooks/useMutate';
import { useCan } from '../../store/auth';
import { Badge, Modal, Field, Spinner, cx } from '../../components/common/ui';
import { money, fmtDate } from '../../utils/format';
import RoomModal from '../../components/room/RoomModal';


const num = z.coerce.number({ invalid_type_error: 'Enter a number' });
const roomSchema = z.object({
  roomNumber: z.string().min(1, 'Room number is required'),
  floor: num.int(),
  roomType: z.string().min(1, 'Choose a room type'),
  basePrice: num.min(0),
  standardCapacity: num.int().min(1),
  adultsCapacity: num.int().min(1),
  childrenCapacity: num.int().min(0),
  isAC: z.boolean(),
  bedType: z.string().optional(),
  amenities: z.any().optional(),
  description: z.string().optional(),
  isActive: z.boolean(),
});
const typeSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional(),
  basePrice: num.min(0),
  maxOccupancy: num.int().min(1),
  acAvailable: z.boolean(),
  isActive: z.boolean(),
  amenities: z.any().optional(),
});
const amenitySchema = z.object({ name: z.string().min(2, 'Name is required'), icon: z.string().optional() });
const ids = (v) => [].concat(v || []).filter((x) => typeof x === 'string' && x);

export default function RoomsPage() {
  const [tab, setTab] = useState('rooms');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState(null);
  const can = useCan();
  const types = useQuery({ queryKey: ['room-types'], queryFn: roomApi.types });
  const amen = useQuery({ queryKey: ['amenities'], queryFn: roomApi.amenities });
  const tOpts = (types.data?.items || types.data || []).map((t) => ({ value: t._id, label: t.name }));
  const aOpts = (amen.data?.items || amen.data || []).map((a) => ({ value: a._id, label: a.name }));

  return (
    <div className="space-y-5 pb-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <BedDouble className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Rooms & Setup</h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Manage your rooms, floors, room types and hotel amenities in real time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-semibold text-slate-400">
            <span>Home</span> <span className="mx-1">&gt;</span> <span className="text-slate-800">Rooms & Setup</span>
          </div>
        </div>
      </div>

      {/* Tabs Row & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex rounded-xl bg-slate-100 p-1">
          {[
            { id: 'rooms', label: 'Rooms' },
            { id: 'types', label: 'Room types' },
            { id: 'amenities', label: 'Amenities' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cx(
                'rounded-lg px-4 py-1.5 text-xs font-extrabold transition-all',
                tab === t.id ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          {can('rooms.create') && tab === 'rooms' && (
            <button
              onClick={() => {
                setRoomToEdit(null);
                setAddModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all"
            >
              <Plus className="h-4 w-4" /> Add room / floor
            </button>
          )}
        </div>
      </div>

      {tab === 'rooms' && (
        <RoomsTab
          tOpts={tOpts}
          aOpts={aOpts}
          onEditRoom={(room) => {
            setRoomToEdit(room);
            setAddModalOpen(true);
          }}
          onAddRoom={() => {
            setRoomToEdit(null);
            setAddModalOpen(true);
          }}
        />
      )}

      {tab === 'types' && (
        <CrudPage
          embedded
          noun="room type"
          queryKey="room-types"
          api={resource('room-types')}
          schema={typeSchema}
          perms={{ create: 'rooms.create', edit: 'rooms.edit', delete: 'rooms.delete' }}
          defaults={{ name: '', description: '', basePrice: 0, maxOccupancy: 2, acAvailable: true, isActive: true, amenities: [] }}
          toForm={(r) => ({ ...r, amenities: (r.amenities || []).map((a) => a._id || a) })}
          toPayload={(v) => ({ ...v, amenities: ids(v.amenities) })}
          columns={[
            { key: 'name', header: 'Name', render: (r) => <b>{r.name}</b> },
            { key: 'basePrice', header: 'Base price', render: (r) => money(r.basePrice) },
            { key: 'maxOccupancy', header: 'Max guests' },
            { key: 'ac', header: 'AC', render: (r) => (r.acAvailable ? 'Available' : 'Non-AC only') },
            { key: 'a', header: 'Amenities', render: (r) => (r.amenities || []).map((a) => a.name).join(', ') || '—' },
            { key: 's', header: 'Active', render: (r) => <Badge status={r.isActive ? 'available' : 'closed'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
          ]}
          fields={[
            { name: 'name', label: 'Name' },
            { name: 'basePrice', label: 'Base price (₹/night)', type: 'number' },
            { name: 'maxOccupancy', label: 'Maximum occupancy', type: 'number' },
            { name: 'acAvailable', label: 'AC', type: 'checkbox', checkLabel: 'AC available' },
            { name: 'isActive', label: 'Status', type: 'checkbox', checkLabel: 'Active' },
            { name: 'description', label: 'Description', type: 'textarea', full: true },
            { name: 'amenities', label: 'Amenities', type: 'multi', options: aOpts, full: true },
          ]}
        />
      )}

      {tab === 'amenities' && (
        <CrudPage
          embedded
          noun="amenity"
          queryKey="amenities"
          api={resource('amenities')}
          schema={amenitySchema}
          perms={{ create: 'rooms.create', edit: 'rooms.edit', delete: 'rooms.delete' }}
          defaults={{ name: '' }}
          columns={[{ key: 'name', header: 'Amenity', render: (r) => <b>{r.name}</b> }]}
          fields={[{ name: 'name', label: 'Name', full: true }]}
        />
      )}

      {/* Room Modal for Add / Edit */}
      <RoomModal
        open={addModalOpen}
        onClose={() => {
          setAddModalOpen(false);
          setRoomToEdit(null);
        }}
        roomToEdit={roomToEdit}
      />
    </div>
  );
}

function RoomsTab({ tOpts, aOpts, onEditRoom, onAddRoom }) {
  const can = useCan();
  const [acModalRoom, setAcModalRoom] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [floorFilter, setFloorFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [configFilter, setConfigFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const inv = ['rooms', 'calendar', 'monthly-calendar', 'dashboard', 'housekeeping', 'maintenance'];

  // Delete mutation
  const deleteRoom = useMutate((id) => roomApi.remove(id), {
    success: 'Room deleted successfully',
    invalidate: inv,
  });

  const list = useQuery({
    queryKey: ['rooms'],
    queryFn: () => roomApi.list({ limit: 200 }),
  });

  const rawRooms = list.data?.items || list.data?.rooms || list.data || [];

  // Extract unique floors for dynamic dropdown
  const uniqueFloors = Array.from(new Set(rawRooms.map((r) => r.floor).filter((f) => f !== undefined))).sort((a, b) => a - b);

  // Live Stat counts from real MongoDB data
  const totalCount = rawRooms.length;
  const availableCount = rawRooms.filter((r) => r.status === 'available').length;
  const occupiedCount = rawRooms.filter((r) => r.status === 'occupied').length;
  const cleaningCount = rawRooms.filter((r) => r.housekeepingStatus === 'dirty' || r.status === 'cleaning').length;
  const maintenanceCount = rawRooms.filter((r) => r.maintenanceStatus === 'maintenance' || r.maintenanceStatus === 'out_of_service' || (r.tempConfig?.active && !r.tempConfig?.isAC)).length;

  // Filtered rooms
  const filteredRooms = rawRooms.filter((r) => {
    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const rNum = String(r.roomNumber || '').toLowerCase();
      const typeName = String(r.roomType?.name || '').toLowerCase();
      if (!rNum.includes(q) && !typeName.includes(q)) return false;
    }

    // Floor filter
    if (floorFilter !== 'all' && String(r.floor) !== String(floorFilter)) {
      return false;
    }

    // Room Type filter
    if (typeFilter !== 'all') {
      const typeId = r.roomType?._id || r.roomType;
      const typeName = (r.roomType?.name || '').toLowerCase();
      if (typeId !== typeFilter && typeName !== typeFilter.toLowerCase()) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'available' && r.status !== 'available') return false;
      if (statusFilter === 'occupied' && r.status !== 'occupied') return false;
      if (statusFilter === 'cleaning' && (r.status !== 'cleaning' && r.housekeepingStatus !== 'dirty')) return false;
      if (statusFilter === 'maintenance' && (r.status !== 'maintenance' && r.maintenanceStatus !== 'maintenance' && r.maintenanceStatus !== 'out_of_service')) return false;
    }

    // Config filter (AC vs Non-AC)
    if (configFilter === 'ac' && !r.isAC) return false;
    if (configFilter === 'non_ac' && r.isAC) return false;

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredRooms.length / pageSize) || 1;
  const paginatedRooms = filteredRooms.slice((page - 1) * pageSize, page * pageSize);

  const handleDelete = (room) => {
    if (window.confirm(`Are you sure you want to delete Room ${room.roomNumber}? This cannot be undone.`)) {
      deleteRoom.mutate(room._id);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFloorFilter('all');
    setTypeFilter('all');
    setStatusFilter('all');
    setConfigFilter('all');
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* 5 Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
            <BedDouble className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Rooms</p>
            <p className="text-2xl font-black text-slate-900 leading-none my-0.5">{totalCount}</p>
            <p className="text-[10px] font-semibold text-slate-400">Across {uniqueFloors.length || 1} floors</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
            <DoorOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Available</p>
            <p className="text-2xl font-black text-emerald-600 leading-none my-0.5">{availableCount}</p>
            <p className="text-[10px] font-semibold text-slate-400">
              {totalCount > 0 ? `${Math.round((availableCount / totalCount) * 100)}%` : '0%'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Occupied</p>
            <p className="text-2xl font-black text-blue-600 leading-none my-0.5">{occupiedCount}</p>
            <p className="text-[10px] font-semibold text-slate-400">
              {totalCount > 0 ? `${Math.round((occupiedCount / totalCount) * 100)}%` : '0%'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cleaning / Dirty</p>
            <p className="text-2xl font-black text-amber-600 leading-none my-0.5">{cleaningCount}</p>
            <p className="text-[10px] font-semibold text-slate-400">Housekeeping</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600">
            <Ban className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Maintenance</p>
            <p className="text-2xl font-black text-rose-600 leading-none my-0.5">{maintenanceCount}</p>
            <p className="text-[10px] font-semibold text-slate-400">Issues & Blocks</p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-2xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs placeholder:text-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            placeholder="Search rooms (e.g. 101, Deluxe, Suite...)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Dynamic Floors */}
          <select
            value={floorFilter}
            onChange={(e) => {
              setFloorFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">All floors</option>
            {uniqueFloors.map((f) => (
              <option key={f} value={f}>Floor {f}</option>
            ))}
          </select>

          {/* Dynamic Room Types */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">All room types</option>
            {tOpts.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">All status</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="cleaning">Cleaning / Dirty</option>
            <option value="maintenance">Maintenance</option>
          </select>

          <select
            value={configFilter}
            onChange={(e) => {
              setConfigFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">All climate</option>
            <option value="ac">AC</option>
            <option value="non_ac">Non-AC</option>
          </select>

          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500" /> Reset
          </button>
        </div>
      </div>

      {/* Mobile Room Cards View (< md) */}
      <div className="space-y-3 md:hidden">
        {paginatedRooms.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-400">
            <BedDouble className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="font-bold text-sm text-slate-600">No rooms found</p>
            <p className="text-xs mt-1">Try resetting filters or adding a room.</p>
            {can('rooms.create') && (
              <button
                onClick={onAddRoom}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 shadow-md min-h-[44px]"
              >
                <Plus className="h-3.5 w-3.5" /> Add Room
              </button>
            )}
          </div>
        ) : (
          paginatedRooms.map((r) => {
            const typeName = r.roomType?.name || 'Standard';
            const isAcActive = r.tempConfig?.active ? r.tempConfig.isAC : r.isAC;
            const currentRate = r.tempConfig?.active && r.tempConfig.price ? r.tempConfig.price : r.basePrice;

            return (
              <div
                key={r._id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-blue-600 text-base">Room {r.roomNumber}</span>
                      <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                        {typeName}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">Floor {r.floor}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900 text-sm">{money(currentRate)}</p>
                    <p className="text-[10px] text-slate-400">per night</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="flex items-center gap-1 font-bold text-slate-700">
                    {isAcActive ? (
                      <>
                        <Snowflake className="h-3.5 w-3.5 text-sky-500" /> AC
                      </>
                    ) : (
                      <>
                        <Wind className="h-3.5 w-3.5 text-slate-400" /> Non-AC
                      </>
                    )}
                  </span>
                  <span
                    className={cx(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold border',
                      r.status === 'available'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : r.status === 'occupied'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : r.status === 'cleaning'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    )}
                  >
                    <span
                      className={cx(
                        'h-1.5 w-1.5 rounded-full',
                        r.status === 'available'
                          ? 'bg-emerald-500'
                          : r.status === 'occupied'
                          ? 'bg-blue-600'
                          : r.status === 'cleaning'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      )}
                    />
                    {r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : 'Available'}
                  </span>
                  <span
                    className={cx(
                      'inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                      r.housekeepingStatus === 'clean'
                        ? 'text-emerald-700 bg-emerald-50'
                        : r.housekeepingStatus === 'dirty'
                        ? 'text-amber-700 bg-amber-50'
                        : 'text-slate-600 bg-slate-100'
                    )}
                  >
                    {r.housekeepingStatus || 'Clean'}
                  </span>
                </div>

                {/* Mobile Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  {can('rooms.edit') && (
                    <button
                      onClick={() => onEditRoom(r)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 min-h-[40px]"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                  )}
                  {can('rooms.configure') && (
                    <button
                      onClick={() => setAcModalRoom(r)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 py-2 text-xs font-bold text-sky-700 hover:bg-sky-100 min-h-[40px]"
                    >
                      <Snowflake className="h-3.5 w-3.5" /> Config
                    </button>
                  )}
                  {can('rooms.delete') && (
                    <button
                      onClick={() => handleDelete(r)}
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Main Desktop Rooms Table (hidden on mobile) */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">Room</th>
                <th className="py-3 px-4">Floor</th>
                <th className="py-3 px-4">Room Type</th>
                <th className="py-3 px-4">Configuration</th>
                <th className="py-3 px-4">Rate (₹)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Housekeeping</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRooms.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <BedDouble className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="font-bold text-sm text-slate-600">No rooms found</p>
                    <p className="text-xs mt-1">Try resetting your filters or add a new room.</p>
                    {can('rooms.create') && (
                      <button
                        onClick={onAddRoom}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-md"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add Room
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedRooms.map((r) => {
                  const typeName = r.roomType?.name || 'Standard';
                  const isAcActive = r.tempConfig?.active ? r.tempConfig.isAC : r.isAC;
                  const currentRate = r.tempConfig?.active && r.tempConfig.price ? r.tempConfig.price : r.basePrice;

                  return (
                    <tr key={r._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-black text-blue-600 text-sm">
                        Room {r.roomNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-600">Floor {r.floor}</td>
                      <td className="py-3 px-4">
                        <span className="inline-block rounded-lg px-2.5 py-1 text-xs font-extrabold border bg-blue-50 text-blue-700 border-blue-200">
                          {typeName}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-1.5 font-bold text-slate-700">
                          {isAcActive ? (
                            <>
                              <Snowflake className="h-4 w-4 text-sky-500" /> AC
                            </>
                          ) : (
                            <>
                              <Wind className="h-4 w-4 text-slate-400" /> Non-AC
                            </>
                          )}
                          {r.tempConfig?.active && (
                            <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              Temp
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-black text-slate-900">{money(currentRate)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={cx(
                            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold border',
                            r.status === 'available'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : r.status === 'occupied'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : r.status === 'cleaning'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          )}
                        >
                          <span
                            className={cx(
                              'h-1.5 w-1.5 rounded-full',
                              r.status === 'available'
                                ? 'bg-emerald-500'
                                : r.status === 'occupied'
                                ? 'bg-blue-600'
                                : r.status === 'cleaning'
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            )}
                          />
                          {r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : 'Available'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={cx(
                            'inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider',
                            r.housekeepingStatus === 'clean'
                              ? 'text-emerald-700 bg-emerald-50'
                              : r.housekeepingStatus === 'dirty'
                              ? 'text-amber-700 bg-amber-50'
                              : 'text-slate-600 bg-slate-100'
                          )}
                        >
                          {r.housekeepingStatus || 'Clean'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {can('rooms.edit') && (
                            <button
                              onClick={() => onEditRoom(r)}
                              title="Edit Room"
                              className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {can('rooms.configure') && (
                            <button
                              onClick={() => setAcModalRoom(r)}
                              title="AC Issue / Temporary Config"
                              className="grid h-7 w-7 place-items-center rounded-lg border border-sky-200 text-sky-600 hover:bg-sky-50 transition-colors"
                            >
                              <Snowflake className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {can('rooms.delete') && (
                            <button
                              onClick={() => handleDelete(r)}
                              title="Delete Room"
                              className="grid h-7 w-7 place-items-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination Bar */}
        {filteredRooms.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 p-4 text-xs font-semibold text-slate-500">
            <span>
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredRooms.length)} of {filteredRooms.length} rooms
            </span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    className={cx(
                      'grid h-7 w-7 place-items-center rounded-lg text-xs font-bold transition-all',
                      page === i + 1
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 outline-none"
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* AC Issue Modal */}
      {acModalRoom && (
        <AcModal
          room={acModalRoom}
          onClose={() => setAcModalRoom(null)}
          onDone={() => setAcModalRoom(null)}
          inv={inv}
        />
      )}
    </div>
  );
}

function AcModal({ room, onClose, onDone, inv }) {
  const [price, setPrice] = useState('');
  const [reason, setReason] = useState('');
  const [date, setDate] = useState('');
  const m = useMutate((b) => roomApi.acNotWorking(room._id, b), {
    success: 'Room is now sold as Non-AC until the AC is repaired',
    invalidate: inv,
    onSuccess: onDone,
  });
  if (!room) return null;
  const p = price === '' ? Math.max(0, room.basePrice - 500) : price;
  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={`Room ${room.roomNumber}: AC not working`}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={m.isPending}
            onClick={() => m.mutate({ price: +p, reason: reason || undefined, expectedRepairDate: date || undefined })}
          >
            {m.isPending && <Spinner />}Switch to Non-AC
          </button>
        </>
      }
    >
      <p className="mb-3 text-sm text-slate-500">
        This is temporary. The room stays an AC room in the system and existing bookings are not changed.
      </p>
      <div className="space-y-3">
        <Field label="Temporary price per night" hint={`Normal AC price ${money(room.basePrice)}`}>
          <input type="number" className="input" value={p} onChange={(e) => setPrice(e.target.value)} />
        </Field>
        <Field label="What is wrong?">
          <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="AC Not Working" />
        </Field>
        <Field label="Expected repair date">
          <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
