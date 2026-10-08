import React, { useEffect, useMemo, useState } from 'react';
import {
  DollarSign,
  Search,
  Filter,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Download,
  Building,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';

interface PaymentRecord {
  id: string;
  tenantId: string;
  unitId: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'paid' | 'pending' | 'overdue';
  method: string;
}

interface TenantRecord {
  id: string;
  firstName: string;
  lastName: string;
  unitId?: string;
}

interface UnitRecord {
  id: string;
  propertyId: string;
  number: string;
  rent: number;
  status: string;
}

interface PropertyRecord {
  id: string;
  name: string;
}

const displayStatus = (value: PaymentRecord['status']) =>
  value === 'paid' ? 'Paid' : value === 'pending' ? 'Pending' : 'Overdue';

export const LandlordPayments = () => {
  const { fetchWithAuth } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [units, setUnits] = useState<UnitRecord[]>([]);
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    tenantId: '',
    unitId: '',
    amount: '',
    dueDate: new Date().toISOString().slice(0, 10),
    status: 'pending' as PaymentRecord['status'],
    method: 'Manual',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [paymentsRes, tenantsRes, unitsRes, propertiesRes] = await Promise.all([
          fetchWithAuth('/api/payments'),
          fetchWithAuth('/api/tenants'),
          fetchWithAuth('/api/units'),
          fetchWithAuth('/api/properties'),
        ]);

        const paymentData = await paymentsRes.json() as { success?: boolean; data?: PaymentRecord[] };
        const tenantData = await tenantsRes.json() as { success?: boolean; data?: TenantRecord[] };
        const unitData = await unitsRes.json() as { success?: boolean; data?: UnitRecord[] };
        const propertyData = await propertiesRes.json() as { success?: boolean; data?: PropertyRecord[] };

        if (paymentsRes.ok && paymentData.success) setPayments(paymentData.data ?? []);
        if (tenantsRes.ok && tenantData.success) setTenants(tenantData.data ?? []);
        if (unitsRes.ok && unitData.success) setUnits(unitData.data ?? []);
        if (propertiesRes.ok && propertyData.success) setProperties(propertyData.data ?? []);
      } catch (error) {
        console.error('Failed to load payment data:', error);
      }
    };

    void loadData();
  }, [fetchWithAuth]);

  const rows = useMemo(() => payments.map((payment) => {
    const tenant = tenants.find((item) => item.id === payment.tenantId);
    const unit = units.find((item) => item.id === payment.unitId);
    const property = unit ? properties.find((item) => item.id === unit.propertyId) : undefined;

    return {
      ...payment,
      tenantName: tenant ? `${tenant.firstName} ${tenant.lastName}` : payment.tenantId,
      propertyName: property?.name ?? 'Unknown property',
      unitLabel: unit?.number ?? payment.unitId,
    };
  }), [payments, properties, tenants, units]);

  const filteredPayments = rows.filter((payment) => {
    const search = `${payment.tenantName} ${payment.propertyName} ${payment.id}`.toLowerCase();
    const matchesSearch = search.includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || displayStatus(payment.status) === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Paid':
        return { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
      case 'Pending':
        return { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
      case 'Overdue':
        return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
      default:
        return { icon: Clock, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' };
    }
  };

  const totalCollected = payments.filter((payment) => payment.status === 'paid').reduce((sum, payment) => sum + Number(payment.amount), 0);
  const totalPending = payments.filter((payment) => payment.status === 'pending').reduce((sum, payment) => sum + Number(payment.amount), 0);
  const totalOverdue = payments.filter((payment) => payment.status === 'overdue').reduce((sum, payment) => sum + Number(payment.amount), 0);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.tenantId || !form.unitId || !form.amount) {
      return;
    }

    setSaving(true);

    try {
      const response = await fetchWithAuth('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: form.tenantId,
          unitId: form.unitId,
          amount: Number(form.amount),
          dueDate: form.dueDate,
          status: form.status,
          method: form.method,
          paidDate: form.status === 'paid' ? form.dueDate : undefined,
        }),
      });

      const result = await response.json() as { success?: boolean; data?: PaymentRecord; error?: string };
      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || 'Could not create payment.');
      }

      setPayments((current) => [result.data!, ...current]);
      setForm({
        tenantId: '',
        unitId: '',
        amount: '',
        dueDate: new Date().toISOString().slice(0, 10),
        status: 'pending',
        method: 'Manual',
      });
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Failed to create payment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 flex-1 overflow-y-auto mb-16 md:mb-0 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <DollarSign className="w-8 h-8 text-emerald-600" />
              Rent & Payments
            </h1>
            <p className="text-slate-500 mt-1">Track rental income, pending payments, and overdues.</p>
          </div>
          <button className="px-4 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-medium shadow-sm transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-500">Collected</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">${totalCollected.toLocaleString()}</h3>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-500">Pending</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">${totalPending.toLocaleString()}</h3>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-500">Overdue</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">${totalOverdue.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4 text-slate-900 font-semibold">
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            Record Payment
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
            <select
              value={form.tenantId}
              onChange={(event) => setForm((current) => ({ ...current, tenantId: event.target.value }))}
              className="px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">Tenant</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>{tenant.firstName} {tenant.lastName}</option>
              ))}
            </select>

            <select
              value={form.unitId}
              onChange={(event) => setForm((current) => ({ ...current, unitId: event.target.value }))}
              className="px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">Unit</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>{unit.number}</option>
              ))}
            </select>

            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
              placeholder="Amount"
              className="px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />

            <input
              type="date"
              value={form.dueDate}
              onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
              className="px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />

            <select
              value={form.status}
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as PaymentRecord['status'] }))}
              className="px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>

            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white rounded-xl font-medium shadow-sm transition-colors"
            >
              {saving ? 'Saving...' : 'Save Payment'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by tenant, property, or invoice..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm transition-shadow"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(event) => setFilterStatus(event.target.value)}
                className="w-full sm:w-auto pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none font-medium text-slate-700 text-sm cursor-pointer transition-shadow"
              >
                <option value="All">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tenant / Property</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice / Date</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Method</th>
                  <th className="py-3 px-6 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((payment) => {
                  const statusText = displayStatus(payment.status);
                  const statusConfig = getStatusConfig(statusText);
                  const StatusIcon = statusConfig.icon;
                  return (
                    <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900 mb-0.5">{payment.tenantName}</div>
                        <div className="text-sm text-slate-500 flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          {payment.propertyName} - {payment.unitLabel}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-slate-700 mb-0.5">{payment.id}</div>
                        <div className="text-sm text-slate-500">{new Date(payment.dueDate).toLocaleDateString()}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900">${Number(payment.amount).toLocaleString()}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border',
                          statusConfig.bg,
                          statusConfig.color,
                          statusConfig.border,
                        )}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusText}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-600">{payment.method}</td>
                      <td className="py-4 px-6 text-right">
                        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredPayments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-lg font-medium text-slate-900">No payments found</p>
                      <p className="text-sm">Try adjusting your search or filters.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
