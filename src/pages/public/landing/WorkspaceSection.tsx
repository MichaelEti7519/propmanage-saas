import { Check, Wrench } from 'lucide-react';
import { motion } from 'motion/react';
import { landlordItems, units } from './sampleData';
import { StatusChip } from './StatusChip';
import { displayHeading, eyebrow, pageShell, sectionY } from './theme';

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.3 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

const summaryStats = [
  ['Occupied', '3 of 4'],
  ['Outstanding', '₦2.15m'],
  ['Requests', '01'],
];

function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 25 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7 }}
      className="overflow-hidden rounded-2xl border border-[#E8DDCC] bg-white shadow-[0_36px_90px_-52px_rgba(51,45,41,0.6)]"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[#E8DDCC]/70 bg-[#FAF8F3]/80 px-5 py-4 backdrop-blur sm:px-6">
        <div>
          <p className="font-display text-base font-semibold text-[#332D29]">
            Adeniyi Court
          </p>
          <p className="mt-0.5 text-xs text-[#756B61]">Bodija, Ibadan</p>
        </div>
        <span className="shrink-0 rounded-full border border-[#E8DDCC] bg-white px-3 py-1 text-[10px] font-medium text-[#756B61]">
          Sample data
        </span>
      </div>

      <div className="grid grid-cols-3 divide-x divide-[#E8DDCC]/70 border-b border-[#E8DDCC]/70 bg-white">
        {summaryStats.map(([label, value]) => (
          <div key={label} className="px-3 py-4 sm:px-6 sm:py-5">
            <p className="text-[10px] uppercase tracking-[0.1em] text-[#8A7E72] sm:text-[11px]">{label}</p>
            <p className="mt-1.5 font-display text-base font-semibold text-[#332D29] sm:text-xl">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-[#FAF8F3] p-4 sm:p-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold text-[#332D29]">
            Unit overview
          </p>
          <p className="text-[10px] text-[#756B61]">4 units</p>
        </div>

        <motion.div
          variants={listVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="overflow-hidden rounded-xl border border-[#E8DDCC]/80 bg-white"
        >
          {units.map((row) => (
            <motion.div
              key={row.unit}
              variants={rowVariants}
              className="flex items-center justify-between gap-3 border-b border-[#E8DDCC]/60 px-3 py-3.5 last:border-b-0 sm:px-4"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#332D29]">
                  {row.unit}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-[#756B61]">
                  {row.tenant}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusChip status={row.status} label={row.label} />
                <p className="text-[10px] text-[#756B61]">{row.rent}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#E8DDCC]/80 bg-white p-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F6EBD6] text-[#95651D]">
            <Wrench className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#332D29]">
              Maintenance request
            </p>
            <p className="mt-0.5 truncate text-[11px] text-[#756B61]">
              Flat 3: leaking kitchen tap
            </p>
          </div>
          <StatusChip status="due" label="In progress" />
        </div>
      </div>
    </motion.div>
  );
}

export function WorkspaceSection() {
  return (
    <section id="features" className={`scroll-mt-24 bg-white ${sectionY}`}>
      <div className={`${pageShell} grid items-center gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20`}>

        <div>
          <p className={eyebrow}>
            The PropManage workspace
          </p>

          <h2 className={`mt-4 text-3xl sm:text-[2.6rem] ${displayHeading}`}>
            The details are where good management happens.
          </h2>

          <p className="mt-6 text-sm leading-7 text-[#756B61]">
            No more switching between notebooks, chats and disconnected
            spreadsheets to find out what is happening with a property.
          </p>

          <div className="mt-9 space-y-4">
            {landlordItems.map(([title, description]) => (
              <div key={title} className="flex gap-4 border-t border-[#E8DDCC]/80 pt-4">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#397451]/20 bg-[#397451]/10 text-[#397451]">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-[#332D29]">
                    {title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-[#756B61]">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DashboardPreview />
      </div>
    </section>
  );
}
