import { Check, Clock3 } from 'lucide-react';
import { displayHeading, eyebrow, pageShell, sectionY } from './theme';

const availableNow = [
  'Properties, units and tenants',
  'Tenant invitations by private link',
  'Rent status and due dates',
  'Maintenance requests and messages',
  'Separate landlord and tenant accounts',
];

const comingNext = [
  'Online rent payments',
  'Identity and property verification',
  'Phone number verification by OTP',
];

export function AvailabilitySection() {
  return (
    <section className={`bg-[#FAF8F3] ${sectionY}`}>
      <div className={`${pageShell} grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20`}>

        <div>
          <p className={eyebrow}>
            Built with transparency
          </p>
          <h2 className={`mt-4 text-3xl sm:text-[2.6rem] ${displayHeading}`}>
            Know what is ready before you sign up.
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-7 text-[#756B61]">
            We believe in being clear about what you can use today and what
            is still being developed.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          <div className="rounded-2xl border border-[#E8DDCC] bg-white p-5 sm:p-6">
            <p className="flex items-center gap-2 text-sm font-semibold text-[#332D29]">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#397451]" />
              Available now
            </p>
            <ul className="mt-5 space-y-3.5">
              {availableNow.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-6 text-[#5E554D]">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-[#397451]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-[#E8DDCC] bg-white p-5 sm:p-6">
            <p className="flex items-center gap-2 text-sm font-semibold text-[#332D29]">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#95651D]" />
              Coming next
            </p>
            <ul className="mt-5 space-y-3.5">
              {comingNext.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-6 text-[#5E554D]">
                  <Clock3 className="mt-1 h-4 w-4 shrink-0 text-[#95651D]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
