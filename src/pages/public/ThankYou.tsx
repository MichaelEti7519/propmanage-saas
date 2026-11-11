import { Link, Navigate, useLocation } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

export function ThankYou() {
  const location = useLocation();
  if (location.state?.source !== 'contact') return <Navigate to="/contact" replace />;

  return (
    <section className="flex min-h-[65vh] items-center bg-[#E7F0EA] px-6 py-16">
      <div className="mx-auto w-full max-w-3xl border-t-4 border-[#397451] bg-white p-7 shadow-sm sm:p-10">
        <CheckCircle2 className="h-10 w-10 text-[#397451]" />
        <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-[#397451]">Message received</p>
        <h1 className="mt-2 text-3xl font-bold text-[#332D29]">Thank you for getting in touch.</h1>
        <p className="mt-3 max-w-2xl leading-7 text-[#756B61]">Your inquiry has been recorded. We aim to respond within one business day, Monday through Friday.</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link to="/" className="rounded-lg bg-[#332D29] px-5 py-3 font-semibold text-white hover:bg-[#397451]">Back to homepage</Link>
          <Link to="/pricing" className="rounded-lg border border-[#E8DDCC] px-5 py-3 font-semibold text-[#332D29] hover:bg-[#FAF8F3]">Review pricing</Link>
        </div>
      </div>
    </section>
  );
}
