import { Building2 } from 'lucide-react';
import { StatusChip } from './StatusChip';
import { displayHeading, eyebrow, pageShell, sectionY } from './theme';

export function TenantSection() {
  return (
    <section className={`bg-[#E8DDCC]/40 ${sectionY}`}>
      <div className={`${pageShell} grid items-center gap-12 lg:grid-cols-2 lg:gap-20`}>

        <div className="relative">
          <div className="relative mx-auto max-w-md rounded-2xl border border-white/70 bg-white/80 p-6 shadow-[0_28px_70px_-40px_rgba(51,45,41,0.5)] backdrop-blur-xl sm:p-9">
            <div className="flex items-center justify-between border-b border-[#E8DDCC]/70 pb-5">
              <div>
                <p className="text-xs text-[#756B61]">Tenant workspace</p>
                <p className="mt-1 font-display text-xl font-semibold text-[#332D29]">
                  Welcome back.
                </p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#397451]/10 text-[#397451]">
                <Building2 className="h-5 w-5" />
              </span>
            </div>

            <div className="py-5">
              <p className="text-xs text-[#756B61]">Your property</p>
              <p className="mt-1 font-display text-xl font-semibold text-[#332D29]">
                Flat 2, Adeniyi Court
              </p>
              <p className="mt-1 text-xs text-[#756B61]">Bodija, Ibadan</p>
            </div>

            <div className="rounded-xl border border-[#E8DDCC]/90 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-[#756B61]">Next rent due</p>
                <StatusChip status="due" label="Due soon" />
              </div>
              <p className="mt-3 font-display text-3xl font-semibold text-[#332D29]">
                ₦1,200,000
              </p>
              <p className="mt-1.5 text-xs text-[#756B61]">
                Sample rent record
              </p>
            </div>

            <div className="mt-4 rounded-xl bg-[#FAF8F3] p-5">
              <p className="text-xs font-semibold text-[#332D29]">
                A message from your landlord
              </p>
              <p className="mt-1.5 text-sm leading-6 text-[#756B61]">
                The plumber is coming Thursday morning.
              </p>
            </div>

            <div className="mt-4 flex min-h-12 items-center justify-center rounded-xl bg-[#332D29] text-sm font-semibold text-white">
              Report a maintenance issue
            </div>

            <p className="mt-4 text-center text-[10px] text-[#756B61]">
              Illustrative tenant portal preview · Sample data
            </p>
          </div>
        </div>

        <div>
          <p className={eyebrow}>
            More than a landlord dashboard
          </p>
          <h2 className={`mt-4 text-3xl sm:text-[2.6rem] ${displayHeading}`}>
            A better rental experience works both ways.
          </h2>
          <p className="mt-6 max-w-lg text-sm leading-7 text-[#756B61]">
            Tenants have their own dedicated workspace. They can keep track
            of rental information, communicate with their landlord and
            raise maintenance requests.
          </p>

          <div className="mt-8 border-t border-[#B9A58B]/60 pt-6">
            <p className="font-display text-xl font-medium text-[#332D29]">
              Clear records. Clear communication. Fewer loose ends.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
