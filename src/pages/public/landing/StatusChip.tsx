import type { Status } from './sampleData';

const statusStyles: Record<Status, { dot: string; text: string }> = {
  paid: { dot: 'bg-[#397451]', text: 'text-[#397451]' },
  due: { dot: 'bg-[#95651D]', text: 'text-[#95651D]' },
  overdue: { dot: 'bg-[#B44036]', text: 'text-[#B44036]' },
  invited: { dot: 'bg-[#8A7E72]', text: 'text-[#756B61]' },
};

/** A dot and a word, the way a ledger reads. No filled pill. */
export function StatusChip({ status, label }: { status: Status; label: string }) {
  const tone = statusStyles[status];

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] ${tone.text}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      {label}
    </span>
  );
}
