import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api, { unwrap } from '../../services/api';
import { PageHeader, Card, DataTable, QueryBoundary, Pager, EmptyState } from '../../components/common/ui';
import { fmtDateTime, humanize } from '../../utils/format';

const GROUPS = ['auth', 'booking', 'payment', 'room', 'maintenance', 'housekeeping', 'user', 'role', 'settings', 'invoice'];
export default function AuditPage() {
  const [action, setAction] = useState(''); const [page, setPage] = useState(1);
  const q = useQuery({ queryKey: ['audit', action, page], queryFn: () => unwrap(api.get('/audit-logs', { params: { action: action || undefined, page, limit: 30 } })), placeholderData: (p) => p });
  return <>
    <PageHeader title="Activity log" subtitle="Who did what, and when." />
    <Card pad={false}><div className="border-b border-slate-100 p-4"><select className="input w-52" value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} aria-label="Activity type"><option value="">All activity</option>{GROUPS.map((g) => <option key={g} value={g}>{humanize(g)}</option>)}</select></div>
      <QueryBoundary q={q} isEmpty={!q.data?.logs.length} empty={<EmptyState title="No activity recorded" />}><DataTable rows={q.data?.logs || []} columns={[{ key: 't', header: 'When', render: (l) => fmtDateTime(l.createdAt) }, { key: 'u', header: 'User', render: (l) => <b>{l.userName || 'System'}</b> }, { key: 'a', header: 'Action', render: (l) => humanize(l.action.replace('.', ' ')) }, { key: 's', header: 'Details', render: (l) => l.summary }]} />
        <Pager page={page} total={q.data?.total || 0} limit={30} onPage={setPage} /></QueryBoundary></Card></>;
}
