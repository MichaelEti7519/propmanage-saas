import React, { useEffect, useMemo, useState } from 'react';
import { Building, Search, Filter, ChevronDown, MapPin, Users, Shield, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';

interface AdminProperty {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  units: number;
  occupancy: number;
  status: string;
  manager: string;
  landlordId: string;
  landlordName?: string;
  landlordEmail?: string;
  createdAt?: string;
}

const statusClass = (status: string) =>
  status === 'Active'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : status === 'Maintenance'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-slate-100 text-slate-600 border-slate-200';

export const AdminProperties = () => {
  const { fetchWithAuth } = useAuth();
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadProperties() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchWithAuth('/api/properties');
        const data = await response.json();
        if (!response.ok || !data?.success) throw new Error(data?.error || 'Unable to load properties.');
        if (!cancelled) setProperties(Array.isArray(data.data) ? data.data : []);
      } catch (loadError) {
        if (!cancelled) {
          setProperties([]);
          setError(loadError instanceof Error ? loadError.message : 'Unable to load properties.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProperties();
    return () => {
      cancelled = true;
    };
  }, [fetchWithAuth, refreshKey]);

  const visibleProperties = useMemo(() => {
    const term = search.trim().toLowerCase();
    return properties.filter((property) => {
      const haystack = `${property.name} ${property.address} ${property.city} ${property.state} ${property.landlordName ?? ''}`.toLowerCase();
      const matchesSearch = !term || haystack.includes(term);
      const matchesStatus = statusFilter === 'All' || property.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [properties, search, statusFilter]);

  const totalUnits = properties.reduce((sum, property) => sum + property.units, 0);
  const occupiedUnits = properties.reduce((sum, property) => sum + property.occupancy, 0);
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  return (
    <div className="p-4 sm:p-8 flex-1 overflow-y-auto mb-16 md:mb-0 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Building className="w-8 h-8 text-indigo-600" />
              Global Properties
            </h1>
            <p className="text-slate-500 mt-1">Platform-wide directory of every registered property across all landlords.</p>
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
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Properties</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{properties.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Units</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{totalUnits}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Occupied</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{occupiedUnits}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Portfolio occupancy</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{occupancyRate}%</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search properties, addresses, or landlords..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter properties by status"
              className="w-full sm:w-auto pl-9 pr-8 py-2 border border-slate-200 rounded-xl bg-slate-50 font-medium text-slate-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="All">All statuses</option>
              <option value="Active">Active</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Pending Verification">Pending verification</option>
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
            <table className="w-full min-w-[880px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Property</th>
                  <th className="px-6 py-4">Landlord / Account</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Units</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">Loading properties...</td>
                  </tr>
                )}
                {!loading && !error && visibleProperties.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                      {properties.length === 0 ? 'No properties have been registered yet.' : 'No properties match your current search.'}
                    </td>
                  </tr>
                )}
                {!loading && visibleProperties.map((property) => {
                  const isOpen = expandedId === property.id;
                  return (
                    <React.Fragment key={property.id}>
                      <tr className="hover:bg-slate-50 transition-colors text-sm">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-900">{property.name}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{property.address}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="flex items-center gap-2 font-medium text-indigo-700">
                            <Shield className="w-4 h-4" /> {property.landlordName || 'Unassigned'}
                          </span>
                          {property.landlordEmail && <p className="mt-0.5 text-xs text-slate-500">{property.landlordEmail}</p>}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            {property.city}, {property.state}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-slate-400" />
                            {property.occupancy} / {property.units}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn('px-2.5 py-1 rounded-md text-xs font-semibold border', statusClass(property.status))}>
                            {property.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            aria-label={isOpen ? `Hide details for ${property.name}` : `Show details for ${property.name}`}
                            aria-expanded={isOpen}
                            onClick={() => setExpandedId(isOpen ? null : property.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
                          </button>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-slate-50/70 text-sm">
                          <td colSpan={6} className="px-6 py-4">
                            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                              <div>
                                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Manager</dt>
                                <dd className="mt-1 text-slate-800">{property.manager || 'Not recorded'}</dd>
                              </div>
                              <div>
                                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Full address</dt>
                                <dd className="mt-1 text-slate-800">{property.address}, {property.city}, {property.state}</dd>
                              </div>
                              <div>
                                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Occupancy</dt>
                                <dd className="mt-1 text-slate-800">
                                  {property.units > 0 ? Math.round((property.occupancy / property.units) * 100) : 0}%
                                </dd>
                              </div>
                              <div>
                                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Added</dt>
                                <dd className="mt-1 text-slate-800">
                                  {property.createdAt ? new Date(property.createdAt).toLocaleDateString() : 'Not recorded'}
                                </dd>
                              </div>
                            </dl>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
