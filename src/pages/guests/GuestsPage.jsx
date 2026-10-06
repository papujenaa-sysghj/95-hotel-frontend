import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import {
  Users,
  DoorOpen,
  CheckCircle2,
  Clock3,
  Plus,
  Download,
  MoreHorizontal,
  Search,
  Calendar as CalendarIcon,
  Phone,
  Mail,
  Eye,
  Pencil,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Camera,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import api, { unwrap, openDocUrl } from '../../services/api';
import { resource } from '../../services/resource.api';
import { useUI } from '../../store/ui';
import { useCan } from '../../store/auth';
import { useMutate } from '../../hooks/useMutate';
import { Modal, Badge, QueryBoundary, DataTable, EmptyState, Field, Spinner, cx } from '../../components/common/ui';
import { fmtDate, money } from '../../utils/format';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().min(7, 'Enter a valid phone number'),
  email: z.string().email('Enter a valid email').or(z.literal('')).optional(),
  address: z.string().optional(),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  idDocumentUrl: z.string().optional(),
  nationality: z.string().optional(),
});

function GuestFormModal({ guest, onClose }) {
  const [formData, setFormData] = useState({
    name: guest?.name || '',
    phone: guest?.phone || '',
    email: guest?.email || '',
    address: guest?.address || '',
    idType: guest?.idType || 'Aadhaar',
    idNumber: guest?.idNumber || '',
    idDocumentUrl: guest?.idDocumentUrl || '',
    nationality: guest?.nationality || 'Indian',
  });
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [errors, setErrors] = useState({});

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = new FormData();
    data.append('file', file);
    setUploadingDoc(true);
    try {
      const res = await unwrap(api.post('/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } }));
      setFormData((prev) => ({ ...prev, idDocumentUrl: res.url }));
    } catch {
      setErrors((prev) => ({ ...prev, idDocumentUrl: 'Failed to upload document file' }));
    } finally {
      setUploadingDoc(false);
    }
  };

  const saveMutation = useMutate(
    (payload) =>
      guest?._id
        ? resource('guests').update(guest._id, payload)
        : resource('guests').create(payload),
    {
      success: guest?._id ? 'Guest updated successfully' : 'Guest added successfully',
      invalidate: ['guests'],
      onSuccess: () => onClose(),
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const res = schema.safeParse(formData);
    if (!res.success) {
      const errs = {};
      res.error.issues.forEach((issue) => {
        errs[issue.path[0]] = issue.message;
      });
      setErrors(errs);
      return;
    }
    saveMutation.mutate(res.data);
  };

  return (
    <Modal
      open={!!guest}
      onClose={onClose}
      title={guest?._id ? `Edit Guest: ${guest.name}` : 'Add New Guest'}
      size="md"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={saveMutation.isPending || uploadingDoc}
            onClick={handleSubmit}
            type="button"
          >
            {saveMutation.isPending && <Spinner />}
            {guest?._id ? 'Update Guest' : 'Save Guest'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Guest Name *" error={errors.name}>
            <input
              type="text"
              className="input"
              placeholder="e.g. Rahul Sharma"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </Field>
          <Field label="Phone Number *" error={errors.phone}>
            <input
              type="tel"
              className="input"
              placeholder="e.g. 9876543210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Email Address" error={errors.email}>
            <input
              type="email"
              className="input"
              placeholder="e.g. rahul@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </Field>
          <Field label="Nationality" error={errors.nationality}>
            <input
              type="text"
              className="input"
              placeholder="e.g. Indian"
              value={formData.nationality}
              onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="ID Document Type" error={errors.idType}>
            <select
              className="input"
              value={formData.idType}
              onChange={(e) => setFormData({ ...formData, idType: e.target.value })}
            >
              <option value="Aadhaar">Aadhaar Card</option>
              <option value="Passport">Passport</option>
              <option value="Driving License">Driving License</option>
              <option value="Voter ID">Voter ID</option>
              <option value="PAN">PAN Card</option>
              <option value="Other">Other</option>
            </select>
          </Field>
          <Field label="ID Number" error={errors.idNumber}>
            <input
              type="text"
              className="input"
              placeholder="Document ID number"
              value={formData.idNumber}
              onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
            />
          </Field>
        </div>

        <Field label="Upload Aadhaar / ID Card Document" error={errors.idDocumentUrl}>
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-3">
            {formData.idDocumentUrl ? (
              <div className="flex items-center justify-between w-full gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-900">
                <span className="flex items-center gap-2 truncate">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  Aadhaar / ID Card Document Attached
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    className="rounded-md bg-white px-2 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-300 hover:bg-emerald-100"
                    onClick={() => openDocUrl(formData.idDocumentUrl)}
                  >
                    View
                  </button>
                  <button
                    type="button"
                    className="rounded-md bg-white px-2 py-1 text-[11px] font-bold text-red-600 border border-red-200 hover:bg-red-50"
                    onClick={() => setFormData((prev) => ({ ...prev, idDocumentUrl: '' }))}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-blue-600" />
                  <span className="text-xs text-slate-600 font-medium">Upload Aadhaar scan or photo (Image or PDF)</span>
                </div>
                <label className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700 cursor-pointer shadow-2xs transition">
                  {uploadingDoc ? <Spinner /> : <Camera className="h-3.5 w-3.5" />}
                  {uploadingDoc ? 'Uploading...' : 'Choose File'}
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} disabled={uploadingDoc} />
                </label>
              </div>
            )}
          </div>
        </Field>

        <Field label="Address" error={errors.address}>
          <textarea
            className="input min-h-[70px]"
            placeholder="Full residential address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </Field>
      </form>
    </Modal>
  );
}

export default function GuestsPage() {
  const can = useCan();
  const openBooking = useUI((s) => s.openBooking);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [staysFilter, setStaysFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const guestsQuery = useQuery({
    queryKey: ['guests', { q: searchQuery }],
    queryFn: () => resource('guests').list({ limit: 100, q: searchQuery }),
  });

  const histQuery = useQuery({
    queryKey: ['guest-history', selectedGuest?._id],
    enabled: !!selectedGuest,
    queryFn: () => unwrap(api.get(`/guests/${selectedGuest._id}/bookings`)),
  });

  const items = guestsQuery.data?.items || [];

  const defaultGuestRows = [
    { _id: 'g1', guestId: 'GST-00011', name: 'PRASANNAJIT JENA', phone: '7790052789', email: 'prasannajitjena00@gmail.com', totalStays: 0, totalSpent: 0, lastVisit: null, status: 'New Guest', avatarBg: 'bg-purple-100 text-purple-700' },
    { _id: 'g2', guestId: 'GST-00010', name: 'PRASANNAJIT JENA', phone: '9876543210', email: 'prasannajitjena00@gmail.com', totalStays: 0, totalSpent: 0, lastVisit: null, status: 'New Guest', avatarBg: 'bg-rose-100 text-rose-700' },
    { _id: 'g3', guestId: 'GST-00009', name: 'PRASANNAJIT JENA', phone: '07790052789', email: 'prasannajitjena00@gmail.com', totalStays: 0, totalSpent: 0, lastVisit: null, status: 'New Guest', avatarBg: 'bg-teal-100 text-teal-700' },
    { _id: 'g4', guestId: 'GST-00008', name: 'Neha Gupta', phone: '9000000008', email: 'neha@demo.test', totalStays: 0, totalSpent: 0, lastVisit: null, status: 'New Guest', avatarBg: 'bg-purple-100 text-purple-700' },
    { _id: 'g5', guestId: 'GST-00007', name: 'Arjun Mehta', phone: '9000000007', email: 'arjun@demo.test', totalStays: 0, totalSpent: 0, lastVisit: null, status: 'New Guest', avatarBg: 'bg-amber-100 text-amber-800' },
    { _id: 'g6', guestId: 'GST-00006', name: 'Sneha Rao', phone: '9000000006', email: 'sneha@demo.test', totalStays: 0, totalSpent: 0, lastVisit: null, status: 'New Guest', avatarBg: 'bg-rose-100 text-rose-700' },
    { _id: 'g7', guestId: 'GST-00005', name: 'Amit Patel', phone: '9000000005', email: 'amit@demo.test', totalStays: 0, totalSpent: 0, lastVisit: null, status: 'New Guest', avatarBg: 'bg-emerald-100 text-emerald-800' },
    { _id: 'g8', guestId: 'GST-00004', name: 'Kavita Nair', phone: '9000000004', email: 'kavita@demo.test', totalStays: 1, totalSpent: 4480, lastVisit: '2026-09-20', status: 'Past Guest', avatarBg: 'bg-purple-100 text-purple-700' },
    { _id: 'g9', guestId: 'GST-00003', name: 'Vikram Singh', phone: '9000000003', email: 'vikram@demo.test', totalStays: 0, totalSpent: 0, lastVisit: null, status: 'New Guest', avatarBg: 'bg-blue-100 text-blue-700' },
    { _id: 'g10', guestId: 'GST-00002', name: 'Rahul Sharma', phone: '9000000001', email: 'rahul@demo.test', totalStays: 0, totalSpent: 0, lastVisit: null, status: 'New Guest', avatarBg: 'bg-amber-100 text-amber-800' },
  ];

  const rawRows = items.length ? items : defaultGuestRows;

  // Filter rows based on tabs & dropdowns
  const filteredRows = rawRows.filter((g) => {
    if (activeTab === 'in_house' && (g.totalStays === 0 && !g.lastVisit)) return false;
    if (activeTab === 'checked_out' && (g.totalStays === 0 || !g.lastVisit)) return false;
    if (activeTab === 'pending' && g.totalStays > 0) return false;

    if (statusFilter === 'new' && g.status === 'Past Guest') return false;
    if (statusFilter === 'past' && g.status !== 'Past Guest') return false;

    if (staysFilter === '0' && (g.totalStays || 0) > 0) return false;
    if (staysFilter === '1+' && (g.totalStays || 0) === 0) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = g.name?.toLowerCase().includes(q);
      const matchPhone = g.phone?.includes(q);
      const matchEmail = g.email?.toLowerCase().includes(q);
      const matchId = g.guestId?.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchEmail && !matchId) return false;
    }

    return true;
  });

  const totalFiltered = filteredRows.length;
  const totalPages = Math.ceil(totalFiltered / pageSize) || 1;
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const paginatedRows = filteredRows.slice(startIndex, startIndex + pageSize);

  const totalGuestsCount = rawRows.length;
  const inHouseCount = rawRows.filter((g) => g.totalStays > 0 || g.lastVisit).length;
  const checkedOutCount = rawRows.filter((g) => (g.totalStays || 0) > 0).length;
  const pendingCount = rawRows.filter((g) => (g.totalStays || 0) === 0).length;

  const handleExport = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Guest ID,Name,Phone,Email,Total Stays,Total Spent,Status']
        .concat(
          filteredRows.map(
            (r) =>
              `"${r.guestId || ''}","${r.name || ''}","${r.phone || ''}","${r.email || ''}",${r.totalStays || 0},${r.totalSpent || 0},"${r.status || 'New Guest'}"`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `guests_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Guests</h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Manage your guests, their stays and booking history.
            </p>
          </div>
        </div>

        {can('guests.create') && (
          <button
            onClick={() => setEditModal({})}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all"
          >
            <Plus className="h-4 w-4" /> Add guest
          </button>
        )}
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Guests</p>
            <p className="text-2xl font-black text-slate-900 leading-none my-0.5">{totalGuestsCount}</p>
            <p className="text-[10px] font-semibold text-slate-400">All registered guests</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
            <DoorOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Currently In-house</p>
            <p className="text-2xl font-black text-slate-900 leading-none my-0.5">{inHouseCount}</p>
            <p className="text-[10px] font-semibold text-slate-400">Guests staying now</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-purple-50 text-purple-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Checked Out</p>
            <p className="text-2xl font-black text-slate-900 leading-none my-0.5">{checkedOutCount}</p>
            <p className="text-[10px] font-semibold text-slate-400">Completed stays</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600">
            <Clock3 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Check-in</p>
            <p className="text-2xl font-black text-slate-900 leading-none my-0.5">{pendingCount}</p>
            <p className="text-[10px] font-semibold text-slate-400">New arrivals</p>
          </div>
        </div>
      </div>

      {/* Tabs & Export Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-6 border-b border-slate-200 text-xs font-bold">
          {[
            { id: 'all', label: 'All Guests' },
            { id: 'in_house', label: 'In-house' },
            { id: 'checked_out', label: 'Checked Out' },
            { id: 'pending', label: 'Pending Check-in' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
              className={cx(
                'pb-2.5 transition-all cursor-pointer',
                activeTab === tab.id
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-2xs">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs placeholder:text-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
            placeholder="Search by name, phone, email or guest ID..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">All Status</option>
            <option value="new">New Guest</option>
            <option value="past">Past Guest</option>
          </select>

          <select
            value={staysFilter}
            onChange={(e) => { setStaysFilter(e.target.value); setCurrentPage(1); }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">All Stays</option>
            <option value="0">0 Stays</option>
            <option value="1+">1+ Stays</option>
          </select>
        </div>
      </div>

      {/* Mobile Guest Cards View (< md) */}
      <div className="space-y-3 md:hidden">
        {paginatedRows.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-400 font-medium">
            No guests found matching the selected filters.
          </div>
        ) : (
          paginatedRows.map((r) => {
            const initials = r.name
              ? r.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
              : 'G';

            const avatarStyle = r.avatarBg || 'bg-blue-100 text-blue-700';

            return (
              <div
                key={r._id}
                onClick={() => setSelectedGuest(r)}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3 active:bg-slate-50 transition cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-black', avatarStyle)}>
                      {initials}
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 leading-tight">{r.name}</h4>
                      <p className="text-[11px] font-bold text-slate-400 mt-0.5">Guest ID: {r.guestId || 'GST-00001'}</p>
                    </div>
                  </div>
                  <span
                    className={cx(
                      'inline-block rounded-lg px-2.5 py-0.5 text-[10px] font-extrabold border',
                      r.status === 'Past Guest'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    )}
                  >
                    {r.status || 'New Guest'}
                  </span>
                </div>

                {/* Contact with tel and mailto links */}
                <div className="space-y-1.5 pt-1 text-xs">
                  {r.phone && (
                    <a
                      href={`tel:${r.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 font-bold text-blue-600 hover:underline min-h-[36px]"
                    >
                      <Phone className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      <span>{r.phone}</span>
                    </a>
                  )}
                  {r.email && (
                    <a
                      href={`mailto:${r.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 text-slate-600 hover:text-blue-600 hover:underline min-h-[36px]"
                    >
                      <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{r.email}</span>
                    </a>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Stays: </span>
                    <b className="text-slate-800">{r.totalStays ?? 0}</b>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Spent: </span>
                    <b className="text-slate-900">{money(r.totalSpent || 0)}</b>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setSelectedGuest(r)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 min-h-[40px]"
                  >
                    <Eye className="h-3.5 w-3.5" /> View
                  </button>
                  {can('guests.edit') && (
                    <button
                      onClick={() => setEditModal(r)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 min-h-[40px]"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Main Desktop Guests Table (hidden on mobile) */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">Guest</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Stays</th>
                <th className="py-3 px-4">Total Spent</th>
                <th className="py-3 px-4">Last Visit</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No guests found matching the selected filters.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((r) => {
                  const initials = r.name
                    ? r.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                    : 'G';

                  const avatarStyle = r.avatarBg || 'bg-blue-100 text-blue-700';

                  return (
                    <tr
                      key={r._id}
                      onClick={() => setSelectedGuest(r)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-black', avatarStyle)}>
                            {initials}
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400">{r.guestId || 'GST-00001'}</p>
                            <h4 className="text-xs font-extrabold text-slate-900 leading-tight">{r.name}</h4>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 space-y-0.5">
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                          <Phone className="h-3 w-3 text-blue-600" /> {r.phone}
                        </p>
                        <p className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Mail className="h-3 w-3 text-blue-600" /> {r.email || '—'}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-700">{r.totalStays ?? 0}</td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900">{money(r.totalSpent || 0)}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-500">
                        {r.lastVisit ? fmtDate(r.lastVisit, 'dd MMM yyyy') : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={cx(
                            'inline-block rounded-lg px-2.5 py-1 text-[11px] font-extrabold border',
                            r.status === 'Past Guest'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          )}
                        >
                          {r.status || 'New Guest'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedGuest(r)}
                            title="View History"
                            className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {can('guests.edit') && (
                            <button
                              onClick={() => setEditModal(r)}
                              title="Edit Guest"
                              className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
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
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 p-4 text-xs font-semibold text-slate-500">
          <span>
            Showing {totalFiltered > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + pageSize, totalFiltered)} of {totalFiltered} guests
          </span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                disabled={validPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cx(
                    'grid h-7 w-7 place-items-center rounded-lg font-extrabold text-xs transition-colors',
                    validPage === page
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  )}
                >
                  {page}
                </button>
              ))}
              <button
                disabled={validPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="grid h-7 w-7 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 outline-none"
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Add / Edit Guest Form Modal */}
      {!!editModal && (
        <GuestFormModal
          guest={editModal}
          onClose={() => setEditModal(null)}
        />
      )}

      {/* Guest History & Document Modal */}
      <Modal open={!!selectedGuest} onClose={() => setSelectedGuest(null)} size="lg" title={selectedGuest ? `${selectedGuest.name} · Profile & Stays` : ''}>
        {selectedGuest && (
          <div className="space-y-4">
            {/* Aadhaar Card / ID Document Card */}
            {selectedGuest.idDocumentUrl ? (
              <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3.5 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-900">{selectedGuest.idType || 'Aadhaar Card'} Document Attached</p>
                    <p className="text-[11px] font-semibold text-emerald-700">{selectedGuest.idNumber ? `ID Number: ${selectedGuest.idNumber}` : 'Official Identity Document'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openDocUrl(selectedGuest.idDocumentUrl)}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-2xs transition"
                >
                  <Eye className="h-3.5 w-3.5" /> View Aadhaar / ID Card
                </button>
              </div>
            ) : selectedGuest.idNumber ? (
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3 px-4 text-xs font-semibold text-slate-700">
                <span><b>{selectedGuest.idType || 'ID Proof'}:</b> {selectedGuest.idNumber}</span>
                <span className="text-[11px] text-slate-400 italic">No document file uploaded</span>
              </div>
            ) : null}

            <QueryBoundary q={histQuery} isEmpty={!histQuery.data?.bookings?.length} empty={<EmptyState title="No bookings found for this guest" />}>
              <DataTable
                rows={histQuery.data?.bookings || []}
                onRowClick={(b) => {
                  setSelectedGuest(null);
                  openBooking(b._id);
                }}
                columns={[
                  { key: 'n', header: 'Booking', render: (b) => <b>{b.bookingNumber}</b> },
                  { key: 'r', header: 'Room', render: (b) => b.room?.roomNumber },
                  { key: 'd', header: 'Stay', render: (b) => `${fmtDate(b.checkInDate, 'dd MMM yyyy')} → ${fmtDate(b.checkOutDate, 'dd MMM')}` },
                  { key: 's', header: 'Status', render: (b) => <Badge status={b.bookingStatus} /> },
                  { key: 't', header: 'Total', render: (b) => money(b.totalAmount) },
                ]}
              />
            </QueryBoundary>
          </div>
        )}
      </Modal>
    </div>
  );
}
