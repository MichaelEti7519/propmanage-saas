import { useEffect, useMemo, useState } from 'react';
import { Bath, BedDouble, CalendarDays, Clock3, Home, MapPin, Search } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface Listing {
  id: string;
  number: string;
  floor: number;
  bedrooms: number;
  bathrooms: number;
  rent: number;
  description?: string | null;
  property: { id: string; name: string; city: string; state: string };
}

interface ViewingRequest {
  id: string;
  status: 'pending' | 'approved' | 'declined' | 'cancelled';
  message?: string | null;
  createdAt: string;
  unit: {
    id: string;
    number: string;
    rent: number;
    property: { name: string; city: string; state: string };
  };
}

const money = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

const statusLabels: Record<ViewingRequest['status'], string> = {
  pending: 'Awaiting reply',
  approved: 'Viewing confirmed',
  declined: 'Not available',
  cancelled: 'Cancelled',
};

export function TenantHomes() {
  const { fetchWithAuth } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [requests, setRequests] = useState<ViewingRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'homes' | 'requests'>('homes');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadHomes() {
      try {
        setLoading(true);
        setError(null);
        const [listingResponse, requestResponse] = await Promise.all([
          fetch('/api/listings'),
          fetchWithAuth('/api/viewing-requests'),
        ]);
        const [listingData, requestData] = await Promise.all([
          listingResponse.json(),
          requestResponse.json(),
        ]);
        if (!listingResponse.ok || !listingData.success) {
          throw new Error(listingData.error || 'Unable to load available homes.');
        }
        if (!requestResponse.ok || !requestData.success) {
          throw new Error(requestData.error || 'Unable to load your viewing requests.');
        }
        setListings(listingData.data);
        setRequests(requestData.data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load homes.');
      } finally {
        setLoading(false);
      }
    }

    void loadHomes();
  }, [fetchWithAuth]);

  const filteredListings = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return listings;
    return listings.filter((listing) =>
      `${listing.property.name} ${listing.property.city} ${listing.property.state} ${listing.number}`
        .toLowerCase()
        .includes(query),
    );
  }, [listings, search]);

  const activeRequestsByUnit = new Map(
    requests
      .filter((request) => request.status === 'pending' || request.status === 'approved')
      .map((request) => [request.unit.id, request.status]),
  );

  const requestViewing = async (listing: Listing) => {
    setSubmittingId(listing.id);
    setActionError(null);
    try {
      const response = await fetchWithAuth('/api/viewing-requests', {
        method: 'POST',
        body: JSON.stringify({ unitId: listing.id }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to request a viewing.');
      }

      setRequests((current) => [{
        ...data.data,
        unit: {
          id: listing.id,
          number: listing.number,
          rent: listing.rent,
          property: listing.property,
        },
      }, ...current]);
      setActiveTab('requests');
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : 'Unable to request a viewing.');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="min-h-full bg-[#FAF8F3] p-4 sm:p-8">
      <div className="mx-auto max-w-6xl space-y-7">
        <header className="border-b border-[#E8DDCC] pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#397451]">Find a place</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-[#332D29] sm:text-4xl">Available homes</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#756B61]">
            Browse homes and request a viewing with your account email. A request does not reserve or assign a home.
          </p>
        </header>

        <div className="flex gap-6 border-b border-[#E8DDCC]" role="tablist" aria-label="Homes and viewing requests">
          <button type="button" role="tab" aria-selected={activeTab === 'homes'} onClick={() => setActiveTab('homes')} className={`border-b-2 px-1 pb-3 text-sm font-semibold ${activeTab === 'homes' ? 'border-[#397451] text-[#332D29]' : 'border-transparent text-[#756B61] hover:text-[#332D29]'}`}>
            Browse homes
          </button>
          <button type="button" role="tab" aria-selected={activeTab === 'requests'} onClick={() => setActiveTab('requests')} className={`border-b-2 px-1 pb-3 text-sm font-semibold ${activeTab === 'requests' ? 'border-[#397451] text-[#332D29]' : 'border-transparent text-[#756B61] hover:text-[#332D29]'}`}>
            My requests{requests.length > 0 ? ` (${requests.length})` : ''}
          </button>
        </div>

        {error && <p role="alert" className="border-l-2 border-[#B44036] bg-white px-4 py-3 text-sm text-[#8F3028]">{error}</p>}
        {actionError && <p role="alert" className="border-l-2 border-[#B44036] bg-white px-4 py-3 text-sm text-[#8F3028]">{actionError}</p>}

        {activeTab === 'homes' ? (
          <section aria-label="Available homes" className="space-y-5">
            <label className="relative block max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#756B61]" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by property or area" className="w-full border border-[#E8DDCC] bg-white py-2.5 pl-9 pr-3 text-sm text-[#332D29] outline-none focus:border-[#397451]" />
            </label>

            {loading ? (
              <p className="py-10 text-center text-sm text-[#756B61]">Loading homes...</p>
            ) : filteredListings.length === 0 ? (
              <div className="border-y border-[#E8DDCC] py-12 text-center">
                <Home className="mx-auto h-8 w-8 text-[#B9A58B]" />
                <p className="mt-3 text-sm font-semibold text-[#332D29]">No available homes found</p>
                <p className="mt-1 text-sm text-[#756B61]">Try another search or check back later.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredListings.map((listing) => (
                  <article key={listing.id} className="border border-[#E8DDCC] bg-white p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#397451]">Unit {listing.number}</p>
                        <h2 className="mt-1 text-xl font-semibold text-[#332D29]">{listing.property.name}</h2>
                        <p className="mt-2 flex items-center gap-1.5 text-sm text-[#756B61]"><MapPin className="h-4 w-4" />{listing.property.city}, {listing.property.state}</p>
                      </div>
                      <p className="text-right text-lg font-semibold text-[#332D29]">{money.format(listing.rent)}<span className="block text-xs font-normal text-[#756B61]">per month</span></p>
                    </div>
                    <div className="mt-5 flex gap-5 border-y border-[#EEE8DE] py-3 text-xs text-[#5E554D]">
                      <span className="inline-flex items-center gap-1.5"><BedDouble className="h-4 w-4 text-[#397451]" />{listing.bedrooms} bedrooms</span>
                      <span className="inline-flex items-center gap-1.5"><Bath className="h-4 w-4 text-[#397451]" />{listing.bathrooms} bathrooms</span>
                      <span>Floor {listing.floor}</span>
                    </div>
                    {listing.description && <p className="mt-4 whitespace-pre-line text-sm leading-6 text-[#5E554D]">{listing.description}</p>}
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                      <p className="max-w-xs text-xs leading-5 text-[#756B61]">Your account email will be shared with the landlord. No documents required.</p>
                      <button type="button" onClick={() => void requestViewing(listing)} disabled={activeRequestsByUnit.has(listing.id) || submittingId === listing.id} className="inline-flex min-h-10 items-center justify-center gap-2 bg-[#332D29] px-4 text-sm font-semibold text-white hover:bg-[#397451] disabled:cursor-not-allowed disabled:bg-[#756B61]">
                        {activeRequestsByUnit.get(listing.id) === 'approved' ? <><CalendarDays className="h-4 w-4" /> Viewing confirmed</> : activeRequestsByUnit.has(listing.id) ? <><Clock3 className="h-4 w-4" /> Request sent</> : <><CalendarDays className="h-4 w-4" />{submittingId === listing.id ? 'Sending...' : 'Request a viewing'}</>}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section aria-label="Your viewing requests" className="divide-y divide-[#E8DDCC] border-y border-[#E8DDCC] bg-white">
            {requests.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-[#756B61]">You have not requested any viewings yet.</p>
            ) : requests.map((request) => (
              <article key={request.id} className="flex flex-col justify-between gap-3 px-5 py-5 sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-semibold text-[#332D29]">{request.unit.property.name} · Unit {request.unit.number}</h2>
                  <p className="mt-1 text-sm text-[#756B61]">{request.unit.property.city}, {request.unit.property.state} · {money.format(request.unit.rent)} / month</p>
                  <p className="mt-1 text-xs text-[#756B61]">Requested {new Date(request.createdAt).toLocaleDateString()}</p>
                  {request.message && <p className="mt-2 text-sm text-[#5E554D]">{request.message}</p>}
                </div>
                <span className={`inline-flex w-fit items-center gap-2 border px-3 py-1.5 text-xs font-semibold ${request.status === 'approved' ? 'border-[#C9DCCF] bg-[#E7F0EA] text-[#397451]' : request.status === 'declined' ? 'border-[#EBCBC7] bg-[#F8E6E3] text-[#B44036]' : 'border-[#E8DDCC] bg-[#FAF8F3] text-[#5E554D]'}`}>
                  {request.status === 'approved' ? <CalendarDays className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
                  {statusLabels[request.status]}
                </span>
              </article>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}