import React, { useMemo } from 'react';
import { AlertTriangle, Wrench, CheckCircle2 } from 'lucide-react';
import { fmtDate } from '../../utils/format';
import { cx } from '../common/ui';

export default function MonthlyExceptionsView({
  calendarData,
  onOpenBooking
}) {
  const rooms = calendarData?.rooms || [];

  const exceptionsList = useMemo(() => {
    const list = [];

    rooms.forEach((room) => {
      // 1. Check Maintenance / Out of service room status
      if (room.status === 'maintenance' || room.status === 'out_of_service') {
        list.push({
          type: 'room_status',
          severity: 'high',
          room,
          title: `Room ${room.roomNumber} is ${room.status.replace('_', ' ').toUpperCase()}`,
          description: room.maintenanceNotes || 'Room requires maintenance clearance before release to inventory.',
          date: new Date()
        });
      }

      // 2. Check blocks
      (room.blocks || []).forEach((blk) => {
        list.push({
          type: 'block',
          severity: blk.priority === 'urgent' ? 'high' : 'medium',
          room,
          title: `Room ${room.roomNumber}: ${blk.issue || 'Maintenance Block'}`,
          description: `Blocked from ${fmtDate(blk.blockFrom, 'd MMM yyyy')} to ${fmtDate(blk.blockTo, 'd MMM yyyy')}`,
          date: blk.blockFrom
        });
      });

      // 3. Temporary Non-AC issues
      if (room.tempConfig?.active && !room.tempConfig?.isAC) {
        list.push({
          type: 'temp_non_ac',
          severity: 'medium',
          room,
          title: `Room ${room.roomNumber}: AC Out of Order`,
          description: room.tempConfig.reason || 'Operating as Non-AC at discounted rate.',
          date: new Date()
        });
      }
    });

    return list;
  }, [rooms]);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-100 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
            </span>
            Operational Exceptions & Blocks
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Maintenance blocks, out of order rooms, and system alerts ({exceptionsList.length} total)
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs overflow-y-auto custom-scrollbar">
        {exceptionsList.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 stroke-1 mb-3" />
            <p className="text-sm font-bold text-slate-800">No active exceptions</p>
            <p className="text-xs text-slate-400 mt-1">All rooms and bookings are running smoothly with no blocks.</p>
          </div>
        ) : (
          <div className="grid gap-3 max-w-4xl">
            {exceptionsList.map((item, idx) => (
              <div
                key={idx}
                className={cx(
                  'flex items-start justify-between rounded-xl border p-4 transition-all shadow-xs',
                  item.severity === 'high' ? 'border-rose-200 bg-rose-50/40' : 'border-amber-200 bg-amber-50/40'
                )}
              >
                <div className="flex items-start gap-3.5">
                  <div className={cx(
                    'grid h-9 w-9 shrink-0 place-items-center rounded-xl font-bold text-white',
                    item.severity === 'high' ? 'bg-rose-600' : 'bg-amber-600'
                  )}>
                    {item.type === 'block' ? <Wrench className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-slate-900">{item.title}</h3>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                        Floor {item.room.floor}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{item.description}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={cx(
                    'text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md',
                    item.severity === 'high' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  )}>
                    {item.severity} Priority
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
