import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { displayHeading, pageShell } from './theme';

export function CtaSection() {
  return (
    <>
      <section className="bg-white pb-16 sm:pb-20">
        <div className={pageShell}>
          <div className="flex flex-col justify-between gap-8 rounded-2xl bg-[#397451] px-6 py-12 text-white sm:px-10 sm:py-14 md:flex-row md:items-end">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/65">
                Your next chapter starts here
              </p>
              <h2 className={`mt-4 max-w-2xl text-3xl sm:text-[2.6rem] ${displayHeading} text-white`}>
                Make room for better property management.
              </h2>
            </div>

            <Link
              to="/login"
              className="group inline-flex min-h-12 shrink-0 items-center justify-center gap-3 rounded-xl bg-[#FAF8F3] px-6 text-sm font-semibold text-[#332D29] transition-colors duration-200 hover:bg-[#E8DDCC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#397451]"
            >
              Create an account
              <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Sticky action for small screens; the bottom padding keeps content clear of it. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E8DDCC] bg-[#FAF8F3]/90 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden">
        <Link
          to="/login"
          className="flex min-h-12 items-center justify-center gap-3 rounded-xl bg-[#332D29] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#397451]"
        >
          Get started
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </>
  );
}
