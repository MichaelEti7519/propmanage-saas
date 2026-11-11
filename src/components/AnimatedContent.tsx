import type { CSSProperties, ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface AnimatedContentProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  distance?: number;
  direction?: 'vertical' | 'horizontal';
  reverse?: boolean;
  duration?: number;
  delay?: number;
  threshold?: number;
  once?: boolean;
  trigger?: 'scroll' | 'mount';
}

export function AnimatedContent({
  children,
  className,
  style,
  distance = 16,
  direction = 'vertical',
  reverse = false,
  duration = 0.45,
  delay = 0,
  threshold = 0.12,
  once = true,
  trigger = 'scroll',
}: AnimatedContentProps) {
  const prefersReducedMotion = useReducedMotion();
  if (prefersReducedMotion) {
    return <div className={className} style={style}>{children}</div>;
  }

  const offset = (reverse ? -1 : 1) * distance;
  const initial = {
    opacity: 0,
    x: direction === 'horizontal' ? offset : 0,
    y: direction === 'vertical' ? offset : 0,
  };
  const visible = { opacity: 1, x: 0, y: 0 };
  const animationProps = trigger === 'mount'
    ? { animate: visible }
    : { whileInView: visible, viewport: { once, amount: threshold } };

  return (
    <motion.div
      className={className}
      style={style}
      initial={initial}
      transition={{ duration, delay: Math.max(0, delay), ease: [0.22, 1, 0.36, 1] }}
      {...animationProps}
    >
      {children}
    </motion.div>
  );
}