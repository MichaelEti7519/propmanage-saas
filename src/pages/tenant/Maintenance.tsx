import React, { useCallback, useEffect, useState } from 'react';
import { Wrench, Plus, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'open' | 'in_progress' | 'closed';
  createdAt: string;
}

export const TenantMaintenance = () => {
  const { fetchWithAuth } = useAuth();
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<MaintenanceRequest['priority']>('Medium');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadRequests = useCallback(async () => {
    setError('');
    try {
      const response = await fetchWithAuth('/api/maintenance');
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Could not load maintenance requests.');
      setRequests(result.data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load maintenance requests.');
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const submitRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await fetchWithAuth('/api/maintenance', {
        method: 'POST',
        body: JSON.stringify({ title, description, priority }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Could not submit this request.');
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setShowNewRequest(false);
      await loadRequests();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not submit this request.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatStatus = (status: MaintenanceRequest['status']) => {
    if (status === 'in_progress') return 'In Progress';
    if (status === 'closed') return 'Resolved';
    return 'Open';
  };

  return (
    <div className="p-4 sm:p-8 flex-1 overflow-y-auto mb-16 md:mb-0 bg-slate-50">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Wrench className="w-8 h-8 text-indigo-600" />
              Maintenance Requests
            </h1>
            <p className="text-slate-500 mt-1">Submit and track repairs for your unit.</p>
          </div>
          <button 
            onClick={() => setShowNewRequest(!showNewRequest)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm w-full sm:w-auto justify-center"
          >
            {showNewRequest ? 'Cancel' : <><Plus className="w-5 h-5" /> New Request</>}
          </button>
        </div>

        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        {showNewRequest && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">Submit New Request</h3>
            <form className="space-y-4" onSubmit={submitRequest}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Issue Title</label>
                  <input required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} type="text" placeholder="e.g. Broken window blind" className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
                  <select value={priority} onChange={(event) => setPriority(event.target.value as MaintenanceRequest['priority'])} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm bg-white">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea required maxLength={4000} value={description} onChange={(event) => setDescription(event.target.value)} rows={4} placeholder="Please describe the issue in detail..." className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm resize-none"></textarea>
              </div>

              <div className="pt-2 flex justify-end">
                <button disabled={submitting} type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors shadow-sm">
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 px-1">Your Requests</h3>
          
          {loading && <p className="py-8 text-center text-sm text-slate-500">Loading requests...</p>}
          {!loading && requests.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No maintenance requests yet.</p>}
          {requests.map((req) => (
            <div key={req.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 hover:shadow-md transition-shadow group">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{req.id}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">{req.priority} priority</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-medium text-slate-500">{new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">{req.title}</h4>
                  <p className="text-sm text-slate-600 mb-4">{req.description}</p>
                  
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-medium text-slate-500">Request #{req.id.slice(-8)}</span>
                  </div>
                </div>
                
                <div className="shrink-0 flex items-center justify-between md:flex-col md:items-end gap-2 border-t md:border-t-0 border-slate-100 pt-4 md:pt-0">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm border",
                    req.status === 'closed' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    req.status === 'in_progress' ? "bg-amber-50 text-amber-700 border-amber-200" :
                    "bg-blue-50 text-blue-700 border-blue-200"
                  )}>
                    {req.status === 'closed' ? <CheckCircle2 className="w-3.5 h-3.5" /> : 
                     req.status === 'in_progress' ? <Clock className="w-3.5 h-3.5" /> :
                     <AlertCircle className="w-3.5 h-3.5" />}
                    {formatStatus(req.status)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
