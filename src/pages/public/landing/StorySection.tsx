import { SectionHeading } from './SectionHeading';
import { pageShell, sectionY } from './theme';

const pillars = [
  ['01', 'Properties', 'Buildings and the units inside them.'],
  ['02', 'Tenants', 'Who lives where, and on what terms.'],
  ['03', 'Operations', 'Rent, repairs and the messages between.'],
];

export function StorySection() {
  return (
    <>
      <section className="bg-white">
        <div className={pageShell}>
          <div className="grid gap-8 border-b border-[#E8DDCC]/70 py-9 sm:grid-cols-3 sm:gap-0">
            {pillars.map(([number, label, description], index) => (
              <div
                key={number}
                className={[
                  'sm:px-7',
                  index === 0 ? 'sm:pl-0' : 'sm:border-l sm:border-[#E8DDCC]',
                  index === 2 ? 'sm:pr-0' : '',
                ].join(' ')}
              >
                <p className="font-display text-[12px] font-semibold tracking-[0.14em] text-[#B9A58B]">
                  {number}
                </p>
                <p className="mt-2 font-display text-lg font-semibold tracking-tight text-[#332D29]">
                  {label}
                </p>
                <p className="mt-1 text-[12.5px] leading-6 text-[#756B61]">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`bg-[#FAF8F3] ${sectionY}`}>
        <div className={`${pageShell} grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-center md:gap-20`}>
          <SectionHeading
            index="01"
            eyebrowText="The people behind every property"
            title="A tenancy is more than an address."
            lede="Keep the place and the day-to-day experience in view — from a tenant’s first message to the maintenance follow-through."
          />

          <div className="md:border-l md:border-[#B9A58B]/50 md:pl-10 lg:pl-14">
            <p className="font-display text-[1.6rem] font-medium leading-[1.25] tracking-[-0.02em] text-[#332D29] sm:text-[1.9rem]">
              Clear records. Clear communication.
              <br className="hidden sm:block" /> Fewer loose ends.
            </p>

            <p className="mt-6 max-w-md text-[13.5px] leading-7 text-[#756B61]">
              Every unit keeps its own history: who lives there, what they owe, what needs
              fixing, and what was said about it. Nothing has to be reconstructed from memory.
            </p>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[11.5px] font-medium text-[#8A7E72]">
              <span className="flex items-center gap-2">
                <span aria-hidden="true" className="h-1 w-1 rounded-full bg-[#B9A58B]" />
                One record per unit
              </span>
              <span className="flex items-center gap-2">
                <span aria-hidden="true" className="h-1 w-1 rounded-full bg-[#B9A58B]" />
                Shared between both sides
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
