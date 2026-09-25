import { format, parseISO, addDays, differenceInCalendarDays } from 'date-fns';

export const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
// Server stores stay dates as UTC midnight; format them without timezone drift.
export const utcDate = (d) => { const x = new Date(d); return new Date(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate()); };
export const fmtDate = (d, f = 'dd MMM yyyy') => (d ? format(typeof d === 'string' ? utcDate(d) : d, f) : '—');
export const fmtDateTime = (d) => (d ? format(new Date(d), 'dd MMM yyyy, h:mm a') : '—');
export const iso = (d) => format(d, 'yyyy-MM-dd');
export const today = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
export { addDays, differenceInCalendarDays, parseISO, format };

// One source of truth for status colours (matches the brief: green/blue/gray/yellow/orange/red/purple)
export const STATUS = {
  confirmed: { label: 'Confirmed', bar: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  checked_in: { label: 'Checked-in', bar: 'bg-blue-600', chip: 'bg-blue-50 text-blue-700 ring-blue-200', dot: 'bg-blue-600' },
  checked_out: { label: 'Checked-out', bar: 'bg-slate-400', chip: 'bg-slate-100 text-slate-600 ring-slate-200', dot: 'bg-slate-400' },
  hold: { label: 'Hold', bar: 'bg-amber-400', chip: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-400' },
  cancelled: { label: 'Cancelled', bar: 'bg-red-500', chip: 'bg-red-50 text-red-700 ring-red-200', dot: 'bg-red-500' },
  no_show: { label: 'No-show', bar: 'bg-red-400', chip: 'bg-red-50 text-red-700 ring-red-200', dot: 'bg-red-400' },
  available: { label: 'Available', bar: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  occupied: { label: 'Occupied', bar: 'bg-blue-600', chip: 'bg-blue-50 text-blue-700 ring-blue-200', dot: 'bg-blue-600' },
  cleaning: { label: 'Cleaning', bar: 'bg-amber-400', chip: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-400' },
  maintenance: { label: 'Maintenance', bar: 'bg-orange-500', chip: 'bg-orange-50 text-orange-700 ring-orange-200', dot: 'bg-orange-500' },
  out_of_service: { label: 'Out of service', bar: 'bg-red-500', chip: 'bg-red-50 text-red-700 ring-red-200', dot: 'bg-red-500' },
  temp_non_ac: { label: 'Non-AC (temporary)', bar: 'bg-purple-500', chip: 'bg-purple-50 text-purple-700 ring-purple-200', dot: 'bg-purple-500' },
  pending: { label: 'Pending', bar: '', chip: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-400' },
  partial: { label: 'Partial', bar: '', chip: 'bg-orange-50 text-orange-700 ring-orange-200', dot: 'bg-orange-500' },
  paid: { label: 'Paid', bar: '', chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  refunded: { label: 'Refunded', bar: '', chip: 'bg-slate-100 text-slate-600 ring-slate-200', dot: 'bg-slate-400' },
  dirty: { label: 'Dirty', chip: 'bg-red-50 text-red-700 ring-red-200', dot: 'bg-red-500' },
  clean: { label: 'Clean', chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  inspected: { label: 'Inspected', chip: 'bg-sky-50 text-sky-700 ring-sky-200', dot: 'bg-sky-500' },
  open: { label: 'Open', chip: 'bg-red-50 text-red-700 ring-red-200', dot: 'bg-red-500' },
  in_progress: { label: 'In progress', chip: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-400' },
  resolved: { label: 'Resolved', chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  closed: { label: 'Closed', chip: 'bg-slate-100 text-slate-600 ring-slate-200', dot: 'bg-slate-400' },
  low: { label: 'Low', chip: 'bg-slate-100 text-slate-600 ring-slate-200' }, medium: { label: 'Medium', chip: 'bg-amber-50 text-amber-700 ring-amber-200' },
  high: { label: 'High', chip: 'bg-orange-50 text-orange-700 ring-orange-200' }, critical: { label: 'Critical', chip: 'bg-red-50 text-red-700 ring-red-200' },
};
export const humanize = (s = '') => s.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
export const timeAgo = (d) => { const s = Math.floor((Date.now() - new Date(d)) / 1000); if (s < 60) return 'just now'; if (s < 3600) return `${Math.floor(s / 60)} min ago`; if (s < 86400) return `${Math.floor(s / 3600)} h ago`; return fmtDateTime(d); };
