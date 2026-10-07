import React from 'react';
import { ThreatSeverityLevel } from '../../types/telemetry';

interface TacticalBadgeProps {
  level: ThreatSeverityLevel;
  label?: string;
  showPulse?: boolean;
  className?: string;
}

const LEVEL_STYLES: Record<ThreatSeverityLevel, { bg: string; text: string; border: string; pulse: string }> = {
  NORMAL: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    pulse: 'bg-emerald-400',
  },
  ELEVATED: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30',
    pulse: 'bg-cyan-400',
  },
  WARNING: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    pulse: 'bg-amber-400',
  },
  CRITICAL: {
    bg: 'bg-orange-500/15',
    text: 'text-orange-400',
    border: 'border-orange-500/40',
    pulse: 'bg-orange-400',
  },
  BREACH: {
    bg: 'bg-rose-500/20',
    text: 'text-rose-400',
    border: 'border-rose-500/50',
    pulse: 'bg-rose-400 animate-ping',
  },
};

export const TacticalBadge: React.FC<TacticalBadgeProps> = ({
  level,
  label,
  showPulse = true,
  className = '',
}) => {
  const style = LEVEL_STYLES[level] || LEVEL_STYLES.NORMAL;
  const displayLabel = label || level;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-semibold tracking-wider uppercase border backdrop-blur-sm ${style.bg} ${style.text} ${style.border} ${className}`}
    >
      {showPulse && (
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${style.pulse}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${style.pulse.split(' ')[0]}`} />
        </span>
      )}
      {displayLabel}
    </span>
  );
};
