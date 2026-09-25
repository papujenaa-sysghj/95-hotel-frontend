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
  const t = today(); const todayIdx = differenceInCalendarDays(t, from);
  const dayList = useMemo(() => Array.from({ length: days }, (_, i) => addDays(from, i)), [from, days]);
  const [hover, setHover] = useState(null); // { room, idx }
  const [resize, setResize] = useState(null); // { id, deltaDays }
  const drag = useRef(null); const scroller = useRef(null); const resizeRef = useRef(null);
  const width = days * colW;

  useEffect(() => { if (scroller.current && todayIdx > 2 && todayIdx < days) scroller.current.scrollLeft = Math.max(0, (todayIdx - 2) * colW); }, [from, days]); // eslint-disable-line

  const geom = (b) => {
    const s = differenceInCalendarDays(utcDate(b.checkInDate), from), e = differenceInCalendarDays(utcDate(b.checkOutDate), from);
    let left = s >= 0 ? (s + 0.5) * colW : 0; let right = Math.min((e + 0.5) * colW, width);
    if (resize?.id === b._id) right = Math.min(Math.max(left + colW * 0.5, right + resize.deltaDays * colW), width + colW);
    return { left, width: Math.max(right - left, 12), clippedL: s < 0, clippedR: e + 0.5 > days };
  };
  const idxFromEvent = (e, el) => Math.floor((e.clientX - el.getBoundingClientRect().left) / colW);
  // Where the dragged bar's first night would land, given where it was grabbed (continuous, so it feels exact).
  const dropStartIdx = (e, el) => Math.round((e.clientX - el.getBoundingClientRect().left) / colW - drag.current.grab - 0.5);

  const startResize = (e, b) => {
    e.stopPropagation(); e.preventDefault(); const x0 = e.clientX; setResize({ id: b._id, deltaDays: 0 });
    const move = (ev) => { const d = Math.round((ev.clientX - x0) / colW); resizeRef.current = d; setResize({ id: b._id, deltaDays: d }); };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); const d = resizeRef.current || 0; resizeRef.current = null; setResize(null); if (d !== 0) onResize(b, d); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  };

  return <div ref={scroller} className="cal-scroll relative max-h-[calc(100vh-19rem)] min-h-[320px] overflow-auto rounded-xl border border-slate-200 bg-white">
    <div style={{ minWidth: `calc(var(--left-w) + ${width}px)`, '--left-w': 'var(--cal-left)' }} className="[--cal-left:112px] sm:[--cal-left:340px]">
      {/* header */}
      <div className="sticky top-0 z-30 flex border-b border-slate-200 bg-slate-50">
        <div className="sticky left-0 z-40 flex w-[var(--cal-left)] shrink-0 items-center border-r border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
          <span className="w-[64px] px-3 py-3 sm:w-[72px]">Room</span><span className="hidden w-[116px] px-2 sm:block">Type</span><span className="hidden w-[48px] sm:block">Floor</span><span className="hidden flex-1 px-2 sm:block">Status</span></div>
        <div className="flex" style={{ width }}>{dayList.map((d, i) => {
          const wk = [0, 6].includes(d.getDay()); return <div key={i} style={{ width: colW }} className={cx('shrink-0 border-r border-slate-200/70 py-1.5 text-center', wk && 'bg-slate-100/70', i === todayIdx && 'bg-brand-50')}>
            <p className={cx('text-[11px] font-semibold', i === todayIdx ? 'text-brand-700' : 'text-slate-400')}>{format(d, colW > 100 ? 'EEEE' : 'EEE')}</p><p className={cx('text-sm font-extrabold', i === todayIdx ? 'text-brand-700' : 'text-slate-800')}>{format(d, colW < 50 ? 'd' : 'd MMM')}</p></div>;
        })}</div>
      </div>
      {/* rows */}
      <div className="relative">
        {todayIdx >= 0 && todayIdx < days && <div className="pointer-events-none absolute z-20 w-0.5 bg-brand-600" style={{ left: `calc(var(--cal-left) + ${(todayIdx + 0.5) * colW}px)`, top: 0, bottom: 0 }}><span className="absolute -top-0 left-1/2 -translate-x-1/2 rounded-b bg-brand-600 px-1.5 text-[10px] font-bold text-white">Today</span></div>}
        {data.rooms.map((r) => (
          <div key={r._id} className="flex border-b border-slate-100" style={{ height: ROW_H }}>
            <div className="sticky left-0 z-10 flex w-[var(--cal-left)] shrink-0 items-center border-r border-slate-200 bg-white text-sm">
              <span className="w-[64px] px-3 font-extrabold sm:w-[72px]">{r.roomNumber}</span>
              <span className="hidden w-[116px] truncate px-2 text-xs text-slate-600 sm:block">{r.roomType?.name} <span className={cx('font-semibold', r.sellableIsAC ? 'text-sky-600' : 'text-purple-600')}>{r.sellableIsAC ? 'AC' : 'Non-AC'}</span></span>
              <span className="hidden w-[48px] text-xs text-slate-500 sm:block">{r.floor}</span>
              <span className="hidden flex-1 flex-col gap-0.5 px-2 sm:flex"><Badge status={r.status} className="w-fit" />{r.isTemporary && <span className="flex items-center gap-1 text-[10px] font-bold text-purple-600"><Wind className="h-3 w-3" />AC not working</span>}</span>
              <span className={cx('mr-2 ml-auto h-2.5 w-2.5 rounded-full sm:hidden', STATUS[r.status]?.dot)} aria-label={r.status} />
            </div>
            <div className="relative shrink-0" style={{ width, backgroundImage: `linear-gradient(to right, #eef2f7 1px, transparent 1px)`, backgroundSize: `${colW}px 100%` }}
              onClick={(e) => { if (e.target === e.currentTarget && editable) onEmptyClick(r, idxFromEvent(e, e.currentTarget)); }}
              onDragOver={(e) => { if (drag.current) { e.preventDefault(); const idx = dropStartIdx(e, e.currentTarget); if (hover?.room !== r._id || hover?.idx !== idx) setHover({ room: r._id, idx, nights: drag.current.booking.nights }); } }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setHover(null); }}
              onDrop={(e) => { e.preventDefault(); const d = drag.current; setHover(null); if (!d) return; const idx = dropStartIdx(e, e.currentTarget); onMove(d.booking, r, addDays(from, idx)); drag.current = null; }}>
              {r.isTemporary && <div className="pointer-events-none absolute inset-0 bg-purple-50/50" />}
              {dayList.map((d, i) => [0, 6].includes(d.getDay()) && <div key={i} className="pointer-events-none absolute inset-y-0 bg-slate-50/80" style={{ left: i * colW, width: colW }} />)}
              {hover?.room === r._id && <div className="pointer-events-none absolute inset-y-1 rounded-lg border-2 border-dashed border-brand-500 bg-brand-500/10" style={{ left: (hover.idx + 0.5) * colW, width: hover.nights * colW }} />}
              {r.blocks.map((m) => {
                const s = differenceInCalendarDays(utcDate(m.blockFrom), from), e = differenceInCalendarDays(utcDate(m.blockTo), from); const left = Math.max(s, 0) * colW, w = (Math.min(e, days) - Math.max(s, 0)) * colW;
                return <div key={m._id} title={`Maintenance: ${m.issue.replace('_', ' ')} until ${fmtDate(m.blockTo, 'dd MMM')}`} className="absolute inset-y-1.5 flex items-center gap-1.5 overflow-hidden rounded-lg border border-orange-300 px-2 text-xs font-bold text-orange-800" style={{ left, width: w, backgroundImage: 'repeating-linear-gradient(135deg,#fed7aa,#fed7aa 6px,#ffedd5 6px,#ffedd5 12px)' }}><Wrench className="h-3.5 w-3.5 shrink-0" />Maintenance</div>;
              })}
              {r.bookings.map((b) => {
                const g = geom(b); const can = editable && DRAGGABLE.includes(b.bookingStatus); const st = STATUS[b.bookingStatus];
                return <div key={b._id} draggable={can} title={`${b.bookingNumber} · ${b.guest?.name}\n${fmtDate(b.checkInDate, 'dd MMM')} → ${fmtDate(b.checkOutDate, 'dd MMM')} (${b.nights} nights)\n${st.label}`}
                  onDragStart={(e) => { const rect = e.currentTarget.getBoundingClientRect(); const trueStart = differenceInCalendarDays(utcDate(b.checkInDate), from) + 0.5; drag.current = { booking: b, grab: (e.clientX - rect.left) / colW + (g.clippedL ? -trueStart : 0) }; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', b._id); }}
                  onDragEnd={() => { drag.current = null; setHover(null); }} onClick={(e) => { e.stopPropagation(); onOpen(b); }}
                  className={cx('group absolute inset-y-1.5 flex select-none items-center overflow-hidden px-2.5 text-xs font-bold text-white shadow-sm transition-shadow hover:shadow-md', st.bar, can ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer', b.bookingStatus === 'checked_out' && 'opacity-80', g.clippedL ? 'rounded-l-none' : 'rounded-l-lg', g.clippedR ? 'rounded-r-none' : 'rounded-r-lg', b.paymentStatus !== 'paid' && b.bookingStatus !== 'checked_out' && 'ring-1 ring-inset ring-white/40')}
                  style={{ left: g.left, width: g.width }}>
                  <span className="truncate">{b.guest?.name}</span>{g.width > 150 && <span className="ml-2 shrink-0 font-semibold opacity-80">{b.nights}n</span>}
                  {b.balanceAmount > 0 && g.width > 110 && <span className="ml-auto shrink-0 rounded bg-white/25 px-1 text-[10px]">₹{b.balanceAmount}</span>}
                  {can && b.bookingStatus !== 'checked_in' && <span role="separator" aria-label="Drag to change check-out date" onPointerDown={(e) => startResize(e, b)} draggable={false} onDragStart={(e) => e.preventDefault()} className="absolute inset-y-0 right-0 w-2.5 cursor-ew-resize bg-white/0 hover:bg-white/40" />}
                </div>;
              })}
            </div>
          </div>))}
        {!data.rooms.length && <p className="p-10 text-center text-sm text-slate-500">No rooms match these filters.</p>}
      </div>
    </div></div>;
}
