import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Lock, Trash2 } from 'lucide-react';
import api, { unwrap } from '../../services/api';
import { useMutate } from '../../hooks/useMutate';
import { PageHeader, Card, QueryBoundary, Modal, Field, Spinner, ConfirmDialog, cx } from '../../components/common/ui';
import { humanize } from '../../utils/format';

export default function RolesPage() {
  const roles = useQuery({ queryKey: ['roles'], queryFn: () => unwrap(api.get('/roles')) }); const cat = useQuery({ queryKey: ['permissions'], queryFn: () => unwrap(api.get('/permissions')), staleTime: Infinity });
  const [selId, setSel] = useState(null); const [perms, setPerms] = useState([]); const [add, setAdd] = useState(false); const [name, setName] = useState(''); const [del, setDel] = useState(false);
  const list = roles.data?.roles || []; const role = list.find((r) => r._id === selId) || list[0];
  useEffect(() => { if (role) setPerms(role.permissions); }, [role?._id, role?.permissions?.join()]); // eslint-disable-line
  const locked = role?.name === 'Admin'; const dirty = role && perms.slice().sort().join() !== role.permissions.slice().sort().join();
  const save = useMutate(() => api.put(`/roles/${role._id}`, { name: role.name, description: role.description, permissions: perms }), { success: 'Permissions saved. They apply on the next request.', invalidate: ['roles'] });
  const create = useMutate(() => api.post('/roles', { name, permissions: [] }), { success: 'Role created', invalidate: ['roles'], onSuccess: (r) => { setAdd(false); setName(''); setSel(r.data.data.role._id); } });
  const remove = useMutate(() => api.delete(`/roles/${role._id}`), { success: 'Role deleted', invalidate: ['roles'], onSuccess: () => { setDel(false); setSel(null); } });
  const toggle = (k) => setPerms((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
  const toggleGroup = (g, on) => { const keys = cat.data.groups[g].map((a) => `${g}.${a}`); setPerms((p) => (on ? [...new Set([...p, ...keys])] : p.filter((x) => !keys.includes(x)))); };
  return <>
    <PageHeader title="Roles & permissions" subtitle="Decide exactly what each role can do. Add new roles any time." actions={<button className="btn-primary" onClick={() => setAdd(true)}><Plus className="h-4 w-4" />New role</button>} />
    <QueryBoundary q={roles}><div className="grid gap-5 lg:grid-cols-[240px_1fr]">
      <nav className="card h-fit p-2" aria-label="Roles">{list.map((r) => <button key={r._id} onClick={() => setSel(r._id)} className={cx('flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold', role?._id === r._id ? 'bg-brand-50 text-brand-700' : 'hover:bg-slate-50')}>{r.name}{r.name === 'Admin' && <Lock className="h-3.5 w-3.5 text-slate-400" />}</button>)}</nav>
      {role && <Card title={role.name} action={<div className="flex gap-2">{!role.isSystem && <button className="btn-ghost btn-sm text-red-600" onClick={() => setDel(true)}><Trash2 className="h-3.5 w-3.5" />Delete</button>}<button className="btn-primary btn-sm" disabled={!dirty || locked || save.isPending} onClick={() => save.mutate()}>{save.isPending && <Spinner />}Save changes</button></div>}>
        {locked ? <p className="text-sm text-slate-600">The Admin role always has full access and can't be edited.</p> : <QueryBoundary q={cat}><div className="grid gap-4 md:grid-cols-2">{Object.entries(cat.data?.groups || {}).map(([g, acts]) => { const keys = acts.map((a) => `${g}.${a}`); const all = keys.every((k) => perms.includes(k));
          return <fieldset key={g} className="rounded-xl border border-slate-200 p-3"><legend className="px-1 text-sm font-bold">{humanize(g)}</legend><label className="mb-1 flex items-center gap-2 border-b border-slate-100 pb-1.5 text-xs font-semibold text-slate-500"><input type="checkbox" checked={all} onChange={(e) => toggleGroup(g, e.target.checked)} />Select all</label>
            <div className="space-y-1">{keys.map((k) => <label key={k} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={perms.includes(k)} onChange={() => toggle(k)} />{humanize(k.split('.')[1])}<code className="ml-auto text-[11px] text-slate-400">{k}</code></label>)}</div></fieldset>; })}</div></QueryBoundary>}</Card>}</div></QueryBoundary>
    <Modal open={add} onClose={() => setAdd(false)} size="sm" title="New role" footer={<><button className="btn-ghost" onClick={() => setAdd(false)}>Cancel</button><button className="btn-primary" disabled={name.length < 2 || create.isPending} onClick={() => create.mutate()}>{create.isPending && <Spinner />}Create role</button></>}><Field label="Role name" hint="You'll choose its permissions next."><input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus /></Field></Modal>
    <ConfirmDialog open={del} onClose={() => setDel(false)} onConfirm={() => remove.mutate()} busy={remove.isPending} danger confirmLabel="Delete role" title={`Delete ${role?.name}?`} message="Users must be moved to another role first." /></>;
}
