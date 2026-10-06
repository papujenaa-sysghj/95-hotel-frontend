import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, CheckCircle2, Search, Brush, ShieldCheck, AlertCircle } from 'lucide-react';
import { roomApi } from '../../services/room.api';
import { useMutate } from '../../hooks/useMutate';
import { useCan } from '../../store/auth';
import { PageHeader, QueryBoundary, Badge, Skeleton, Spinner, cx } from '../../components/common/ui';

const COLS = [
  { k: 'dirty', l: 'Dirty', icon: AlertCircle, next: [['cleaning', 'Start Cleaning']], tone: 'border-red-200 bg-red-50/20', badge: 'bg-red-50 text-red-700 border-red-200', btn: 'bg-red-600 text-white hover:bg-red-700' },
  { k: 'cleaning', l: 'Cleaning', icon: Brush, next: [['clean', 'Mark Clean']], tone: 'border-amber-200 bg-amber-50/20', badge: 'bg-amber-50 text-amber-700 border-amber-200', btn: 'bg-amber-600 text-white hover:bg-amber-700' },
  { k: 'clean', l: 'Clean', icon: Sparkles, next: [['inspected', 'Inspect'], ['dirty', 'Mark Dirty']], tone: 'border-emerald-200 bg-emerald-50/20', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', btn: 'bg-emerald-600 text-white hover:bg-emerald-700' },
  { k: 'inspected', l: 'Inspected', icon: ShieldCheck, next: [['dirty', 'Mark Dirty']], tone: 'border-sky-200 bg-sky-50/20', badge: 'bg-sky-50 text-sky-700 border-sky-200', btn: 'bg-sky-600 text-white hover:bg-sky-700' },
];

export default function HousekeepingPage() {
  const can = useCan();
  const [activeMobileTab, setActiveMobileTab] = useState('dirty');
  const q = useQuery({ queryKey: ['housekeeping'], queryFn: roomApi.housekeeping, refetchInterval: 30000 });
  const set = useMutate(
    ({ id, status }) => roomApi.setHousekeeping(id, status),
    { success: 'Room housekeeping status updated', invalidate: ['housekeeping', 'rooms', 'calendar', 'dashboard'] }
  );

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        title="Housekeeping"
        subtitle="Rooms move Dirty → Cleaning → Clean → Inspected. Only Clean or Inspected rooms are ready for check-in."
      />

      {/* Mobile Column Tabs (< lg) */}
      <div className="flex rounded-xl bg-slate-100 p-1 lg:hidden overflow-x-auto no-scrollbar">
        {COLS.map((c) => {
          const count = q.data?.board?.[c.k]?.length || 0;
          return (
            <button
              key={c.k}
              onClick={() => setActiveMobileTab(c.k)}
              className={cx(
                'flex-1 min-w-[90px] flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-extrabold transition-all min-h-[44px]',
                activeMobileTab === c.k ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              <span>{c.l}</span>
              <span className="rounded-full bg-slate-200 px-1.5 py-0.2 text-[10px]">{count}</span>
            </button>
          );
        })}
      </div>

      <QueryBoundary
        q={q}
        skeleton={
          <div className="grid gap-4 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-72" />
            ))}
          </div>
        }
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {COLS.map((c) => {
            const rooms = q.data?.board?.[c.k] || [];
            const isHiddenOnMobile = activeMobileTab !== c.k;

            return (
              <section
                key={c.k}
                className={cx(
                  'rounded-2xl border bg-white p-3.5 shadow-2xs transition-all flex flex-col',
                  c.tone,
                  isHiddenOnMobile ? 'hidden lg:flex' : 'flex'
                )}
              >
                <header className="mb-3 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <c.icon className="h-4 w-4 text-slate-600" />
                    <h2 className="font-extrabold text-sm text-slate-900">{c.l}</h2>
                  </div>
                  <span className={cx('rounded-full px-2.5 py-0.5 text-xs font-black border', c.badge)}>
                    {rooms.length}
                  </span>
                </header>

                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {!rooms.length ? (
                    <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-xs font-semibold text-slate-400">
                      No {c.l.toLowerCase()} rooms
                    </div>
                  ) : (
                    rooms.map((r) => (
                      <div
                        key={r._id}
                        className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-slate-900 text-sm">Room {r.roomNumber}</span>
                          <span className="text-xs font-bold text-slate-500">Floor {r.floor}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-600">
                          {r.roomType?.name} · {r.occupancyStatus === 'occupied' ? 'Guest in room' : 'Vacant'}
                          {r.maintenanceStatus !== 'normal' ? ` · ${r.maintenanceStatus?.replace('_', ' ')}` : ''}
                        </p>

                        {can('housekeeping.update') && (
                          <div className="pt-1.5 flex flex-wrap gap-2 border-t border-slate-100">
                            {c.next
                              .filter(([to]) => !(r.occupancyStatus === 'occupied' && !['dirty', 'cleaning'].includes(to)))
                              .map(([to, l]) => (
                                <button
                                  key={to}
                                  disabled={set.isPending}
                                  onClick={() => set.mutate({ id: r._id, status: to })}
                                  className={cx(
                                    'flex-1 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all min-h-[40px]',
                                    to === 'dirty'
                                      ? 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-2xs'
                                  )}
                                >
                                  {set.isPending && <Spinner className="h-3 w-3" />}
                                  <span>{l}</span>
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </QueryBoundary>
    </div>
  );
}
