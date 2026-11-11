import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function Pricing() {
  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-24 lg:px-12">
      <div className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#756B61]">
          Pricing
        </p>
        <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em] text-[#332D29] sm:text-5xl">
          Start with the right setup.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[#756B61]">
          Plans and payment-provider availability are being finalized. Tell us
          about your portfolio and we will confirm current access, included
          workflows, and pricing before you commit.
        </p>
        <Link
          to="/contact"
          className="mt-7 inline-flex min-h-12 items-center gap-3 bg-[#332D29] px-6 py-3 text-sm font-semibold text-white hover:bg-[#4A4039]"
        >
          Ask about pricing
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
