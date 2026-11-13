import { Check, Clock3 } from 'lucide-react';
import { AnimatedContent } from '../../../components/AnimatedContent';
import { SectionHeading } from './SectionHeading';
import { pageShell, sectionY } from './theme';

const availableNow = [
  'Properties, units and tenants',
  'Tenant invitations by private link',
  'Rent status and due dates',
  'Maintenance requests and messages',
  'Separate landlord, tenant and admin accounts',
];

const comingNext = [
  'Online rent payments',
  'Identity and property verification',
  'Phone number verification by OTP',
];

export function AvailabilitySection() {
  return (
    <section className={`bg-[#FAF8F3] ${sectionY}`}>
      <div className={pageShell}>
        <SectionHeading
          index="05"
          align="center"
          eyebrowText="Built with transparency"
          title="Know what is ready before you sign up."
          lede="We would rather tell you what is missing than let you find out after you have moved in."
        />

        <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2 sm:gap-6">
          <AnimatedContent delay={0.05} distance={14}>
            <div className="h-full rounded-2xl border border-[#E8DDCC] bg-white p-6 shadow-[0_24px_60px_-46px_rgba(51,45,41,0.6)] sm:p-7">
              <p className="flex items-center gap-2 text-sm font-semibold text-[#332D29]">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#397451]" />
                Available now
              </p>

              <ul className="mt-6 space-y-3.5">
                {availableNow.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[13.5px] leading-6 text-[#5E554D]">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-[#397451]" strokeWidth={2.5} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </AnimatedContent>

          <AnimatedContent delay={0.14} distance={14}>
            <div className="h-full rounded-2xl border border-[#E8DDCC] bg-[#F3EDE2] p-6 sm:p-7">
              <p className="flex items-center gap-2 text-sm font-semibold text-[#332D29]">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#95651D]" />
                Coming next
              </p>

              <ul className="mt-6 space-y-3.5">
                {comingNext.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[13.5px] leading-6 text-[#5E554D]">
                    <Clock3 className="mt-1 h-4 w-4 shrink-0 text-[#95651D]" />
                    {item}
                  </li>
                ))}
              </ul>

              <p className="mt-6 border-t border-[#B9A58B]/40 pt-4 text-[11.5px] leading-5 text-[#756B61]">
                Until a check is completed, the status stays pending. No badges are shown early.
              </p>
            </div>
          </AnimatedContent>
        </div>
      </div>
    </section>
  );
}
