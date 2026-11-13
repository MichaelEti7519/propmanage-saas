import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ArrowUpRight, Building2, Menu, X } from 'lucide-react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Features', path: '/#features' },
  { name: 'Workflows', path: '/#workflows' },
  { name: 'FAQ', path: '/#faq' },
  { name: 'Pricing', path: '/pricing' },
  { name: 'Contact', path: '/contact' },
];

const isLinkActive = (path: string, pathname: string, hash: string) => {
  if (path.includes('#')) {
    const [targetPath, targetHash] = path.split('#');

    return pathname === (targetPath || '/') && hash === `#${targetHash}`;
  }

  // Route links should remain active regardless of URL hash.
  if (path === '/') {
    return pathname === '/' && !hash;
  }

  return pathname === path;
};

export function PublicLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname, location.search, location.hash, location.key]);

  // No hash = new page or Home, so jump to the top BEFORE the browser paints.
  // 'instant' ignores any global `scroll-behavior: smooth` in your CSS.
  useLayoutEffect(() => {
    if (location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname, location.hash, location.key]);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const sectionId = location.hash.slice(1);

    if (!sectionId) return;

    let firstFrame = 0;
    let secondFrame = 0;

    // Allow the destination route to render before scrolling.
    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        document.getElementById(sectionId)?.scrollIntoView({
          behavior: reduceMotion ? 'auto' : 'smooth',
          block: 'start',
        });
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
    // location.key changes on every navigation, so re-clicking the same hash link works.
  }, [location.pathname, location.hash, location.key]);

  const linkIsActive = (path: string) =>
    isLinkActive(path, location.pathname, location.hash);

  // The pill is positioned relative to the nav (offsetLeft/offsetWidth), so
  // page scroll can never affect it, unlike layoutId which measures in page space.
  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [pill, setPill] = useState<{ x: number; width: number } | null>(null);
  const activePath = navLinks.find((link) => linkIsActive(link.path))?.path;

  useLayoutEffect(() => {
    const measure = () => {
      const el = activePath ? linkRefs.current[activePath] : null;
      const next = el ? { x: el.offsetLeft, width: el.offsetWidth } : null;

      setPill((prev) =>
        prev?.x === next?.x && prev?.width === next?.width ? prev : next,
      );
    };

    measure();

    const nav = navRef.current;
    if (!nav || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [activePath]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-screen flex-col bg-[#FAF8F3] font-sans text-[#332D29]">
        <header className="sticky top-0 z-50 border-b border-[#E8DDCC] bg-[#FAF8F3]">
          <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
            <Link
              to="/"
              aria-label="PropManage home"
              className="group flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9A58B]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#332D29] text-[#E8DDCC] transition-transform duration-200 group-hover:scale-[1.04]">
                <Building2 size={19} strokeWidth={1.8} />
              </span>

              <span className="text-[17px] font-bold tracking-[-0.045em] sm:text-lg">
                PropManage<span className="text-[#B9A58B]">.</span>
              </span>
            </Link>

            <nav
              ref={navRef}
              aria-label="Primary navigation"
              className="relative hidden items-center gap-0.5 xl:flex"
            >
              {pill && (
                <motion.span
                  aria-hidden="true"
                  initial={false}
                  animate={{ x: pill.x, width: pill.width }}
                  transition={{
                    type: 'spring',
                    stiffness: 380,
                    damping: 32,
                    mass: 0.8,
                  }}
                  className="pointer-events-none absolute bottom-0 left-0 h-[2px] bg-[#332D29]"
                />
              )}

              {navLinks.map((link) => {
                const active = linkIsActive(link.path);

                return (
                  <Link
                    key={link.path}
                    ref={(el) => {
                      linkRefs.current[link.path] = el;
                    }}
                    to={link.path}
                    aria-current={active ? 'page' : undefined}
                    className={[
                      'relative z-10 rounded-sm px-3 py-2.5 text-[13px]',
                      'transition-colors duration-200',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9A58B]',
                      active
                        ? 'font-semibold text-[#332D29]'
                        : 'font-medium text-[#756B61] hover:text-[#332D29]',
                    ].join(' ')}
                  >

                    <span className="relative">{link.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex shrink-0 items-center gap-2">
              <Link
                to="/login"
                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-[#5E554D] transition-colors hover:text-[#332D29] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9A58B] sm:inline-flex"
              >
                Log in
              </Link>

              <Link
                to="/login"
                className="group hidden min-h-10 items-center gap-2 rounded-lg bg-[#332D29] px-[18px] py-2 text-[13px] font-semibold text-[#FAF8F3] transition-[background-color,transform] duration-200 hover:-translate-y-px hover:bg-[#494039] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9A58B] focus-visible:ring-offset-2 sm:inline-flex"
              >
                Get started
                <ArrowUpRight
                  size={15}
                  className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </Link>

              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#332D29] transition-colors hover:bg-[#E8DDCC]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9A58B] xl:hidden"
                onClick={() => setIsMobileMenuOpen((open) => !open)}
                aria-label={
                  isMobileMenuOpen
                    ? 'Close navigation menu'
                    : 'Open navigation menu'
                }
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-navigation"
              >
                {isMobileMenuOpen ? (
                  <X size={21} strokeWidth={1.8} />
                ) : (
                  <Menu size={21} strokeWidth={1.8} />
                )}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.nav
                id="mobile-navigation"
                aria-label="Mobile navigation"
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: 'top center' }}
                className="absolute inset-x-0 top-full z-50 border-b border-[#E8DDCC] bg-[#FAF8F3] px-5 pb-5 pt-2 shadow-[0_18px_30px_-26px_rgba(51,45,41,0.4)] sm:px-8 xl:hidden"
              >
                <div className="flex flex-col gap-1">
                  {navLinks.map((link) => {
                    const active = linkIsActive(link.path);

                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        aria-current={active ? 'page' : undefined}
                        className={[
                          'flex min-h-11 items-center justify-between rounded-md px-3.5 py-2.5 text-sm transition-colors',
                          active
                            ? 'bg-white font-semibold text-[#332D29]'
                            : 'font-medium text-[#756B61] hover:bg-white/70 hover:text-[#332D29]',
                        ].join(' ')}
                      >
                        {link.name}
                      </Link>
                    );
                  })}

                  <div className="my-1 border-t border-[#E8DDCC]" />

                  <Link
                    to="/login"
                    className="flex min-h-11 items-center rounded-md px-3.5 py-2.5 text-sm font-medium text-[#332D29] hover:bg-white/70"
                  >
                    Log in
                  </Link>

                  <Link
                    to="/login"
                    className="mt-1 flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#332D29] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#494039]"
                  >
                    Get started
                    <ArrowUpRight size={16} />
                  </Link>
                </div>
              </motion.nav>
            )}
          </AnimatePresence>
        </header>

        <main className="flex flex-1 flex-col">
          <Outlet />
        </main>

        <footer className="mt-auto bg-[#332D29] px-5 py-10 text-[#E8DDCC] sm:px-8 sm:py-12">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 border-b border-white/10 pb-8 sm:grid-cols-2 sm:items-start">
              <div>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2.5 rounded-lg text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B9A58B]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                    <Building2 size={19} className="text-[#B9A58B]" />
                  </span>

                  <span className="text-lg font-bold tracking-tight">
                    PropManage<span className="text-[#B9A58B]">.</span>
                  </span>
                </Link>

                <p className="mt-3 max-w-sm text-sm leading-6 text-[#E8DDCC]/70">
                  A clearer workspace for the properties, people, and tasks
                  that keep homes running.
                </p>
              </div>

              <nav
                aria-label="Footer navigation"
                className="flex flex-wrap gap-x-6 gap-y-3 text-sm sm:justify-end"
              >
                <Link to="/pricing" className="transition-colors hover:text-white">
                  Pricing
                </Link>
                <Link to="/contact" className="transition-colors hover:text-white">
                  Contact
                </Link>
                <Link to="/privacy" className="transition-colors hover:text-white">
                  Privacy Policy
                </Link>
              </nav>
            </div>

            <div className="flex flex-col gap-2 pt-5 text-xs text-[#B9A58B] sm:flex-row sm:items-center sm:justify-between">
              <p>© {new Date().getFullYear()} PropManage. All rights reserved.</p>
              <p>Property management, made clearer.</p>
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}