import React, { useEffect, useState } from 'react';
import { ArrowLeft, Building, DoorOpen, MapPin, Plus } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

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

interface Unit {
  id: string;
  number: string;
  floor: number;
  bedrooms: number;
  bathrooms: number;
  rent: number;
  status: string;
}

export const LandlordPropertyDetails = () => {
  const { id } = useParams();
  const { fetchWithAuth } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDetails() {
      if (!id) return;
      try {
        setLoading(true);
        const [propertyResponse, unitsResponse] = await Promise.all([
          fetchWithAuth(`/api/properties/${id}`),
          fetchWithAuth(`/api/units?propertyId=${encodeURIComponent(id)}`),
        ]);
        const [propertyData, unitsData] = await Promise.all([
          propertyResponse.json(),
          unitsResponse.json(),
        ]);
        if (!propertyResponse.ok || !propertyData.success) {
          throw new Error(propertyData.error || 'Unable to load property.');
        }
        if (!unitsResponse.ok || !unitsData.success) {
          throw new Error(unitsData.error || 'Unable to load property units.');
        }
        setProperty(propertyData.data);
        setUnits(unitsData.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load property details.');
      } finally {
        setLoading(false);
      }
    }

    loadDetails();
  }, [fetchWithAuth, id]);

  if (loading) {
    return <div className="flex-1 p-8 text-center text-slate-600">Loading property...</div>;
  }

  if (error || !property) {
    return (
      <div className="flex-1 p-4 sm:p-8">
        <Link to="/landlord/properties" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-indigo-600">
          <ArrowLeft className="h-4 w-4" /> Back to properties
        </Link>
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error || 'Property not found.'}
        </div>
      </div>
    );
  }

  const occupiedUnits = units.filter((unit) => unit.status.toLowerCase() === 'occupied').length;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Link to="/landlord/properties" className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700">
          <ArrowLeft className="h-4 w-4" /> Back to properties
        </Link>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div>
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Building className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">{property.name}</h1>
              <p className="mt-2 flex items-center gap-2 text-slate-500">
                <MapPin className="h-4 w-4 shrink-0" />
                {property.address}, {property.city}, {property.state}
              </p>
            </div>
            <Link
              to={`/landlord/units?propertyId=${encodeURIComponent(property.id)}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" /> Add Unit
            </Link>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-4">
            <div><p className="text-sm text-slate-500">Status</p><p className="mt-1 font-semibold text-slate-900">{property.status}</p></div>
            <div><p className="text-sm text-slate-500">Manager</p><p className="mt-1 font-semibold text-slate-900">{property.manager}</p></div>
            <div><p className="text-sm text-slate-500">Registered units</p><p className="mt-1 font-semibold text-slate-900">{units.length}</p></div>
            <div><p className="text-sm text-slate-500">Occupied</p><p className="mt-1 font-semibold text-slate-900">{occupiedUnits}</p></div>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <DoorOpen className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Units</h2>
          </div>
          {units.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
              No unit records yet. Use Add Unit to create the first one.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              {units.map((unit) => (
                <div key={unit.id} className="grid grid-cols-2 gap-3 border-b border-slate-100 p-4 last:border-b-0 sm:grid-cols-5 sm:items-center">
                  <p className="font-semibold text-slate-900">Unit {unit.number}</p>
                  <p className="text-sm text-slate-600">Floor {unit.floor}</p>
                  <p className="text-sm text-slate-600">{unit.bedrooms} bed / {unit.bathrooms} bath</p>
                  <p className="text-sm text-slate-600">${unit.rent.toLocaleString()} / mo</p>
                  <p className="text-sm capitalize text-slate-600">{unit.status.replace('_', ' ')}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};