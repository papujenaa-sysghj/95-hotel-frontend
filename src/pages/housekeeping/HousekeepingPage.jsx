import { useQuery } from '@tanstack/react-query';
import { roomApi } from '../../services/room.api';
import { useMutate } from '../../hooks/useMutate';
import { useCan } from '../../store/auth';
import { PageHeader, QueryBoundary, Badge, Skeleton, cx } from '../../components/common/ui';

const COLS = [{ k: 'dirty', l: 'Dirty', next: [['cleaning', 'Start cleaning']], tone: 'border-red-200' }, { k: 'cleaning', l: 'Cleaning', next: [['clean', 'Mark clean']], tone: 'border-amber-200' }, { k: 'clean', l: 'Clean', next: [['inspected', 'Inspect'], ['dirty', 'Mark dirty']], tone: 'border-emerald-200' }, { k: 'inspected', l: 'Inspected', next: [['dirty', 'Mark dirty']], tone: 'border-sky-200' }];
export default function HousekeepingPage() {
  const can = useCan(); const q = useQuery({ queryKey: ['housekeeping'], queryFn: roomApi.housekeeping, refetchInterval: 30000 });
  const set = useMutate(({ id, status }) => roomApi.setHousekeeping(id, status), { success: 'Room status updated', invalidate: ['housekeeping', 'rooms', 'calendar', 'dashboard'] });
  return <>
    <PageHeader title="Housekeeping" subtitle="Rooms move Dirty → Cleaning → Clean → Inspected. Only Clean or Inspected rooms are ready for check-in." />
    <QueryBoundary q={q} skeleton={<div className="grid gap-4 lg:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-72" />)}</div>}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{COLS.map((c) => { const rooms = q.data?.board[c.k] || [];
        return <section key={c.k} className={cx('rounded-2xl border bg-white p-3 shadow-card', c.tone)}><header className="mb-3 flex items-center justify-between px-1"><h2 className="font-bold">{c.l}</h2><Badge status={c.k}>{rooms.length}</Badge></header>
          <div className="space-y-2">{!rooms.length && <p className="px-2 py-6 text-center text-sm text-slate-400">No rooms</p>}{rooms.map((r) => <div key={r._id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3"><div className="flex items-center justify-between"><b>Room {r.roomNumber}</b><span className="text-xs text-slate-500">Floor {r.floor}</span></div>
            <p className="mt-0.5 text-xs text-slate-500">{r.roomType?.name} · {r.occupancyStatus === 'occupied' ? 'Guest in room' : 'Vacant'}{r.maintenanceStatus !== 'normal' ? ` · ${r.maintenanceStatus.replace('_', ' ')}` : ''}</p>
            {can('housekeeping.update') && <div className="mt-2 flex flex-wrap gap-1.5">{c.next.filter(([to]) => !(r.occupancyStatus === 'occupied' && !['dirty', 'cleaning'].includes(to))).map(([to, l]) => <button key={to} className="btn-ghost btn-sm" disabled={set.isPending} onClick={() => set.mutate({ id: r._id, status: to })}>{l}</button>)}</div>}</div>)}</div></section>; })}</div></QueryBoundary></>;
}
