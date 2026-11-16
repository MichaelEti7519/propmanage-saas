import React, { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Send, Inbox, Search, X, RefreshCw, Info, Mail, Archive, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';

interface AdminMessage {
  id: string;
  senderId: string;
  recipientId: string;
  subject: string;
  body: string;
  read: boolean;
  createdAt: string;
}

interface Recipient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'landlord' | 'tenant' | 'admin';
}

interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  reason: string;
  message: string;
  status: string;
  createdAt: string;
}

type InquiryStatus = 'new' | 'handled' | 'archived';

const inquiryStatusStyles: Record<string, string> = {
  new: 'border-amber-200 bg-amber-50 text-amber-700',
  handled: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  archived: 'border-slate-200 bg-slate-100 text-slate-600',
};

export const AdminMessages = () => {
  const { fetchWithAuth, user } = useAuth();
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [people, setPeople] = useState<Recipient[]>([]);
  const [search, setSearch] = useState('');
  const [box, setBox] = useState<'all' | 'received' | 'sent'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({ recipientId: '', subject: '', body: '' });
  const [view, setView] = useState<'messages' | 'inquiries'>('messages');
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [inquiryCounts, setInquiryCounts] = useState<Record<string, number>>({ new: 0, handled: 0, archived: 0 });
  const [inquiryFilter, setInquiryFilter] = useState<'all' | InquiryStatus>('all');
  const [inquirySearch, setInquirySearch] = useState('');
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [inquiriesError, setInquiriesError] = useState<string | null>(null);
  const [updatingInquiryId, setUpdatingInquiryId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMessages() {
      setLoading(true);
      setError(null);
      try {
        const [messagesResponse, peopleResponse] = await Promise.all([
          fetchWithAuth('/api/messages'),
          fetchWithAuth('/api/admin/users'),
        ]);
        const messagesData = await messagesResponse.json();
        const peopleData = await peopleResponse.json();
        if (!messagesResponse.ok || !messagesData?.success) throw new Error(messagesData?.error || 'Unable to load messages.');
        if (cancelled) return;
        setMessages(Array.isArray(messagesData.data) ? messagesData.data : []);
        if (peopleResponse.ok && peopleData?.success && Array.isArray(peopleData.data)) {
          setPeople(peopleData.data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setMessages([]);
          setError(loadError instanceof Error ? loadError.message : 'Unable to load messages.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMessages();
    return () => {
      cancelled = true;
    };
  }, [fetchWithAuth, refreshKey]);

  useEffect(() => {
    if (view !== 'inquiries') return;
    let cancelled = false;

    async function loadInquiries() {
      setInquiriesLoading(true);
      setInquiriesError(null);
      try {
        const response = await fetchWithAuth('/api/admin/contact-inquiries');
        const data = await response.json();
        if (!response.ok || !data?.success) throw new Error(data?.error || 'Unable to load contact enquiries.');
        if (cancelled) return;
        setInquiries(Array.isArray(data.data) ? data.data : []);
        if (data.counts && typeof data.counts === 'object') setInquiryCounts(data.counts);
      } catch (loadError) {
        if (!cancelled) {
          setInquiries([]);
          setInquiriesError(loadError instanceof Error ? loadError.message : 'Unable to load contact enquiries.');
        }
      } finally {
        if (!cancelled) setInquiriesLoading(false);
      }
    }

    loadInquiries();
    return () => {
      cancelled = true;
    };
  }, [fetchWithAuth, refreshKey, view]);

  const nameById = useMemo(
    () => people.reduce<Record<string, string>>((names, person) => {
      names[person.id] = `${person.firstName} ${person.lastName}`.trim();
      return names;
    }, {}),
    [people]
  );

  const visibleMessages = useMemo(() => {
    const term = search.trim().toLowerCase();
    return messages.filter((message) => {
      const isReceived = message.recipientId === user?.id;
      if (box === 'received' && !isReceived) return false;
      if (box === 'sent' && isReceived) return false;
      const counterpart = nameById[isReceived ? message.senderId : message.recipientId] ?? '';
      const haystack = `${message.subject} ${message.body} ${counterpart}`.toLowerCase();
      return !term || haystack.includes(term);
    });
  }, [messages, search, box, user?.id, nameById]);

  const receivedCount = messages.filter((message) => message.recipientId === user?.id).length;

  const visibleInquiries = useMemo(() => {
    const term = inquirySearch.trim().toLowerCase();
    return inquiries.filter((inquiry) => {
      if (inquiryFilter !== 'all' && inquiry.status !== inquiryFilter) return false;
      const haystack = `${inquiry.name} ${inquiry.email} ${inquiry.reason} ${inquiry.message}`.toLowerCase();
      return !term || haystack.includes(term);
    });
  }, [inquiries, inquiryFilter, inquirySearch]);

  const updateInquiryStatus = async (inquiryId: string, status: InquiryStatus) => {
    setUpdatingInquiryId(inquiryId);
    setInquiriesError(null);
    try {
      const response = await fetchWithAuth(`/api/admin/contact-inquiries/${inquiryId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok || !data?.success) throw new Error(data?.error || 'Unable to update this enquiry.');
      setRefreshKey((key) => key + 1);
    } catch (updateError) {
      setInquiriesError(updateError instanceof Error ? updateError.message : 'Unable to update this enquiry.');
    } finally {
      setUpdatingInquiryId(null);
    }
  };

  const openCompose = () => {
    setForm({ recipientId: '', subject: '', body: '' });
    setFormError(null);
    setIsComposeOpen(true);
  };

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.recipientId) {
      setFormError('Choose who should receive this message.');
      return;
    }
    if (!form.subject.trim() || !form.body.trim()) {
      setFormError('Add a subject and a message body.');
      return;
    }

    setIsSending(true);
    setFormError(null);
    try {
      const response = await fetchWithAuth('/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          recipientId: form.recipientId,
          subject: form.subject.trim(),
          body: form.body.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.success) throw new Error(data?.error || 'Unable to send this message.');
      setIsComposeOpen(false);
      setRefreshKey((key) => key + 1);
    } catch (sendError) {
      setFormError(sendError instanceof Error ? sendError.message : 'Unable to send this message.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 flex-1 overflow-y-auto mb-16 md:mb-0 bg-slate-50">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <MessageSquare className="w-8 h-8 text-indigo-600" />
              Support Desk
            </h1>
            <p className="text-slate-500 mt-1">
              {view === 'messages'
                ? 'Direct messages between your admin account and platform users.'
                : 'Messages submitted through the public contact form.'}
            </p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setRefreshKey((key) => key + 1)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            {view === 'messages' && (
              <button
                type="button"
                onClick={openCompose}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
              >
                <Send className="w-4 h-4" /> New message
              </button>
            )}
          </div>
        </div>

        <div role="tablist" aria-label="Support desk view" className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {([
            { key: 'messages', label: 'Direct messages', Icon: MessageSquare },
            { key: 'inquiries', label: 'Contact enquiries', Icon: Mail },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={view === tab.key}
              onClick={() => setView(tab.key)}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
                view === tab.key ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <tab.Icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </div>

        {view === 'messages' ? (
          <>
            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
              <p>
                This is your own inbox: messages you sent and messages addressed to you. Platform-wide broadcasts are not
                implemented yet, so every message here is a targeted direct message to a named account.
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search subject, body, or person..."
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                {([
                  { key: 'all', label: `All (${messages.length})` },
                  { key: 'received', label: `Received (${receivedCount})` },
                  { key: 'sent', label: `Sent (${messages.length - receivedCount})` },
                ] as const).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setBox(tab.key)}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                      box === tab.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Loading messages...</div>
            ) : visibleMessages.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
                <Inbox className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 font-semibold text-slate-800">No messages in this view</p>
                <p className="mt-1 text-sm text-slate-500">Send a direct message to a landlord or tenant to start a thread.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {visibleMessages.map((message) => {
                  const isReceived = message.recipientId === user?.id;
                  const counterpart = nameById[isReceived ? message.senderId : message.recipientId] ?? 'Unknown account';
                  return (
                    <div key={message.id} className="p-5 hover:bg-slate-50 transition-colors">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
                            isReceived ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-indigo-200 bg-indigo-50 text-indigo-700'
                          )}>
                            {isReceived ? 'Received' : 'Sent'}
                          </span>
                          <p className="font-semibold text-slate-900">{message.subject}</p>
                          {isReceived && !message.read && (
                            <span className="h-2 w-2 rounded-full bg-indigo-500" aria-label="Unread" />
                          )}
                        </div>
                        <span className="text-xs text-slate-500">{new Date(message.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="mt-2 line-clamp-3 text-sm text-slate-600 whitespace-pre-wrap">{message.body}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        {isReceived ? 'From' : 'To'}: <span className="font-medium text-slate-700">{counterpart}</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
              <p>
                These are messages sent through the public contact form. Nothing is emailed out automatically, so mark an
                enquiry handled once you have replied. The most recent 200 enquiries are listed.
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={inquirySearch}
                  onChange={(event) => setInquirySearch(event.target.value)}
                  placeholder="Search name, email, reason, or message..."
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div className="flex flex-wrap rounded-xl border border-slate-200 bg-slate-50 p-1">
                {([
                  { key: 'all', label: `All (${inquiries.length})` },
                  { key: 'new', label: `New (${inquiryCounts.new ?? 0})` },
                  { key: 'handled', label: `Handled (${inquiryCounts.handled ?? 0})` },
                  { key: 'archived', label: `Archived (${inquiryCounts.archived ?? 0})` },
                ] as const).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setInquiryFilter(tab.key)}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                      inquiryFilter === tab.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {inquiriesError && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {inquiriesError}
              </div>
            )}

            {inquiriesLoading ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Loading enquiries...</div>
            ) : visibleInquiries.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
                <Inbox className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 font-semibold text-slate-800">No enquiries in this view</p>
                <p className="mt-1 text-sm text-slate-500">Messages sent through the public contact form appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                {visibleInquiries.map((inquiry) => (
                  <div key={inquiry.id} className="p-5 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">{inquiry.name}</p>
                          <span className={cn(
                            'rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
                            inquiryStatusStyles[inquiry.status] ?? inquiryStatusStyles.archived
                          )}>
                            {inquiry.status}
                          </span>
                          <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600">
                            {inquiry.reason}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          <a href={`mailto:${inquiry.email}`} className="font-medium text-slate-700 hover:underline">{inquiry.email}</a>
                          {inquiry.phone ? ` · ${inquiry.phone}` : ''}
                        </p>
                      </div>
                      <span className="text-xs text-slate-500">{new Date(inquiry.createdAt).toLocaleString()}</span>
                    </div>

                    <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{inquiry.message}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={updatingInquiryId === inquiry.id || inquiry.status === 'handled'}
                        onClick={() => updateInquiryStatus(inquiry.id, 'handled')}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Mark handled
                      </button>
                      <button
                        type="button"
                        disabled={updatingInquiryId === inquiry.id || inquiry.status === 'archived'}
                        onClick={() => updateInquiryStatus(inquiry.id, 'archived')}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Archive className="h-3.5 w-3.5" /> Archive
                      </button>
                      <button
                        type="button"
                        disabled={updatingInquiryId === inquiry.id || inquiry.status === 'new'}
                        onClick={() => updateInquiryStatus(inquiry.id, 'new')}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Mail className="h-3.5 w-3.5" /> Move to new
                      </button>
                      {updatingInquiryId === inquiry.id && <span className="text-xs text-slate-500">Saving...</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {isComposeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">New direct message</h2>
                <p className="text-sm text-slate-500">The message is sent as your admin account.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsComposeOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSend} className="space-y-4 p-6">
              <div>
                <label htmlFor="message-recipient" className="mb-1 block text-sm font-medium text-slate-700">Recipient</label>
                <select
                  id="message-recipient"
                  value={form.recipientId}
                  onChange={(event) => setForm((current) => ({ ...current, recipientId: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">Choose an account</option>
                  {people.filter((person) => person.id !== user?.id).map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.firstName} {person.lastName} · {person.role} · {person.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="message-subject" className="mb-1 block text-sm font-medium text-slate-700">Subject</label>
                <input
                  id="message-subject"
                  value={form.subject}
                  maxLength={160}
                  onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Support follow-up"
                />
              </div>

              <div>
                <label htmlFor="message-body" className="mb-1 block text-sm font-medium text-slate-700">Message</label>
                <textarea
                  id="message-body"
                  value={form.body}
                  maxLength={4000}
                  rows={5}
                  onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
                  className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Write the message the user will receive."
                />
              </div>

              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Send className="w-4 h-4" /> {isSending ? 'Sending...' : 'Send message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
