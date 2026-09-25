import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { KeyRound } from 'lucide-react';
import CrudPage from '../../components/common/CrudPage';
import api, { unwrap } from '../../services/api';
import { resource } from '../../services/resource.api';
import { useMutate } from '../../hooks/useMutate';
import { useCan } from '../../store/auth';
import { Badge, Modal, Field, Spinner } from '../../components/common/ui';
import { fmtDateTime } from '../../utils/format';

const pw = z.string().min(8, 'At least 8 characters').regex(/[A-Za-z]/, 'Needs a letter').regex(/\d/, 'Needs a number');
const create = z.object({ name: z.string().min(2, 'Name is required'), email: z.string().email('Enter a valid email'), phone: z.string().optional(), department: z.string().optional(), role: z.string().min(1, 'Choose a role'), password: pw });
const edit = create.omit({ password: true }).extend({ password: z.string().optional() });
export default function UsersPage() {
  const can = useCan(); const [reset, setReset] = useState(null); const [np, setNp] = useState('');
  const roles = useQuery({ queryKey: ['roles'], queryFn: () => unwrap(api.get('/roles')) });
  const toggle = useMutate(({ id, on }) => api.patch(`/users/${id}/${on ? 'enable' : 'disable'}`), { success: 'User updated', invalidate: ['users'] });
  const rp = useMutate(() => api.post(`/users/${reset._id}/reset-password`, { newPassword: np }), { success: 'Password reset. Share it with the user securely.', onSuccess: () => { setReset(null); setNp(''); } });
  return <>
    <CrudPage title="Users" subtitle="Staff who can sign in. Roles decide what each person can do." noun="user" queryKey="users" api={resource('users')} schema={create} editSchema={edit} perms={{ create: 'users.create', edit: 'users.edit' }}
      defaults={{ name: '', email: '', phone: '', department: '', role: '', password: '' }} toForm={(r) => ({ ...r, role: r.role?._id || r.role, password: undefined })} toPayload={(v, editing) => { const { password, ...rest } = v; return editing?._id ? rest : v; }}
      columns={[{ key: 'name', header: 'Name', render: (u) => <b>{u.name}</b> }, { key: 'email', header: 'Email' }, { key: 'role', header: 'Role', render: (u) => u.role?.name }, { key: 'dept', header: 'Department', render: (u) => u.department || '—' }, { key: 'last', header: 'Last login', render: (u) => (u.lastLoginAt ? fmtDateTime(u.lastLoginAt) : 'Never') }, { key: 'st', header: 'Status', render: (u) => <Badge status={u.isActive ? 'available' : 'closed'}>{u.isActive ? 'Active' : 'Disabled'}</Badge> }]}
      fields={[{ name: 'name', label: 'Full name' }, { name: 'email', label: 'Email', type: 'email' }, { name: 'phone', label: 'Phone' }, { name: 'department', label: 'Department' }, { name: 'role', label: 'Role', type: 'select', options: (roles.data?.roles || []).map((r) => ({ value: r._id, label: r.name })) }, { name: 'password', label: 'Temporary password', type: 'password', createOnly: true, hint: 'At least 8 characters with a letter and a number.' }]}
      rowActions={(u) => can('users.edit') && <><button className="btn-ghost btn-sm" onClick={() => toggle.mutate({ id: u._id, on: !u.isActive })}>{u.isActive ? 'Disable' : 'Enable'}</button><button className="btn-ghost btn-sm" onClick={() => setReset(u)} aria-label="Reset password"><KeyRound className="h-3.5 w-3.5" /></button></>} />
    <Modal open={!!reset} onClose={() => setReset(null)} size="sm" title={`Reset password for ${reset?.name}`} footer={<><button className="btn-ghost" onClick={() => setReset(null)}>Cancel</button><button className="btn-primary" disabled={np.length < 8 || rp.isPending} onClick={() => rp.mutate()}>{rp.isPending && <Spinner />}Reset password</button></>}>
      <Field label="New password" hint="They will be signed out everywhere."><input type="password" className="input" value={np} onChange={(e) => setNp(e.target.value)} /></Field></Modal></>;
}
