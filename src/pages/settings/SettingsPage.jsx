import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Building2, Sliders, Receipt, ArrowRight } from 'lucide-react';
import api, { unwrap } from '../../services/api';
import { useMutate } from '../../hooks/useMutate';
import { PageHeader, Card, Field, Spinner, QueryBoundary, Skeleton } from '../../components/common/ui';

export default function SettingsPage() {
  const q = useQuery({ queryKey: ['settings'], queryFn: () => unwrap(api.get('/settings')) });
  const f = useForm();

  useEffect(() => {
    const h = q.data?.hotel;
    if (h) {
      f.reset({
        name: h.name || '',
        address: h.address || '',
        phone: h.phone || '',
        email: h.email || '',
        website: h.website || '',
        gstNumber: h.gstNumber || '',
        invoicePrefix: h.invoice?.prefix || 'INV',
        footerNote: h.invoice?.footerNote || '',
        checkInTime: h.booking?.checkInTime || '12:00',
        checkOutTime: h.booking?.checkOutTime || '11:00',
        taxPercent: h.booking?.taxPercent ?? 12,
        cancellationHours: h.booking?.cancellationHours ?? 24,
      });
    }
  }, [q.data]); // eslint-disable-line

  const save = useMutate(
    (v) =>
      api.put('/settings', {
        name: v.name,
        address: v.address,
        phone: v.phone,
        email: v.email || undefined,
        website: v.website,
        gstNumber: v.gstNumber,
        invoice: { prefix: v.invoicePrefix, footerNote: v.footerNote },
        booking: {
          checkInTime: v.checkInTime,
          checkOutTime: v.checkOutTime,
          taxPercent: +v.taxPercent,
          cancellationHours: +v.cancellationHours,
        },
      }),
    { success: 'Settings saved', invalidate: ['settings'] }
  );

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        title="Settings"
        subtitle="Hotel details that appear on invoices, and default booking rules."
        actions={
          <button
            className="btn-primary min-h-[44px] flex items-center justify-center gap-1.5"
            disabled={save.isPending}
            onClick={f.handleSubmit((v) => save.mutate(v))}
          >
            {save.isPending && <Spinner />} Save settings
          </button>
        }
      />

      <QueryBoundary q={q} skeleton={<Skeleton className="h-96" />}>
        <div className="grid gap-5 xl:grid-cols-2">
          <Card title="Hotel Profile">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Field label="Hotel name" className="sm:col-span-2">
                <input className="input" {...f.register('name')} />
              </Field>
              <Field label="Address" className="sm:col-span-2">
                <input className="input" {...f.register('address')} />
              </Field>
              <Field label="Phone">
                <input className="input" {...f.register('phone')} />
              </Field>
              <Field label="Email">
                <input type="email" className="input" {...f.register('email')} />
              </Field>
              <Field label="Website">
                <input className="input" {...f.register('website')} />
              </Field>
              <Field label="GST number">
                <input className="input" {...f.register('gstNumber')} />
              </Field>
            </div>
          </Card>

          <Card title="Booking Rules">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Field label="Default check-in time">
                <input type="time" className="input" {...f.register('checkInTime')} />
              </Field>
              <Field label="Default check-out time">
                <input type="time" className="input" {...f.register('checkOutTime')} />
              </Field>
              <Field label="Tax (%)" hint="Applied to new bookings.">
                <input type="number" step="any" className="input" {...f.register('taxPercent')} />
              </Field>
              <Field label="Cancellation window (hours)">
                <input type="number" className="input" {...f.register('cancellationHours')} />
              </Field>
            </div>
          </Card>

          <Card title="Invoices">
            <div className="grid grid-cols-1 gap-3.5">
              <Field label="Invoice number prefix">
                <input className="input" {...f.register('invoicePrefix')} />
              </Field>
              <Field label="Footer note">
                <textarea rows={2} className="input" {...f.register('footerNote')} />
              </Field>
            </div>
          </Card>

          <Card title="More Settings">
            <ul className="divide-y divide-slate-100 text-sm font-semibold">
              <li>
                <Link
                  className="flex items-center justify-between py-3 text-blue-600 hover:text-blue-700 min-h-[44px]"
                  to="/rooms"
                >
                  <span>Room types, amenities and pricing</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </li>
              <li>
                <Link
                  className="flex items-center justify-between py-3 text-blue-600 hover:text-blue-700 min-h-[44px]"
                  to="/roles"
                >
                  <span>Roles and permissions</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </li>
              <li>
                <Link
                  className="flex items-center justify-between py-3 text-blue-600 hover:text-blue-700 min-h-[44px]"
                  to="/users"
                >
                  <span>Users and Staff</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </li>
            </ul>
          </Card>
        </div>
      </QueryBoundary>
    </div>
  );
}
