import { AnimatedContent } from '../../../components/AnimatedContent';
import { propertyPhotos } from './sampleData';
import { displayHeading, eyebrow, pageShell, sectionY } from './theme';

const pillars = [
  ['01', 'Properties'],
  ['02', 'Tenants'],
  ['03', 'Operations'],
];

export function StorySection() {
  return (
    <>
      <section className="border-y border-[#E8DDCC]/80 bg-white">
        <div className={`${pageShell} flex flex-col gap-8 py-10 sm:flex-row sm:items-center sm:justify-between`}>
          <p className="max-w-sm text-sm leading-6 text-[#756B61]">
            A single workspace for the people, properties and responsibilities
            that keep a rental business moving.
          </p>

          <dl className="grid grid-cols-3 gap-6 sm:gap-10">
            {pillars.map(([number, label]) => (
              <div key={number} className="border-l border-[#E8DDCC] pl-3 sm:pl-4">
                <dt className="font-display text-[13px] font-semibold text-[#B9A58B]">{number}</dt>
                <dd className="mt-1 text-xs font-medium text-[#332D29]">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className={`bg-[#FAF8F3] ${sectionY}`}>
        <div className={`${pageShell} grid gap-12 md:grid-cols-[0.9fr_1.1fr] md:items-center md:gap-16`}>
          <div className="max-w-md">
            <p className={eyebrow}>The people behind every property</p>
            <h2 className={`mt-4 text-3xl sm:text-4xl ${displayHeading}`}>
              A tenancy is more than an address.
            </h2>
            <p className="mt-5 text-sm leading-7 text-[#756B61]">
              Keep the place and the day-to-day experience in view, from a tenant&apos;s first message to the maintenance follow-through.
            </p>
          </div>

          <div className="grid grid-cols-2 items-start gap-4 sm:gap-6">
            {propertyPhotos.slice(1).map((photo, index) => (
              <AnimatedContent key={photo.label} delay={index * 0.08} distance={12} duration={0.42}>
                <figure>
                  <div className="overflow-hidden rounded-2xl bg-[#E8DDCC] ring-1 ring-[#332D29]/5">
                    <img
                      src={photo.src}
                      alt={photo.alt}
                      loading="lazy"
                      className="aspect-[4/5] w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                    />
                  </div>
                  <figcaption className="mt-3">
                    <span className="flex items-baseline gap-2">
                      <span aria-hidden="true" className="font-display text-[11px] font-semibold text-[#B9A58B]">
                        {photo.label}
                      </span>
                      <span className="text-xs font-semibold text-[#332D29]">{photo.title}</span>
                    </span>
                    <span className="mt-1 block text-[11px] text-[#756B61]">{photo.location}</span>
                  </figcaption>
                </figure>
              </AnimatedContent>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
