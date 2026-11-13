import type { ReactNode } from 'react';
import { displayHeading, eyebrow } from './theme';

interface SectionHeadingProps {
  eyebrowText: string;
  title: ReactNode;
  lede?: ReactNode;
  align?: 'left' | 'center';
  /** Optional running number, e.g. "02". Gives long pages a sense of order. */
  index?: string;
  className?: string;
  titleClassName?: string;
}

/**
 * One heading recipe for every landing section. Sections differ in layout, but the
 * eyebrow, measure and type scale stay identical so the page reads as one document.
 */
export function SectionHeading({
  eyebrowText,
  title,
  lede,
  align = 'left',
  index,
  className = '',
  titleClassName = 'text-3xl sm:text-[2.6rem]',
}: SectionHeadingProps) {
  const centered = align === 'center';

  return (
    <div
      className={[
        centered ? 'mx-auto max-w-2xl text-center' : 'max-w-xl',
        className,
      ].join(' ')}
    >
      <p className={[eyebrow, 'flex items-center gap-3', centered ? 'justify-center' : ''].join(' ')}>
        <span aria-hidden="true" className="h-px w-7 bg-[#B9A58B]" />
        {eyebrowText}
        {index && (
          <span className="font-display text-[#B9A58B] tracking-[0.1em]">{index}</span>
        )}
      </p>

      <h2 className={`mt-5 text-balance ${titleClassName} ${displayHeading}`}>{title}</h2>

      {lede && (
        <p className="mt-5 text-pretty text-sm leading-7 text-[#756B61] sm:text-[15px]">{lede}</p>
      )}
    </div>
  );
}
