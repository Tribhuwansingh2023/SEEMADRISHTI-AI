import React, { useState } from 'react';
import { ShieldCheck, Download, Copy, Check, FileText, Lock, X } from 'lucide-react';
import { ForensicSealManifest } from '../../types/telemetry';

interface EvidenceExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  manifest: ForensicSealManifest | null;
}

export const EvidenceExportModal: React.FC<EvidenceExportModalProps> = ({
  isOpen,
  onClose,
  manifest,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !manifest) return null;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(manifest.sha256Hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadManifest = () => {
    const jsonStr = JSON.stringify(manifest, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${manifest.manifestId}-forensic-dossier.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-cyan-500/30 rounded-xl shadow-2xl p-6 text-slate-200">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-wide text-white">Forensic Evidence Seal</h3>
            <p className="text-xs text-slate-400 font-mono">COURT-ADMISSIBLE CHAIN-OF-CUSTODY MANIFEST</p>
          </div>
        </div>

        <div className="space-y-3 bg-slate-950/70 p-4 rounded-lg border border-slate-800 text-xs font-mono">
          <div className="flex justify-between items-center py-1 border-b border-slate-800">
            <span className="text-slate-400">MANIFEST ID</span>
            <span className="text-cyan-300 font-bold">{manifest.manifestId}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-800">
            <span className="text-slate-400">INCIDENT ID</span>
            <span className="text-white">{manifest.incidentId}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-800">
            <span className="text-slate-400">CAMERA ID</span>
            <span className="text-white">{manifest.cameraId}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-800">
            <span className="text-slate-400">OPERATOR</span>
            <span className="text-emerald-400">{manifest.operatorName} ({manifest.operatorBadgeId})</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-800">
            <span className="text-slate-400">TIMESTAMP</span>
            <span className="text-slate-300">{manifest.timestamp}</span>
          </div>

          <div className="pt-2">
            <span className="text-slate-400 block mb-1">SHA-256 INTEGRITY DIGEST:</span>
            <div className="flex items-center gap-2 bg-slate-900 p-2 rounded border border-slate-700">
              <span className="truncate text-[11px] text-cyan-400 font-bold">{manifest.sha256Hash}</span>
              <button
                type="button"
                onClick={handleCopyHash}
                className="text-slate-400 hover:text-white transition-colors flex-shrink-0"
                title="Copy Hash"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            type="button"
            onClick={handleDownloadManifest}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs tracking-wider uppercase transition-colors shadow-lg shadow-cyan-600/30"
          >
            <Download className="w-4 h-4" /> Download JSON Dossier
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold tracking-wider uppercase transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
