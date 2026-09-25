import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus } from 'lucide-react';
import api, { unwrap } from '../../services/api';
import { roomApi } from '../../services/room.api';
import { useMutate } from '../../hooks/useMutate';
import { useCan } from '../../store/auth';
import { PageHeader, Card, DataTable, QueryBoundary, Badge, Modal, Field, Spinner, EmptyState } from '../../components/common/ui';
import { fmtDate, humanize } from '../../utils/format';

const ISSUES = ['ac_not_working', 'tv', 'water_leakage', 'electrical', 'bathroom', 'plumbing', 'other'];
const schema = z.object({ room: z.string().min(1, 'Choose a room'), issue: z.string(), description: z.string().optional(), priority: z.string(), expectedRepairDate: z.string().optional(), blocksRoom: z.boolean(), blockFrom: z.string().optional(), blockTo: z.string().optional() })
  .refine((d) => !d.blocksRoom || (d.blockFrom && d.blockTo && d.blockTo > d.blockFrom), { message: 'Choose a valid blocked date range', path: ['blockTo'] });

export default function MaintenancePage() {
  const can = useCan(); const [status, setStatus] = useState(''); const [open, setOpen] = useState(false);
  const q = useQuery({ queryKey: ['maintenance', status], queryFn: () => unwrap(api.get('/maintenance', { params: { status: status || undefined } })) });
  const rooms = useQuery({ queryKey: ['rooms', 'all'], queryFn: () => roomApi.rooms(), enabled: open });
  const inv = ['maintenance', 'rooms', 'calendar', 'dashboard'];
  const upd = useMutate(({ id, body }) => api.patch(`/maintenance/${id}`, body), { success: 'Maintenance updated', invalidate: inv });
  const fixAc = useMutate((id) => roomApi.acRepaired(id), { success: 'AC restored. The room is sold as AC again.', invalidate: inv });
  const f = useForm({ resolver: zodResolver(schema), defaultValues: { room: '', issue: 'ac_not_working', description: '', priority: 'medium', blocksRoom: false } }); const blocks = f.watch('blocksRoom'); const e = f.formState.errors;
  const create = useMutate((b) => unwrap(api.post('/maintenance', b)), { success: (d) => (d.conflictingBookings?.length ? `Reported. ${d.conflictingBookings.length} existing booking(s) overlap the blocked dates.` : 'Maintenance issue reported'), invalidate: inv, onSuccess: () => { setOpen(false); f.reset(); } });
  const clean = (v) => Object.fromEntries(Object.entries(v).filter(([, x]) => x !== '' && x !== undefined));
  const items = q.data?.items || [];
  return <>
    <PageHeader title="Maintenance" subtitle="Report faults, block rooms while they're repaired, and track fixes." actions={can('maintenance.create') && <button className="btn-primary" onClick={() => { f.reset(); setOpen(true); }}><Plus className="h-4 w-4" />Report issue</button>} />
    <Card pad={false}><div className="border-b border-slate-100 p-4"><select className="input w-48" value={status} onChange={(x) => setStatus(x.target.value)} aria-label="Status"><option value="">All statuses</option>{['open', 'in_progress', 'resolved', 'closed'].map((s) => <option key={s} value={s}>{humanize(s)}</option>)}</select></div>
      <QueryBoundary q={q} isEmpty={!items.length} empty={<EmptyState title="No maintenance records" message="Reported faults will appear here." />}>
        <DataTable rows={items} columns={[{ key: 'r', header: 'Room', render: (m) => <b>{m.room?.roomNumber}</b> }, { key: 'i', header: 'Issue', render: (m) => <span>{humanize(m.issue)}<span className="block text-xs text-slate-400">{m.description}</span></span> }, { key: 'p', header: 'Priority', render: (m) => <Badge status={m.priority} /> },
          { key: 'd', header: 'Reported', render: (m) => <span>{fmtDate(m.reportedDate, 'dd MMM')}<span className="block text-xs text-slate-400">{m.reportedBy?.name}</span></span> }, { key: 'e', header: 'Expected fix', render: (m) => fmtDate(m.expectedRepairDate, 'dd MMM') }, { key: 'b', header: 'Blocks room', render: (m) => (m.blocksRoom ? `${fmtDate(m.blockFrom, 'dd MMM')} → ${fmtDate(m.blockTo, 'dd MMM')}` : 'No') }, { key: 's', header: 'Status', render: (m) => <Badge status={m.status} /> },
          { key: 'a', header: '', className: 'text-right', render: (m) => can('maintenance.update') && ['open', 'in_progress'].includes(m.status) && <div className="flex justify-end gap-1.5">
            {m.status === 'open' && <button className="btn-ghost btn-sm" onClick={() => upd.mutate({ id: m._id, body: { status: 'in_progress' } })}>Start</button>}
            {m.issue === 'ac_not_working' && can('rooms.configure') && <button className="btn-primary btn-sm" onClick={() => fixAc.mutate(m.room._id)}>Mark AC repaired</button>}
            <button className="btn-ghost btn-sm" onClick={() => upd.mutate({ id: m._id, body: { status: 'resolved' } })}>Resolve</button></div> }]} /></QueryBoundary></Card>
    <Modal open={open} onClose={() => setOpen(false)} title="Report a maintenance issue" footer={<><button className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button><button className="btn-primary" disabled={create.isPending} onClick={f.handleSubmit((v) => create.mutate(clean(v)))}>{create.isPending && <Spinner />}Report issue</button></>}>
      <div className="grid gap-3 sm:grid-cols-2"><Field label="Room" error={e.room?.message}><select className="input" {...f.register('room')}><option value="">Select…</option>{(rooms.data?.items || []).map((r) => <option key={r._id} value={r._id}>Room {r.roomNumber}</option>)}</select></Field>
        <Field label="Issue"><select className="input" {...f.register('issue')}>{ISSUES.map((i) => <option key={i} value={i}>{humanize(i)}</option>)}</select></Field>
        <Field label="Priority"><select className="input" {...f.register('priority')}>{['low', 'medium', 'high', 'critical'].map((i) => <option key={i} value={i}>{humanize(i)}</option>)}</select></Field>
        <Field label="Expected repair date"><input type="date" className="input" {...f.register('expectedRepairDate')} /></Field>
        <Field label="Description" className="sm:col-span-2"><textarea rows={2} className="input" {...f.register('description')} /></Field>
        <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2"><input type="checkbox" className="h-4 w-4 rounded" {...f.register('blocksRoom')} />Block this room from being booked while it's repaired</label>
        {blocks && <><Field label="Blocked from"><input type="date" className="input" {...f.register('blockFrom')} /></Field><Field label="Blocked until" error={e.blockTo?.message}><input type="date" className="input" {...f.register('blockTo')} /></Field></>}</div></Modal></>;
}
