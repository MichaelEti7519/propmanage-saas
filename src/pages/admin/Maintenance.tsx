import React, { useEffect, useMemo, useState } from 'react';
import { Wrench, Search, Filter, RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';

interface AdminMaintenanceRequest {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'closed';
  priority: 'Low' | 'Medium' | 'High';
  propertyName?: string;
  unitNumber?: string;
  tenantName?: string;
  createdAt: string;
}

const statusClass = (status: AdminMaintenanceRequest['status']) => ({
  open: 'bg-amber-50 text-amber-700 border-amber-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  closed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}[status]);

const statusLabel = (status: AdminMaintenanceRequest['status']) => ({
  open: 'Open',
  in_progress: 'In progress',
  closed: 'Closed',
}[status]);

const priorityClass = (priority: AdminMaintenanceRequest['priority']) => ({
  High: 'text-red-700',
  Medium: 'text-amber-700',
  Low: 'text-slate-600',
}[priority]);

export const AdminMaintenance = () => {
  const { fetchWithAuth } = useAuth();
  const [requests, setRequests] = useState<AdminMaintenanceRequest[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AdminMaintenanceRequest['status']>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadRequests() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchWithAuth('/api/maintenance');
        const data = await response.json();
        if (!response.ok || !data?.success) throw new Error(data?.error || 'Unable to load maintenance requests.');
        if (!cancelled) setRequests(Array.isArray(data.data) ? data.data : []);
      } catch (loadError) {
        if (!cancelled) {
          setRequests([]);
          setError(loadError instanceof Error ? loadError.message : 'Unable to load maintenance requests.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadRequests();
    return () => {
      cancelled = true;
    };
  }, [fetchWithAuth, refreshKey]);

  const visibleRequests = useMemo(() => {
    const term = search.trim().toLowerCase();
    return requests.filter((request) => {
      const haystack = `${request.title} ${request.description} ${request.propertyName ?? ''} ${request.unitNumber ?? ''} ${request.tenantName ?? ''}`.toLowerCase();
      const matchesSearch = !term || haystack.includes(term);
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requests, search, statusFilter]);

  const counts = useMemo(() => ({
    open: requests.filter((request) => request.status === 'open').length,
    inProgress: requests.filter((request) => request.status === 'in_progress').length,
    closed: requests.filter((request) => request.status === 'closed').length,
    highPriorityOpen: requests.filter((request) => request.priority === 'High' && request.status !== 'closed').length,
  }), [requests]);

  return (
    <div className="p-4 sm:p-8 flex-1 overflow-y-auto mb-16 md:mb-0 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Wrench className="w-8 h-8 text-indigo-600" />
              Global Maintenance
            </h1>
            <p className="text-slate-500 mt-1">Every maintenance request raised on the platform, with its property and tenant.</p>
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey((key) => key + 1)}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 sm:self-auto"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Open</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">{counts.open}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">In progress</p>
            <p className="mt-1 text-2xl font-bold text-blue-700">{counts.inProgress}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Closed</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{counts.closed}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">High priority open</p>
            <p className="mt-1 text-2xl font-bold text-red-700">{counts.highPriorityOpen}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by issue, property, or tenant..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              aria-label="Filter requests by status"
              className="w-full sm:w-auto pl-9 pr-8 py-2 border border-slate-200 rounded-xl bg-slate-50 font-medium text-slate-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="closed">Closed</option>
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
            <table className="w-full min-w-[920px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Request</th>
                  <th className="px-6 py-4">Property / Unit</th>
                  <th className="px-6 py-4">Tenant</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Opened</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">Loading maintenance requests...</td>
                  </tr>
                )}
                {!loading && !error && visibleRequests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                      {requests.length === 0 ? 'No maintenance requests have been raised yet.' : 'No requests match your current search.'}
                    </td>
                  </tr>
                )}
                {!loading && visibleRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50 transition-colors text-sm">
                    <td className="px-6 py-4 max-w-xs">
                      <p className="font-semibold text-slate-900">{request.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{request.description}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {request.propertyName ?? 'Unknown property'}
                      {request.unitNumber ? ` · Unit ${request.unitNumber}` : ''}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{request.tenantName ?? 'Unknown tenant'}</td>
                    <td className="px-6 py-4">
                      <span className={cn('inline-flex items-center gap-1 font-semibold', priorityClass(request.priority))}>
                        {request.priority === 'High' && <AlertTriangle className="w-3.5 h-3.5" />}
                        {request.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn('px-2.5 py-1 rounded-md text-xs font-semibold border', statusClass(request.status))}>
                        {statusLabel(request.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{new Date(request.createdAt).toLocaleDateString()}</td>
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
