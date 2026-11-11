import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, Clock3, Mail, MapPin, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface ViewingRequest {
  id: string;
  status: 'pending' | 'approved' | 'declined' | 'cancelled';
  message?: string | null;
  createdAt: string;
  tenantEmail?: string;
  unit: {
    id: string;
    number: string;
    rent: number;
    property: { name: string; city: string; state: string };
  };
}

type RequestFilter = 'pending' | 'all';

const money = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

export function LandlordViewings() {
  const { fetchWithAuth } = useAuth();
  const [requests, setRequests] = useState<ViewingRequest[]>([]);
  const [filter, setFilter] = useState<RequestFilter>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadRequests() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchWithAuth('/api/viewing-requests');
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'Unable to load viewing requests.');
        setRequests(data.data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load viewing requests.');
      } finally {
        setLoading(false);
      }
    }

    void loadRequests();
  }, [fetchWithAuth]);

  const visibleRequests = useMemo(() => filter === 'pending'
    ? requests.filter((request) => request.status === 'pending')
    : requests, [filter, requests]);

  const updateRequest = async (request: ViewingRequest, status: 'approved' | 'declined') => {
    setUpdatingId(request.id);
    setError(null);
    try {
      const response = await fetchWithAuth(`/api/viewing-requests/${request.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to update viewing request.');
      setRequests((current) => current.map((item) => item.id === request.id ? { ...item, status: data.data.status } : item));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update viewing request.');
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingCount = requests.filter((request) => request.status === 'pending').length;

  return (
    <div className="min-h-full bg-[#FAF8F3] p-4 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-7">
        <header className="flex flex-col justify-between gap-4 border-b border-[#E8DDCC] pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#397451]">Property enquiries</p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-[#332D29] sm:text-4xl">Viewing requests</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#756B61]">Review requests for your listed homes. Confirming a viewing does not approve a tenancy or assign the unit.</p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 text-sm font-medium text-[#5E554D]"><CalendarDays className="h-4 w-4 text-[#397451]" />{pendingCount} awaiting reply</span>
        </header>

        <div className="flex gap-2" role="group" aria-label="Filter viewing requests">
          <button type="button" onClick={() => setFilter('pending')} aria-pressed={filter === 'pending'} className={`min-h-10 px-4 text-sm font-semibold ${filter === 'pending' ? 'bg-[#332D29] text-white' : 'border border-[#E8DDCC] bg-white text-[#5E554D]'}`}>Pending ({pendingCount})</button>
          <button type="button" onClick={() => setFilter('all')} aria-pressed={filter === 'all'} className={`min-h-10 px-4 text-sm font-semibold ${filter === 'all' ? 'bg-[#332D29] text-white' : 'border border-[#E8DDCC] bg-white text-[#5E554D]'}`}>All requests</button>
        </div>

        {error && <p role="alert" className="border-l-2 border-[#B44036] bg-white px-4 py-3 text-sm text-[#8F3028]">{error}</p>}

        {loading ? (
          <p className="py-10 text-center text-sm text-[#756B61]">Loading requests...</p>
        ) : visibleRequests.length === 0 ? (
          <div className="border-y border-[#E8DDCC] py-12 text-center">
            <CalendarDays className="mx-auto h-8 w-8 text-[#B9A58B]" />
            <p className="mt-3 text-sm font-semibold text-[#332D29]">{filter === 'pending' ? 'No pending viewing requests' : 'No viewing requests yet'}</p>
            <p className="mt-1 text-sm text-[#756B61]">Requests arrive here when tenants ask to view one of your listed vacant homes.</p>
          </div>
        ) : (
          <section aria-label="Viewing requests" className="divide-y divide-[#E8DDCC] border-y border-[#E8DDCC] bg-white">
            {visibleRequests.map((request) => (
              <article key={request.id} className="flex flex-col justify-between gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <h2 className="font-semibold text-[#332D29]">{request.unit.property.name} · Unit {request.unit.number}</h2>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${request.status === 'pending' ? 'text-[#95651D]' : request.status === 'approved' ? 'text-[#397451]' : 'text-[#756B61]'}`}>
                      {request.status === 'pending' ? <Clock3 className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                      {request.status === 'pending' ? 'Pending' : request.status === 'approved' ? 'Viewing confirmed' : request.status === 'declined' ? 'Declined' : 'Cancelled'}
                    </span>
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-[#756B61]"><MapPin className="h-4 w-4" />{request.unit.property.city}, {request.unit.property.state} · {money.format(request.unit.rent)} / month</p>
                  <a href={`mailto:${encodeURIComponent(request.tenantEmail ?? '')}`} className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-[#397451] underline underline-offset-2"><Mail className="h-4 w-4" />{request.tenantEmail}</a>
                  {request.message && <p className="mt-3 max-w-2xl whitespace-pre-line text-sm leading-6 text-[#5E554D]">{request.message}</p>}
                  <p className="mt-2 text-xs text-[#756B61]">Requested {new Date(request.createdAt).toLocaleDateString()}</p>
                </div>

                {request.status === 'pending' && (
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => void updateRequest(request, 'declined')} disabled={updatingId === request.id} className="inline-flex min-h-10 items-center gap-2 border border-[#E8DDCC] px-3 text-sm font-semibold text-[#5E554D] hover:bg-[#FAF8F3] disabled:opacity-60"><X className="h-4 w-4" />Decline</button>
                    <button type="button" onClick={() => void updateRequest(request, 'approved')} disabled={updatingId === request.id} className="inline-flex min-h-10 items-center gap-2 bg-[#332D29] px-3 text-sm font-semibold text-white hover:bg-[#397451] disabled:opacity-60"><Check className="h-4 w-4" />{updatingId === request.id ? 'Saving...' : 'Confirm viewing'}</button>
                  </div>
                )}
              </article>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}