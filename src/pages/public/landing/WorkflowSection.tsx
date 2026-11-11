import { steps } from './sampleData';
import { displayHeading, pageShell, sectionY } from './theme';

export function WorkflowSection() {
  return (
    <section
      id="workflows"
      className={`scroll-mt-24 bg-[#332D29] text-white ${sectionY}`}
    >
      <div className={pageShell}>
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#B9A58B]">
              A simpler process
            </p>
            <h2 className={`mt-4 text-3xl sm:text-[2.6rem] ${displayHeading} text-white`}>
              Start with a property. Build from there.
            </h2>
            <p className="mt-6 max-w-sm text-sm leading-7 text-[#E8DDCC]/70">
              Set up your units, invite tenants and keep the tenancy
              information organised as things happen.
            </p>
          </div>

          <ol className="grid gap-8 sm:grid-cols-2">
            {steps.map(([title, description], index) => (
              <li
                key={title}
                className="border-t border-white/15 pt-5"
              >
                <p className="font-display text-2xl font-medium text-[#B9A58B]">
                  0{index + 1}
                </p>
                <h3 className="mt-3 text-base font-semibold text-white">
                  {title}
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-[#E8DDCC]/65">
                  {description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
