import React, { useMemo, useState } from 'react';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export type ReportTargetType = 'tenant' | 'landlord';

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetName: string;
  tenantRef?: string;
}

const REPORT_REASONS = [
  'Fraud or scam activity',
  'Rent payment dispute',
  'Harassment or safety issue',
  'Property damage or maintenance abuse',
  'False information or identity concerns',
  'Other',
] as const;

const RISK_LEVELS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
] as const;

export function ReportModal({
  open,
  onClose,
  targetType,
  targetId,
  targetName,
  tenantRef,
}: ReportModalProps) {
  const { fetchWithAuth } = useAuth();
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [riskBand, setRiskBand] = useState<(typeof RISK_LEVELS)[number]['value']>('medium');
  const [escalateForReview, setEscalateForReview] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const headerLabel = useMemo(
    () => (targetType === 'tenant' ? 'Report Tenant' : 'Report Landlord'),
    [targetType]
  );

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetchWithAuth('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetType,
          targetId,
          targetName,
          reason,
          message: details.trim() || 'No additional details supplied.',
          riskBand,
          escalateForReview,
          tenantRef,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data?.error || 'Unable to submit the report right now.');
      }

      setSubmitted(true);
      window.setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to report this user right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{headerLabel}</h3>
              <p className="text-sm text-slate-500">{targetName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close report form"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Report issues that affect safety, fraud, payment disputes, or trust concerns. Reviews are handled by the platform team.
              </span>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Reason</label>
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
            >
              {REPORT_REASONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Risk level</label>
            <div className="grid grid-cols-3 gap-2">
              {RISK_LEVELS.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setRiskBand(level.value)}
                  className={[
                    'rounded-xl border px-3 py-2 text-sm font-medium transition',
                    riskBand === level.value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                  ].join('')}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Details</label>
            <textarea
              rows={5}
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Add a clear summary of what happened, dates, messages, or evidence."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
            />
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={escalateForReview}
              onChange={(event) => setEscalateForReview(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Escalate to admin review
          </label>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {submitted && !error && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Report sent successfully. The platform team will review it shortly.
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
            >
              {isSubmitting ? 'Submitting...' : 'Submit report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )};