import React, { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Send, Inbox, Search, X, RefreshCw, Info } from 'lucide-react';
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
            <p className="text-slate-500 mt-1">Direct messages between your admin account and platform users.</p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setRefreshKey((key) => key + 1)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button
              type="button"
              onClick={openCompose}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            >
              <Send className="w-4 h-4" /> New message
            </button>
          </div>
        </div>

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
