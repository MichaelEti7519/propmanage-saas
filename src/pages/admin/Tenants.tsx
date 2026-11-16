import React, { useEffect, useMemo, useState } from 'react';
import { Users, Search, Filter, Shield, Building, RefreshCw, BadgeCheck, Ban, X } from 'lucide-react';
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

const verificationChipClass = (status: string) => ({
  verified: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  needs_review: 'border-blue-200 bg-blue-50 text-blue-700',
  rejected: 'border-red-200 bg-red-50 text-red-700',
  not_started: 'border-slate-200 bg-slate-100 text-slate-600',
}[status] ?? 'border-slate-200 bg-slate-100 text-slate-600');

type VerificationFieldKey =
  | 'identity'
  | 'email'
  | 'phone'
  | 'property_authorization'
  | 'business_registration'
  | 'income'
  | 'payout';

const verificationFields: { key: VerificationFieldKey; label: string }[] = [
  { key: 'identity', label: 'Identity' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'property_authorization', label: 'Property authorization' },
  { key: 'business_registration', label: 'Business registration' },
  { key: 'income', label: 'Income' },
  { key: 'payout', label: 'Payout' },
];

const verificationFieldColumn: Record<VerificationFieldKey, string> = {
  identity: 'identityVerificationStatus',
  email: 'emailVerificationStatus',
  phone: 'phoneVerificationStatus',
  property_authorization: 'propertyAuthorizationStatus',
  business_registration: 'businessRegistrationStatus',
  income: 'incomeVerificationStatus',
  payout: 'payoutVerificationStatus',
};

const verificationStatuses = ['not_started', 'pending', 'needs_review', 'verified', 'rejected'];

const fieldLabel = (key: string) => verificationFields.find((item) => item.key === key)?.label ?? key;

interface VerificationHistoryEntry {
  id: string;
  field: string;
  fromStatus: string;
  toStatus: string;
  basis: string;
  createdAt: string;
  reviewerName: string;
  reviewerEmail: string;
}

export const AdminTenants = () => {
  const { fetchWithAuth } = useAuth();
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | AdminAccount['role']>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [reviewTarget, setReviewTarget] = useState<AdminAccount | null>(null);
  const [reviewStatuses, setReviewStatuses] = useState<Record<string, string> | null>(null);
  const [reviewHistory, setReviewHistory] = useState<VerificationHistoryEntry[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewNotice, setReviewNotice] = useState<string | null>(null);
  const [reviewField, setReviewField] = useState<VerificationFieldKey>('identity');
  const [reviewDecision, setReviewDecision] = useState('');
  const [reviewBasis, setReviewBasis] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);
  const reviewTargetId = reviewTarget?.id ?? null;

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

  useEffect(() => {
    if (!reviewTargetId) return;
    let cancelled = false;

    setReviewLoading(true);
    setReviewError(null);
    setReviewNotice(null);
    setReviewStatuses(null);
    setReviewHistory([]);
    setReviewField('identity');
    setReviewDecision('');
    setReviewBasis('');

    async function loadVerification() {
      try {
        const response = await fetchWithAuth(`/api/admin/users/${reviewTargetId}/verification`);
        const data = await response.json();
        if (!response.ok || !data?.success) throw new Error(data?.error || 'Unable to load this verification record.');
        if (cancelled) return;
        setReviewStatuses(data.account ?? null);
        setReviewHistory(Array.isArray(data.reviews) ? data.reviews : []);
      } catch (loadError) {
        if (!cancelled) setReviewError(loadError instanceof Error ? loadError.message : 'Unable to load this verification record.');
      } finally {
        if (!cancelled) setReviewLoading(false);
      }
    }

    loadVerification();
    return () => {
      cancelled = true;
    };
  }, [fetchWithAuth, reviewTargetId]);

  useEffect(() => {
    if (!reviewTargetId) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setReviewTarget(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reviewTargetId]);

  const currentFieldStatus = reviewStatuses?.[verificationFieldColumn[reviewField]] ?? null;
  const basisNeeded = reviewDecision === 'verified' ? 25 : 10;
  const basisLength = reviewBasis.trim().length;
  const decisionMatchesCurrent = Boolean(currentFieldStatus) && currentFieldStatus === reviewDecision;
  const canRecordDecision = Boolean(reviewDecision)
    && !decisionMatchesCurrent
    && basisLength >= basisNeeded
    && !reviewSaving
    && !reviewLoading;

  const submitVerification = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!reviewTargetId || !canRecordDecision) return;
    setReviewSaving(true);
    setReviewError(null);
    setReviewNotice(null);
    try {
      const response = await fetchWithAuth(`/api/admin/users/${reviewTargetId}/verification`, {
        method: 'POST',
        body: JSON.stringify({ field: reviewField, status: reviewDecision, basis: reviewBasis.trim() }),
      });
      const data = await response.json();
      if (!response.ok || !data?.success) throw new Error(data?.error || 'Unable to record this decision.');
      const updated = data.account ?? null;
      setReviewStatuses(updated);
      if (data.review) setReviewHistory((current) => [data.review as VerificationHistoryEntry, ...current]);
      setAccounts((current) => current.map((account) => account.id === reviewTargetId
        ? {
          ...account,
          identityVerificationStatus: updated?.identityVerificationStatus ?? account.identityVerificationStatus,
          emailVerificationStatus: updated?.emailVerificationStatus ?? account.emailVerificationStatus,
        }
        : account));
      setReviewNotice(`${fieldLabel(reviewField)} recorded as ${verificationLabel(reviewDecision).toLowerCase()}.`);
      setReviewDecision('');
      setReviewBasis('');
    } catch (saveError) {
      setReviewError(saveError instanceof Error ? saveError.message : 'Unable to record this decision.');
    } finally {
      setReviewSaving(false);
    }
  };

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
                      <button
                        type="button"
                        onClick={() => setReviewTarget(account)}
                        className="mt-1.5 inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        <Shield className="w-3 h-3" /> Review verification
                      </button>
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

      {reviewTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="verification-dialog-title"
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">Verification review</p>
                <h2 id="verification-dialog-title" className="mt-1 text-lg font-bold text-slate-900">
                  {reviewTarget.firstName} {reviewTarget.lastName}
                </h2>
                <p className="text-xs text-slate-500">{reviewTarget.email} · {roleLabel[reviewTarget.role]}</p>
              </div>
              <button
                type="button"
                onClick={() => setReviewTarget(null)}
                aria-label="Close verification review"
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Recorded status</p>
                {reviewLoading ? (
                  <p className="mt-2 text-sm text-slate-500">Loading verification record...</p>
                ) : (
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {verificationFields.map((item) => (
                      <div key={item.key} className="rounded-lg border border-slate-200 px-3 py-2">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{item.label}</p>
                        <span className={cn(
                          'mt-1 inline-flex rounded-md border px-1.5 py-0.5 text-[11px] font-semibold',
                          verificationChipClass(reviewStatuses?.[verificationFieldColumn[item.key]] ?? 'not_started'),
                        )}>
                          {verificationLabel(reviewStatuses?.[verificationFieldColumn[item.key]] ?? 'not_started')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <form onSubmit={submitVerification} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Record a decision</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-medium text-slate-600">
                    Field
                    <select
                      value={reviewField}
                      onChange={(event) => setReviewField(event.target.value as VerificationFieldKey)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                    >
                      {verificationFields.map((item) => (
                        <option key={item.key} value={item.key}>{item.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-medium text-slate-600">
                    New status
                    <select
                      value={reviewDecision}
                      onChange={(event) => setReviewDecision(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                    >
                      <option value="">Choose a status</option>
                      {verificationStatuses.map((item) => (
                        <option key={item} value={item}>{verificationLabel(item)}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="block text-xs font-medium text-slate-600">
                  Basis for this decision
                  <textarea
                    value={reviewBasis}
                    onChange={(event) => setReviewBasis(event.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder={reviewDecision === 'verified'
                      ? 'What exactly was checked, and which provider reference supports it?'
                      : 'How was this decision reached?'}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                  />
                </label>
                <p className="text-[11px] text-slate-500">
                  {reviewDecision === 'verified'
                    ? 'A verified badge needs at least 25 characters describing what was actually checked.'
                    : 'At least 10 characters. The basis is stored against your name on this record.'}
                  {' '}({basisLength}/500)
                </p>
                {currentFieldStatus && (
                  <p className="text-[11px] text-slate-500">Current status: {verificationLabel(currentFieldStatus)}</p>
                )}
                {reviewError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{reviewError}</p>}
                {reviewNotice && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{reviewNotice}</p>}
                <button
                  type="submit"
                  disabled={!canRecordDecision}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {reviewSaving ? 'Recording...' : 'Record decision'}
                </button>
              </form>

              <div>
                <div className="flex items-baseline justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Recent decisions</p>
                  <p className="text-[11px] text-slate-400">Last 20</p>
                </div>
                {reviewHistory.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">No verification decision has been recorded for this account yet.</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {reviewHistory.map((entry) => (
                      <li key={entry.id} className="rounded-lg border border-slate-200 px-3 py-2 text-xs">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-700">
                          <span className="font-semibold">{fieldLabel(entry.field)}</span>
                          <span className="text-slate-500">{verificationLabel(entry.fromStatus)} → {verificationLabel(entry.toStatus)}</span>
                          <span className="ml-auto text-slate-400">{new Date(entry.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="mt-1 text-slate-600">{entry.basis}</p>
                        <p className="mt-1 text-[11px] text-slate-400">{entry.reviewerName || entry.reviewerEmail} · {entry.reviewerEmail}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
