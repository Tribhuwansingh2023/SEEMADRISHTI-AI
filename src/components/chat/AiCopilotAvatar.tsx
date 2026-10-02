import React from 'react';

export type CopilotVisualState = 'idle' | 'analyzing' | 'ready' | 'limited_data' | 'degraded';

interface AiCopilotAvatarProps {
  state?: CopilotVisualState;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
  className?: string;
  onClick?: () => void;
}

export const AiCopilotAvatar: React.FC<AiCopilotAvatarProps> = ({
  state = 'ready',
  size = 'md',
  showBadge = false,
  className = '',
  onClick,
}) => {
  const sizeMap = {
    xs: { outer: 'w-6 h-6', border: 'border', ringSize: 'w-7 h-7' },
    sm: { outer: 'w-8 h-8', border: 'border-[1.5px]', ringSize: 'w-9 h-9' },
    md: { outer: 'w-10 h-10', border: 'border-2', ringSize: 'w-12 h-12' },
    lg: { outer: 'w-13 h-13', border: 'border-2', ringSize: 'w-15 h-15' },
    xl: { outer: 'w-18 h-18', border: 'border-2', ringSize: 'w-21 h-21' },
  };

  const currentSize = sizeMap[size];

  // State styling matching user specification
  const stateStyles = {
    idle: {
      border: 'border-cyan-400/60',
      glow: 'shadow-[0_0_15px_rgba(0,240,255,0.35)]',
      dot: 'bg-emerald-400 shadow-[0_0_8px_#10b981]',
      statusSymbol: '●',
      label: 'AI COPILOT',
      sublabel: '',
      color: 'text-cyan-300',
    },
    analyzing: {
      border: 'border-cyan-300',
      glow: 'shadow-[0_0_20px_rgba(0,240,255,0.7)]',
      dot: 'bg-cyan-400 animate-ping shadow-[0_0_10px_#00f0ff]',
      statusSymbol: '◉',
      label: 'AI COPILOT',
      sublabel: 'ANALYZING...',
      color: 'text-cyan-200',
    },
    ready: {
      border: 'border-emerald-400/80',
      glow: 'shadow-[0_0_16px_rgba(16,185,129,0.4)]',
      dot: 'bg-emerald-400 shadow-[0_0_8px_#10b981]',
      statusSymbol: '●',
      label: 'AI COPILOT',
      sublabel: 'READY',
      color: 'text-emerald-300',
    },
    limited_data: {
      border: 'border-amber-500/70',
      glow: 'shadow-[0_0_14px_rgba(245,158,11,0.3)]',
      dot: 'bg-amber-400 shadow-[0_0_6px_#f59e0b]',
      statusSymbol: '○',
      label: 'AI COPILOT',
      sublabel: 'LIMITED DATA',
      color: 'text-amber-300',
    },
    degraded: {
      border: 'border-rose-500/80',
      glow: 'shadow-[0_0_16px_rgba(244,63,94,0.45)]',
      dot: 'bg-rose-500 shadow-[0_0_8px_#f43f5e]',
      statusSymbol: '⚠',
      label: 'AI COPILOT',
      sublabel: 'AI SERVICE DEGRADED',
      color: 'text-rose-300',
    },
  };

  const curr = stateStyles[state] || stateStyles.ready;

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Small Futuristic Round AI-Bot Avatar */}
      <div className="relative flex items-center justify-center">
        {/* Subtle Outer Orbit / Ring Animation */}
        {state === 'analyzing' && (
          <div className="absolute -inset-1 rounded-full border border-cyan-400/50 border-t-cyan-300 border-r-transparent animate-spin" />
        )}
        {state === 'ready' && (
          <div className="absolute -inset-0.5 rounded-full border border-emerald-500/30 animate-pulse pointer-events-none" />
        )}

        <div
          className={`relative ${currentSize.outer} rounded-full overflow-hidden bg-[#030712] ${currentSize.border} ${curr.border} ${curr.glow} transition-all duration-300 flex items-center justify-center`}
        >
          {/* Circular Bot Avatar (Clean text-free cropped character centered) */}
          <img
            src="/ai_copilot_avatar.png"
            alt="SEEMADRISHTI AI COPILOT"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/ai_copilot_logo.jpg';
            }}
          />
        </div>

        {/* Micro Status Dot */}
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-black ${curr.dot}`}
          title={`${curr.label} [${curr.sublabel || state.toUpperCase()}]`}
        />
      </div>

      {/* State Text Badge (When requested by parent UI) */}
      {showBadge && (
        <div className="flex flex-col text-left font-mono leading-tight">
          <div className="flex items-center gap-1">
            <span className={`text-[10px] font-bold tracking-wider ${curr.color}`}>
              {curr.statusSymbol} {curr.label}
            </span>
          </div>
          {curr.sublabel && (
            <span className="text-[8px] font-bold tracking-widest uppercase text-slate-400">
              {curr.sublabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
