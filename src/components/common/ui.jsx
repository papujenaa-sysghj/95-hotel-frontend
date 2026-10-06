import { useEffect } from 'react';
import { X, AlertTriangle, Inbox, RefreshCw, Loader2, CheckCircle2 } from 'lucide-react';
import { STATUS, humanize } from '../../utils/format';
import { useToast } from '../../store/toast';

export const cx = (...a) => a.filter(Boolean).join(' ');

export function Badge({ status, children, className }) {
  const s = STATUS[status] || {};
  return <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset', s.chip || 'bg-slate-100 text-slate-600 ring-slate-200', className)}>
    {s.dot && <i className={cx('h-1.5 w-1.5 rounded-full', s.dot)} />}{children || s.label || humanize(status)}</span>;
}
export const Spinner = ({ className }) => <Loader2 className={cx('h-4 w-4 animate-spin', className)} aria-label="Loading" />;
export const Skeleton = ({ className }) => <div className={cx('skeleton', className)} />;

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-xs sm:text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export const Card = ({ title, action, children, className, pad = true }) => (
  <section className={cx('card', className)}>
    {(title || action) && (
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 sm:px-5 sm:py-3.5">
        <h2 className="text-sm font-bold text-slate-800">{title}</h2>
        {action}
      </header>
    )}
    <div className={pad ? 'p-3.5 sm:p-5' : ''}>{children}</div>
  </section>
);

export const Stat = ({ label, value, icon: Icon, tone = 'text-brand-600 bg-brand-50', hint, loading }) => (
  <div className="card flex items-center gap-3 sm:gap-3.5 p-3.5 sm:p-4">
    {Icon && (
      <span className={cx('grid h-10 w-10 sm:h-11 sm:w-11 shrink-0 place-items-center rounded-xl', tone)}>
        <Icon className="h-5 w-5" />
      </span>
    )}
    <div className="min-w-0 flex-1">
      <p className="truncate text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
      {loading ? (
        <Skeleton className="mt-1.5 h-6 w-16" />
      ) : (
        <p className="text-xl sm:text-2xl font-black leading-tight text-slate-900">{value}</p>
      )}
      {hint && <p className="truncate text-[11px] text-slate-400 mt-0.5">{hint}</p>}
    </div>
  </div>
);

export function EmptyState({ title = 'Nothing here yet', message, action }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 sm:px-6 sm:py-12 text-center">
      <Inbox className="h-9 w-9 text-slate-300" />
      <p className="font-bold text-slate-800 text-sm sm:text-base">{title}</p>
      {message && <p className="max-w-sm text-xs sm:text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, message }) {
  const msg = message || error?.response?.data?.message || (error?.code === 'ERR_NETWORK' ? 'Cannot reach the server. Check your connection.' : 'We could not load this. Please try again.');
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-8 sm:px-6 sm:py-10 text-center">
      <AlertTriangle className="h-8 w-8 text-amber-500" />
      <p className="max-w-md text-xs sm:text-sm text-slate-600">{msg}</p>
      {onRetry && (
        <button className="btn-ghost btn-sm" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" />Try again
        </button>
      )}
    </div>
  );
}

/** Wraps a useQuery result: skeleton → error+retry → empty → content. */
export function QueryBoundary({ q, empty, isEmpty, skeleton, children }) {
  if (q.isLoading) return skeleton || <div className="space-y-2.5 p-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}</div>;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  if (isEmpty) return empty || <EmptyState />;
  return children;
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;
  const w = { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-3xl', xl: 'sm:max-w-5xl' }[size];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-0 sm:items-center sm:p-4 backdrop-blur-xs transition-opacity"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className={cx('flex h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[90vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl overflow-hidden', w)}>
        <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-4 shrink-0 bg-white">
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 truncate pr-2">{title}</h3>
          <button
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 active:scale-95 transition-all"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 flex-1 custom-scrollbar">
          {children}
        </div>
        {footer && (
          <footer className="flex flex-col-reverse sm:flex-row justify-end gap-2 border-t border-slate-100 px-4 py-3 sm:px-6 sm:py-4 shrink-0 bg-slate-50/70 pb-safe">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}

export function Drawer({ open, onClose, title, children, footer, width = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-slate-900/50 backdrop-blur-xs transition-opacity"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <aside
        className={cx('flex h-full w-full flex-col bg-white shadow-2xl transition-transform', width)}
        role="dialog"
        aria-label={title}
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 sm:px-5 sm:py-4 shrink-0 bg-white">
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 truncate pr-2">{title}</h3>
          <button
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 active:scale-95 transition-all"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5 custom-scrollbar">{children}</div>
        {footer && (
          <footer className="border-t border-slate-100 px-4 py-3 sm:px-5 sm:py-4 shrink-0 bg-slate-50/70 pb-safe">
            {footer}
          </footer>
        )}
      </aside>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger, busy }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button className="btn-ghost w-full sm:w-auto" onClick={onClose}>Keep as is</button>
          <button className={cx(danger ? 'btn-danger' : 'btn-primary', 'w-full sm:w-auto')} onClick={onConfirm} disabled={busy}>
            {busy && <Spinner />}{confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-slate-600">{message}</p>
    </Modal>
  );
}

export const Field = ({ label, error, children, hint, className }) => (
  <div className={className}>
    <label className="label">{label}</label>
    {children}
    {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    {error && <p className="mt-1 text-xs font-semibold text-red-600" role="alert">{error}</p>}
  </div>
);

export const Tabs = ({ tabs, value, onChange }) => (
  <div className="mb-4 flex gap-1.5 overflow-x-auto rounded-2xl bg-slate-100 p-1.5 no-scrollbar select-none" role="tablist">
    {tabs.map((t) => (
      <button
        key={t.key}
        role="tab"
        aria-selected={value === t.key}
        onClick={() => onChange(t.key)}
        className={cx(
          'whitespace-nowrap rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition min-h-[38px]',
          value === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
        )}
      >
        {t.label}
      </button>
    ))}
  </div>
);

export function DataTable({ columns, rows, onRowClick, rowKey = '_id' }) {
  return (
    <div className="overflow-x-auto cal-scroll">
      <table className="w-full min-w-[600px] text-left">
        <thead className="border-b border-slate-100 bg-slate-50/70">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={cx('th', c.className)}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr
              key={r[rowKey]}
              onClick={onRowClick ? () => onRowClick(r) : undefined}
              className={cx(onRowClick && 'cursor-pointer hover:bg-slate-50/80 transition-colors')}
            >
              {columns.map((c) => (
                <td key={c.key} className={cx('td', c.className)}>
                  {c.render ? c.render(r) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function Pager({ page, total, limit, onPage }) {
  const pages = Math.max(1, Math.ceil(total / limit)); if (pages <= 1) return null;
  return <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500"><span>Page {page} of {pages} · {total} records</span>
    <div className="flex gap-2"><button className="btn-ghost btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button><button className="btn-ghost btn-sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button></div></div>;
}
export function Toaster() {
  const { items, dismiss } = useToast();
  return <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2" aria-live="polite">{items.map((t) => (
    <div key={t.id} className={cx('pointer-events-auto flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg', t.type === 'error' ? 'bg-red-600' : 'bg-slate-900')}>
      {t.type === 'error' ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />}<span className="flex-1">{t.message}</span>
      <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="opacity-70 hover:opacity-100"><X className="h-4 w-4" /></button></div>))}</div>;
}
