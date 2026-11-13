import { useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { Check, FileText, MessageSquare, Wrench } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { SectionHeading } from './SectionHeading';
import { StatusChip } from './StatusChip';
import { mutedLabel, pageShell, sampleBadge, sectionY } from './theme';

type RoleId = 'landlord' | 'tenant' | 'admin';

const roles: { id: RoleId; label: string; summary: string; points: string[] }[] = [
  {
    id: 'landlord',
    label: 'Landlord',
    summary: 'The whole portfolio, without the guesswork.',
    points: [
      'Add each building, then the units inside it with their rent.',
      'Invite a tenant with a private link that belongs to one unit.',
      'See rent status per unit: paid, due soon, or overdue.',
      'Follow a repair from the tenant’s request to completion.',
    ],
  },
  {
    id: 'tenant',
    label: 'Tenant',
    summary: 'Their own record, not a chat thread.',
    points: [
      'Rent due dates and payment history on the unit they live in.',
      'Message the landlord in the same place the tenancy lives.',
      'Raise a maintenance request and watch it move forward.',
      'Keep the lease and receipts together, not in an inbox.',
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    summary: 'Oversight that stays on the record.',
    points: [
      'Review reports and move them through statuses with notes.',
      'Record trust-score changes explicitly, never silently.',
      'Track verification and blacklist flags as they are decided.',
      'Read contact enquiries in one queue instead of an inbox.',
    ],
  },
];

function PreviewShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#E8DDCC] bg-white p-5 shadow-[0_30px_70px_-46px_rgba(51,45,41,0.55)] sm:p-7">
      <div className="flex items-start justify-between gap-4 border-b border-[#E8DDCC]/70 pb-4">
        <div>
          <p className="font-display text-lg font-semibold tracking-tight text-[#332D29]">{title}</p>
          <p className="mt-0.5 text-xs text-[#756B61]">{subtitle}</p>
        </div>
        <span className={sampleBadge}>Sample data</span>
      </div>
      {children}
    </div>
  );
}

function OccupancyRow({ name, meta, percent }: { name: string; meta: string; percent: number }) {
  return (
    <div className="flex items-center gap-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-[#332D29]">{name}</p>
        <p className="mt-0.5 text-[11px] text-[#756B61]">{meta}</p>
      </div>
      <div className="w-24 shrink-0">
        <div className="h-1.5 overflow-hidden rounded-full bg-[#E8DDCC]">
          <div className="h-full rounded-full bg-[#397451]" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-1.5 text-right text-[10px] font-medium text-[#756B61]">{percent}% let</p>
      </div>
    </div>
  );
}

function LandlordPreview() {
  return (
    <PreviewShell title="Portfolio" subtitle="Three properties, Ibadan">
      <div className="divide-y divide-[#E8DDCC]/60">
        <OccupancyRow name="Adeniyi Court" meta="4 units · Bodija" percent={75} />
        <OccupancyRow name="Opebi Terrace" meta="6 units · Opebi" percent={100} />
        <OccupancyRow name="Ikoyi Flats" meta="2 units · Ikoyi" percent={50} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[#E8DDCC]/70 pt-4">
        <div>
          <p className={mutedLabel}>Outstanding</p>
          <p className="mt-1 font-display text-lg font-semibold text-[#332D29]">₦2.15m</p>
        </div>
        <div>
          <p className={mutedLabel}>Open requests</p>
          <p className="mt-1 font-display text-lg font-semibold text-[#332D29]">1</p>
        </div>
      </div>
    </PreviewShell>
  );
}

function TenantPreview() {
  return (
    <PreviewShell title="Flat 2, Adeniyi Court" subtitle="Bodija, Ibadan">
      <div className="divide-y divide-[#E8DDCC]/60">
        <div className="flex items-center justify-between gap-3 py-4">
          <div>
            <p className="text-xs text-[#756B61]">Next rent due</p>
            <p className="mt-1.5 font-display text-[26px] font-semibold leading-none text-[#332D29]">
              ₦1,200,000
            </p>
          </div>
          <StatusChip status="due" label="Due soon" />
        </div>

        <div className="flex items-start gap-3 py-3.5">
          <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#397451]" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-[#332D29]">Your landlord</p>
            <p className="mt-0.5 truncate text-[11.5px] text-[#756B61]">
              The plumber is coming Thursday morning.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 py-3.5">
          <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#756B61]" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-[#332D29]">Lease agreement</p>
            <p className="mt-0.5 text-[11px] text-[#756B61]">PDF · on file</p>
          </div>
        </div>
      </div>

      <div className="mt-2 flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#332D29] text-[13px] font-semibold text-white">
        <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
        Report a maintenance issue
      </div>
    </PreviewShell>
  );
}

function AdminPreview() {
  const counters = [
    ['Open reports', '2'],
    ['Awaiting review', '1'],
    ['Verification', '5'],
  ];

  return (
    <PreviewShell title="Operations queue" subtitle="This week">
      <div className="grid grid-cols-3 divide-x divide-[#E8DDCC]/70 border-b border-[#E8DDCC]/60">
        {counters.map(([label, value]) => (
          <div key={label} className="px-2 py-4 first:pl-0 last:pr-0">
            <p className="text-[10px] uppercase tracking-[0.1em] text-[#8A7E72]">{label}</p>
            <p className="mt-1 font-display text-lg font-semibold text-[#332D29]">{value}</p>
          </div>
        ))}
      </div>

      <div className="py-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-[#332D29]">Report · property listing</p>
            <p className="mt-0.5 truncate text-[11px] text-[#756B61]">Risk band · medium</p>
          </div>
          <StatusChip status="due" label="Reviewing" />
        </div>

        <div className="mt-3 border-t border-[#E8DDCC]/70 pt-3">
          <p className={mutedLabel}>Trust adjustment</p>
          <p className="mt-1 text-[11.5px] leading-5 text-[#756B61]">
            Recorded against the note above. Nothing changes quietly.
          </p>
        </div>
      </div>

      <p className="border-t border-[#E8DDCC]/60 pt-3 text-[10px] text-[#8A7E72]">
        Illustrative admin queue · Sample data
      </p>
    </PreviewShell>
  );
}

const previews: Record<RoleId, ReactNode> = {
  landlord: <LandlordPreview />,
  tenant: <TenantPreview />,
  admin: <AdminPreview />,
};

export function RolesSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const tabListRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [pill, setPill] = useState<{ x: number; width: number } | null>(null);
  const reduceMotion = useReducedMotion();
  const active = roles[activeIndex];

  // The pill is measured from the buttons themselves, so it stays correct at any width.
  useLayoutEffect(() => {
    const measure = () => {
      const el = tabRefs.current[activeIndex];
      if (!el) return;
      setPill((prev) =>
        prev && prev.x === el.offsetLeft && prev.width === el.offsetWidth
          ? prev
          : { x: el.offsetLeft, width: el.offsetWidth },
      );
    };

    measure();

    const list = tabListRef.current;
    if (!list || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [activeIndex]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const { key } = event;
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(key)) return;

    event.preventDefault();
    const last = roles.length - 1;
    let next = activeIndex;

    if (key === 'ArrowRight') next = activeIndex === last ? 0 : activeIndex + 1;
    if (key === 'ArrowLeft') next = activeIndex === 0 ? last : activeIndex - 1;
    if (key === 'Home') next = 0;
    if (key === 'End') next = last;

    setActiveIndex(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <section id="roles" className={`scroll-mt-24 bg-[#E8DDCC]/45 ${sectionY}`}>
      <div className={pageShell}>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            index="03"
            eyebrowText="One record, three views"
            title="Everyone sees the same tenancy."
            lede="A landlord, a tenant and an administrator are looking at the same facts — each with the tools their side of the work needs."
          />

          <p className="max-w-xs text-[13px] leading-6 text-[#756B61] lg:text-right">
            Switch roles to see what changes. Nothing here needs a second spreadsheet.
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-8 lg:mt-12">
          <div
            ref={tabListRef}
            role="tablist"
            aria-label="Workspace roles"
            onKeyDown={handleKeyDown}
            className="relative flex w-full gap-5 overflow-x-auto border-b border-[#B9A58B]/50 hide-scrollbar sm:w-auto sm:self-start sm:gap-8"
          >
            {pill && (
              <motion.span
                aria-hidden="true"
                initial={false}
                animate={{ x: pill.x, width: pill.width }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 380, damping: 34, mass: 0.7 }
                }
                className="pointer-events-none absolute bottom-0 left-0 h-[2px] bg-[#332D29]"
              />
            )}

            {roles.map((role, index) => {
              const selected = index === activeIndex;

              return (
                <button
                  key={role.id}
                  ref={(el) => {
                    tabRefs.current[index] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`role-tab-${role.id}`}
                  aria-selected={selected}
                  aria-controls={`role-panel-${role.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActiveIndex(index)}
                  className={[
                    'relative z-10 flex min-h-12 flex-1 items-center justify-center whitespace-nowrap px-2 pb-3 text-[13px] font-semibold transition-colors duration-200 sm:flex-none sm:justify-start',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9A58B]',
                    selected ? 'text-[#332D29]' : 'text-[#8A7E72] hover:text-[#332D29]',
                  ].join(' ')}
                >
                  {role.label}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active.id}
              role="tabpanel"
              id={`role-panel-${active.id}`}
              aria-labelledby={`role-tab-${active.id}`}
              tabIndex={0}
              initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="grid items-start gap-8 focus-visible:outline-none lg:grid-cols-[1fr_1.05fr] lg:gap-14"
            >
              <div>
                <p className="font-display text-2xl font-semibold leading-tight tracking-tight text-[#332D29] sm:text-[1.75rem]">
                  {active.summary}
                </p>

                <ul className="mt-6 space-y-4">
                  {active.points.map((point) => (
                    <li key={point} className="flex gap-3 text-[13.5px] leading-6 text-[#5E554D]">
                      <Check className="mt-[5px] h-3.5 w-3.5 shrink-0 text-[#397451]" strokeWidth={2.5} />
                      {point}
                    </li>
                  ))}
                </ul>

                <p className="mt-7 border-t border-[#B9A58B]/50 pt-5 font-display text-base font-medium text-[#332D29]">
                  One tenancy. One history. No version to reconcile.
                </p>
              </div>

              {previews[active.id]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
