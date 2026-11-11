import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Check, Info, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { AnimatedContent } from '../../../components/AnimatedContent';
import { propertyPhotos } from './sampleData';
import { displayHeading, eyebrow, glassPanel, pageShell, primaryButton } from './theme';

const highlights = [
  'Separate workspaces for landlords and tenants',
  'Maintenance and property records together',
  'Verification stays pending until actually checked',
];

function PropertyHeroImage() {
  return (
    <AnimatedContent className="relative" trigger="mount" distance={12} duration={0.45}>
      <figure className="relative min-h-[340px] overflow-hidden rounded-2xl bg-[#E8DDCC] ring-1 ring-[#332D29]/5 sm:min-h-[460px] lg:min-h-[560px]">
        <img
          src={propertyPhotos[0].src}
          alt={propertyPhotos[0].alt}
          className="absolute inset-0 h-full w-full object-cover"
          fetchPriority="high"
        />
        <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3.5 py-2 text-[11px] font-semibold text-[#332D29] backdrop-blur-md sm:left-5 sm:top-5">
          <MapPin className="h-3.5 w-3.5 text-[#397451]" />
          Illustrative rental property
        </div>
        <figcaption className="absolute inset-x-0 bottom-0 flex items-baseline justify-between gap-3 bg-gradient-to-t from-[#241F1C]/80 via-[#241F1C]/35 to-transparent px-5 pb-4 pt-16 text-[11px] text-white sm:px-6 sm:text-xs">
          <span className="font-medium">Residential property</span>
          <span className="text-white/70">{propertyPhotos[0].location}</span>
        </figcaption>
      </figure>
    </AnimatedContent>
  );
}

export function Hero() {
  return (
    <section className={`${pageShell} pb-16 pt-14 sm:pb-20 sm:pt-20 lg:pb-24 lg:pt-24`}>
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.06fr] lg:gap-16">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10"
        >
          <p className={`flex items-center gap-3 ${eyebrow}`}>
            <span aria-hidden="true" className="h-px w-7 bg-[#B9A58B]" />
            PropManage · Property operations
          </p>

          <h1 className={`mt-6 max-w-xl text-[2.4rem] sm:text-5xl lg:text-[3.4rem] ${displayHeading}`}>
            A steadier way to manage the work behind every home.
          </h1>

          <p className="mt-6 max-w-md text-base leading-7 text-[#756B61] sm:text-lg">
            Bring property records, tenants, payments, and maintenance into one clear workspace.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link to="/login" className={`group ${primaryButton}`}>
              Get started
              <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>

            <Link
              to="/#features"
              className="group inline-flex min-h-12 items-center gap-2 rounded-xl px-1 text-sm font-semibold text-[#332D29] transition-colors hover:text-[#397451] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9A58B]"
            >
              Explore the workspace
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>

          <div className={`mt-10 rounded-2xl p-5 sm:p-6 ${glassPanel}`}>
            <ul className="space-y-3 text-sm leading-6 text-[#5E554D]">
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#397451]/10 text-[#397451]">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <p className="mt-4 flex items-start gap-2 border-t border-[#E8DDCC]/70 pt-4 text-[11.5px] leading-5 text-[#756B61]">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B9A58B]" />
              <span>
                Never send identity documents, deeds, or bank statements by email. Secure
                verification will be requested only through an approved provider flow.
              </span>
            </p>
          </div>
        </motion.div>

        <PropertyHeroImage />
      </div>
    </section>
  );
}
