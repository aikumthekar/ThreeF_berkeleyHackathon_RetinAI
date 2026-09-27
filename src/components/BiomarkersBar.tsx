import React from 'react';
import { Biomarkers } from '../types/ophthalmology';
import { Eye, ShieldAlert, Sparkles, Droplets, Gauge } from 'lucide-react';

interface BiomarkersBarProps {
  biomarkers: Biomarkers;
  urgency: 'Routine' | 'Moderate' | 'Urgent' | 'Emergent';
}

export const BiomarkersBar: React.FC<BiomarkersBarProps> = ({ biomarkers, urgency }) => {
  const getUrgencyBadge = () => {
    switch (urgency) {
      case 'Emergent':
        return 'bg-rose-950 text-rose-300 border-rose-800/80';
      case 'Urgent':
        return 'bg-amber-950 text-amber-300 border-amber-800/80';
      case 'Moderate':
        return 'bg-cyan-950 text-cyan-300 border-cyan-800/80';
      case 'Routine':
      default:
        return 'bg-emerald-950 text-emerald-300 border-emerald-800/80';
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
      {/* 1. Cup-to-Disc Ratio (CDR) */}
      <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span className="font-medium">Cup-to-Disc (CDR)</span>
          <Gauge className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className={`font-mono text-xl font-bold ${
            biomarkers.cupToDiscRatio > 0.65 ? 'text-rose-400' : biomarkers.cupToDiscRatio > 0.5 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {biomarkers.cupToDiscRatio.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            {biomarkers.cupToDiscRatio > 0.65 ? 'High Cup Loss' : biomarkers.cupToDiscRatio > 0.5 ? 'Borderline' : 'Physiological'}
          </span>
        </div>
        {/* CDR mini gauge */}
        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-2">
          <div
            className={`h-full ${
              biomarkers.cupToDiscRatio > 0.65 ? 'bg-rose-500' : biomarkers.cupToDiscRatio > 0.5 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, biomarkers.cupToDiscRatio * 100)}%` }}
          />
        </div>
      </div>

      {/* 2. Media Clarity / Cataract Score */}
      <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span className="font-medium">Media Clarity Index</span>
          <Eye className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className={`font-mono text-xl font-bold ${
            biomarkers.mediaClarityScore < 60 ? 'text-rose-400' : biomarkers.mediaClarityScore < 80 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {biomarkers.mediaClarityScore}%
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            {biomarkers.mediaClarityScore < 60 ? 'Severe Haze' : biomarkers.mediaClarityScore < 80 ? 'Mild Sclerosis' : 'Crisp Optical'}
          </span>
        </div>
        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mt-2">
          <div
            className={`h-full ${
              biomarkers.mediaClarityScore < 60 ? 'bg-rose-500' : biomarkers.mediaClarityScore < 80 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${biomarkers.mediaClarityScore}%` }}
          />
        </div>
      </div>

      {/* 3. Macular Drusen Burden */}
      <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span className="font-medium">Macular Drusen</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="mt-2">
          <span className={`font-mono text-base font-bold ${
            biomarkers.macularDrusenBurden === 'High' ? 'text-rose-400' : biomarkers.macularDrusenBurden === 'Moderate' ? 'text-amber-400' : 'text-slate-200'
          }`}>
            {biomarkers.macularDrusenBurden}
          </span>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {biomarkers.macularDrusenBurden === 'None' ? 'Macula Unaffected' : 'Sub-RPE Soft/Hard Clusters'}
          </div>
        </div>
      </div>

      {/* 4. Subretinal Fluid (CNV / Wet AMD) */}
      <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span className="font-medium">Subretinal Fluid</span>
          <Droplets className="w-3.5 h-3.5 text-rose-400" />
        </div>
        <div className="mt-2">
          <span className={`font-mono text-base font-bold ${
            biomarkers.subretinalFluidDetected ? 'text-rose-400' : 'text-emerald-400'
          }`}>
            {biomarkers.subretinalFluidDetected ? 'PRESENT (Active)' : 'ABSENT'}
          </span>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {biomarkers.subretinalFluidDetected ? 'Exudative / Neovascular' : 'Dry Neurosensory Plane'}
          </div>
        </div>
      </div>

      {/* 5. Clinical Urgency Staging */}
      <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg flex flex-col justify-between col-span-2 md:col-span-1">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span className="font-medium">Triage Priority</span>
          <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="mt-2">
          <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold border inline-block ${getUrgencyBadge()}`}>
            {urgency.toUpperCase()}
          </span>
          <div className="text-[11px] text-slate-500 mt-1">
            {urgency === 'Emergent'
              ? 'Anti-VEGF / Retinal Referral'
              : urgency === 'Urgent'
              ? 'Prompt Ophthalmology Review'
              : urgency === 'Moderate'
              ? 'Repeat Exam in 3-6 Months'
              : 'Annual Screening Schedule'}
          </div>
        </div>
      </div>
    </div>
  );
};
