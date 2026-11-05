import React, { useCallback, useEffect, useState } from 'react';
import { 
  Wrench, 
  Search, 
  Filter, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  MessageSquare, 
  MoreVertical,
  Calendar,
  Home,
  X,
  Paperclip,
  FileText,
  User,
  PenTool
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';

interface RequestHistory {
  date: string;
  action: string;
  user: string;
}

interface Attachment {
  name: string;
  size: string;
}

interface MaintenanceRequest {
  id: string;
  title: string;
  tenant: string;
  property: string;
  unit: string;
  priority: string;
  status: string;
  date: string;
  category: string;
  description: string;
  technicianNotes: string;
  history: RequestHistory[];
  attachments: Attachment[];
}

interface MaintenanceApiRequest {
  id: string;
  title: string;
  tenantName: string;
  propertyName: string;
  unitNumber: string;
  priority: string;
  status: 'open' | 'in_progress' | 'closed';
  description: string;
  createdAt: string;
}

export const LandlordMaintenance = () => {
  const { fetchWithAuth } = useAuth();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);

  const loadRequests = useCallback(async () => {
    setError('');
    try {
      const response = await fetchWithAuth('/api/maintenance');
      const result = await response.json() as { success: boolean; error?: string; data: MaintenanceApiRequest[] };
      if (!response.ok || !result.success) throw new Error(result.error || 'Could not load maintenance requests.');
      setRequests(result.data.map((request) => ({
        id: request.id,
        title: request.title,
        tenant: request.tenantName,
        property: request.propertyName,
        unit: request.unitNumber,
        priority: request.priority,
        status: request.status === 'in_progress' ? 'In Progress' : request.status === 'closed' ? 'Completed' : 'Open',
        date: request.createdAt,
        category: 'General',
        description: request.description,
        technicianNotes: '',
        history: [{ date: request.createdAt, action: 'Request submitted', user: request.tenantName }],
        attachments: [],
      })));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load maintenance requests.');
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const updateRequestStatus = async (requestId: string, status: string) => {
    setUpdating(true);
    setError('');
    try {
      const response = await fetchWithAuth(`/api/maintenance/${encodeURIComponent(requestId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Could not update request status.');
      setSelectedRequest(null);
      await loadRequests();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not update request status.');
    } finally {
      setUpdating(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'bg-red-100 text-red-700 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Low': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'In Progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Scheduled': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'Completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      req.tenant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.unit.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || req.status === filterStatus;
    const matchesPriority = filterPriority === 'All' || req.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });
  const metrics = [
    { label: 'Open Requests', value: requests.filter((request) => request.status === 'Open').length, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'In Progress', value: requests.filter((request) => request.status === 'In Progress').length, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'High Priority', value: requests.filter((request) => request.priority === 'High').length, icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Completed', value: requests.filter((request) => request.status === 'Completed').length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="p-4 sm:p-8 flex-1 overflow-y-auto mb-16 md:mb-0 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Wrench className="w-8 h-8 text-indigo-600" />
              Maintenance Hub
            </h1>
            <p className="text-slate-500 mt-1">Manage and track property maintenance requests.</p>
          </div>
        </div>

        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", metric.bg, metric.color)}>
                <metric.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{metric.label}</p>
                <p className="text-2xl font-black text-slate-900 tracking-tight">{metric.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by title, tenant, or unit..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors bg-slate-50"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full sm:w-auto pl-9 pr-8 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none bg-slate-50 font-medium text-slate-700 cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div className="relative">
              <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full sm:w-auto pl-9 pr-8 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none bg-slate-50 font-medium text-slate-700 cursor-pointer"
              >
                <option value="All">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Request</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Property & Unit</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!loading && filteredRequests.map((req) => (
                  <tr 
                    key={req.id} 
                    className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    onClick={() => setSelectedRequest(req)}
                  >
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-900 mb-0.5">{req.title}</div>
                      <div className="text-sm text-slate-500 flex items-center gap-2">
                        <span>{req.id}</span>
                        <span>•</span>
                        <span>{req.category}</span>
                        <span>•</span>
                        <span>{new Date(req.date).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-slate-900 font-medium">
                        <Home className="w-4 h-4 text-slate-400" />
                        {req.unit}
                      </div>
                      <div className="text-sm text-slate-500 mt-0.5">{req.property}</div>
                      <div className="text-sm text-slate-500">{req.tenant}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border",
                        getPriorityBadge(req.priority)
                      )}>
                        {req.priority}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border",
                        getStatusBadge(req.status)
                      )}>
                        {req.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Message Tenant">
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="More Options">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {loading && (
                  <tr><td colSpan={5} className="py-12 text-center text-slate-500">Loading requests...</td></tr>
                )}
                {!loading && filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="font-medium text-slate-900">No maintenance requests</p>
                      <p className="text-sm mt-1">Requests submitted by your tenants will appear here.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Slide-over Drawer */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setSelectedRequest(null)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-xl flex">
            <div className="w-full h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border",
                    getStatusBadge(selectedRequest.status)
                  )}>
                    {selectedRequest.status}
                  </span>
                  <span className="text-sm font-medium text-slate-500">{selectedRequest.id}</span>
                </div>
                <button 
                  onClick={() => setSelectedRequest(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-8">
                  
                  {/* Title & Priority */}
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">{selectedRequest.title}</h2>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border",
                        getPriorityBadge(selectedRequest.priority)
                      )}>
                        {selectedRequest.priority} Priority
                      </span>
                      <span className="text-sm font-medium text-slate-500 flex items-center gap-1">
                        <Wrench className="w-4 h-4 text-slate-400" />
                        {selectedRequest.category}
                      </span>
                    </div>
                  </div>

                  {/* Tenant & Location */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Tenant</p>
                      <div className="flex items-center gap-2 text-slate-900 font-medium">
                        <User className="w-4 h-4 text-slate-400" />
                        {selectedRequest.tenant}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Location</p>
                      <div className="flex items-center gap-2 text-slate-900 font-medium">
                        <Home className="w-4 h-4 text-slate-400" />
                        {selectedRequest.unit}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 ml-6">{selectedRequest.property}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      Issue Description
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed bg-white border border-slate-200 rounded-xl p-4">
                      {selectedRequest.description}
                    </p>
                  </div>

                  {/* Attachments */}
                  {selectedRequest.attachments.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-slate-400" />
                        Attachments ({selectedRequest.attachments.length})
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedRequest.attachments.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 border border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors cursor-pointer group">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                <FileText className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                                <p className="text-xs text-slate-500">{file.size}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Technician Notes */}
                  {selectedRequest.technicianNotes && (
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <PenTool className="w-4 h-4 text-slate-400" />
                        Technician Notes
                      </h3>
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <p className="text-amber-800 text-sm leading-relaxed">
                          {selectedRequest.technicianNotes}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* History Timeline */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      Status History
                    </h3>
                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-slate-200 before:to-transparent ml-2">
                      {selectedRequest.history.map((item, idx) => (
                        <div key={idx} className="relative flex items-start gap-4">
                          <div className="w-5 h-5 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center z-10 shrink-0 mt-0.5">
                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{item.action}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {new Date(item.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} • {item.user}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
              
              {/* Drawer Footer */}
              <div className="p-4 sm:p-6 border-t border-slate-100 bg-white">
                <label htmlFor="maintenance-status" className="block text-sm font-medium text-slate-700 mb-2">Update status</label>
                <select
                  id="maintenance-status"
                  disabled={updating}
                  value={selectedRequest.status === 'In Progress' ? 'in_progress' : selectedRequest.status === 'Completed' ? 'closed' : 'open'}
                  onChange={(event) => void updateRequestStatus(selectedRequest.id, event.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm disabled:opacity-60"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="closed">Completed</option>
                </select>
                {updating && <p className="mt-2 text-xs text-slate-500">Saving status...</p>}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
