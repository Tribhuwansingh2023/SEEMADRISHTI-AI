import React from 'react';
import { Command, X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '1 - 9', desc: 'Directly focus camera feed #1 through #9 in matrix' },
    { key: 'Space', desc: 'Freeze-frame optical buffer / pause live CCTV feed' },
    { key: 'F', desc: 'Toggle high-definition cinematic fullscreen monitor' },
    { key: 'M', desc: 'Mute / un-mute tactical siren audio synthesizer' },
    { key: 'E', desc: 'Instant forensic evidence capture & SHA-256 seal' },
    { key: 'D', desc: 'Toggle YOLO debug bounding box & latency telemetry HUD' },
    { key: 'Tab', desc: 'Cycle through AI agent deliberation viewpoints' },
    { key: 'Esc', desc: 'Close any active tactical overlay modal' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6 text-slate-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Keyboard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-wide text-white">Tactical Hotkeys</h3>
            <p className="text-xs text-slate-400 font-mono">RAPID OPERATOR COMMAND SHORTCUTS</p>
          </div>
        </div>

        <div className="space-y-2.5">
          {shortcuts.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs"
            >
              <span className="text-slate-300 font-medium">{s.desc}</span>
              <kbd className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded font-mono font-bold text-cyan-300 shadow-sm ml-2 flex-shrink-0">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold tracking-wider uppercase transition-colors"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
