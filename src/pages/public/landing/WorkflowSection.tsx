import { steps } from './sampleData';
import { pageShell, sectionY } from './theme';

export function WorkflowSection() {
  return (
    <section id="workflows" className={`relative scroll-mt-24 overflow-hidden bg-[#332D29] text-white ${sectionY}`}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 h-72 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(185,165,139,0.18),transparent_75%)]"
      />

      <div className={`relative ${pageShell}`}>
        <div className="flex flex-col gap-8 border-b border-white/10 pb-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#B9A58B]">
              <span aria-hidden="true" className="h-px w-7 bg-[#B9A58B]/70" />
              A simpler process
              <span className="font-display tracking-[0.1em]">04</span>
            </p>

            <h2 className="mt-5 text-balance font-display text-3xl font-semibold leading-[1.06] tracking-[-0.025em] text-white sm:text-[2.6rem]">
              Start with a property. Build from there.
            </h2>
          </div>

          <p className="max-w-sm text-[13px] leading-7 text-[#E8DDCC]/70">
            Set up your units, invite tenants and keep the tenancy information organised as
            things happen — not afterwards.
          </p>
        </div>

        <div className="relative mt-12">
          <ol className="relative grid gap-10 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-12 lg:grid-cols-4 lg:gap-x-8">
            {steps.map(([title, description], index) => (
              <li
                key={title}
                className="group border-t border-white/15 pt-5 transition-colors duration-300 hover:border-[#B9A58B]/80"
              >
                <span className="font-display text-[11px] font-semibold tracking-[0.16em] text-[#B9A58B] transition-colors duration-300 group-hover:text-white">
                  0{index + 1}
                </span>

                <h3 className="mt-3 text-[15px] font-semibold text-white">{title}</h3>
                <p className="mt-2 text-[13px] leading-6 text-[#E8DDCC]/65 transition-colors duration-300 group-hover:text-[#E8DDCC]/85">
                  {description}
                </p>
              </li>
            ))}
          </ol>
        </div>

        <p className="mt-12 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-white/10 pt-6 text-[11.5px] text-[#E8DDCC]/55">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#B9A58B]">
            Available now
          </span>
          Invitations, rent status and maintenance requests are live. Online payments are still
          being built.
        </p>
      </div>
    </section>
  );
}
