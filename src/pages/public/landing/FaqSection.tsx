import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { faqs } from './sampleData';
import { SectionHeading } from './SectionHeading';
import { pageShell, sectionY } from './theme';

export function FaqSection() {
  return (
    <section id="faq" className={`scroll-mt-24 bg-white ${sectionY}`}>
      <div className={`${pageShell} grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20`}>
        <div>
          <SectionHeading
            index="06"
            eyebrowText="Good to know"
            title="Before you make yourself at home."
            lede={
              <>
                Still have a question?{' '}
                <Link
                  to="/contact"
                  className="font-semibold text-[#397451] underline decoration-[#397451]/30 underline-offset-4 transition-colors hover:decoration-[#397451]"
                >
                  Talk to us.
                </Link>
              </>
            }
          />

          <p className="mt-8 flex items-center gap-2 text-[11.5px] text-[#8A7E72]">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#397451]" />
            Replies within one business day, Monday to Friday
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-xl border border-[#E8DDCC] bg-white px-4 transition-colors open:border-[#B9A58B]/70 open:bg-[#FAF8F3] hover:border-[#B9A58B]/70 sm:px-5"
            >
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-[13.5px] font-semibold text-[#332D29] marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#B9A58B] [&::-webkit-details-marker]:hidden">
                {faq.question}
                <Plus
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-[#8A7E72] transition-all duration-300 group-open:rotate-45 group-open:text-[#397451]"
                  strokeWidth={2}
                />
              </summary>

              <p className="max-w-2xl pb-5 pr-8 text-[13px] leading-7 text-[#756B61]">
                {faq.answer || (
                  <>
                    We collect what is needed to run accounts and rental workflows. Read the{' '}
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
