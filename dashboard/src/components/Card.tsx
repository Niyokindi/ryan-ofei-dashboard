import type { ReactNode } from 'react';
import InfoTooltip from './InfoTooltip';

interface CardProps {
  title?: string;
  subtitle?: string;
  info?: string;
  children: ReactNode;
  className?: string;
}

export default function Card({ title, subtitle, info, children, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.06] bg-white/[0.03] p-8 backdrop-blur-sm ${className}`}
    >
      {(title || subtitle) && (
        <div className="mb-7">
          {title && (
            <h3 className="inline-flex items-center text-base font-semibold text-white">
              {title}
              {info && <InfoTooltip text={info} />}
            </h3>
          )}
          {subtitle && (
            <p className="mt-1.5 text-xs text-zinc-500">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
