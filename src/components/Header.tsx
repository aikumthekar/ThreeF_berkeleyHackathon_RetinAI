import React from 'react';
import {
  Eye,
  Cpu,
  Upload,
  FileText,
  Layers,
  ChevronDown,
  Star,
  Check
} from 'lucide-react';
import { NeuralNetworkId } from '../types/ophthalmology';
import { NEURAL_NETWORK_OPTIONS } from '../data/modelsConfig';

interface HeaderProps {
  activeModel: NeuralNetworkId;
  defaultModel: NeuralNetworkId;
  onSelectModel: (model: NeuralNetworkId) => void;
  onSetDefaultModel: (model: NeuralNetworkId) => void;
  onOpenUpload: () => void;
  onOpenReport: () => void;
  onOpenEmail: () => void;
  onOpenArchitecture: () => void;
  hasApiKey: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeModel,
  defaultModel,
  onSelectModel,
  onSetDefaultModel,
  onOpenUpload,
  onOpenReport,
  onOpenEmail,
  onOpenArchitecture,
  hasApiKey,
}) => {
  const isCurrentActiveDefault = activeModel === defaultModel;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 border-b border-slate-800 backdrop-blur-md px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Suite Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-lg shadow-cyan-950/50">
            <Eye className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                RetinaScan AI
              </h1>
              <span className="font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                Clinical v3.4
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              Deep Learning Retinal Scan Classifier · 6 Target Categories
            </p>
          </div>
        </div>

        {/* Model Architecture Selector & Actions */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Deep Learning Model Selector Cluster */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
            <div className="relative flex items-center">
              <Cpu className="w-3.5 h-3.5 text-cyan-400 ml-1.5 mr-1" />
              <select
                value={activeModel}
                onChange={(e) => onSelectModel(e.target.value as NeuralNetworkId)}
                className="bg-transparent text-slate-200 font-medium text-xs pr-7 pl-1 py-1 focus:outline-none cursor-pointer appearance-none max-w-[210px] sm:max-w-xs truncate"
                title="Select neural network model for retinal analysis"
              >
                {NEURAL_NETWORK_OPTIONS.map((opt) => (
                  <option
                    key={opt.id}
                    value={opt.id}
                    className="bg-slate-900 text-slate-200 py-1"
                  >
                    {opt.name} {opt.id === defaultModel ? '★ [Default]' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-1.5" />
            </div>

            {/* Quick Button to Set or Indicate Default */}
            {isCurrentActiveDefault ? (
              <span
                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-600/50 text-[10px] font-mono font-bold"
                title="This neural network is configured as your default evaluation engine"
              >
                <Star className="w-2.5 h-2.5 fill-emerald-400 text-emerald-400" />
                <span className="hidden xs:inline">Default</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onSetDefaultModel(activeModel)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/40 hover:border-amber-500/70 text-[11px] font-semibold transition-colors shadow-sm cursor-pointer"
                title="Set the currently selected neural network as default evaluation model"
              >
                <Star className="w-3 h-3 text-amber-400" />
                <span>Set as Default</span>
              </button>
            )}
          </div>

          {/* Model Specs / Architecture Modal Button */}
          <button
            onClick={onOpenArchitecture}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Inspect all deep learning network options, benchmarks, and configure defaults"
          >
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">Networks & Defaults</span>
          </button>

          {/* New Scan Upload Button */}
          <button
            onClick={onOpenUpload}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-cyan-950/40 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Scan</span>
          </button>

          {/* Diagnostic Report Export */}
          <button
            onClick={onOpenReport}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Diagnostic Report</span>
          </button>

          {/* Send via Email Button */}
          <button
            onClick={onOpenEmail}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Send report directly via secure email to patient or referring doctor"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Email Report</span>
          </button>
        </div>
      </div>
    </header>
  );
};
