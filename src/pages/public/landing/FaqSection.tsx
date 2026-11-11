import { Link } from 'react-router-dom';
import { faqs } from './sampleData';
import { displayHeading, eyebrow, pageShell, sectionY } from './theme';

export function FaqSection() {
  return (
    <section
      id="faq"
      className={`scroll-mt-24 bg-white ${sectionY}`}
    >
      <div className={`${pageShell} grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20`}>
        <div>
          <p className={eyebrow}>
            Good to know
          </p>
          <h2 className={`mt-4 text-3xl sm:text-[2.6rem] ${displayHeading}`}>
            Before you make yourself at home.
          </h2>
          <p className="mt-5 text-sm leading-7 text-[#756B61]">
            Still have a question?{' '}
            <Link
              to="/contact"
              className="font-semibold text-[#397451] underline decoration-[#397451]/30 underline-offset-4 transition-colors hover:decoration-[#397451]"
            >
              Talk to us.
            </Link>
          </p>
        </div>

        <div className="divide-y divide-[#E8DDCC]/80 overflow-hidden rounded-2xl border border-[#E8DDCC]">
          {faqs.map((faq) => (
            <details key={faq.question} className="group px-5 transition-colors open:bg-[#FAF8F3] hover:bg-[#FAF8F3]">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-semibold text-[#332D29] marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#B9A58B] [&::-webkit-details-marker]:hidden">
                {faq.question}
                <span
                  aria-hidden="true"
                  className="shrink-0 text-lg font-normal leading-none text-[#B9A58B] transition-transform duration-300 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="max-w-2xl pb-5 pr-6 text-sm leading-7 text-[#756B61]">
                {faq.answer || (
                  <>
                    We collect what is needed to run accounts and rental
                    workflows. Read the{' '}
                    <Link
                      to="/privacy"
                      className="font-semibold text-[#397451] underline decoration-[#397451]/30 underline-offset-4"
                    >
                      Privacy Policy
                    </Link>{' '}
                    for details.
                  </>
                )}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
