import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, FileText, RefreshCw, Search, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';

interface ReportItem {
  id: string;
  reporterRole: string;
  reporter?: { firstName: string; lastName: string; role: string };
  targetType: 'tenant' | 'landlord' | 'property';
  targetId: string;
  targetName?: string | null;
  reason: string;
  message: string;
  riskBand: 'low' | 'medium' | 'high';
  escalateForReview: boolean;
  status: ReportStatus;
  resolutionNote?: string | null;
  createdAt: string;
  targetProfile?: {
    id: string;
    firstName: string;
    lastName: string;
    trustScore: number;
    blacklisted: boolean;
  } | null;
}

const statuses: ReportStatus[] = ['open', 'reviewing', 'resolved', 'dismissed'];
const statusText = (status: ReportStatus) => status.charAt(0).toUpperCase() + status.slice(1);
const statusClass = (status: ReportStatus) => ({
  open: 'border-amber-200 bg-amber-50 text-amber-700',
  reviewing: 'border-blue-200 bg-blue-50 text-blue-700',
  resolved: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  dismissed: 'border-slate-200 bg-slate-100 text-slate-600',
}[status]);

export const AdminReports = () => {
  const { fetchWithAuth } = useAuth();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReportStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<ReportStatus>('reviewing');
  const [trustAdjustment, setTrustAdjustment] = useState('0');
  const [blacklisted, setBlacklisted] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const selected = reports.find((report) => report.id === selectedId) ?? null;

  useEffect(() => {
    async function loadReports() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchWithAuth('/api/reports');
        const data = await response.json();
        if (!response.ok || !data?.success) throw new Error(data?.error || 'Unable to load reports.');
        const items: ReportItem[] = Array.isArray(data.reports) ? data.reports : [];
        setReports(items);
        setSelectedId((current) => current && items.some((report) => report.id === current) ? current : items[0]?.id ?? null);
      } catch (loadError) {
        setReports([]);
        setSelectedId(null);
        setError(loadError instanceof Error ? loadError.message : 'Unable to load reports.');
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, [fetchWithAuth, refreshKey]);

  useEffect(() => {
    if (!selected) return;
    setStatus(selected.status === 'open' ? 'reviewing' : selected.status);
    setTrustAdjustment('0');
    setBlacklisted(selected.targetProfile?.blacklisted ?? false);
    setResolutionNote(selected.resolutionNote ?? '');
  }, [selected?.id]);

  const visibleReports = useMemo(() => reports.filter((report) => {
    const matchesStatus = filter === 'all' || report.status === filter;
    const haystack = `${report.targetName ?? ''} ${report.reason} ${report.message} ${report.reporter?.firstName ?? ''} ${report.reporter?.lastName ?? ''}`.toLowerCase();
    return matchesStatus && haystack.includes(search.trim().toLowerCase());
  }), [filter, reports, search]);

  const saveReview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetchWithAuth(`/api/reports/${selected.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          resolutionNote,
          ...(selected.targetProfile ? { trustAdjustment: Number(trustAdjustment) || 0, blacklisted } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.success) throw new Error(data?.error || 'Unable to save review.');
      setReports((current) => current.map((report) => report.id === selected.id
        ? { ...report, ...data.report, targetProfile: data.targetProfile ?? report.targetProfile }
        : report));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save review.');
    } finally {
      setSaving(false);
    }
  };

  const openCount = reports.filter((report) => report.status === 'open').length;
  const escalatedCount = reports.filter((report) => report.escalateForReview && ['open', 'reviewing'].includes(report.status)).length;

  return (
    <div className="p-4 sm:p-8 flex-1 overflow-y-auto mb-16 md:mb-0 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-5">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">Trust & Safety</p>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-slate-900 sm:text-3xl"><FileText className="h-7 w-7 text-indigo-600" /> Report review</h1>
            <p className="mt-1 text-sm text-slate-500">Review submitted cases and record account actions.</p>
          </div>
          <button type="button" onClick={() => setRefreshKey((key) => key + 1)} className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:self-auto">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </header>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <div className="border-l-4 border-amber-400 bg-white px-4 py-3 shadow-sm"><p className="text-xs font-medium uppercase text-slate-500">Open cases</p><p className="mt-1 text-2xl font-bold text-slate-900">{openCount}</p></div>
          <div className="border-l-4 border-red-400 bg-white px-4 py-3 shadow-sm"><p className="text-xs font-medium uppercase text-slate-500">Escalated in queue</p><p className="mt-1 text-2xl font-bold text-slate-900">{escalatedCount}</p></div>
          <div className="col-span-2 border-l-4 border-emerald-400 bg-white px-4 py-3 shadow-sm lg:col-span-1"><p className="text-xs font-medium uppercase text-slate-500">Total reports</p><p className="mt-1 text-2xl font-bold text-slate-900">{reports.length}</p></div>
        </div>

        {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
          <section className="min-w-0 border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row">
              <div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search cases" className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500" /></div>
              <select value={filter} onChange={(event) => setFilter(event.target.value as ReportStatus | 'all')} aria-label="Filter reports by status" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"><option value="all">All statuses</option>{statuses.map((item) => <option key={item} value={item}>{statusText(item)}</option>)}</select>
            </div>
            {loading ? <p className="p-10 text-center text-sm text-slate-500">Loading reports...</p> : visibleReports.length ? (
              <div className="divide-y divide-slate-100">
                {visibleReports.map((report) => {
                  const target = report.targetProfile ? `${report.targetProfile.firstName} ${report.targetProfile.lastName}` : report.targetName || `${report.targetType} · ${report.targetId}`;
                  return <button key={report.id} type="button" onClick={() => setSelectedId(report.id)} className={`block w-full px-4 py-4 text-left transition ${selectedId === report.id ? 'bg-indigo-50/70' : 'hover:bg-slate-50'}`}>
                    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-slate-900">{target}</span><span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusClass(report.status)}`}>{report.status}</span></div><p className="mt-1 truncate text-sm text-slate-700">{report.reason}</p><p className="mt-1 line-clamp-2 text-xs text-slate-500">{report.message}</p></div><div className="shrink-0 text-right"><span className={`inline-flex items-center gap-1 text-xs font-semibold ${report.riskBand === 'high' ? 'text-red-700' : report.riskBand === 'medium' ? 'text-amber-700' : 'text-slate-600'}`}>{report.riskBand === 'high' && <AlertTriangle className="h-3.5 w-3.5" />}{report.riskBand} risk</span><p className="mt-1 text-xs text-slate-400">{new Date(report.createdAt).toLocaleDateString()}</p></div></div>
                    {report.escalateForReview && ['open', 'reviewing'].includes(report.status) && <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-red-700"><ShieldAlert className="h-3.5 w-3.5" /> Escalated</span>}
                  </button>;
                })}
              </div>
            ) : <div className="p-10 text-center"><Check className="mx-auto h-8 w-8 text-emerald-600" /><p className="mt-2 font-semibold text-slate-900">No reports match this view</p><p className="mt-1 text-sm text-slate-500">New submissions will appear here.</p></div>}
          </section>

          <section className="min-w-0 border border-slate-200 bg-white shadow-sm">
            {selected ? <form onSubmit={saveReview}>
              <div className="border-b border-slate-200 p-4"><div className="flex items-center justify-between gap-3"><h2 className="font-bold text-slate-900">Case review</h2><span className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusClass(selected.status)}`}>{statusText(selected.status)}</span></div><p className="mt-1 text-xs text-slate-500">Case {selected.id}</p></div>
              <div className="space-y-4 p-4">
                <div><p className="text-xs font-semibold uppercase text-slate-500">Reported {selected.targetType}</p><p className="mt-1 font-semibold text-slate-900">{selected.targetName || (selected.targetProfile ? `${selected.targetProfile.firstName} ${selected.targetProfile.lastName}` : selected.targetId)}</p><p className="mt-1 text-sm text-slate-700">{selected.reason}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{selected.message}</p><p className="mt-2 text-xs text-slate-500">Submitted by {selected.reporter ? `${selected.reporter.firstName} ${selected.reporter.lastName}` : selected.reporterRole} · {new Date(selected.createdAt).toLocaleString()}</p></div>
                {selected.targetProfile ? <div className="grid grid-cols-2 gap-3"><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-medium uppercase text-slate-500">Trust score</p><p className="mt-1 text-xl font-bold text-slate-900">{selected.targetProfile.trustScore}<span className="text-sm font-medium text-slate-400"> / 100</span></p></div><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-medium uppercase text-slate-500">Account flag</p><p className={`mt-1 text-sm font-bold ${selected.targetProfile.blacklisted ? 'text-red-700' : 'text-emerald-700'}`}>{selected.targetProfile.blacklisted ? 'Blacklisted' : 'Not blacklisted'}</p></div></div> : <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">No linked platform account. Report status can still be updated; account trust controls are unavailable.</p>}
                <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium text-slate-700">Review status<select value={status} onChange={(event) => setStatus(event.target.value as ReportStatus)} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2">{statuses.map((item) => <option key={item} value={item}>{statusText(item)}</option>)}</select></label><label className="text-sm font-medium text-slate-700">Trust score adjustment<input type="number" min="-100" max="100" step="1" disabled={!selected.targetProfile} value={trustAdjustment} onChange={(event) => setTrustAdjustment(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 disabled:bg-slate-100" /></label></div>
                <label className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${selected.targetProfile ? 'border-red-200 bg-red-50/60 text-slate-700' : 'border-slate-200 bg-slate-50 text-slate-400'}`}><input type="checkbox" checked={blacklisted} disabled={!selected.targetProfile} onChange={(event) => setBlacklisted(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-red-600" /><span><strong className="block">Blacklist this account</strong><span className="text-xs">Manual review action; it does not suspend account access.</span></span></label>
                <label className="block text-sm font-medium text-slate-700">Review notes<textarea value={resolutionNote} onChange={(event) => setResolutionNote(event.target.value)} rows={3} maxLength={2000} placeholder="Record the decision and follow-up." className="mt-1.5 w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
                <button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-indigo-400">{saving ? 'Saving review...' : <><Check className="h-4 w-4" /> Save review</>}</button>
              </div>
            </form> : <div className="flex min-h-80 flex-col items-center justify-center p-8 text-center"><FileText className="h-8 w-8 text-slate-300" /><p className="mt-3 font-semibold text-slate-800">Select a report to review</p><p className="mt-1 max-w-xs text-sm text-slate-500">Review the submitted information before changing case or account status.</p></div>}
          </section>
        </div>
      </div>
    </div>
  );
};
