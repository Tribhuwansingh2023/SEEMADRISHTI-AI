import React from 'react';
import { StreamQualityPreset } from '../../types/telemetry';

export const STREAM_QUALITY_PRESETS: StreamQualityPreset[] = [
  {
    id: '4K_UHD',
    label: '4K UHD',
    width: 3840,
    height: 2160,
    bitrateKbps: 15000,
    recommendedFps: 60,
    description: 'Direct high-fidelity optical surveillance feed for incident zooming',
  },
  {
    id: '1080P_TACTICAL',
    label: '1080P Tactical',
    width: 1920,
    height: 1080,
    bitrateKbps: 4500,
    recommendedFps: 30,
    description: 'Balanced situational awareness feed optimized for 9-channel grid',
  },
  {
    id: '720P_EDGE',
    label: '720P Edge',
    width: 1280,
    height: 720,
    bitrateKbps: 1800,
    recommendedFps: 25,
    description: 'Low-bandwidth tactical link for mobile command units & SATCOM',
  },
];

interface StreamQualitySelectorProps {
  currentPreset: string;
  onSelectPreset: (preset: StreamQualityPreset) => void;
  className?: string;
}

export const StreamQualitySelector: React.FC<StreamQualitySelectorProps> = ({
  currentPreset,
  onSelectPreset,
  className = '',
}) => {
  return (
    <div className={`inline-flex items-center gap-1 bg-slate-900/90 border border-slate-700/60 rounded-lg p-1 backdrop-blur-md ${className}`}>
      {STREAM_QUALITY_PRESETS.map((p) => {
        const isSelected = p.id === currentPreset;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelectPreset(p)}
            title={p.description}
            className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-all duration-200 ${
              isSelected
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
            }`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
};
