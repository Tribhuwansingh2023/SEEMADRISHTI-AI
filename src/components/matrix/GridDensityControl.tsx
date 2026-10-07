import React from 'react';
import { LayoutGrid, Grid3X3, Grid2X2 } from 'lucide-react';

export type GridDensity = '2x2' | '3x3' | '4x4';

interface GridDensityControlProps {
  density: GridDensity;
  onChangeDensity: (density: GridDensity) => void;
  className?: string;
}

export const GridDensityControl: React.FC<GridDensityControlProps> = ({
  density,
  onChangeDensity,
  className = '',
}) => {
  const options: Array<{ id: GridDensity; label: string; icon: React.ReactNode }> = [
    { id: '2x2', label: 'Quad (2x2)', icon: <Grid2X2 className="w-4 h-4" /> },
    { id: '3x3', label: 'Tactical (3x3)', icon: <Grid3X3 className="w-4 h-4" /> },
    { id: '4x4', label: 'Fleet (4x4)', icon: <LayoutGrid className="w-4 h-4" /> },
  ];

  return (
    <div className={`inline-flex items-center gap-1 bg-slate-900/90 border border-slate-700/60 rounded-lg p-1 ${className}`}>
      {options.map((opt) => {
        const isSelected = opt.id === density;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChangeDensity(opt.id)}
            title={`Switch view layout to ${opt.label}`}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded transition-colors ${
              isSelected
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
            }`}
          >
            {opt.icon}
            <span>{opt.id}</span>
          </button>
        );
      })}
    </div>
  );
};
