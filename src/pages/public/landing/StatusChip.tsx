import type { Status } from './sampleData';

const statusStyles: Record<Status, string> = {
  paid: 'bg-[#E7F0EA] text-[#397451]',
  due: 'bg-[#F6EBD6] text-[#95651D]',
  overdue: 'bg-[#F8E6E3] text-[#B44036]',
  invited: 'bg-[#EFE9DE] text-[#756B61]',
};

export function StatusChip({ status, label }: { status: Status; label: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles[status]}`}
    >
      {label}
    </span>
  );
}
