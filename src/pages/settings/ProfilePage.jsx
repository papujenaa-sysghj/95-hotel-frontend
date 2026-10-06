import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ShieldCheck, History } from 'lucide-react';
import { authApi } from '../../services/auth.api';
import { useAuth } from '../../store/auth';
import { useMutate } from '../../hooks/useMutate';
import { PageHeader, Card, Field, Spinner, QueryBoundary, DataTable, Badge } from '../../components/common/ui';
import { fmtDateTime } from '../../utils/format';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: z.string().min(8, 'At least 8 characters').regex(/[A-Za-z]/, 'Needs a letter').regex(/\d/, 'Needs a number'),
    confirm: z.string(),
  })
  .refine((d) => d.newPassword === d.confirm, { message: 'Passwords do not match', path: ['confirm'] });

export default function ProfilePage() {
  const user = useAuth((s) => s.user);
  const nav = useNavigate();
  const f = useForm({ resolver: zodResolver(schema) });
  const e = f.formState.errors;

  const act = useQuery({ queryKey: ['login-activity'], queryFn: authApi.loginActivity });
  const change = useMutate(
    (v) => authApi.changePassword({ currentPassword: v.currentPassword, newPassword: v.newPassword }),
    {
      success: 'Password changed. Please sign in again.',
      onSuccess: () => {
        useAuth.getState().logoutLocal();
        nav('/login');
      },
    }
  );

  return (
    <div className="space-y-5 pb-8">
      <PageHeader title="Profile & Security" subtitle={`${user?.name || 'Staff'} · ${user?.role || 'User'}`} />

      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="Change Password">
          <form className="space-y-3.5" onSubmit={f.handleSubmit((v) => change.mutate(v))}>
            <Field label="Current password" error={e.currentPassword?.message}>
              <input type="password" className="input" autoComplete="current-password" {...f.register('currentPassword')} />
            </Field>
            <Field label="New password" error={e.newPassword?.message}>
              <input type="password" className="input" autoComplete="new-password" {...f.register('newPassword')} />
            </Field>
            <Field label="Confirm new password" error={e.confirm?.message}>
              <input type="password" className="input" autoComplete="new-password" {...f.register('confirm')} />
            </Field>
            <button className="btn-primary min-h-[44px] w-full sm:w-auto" disabled={change.isPending}>
              {change.isPending && <Spinner />} Change password
            </button>
          </form>
        </Card>

        <Card title="Recent Sign-ins" pad={false}>
          <QueryBoundary q={act} isEmpty={!act.data?.history?.length}>
            <div className="overflow-x-auto">
              <DataTable
                rowKey="__i"
                rows={(act.data?.history || []).slice(0, 10).map((h, i) => ({ ...h, __i: i }))}
                columns={[
                  { key: 'at', header: 'When', render: (h) => fmtDateTime(h.at) },
                  { key: 'ip', header: 'IP' },
                  {
                    key: 's',
                    header: 'Result',
                    render: (h) => (
                      <Badge status={h.success ? 'paid' : 'open'}>{h.success ? 'Signed in' : 'Failed'}</Badge>
                    ),
                  },
                ]}
              />
            </div>
          </QueryBoundary>
        </Card>
      </div>
    </div>
  );
}
