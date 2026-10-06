import { useMemo, useRef, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Wrench, Wind } from 'lucide-react';
import { STATUS, today, addDays, differenceInCalendarDays, utcDate, fmtDate } from '../../utils/format';
import { Badge, cx } from '../common/ui';

const ROW_H = 54;
const DRAGGABLE = ['hold', 'confirmed', 'checked_in'];

/**
 * Gantt-style timeline. Bars run from the middle of the check-in day to the middle of the check-out day,
 * so back-to-back stays (out on the 23rd, in on the 23rd) sit end-to-end without overlapping.
 * Geometry is pure arithmetic on day indexes; the server remains the authority on availability.
 */
export default function RoomCalendar({ data, from, days, colW, editable, onOpen, onEmptyClick, onMove, onResize }) {
  const t = today();
  const todayIdx = differenceInCalendarDays(t, from);
  const dayList = useMemo(() => Array.from({ length: days }, (_, i) => addDays(from, i)), [from, days]);
  const [hover, setHover] = useState(null); // { room, idx }
  const [resize, setResize] = useState(null); // { id, deltaDays }
  const drag = useRef(null);
  const scroller = useRef(null);
  const resizeRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Measure available timeline width to ensure columns stretch to fill 100%
  useEffect(() => {
    if (!scroller.current) return;
    const updateSize = () => {
      if (scroller.current) {
        const leftW = window.innerWidth >= 640 ? 130 : 110;
        const available = scroller.current.clientWidth - leftW;
        setContainerWidth(Math.max(0, available));
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [days]);

  // If container is wider than days * colW, expand column width to fill available space
  const effectiveColW = useMemo(() => {
    if (containerWidth > 0 && days > 0) {
      const stretched = Math.floor(containerWidth / days);
      return Math.max(colW, stretched);
    }
    return colW;
  }, [containerWidth, days, colW]);

  const width = days * effectiveColW;

  useEffect(() => {
    if (scroller.current && todayIdx > 2 && todayIdx < days) {
      scroller.current.scrollLeft = Math.max(0, (todayIdx - 2) * effectiveColW);
    }
  }, [from, days, effectiveColW]);

  const geom = (b) => {
    const s = differenceInCalendarDays(utcDate(b.checkInDate), from), e = differenceInCalendarDays(utcDate(b.checkOutDate), from);
    let left = s >= 0 ? (s + 0.5) * effectiveColW : 0;
    let right = Math.min((e + 0.5) * effectiveColW, width);
    if (resize?.id === b._id) right = Math.min(Math.max(left + effectiveColW * 0.5, right + resize.deltaDays * effectiveColW), width + effectiveColW);
    return { left, width: Math.max(right - left, 12), clippedL: s < 0, clippedR: e + 0.5 > days };
  };

  const idxFromEvent = (e, el) => Math.floor((e.clientX - el.getBoundingClientRect().left) / effectiveColW);
  // Where the dragged bar's first night would land, given where it was grabbed (continuous, so it feels exact).
  const dropStartIdx = (e, el) => Math.round((e.clientX - el.getBoundingClientRect().left) / effectiveColW - drag.current.grab - 0.5);

  const startResize = (e, b) => {
    e.stopPropagation();
    e.preventDefault();
    const x0 = e.clientX;
    setResize({ id: b._id, deltaDays: 0 });
    const move = (ev) => {
      const d = Math.round((ev.clientX - x0) / effectiveColW);
      resizeRef.current = d;
      setResize({ id: b._id, deltaDays: d });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      const d = resizeRef.current || 0;
      resizeRef.current = null;
      setResize(null);
      if (d !== 0) onResize(b, d);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };


  return <div ref={scroller} className="cal-scroll relative max-h-[calc(100vh-19rem)] min-h-[340px] overflow-auto rounded-xl border-2 border-slate-300/80 bg-white shadow-sm">
    <div style={{ minWidth: `calc(var(--left-w) + ${width}px)`, '--left-w': 'var(--cal-left)' }} className="[--cal-left:110px] sm:[--cal-left:130px]">
      {/* header */}
      <div className="sticky top-0 z-30 flex border-b-2 border-slate-300 bg-slate-100/90 shadow-2xs">
        <div className="sticky left-0 z-40 flex w-[var(--cal-left)] shrink-0 items-center justify-between border-r-2 border-slate-300 bg-slate-100 px-3 py-2.5 text-xs font-black text-slate-800 uppercase tracking-wider backdrop-blur-xs">
          <span>Rooms</span>
          <span className="text-[10px] text-slate-500 font-bold lowercase">({data.rooms?.length || 0})</span>
        </div>
        <div className="flex" style={{ width }}>
          {dayList.map((d, i) => {
            const wk = [0, 6].includes(d.getDay());
            const isCurToday = i === todayIdx;
            return (
              <div
                key={i}
                style={{ width: effectiveColW }}
                className={cx(
                  'shrink-0 border-r border-slate-300/80 py-2 text-center select-none transition-colors',
                  wk && 'bg-slate-200/40 font-semibold',
                  isCurToday && 'bg-blue-100/70 border-x-2 border-blue-500 font-black'
                )}
              >
                <p className={cx('text-[11px] font-bold leading-tight', isCurToday ? 'text-blue-800' : wk ? 'text-slate-600' : 'text-slate-500')}>
                  {format(d, 'EEE')}
                </p>
                <p className={cx('text-sm font-black leading-tight mt-0.5', isCurToday ? 'text-blue-800' : 'text-slate-900')}>
                  {format(d, 'd')}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* rows */}
      <div className="relative divide-y divide-slate-200">
        {/* Today vertical highlight column */}
        {todayIdx >= 0 && todayIdx < days && (
          <>
            <div
              className="pointer-events-none absolute z-10 bg-blue-50/40 border-x-2 border-blue-400/60"
              style={{
                left: `calc(var(--cal-left) + ${todayIdx * effectiveColW}px)`,
                width: effectiveColW,
                top: 0,
                bottom: 0
              }}
            />
            <div
              className="pointer-events-none absolute z-20 w-0.5 bg-blue-600 shadow-sm"
              style={{ left: `calc(var(--cal-left) + ${(todayIdx + 0.5) * effectiveColW}px)`, top: 0, bottom: 0 }}
            >
              <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 rounded-b bg-blue-600 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-md">
                Today
              </span>
            </div>
          </>
        )}

        {data.rooms.map((r) => (
          <div key={r._id} className="flex hover:bg-slate-50/60 transition-colors" style={{ height: ROW_H }}>
            <div className="sticky left-0 z-20 flex w-[var(--cal-left)] shrink-0 flex-col justify-center border-r-2 border-slate-300 bg-white px-3 text-xs shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between gap-1">
                <span className="font-black text-slate-900 text-sm tracking-tight">{r.roomNumber}</span>
                <span className={cx('h-2.5 w-2.5 rounded-full shrink-0 ring-2 ring-white shadow-xs', STATUS[r.status]?.dot || 'bg-slate-400')} title={STATUS[r.status]?.label || r.status} />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-600 font-semibold truncate mt-0.5">
                <span className="truncate">{r.roomType?.name || 'Room'}</span>
                <span className="shrink-0 text-slate-400 font-bold">F{r.floor}</span>
              </div>
            </div>

            <div
              className="relative shrink-0"
              style={{
                width,
                backgroundImage: `linear-gradient(to right, #cbd5e1 1px, transparent 1px)`,
                backgroundSize: `${effectiveColW}px 100%`
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget && editable) onEmptyClick(r, idxFromEvent(e, e.currentTarget));
              }}
              onDragOver={(e) => {
                if (drag.current) {
                  e.preventDefault();
                  const idx = dropStartIdx(e, e.currentTarget);
                  if (hover?.room !== r._id || hover?.idx !== idx) setHover({ room: r._id, idx, nights: drag.current.booking.nights });
                }
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) setHover(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const d = drag.current;
                setHover(null);
                if (!d) return;
                const idx = dropStartIdx(e, e.currentTarget);
                onMove(d.booking, r, addDays(from, idx));
                drag.current = null;
              }}
            >
              {r.isTemporary && <div className="pointer-events-none absolute inset-0 bg-purple-50/50" />}
              {dayList.map((d, i) => [0, 6].includes(d.getDay()) && (
                <div key={i} className="pointer-events-none absolute inset-y-0 bg-slate-100/50" style={{ left: i * effectiveColW, width: effectiveColW }} />
              ))}
              {hover?.room === r._id && (
                <div className="pointer-events-none absolute inset-y-1 rounded-lg border-2 border-dashed border-blue-500 bg-blue-500/10" style={{ left: (hover.idx + 0.5) * effectiveColW, width: hover.nights * effectiveColW }} />
              )}
              {r.blocks.map((m) => {
                const s = differenceInCalendarDays(utcDate(m.blockFrom), from);
                const e = differenceInCalendarDays(utcDate(m.blockTo), from);
                const left = Math.max(s, 0) * effectiveColW;
                const w = (Math.min(e, days) - Math.max(s, 0)) * effectiveColW;
                return (
                  <div
                    key={m._id}
                    title={`Maintenance: ${m.issue.replace('_', ' ')} until ${fmtDate(m.blockTo, 'dd MMM')}`}
                    className="absolute inset-y-1.5 flex items-center gap-1.5 overflow-hidden rounded-lg border-2 border-orange-400 px-2 text-xs font-bold text-orange-900 shadow-xs"
                    style={{ left, width: w, backgroundImage: 'repeating-linear-gradient(135deg,#fed7aa,#fed7aa 6px,#ffedd5 6px,#ffedd5 12px)' }}
                  >
                    <Wrench className="h-3.5 w-3.5 shrink-0" />Maintenance
                  </div>
                );
              })}
              {r.bookings.map((b) => {
                const g = geom(b);
                const can = editable && DRAGGABLE.includes(b.bookingStatus);
                const st = STATUS[b.bookingStatus];
                return (
                  <div
                    key={b._id}
                    draggable={can}
                    title={`${b.bookingNumber} · ${b.guest?.name}\n${fmtDate(b.checkInDate, 'dd MMM')} → ${fmtDate(b.checkOutDate, 'dd MMM')} (${b.nights} nights)\n${st.label}`}
                    onDragStart={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const trueStart = differenceInCalendarDays(utcDate(b.checkInDate), from) + 0.5;
                      drag.current = { booking: b, grab: (e.clientX - rect.left) / effectiveColW + (g.clippedL ? -trueStart : 0) };
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', b._id);
                    }}
                    onDragEnd={() => {
                      drag.current = null;
                      setHover(null);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpen(b);
                    }}
                    className={cx(
                      'group absolute inset-y-1.5 flex select-none items-center overflow-hidden px-2.5 text-xs font-bold text-white shadow-sm transition-all hover:shadow-md border border-black/10 hover:brightness-105',
                      st.bar,
                      can ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
                      b.bookingStatus === 'checked_out' && 'opacity-85',
                      g.clippedL ? 'rounded-l-none' : 'rounded-l-lg',
                      g.clippedR ? 'rounded-r-none' : 'rounded-r-lg',
                      b.paymentStatus !== 'paid' && b.bookingStatus !== 'checked_out' && 'ring-1 ring-inset ring-white/60'
                    )}
                    style={{ left: g.left, width: g.width }}
                  >
                    <span className="truncate">{b.guest?.name}</span>
                    {g.width > 120 && <span className="ml-1.5 shrink-0 font-semibold opacity-85">{b.nights}n</span>}
                    {b.balanceAmount > 0 && g.width > 160 && (
                      <span className="ml-auto shrink-0 rounded bg-white/30 px-1 py-0.2 text-[10px] font-extrabold text-white">₹{b.balanceAmount}</span>
                    )}
                    {can && b.bookingStatus !== 'checked_in' && (
                      <span
                        role="separator"
                        aria-label="Drag to change check-out date"
                        onPointerDown={(e) => startResize(e, b)}
                        draggable={false}
                        onDragStart={(e) => e.preventDefault()}
                        className="absolute inset-y-0 right-0 w-2.5 cursor-ew-resize bg-white/0 hover:bg-white/40"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {!data.rooms.length && <p className="p-10 text-center text-sm text-slate-500">No rooms match these filters.</p>}
      </div>
    </div>
  </div>;
}


