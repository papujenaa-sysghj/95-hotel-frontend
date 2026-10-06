import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BedDouble, Building, DollarSign, Snowflake, Wind, Check, AlertCircle, X, Sparkles, Layers } from 'lucide-react';
import { roomApi } from '../../services/room.api';
import { useMutate } from '../../hooks/useMutate';
import { Spinner } from '../common/ui';

export default function RoomModal({ open, onClose, roomToEdit = null, defaultFloor = 1 }) {
  const isEditing = Boolean(roomToEdit);

  // Fetch Rooms, Room Types and Amenities from real MongoDB backend
  const roomsQuery = useQuery({ queryKey: ['rooms'], queryFn: () => roomApi.list({ limit: 500 }) });
  const typesQuery = useQuery({ queryKey: ['room-types'], queryFn: roomApi.types });
  const amenQuery = useQuery({ queryKey: ['amenities'], queryFn: roomApi.amenities });

  const existingRooms = roomsQuery.data?.items || roomsQuery.data?.rooms || roomsQuery.data || [];
  const roomTypes = typesQuery.data?.items || typesQuery.data || [];
  const amenitiesList = amenQuery.data?.items || amenQuery.data || [];

  // Form State
  const [roomNumber, setRoomNumber] = useState('');
  const [floor, setFloor] = useState(defaultFloor || 1);
  const [roomType, setRoomType] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [isAC, setIsAC] = useState(true);
  const [bedType, setBedType] = useState('King Bed');
  const [standardCapacity, setStandardCapacity] = useState(2);
  const [adultsCapacity, setAdultsCapacity] = useState(2);
  const [childrenCapacity, setChildrenCapacity] = useState(1);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Check if current room number is already taken
  const duplicateRoom = useMemo(() => {
    if (!roomNumber.trim()) return null;
    const trimmed = roomNumber.trim().toLowerCase();
    return existingRooms.find((r) => {
      if (isEditing && r._id === roomToEdit._id) return false;
      return String(r.roomNumber).trim().toLowerCase() === trimmed;
    });
  }, [roomNumber, existingRooms, isEditing, roomToEdit]);

  // Pre-fill on edit or open
  useEffect(() => {
    if (open) {
      setErrorMsg('');
      if (roomToEdit) {
        setRoomNumber(roomToEdit.roomNumber || '');
        setFloor(roomToEdit.floor ?? 1);
        setRoomType(roomToEdit.roomType?._id || roomToEdit.roomType || '');
        setBasePrice(roomToEdit.basePrice ?? '');
        setIsAC(roomToEdit.isAC ?? true);
        setBedType(roomToEdit.bedType || 'King Bed');
        setStandardCapacity(roomToEdit.standardCapacity ?? 2);
        setAdultsCapacity(roomToEdit.adultsCapacity ?? 2);
        setChildrenCapacity(roomToEdit.childrenCapacity ?? 1);
        setSelectedAmenities((roomToEdit.amenities || []).map((a) => (typeof a === 'string' ? a : a._id)));
        setDescription(roomToEdit.description || '');
        setIsActive(roomToEdit.isActive ?? true);
      } else {
        setRoomNumber('');
        setFloor(defaultFloor || 1);
        const defaultType = roomTypes[0]?._id || '';
        setRoomType(defaultType);
        setBasePrice(roomTypes[0]?.basePrice || 2500);
        setIsAC(true);
        setBedType('King Bed');
        setStandardCapacity(2);
        setAdultsCapacity(2);
        setChildrenCapacity(1);
        setSelectedAmenities([]);
        setDescription('');
        setIsActive(true);
      }
    }
  }, [open, roomToEdit, defaultFloor, roomTypes.length]);

  // When room type changes, auto-fill base price if empty or changing type in add mode
  const handleTypeChange = (typeId) => {
    setRoomType(typeId);
    const selected = roomTypes.find((t) => t._id === typeId);
    if (selected) {
      if (!isEditing || !basePrice) {
        setBasePrice(selected.basePrice || 2500);
      }
      if (selected.acAvailable !== undefined) {
        setIsAC(selected.acAvailable);
      }
    }
  };

  const createMut = useMutate((data) => roomApi.create(data), {
    success: 'Room added successfully!',
    invalidate: ['rooms', 'calendar', 'monthly-calendar', 'dashboard', 'housekeeping', 'maintenance'],
    onSuccess: () => onClose(),
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create room.';
      setErrorMsg(msg.includes('unique') || msg.includes('duplicate') ? `Room ${roomNumber} already exists. Please choose a different room number.` : msg);
    },
  });

  const updateMut = useMutate((data) => roomApi.update(roomToEdit._id, data), {
    success: 'Room updated successfully!',
    invalidate: ['rooms', 'calendar', 'monthly-calendar', 'dashboard', 'housekeeping', 'maintenance'],
    onSuccess: () => onClose(),
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update room.';
      setErrorMsg(msg);
    },
  });

  const isPending = createMut.isPending || updateMut.isPending;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!roomNumber.trim()) {
      setErrorMsg('Please enter a room number.');
      return;
    }

    if (duplicateRoom) {
      setErrorMsg(`Room "${duplicateRoom.roomNumber}" already exists on Floor ${duplicateRoom.floor}. Please choose a unique room number.`);
      return;
    }

    if (!roomType) {
      setErrorMsg('Please select a room type.');
      return;
    }

    const payload = {
      roomNumber: roomNumber.trim(),
      floor: parseInt(floor, 10) || 1,
      roomType,
      basePrice: parseFloat(basePrice) || 0,
      isAC,
      bedType,
      standardCapacity: parseInt(standardCapacity, 10) || 2,
      adultsCapacity: parseInt(adultsCapacity, 10) || 2,
      childrenCapacity: parseInt(childrenCapacity, 10) || 0,
      amenities: selectedAmenities,
      description: description.trim(),
      isActive,
    };

    if (isEditing) {
      updateMut.mutate(payload);
    } else {
      createMut.mutate(payload);
    }
  };

  const toggleAmenity = (amenityId) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenityId) ? prev.filter((id) => id !== amenityId) : [...prev, amenityId]
    );
  };

  if (!open) return null;


  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center overflow-y-auto bg-slate-900/60 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-2xl max-h-[100dvh] sm:max-h-[90vh] h-[100dvh] sm:h-auto overflow-hidden rounded-t-2xl sm:rounded-3xl bg-white shadow-2xl border border-slate-100 my-0 sm:my-8">
        
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-900 to-blue-950 px-4 sm:px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-600/30 border border-blue-400/30 text-blue-300">
              <BedDouble className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                {isEditing ? `Edit Room ${roomToEdit.roomNumber}` : 'Add New Room / Floor'}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-300 font-medium">
                {isEditing ? 'Update room configuration and pricing' : 'Create a room and assign it to a floor'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
          {errorMsg && (
            <div className="flex items-center gap-2.5 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Room Number & Floor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Room Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. 101, 204, 301, 801"
                  value={roomNumber}
                  onChange={(e) => {
                    setRoomNumber(e.target.value);
                    setErrorMsg('');
                  }}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm font-bold placeholder:text-slate-400 outline-none transition-all ${
                    duplicateRoom
                      ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-2 focus:ring-rose-500/20'
                      : 'border-slate-200 bg-slate-50 text-slate-800 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20'
                  }`}
                />
              </div>
              {duplicateRoom ? (
                <p className="text-[11px] text-rose-600 font-bold mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  Room {duplicateRoom.roomNumber} already exists (Floor {duplicateRoom.floor}). Try a new number like {floor}01 or {floor}11.
                </p>
              ) : (
                <p className="text-[10px] text-slate-400 font-medium mt-1">Unique identification number for guest lookup</p>
              )}
            </div>


            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Floor Number <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="0"
                    max="99"
                    required
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                {/* Quick floor buttons */}
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFloor(f)}
                      className={`h-10 w-9 rounded-xl text-xs font-bold transition-all border ${
                        parseInt(floor, 10) === f
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      F{f}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Groups rooms together in floor filters</p>
            </div>
          </div>

          {/* Room Type & Base Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Room Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={roomType}
                onChange={(e) => handleTypeChange(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
              >
                <option value="" disabled>Select Room Type</option>
                {roomTypes.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} (Base: ₹{t.basePrice})
                  </option>
                ))}
              </select>
              {roomTypes.length === 0 && (
                <p className="text-[10px] text-amber-600 font-medium mt-1">No room types found. Please create one in Room Types tab.</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Base Price per Night (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  required
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3.5 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                  placeholder="2500"
                />
              </div>
            </div>
          </div>

          {/* AC vs Non-AC Toggle & Bed Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Climate Configuration
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsAC(true)}
                  className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-extrabold border transition-all ${
                    isAC
                      ? 'bg-sky-50 text-sky-700 border-sky-300 ring-2 ring-sky-500/20 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Snowflake className="h-4 w-4 text-sky-500" /> AC Room
                </button>
                <button
                  type="button"
                  onClick={() => setIsAC(false)}
                  className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-extrabold border transition-all ${
                    !isAC
                      ? 'bg-slate-200 text-slate-800 border-slate-400 ring-2 ring-slate-500/20 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Wind className="h-4 w-4 text-slate-500" /> Non-AC
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Bed Type
              </label>
              <select
                value={bedType}
                onChange={(e) => setBedType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
              >
                <option value="King Bed">King Bed</option>
                <option value="Queen Bed">Queen Bed</option>
                <option value="Twin Beds">Twin Beds</option>
                <option value="Single Bed">Single Bed</option>
                <option value="Double Bed">Double Bed</option>
              </select>
            </div>
          </div>

          {/* Occupancy Limits */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Occupancy Capacities
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Standard</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={standardCapacity}
                  onChange={(e) => setStandardCapacity(e.target.value)}
                  className="w-full bg-transparent text-sm font-black text-slate-800 outline-none mt-1"
                />
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Max Adults</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={adultsCapacity}
                  onChange={(e) => setAdultsCapacity(e.target.value)}
                  className="w-full bg-transparent text-sm font-black text-slate-800 outline-none mt-1"
                />
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Max Children</span>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={childrenCapacity}
                  onChange={(e) => setChildrenCapacity(e.target.value)}
                  className="w-full bg-transparent text-sm font-black text-slate-800 outline-none mt-1"
                />
              </div>
            </div>
          </div>

          {/* Amenities Selector */}
          {amenitiesList.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Amenities
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1 border border-slate-100 rounded-xl">
                {amenitiesList.map((amenity) => {
                  const selected = selectedAmenities.includes(amenity._id);
                  return (
                    <button
                      key={amenity._id}
                      type="button"
                      onClick={() => toggleAmenity(amenity._id)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all border ${
                        selected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {selected && <Check className="h-3 w-3" />}
                      {amenity.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description & Active Status */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Description & Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Garden view, newly renovated, near the elevator..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer pt-1 min-h-[44px]">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs font-bold text-slate-700">Room is Active & Available for Booking</span>
            </label>
          </div>
          </div>

          {/* Modal Sticky Footer */}
          <div className="shrink-0 flex items-center justify-end gap-3 border-t border-slate-100 p-4 bg-slate-50/80 pb-safe">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors min-h-[44px] flex items-center justify-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-extrabold text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all min-h-[44px]"
            >
              {isPending && <Spinner className="h-3.5 w-3.5" />}
              {isEditing ? 'Save Changes' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
