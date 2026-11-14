import React, { useEffect, useState } from 'react';
import { BarChart3, Activity, RefreshCw, Info, AlertTriangle, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';

interface PlatformOverview {
  propertyCount: number;
  unitCount: number;
  occupiedUnits: number;
  vacantUnits: number;
  occupancyRate: number;
  landlordCount: number;
  accountCount: number;
  tenantCount: number;
  activeTenantCount: number;
  openMaintenance: number;
  pendingPayments: number;
  overduePayments: number;
  openReports: number;
  rentByStatus: { paid: number; pending: number; overdue: number };
}

const money = (value: number) => `$${value.toLocaleString()}`;

function RatioBar({ label, value, detail, tone }: { label: string; value: number; detail: string; tone: string }) {
  const width = Math.max(0, Math.min(100, value));
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <p className="text-2xl font-black text-slate-900">{value}%</p>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={cn('h-full rounded-full', tone)} style={{ width: `${width}%` }} />
      </div>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

export const AdminAnalytics = () => {
  const { fetchWithAuth } = useAuth();
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadOverview() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchWithAuth('/api/admin/overview');
        const data = await response.json();
        if (!response.ok || !data?.success) throw new Error(data?.error || 'Unable to load platform metrics.');
        if (!cancelled) setOverview(data.data as PlatformOverview);
      } catch (loadError) {
        if (!cancelled) {
          setOverview(null);
          setError(loadError instanceof Error ? loadError.message : 'Unable to load platform metrics.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadOverview();
    return () => {
      cancelled = true;
    };
  }, [fetchWithAuth, refreshKey]);

  const billed = overview ? overview.rentByStatus.paid + overview.rentByStatus.pending + overview.rentByStatus.overdue : 0;
  const collectionRate = billed > 0 && overview ? Math.round((overview.rentByStatus.paid / billed) * 100) : 0;
  const rentRows = overview
    ? [
        { key: 'paid', label: 'Paid', amount: overview.rentByStatus.paid, tone: 'bg-emerald-500', text: 'text-emerald-700' },
        { key: 'pending', label: 'Pending', amount: overview.rentByStatus.pending, tone: 'bg-amber-500', text: 'text-amber-700' },
        { key: 'overdue', label: 'Overdue', amount: overview.rentByStatus.overdue, tone: 'bg-red-500', text: 'text-red-700' },
      ]
    : [];

  return (
    <div className="p-4 sm:p-8 flex-1 overflow-y-auto mb-16 md:mb-0 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-indigo-600" />
              Platform Analytics
            </h1>
            <p className="text-slate-500 mt-1">Occupancy, collection, and workload figures counted from live platform records.</p>
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey((key) => key + 1)}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 sm:self-auto"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            Loading platform metrics...
          </div>
        )}

        {!loading && overview && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <RatioBar
                label="Unit occupancy"
                value={overview.occupancyRate}
                detail={`${overview.occupiedUnits} occupied · ${overview.vacantUnits} vacant · ${overview.unitCount} total units`}
                tone="bg-indigo-500"
              />
              <RatioBar
                label="Rent collected"
                value={collectionRate}
                detail={`${money(overview.rentByStatus.paid)} paid of ${money(billed)} billed`}
                tone="bg-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Accounts</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{overview.accountCount}</p>
                <p className="mt-0.5 text-xs text-slate-500">{overview.landlordCount} landlords</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Active tenancies</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{overview.activeTenantCount}</p>
                <p className="mt-0.5 text-xs text-slate-500">{overview.tenantCount} tenant records</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Open maintenance</p>
                <p className="mt-1 text-2xl font-bold text-amber-700">{overview.openMaintenance}</p>
                <p className="mt-0.5 text-xs text-slate-500">Not yet closed</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Open reports</p>
                <p className="mt-1 text-2xl font-bold text-red-700">{overview.openReports}</p>
                <p className="mt-0.5 text-xs text-slate-500">Awaiting review</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="flex items-center gap-2 font-bold text-slate-900">
                  <Activity className="w-5 h-5 text-indigo-500" /> Rent by status
                </h3>
                <div className="mt-5 space-y-4">
                  {rentRows.map((row) => (
                    <div key={row.key}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">{row.label}</span>
                        <span className={cn('font-semibold', row.text)}>{money(row.amount)}</span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={cn('h-full rounded-full', row.tone)}
                          style={{ width: `${billed > 0 ? Math.round((row.amount / billed) * 100) : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="flex items-center gap-2 font-bold text-slate-900">
                  <AlertTriangle className="w-5 h-5 text-amber-500" /> Workload
                </h3>
                <dl className="mt-5 divide-y divide-slate-100 text-sm">
                  <div className="flex items-center justify-between py-3">
                    <dt className="text-slate-600">Pending payments</dt>
                    <dd className="font-semibold text-slate-900">{overview.pendingPayments}</dd>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <dt className="text-slate-600">Overdue payments</dt>
                    <dd className="font-semibold text-red-700">{overview.overduePayments}</dd>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <dt className="text-slate-600">Outstanding rent</dt>
                    <dd className="font-semibold text-slate-900">{money(overview.rentByStatus.pending + overview.rentByStatus.overdue)}</dd>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <dt className="flex items-center gap-2 text-slate-600"><FileText className="w-4 h-4 text-slate-400" /> Reports in queue</dt>
                    <dd className="font-semibold text-slate-900">{overview.openReports}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
              <p>
                There is no subscription billing in this build, so no MRR, processing-fee, or growth figures are shown.
                Every number above is a count of an existing record.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
