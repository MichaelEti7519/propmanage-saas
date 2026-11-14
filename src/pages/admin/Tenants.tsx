import React, { useEffect, useMemo, useState } from 'react';
import { Users, Search, Filter, Shield, Building, RefreshCw, BadgeCheck, Ban } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';

interface AdminAccount {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'landlord' | 'tenant' | 'admin';
  phone: string | null;
  trustScore: number;
  blacklisted: boolean;
  emailVerificationStatus: string;
  identityVerificationStatus: string;
  createdAt: string;
  tenantStatus: string | null;
  unitNumber: string | null;
  propertyName: string | null;
  landlordName: string | null;
  propertyCount: number | null;
}

const roleClass: Record<AdminAccount['role'], string> = {
  admin: 'bg-slate-900 text-white border-slate-900',
  landlord: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  tenant: 'bg-sky-50 text-sky-700 border-sky-200',
};

const roleLabel: Record<AdminAccount['role'], string> = {
  admin: 'Admin',
  landlord: 'Landlord',
  tenant: 'Tenant',
};

const verificationLabel = (status: string) => ({
  not_started: 'Not started',
  pending: 'Pending',
  verified: 'Verified',
  rejected: 'Rejected',
  needs_review: 'Needs review',
}[status] ?? status);

export const AdminTenants = () => {
  const { fetchWithAuth } = useAuth();
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | AdminAccount['role']>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadAccounts() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchWithAuth('/api/admin/users');
        const data = await response.json();
        if (!response.ok || !data?.success) throw new Error(data?.error || 'Unable to load accounts.');
        if (!cancelled) setAccounts(Array.isArray(data.data) ? data.data : []);
      } catch (loadError) {
        if (!cancelled) {
          setAccounts([]);
          setError(loadError instanceof Error ? loadError.message : 'Unable to load accounts.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAccounts();
    return () => {
      cancelled = true;
    };
  }, [fetchWithAuth, refreshKey]);

  const visibleAccounts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return accounts.filter((account) => {
      const haystack = `${account.firstName} ${account.lastName} ${account.email} ${account.phone ?? ''}`.toLowerCase();
      const matchesSearch = !term || haystack.includes(term);
      const matchesRole = roleFilter === 'all' || account.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [accounts, search, roleFilter]);

  const counts = useMemo(() => ({
    landlords: accounts.filter((account) => account.role === 'landlord').length,
    tenants: accounts.filter((account) => account.role === 'tenant').length,
    admins: accounts.filter((account) => account.role === 'admin').length,
  }), [accounts]);

  const describeAssociation = (account: AdminAccount) => {
    if (account.role === 'admin') return 'Platform staff';
    if (account.role === 'landlord') return `${account.propertyCount ?? 0} propert${account.propertyCount === 1 ? 'y' : 'ies'}`;
    if (!account.propertyName) return 'No unit assigned';
    return `${account.propertyName}${account.unitNumber ? ` · Unit ${account.unitNumber}` : ''}`;
  };

  return (
    <div className="p-4 sm:p-8 flex-1 overflow-y-auto mb-16 md:mb-0 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-8 h-8 text-indigo-600" />
              User Accounts
            </h1>
            <p className="text-slate-500 mt-1">Every landlord, tenant, and admin account on the platform.</p>
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
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Accounts</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{accounts.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Landlords</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{counts.landlords}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Tenants</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{counts.tenants}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Admins</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{counts.admins}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as typeof roleFilter)}
              aria-label="Filter accounts by role"
              className="w-full sm:w-auto pl-9 pr-8 py-2 border border-slate-200 rounded-xl bg-slate-50 font-medium text-slate-700 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="all">All roles</option>
              <option value="landlord">Landlords</option>
              <option value="tenant">Tenants</option>
              <option value="admin">Admins</option>
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
            <table className="w-full min-w-[960px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Association</th>
                  <th className="px-6 py-4">Verification</th>
                  <th className="px-6 py-4">Trust</th>
                  <th className="px-6 py-4">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">Loading accounts...</td>
                  </tr>
                )}
                {!loading && !error && visibleAccounts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                      {accounts.length === 0 ? 'No accounts exist yet.' : 'No accounts match your current search.'}
                    </td>
                  </tr>
                )}
                {!loading && visibleAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-slate-50 transition-colors text-sm">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                          {account.firstName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                            {account.firstName} {account.lastName}
                            {account.blacklisted && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                                <Ban className="w-3 h-3" /> Blacklisted
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500">{account.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn('px-2.5 py-1 rounded-md text-xs font-semibold border', roleClass[account.role])}>
                        {roleLabel[account.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-1">
                        <Building className="w-4 h-4 text-slate-400" />
                        {describeAssociation(account)}
                      </div>
                      {account.role === 'tenant' && account.landlordName && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                          <Shield className="w-3 h-3" /> {account.landlordName}
                        </p>
                      )}
                      {account.role === 'tenant' && account.tenantStatus && (
                        <p className="mt-0.5 text-xs text-slate-500">Tenancy: {account.tenantStatus}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        'inline-flex items-center gap-1 text-xs font-medium',
                        account.identityVerificationStatus === 'verified' ? 'text-emerald-700' : 'text-slate-600'
                      )}>
                        {account.identityVerificationStatus === 'verified' && <BadgeCheck className="w-3.5 h-3.5" />}
                        Identity: {verificationLabel(account.identityVerificationStatus)}
                      </span>
                      <p className="mt-0.5 text-xs text-slate-500">Email: {verificationLabel(account.emailVerificationStatus)}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      <span className={cn('font-semibold', account.trustScore < 50 ? 'text-red-700' : 'text-slate-900')}>
                        {account.trustScore}
                      </span>
                      <span className="text-xs text-slate-400"> / 100</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{new Date(account.createdAt).toLocaleDateString()}</td>
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
