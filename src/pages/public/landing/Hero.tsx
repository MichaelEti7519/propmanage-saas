import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Check, Info } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import heroBuilding from '../../../assets/hero-building.jpg';
import { propertyPhotos } from './sampleData';
import { mutedLabel, pageShell, sampleBadge } from './theme';

const facts = [
  'Landlord, tenant and admin logins',
  'Rent status at a glance',
  'Invite tenants by private link',
];

const capabilities = [
  'Properties',
  'Units',
  'Tenants',
  'Rent records',
  'Maintenance',
  'Messages',
  'Invitations',
  'Reports',
];

/** Hand-drawn emphasis under the headline. Cheap, and it makes the page feel authored. */
function StrokeUnderline() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 240 12"
      fill="none"
      preserveAspectRatio="none"
      className="pointer-events-none absolute -bottom-1 left-0 h-[9px] w-full text-[#B9A58B]"
    >
      <motion.path
        d="M3 8.6C46 3.4 104 1.9 156 3.6c30 1 64 2.6 81 4.6"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}

function RentCycleCard() {
  const paid = [true, true, true, false];

  return (
    <div className="w-full max-w-[290px] rounded-xl bg-white p-5 shadow-[0_18px_44px_-28px_rgba(0,0,0,0.6)]">
      <div className="flex items-center justify-between gap-3">
        <p className={mutedLabel}>Rent this cycle</p>
        <span className={sampleBadge}>Sample</span>
      </div>

      <p className="mt-2 flex items-baseline gap-2">
        <span className="font-display text-[30px] font-semibold leading-none text-[#332D29]">3 of 4</span>
        <span className="text-xs text-[#756B61]">flats paid</span>
      </p>

      <div className="mt-4 flex gap-1.5" aria-hidden="true">
        {paid.map((isPaid, index) => (
          <motion.span
            key={index}
            initial={{ scaleY: 0.25, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.9 + index * 0.09, ease: 'easeOut' }}
            style={{ transformOrigin: 'bottom' }}
            className={`h-1.5 flex-1 rounded-full ${isPaid ? 'bg-[#397451]' : 'bg-[#E0B25C]'}`}
          />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[#E8DDCC]/80 pt-3 text-[10px] text-[#8A7E72]">
        <span>Adeniyi Court · 4 units</span>
        <span>Bodija</span>
      </div>
    </div>
  );
}

function PhotoStrip() {
  const shots = [
    { photo: propertyPhotos[0], caption: 'The building' },
    { photo: propertyPhotos[1], caption: 'The interior' },
    { photo: propertyPhotos[2], caption: 'The details' },
  ];

  return (
    <div className="relative z-20 -mt-12 px-3 sm:-mt-16 sm:px-6">
      <div className={pageShell}>
        <div className="hide-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0">
          {shots.map((shot, index) => (
            <motion.figure
              key={shot.caption}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55, delay: 0.08 * index, ease: [0.22, 1, 0.36, 1] }}
              className="group relative w-[74%] shrink-0 overflow-hidden rounded-xl border-[5px] border-[#FAF8F3] bg-[#E8DDCC] shadow-[0_18px_34px_-28px_rgba(51,45,41,0.6)] sm:w-auto"
            >
              <img
                src={shot.photo.src}
                alt={shot.photo.alt}
                loading="lazy"
                className="aspect-[5/4] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
              />
              <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-[#241F1C]/80 to-transparent px-3 pb-2.5 pt-10 text-[11px] text-white">
                <span className="font-medium">{shot.caption}</span>
                <span className="font-display text-[10px] text-white/65">{shot.photo.label}</span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </div>
  );
}

function CapabilityStrip() {
  return (
    <div className="marquee relative mt-10 overflow-hidden border-y border-[#E8DDCC]/80 bg-white py-4 sm:mt-14">
      <div className="[mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
        <div className="marquee-track flex w-max items-center whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A7E72]">
          {[...capabilities, ...capabilities].map((item, index) => (
            <span
              key={`${item}-${index}`}
              aria-hidden={index >= capabilities.length ? true : undefined}
              className="flex items-center gap-3 pr-9"
            >
              <span aria-hidden="true" className="h-1 w-1 rounded-full bg-[#B9A58B]" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <>
      <section>
        <div className="relative isolate overflow-hidden bg-[#241F1C]">
          <motion.img
            src={heroBuilding}
            alt=""
            aria-hidden="true"
            fetchPriority="high"
            initial={reduceMotion ? undefined : { scale: 1.06 }}
            animate={reduceMotion ? undefined : { scale: 1 }}
            transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 -z-20 h-full w-full object-cover object-[62%_45%]"
          />

          {/* Two washes: one keeps the left third readable, the other seats the copy on the base. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgba(24,20,17,0.94)_0%,rgba(26,22,19,0.86)_34%,rgba(32,27,23,0.45)_62%,rgba(30,26,22,0.7)_100%)]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(24,20,17,0.5)_0%,transparent_32%,rgba(24,20,17,0.75)_100%)]"
          />

          <div className={`${pageShell} relative flex min-h-[78svh] flex-col justify-end pb-24 pt-24 sm:min-h-[82svh] sm:pb-28 lg:min-h-[84svh] lg:pb-32 lg:pt-28`}>
            <div className="grid items-end gap-10 lg:grid-cols-[1.12fr_0.88fr] lg:gap-14">
              <div>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center gap-3 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#E8DDCC]/70"
                >
                  <span aria-hidden="true" className="h-px w-8 bg-[#B9A58B]" />
                  Property operations
                </motion.p>

                <motion.h1
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-6 text-balance text-[2.6rem] font-display font-semibold leading-[1.02] tracking-[-0.03em] text-[#FAF8F3] sm:text-[3.4rem] lg:text-[3.9rem]"
                >
                  Property work,
                  <br className="hidden sm:block" /> with a{' '}
                  <span className="relative inline-block">
                    steadier
                    <StrokeUnderline />
                  </span>{' '}
                  hand.
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-6 max-w-md text-pretty text-[15px] leading-7 text-[#E8DDCC]/85 sm:text-lg sm:leading-8"
                >
                  Properties, tenants, rent records and repairs in one clear workspace — for the
                  people managing homes, and the people living in them.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-8 flex flex-wrap items-center gap-3"
                >
                  <Link
                    to="/login"
                    className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-lg bg-[#FAF8F3] px-6 text-sm font-semibold text-[#332D29] transition-[background-color,transform] duration-200 hover:-translate-y-px hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#332D29]"
                  >
                    Create your account
                    <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </Link>

                  <Link
                    to="/#workflows"
                    className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/30 px-5 text-sm font-semibold text-white transition-colors duration-200 hover:border-white/60 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#332D29]"
                  >
                    See how it works
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </motion.div>

                <motion.ul
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.34 }}
                  className="mt-9 flex flex-wrap gap-x-6 gap-y-2.5 border-t border-white/15 pt-5"
                >
                  {facts.map((fact) => (
                    <li key={fact} className="flex items-center gap-2 text-[12.5px] text-[#E8DDCC]/85">
                      <Check className="h-3.5 w-3.5 shrink-0 text-[#B9A58B]" strokeWidth={3} />
                      {fact}
                    </li>
                  ))}
                </motion.ul>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.44 }}
                  className="mt-5 flex max-w-md items-start gap-2.5 text-[11.5px] leading-5 text-[#E8DDCC]/60"
                >
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B9A58B]" />
                  <span>
                    Never send identity documents, deeds or bank statements by email. Verification
                    stays pending until a real check is completed.
                  </span>
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="flex lg:justify-end lg:pb-1"
              >
                <RentCycleCard />
              </motion.div>
            </div>

            <p className="mt-8 text-[10px] uppercase tracking-[0.16em] text-white/45">
              Illustrative building · Sample tenancy data
            </p>
          </div>
        </div>
      </section>

      <PhotoStrip />
      <CapabilityStrip />
    </>
  );
}
