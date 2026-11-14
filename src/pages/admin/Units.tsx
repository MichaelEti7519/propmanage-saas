import React, { useEffect, useMemo, useState } from 'react';
import { Box, Search, Filter, Home, BedDouble, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';

interface AdminUnit {
  id: string;
  propertyId: string;
  number: string;
  floor: number;
  bedrooms: number;
  bathrooms: number;
  rent: number;
  status: string;
  tenantId?: string;
}

interface AdminPropertyRef {
  id: string;
  name: string;
}

const statusClass = (status: string) =>
  status === 'occupied'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : status === 'maintenance'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-slate-100 text-slate-600 border-slate-200';

const statusLabel = (status: string) =>
  status === 'in_progress' ? 'In progress' : status.charAt(0).toUpperCase() + status.slice(1);

const money = (value: number) => `$${value.toLocaleString()}`;

export const AdminUnits = () => {
  const { fetchWithAuth } = useAuth();
  const [units, setUnits] = useState<AdminUnit[]>([]);
  const [properties, setProperties] = useState<AdminPropertyRef[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadUnits() {
      setLoading(true);
      setError(null);
      try {
        const [unitsResponse, propertiesResponse] = await Promise.all([
          fetchWithAuth('/api/units'),
          fetchWithAuth('/api/properties'),
        ]);
        const unitsData = await unitsResponse.json();
        const propertiesData = await propertiesResponse.json();
        if (!unitsResponse.ok || !unitsData?.success) throw new Error(unitsData?.error || 'Unable to load units.');
        if (!propertiesResponse.ok || !propertiesData?.success) throw new Error(propertiesData?.error || 'Unable to load properties.');
        if (cancelled) return;
        setUnits(Array.isArray(unitsData.data) ? unitsData.data : []);
        setProperties(Array.isArray(propertiesData.data) ? propertiesData.data : []);
      } catch (loadError) {
        if (!cancelled) {
          setUnits([]);
          setProperties([]);
          setError(loadError instanceof Error ? loadError.message : 'Unable to load units.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadUnits();
    return () => {
      cancelled = true;
    };
  }, [fetchWithAuth, refreshKey]);

  const propertyNames = useMemo(
    () => properties.reduce<Record<string, string>>((names, property) => {
      names[property.id] = property.name;
      return names;
    }, {}),
    [properties]
  );

  const visibleUnits = useMemo(() => {
    const term = search.trim().toLowerCase();
    return units.filter((unit) => {
      const propertyName = propertyNames[unit.propertyId] ?? '';
      const haystack = `${unit.number} ${propertyName}`.toLowerCase();
      const matchesSearch = !term || haystack.includes(term);
      const matchesStatus = statusFilter === 'All' || unit.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [units, propertyNames, search, statusFilter]);

  const counts = useMemo(() => ({
    occupied: units.filter((unit) => unit.status === 'occupied').length,
    vacant: units.filter((unit) => unit.status === 'vacant').length,
    maintenance: units.filter((unit) => unit.status === 'maintenance').length,
  }), [units]);

  return (
    <div className="p-4 sm:p-8 flex-1 overflow-y-auto mb-16 md:mb-0 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Box className="w-8 h-8 text-indigo-600" />
              Global Units
            </h1>
            <p className="text-slate-500 mt-1">Every unit on the platform, with its property and live occupancy state.</p>
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
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Total units</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{units.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Occupied</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{counts.occupied}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Vacant</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{counts.vacant}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">In maintenance</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">{counts.maintenance}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by unit number or property..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter units by status"
              className="w-full sm:w-auto pl-9 pr-8 py-2 border border-slate-200 rounded-xl bg-slate-50 font-medium text-slate-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="All">All statuses</option>
              <option value="vacant">Vacant</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
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
            <table className="w-full min-w-[820px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">Unit</th>
                  <th className="px-6 py-4">Property</th>
                  <th className="px-6 py-4">Layout</th>
                  <th className="px-6 py-4">Floor</th>
                  <th className="px-6 py-4">Rent</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">Loading units...</td>
                  </tr>
                )}
                {!loading && !error && visibleUnits.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                      {units.length === 0 ? 'No units have been created yet.' : 'No units match your current search.'}
                    </td>
                  </tr>
                )}
                {!loading && visibleUnits.map((unit) => (
                  <tr key={unit.id} className="hover:bg-slate-50 transition-colors text-sm">
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-2 font-semibold text-slate-900">
                        <Home className="w-4 h-4 text-slate-400" /> Unit {unit.number}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{propertyNames[unit.propertyId] ?? 'Unknown property'}</td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="flex items-center gap-1">
                        <BedDouble className="w-4 h-4 text-slate-400" />
                        {unit.bedrooms} bd · {unit.bathrooms} ba
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{unit.floor}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{money(unit.rent)}<span className="text-xs font-normal text-slate-500"> /mo</span></td>
                    <td className="px-6 py-4">
                      <span className={cn('px-2.5 py-1 rounded-md text-xs font-semibold border', statusClass(unit.status))}>
                        {statusLabel(unit.status)}
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
