import React, { useEffect, useState } from 'react';
import { 
  Users, Building, FileText, Settings, Bell, Search, 
  Menu, ShieldCheck, ShieldAlert, Shield, 
  Activity, CheckCircle2, ChevronRight, X, AlertCircle, FileDigit,
  Clock, CreditCard, Wrench, Copy, Mail
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import { ReportModal } from '../../components/ReportModal';

interface AvailableUnit {
  id: string;
  number: string;
  property: string;
  rent: number;
}

interface LandlordTenant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  unit: string;
  appliedDate: string;
  screeningStatus: string;
  screeningReport: any;
  leaseEnd?: string;
  rentAmount: number;
  leaseStatus?: string;
}

export function LandlordTenants() {
  const { fetchWithAuth } = useAuth();
  const [tenants, setTenants] = useState<LandlordTenant[]>([]);
  const [availableUnits, setAvailableUnits] = useState<AvailableUnit[]>([]);
  const [activeTab, setActiveTab] = useState<'Directory' | 'Lease Renewals'>('Directory');
  const [selectedTenant, setSelectedTenant] = useState<LandlordTenant | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [isLoadingTenants, setIsLoadingTenants] = useState(true);
  const [tenantLoadError, setTenantLoadError] = useState<string | null>(null);
  
  // Screening Workflow State
  const [isScreening, setIsScreening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [screeningOptions, setScreeningOptions] = useState({ credit: true, background: true, eviction: true });
  const [consentRequested, setConsentRequested] = useState(false);

  // Lease Renewal Workflow State
  const [isRenewingLease, setIsRenewingLease] = useState(false);
  const [renewalData, setRenewalData] = useState({ term: '12 Months', rentAmount: '', noticeSent: false });

  const [isAddTenantOpen, setIsAddTenantOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ targetType: 'tenant' | 'landlord'; targetId: string; targetName: string; tenantRef?: string } | null>(null);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteResult, setInviteResult] = useState<{ email: string; emailSent: boolean; inviteUrl: string; expiresAt: number } | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [isEditingTenant, setIsEditingTenant] = useState(false);
  const [editTenantData, setEditTenantData] = useState({ firstName: '', lastName: '', email: '', unit: '' });
  
  const [newTenantData, setNewTenantData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    unitId: '',
    leaseStart: '',
    leaseEnd: '',
  });

  useEffect(() => {
    async function loadTenants() {
      try {
        setTenantLoadError(null);
        const [tenantsResponse, unitsResponse, propertiesResponse] = await Promise.all([
          fetchWithAuth('/api/tenants'),
          fetchWithAuth('/api/units'),
          fetchWithAuth('/api/properties'),
        ]);
        const [tenantsData, unitsData, propertiesData] = await Promise.all([
          tenantsResponse.json(), unitsResponse.json(), propertiesResponse.json(),
        ]);
        if (!tenantsResponse.ok || !tenantsData.success) throw new Error(tenantsData.error || 'Unable to load tenants.');
        if (!unitsResponse.ok || !unitsData.success) throw new Error(unitsData.error || 'Unable to load units.');
        if (!propertiesResponse.ok || !propertiesData.success) throw new Error(propertiesData.error || 'Unable to load properties.');

        const unitsById = new Map<string, { id: string; number: string; propertyId: string }>(unitsData.data.map((unit: { id: string; number: string; propertyId: string }) => [unit.id, unit]));
        const propertiesById = new Map<string, string>(propertiesData.data.map((property: { id: string; name: string }) => [property.id, property.name]));
        const today = new Date().toISOString().slice(0, 10);
        setTenants(tenantsData.data.map((tenant: { id: string; firstName: string; lastName: string; email: string; status: string; unitId?: string; leaseStart?: string; leaseEnd?: string; rent: number }) => {
          const unit = tenant.unitId ? unitsById.get(tenant.unitId) : undefined;
          const leaseEndTime = tenant.leaseEnd ? new Date(tenant.leaseEnd).getTime() : 0;
          const daysUntilLeaseEnd = leaseEndTime ? (leaseEndTime - Date.now()) / (24 * 60 * 60 * 1000) : Infinity;
          return {
            id: tenant.id,
            firstName: tenant.firstName,
            lastName: tenant.lastName,
            email: tenant.email,
            status: tenant.status,
            unit: unit ? `${propertiesById.get(unit.propertyId) || 'Property'} - Unit ${unit.number}` : 'Unassigned',
            appliedDate: tenant.leaseStart || today,
            screeningStatus: 'none',
            screeningReport: null,
            leaseEnd: tenant.leaseEnd,
            rentAmount: tenant.rent,
            leaseStatus: daysUntilLeaseEnd <= 60 && daysUntilLeaseEnd >= 0 ? 'Expiring Soon' : tenant.leaseEnd ? 'Active' : undefined,
          };
        }));
      } catch (err) {
        setTenantLoadError(err instanceof Error ? err.message : 'Unable to load tenants.');
      } finally {
        setIsLoadingTenants(false);
      }
    }

    loadTenants();
  }, [fetchWithAuth]);

  useEffect(() => {
    async function loadAvailableUnits() {
      try {
        const [unitsResponse, propertiesResponse] = await Promise.all([
          fetchWithAuth('/api/units?status=vacant'),
          fetchWithAuth('/api/properties'),
        ]);
        const [unitsData, propertiesData] = await Promise.all([unitsResponse.json(), propertiesResponse.json()]);
        if (!unitsResponse.ok || !unitsData.success || !propertiesResponse.ok || !propertiesData.success) return;
        const propertiesById = new Map(propertiesData.data.map((property: { id: string; name: string }) => [property.id, property.name]));
        setAvailableUnits(unitsData.data
          .filter((unit: { status: string; tenantId?: string }) => unit.status.toLowerCase() === 'vacant' && !unit.tenantId)
          .map((unit: { id: string; propertyId: string; number: string; rent: number }) => ({
            id: unit.id,
            number: unit.number,
            property: propertiesById.get(unit.propertyId) || 'Property',
            rent: unit.rent,
          })));
      } catch {
        setInviteError('Unable to load vacant units. Refresh the page and try again.');
      }
    }

    loadAvailableUnits();
  }, [fetchWithAuth]);

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingInvite(true);
    setInviteError(null);
    try {
      const response = await fetchWithAuth('/api/tenant-invitations', {
        method: 'POST',
        body: JSON.stringify(newTenantData),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to create tenant invitation.');
      setInviteResult(data.data);
      setCopiedInvite(false);
      setIsAddTenantOpen(false);
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Unable to create tenant invitation.');
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleEditTenant = () => {
    if (!editTenantData.firstName || !editTenantData.lastName || !editTenantData.email) return;
    
    setTenants(prev => prev.map(t => {
      if (selectedTenant && t.id === selectedTenant.id) {
        const updated = {
          ...t,
          firstName: editTenantData.firstName,
          lastName: editTenantData.lastName,
          email: editTenantData.email,
          unit: editTenantData.unit
        };
        setSelectedTenant(updated);
        return updated;
      }
      return t;
    }));
    setIsEditingTenant(false);
  };

  const filteredTenants = tenants.filter(t => filterStatus === 'All' || t.status === filterStatus);

  const getScreeningBadge = (tenant: any) => {
    if (tenant.screeningStatus === 'completed') {
      if (tenant.screeningReport?.recommendation === 'Approve') {
        return (
          <div className="flex items-center gap-1.5 font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 w-fit">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-xs">Approve</span>
          </div>
        );
      }
      if (tenant.screeningReport?.recommendation === 'Review') {
        return (
          <div className="flex items-center gap-1.5 font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 w-fit">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span className="text-xs">Review</span>
          </div>
        );
      }
      if (tenant.screeningReport?.recommendation === 'Decline') {
        return (
          <div className="flex items-center gap-1.5 font-medium text-red-700 bg-red-50 px-2.5 py-1 rounded-md border border-red-200 w-fit">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <span className="text-xs">Decline</span>
          </div>
        );
      }
      return (
        <div className="flex items-center gap-1.5 font-medium text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200 w-fit">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span className="text-xs">Completed</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 w-fit">
        <Shield className="w-4 h-4 text-slate-500" />
        <span className="text-xs">Pending</span>
      </div>
    );
  };

  const runScreening = async (tenantId: string) => {
    setIsScreening(true);
    setError(null);
    try {
      const tenant = tenants.find(t => t.id === tenantId);
      if (!tenant) throw new Error("Tenant not found");

      const response = await fetch('/api/screen-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          firstName: tenant.firstName,
          lastName: tenant.lastName,
          email: tenant.email
        })
      });

      let data;
      try {
        data = await response.json();
      } catch (err) {
        throw new Error("Invalid response from server. Please try again later.");
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to communicate with the screening service. Please check your connection and try again.");
      }
      
      setTenants(prev => prev.map(t => 
        t.id === tenantId ? { ...t, screeningStatus: 'completed', screeningReport: data.report } : t
      ));
      
      if (selectedTenant && selectedTenant.id === tenantId) {
        setSelectedTenant(prev => prev ? { ...prev, screeningStatus: 'completed', screeningReport: data.report } : null);
      }
      
    } catch (err: any) {
      setError(err.message || "An error occurred during screening.");
    } finally {
      setIsScreening(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto p-4 sm:p-8 relative h-full">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-2xl font-bold text-slate-800">Tenants & Leases</h3>
            <div className="flex gap-6 mt-4">
              <button 
                onClick={() => setActiveTab('Directory')}
                className={cn(
                  "text-sm font-medium pb-4 -mb-[17px] transition-colors border-b-2",
                  activeTab === 'Directory' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                )}
              >
                Tenant Directory
              </button>
              <button 
                onClick={() => setActiveTab('Lease Renewals')}
                className={cn(
                  "text-sm font-medium pb-4 -mb-[17px] transition-colors border-b-2",
                  activeTab === 'Lease Renewals' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                )}
              >
                Lease Renewals {tenants.filter(t => t.leaseStatus === 'Expiring Soon').length > 0 && (
                  <span className="ml-1.5 bg-red-100 text-red-700 py-0.5 px-2 rounded-full text-[10px]">
                    {tenants.filter(t => t.leaseStatus === 'Expiring Soon').length}
                  </span>
                )}
              </button>
            </div>
          </div>
          <button 
            onClick={() => {
              setInviteError(null);
              setIsAddTenantOpen(true);
            }}
            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors whitespace-nowrap mb-1"
          >
            Invite Tenant
          </button>
        </div>

        {tenantLoadError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{tenantLoadError}</div>}
        {isLoadingTenants && activeTab === 'Directory' && <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading tenants...</div>}

        {activeTab === 'Directory' ? (
          <>
            {/* Filters */}
            <div className="flex gap-2 pb-2 overflow-x-auto">
              {['All', 'Active', 'Applicant'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                    filterStatus === status 
                      ? "bg-indigo-50 text-indigo-700" 
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {status} {status !== 'All' && `(${tenants.filter(t => t.status === status).length})`}
                </button>
              ))}
            </div>

        {/* Data Table Container */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  <th className="px-6 py-4 whitespace-nowrap">Name</th>
                  <th className="px-6 py-4 whitespace-nowrap">Unit</th>
                  <th className="px-6 py-4 whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 whitespace-nowrap">Applied</th>
                  <th className="px-6 py-4 whitespace-nowrap">Screening</th>
                  <th className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredTenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => { setSelectedTenant(tenant); setIsEditingTenant(false); setIsRenewingLease(false); setConsentRequested(false); }}>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{tenant.firstName} {tenant.lastName}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{tenant.email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700 whitespace-nowrap">{tenant.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
                        tenant.status === 'Active' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"
                      )}>
                        {tenant.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{new Date(tenant.appliedDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getScreeningBadge(tenant)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        className="text-indigo-600 hover:text-indigo-900 font-medium text-xs flex items-center justify-end w-full gap-1 tracking-wide whitespace-nowrap"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTenant(tenant);
                          setIsEditingTenant(false);
                          setIsRenewingLease(false);
                          setConsentRequested(false);
                        }}
                      >
                        View Details <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden flex flex-col divide-y divide-slate-100">
            {filteredTenants.map(tenant => (
              <div key={`mobile-card-${tenant.id}`} className="p-4 hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => { 
                setSelectedTenant(tenant); 
                setIsEditingTenant(false); 
                setIsRenewingLease(false); 
                setConsentRequested(false); 
              }}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium text-slate-900">{tenant.firstName} {tenant.lastName}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{tenant.email}</div>
                  </div>
                  <span className={cn(
                       "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border",
                       tenant.status === 'Active' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"
                     )}>
                       {tenant.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Unit</span>
                    <span className="text-slate-700 font-medium">{tenant.unit}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Applied</span>
                    <span className="text-slate-700 font-medium">{new Date(tenant.appliedDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-100 mt-1">
                   {getScreeningBadge(tenant)}
                   <button className="text-indigo-600 font-medium text-xs flex items-center gap-1">
                     View Details <ChevronRight className="w-3.5 h-3.5" />
                   </button>
                </div>
              </div>
            ))}
          </div>

          {filteredTenants.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">No tenants found.</div>
          )}
        </div>
        </>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Active Leases</span>
                <span className="block text-3xl font-bold text-slate-900 mt-2">{tenants.filter(t => t.leaseStatus === 'Active' || t.leaseStatus === 'Expiring Soon').length}</span>
              </div>
              <div className="bg-white p-5 rounded-xl border border-red-200 shadow-sm relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                <span className="text-red-600 text-xs uppercase tracking-wider font-semibold">Expiring &lt; 60 Days</span>
                <span className="block text-3xl font-bold text-slate-900 mt-2">{tenants.filter(t => t.leaseStatus === 'Expiring Soon').length}</span>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Renewal Rate</span>
                <span className="block text-3xl font-bold text-slate-900 mt-2">85%</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                    <th className="px-6 py-4 whitespace-nowrap">Tenant</th>
                    <th className="px-6 py-4 whitespace-nowrap">Unit</th>
                    <th className="px-6 py-4 whitespace-nowrap">Lease End</th>
                    <th className="px-6 py-4 whitespace-nowrap">Current Rent</th>
                    <th className="px-6 py-4 text-right whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {tenants.filter(t => t.leaseEnd).sort((a, b) => new Date(a.leaseEnd!).getTime() - new Date(b.leaseEnd!).getTime()).map(tenant => (
                    <tr key={`lease-${tenant.id}`} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{tenant.firstName} {tenant.lastName}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-700">{tenant.unit}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <span className={cn(
                             "font-medium",
                             tenant.leaseStatus === 'Expiring Soon' ? "text-red-600" : "text-slate-700"
                           )}>
                             {new Date(tenant.leaseEnd!).toLocaleDateString()}
                           </span>
                           {tenant.leaseStatus === 'Expiring Soon' && (
                             <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-100 px-1.5 py-0.5 rounded">Expiring</span>
                           )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">${tenant.rentAmount}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => { setSelectedTenant(tenant); setIsRenewingLease(true); }}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                            tenant.leaseStatus === 'Expiring Soon' 
                              ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                          )}
                        >
                          Configure Renewal
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Sliding Panel for Tenant Details */}
      <div className={cn(
        "fixed md:absolute top-0 right-0 h-full w-full sm:max-w-[600px] bg-white sm:border-l border-slate-200 shadow-[20px_0_60px_rgba(0,0,0,0.15)] transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] z-50 md:z-40 flex flex-col",
        selectedTenant ? "translate-x-0" : "translate-x-full"
      )}>
        {selectedTenant && (
          <>
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-white sticky top-0 z-10">
              <h3 className="font-semibold text-lg text-slate-900 flex items-center">
                {isRenewingLease ? 'Lease Renewal' : 'Tenant Details'}
              </h3>
              <div className="flex items-center gap-1">
                {!isEditingTenant && !isRenewingLease && (
                  <button 
                    onClick={() => {
                      setEditTenantData({
                        firstName: selectedTenant.firstName,
                        lastName: selectedTenant.lastName,
                        email: selectedTenant.email,
                        unit: selectedTenant.unit
                      });
                      setIsEditingTenant(true);
                    }}
                    className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-full transition-colors text-sm font-medium pr-3"
                  >
                    Edit
                  </button>
                )}
                {!isEditingTenant && !isRenewingLease && (
                  <button
                    onClick={() => setReportTarget({
                      targetType: 'tenant',
                      targetId: selectedTenant.id,
                      targetName: `${selectedTenant.firstName} ${selectedTenant.lastName}`,
                      tenantRef: selectedTenant.id,
                    })}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors text-sm font-medium pr-3"
                  >
                    Report
                  </button>
                  )}
                  <button
                    onClick={() => { setSelectedTenant(null); setIsEditingTenant(false); setIsRenewingLease(false); }}
                    className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    aria-label="Close tenant details"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {isRenewingLease ? (
                  <div className="space-y-6">
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                      <p className="text-sm text-indigo-900">
                        Current lease for {selectedTenant.firstName} {selectedTenant.lastName} ends on{' '}
                        <span className="font-bold">{selectedTenant.leaseEnd ? new Date(selectedTenant.leaseEnd).toLocaleDateString() : 'No end date set'}</span>.
                        {' '}Configure their new lease terms below.
                      </p>
                    </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">New Lease Term</label>
                      <select 
                        value={renewalData.term}
                        onChange={(e) => setRenewalData({...renewalData, term: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                      >
                        <option value="12 Months">12 Months (Standard)</option>
                        <option value="6 Months">6 Months</option>
                        <option value="Month-to-Month">Month-to-Month</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">New Rent Amount ($)</label>
                      <input 
                        type="number"
                        placeholder={`Current: $${selectedTenant.rentAmount}`}
                        value={renewalData.rentAmount}
                        onChange={(e) => setRenewalData({...renewalData, rentAmount: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium font-mono"
                      />
                      <p className="text-xs text-slate-500 mt-2">Recommended 5% increase: <span className="font-semibold text-slate-700">${Math.round((selectedTenant.rentAmount || 0) * 1.05)}</span></p>
                    </div>
                    
                    <div className="border-t border-slate-100 pt-6 mt-6">
                      {renewalData.noticeSent ? (
                        <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100 flex flex-col items-center justify-center text-center">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-3" />
                          <h4 className="font-bold text-emerald-900 mb-1">Renewal Offer Sent</h4>
                          <p className="text-sm text-emerald-700/80">The tenant has been notified and can review the new terms via their portal.</p>
                        </div>
                      ) : (
                        <button 
                          onClick={() => {
                            setRenewalData({...renewalData, noticeSent: true});
                            // Mock updating the actual list
                          }}
                          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          Send Renewal Offer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : isEditingTenant ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                      <input 
                        type="text" 
                        value={editTenantData.firstName}
                        onChange={e => setEditTenantData({...editTenantData, firstName: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                      <input 
                        type="text" 
                        value={editTenantData.lastName}
                        onChange={e => setEditTenantData({...editTenantData, lastName: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                    <input 
                      type="email" 
                      value={editTenantData.email}
                      onChange={e => setEditTenantData({...editTenantData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                    <input 
                      type="text" 
                      value={editTenantData.unit}
                      onChange={e => setEditTenantData({...editTenantData, unit: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" 
                    />
                  </div>
                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                    <button 
                      onClick={() => setIsEditingTenant(false)}
                      className="flex-1 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleEditTenant}
                      className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Header Info */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6 bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-100">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-2xl font-bold flex-shrink-0 shadow-sm border border-indigo-200/50">
                      {selectedTenant.firstName[0]}{selectedTenant.lastName[0]}
                    </div>
                    <div className="mt-1 sm:mt-0 flex-1">
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{selectedTenant.firstName} {selectedTenant.lastName}</h2>
                      <p className="text-slate-500 mt-1 sm:text-lg break-all">{selectedTenant.email}</p>
                      <div className="flex flex-wrap gap-2.5 mt-4">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold border bg-white border-slate-200 text-slate-700 shadow-sm">
                          {selectedTenant.unit}
                        </span>
                        <span className={cn(
                          "inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold border shadow-sm",
                          selectedTenant.status === 'Active' ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-blue-50 border-blue-200 text-blue-700"
                        )}>
                          {selectedTenant.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Screening Section */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      Background Screening
                    </h3>
                    
                    {selectedTenant.screeningStatus === 'completed' && selectedTenant.screeningReport ? (
                      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="bg-slate-50 px-5 sm:px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-2 sm:gap-0">
                          <div className="flex items-center gap-2">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/TransUnion_logo.svg/512px-TransUnion_logo.svg.png" alt="TransUnion" className="h-4 opacity-70 grayscale" />
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest ml-2 px-2 py-0.5 bg-slate-200/50 rounded">Verified</span>
                          </div>
                          <span className="text-sm font-medium text-slate-500">
                            {new Date(selectedTenant.screeningReport.dateCompleted).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="p-6 sm:p-8">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                             <div className="flex flex-col gap-2">
                               <span className="text-sm font-medium text-slate-500 mb-1">Recommendation</span>
                               <span className={cn(
                                 "text-lg sm:text-xl font-bold flex items-center gap-2.5 px-4 py-2 rounded-xl border w-fit shadow-sm",
                                 selectedTenant.screeningReport.recommendation === 'Approve' ? "text-emerald-700 bg-emerald-50 border-emerald-200" : 
                                 selectedTenant.screeningReport.recommendation === 'Review' ? "text-amber-700 bg-amber-50 border-amber-200" : "text-red-700 bg-red-50 border-red-200"
                               )}>
                                 {selectedTenant.screeningReport.recommendation === 'Approve' && <CheckCircle2 className="w-6 h-6 text-emerald-600" />}
                                 {selectedTenant.screeningReport.recommendation === 'Review' && <AlertCircle className="w-6 h-6 text-amber-600" />}
                                 {selectedTenant.screeningReport.recommendation === 'Decline' && <ShieldAlert className="w-6 h-6 text-red-600" />}
                                 {selectedTenant.screeningReport.recommendation}
                               </span>
                             </div>
                             
                             <div className="sm:text-right">
                               <span className="text-sm font-medium text-slate-500 mb-2 block">Credit Score</span>
                               <span className="text-4xl font-black text-slate-900 tracking-tight">
                                 {selectedTenant.screeningReport.creditScore}
                               </span>
                             </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-6 border-t border-slate-100">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-center">
                              <span className="block text-xs uppercase tracking-wider text-slate-500 mb-2 font-semibold">Criminal Records</span>
                              <span className={cn("text-lg font-bold", selectedTenant.screeningReport.criminalRecords === 0 ? "text-emerald-600" : "text-red-600")}>
                                {selectedTenant.screeningReport.criminalRecords === 0 ? "0 Found" : `${selectedTenant.screeningReport.criminalRecords} Found`}
                              </span>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-center">
                              <span className="block text-xs uppercase tracking-wider text-slate-500 mb-2 font-semibold">Eviction History</span>
                              <span className={cn("text-lg font-bold", selectedTenant.screeningReport.evictionHistory === 0 ? "text-emerald-600" : "text-red-600")}>
                                 {selectedTenant.screeningReport.evictionHistory === 0 ? "0 Found" : `${selectedTenant.screeningReport.evictionHistory} Found`}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-slate-50 px-6 sm:px-8 py-4 border-t border-slate-200">
                          <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors w-full text-center flex items-center justify-center gap-2">
                            Download Full Report (PDF)
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 rounded-2xl border border-slate-200 text-left flex flex-col overflow-hidden">
                        <div className="p-6 sm:p-8 bg-white border-b border-slate-100">
                          <h5 className="font-bold text-slate-900 mb-2 text-lg">
                            Configure Screening
                          </h5>
                          <p className="text-sm text-slate-500 mb-6 max-w-md">
                            Select the reports you need. The tenant will receive an email to consent and provide any required information.
                          </p>
                          
                          <div className="space-y-3 mb-8">
                            <label className="flex flex-row items-center justify-between p-4 rounded-xl border border-slate-200 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all">
                              <div className="flex items-center gap-3">
                                <input type="checkbox" checked={screeningOptions.credit} onChange={e => setScreeningOptions({...screeningOptions, credit: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                                <div>
                                  <span className="block font-semibold text-slate-900">Credit Check</span>
                                  <span className="block text-xs text-slate-500 mt-0.5">Full credit report with ResidentScore</span>
                                </div>
                              </div>
                              <span className="font-medium text-slate-700">$15.00</span>
                            </label>
                            
                            <label className="flex flex-row items-center justify-between p-4 rounded-xl border border-slate-200 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all">
                              <div className="flex items-center gap-3">
                                <input type="checkbox" checked={screeningOptions.background} onChange={e => setScreeningOptions({...screeningOptions, background: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                                <div>
                                  <span className="block font-semibold text-slate-900">Background Check</span>
                                  <span className="block text-xs text-slate-500 mt-0.5">National criminal & sex offender search</span>
                                </div>
                              </div>
                              <span className="font-medium text-slate-700">$15.00</span>
                            </label>
                            
                            <label className="flex flex-row items-center justify-between p-4 rounded-xl border border-slate-200 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all">
                              <div className="flex items-center gap-3">
                                <input type="checkbox" checked={screeningOptions.eviction} onChange={e => setScreeningOptions({...screeningOptions, eviction: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                                <div>
                                  <span className="block font-semibold text-slate-900">Eviction History</span>
                                  <span className="block text-xs text-slate-500 mt-0.5">National eviction records search</span>
                                </div>
                              </div>
                              <span className="font-medium text-slate-700">$10.00</span>
                            </label>
                          </div>
                          
                          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl">
                            <span className="font-medium text-slate-600">Total Applicant Fee</span>
                            <span className="font-bold text-slate-900 text-xl">
                              ${(screeningOptions.credit ? 15 : 0) + (screeningOptions.background ? 15 : 0) + (screeningOptions.eviction ? 10 : 0)}.00
                            </span>
                          </div>
                        </div>

                        <div className="p-6 bg-slate-50">
                          {error && (
                            <div className="mb-5 text-sm text-red-700 bg-red-50 p-4 rounded-lg w-full text-left flex gap-3 items-start border border-red-100 shadow-sm relative overflow-hidden">
                               <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-400"></div>
                               <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
                               <div className="flex flex-col">
                                 <span className="font-semibold text-red-800 mb-0.5">Screening Failed</span>
                                 <span className="text-red-600/90 leading-snug">{error}</span>
                               </div>
                            </div>
                          )}

                          {!consentRequested ? (
                            <button 
                              onClick={() => setConsentRequested(true)}
                              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
                            >
                              <ShieldCheck className="w-4 h-4" />
                              Request Tenant Consent
                            </button>
                          ) : (
                            <div className="flex flex-col gap-4">
                              <div className="flex items-center gap-3 bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-200">
                                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                                <span className="font-medium text-sm">Waiting for applicant consent...</span>
                              </div>
                              <button 
                                onClick={() => runScreening(selectedTenant.id)}
                                disabled={isScreening}
                                className={cn(
                                  "w-full py-3 rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2",
                                  isScreening 
                                    ? "bg-slate-200 text-slate-500 cursor-not-allowed" 
                                    : "bg-white border border-slate-300 hover:bg-slate-50 text-slate-700"
                                )}
                              >
                                {isScreening ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin"></div>
                                    Processing Report...
                                  </>
                                ) : (
                                  "Override & Run Screening (Demo)"
                                )}
                              </button>
                            </div>
                          )}
                          <p className="text-[10px] sm:text-xs text-slate-500 mt-4 text-center leading-relaxed">
                            Screening must comply with FCRA guidelines. By proceeding, you agree to the Terms of Service.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                   <div className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-900">
                      Application Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-slate-200 border border-slate-200 rounded-2xl overflow-hidden">
                      <div className="flex flex-col gap-1 sm:gap-2 p-5 sm:p-6 bg-white">
                        <span className="text-slate-500 text-xs sm:text-sm uppercase tracking-wider font-semibold">Move-in Date</span>
                        <span className="font-bold text-slate-900 text-lg">June 1, 2026</span>
                      </div>
                      <div className="flex flex-col gap-1 sm:gap-2 p-5 sm:p-6 bg-white">
                        <span className="text-slate-500 text-xs sm:text-sm uppercase tracking-wider font-semibold">Lease Term</span>
                        <span className="font-bold text-slate-900 text-lg">12 Months</span>
                      </div>
                      <div className="flex flex-col gap-1 sm:gap-2 p-5 sm:p-6 bg-white">
                        <span className="text-slate-500 text-xs sm:text-sm uppercase tracking-wider font-semibold">Monthly Income</span>
                        <span className="font-bold text-slate-900 text-lg">$6,500</span>
                      </div>
                      <div className="flex flex-col gap-1 sm:gap-2 p-5 sm:p-6 bg-white">
                        <span className="text-slate-500 text-xs sm:text-sm uppercase tracking-wider font-semibold">Employers</span>
                        <span className="font-bold text-slate-900 text-lg">Acme Corp</span>
                      </div>
                    </div>
                   </div>

                   <div className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 mt-6">
                       <Activity className="w-5 h-5 text-indigo-500" />
                       Activity Feed
                    </h3>
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6">
                      <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 pb-2">
                        
                        {/* Event 1 */}
                        <div className="relative pl-6">
                          <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-white bg-emerald-500 shadow-sm"></div>
                          <div className="flex justify-between items-start mb-1">
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                               <CreditCard className="w-4 h-4 text-emerald-600" /> Rent Payment
                            </div>
                            <time className="text-xs font-medium text-slate-400">June 1, 2026</time>
                          </div>
                          <p className="text-sm text-slate-600 mt-1.5">Rent payment received in full ($2,400).</p>
                        </div>

                        {/* Event 2 */}
                        <div className="relative pl-6">
                          <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-white bg-amber-500 shadow-sm"></div>
                          <div className="flex justify-between items-start mb-1">
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                               <Wrench className="w-4 h-4 text-amber-600" /> Maintenance Request
                            </div>
                            <time className="text-xs font-medium text-slate-400">May 14, 2026</time>
                          </div>
                          <p className="text-sm text-slate-600 mt-1.5">Leaky faucet in master bathroom. Resolution: <span className="font-medium text-slate-800">Completed by John (Handyman)</span>.</p>
                        </div>

                        {/* Event 3 */}
                       <div className="relative pl-6">
                          <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-white bg-indigo-500 shadow-sm"></div>
                          <div className="flex justify-between items-start mb-1">
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                               <Bell className="w-4 h-4 text-indigo-600" /> Lease Renewal Notice
                            </div>
                            <time className="text-xs font-medium text-slate-400">May 1, 2026</time>
                          </div>
                          <p className="text-sm text-slate-600 mt-1.5">Automated renewal options sent to tenant portal.</p>
                        </div>

                        {/* Event 4 */}
                        <div className="relative pl-6">
                          <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-white bg-blue-500 shadow-sm"></div>
                          <div className="flex justify-between items-start mb-1">
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                               <FileText className="w-4 h-4 text-blue-600" /> Lease Signed
                            </div>
                            <time className="text-xs font-medium text-slate-400">Jan 22, 2026</time>
                          </div>
                          <p className="text-sm text-slate-600 mt-1.5">Lease agreement signed for standard 12-month term.</p>
                        </div>

                      </div>
                    </div>
                   </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
      
      {reportTarget && (
        <ReportModal
          open={true}
          onClose={() => setReportTarget(null)}
          targetType={reportTarget.targetType}
          targetId={reportTarget.targetId}
          targetName={reportTarget.targetName}
          tenantRef={reportTarget.tenantRef}
        />
      )}

      {/* Sliding Panel for Add Tenant */}
      <div className={cn(
        "fixed md:absolute top-0 right-0 h-full w-full sm:max-w-[400px] bg-white sm:border-l border-slate-200 shadow-[0_0_40px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] z-50 md:z-40 flex flex-col",
        isAddTenantOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-white sticky top-0 z-10">
          <h3 className="font-semibold text-lg text-slate-900 flex items-center">
            Invite Tenant
          </h3>
          <button 
            onClick={() => setIsAddTenantOpen(false)}
            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <form id="add-tenant-form" onSubmit={handleAddTenant} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                <input 
                  type="text" 
                  value={newTenantData.firstName}
                  onChange={e => setNewTenantData({...newTenantData, firstName: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                <input 
                  type="text" 
                  value={newTenantData.lastName}
                  onChange={e => setNewTenantData({...newTenantData, lastName: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input 
                type="email" 
                value={newTenantData.email}
                onChange={e => setNewTenantData({...newTenantData, email: e.target.value})}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
              <input 
                type="tel" 
                value={newTenantData.phone}
                onChange={e => setNewTenantData({...newTenantData, phone: e.target.value})}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Unit</label>
              <select 
                value={newTenantData.unitId}
                onChange={e => setNewTenantData({...newTenantData, unitId: e.target.value})}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              >
                <option value="">Select a vacant unit...</option>
                {availableUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.property} - Unit {unit.number} - ${unit.rent.toLocaleString()}/mo
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lease Start</label>
                <input type="date" value={newTenantData.leaseStart} onChange={e => setNewTenantData({...newTenantData, leaseStart: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lease End</label>
                <input type="date" min={newTenantData.leaseStart || undefined} value={newTenantData.leaseEnd} onChange={e => setNewTenantData({...newTenantData, leaseEnd: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
              </div>
            </div>

            {availableUnits.length === 0 && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                There are no vacant units available to invite a tenant to.
              </p>
            )}
            {inviteError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{inviteError}</p>}
          </form>
        </div>
        
        <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 mt-auto">
          <div className="flex gap-3">
            <button 
              type="button"
              onClick={() => setIsAddTenantOpen(false)}
              className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              form="add-tenant-form"
              disabled={isSendingInvite || availableUnits.length === 0}
              className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors disabled:opacity-60"
            >
              {isSendingInvite ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </div>
      </div>

      {inviteResult && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/40 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="invite-result-title" className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 id="invite-result-title" className="text-lg font-bold text-slate-900">
                  {inviteResult.emailSent ? 'Invitation emailed' : 'Invitation link ready'}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {inviteResult.emailSent ? `Sent to ${inviteResult.email}.` : `Email delivery is not configured. Copy this link and send it to ${inviteResult.email}.`}
                </p>
              </div>
              <button type="button" aria-label="Close invitation details" onClick={() => setInviteResult(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex gap-2">
              <input readOnly value={inviteResult.inviteUrl} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700" />
              <button type="button" onClick={async () => { await navigator.clipboard.writeText(inviteResult.inviteUrl); setCopiedInvite(true); }} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                {copiedInvite ? <Mail className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedInvite ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-500">Link expires {new Date(inviteResult.expiresAt).toLocaleString()} and can only be used once.</p>
          </div>
        </div>
      )}

      {(selectedTenant || isAddTenantOpen) && (
        <div 
          className="fixed md:absolute inset-0 bg-slate-900/20 backdrop-blur-[1px] z-30 transition-opacity"
          onClick={() => {
            setSelectedTenant(null);
            setIsAddTenantOpen(false);
            setIsEditingTenant(false);
          }}
        ></div>
      )}
    </div>
  );
}
