import React, { useEffect, useMemo, useState } from 'react';
import { CreditCard, Search, Filter, RefreshCw, DollarSign, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';

interface AdminPayment {
  id: string;
  tenantId: string;
  unitId: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'paid' | 'pending' | 'overdue';
  method: string;
}

interface AdminTenantRef {
  id: string;
  firstName: string;
  lastName: string;
}

interface AdminUnitRef {
  id: string;
  number: string;
  propertyId: string;
}

interface AdminPropertyRef {
  id: string;
  name: string;
}

const statusClass = (status: AdminPayment['status']) => ({
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  overdue: 'bg-red-50 text-red-700 border-red-200',
}[status]);

const money = (value: number) => `$${value.toLocaleString()}`;

export const AdminPayments = () => {
  const { fetchWithAuth } = useAuth();
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [tenants, setTenants] = useState<AdminTenantRef[]>([]);
  const [units, setUnits] = useState<AdminUnitRef[]>([]);
  const [properties, setProperties] = useState<AdminPropertyRef[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AdminPayment['status']>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadPayments() {
      setLoading(true);
      setError(null);
      try {
        const [paymentsResponse, tenantsResponse, unitsResponse, propertiesResponse] = await Promise.all([
          fetchWithAuth('/api/payments'),
          fetchWithAuth('/api/tenants'),
          fetchWithAuth('/api/units'),
          fetchWithAuth('/api/properties'),
        ]);
        const paymentsData = await paymentsResponse.json();
        const tenantsData = await tenantsResponse.json();
        const unitsData = await unitsResponse.json();
        const propertiesData = await propertiesResponse.json();

        if (!paymentsResponse.ok || !paymentsData?.success) throw new Error(paymentsData?.error || 'Unable to load payments.');
        if (!tenantsResponse.ok || !tenantsData?.success) throw new Error(tenantsData?.error || 'Unable to load tenants.');
        if (!unitsResponse.ok || !unitsData?.success) throw new Error(unitsData?.error || 'Unable to load units.');
        if (!propertiesResponse.ok || !propertiesData?.success) throw new Error(propertiesData?.error || 'Unable to load properties.');
        if (cancelled) return;

        setPayments(Array.isArray(paymentsData.data) ? paymentsData.data : []);
        setTenants(Array.isArray(tenantsData.data) ? tenantsData.data : []);
        setUnits(Array.isArray(unitsData.data) ? unitsData.data : []);
        setProperties(Array.isArray(propertiesData.data) ? propertiesData.data : []);
      } catch (loadError) {
        if (!cancelled) {
          setPayments([]);
          setTenants([]);
          setUnits([]);
          setProperties([]);
          setError(loadError instanceof Error ? loadError.message : 'Unable to load payments.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPayments();
    return () => {
      cancelled = true;
    };
  }, [fetchWithAuth, refreshKey]);

  const tenantNames = useMemo(
    () => tenants.reduce<Record<string, string>>((names, tenant) => {
      names[tenant.id] = `${tenant.firstName} ${tenant.lastName}`.trim();
      return names;
    }, {}),
    [tenants]
  );
  const unitsById = useMemo(
    () => units.reduce<Record<string, AdminUnitRef>>((lookup, unit) => {
      lookup[unit.id] = unit;
      return lookup;
    }, {}),
    [units]
  );
  const propertyNames = useMemo(
    () => properties.reduce<Record<string, string>>((names, property) => {
      names[property.id] = property.name;
      return names;
    }, {}),
    [properties]
  );

  const describeUnit = (unitId: string) => {
    const unit = unitsById[unitId];
    if (!unit) return 'Unknown unit';
    const propertyName = propertyNames[unit.propertyId];
    return `Unit ${unit.number}${propertyName ? ` · ${propertyName}` : ''}`;
  };

  const visiblePayments = useMemo(() => {
    const term = search.trim().toLowerCase();
    return payments.filter((payment) => {
      const haystack = `${tenantNames[payment.tenantId] ?? ''} ${describeUnit(payment.unitId)} ${payment.method}`.toLowerCase();
      const matchesSearch = !term || haystack.includes(term);
      const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [payments, tenantNames, unitsById, propertyNames, search, statusFilter]);

  const totals = useMemo(() => payments.reduce(
    (sums, payment) => {
      sums.billed += payment.amount;
      if (payment.status === 'paid') sums.collected += payment.amount;
      else sums.outstanding += payment.amount;
      return sums;
    },
    { billed: 0, collected: 0, outstanding: 0 }
  ), [payments]);

  const collectionRate = totals.billed > 0 ? Math.round((totals.collected / totals.billed) * 100) : 0;
  const overdueCount = payments.filter((payment) => payment.status === 'overdue').length;

  return (
    <div className="p-4 sm:p-8 flex-1 overflow-y-auto mb-16 md:mb-0 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <CreditCard className="w-8 h-8 text-indigo-600" />
              Platform Rent Ledger
            </h1>
            <p className="text-slate-500 mt-1">Every rent charge recorded across all landlords and tenants.</p>
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey((key) => key + 1)}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 sm:self-auto"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-500 mb-1">Total billed</p>
            <h3 className="text-3xl font-black text-slate-900 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-slate-400" /> {money(totals.billed)}
            </h3>
            <span className="text-sm text-slate-500 mt-2 block">{payments.length} recorded charges</span>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-500 mb-1">Collected</p>
            <h3 className="text-3xl font-black text-emerald-700">{money(totals.collected)}</h3>
            <span className="text-sm text-slate-500 mt-2 block">{collectionRate}% of billed rent marked paid</span>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-sm font-medium text-slate-500 mb-1">Outstanding</p>
            <h3 className="text-3xl font-black text-amber-700">{money(totals.outstanding)}</h3>
            <span className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> {overdueCount} overdue charge{overdueCount === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by tenant, unit, or method..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              aria-label="Filter payments by status"
              className="w-full sm:w-auto pl-9 pr-8 py-2 border border-slate-200 rounded-xl bg-slate-50 font-medium text-slate-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="all">All statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Tenant</th>
                  <th className="px-6 py-4">Unit</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Due</th>
                  <th className="px-6 py-4">Paid</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">Loading payments...</td>
                  </tr>
                )}
                {!loading && !error && visiblePayments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">
                      {payments.length === 0 ? 'No rent charges have been recorded yet.' : 'No payments match your current search.'}
                    </td>
                  </tr>
                )}
                {!loading && visiblePayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50 transition-colors text-sm">
                    <td className="px-6 py-4 font-semibold text-slate-900">{tenantNames[payment.tenantId] ?? 'Unknown tenant'}</td>
                    <td className="px-6 py-4 text-slate-600">{describeUnit(payment.unitId)}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{money(payment.amount)}</td>
                    <td className="px-6 py-4 text-slate-600">{new Date(payment.dueDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-slate-600">{payment.paidDate ? new Date(payment.paidDate).toLocaleDateString() : '—'}</td>
                    <td className="px-6 py-4 text-slate-600">{payment.method}</td>
                    <td className="px-6 py-4">
                      <span className={cn('px-2.5 py-1 rounded-md text-xs font-semibold border capitalize', statusClass(payment.status))}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
