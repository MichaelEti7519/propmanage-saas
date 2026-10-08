import React, { useEffect, useMemo, useState } from 'react';
import {
  Building,
  Search,
  Plus,
  MapPin,
  Users,
  Home,
  Filter,
  DollarSign,
  X,
  Pencil,
  Trash2,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  units: number;
  occupancy: number;
  status: string;
  manager: string;
}

const propertyImages = [
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500&q=80',
  'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=500&q=80',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=500&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500&q=80',
];

export const LandlordProperties = () => {
  const { fetchWithAuth } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    units: '0',
    manager: 'Acme Property Management',
  });

  useEffect(() => {
    async function loadProperties() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetchWithAuth('/api/properties');
        const data = await response.json();

        if (!response.ok || !data?.success) {
          throw new Error(data?.error || 'Unable to load properties.');
        }

        setProperties(data.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load properties.');
      } finally {
        setLoading(false);
      }
    }

    loadProperties();
  }, [fetchWithAuth]);

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const address = `${property.address}, ${property.city}, ${property.state}`;
      const matchesSearch =
        property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        address.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = filterType === 'All' || property.status === filterType;
      return matchesSearch && matchesType;
    });
  }, [properties, searchTerm, filterType]);

  const handleFieldChange = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmitProperty = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.name.trim() || !form.address.trim() || !form.city.trim() || !form.state.trim()) {
      setFormError('Please complete the property name, address, city, and state.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const response = await fetchWithAuth(
        editingProperty ? `/api/properties/${editingProperty.id}` : '/api/properties',
        {
        method: editingProperty ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          units: Number(form.units || 0),
          manager: form.manager.trim() || 'Acme Property Management',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Unable to create property.');
      }

      setProperties((current) => editingProperty
        ? current.map((property) => property.id === editingProperty.id ? data.data : property)
        : [data.data, ...current]);
      setForm({
        name: '',
        address: '',
        city: '',
        state: '',
        units: '0',
        manager: 'Acme Property Management',
      });
      setEditingProperty(null);
      setIsFormOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to create property.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditProperty = (property: Property) => {
    setEditingProperty(property);
    setForm({
      name: property.name,
      address: property.address,
      city: property.city,
      state: property.state,
      units: String(property.units),
      manager: property.manager,
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleDeleteProperty = async (property: Property) => {
    if (!window.confirm(`Delete ${property.name}? This cannot be undone.`)) return;

    setActionError(null);
    try {
      const response = await fetchWithAuth(`/api/properties/${property.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Unable to delete property.');
      }
      setProperties((current) => current.filter((item) => item.id !== property.id));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to delete property.');
    }
  };

  return (
    <div className="p-4 sm:p-8 flex-1 overflow-y-auto mb-16 md:mb-0 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Building className="w-8 h-8 text-indigo-600" />
              Property Portfolio
            </h1>
            <p className="text-slate-500 mt-1">Manage and monitor all your rental properties.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingProperty(null);
              setForm({ name: '', address: '', city: '', state: '', units: '0', manager: 'Acme Property Management' });
              setIsFormOpen(true);
            }}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Property
          </button>
        </div>

        {actionError && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {actionError}
          </div>
        )}

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search properties by name or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors bg-slate-50"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full sm:w-auto pl-9 pr-8 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none bg-slate-50 font-medium text-slate-700 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
            Loading properties...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && filteredProperties.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
            No properties match your current search.
          </div>
        )}

        {!loading && !error && filteredProperties.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProperties.map((property, index) => {
              const occupancyRate = property.units > 0 ? (property.occupancy / property.units) * 100 : 0;
              const fullAddress = `${property.address}, ${property.city}, ${property.state}`;

              return (
                <div key={property.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="relative h-48 w-full overflow-hidden">
                    <img
                      src={propertyImages[index % propertyImages.length]}
                      alt={property.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <span className={cn(
                        'px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-sm border',
                        property.status === 'Active' ? 'bg-emerald-500/90 text-white border-emerald-400' : 'bg-amber-500/90 text-white border-amber-400'
                      )}>
                        {property.status}
                      </span>
                    </div>
                    <div className="absolute top-4 right-4 flex gap-1">
                      <button type="button" title="Edit property" onClick={() => openEditProperty(property)} className="p-1.5 bg-white/90 backdrop-blur-md hover:bg-white text-slate-600 rounded-lg shadow-sm transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button type="button" title="Delete property" onClick={() => handleDeleteProperty(property)} className="p-1.5 bg-white/90 backdrop-blur-md hover:bg-white text-red-600 rounded-lg shadow-sm transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-xl font-bold text-slate-900 truncate pr-2">{property.name}</h3>
                        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 whitespace-nowrap">
                          {property.manager}
                        </span>
                      </div>
                      <div className="flex items-start gap-1.5 text-slate-500 text-sm mt-2">
                        <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-400" />
                        <p className="line-clamp-2">{fullAddress}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4 border-t border-slate-100">
                      <div>
                        <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                          <Home className="w-4 h-4" />
                          <span className="text-xs font-medium uppercase tracking-wider">Units</span>
                        </div>
                        <p className="font-semibold text-slate-900">
                          {property.occupancy} <span className="text-slate-400 font-normal">/ {property.units}</span>
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                          <Users className="w-4 h-4" />
                          <span className="text-xs font-medium uppercase tracking-wider">Occupancy</span>
                        </div>
                        <p className="font-semibold text-slate-900">{Math.round(occupancyRate)}%</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                        <DollarSign className="w-4 h-4 text-emerald-500" />
                        $0 <span className="text-slate-500 text-sm font-normal">/mo</span>
                      </div>
                      <Link to={`/landlord/properties/${property.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                        View Details &rarr;
                      </Link>
                    </div>
                  </div>

                  <div className="h-1 w-full bg-slate-100">
                    <div
                      className={cn(
                        'h-full',
                        occupancyRate >= 90 ? 'bg-emerald-500' : occupancyRate >= 75 ? 'bg-indigo-500' : 'bg-amber-500'
                      )}
                      style={{ width: `${Math.min(occupancyRate, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{editingProperty ? 'Edit Property' : 'Add Property'}</h2>
                  <p className="text-sm text-slate-500">{editingProperty ? 'Update property information' : 'Create a new rental property'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setFormError(null);
                    setEditingProperty(null);
                  }}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitProperty} className="space-y-5 p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700">Property name</label>
                    <input
                      value={form.name}
                      onChange={(event) => handleFieldChange('name', event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Sunset Villas"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700">Street address</label>
                    <input
                      value={form.address}
                      onChange={(event) => handleFieldChange('address', event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="123 Harbor Drive"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">City</label>
                    <input
                      value={form.city}
                      onChange={(event) => handleFieldChange('city', event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Springfield"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">State</label>
                    <input
                      value={form.state}
                      onChange={(event) => handleFieldChange('state', event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="IL"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Total units</label>
                    <input
                      type="number"
                      min="0"
                      value={form.units}
                      onChange={(event) => handleFieldChange('units', event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Manager</label>
                    <input
                      value={form.manager}
                      onChange={(event) => handleFieldChange('manager', event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Acme Property Management"
                    />
                  </div>
                </div>

                {formError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {formError}
                  </div>
                )}

                <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormOpen(false);
                      setFormError(null);
                      setEditingProperty(null);
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {submitting ? 'Saving...' : editingProperty ? 'Save Changes' : 'Save Property'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
