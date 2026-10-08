import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Plus, 
  Calendar,
  Filter,
  FileSpreadsheet,
  File,
  CheckCircle2,
  Clock,
  MoreVertical,
  Search,
  X,
  DollarSign
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface Report {
  id: string;
  name: string;
  type: string;
  date: string;
  status: 'Completed' | 'Generating' | 'Failed';
  format: 'PDF' | 'CSV';
  size?: string;
}

const MOCK_REPORTS: Report[] = [
  {
    id: 'RPT-001',
    name: 'Q2 2026 Financial Summary',
    type: 'Financial',
    date: '2026-07-01',
    status: 'Completed',
    format: 'PDF',
    size: '2.4 MB'
  },
  {
    id: 'RPT-002',
    name: 'June 2026 Rent Roll',
    type: 'Rent Roll',
    date: '2026-07-02',
    status: 'Completed',
    format: 'CSV',
    size: '145 KB'
  },
  {
    id: 'RPT-003',
    name: 'Annual Maintenance Costs (YTD)',
    type: 'Maintenance',
    date: '2026-07-15',
    status: 'Generating',
    format: 'PDF'
  },
  {
    id: 'RPT-004',
    name: 'Sunset Villas Occupancy Report',
    type: 'Occupancy',
    date: '2026-06-30',
    status: 'Completed',
    format: 'PDF',
    size: '1.1 MB'
  },
  {
    id: 'RPT-005',
    name: 'Tax Document Export 2025',
    type: 'Tax',
    date: '2026-01-15',
    status: 'Completed',
    format: 'PDF',
    size: '4.8 MB'
  }
];

export const LandlordReports = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const filteredReports = MOCK_REPORTS.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || report.type === filterType;
    return matchesSearch && matchesType;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'Generating':
        return <Clock className="w-4 h-4 text-amber-500" />;
      default:
        return <File className="w-4 h-4 text-slate-500" />;
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'PDF':
        return <FileText className="w-4 h-4 text-red-500" />;
      case 'CSV':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
      default:
        return <File className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="p-4 sm:p-8 flex-1 overflow-y-auto mb-16 md:mb-0 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-8 h-8 text-indigo-600" />
              Financial Reports
            </h1>
            <p className="text-slate-500 mt-1">Generate, view, and export reports for your properties.</p>
          </div>
          <button 
            onClick={() => setShowGenerateModal(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Generate New Report
          </button>
        </div>

        {/* Report Categories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Financial Summary', desc: 'Income, expenses, and net profit', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { title: 'Rent Roll', desc: 'Current tenants, lease terms, and rent', icon: FileSpreadsheet, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { title: 'Maintenance', desc: 'Work orders and repair costs', icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
            { title: 'Tax Documents', desc: '1099s and end-of-year statements', icon: File, color: 'text-blue-600', bg: 'bg-blue-50' }
          ].map((cat, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", cat.bg, cat.color)}>
                <cat.icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">{cat.title}</h3>
              <p className="text-sm text-slate-500">{cat.desc}</p>
            </div>
          ))}
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search reports by name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors bg-slate-50"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full sm:w-auto pl-9 pr-8 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none bg-slate-50 font-medium text-slate-700 cursor-pointer"
            >
              <option value="All">All Types</option>
              <option value="Financial">Financial</option>
              <option value="Rent Roll">Rent Roll</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Tax">Tax</option>
            </select>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-900">Recent Reports</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Report Name</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Generated Date</th>
                  <th className="py-3 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-6 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                          {getFormatIcon(report.format)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{report.name}</div>
                          {report.size && <div className="text-xs text-slate-500">{report.format} • {report.size}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {report.type}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-slate-600 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {new Date(report.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-sm font-medium">
                        {getStatusIcon(report.status)}
                        <span className={report.status === 'Completed' ? 'text-emerald-700' : 'text-amber-700'}>
                          {report.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {report.status === 'Completed' && (
                          <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Download">
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredReports.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-lg font-medium text-slate-900">No reports found</p>
                      <p className="text-sm">Try adjusting your search or generate a new report.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Generate Report Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowGenerateModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                Generate Report
              </h3>
              <button 
                onClick={() => setShowGenerateModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Report Type</label>
                <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                  <option>Financial Summary</option>
                  <option>Rent Roll</option>
                  <option>Maintenance History</option>
                  <option>Occupancy Rates</option>
                  <option>Tax Documents</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Property</label>
                <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                  <option>All Properties</option>
                  <option>Sunset Villas</option>
                  <option>The Grand Apartments</option>
                  <option>Pinecrest Townhomes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date Range</label>
                <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                  <option>Last 30 Days</option>
                  <option>Last Quarter</option>
                  <option>Year to Date</option>
                  <option>Last Year</option>
                  <option>Custom Range...</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Format</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="format" defaultChecked className="text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm text-slate-700">PDF Document</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="format" className="text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm text-slate-700">CSV Spreadsheet</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm transition-colors"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
