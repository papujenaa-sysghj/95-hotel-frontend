import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useMutate } from '../../hooks/useMutate';
import { useCan } from '../../store/auth';
import { PageHeader, Card, DataTable, QueryBoundary, Modal, Field, Spinner, ConfirmDialog, EmptyState, Pager } from './ui';

/** Reusable list + create/edit modal + delete for simple resources. Business rules stay on the server. */
export default function CrudPage({ title, subtitle, embedded, api, queryKey, columns, fields, schema, editSchema, perms = {}, toForm = (r) => r, toPayload = (v) => v, defaults = {}, rowActions, searchable = true, noun = 'record', onRowClick, pageSize = 25 }) {
  const can = useCan(); const [editing, setEditing] = useState(null); const [del, setDel] = useState(null); const [q, setQ] = useState(''); const [page, setPage] = useState(1);
  const list = useQuery({ queryKey: [queryKey, { q, page }], queryFn: () => api.list({ q: q || undefined, page, limit: pageSize }), placeholderData: (p) => p });
  const rows = list.data?.items || list.data?.users || list.data?.roles || [];
  const editingRef = useRef(null);
  const f = useForm({ resolver: schema ? (vals, ctx, o) => zodResolver(editingRef.current?._id && editSchema ? editSchema : schema)(vals, ctx, o) : undefined, defaultValues: defaults });
  const open = (row) => { editingRef.current = row || {}; f.reset(row ? toForm(row) : defaults); setEditing(row || {}); };
  const save = useMutate((v) => (editing?._id ? api.update(editing._id, toPayload(v, editing)) : api.create(toPayload(v))), { success: editing?._id ? `${noun} updated` : `${noun} added`, invalidate: [queryKey], onSuccess: () => setEditing(null) });
  const remove = useMutate(() => api.remove(del._id), { success: `${noun} deleted`, invalidate: [queryKey], onSuccess: () => setDel(null) });
  const errs = f.formState.errors; const isNew = !editing?._id;
  const cols = [...columns, ...((can(perms.edit) || can(perms.delete) || rowActions) ? [{ key: '_a', header: '', className: 'text-right', render: (r) => <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>{rowActions?.(r)}{perms.edit && can(perms.edit) && <button className="btn-ghost btn-sm" onClick={() => open(r)} aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></button>}{perms.delete && can(perms.delete) && <button className="btn-ghost btn-sm text-red-600" onClick={() => setDel(r)} aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></button>}</div> }] : [])];
  const body = <>
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 p-3.5 sm:p-4">
      {searchable && (
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            className="input pl-10"
            placeholder={`Search ${noun}s...`}
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            aria-label={`Search ${noun}s`}
          />
        </div>
      )}
      {embedded && perms.create && can(perms.create) && (
        <button className="btn-primary w-full sm:w-auto sm:ml-auto" onClick={() => open()}>
          <Plus className="h-4 w-4" />Add {noun}
        </button>
      )}
    </div>
    <QueryBoundary
      q={list}
      isEmpty={!rows.length}
      empty={
        <EmptyState
          title={q ? `No ${noun}s match “${q}”` : `No ${noun}s yet`}
          message={q ? 'Try a different search.' : `Add the first ${noun} to get started.`}
          action={!q && perms.create && can(perms.create) && (
            <button className="btn-primary" onClick={() => open()}>
              <Plus className="h-4 w-4" />Add {noun}
            </button>
          )}
        />
      }
    >
      <DataTable columns={cols} rows={rows} onRowClick={onRowClick} />
      <Pager page={page} total={list.data?.total || rows.length} limit={pageSize} onPage={setPage} />
    </QueryBoundary>
  </>;

  return <>
    {!embedded && (
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={perms.create && can(perms.create) && (
          <button className="btn-primary w-full sm:w-auto" onClick={() => open()}>
            <Plus className="h-4 w-4" />Add {noun}
          </button>
        )}
      />
    )}
    <Card pad={false}>{body}</Card>
    <Modal
      open={!!editing}
      onClose={() => setEditing(null)}
      title={`${isNew ? 'Add' : 'Edit'} ${noun}`}
      size="md"
      footer={
        <>
          <button className="btn-ghost w-full sm:w-auto" onClick={() => setEditing(null)}>Cancel</button>
          <button className="btn-primary w-full sm:w-auto" disabled={save.isPending} onClick={f.handleSubmit((v) => save.mutate(v))}>
            {save.isPending && <Spinner />}Save {noun}
          </button>
        </>
      }
    >
      <form className="grid grid-cols-1 sm:grid-cols-2 gap-3.5" onSubmit={(e) => e.preventDefault()}>
        {fields.filter((x) => !(x.createOnly && !isNew)).map((x) => (
          <Field key={x.name} label={x.label} hint={x.hint} error={errs[x.name]?.message} className={x.full ? 'sm:col-span-2' : ''}>
            {x.type === 'select' ? (
              <select className="input" {...f.register(x.name)}>
                <option value="">Select…</option>
                {x.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : x.type === 'checkbox' ? (
              <label className="flex items-center gap-2 pt-1 text-sm font-semibold text-slate-700">
                <input type="checkbox" className="h-4 w-4 rounded" {...f.register(x.name)} />
                {x.checkLabel || 'Yes'}
              </label>
            ) : x.type === 'textarea' ? (
              <textarea className="input" rows={3} {...f.register(x.name)} />
            ) : x.type === 'multi' ? (
              <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-slate-200 p-2.5">
                {x.options.map((o) => (
                  <label key={o.value} className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700">
                    <input type="checkbox" value={o.value} {...f.register(x.name)} />
                    {o.label}
                  </label>
                ))}
              </div>
            ) : (
              <input className="input" type={x.type || 'text'} step={x.type === 'number' ? 'any' : undefined} {...f.register(x.name)} />
            )}
          </Field>
        ))}
      </form>
    </Modal>
    <ConfirmDialog
      open={!!del}
      onClose={() => setDel(null)}
      onConfirm={() => remove.mutate()}
      busy={remove.isPending}
      danger
      confirmLabel={`Delete ${noun}`}
      title={`Delete this ${noun}?`}
      message="This cannot be undone. If it is still in use, the server will tell you why it can't be removed."
    />
  </>;
}
