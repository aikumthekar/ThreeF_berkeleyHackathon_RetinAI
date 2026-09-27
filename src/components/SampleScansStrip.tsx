import React from 'react';
import { SAMPLE_SCANS } from '../data/sampleScans';
import { SampleScan } from '../types/ophthalmology';
import { Check, Sparkles } from 'lucide-react';

interface SampleScansStripProps {
  currentScanId: string;
  onSelectSample: (sample: SampleScan) => void;
}

export const SampleScansStrip: React.FC<SampleScansStripProps> = ({
  currentScanId,
  onSelectSample,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Preloaded Ophthalmology Clinical Test Scans
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Select a verified clinical case to test classification across all 6 target diseases.
          </p>
        </div>
        <span className="text-[11px] font-mono text-slate-500">
          7 Validated Scans Available
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {SAMPLE_SCANS.map((scan) => {
          const isSelected = currentScanId === scan.id;
          return (
            <button
              key={scan.id}
              onClick={() => onSelectSample(scan)}
              className={`relative flex flex-col p-2 rounded-lg border text-left transition-all group ${
                isSelected
                  ? 'bg-slate-800/90 border-cyan-500 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/50'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              {/* Scan Thumbnail */}
              <div className="relative aspect-square w-full rounded overflow-hidden bg-black mb-2 border border-slate-850">
                <img
                  src={scan.dataUrl}
                  alt={scan.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {isSelected && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
                <span className="absolute bottom-1 left-1 px-1 py-0.2 bg-black/80 rounded text-[9px] font-mono text-slate-300">
                  {scan.eye}
                </span>
              </div>

              {/* Title & Category Badge */}
              <div className="space-y-1">
                <div className="text-xs font-semibold text-slate-200 line-clamp-1 group-hover:text-cyan-300 transition-colors">
                  {scan.categoryLabel}
                </div>
                <div className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                  {scan.title}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
