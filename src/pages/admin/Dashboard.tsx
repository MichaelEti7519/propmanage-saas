import React, { useEffect, useMemo, useState } from 'react';
import {
  Shield,
  Search,
  X,
  Building,
  Users,
  UserCheck,
  Wrench,
  ChevronRight,
  RefreshCw,
  FileText,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';

interface PlatformOverview {
  propertyCount: number;
  unitCount: number;
  occupiedUnits: number;
  vacantUnits: number;
  occupancyRate: number;
  landlordCount: number;
  accountCount: number;
  tenantCount: number;
  activeTenantCount: number;
  openMaintenance: number;
  pendingPayments: number;
  overduePayments: number;
  openReports: number;
  rentByStatus: { paid: number; pending: number; overdue: number };
  recentProperties: { id: string; name: string; city: string; state: string; status: string; landlordName: string; createdAt: string }[];
  recentReports: { id: string; targetType: string; targetName: string | null; reason: string; status: string; riskBand: string; createdAt: string }[];
  recentMaintenance: { id: string; title: string; status: string; priority: string; propertyName: string; unitNumber: string; createdAt: string }[];
}

interface AccountMatch {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'landlord' | 'tenant' | 'admin';
}

interface PropertyMatch {
  id: string;
  name: string;
  city: string;
  state: string;
  landlordName?: string;
}

interface MaintenanceMatch {
  id: string;
  title: string;
  status: string;
  priority: string;
  propertyName?: string;
  unitNumber?: string;
}

const money = (value: number) => `$${value.toLocaleString()}`;

const maintenanceStatusClass = (status: string) => ({
  open: 'bg-amber-50 text-amber-700 border-amber-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  closed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}[status] ?? 'bg-slate-100 text-slate-600 border-slate-200');

const maintenanceStatusLabel = (status: string) => ({
  open: 'Open',
  in_progress: 'In progress',
  closed: 'Closed',
}[status] ?? status);

const reportStatusClass = (status: string) => ({
  open: 'bg-amber-50 text-amber-700 border-amber-200',
  reviewing: 'bg-blue-50 text-blue-700 border-blue-200',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  dismissed: 'bg-slate-100 text-slate-600 border-slate-200',
}[status] ?? 'bg-slate-100 text-slate-600 border-slate-200');

export const AdminDashboard = () => {
  const { fetchWithAuth } = useAuth();
  const navigate = useNavigate();
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [accounts, setAccounts] = useState<AccountMatch[]>([]);
  const [properties, setProperties] = useState<PropertyMatch[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceMatch[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError(null);
      try {
        const [overviewResponse, accountsResponse, propertiesResponse, maintenanceResponse] = await Promise.all([
          fetchWithAuth('/api/admin/overview'),
          fetchWithAuth('/api/admin/users'),
          fetchWithAuth('/api/properties'),
          fetchWithAuth('/api/maintenance'),
        ]);
        const overviewData = await overviewResponse.json();
        const accountsData = await accountsResponse.json();
        const propertiesData = await propertiesResponse.json();
        const maintenanceData = await maintenanceResponse.json();

        if (!overviewResponse.ok || !overviewData?.success) throw new Error(overviewData?.error || 'Unable to load the platform overview.');
        if (cancelled) return;

        setOverview(overviewData.data as PlatformOverview);
        setAccounts(Array.isArray(accountsData?.data) ? accountsData.data : []);
        setProperties(Array.isArray(propertiesData?.data) ? propertiesData.data : []);
        setMaintenance(Array.isArray(maintenanceData?.data) ? maintenanceData.data : []);
      } catch (loadError) {
        if (!cancelled) {
          setOverview(null);
          setError(loadError instanceof Error ? loadError.message : 'Unable to load the platform overview.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [fetchWithAuth, refreshKey]);

  const term = searchQuery.trim().toLowerCase();

  const accountMatches = useMemo(() => {
    if (!term) return [];
    return accounts
      .filter((account) => `${account.firstName} ${account.lastName} ${account.email}`.toLowerCase().includes(term))
      .slice(0, 5);
  }, [accounts, term]);

  const propertyMatches = useMemo(() => {
    if (!term) return [];
    return properties
      .filter((property) => `${property.name} ${property.city} ${property.state} ${property.landlordName ?? ''}`.toLowerCase().includes(term))
      .slice(0, 5);
  }, [properties, term]);

  const maintenanceMatches = useMemo(() => {
    if (!term) return [];
    return maintenance
      .filter((request) => `${request.title} ${request.propertyName ?? ''} ${request.unitNumber ?? ''}`.toLowerCase().includes(term))
      .slice(0, 5);
  }, [maintenance, term]);

  const hasResults = accountMatches.length + propertyMatches.length + maintenanceMatches.length > 0;

  const goTo = (path: string) => {
    setSearchQuery('');
    navigate(path);
  };

  const metrics = overview
    ? [
        {
          label: 'Global properties',
          value: overview.propertyCount.toLocaleString(),
          detail: `${overview.unitCount} units · ${overview.occupancyRate}% occupied`,
          icon: Building,
          iconClass: 'bg-amber-50 text-amber-600',
        },
        {
          label: 'Landlord accounts',
          value: overview.landlordCount.toLocaleString(),
          detail: `${overview.accountCount} accounts in total`,
          icon: UserCheck,
          iconClass: 'bg-emerald-50 text-emerald-600',
        },
        {
          label: 'Active tenants',
          value: overview.activeTenantCount.toLocaleString(),
          detail: `${overview.tenantCount} tenant records`,
          icon: Users,
          iconClass: 'bg-blue-50 text-blue-600',
        },
        {
          label: 'Open maintenance',
          value: overview.openMaintenance.toLocaleString(),
          detail: `${overview.openReports} open report${overview.openReports === 1 ? '' : 's'}`,
          icon: Wrench,
          iconClass: 'bg-indigo-50 text-indigo-600',
        },
      ]
    : [];

  return (
    <div className="p-4 sm:p-8 flex-1 overflow-y-auto mb-16 md:mb-0 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Shield className="w-8 h-8 text-indigo-600" />
              Super Admin Dashboard
            </h1>
            <p className="text-slate-500 mt-1">Live counts across every landlord, property, tenant, and open case.</p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setRefreshKey((key) => key + 1)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <div className="w-full sm:w-72 md:w-96 relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search accounts, properties, requests..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow shadow-sm"
                />
                {term.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {term.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[70vh] overflow-y-auto">
                  <div className="p-3 border-b border-slate-100 bg-slate-50">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Results for "{searchQuery}"</p>
                  </div>

                  {!hasResults && (
                    <p className="px-4 py-6 text-center text-sm text-slate-500">Nothing on the platform matches that search.</p>
                  )}

                  <div className="divide-y divide-slate-100">
                    {accountMatches.length > 0 && (
                      <div className="p-2">
                        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <Users className="w-3.5 h-3.5" /> Accounts
                        </div>
                        {accountMatches.map((account) => (
                          <button
                            key={account.id}
                            type="button"
                            onClick={() => goTo('/admin/tenants')}
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg flex items-center justify-between group transition-colors"
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 text-sm truncate">{account.firstName} {account.lastName}</p>
                              <p className="text-xs text-slate-500 capitalize">{account.role} · {account.email}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    )}

                    {propertyMatches.length > 0 && (
                      <div className="p-2">
                        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <Building className="w-3.5 h-3.5" /> Properties
                        </div>
                        {propertyMatches.map((property) => (
                          <button
                            key={property.id}
                            type="button"
                            onClick={() => goTo('/admin/properties')}
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg flex items-center justify-between group transition-colors"
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 text-sm truncate">{property.name}</p>
                              <p className="text-xs text-slate-500">
                                {property.city}, {property.state}
                                {property.landlordName ? ` · ${property.landlordName}` : ''}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    )}

                    {maintenanceMatches.length > 0 && (
                      <div className="p-2">
                        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <Wrench className="w-3.5 h-3.5" /> Maintenance
                        </div>
                        {maintenanceMatches.map((request) => (
                          <button
                            key={request.id}
                            type="button"
                            onClick={() => goTo('/admin/maintenance')}
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg flex items-center justify-between group transition-colors"
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 text-sm truncate">{request.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-md border', maintenanceStatusClass(request.status))}>
                                  {maintenanceStatusLabel(request.status)}
                                </span>
                                <span className="text-xs text-slate-500">{request.priority} priority</span>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && !overview && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            Loading platform overview...
          </div>
        )}

        {overview && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {metrics.map((metric) => (
                <div key={metric.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className={cn('mb-4 flex h-12 w-12 items-center justify-center rounded-xl', metric.iconClass)}>
                    <metric.icon className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">{metric.label}</p>
                  <h3 className="text-2xl font-black text-slate-900 mt-1">{metric.value}</h3>
                  <p className="mt-1 text-xs text-slate-500">{metric.detail}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Building className="w-5 h-5 text-indigo-500" />
                    Recently added properties
                  </h3>
                  <button
                    type="button"
                    onClick={() => navigate('/admin/properties')}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    View all
                  </button>
                </div>
                {overview.recentProperties.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">No properties have been registered yet.</p>
                ) : (
                  <div className="space-y-3">
                    {overview.recentProperties.map((property) => (
                      <div key={property.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{property.name}</p>
                          <p className="mt-0.5 text-sm text-slate-500 truncate">
                            {property.landlordName || 'Unassigned'} · {property.city}, {property.state}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <span className={cn(
                            'rounded-md border px-2 py-0.5 text-xs font-semibold',
                            property.status === 'Active'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-amber-200 bg-amber-50 text-amber-700'
                          )}>
                            {property.status}
                          </span>
                          <p className="mt-1 text-xs text-slate-400">{new Date(property.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Platform signals
                </h3>
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">Occupancy</span>
                      <span className="text-sm font-bold text-slate-900">{overview.occupancyRate}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${overview.occupancyRate}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{overview.occupiedUnits} occupied · {overview.vacantUnits} vacant</p>
                  </div>
                  <dl className="divide-y divide-slate-100 text-sm">
                    <div className="flex items-center justify-between py-3">
                      <dt className="text-slate-600">Open reports</dt>
                      <dd className="font-semibold text-red-700">{overview.openReports}</dd>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <dt className="text-slate-600">Pending payments</dt>
                      <dd className="font-semibold text-slate-900">{overview.pendingPayments}</dd>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <dt className="text-slate-600">Overdue payments</dt>
                      <dd className="font-semibold text-red-700">{overview.overduePayments}</dd>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <dt className="text-slate-600">Outstanding rent</dt>
                      <dd className="font-semibold text-slate-900">
                        {money(overview.rentByStatus.pending + overview.rentByStatus.overdue)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 p-6">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-500" />
                    Latest reports
                  </h3>
                  <button
                    type="button"
                    onClick={() => navigate('/admin/reports')}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    Review queue
                  </button>
                </div>
                <div className="divide-y divide-slate-100">
                  {overview.recentReports.length === 0 && (
                    <p className="p-6 text-center text-sm text-slate-500">No reports have been submitted.</p>
                  )}
                  {overview.recentReports.map((report) => (
                    <div key={report.id} className="p-4 sm:px-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">
                            {report.targetName || `${report.targetType} · ${report.id}`}
                          </p>
                          <p className="mt-0.5 text-sm text-slate-600 truncate">{report.reason}</p>
                        </div>
                        <span className={cn('flex-shrink-0 rounded-md border px-2 py-0.5 text-xs font-semibold capitalize', reportStatusClass(report.status))}>
                          {report.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        {report.riskBand} risk · {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 p-6">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-indigo-500" />
                    Latest maintenance
                  </h3>
                  <button
                    type="button"
                    onClick={() => navigate('/admin/maintenance')}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    View all
                  </button>
                </div>
                <div className="divide-y divide-slate-100">
                  {overview.recentMaintenance.length === 0 && (
                    <p className="p-6 text-center text-sm text-slate-500">No open maintenance requests.</p>
                  )}
                  {overview.recentMaintenance.map((request) => (
                    <div key={request.id} className="p-4 sm:px-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{request.title}</p>
                          <p className="mt-0.5 text-sm text-slate-600 truncate">
                            {request.propertyName} · Unit {request.unitNumber}
                          </p>
                        </div>
                        <span className={cn('flex-shrink-0 rounded-md border px-2 py-0.5 text-xs font-semibold', maintenanceStatusClass(request.status))}>
                          {maintenanceStatusLabel(request.status)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        {request.priority} priority · {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
              <p>
                These figures are counted from the live database. There is no subscription billing in this build, so
                no MRR, uptime, or storage numbers are reported.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
