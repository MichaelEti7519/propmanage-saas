import React, { useEffect, useState } from 'react';
import {
  Building,
  Search,
  Plus,
  Home,
  Users,
  DoorOpen,
  DollarSign,
  Wrench,
  CheckCircle2,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';

interface Property {
  id: string;
  name: string;
}

interface ApiUnit {
  id: string;
  propertyId: string;
  number: string;
  floor: number;
  bedrooms: number;
  bathrooms: number;
  rent: number;
  status: string;
  tenantId?: string;
  isListed?: boolean;
  listingDescription?: string;
}

interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
  unitId?: string;
  leaseEnd?: string;
}

interface Unit extends ApiUnit {
  property: string;
  tenant?: string;
  leaseEnd?: string;
}

const inputClassName = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20';

export const LandlordUnits = () => {
  const { fetchWithAuth } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedPropertyId = searchParams.get('propertyId');
  const [units, setUnits] = useState<Unit[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterProperty, setFilterProperty] = useState(requestedPropertyId || 'All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [listingError, setListingError] = useState<string | null>(null);
  const [updatingListingId, setUpdatingListingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    propertyId: requestedPropertyId || '',
    number: '',
    floor: '1',
    bedrooms: '1',
    bathrooms: '1',
    rent: '0',
    status: 'vacant',
    listingDescription: '',
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const [unitsResponse, propertiesResponse, tenantsResponse] = await Promise.all([
          fetchWithAuth('/api/units'),
          fetchWithAuth('/api/properties'),
          fetchWithAuth('/api/tenants'),
        ]);
        const [unitsData, propertiesData, tenantsData] = await Promise.all([
          unitsResponse.json(),
          propertiesResponse.json(),
          tenantsResponse.json(),
        ]);
        if (!unitsResponse.ok || !unitsData.success) throw new Error(unitsData.error || 'Unable to load units.');
        if (!propertiesResponse.ok || !propertiesData.success) throw new Error(propertiesData.error || 'Unable to load properties.');
        if (!tenantsResponse.ok || !tenantsData.success) throw new Error(tenantsData.error || 'Unable to load tenants.');

        const propertyList = propertiesData.data as Property[];
        const tenantList = tenantsData.data as Tenant[];
        const propertyById = new Map(propertyList.map((property) => [property.id, property]));
        const tenantById = new Map(tenantList.map((tenant) => [tenant.id, tenant]));
        setProperties(propertyList);
        setUnits((unitsData.data as ApiUnit[]).map((unit) => {
          const tenant = unit.tenantId ? tenantById.get(unit.tenantId) : undefined;
          return {
            ...unit,
            property: propertyById.get(unit.propertyId)?.name || 'Unknown property',
            tenant: tenant ? `${tenant.firstName} ${tenant.lastName}` : undefined,
            leaseEnd: tenant?.leaseEnd,
          };
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load units.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [fetchWithAuth]);

  const filteredUnits = units.filter((unit) => {
    const normalizedStatus = unit.status.toLowerCase();
    const matchesSearch = unit.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (unit.tenant?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus = filterStatus === 'All' || normalizedStatus === filterStatus.toLowerCase();
    const matchesProperty = filterProperty === 'All' || unit.propertyId === filterProperty;
    return matchesSearch && matchesStatus && matchesProperty;
  });

  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'occupied':
        return { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
      case 'vacant':
        return { icon: DoorOpen, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
      case 'maintenance':
        return { icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
      default:
        return { icon: Home, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' };
    }
  };

  const openCreateForm = () => {
    setForm({
      propertyId: requestedPropertyId || (properties.length === 1 ? properties[0].id : ''),
      number: '',
      floor: '1',
      bedrooms: '1',
      bathrooms: '1',
      rent: '0',
      status: 'vacant',
      listingDescription: '',
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleCreateUnit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.propertyId || !form.number.trim()) {
      setFormError('Choose a property and enter a unit number.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const response = await fetchWithAuth('/api/units', {
        method: 'POST',
        body: JSON.stringify({
          propertyId: form.propertyId,
          number: form.number.trim(),
          floor: Number(form.floor),
          bedrooms: Number(form.bedrooms),
          bathrooms: Number(form.bathrooms),
          rent: Number(form.rent),
          status: form.status,
          listingDescription: form.listingDescription.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to create unit.');
      const property = properties.find((item) => item.id === form.propertyId);
      setUnits((current) => [{ ...data.data, property: property?.name || 'Unknown property' }, ...current]);
      setIsFormOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to create unit.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleListing = async (unit: Unit) => {
    setListingError(null);
    setUpdatingListingId(unit.id);
    try {
      const response = await fetchWithAuth(`/api/units/${unit.id}/listing`, {
        method: 'PUT',
        body: JSON.stringify({
          isListed: !unit.isListed,
          listingDescription: unit.listingDescription ?? '',
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to update listing.');
      setUnits((current) => current.map((item) => item.id === unit.id ? { ...item, ...data.data } : item));
    } catch (err) {
      setListingError(err instanceof Error ? err.message : 'Unable to update listing.');
    } finally {
      setUpdatingListingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-8 flex-1 overflow-y-auto mb-16 md:mb-0 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <DoorOpen className="w-8 h-8 text-indigo-600" />
              Units Management
            </h1>
            <p className="text-slate-500 mt-1">Manage individual units, vacancies, and tenant assignments.</p>
          </div>
          <button type="button" onClick={openCreateForm} disabled={properties.length === 0} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm transition-colors flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50">
            <Plus className="w-4 h-4" /> Add Unit
          </button>
        </div>

        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}
        {listingError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{listingError}</div>}
        {!loading && properties.length === 0 && !error && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">Create a property before adding units.</div>
        )}

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by unit, property, or tenant..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50" />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <select aria-label="Filter by property" value={filterProperty} onChange={(event) => setFilterProperty(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-medium text-slate-700">
              <option value="All">All Properties</option>
              {properties.map((property) => <option key={property.id} value={property.id}>{property.name}</option>)}
            </select>
            <select aria-label="Filter by unit status" value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-medium text-slate-700">
              <option value="All">All Statuses</option><option value="Occupied">Occupied</option><option value="Vacant">Vacant</option><option value="Maintenance">Maintenance</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">Loading units...</div>
        ) : filteredUnits.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredUnits.map((unit) => {
              const status = unit.status.charAt(0).toUpperCase() + unit.status.slice(1);
              const statusConfig = getStatusConfig(unit.status);
              const StatusIcon = statusConfig.icon;
              return (
                <div key={unit.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                  <div className="p-5 flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">Unit {unit.number}</h3>
                        <div className="flex items-center gap-1.5 text-slate-500 text-sm mt-1"><Building className="w-3.5 h-3.5" /><p className="truncate max-w-[150px]">{unit.property}</p></div>
                      </div>
                      <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase border', statusConfig.bg, statusConfig.color, statusConfig.border)}><StatusIcon className="w-3.5 h-3.5" />{status}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 py-4 border-y border-slate-100 mb-4">
                      <div className="text-center"><div className="text-lg font-bold text-slate-900">{unit.bedrooms}</div><div className="text-xs font-medium text-slate-500 uppercase">Beds</div></div>
                      <div className="text-center border-x border-slate-100"><div className="text-lg font-bold text-slate-900">{unit.bathrooms}</div><div className="text-xs font-medium text-slate-500 uppercase">Baths</div></div>
                      <div className="text-center"><div className="text-lg font-bold text-slate-900">{unit.floor}</div><div className="text-xs font-medium text-slate-500 uppercase">Floor</div></div>
                    </div>
                    <div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">Monthly Rent</span><span className="font-bold text-slate-900 flex items-center"><DollarSign className="w-4 h-4 text-emerald-500" />{unit.rent.toLocaleString()}</span></div>
                    {unit.tenant && <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3"><Users className="w-4 h-4 text-indigo-600" /><span className="truncate text-sm font-semibold text-slate-900">{unit.tenant}</span></div>}
                  </div>
                  <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-500">{unit.tenant ? `Lease ends: ${unit.leaseEnd || 'Not set'}` : status === 'Vacant' ? 'Ready for rent' : 'Work in progress'}</span>
                    {unit.status === 'vacant' && (
                      <button
                        type="button"
                        onClick={() => toggleListing(unit)}
                        disabled={updatingListingId === unit.id}
                        aria-pressed={Boolean(unit.isListed)}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-wait disabled:opacity-60"
                      >
                        {unit.isListed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        {unit.isListed ? 'Unlist' : 'List home'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center"><DoorOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" /><h3 className="text-lg font-bold text-slate-900 mb-1">No units found</h3><p className="text-slate-500">Try adjusting your search or filters, or add a unit.</p></div>
        )}

        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4"><div><h2 className="text-xl font-bold text-slate-900">Add Unit</h2><p className="text-sm text-slate-500">Create a unit under one of your properties</p></div><button type="button" onClick={() => setIsFormOpen(false)} aria-label="Close form" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
              <form onSubmit={handleCreateUnit} className="space-y-5 p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1 text-sm font-medium text-slate-700 sm:col-span-2">Property
                    <select value={form.propertyId} onChange={(event) => setForm((current) => ({ ...current, propertyId: event.target.value }))} className={inputClassName} required><option value="">Select a property</option>{properties.map((property) => <option key={property.id} value={property.id}>{property.name}</option>)}</select>
                  </label>
                  <label className="space-y-1 text-sm font-medium text-slate-700">Unit number<input value={form.number} onChange={(event) => setForm((current) => ({ ...current, number: event.target.value }))} className={inputClassName} placeholder="2A" required /></label>
                  <label className="space-y-1 text-sm font-medium text-slate-700">Floor<input type="number" min="0" value={form.floor} onChange={(event) => setForm((current) => ({ ...current, floor: event.target.value }))} className={inputClassName} /></label>
                  <label className="space-y-1 text-sm font-medium text-slate-700">Bedrooms<input type="number" min="0" value={form.bedrooms} onChange={(event) => setForm((current) => ({ ...current, bedrooms: event.target.value }))} className={inputClassName} /></label>
                  <label className="space-y-1 text-sm font-medium text-slate-700">Bathrooms<input type="number" min="0" step="1" value={form.bathrooms} onChange={(event) => setForm((current) => ({ ...current, bathrooms: event.target.value }))} className={inputClassName} /></label>
                  <label className="space-y-1 text-sm font-medium text-slate-700">Monthly rent<input type="number" min="0" value={form.rent} onChange={(event) => setForm((current) => ({ ...current, rent: event.target.value }))} className={inputClassName} /></label>
                  <label className="space-y-1 text-sm font-medium text-slate-700">Status<select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className={inputClassName}><option value="vacant">Vacant</option><option value="maintenance">Maintenance</option></select></label>
                  <label className="space-y-1 text-sm font-medium text-slate-700 sm:col-span-2">Public listing description (optional)<textarea maxLength={1000} value={form.listingDescription} onChange={(event) => setForm((current) => ({ ...current, listingDescription: event.target.value }))} className={inputClassName} rows={3} placeholder="Describe the home and its features. Do not include private documents or personal information." /></label>
                </div>
                {formError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>}
                <div className="flex justify-end gap-3 border-t border-slate-200 pt-4"><button type="button" onClick={() => setIsFormOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50">Cancel</button><button type="submit" disabled={submitting} className="rounded-xl bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-70">{submitting ? 'Saving...' : 'Save Unit'}</button></div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};