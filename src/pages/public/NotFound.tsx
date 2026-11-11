import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function NotFound() {
  return (
    <div className="flex min-h-[65vh] items-center bg-[#FAF8F3] px-6 py-16">
      <div className="mx-auto w-full max-w-6xl border-l-4 border-[#397451] bg-white px-6 py-10 sm:px-12 sm:py-14">
        <p className="text-sm font-semibold uppercase tracking-wider text-[#397451]">Page not found</p>
        <h1 className="mt-3 text-6xl font-bold text-[#332D29]">404</h1>
        <p className="mt-4 max-w-xl text-lg leading-7 text-[#756B61]">This address doesn&apos;t point to a page. Head back to the homepage or choose a useful place to continue.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#397451] px-5 py-2.5 font-semibold text-white hover:bg-[#332D29]">Homepage <ArrowRight className="h-4 w-4" /></Link>
          <Link to="/pricing" className="inline-flex min-h-11 items-center rounded-lg border border-[#E8DDCC] bg-white px-5 py-2.5 font-semibold text-[#332D29] hover:bg-[#FAF8F3]">Pricing</Link>
          <Link to="/contact" className="inline-flex min-h-11 items-center rounded-lg border border-[#E8DDCC] bg-white px-5 py-2.5 font-semibold text-[#332D29] hover:bg-[#FAF8F3]">Contact</Link>
        </div>
      </div>
    </div>
  );
}
