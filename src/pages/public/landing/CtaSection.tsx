import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import panelImage from '../../../assets/auth-panel.jpg';
import { pageShell } from './theme';

export function CtaSection() {
  return (
    <>
      <section className="bg-white pb-16 sm:pb-20">
        <div className={pageShell}>
          <div className="relative isolate overflow-hidden rounded-2xl bg-[#332D29] text-white">
            <img
              src={panelImage}
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 bg-[linear-gradient(105deg,#332D29_18%,rgba(51,45,41,0.92)_48%,rgba(51,45,41,0.55)_100%)]"
            />

            <div className="flex flex-col justify-between gap-9 px-6 py-12 sm:px-10 sm:py-14 md:flex-row md:items-end md:gap-12">
              <div className="max-w-xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#B9A58B]">
                  Your next chapter starts here
                </p>

                <h2 className="mt-4 text-balance font-display text-3xl font-semibold leading-[1.06] tracking-[-0.025em] text-white sm:text-[2.6rem]">
                  Make room for better property management.
                </h2>

                <p className="mt-4 max-w-md text-[13.5px] leading-6 text-[#E8DDCC]/75">
                  Set up a property, invite your tenant, and keep the record in one place from
                  the first day of the tenancy.
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-3">
                <Link
                  to="/login"
                  className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-lg bg-[#FAF8F3] px-6 text-sm font-semibold text-[#332D29] transition-colors duration-200 hover:bg-[#E8DDCC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#332D29]"
                >
                  Create an account
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>

                <Link
                  to="/login"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/25 px-5 text-sm font-semibold text-white transition-colors duration-200 hover:border-white/50 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#332D29]"
                >
                  Log in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky action for small screens; the bottom padding keeps content clear of it. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E8DDCC] bg-[#FAF8F3] p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden">
        <Link
          to="/login"
          className="flex min-h-12 items-center justify-center gap-3 rounded-lg bg-[#332D29] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#397451]"
        >
          Get started
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </>
  );
}
