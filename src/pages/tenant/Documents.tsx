import React, { useState, useRef, useEffect } from 'react';
import { FileText, Search, Filter, Calendar, FileDigit, Upload, Sparkles, Loader2, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import GlideSelect, { type GlideSelectOption } from '../../components/GlideSelect';

type DocumentRecord = { id: string; name: string; type: string; date: string; size: string; tags?: string[]; ownerId?: string; url?: string };

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const documentTypeOptions: GlideSelectOption[] = [
  { value: 'Lease', label: 'Lease', tag: 'Agreement' },
  { value: 'Receipt', label: 'Receipt', tag: 'Payment' },
  { value: 'Notice', label: 'Notice', tag: 'Property' },
];

export const TenantDocuments = () => {
  const { fetchWithAuth } = useAuth();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedType, setSelectedType] = useState('');
  const [privacyConfirmed, setPrivacyConfirmed] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const response = await fetchWithAuth('/api/documents');
        const result = await response.json() as { success?: boolean; data?: DocumentRecord[]; error?: string };
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Could not load your documents.');
        }
        setDocuments(result.data ?? []);
      } catch (error) {
        console.error(error);
        setDocuments([]);
        setLoadError(error instanceof Error ? error.message : 'Could not load your documents.');
      }
    };

    void loadDocuments();
  }, [fetchWithAuth]);

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || doc.type === filterType;
    return matchesSearch && matchesType;
  }).sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (sortBy === 'oldest') {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    } else if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  const getIconForType = (type: string) => {
    switch (type) {
      case 'Lease': return <FileText className="w-5 h-5 text-indigo-500" />;
      case 'Receipt': return <FileDigit className="w-5 h-5 text-emerald-500" />;
      case 'Notice': return <FileText className="w-5 h-5 text-amber-500" />;
      default: return <FileText className="w-5 h-5 text-slate-500" />;
    }
  };

  const getBadgeForType = (type: string) => {
    switch (type) {
      case 'Lease': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Receipt': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Notice': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    if (!selectedType) {
      setUploadError('Choose a document type before selecting a file.');
      event.target.value = '';
      return;
    }
    if (!privacyConfirmed) {
      setUploadError('Confirm the document privacy notice before uploading.');
      event.target.value = '';
      return;
    }
    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      setUploadError('Choose a non-empty PDF, JPEG, or PNG file no larger than 8 MB.');
      event.target.value = '';
      return;
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    const expectedMime = extension === 'pdf'
      ? 'application/pdf'
      : extension === 'jpg' || extension === 'jpeg'
        ? 'image/jpeg'
        : extension === 'png'
          ? 'image/png'
          : undefined;
    if (!expectedMime || (file.type && file.type !== expectedMime)) {
      setUploadError('Only PDF, JPEG, and PNG documents are accepted.');
      event.target.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === 'string'
          ? resolve(reader.result)
          : reject(new Error('Could not read the selected file.'));
        reader.onerror = () => reject(new Error('Could not read the selected file.'));
        reader.readAsDataURL(file);
      });

      const response = await fetchWithAuth('/api/scan-document', {
        method: 'POST',
        body: JSON.stringify({
          fileName: file.name,
          documentType: selectedType,
          mimeType: expectedMime,
          base64Data,
        }),
      });
      const result = await response.json() as {
        success?: boolean;
        data?: { primaryDate?: string; extractedDates?: string[] };
        error?: string;
      };
      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error || 'Could not analyze the selected document.');
      }

      const persistedResponse = await fetchWithAuth('/api/documents', {
        method: 'POST',
        body: JSON.stringify({
          name: file.name,
          type: selectedType,
          date: result.data.primaryDate || new Date().toISOString().split('T')[0],
          size: formatSize(file.size),
          tags: result.data.extractedDates || [],
        }),
      });
      const persisted = await persistedResponse.json() as { success?: boolean; data?: DocumentRecord; error?: string };
      if (!persistedResponse.ok || !persisted.success || !persisted.data) {
        throw new Error(persisted.error || 'Could not save document details.');
      }

      setDocuments((current) => [persisted.data!, ...current]);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Could not process the selected document.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-4 sm:p-8 flex-1 overflow-y-auto mb-16 md:mb-0 bg-slate-50 relative">
      {/* Loading Overlay */}
      {isUploading && (
        <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 max-w-sm w-full text-center flex flex-col items-center">
              <div className="relative mb-6">
                 <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-indigo-600 animate-pulse" />
                 </div>
                 <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm border border-slate-100">
                    <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                 </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Analyzing Document...</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Our AI is scanning your document to determine its type and extract key metadata...
              </p>
           </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Leases & Documents</h1>
            <p className="text-slate-500 mt-1">Keep document details organized without storing original files in PropManage.</p>
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-[minmax(220px,1fr)_auto] lg:max-w-2xl">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Choose document type first</label>
              <GlideSelect
                options={documentTypeOptions}
                value={selectedType}
                onChange={setSelectedType}
                placeholder="Select category"
                ariaLabel="Document category"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={!selectedType || !privacyConfirmed || isUploading}
                className="flex min-h-11 w-full items-center justify-center gap-2 bg-[#332D29] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#397451] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                <Upload className="h-4 w-4" />
                Select file
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                disabled={!selectedType || !privacyConfirmed || isUploading}
                onChange={handleFileUpload}
              />
            </div>
          </div>
        </div>

        <div className="max-w-4xl border-l-2 border-[#B9A58B] bg-white px-4 py-3 text-sm text-slate-700">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#397451]" />
            <p className="leading-6">PDF, JPEG, or PNG only, up to 8 MB. The file is sent to Google Gemini for date extraction and is not stored by PropManage; only document metadata is saved. Never upload IDs, deeds, bank statements, payslips, or files containing sensitive identity or financial details.</p>
          </div>
          <label className="mt-3 flex cursor-pointer items-start gap-2 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-600">
            <input type="checkbox" checked={privacyConfirmed} onChange={(event) => setPrivacyConfirmed(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[#397451]" />
            <span>I understand the file is sent to Google Gemini for analysis and confirm it does not contain prohibited identity or financial documents.</span>
          </label>
        </div>

        {(uploadError || loadError) && (
          <p role="alert" className="max-w-4xl border-l-2 border-red-500 bg-white px-4 py-3 text-sm text-red-700">{uploadError || loadError}</p>
        )}

        {/* Search and Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by filename..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors bg-slate-50"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Filter by Type */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full sm:w-auto pl-9 pr-8 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none bg-slate-50 font-medium text-slate-700 cursor-pointer"
              >
                <option value="All">All Types</option>
                <option value="Lease">Leases</option>
                <option value="Receipt">Receipts</option>
                <option value="Notice">Notices</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Sort By Date */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-auto pl-9 pr-8 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none bg-slate-50 font-medium text-slate-700 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Filename A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Documents Grid / List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {filteredDocs.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredDocs.map((doc) => (
                <div key={doc.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors group">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {getIconForType(doc.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 line-clamp-1">{doc.name}</h3>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(doc.date).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-slate-400">{doc.size}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider",
                          getBadgeForType(doc.type)
                        )}>
                          {doc.type}
                        </span>
                        
                        {doc.tags && doc.tags.map((tag: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-medium flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-medium text-slate-900">No documents found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
