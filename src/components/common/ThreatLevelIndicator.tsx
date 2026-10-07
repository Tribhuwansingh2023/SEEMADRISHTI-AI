import React from 'react';
import { ThreatSeverityLevel } from '../../types/telemetry';

interface ThreatLevelIndicatorProps {
  level: ThreatSeverityLevel;
  showLabels?: boolean;
  className?: string;
}

const LEVELS: ThreatSeverityLevel[] = ['NORMAL', 'ELEVATED', 'WARNING', 'CRITICAL', 'BREACH'];

const LEVEL_COLORS: Record<ThreatSeverityLevel, string> = {
  NORMAL: 'bg-emerald-500 shadow-emerald-500/50',
  ELEVATED: 'bg-cyan-500 shadow-cyan-500/50',
  WARNING: 'bg-amber-500 shadow-amber-500/50',
  CRITICAL: 'bg-orange-500 shadow-orange-500/50',
  BREACH: 'bg-rose-600 shadow-rose-600/50 animate-pulse',
};

export const ThreatLevelIndicator: React.FC<ThreatLevelIndicatorProps> = ({
  level,
  showLabels = true,
  className = '',
}) => {
  const currentIndex = LEVELS.indexOf(level);

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {showLabels && (
        <div className="flex justify-between items-center text-[10px] font-mono tracking-widest text-slate-400">
          <span>THREAT STAGE</span>
          <span className="font-bold text-slate-200">DEFCON {5 - currentIndex} // {level}</span>
        </div>
      )}
      <div className="grid grid-cols-5 gap-1.5 h-2">
        {LEVELS.map((lvl, idx) => {
          const isActive = idx <= currentIndex;
          return (
            <div
              key={lvl}
              className={`rounded-sm transition-all duration-300 ${
                isActive
                  ? `${LEVEL_COLORS[lvl]} shadow-sm opacity-100`
                  : 'bg-slate-800/80 border border-slate-700/40 opacity-40'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};
