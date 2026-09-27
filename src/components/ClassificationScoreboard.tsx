import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  Activity,
  Layers,
  Sparkles,
  Info,
  ChevronRight,
  ExternalLink,
  Star,
  Check
} from 'lucide-react';
import { TargetCategory, CategoryId, ModelScoreBreakdown, NeuralNetworkId } from '../types/ophthalmology';
import { getModelById } from '../data/modelsConfig';

interface ClassificationScoreboardProps {
  categories: TargetCategory[];
  selectedCategory: TargetCategory | null;
  onSelectCategory: (category: TargetCategory) => void;
  activeModel: NeuralNetworkId;
  defaultModel?: NeuralNetworkId;
  onSetDefaultModel?: (model: NeuralNetworkId) => void;
  onOpenArchitecture?: () => void;
}

export const ClassificationScoreboard: React.FC<ClassificationScoreboardProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  activeModel,
  defaultModel = 'efficientnet_b4',
  onSetDefaultModel,
  onOpenArchitecture,
}) => {
  const [showModelBreakdown, setShowModelBreakdown] = useState<boolean>(false);

  // Sort categories: put detected pathologies first, then suspected, then healthy, then excluded
  const sortedCategories = [...categories].sort((a, b) => {
    // If a is detected and b is not
    if (a.status === 'Detected' && b.status !== 'Detected') return -1;
    if (b.status === 'Detected' && a.status !== 'Detected') return 1;
    return b.confidence - a.confidence;
  });

  const getStatusBadge = (category: TargetCategory) => {
    if (category.id === 'healthy') {
      if (category.confidence >= 50) {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Normal Retina
          </span>
        );
      }
      return null;
    }

    switch (category.status) {
      case 'Detected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-950/80 text-red-300 border border-red-800">
            <AlertCircle className="w-3 h-3 text-red-400" />
            Detected (≥50%)
          </span>
        );
      case 'Suspected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/70 text-amber-300 border border-amber-800">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Suspected (30-49%)
          </span>
        );
      case 'Excluded':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800/80 text-slate-400 border border-slate-700">
            <CheckCircle2 className="w-3 h-3 text-slate-500" />
            Excluded (&lt;30%)
          </span>
        );
    }
  };

  const getConfidenceColor = (category: TargetCategory) => {
    if (category.id === 'healthy') {
      return category.confidence >= 50 ? 'text-emerald-400' : 'text-slate-400';
    }
    if (category.confidence >= 50) return 'text-red-400';
    if (category.confidence >= 30) return 'text-amber-400';
    return 'text-slate-400';
  };

  const getBarColor = (category: TargetCategory) => {
    if (category.id === 'healthy') {
      return category.confidence >= 50
        ? 'bg-gradient-to-r from-emerald-600 to-teal-400'
        : 'bg-slate-700';
    }
    if (category.confidence >= 50) {
      return 'bg-gradient-to-r from-red-600 to-rose-400';
    }
    if (category.confidence >= 30) {
      return 'bg-gradient-to-r from-amber-600 to-yellow-400';
    }
    return 'bg-slate-700';
  };

  const activeModelMeta = getModelById(activeModel);
  const isCurrentActiveDefault = activeModel === defaultModel;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <Activity className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <span>Deep Learning Classification Results</span>
            </h2>
            <p className="text-xs text-slate-400">
              Calibrated multi-disease predictions with 50% clinical decision boundary
            </p>
          </div>
        </div>

        {/* Toggle Model Architecture Breakdown */}
        <button
          onClick={() => setShowModelBreakdown(!showModelBreakdown)}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
            showModelBreakdown
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
              : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          {showModelBreakdown ? 'Hide Model Comparison' : 'Compare ResNet vs. EfficientNet'}
        </button>
      </div>

      {/* Model Benchmark Info Ribbon */}
      <div className="px-5 py-2.5 bg-slate-950/70 border-b border-slate-800/80 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center flex-wrap gap-2 font-mono">
          <span className="text-slate-500">Active Engine:</span>
          <span className="text-cyan-300 font-semibold">
            {activeModelMeta.name} ({activeModelMeta.paramCount})
          </span>

          {isCurrentActiveDefault ? (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-mono text-[10px] font-bold"
              title="This model is configured as your default evaluation engine"
            >
              <Star className="w-2.5 h-2.5 fill-emerald-400 text-emerald-400" />
              <span>Default</span>
            </span>
          ) : (
            onSetDefaultModel && (
              <button
                type="button"
                onClick={() => onSetDefaultModel(activeModel)}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/40 text-[10px] font-semibold transition-colors cursor-pointer"
                title="Set current engine as manual default"
              >
                <Star className="w-2.5 h-2.5 text-amber-400" />
                <span>Set as Default</span>
              </button>
            )
          )}
        </div>

        <div className="flex items-center gap-3 text-slate-500 font-mono">
          <span>Decision Threshold: <strong className="text-slate-300">50.0%</strong></span>
          <span>·</span>
          <span>
            Validation AUC:{' '}
            <strong className="text-emerald-400">
              {activeModelMeta.valAuc}
            </strong>
          </span>
        </div>
      </div>

      {/* Categories List */}
      <div className="divide-y divide-slate-800/70 overflow-y-auto max-h-[640px]">
        {sortedCategories.map((cat) => {
          const isSelected = selectedCategory?.id === cat.id;

          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat)}
              className={`p-4 transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-slate-800/70 border-l-4 border-l-cyan-400'
                  : 'hover:bg-slate-800/30 border-l-4 border-l-transparent'
              }`}
            >
              <div className="space-y-2">
                {/* Title & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100 text-sm">
                        {cat.name}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                        {cat.icd10}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Stage: <span className="text-slate-300 font-medium">{cat.stage}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(cat)}
                      <span className={`text-base font-bold font-mono ${getConfidenceColor(cat)}`}>
                        {cat.confidence.toFixed(1)}%
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      CI: ±{(1.2 + (100 - cat.confidence) * 0.02).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Calibrated Confidence Progress Bar */}
                <div className="space-y-1">
                  <div className="relative w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                    {/* 50% Threshold marker line */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-slate-400/50 z-10"
                      style={{ left: '50%' }}
                      title="50% Classification Threshold"
                    />

                    {/* Active confidence fill */}
                    <div
                      className={`h-full transition-all duration-500 ease-out rounded-full ${getBarColor(cat)}`}
                      style={{ width: `${Math.min(100, Math.max(3, cat.confidence))}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 px-0.5">
                    <span>0%</span>
                    <span className="text-slate-400">Threshold 50%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Key Clinical Findings */}
                {cat.findings && cat.findings.length > 0 && (
                  <div className="mt-1 pt-2 border-t border-slate-800/40">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                      <span>Signs Observed:</span>
                    </div>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-slate-300">
                      {cat.findings.map((finding, fIdx) => (
                        <li key={fIdx} className="flex items-center gap-1.5 text-[11px]">
                          <span className={`w-1 h-1 rounded-full ${cat.confidence >= 50 ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                          <span className="truncate">{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Deep Learning Model Architecture Breakdown (ResNet-50 vs. EfficientNet-B4) */}
                {showModelBreakdown && cat.modelWeights && (
                  <div className="mt-2 p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg text-xs space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-cyan-300 font-medium">
                      <span>Neural Network Model Breakdown & Defaults:</span>
                      {onOpenArchitecture && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenArchitecture();
                          }}
                          className="text-[10px] text-slate-400 hover:text-cyan-300 underline cursor-pointer"
                        >
                          View Benchmarks
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                      {/* EfficientNet-B4 */}
                      <div className="bg-slate-900 p-2 rounded border border-slate-800 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-slate-400 text-[10px]">
                            <span>EfficientNet-B4</span>
                            {defaultModel === 'efficientnet_b4' && (
                              <span className="text-amber-400 text-[9px] font-bold">DEFAULT</span>
                            )}
                          </div>
                          <div className="text-slate-100 font-semibold text-sm mt-0.5">
                            {cat.modelWeights.efficientNetB4.toFixed(1)}%
                          </div>
                        </div>
                        {onSetDefaultModel && defaultModel !== 'efficientnet_b4' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSetDefaultModel('efficientnet_b4');
                            }}
                            className="mt-1.5 py-0.5 px-1 rounded text-[9px] font-sans font-medium text-amber-300 bg-amber-950/50 hover:bg-amber-900/60 border border-amber-800/60 transition-colors cursor-pointer text-center"
                          >
                            Set as Default
                          </button>
                        )}
                      </div>

                      {/* ResNet-50 */}
                      <div className="bg-slate-900 p-2 rounded border border-slate-800 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-slate-400 text-[10px]">
                            <span>ResNet-50</span>
                            {defaultModel === 'resnet_50' && (
                              <span className="text-amber-400 text-[9px] font-bold">DEFAULT</span>
                            )}
                          </div>
                          <div className="text-slate-100 font-semibold text-sm mt-0.5">
                            {cat.modelWeights.resnet50.toFixed(1)}%
                          </div>
                        </div>
                        {onSetDefaultModel && defaultModel !== 'resnet_50' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSetDefaultModel('resnet_50');
                            }}
                            className="mt-1.5 py-0.5 px-1 rounded text-[9px] font-sans font-medium text-amber-300 bg-amber-950/50 hover:bg-amber-900/60 border border-amber-800/60 transition-colors cursor-pointer text-center"
                          >
                            Set as Default
                          </button>
                        )}
                      </div>

                      {/* Retinal Vision AI */}
                      <div className="bg-slate-900 p-2 rounded border border-slate-800 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-slate-400 text-[10px]">
                            <span>Vision AI</span>
                            {defaultModel === 'gemini_vision' && (
                              <span className="text-amber-400 text-[9px] font-bold">DEFAULT</span>
                            )}
                          </div>
                          <div className="text-slate-100 font-semibold text-sm mt-0.5">
                            {cat.modelWeights.retinalVisionAi.toFixed(1)}%
                          </div>
                        </div>
                        {onSetDefaultModel && defaultModel !== 'gemini_vision' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSetDefaultModel('gemini_vision');
                            }}
                            className="mt-1.5 py-0.5 px-1 rounded text-[9px] font-sans font-medium text-amber-300 bg-amber-950/50 hover:bg-amber-900/60 border border-amber-800/60 transition-colors cursor-pointer text-center"
                          >
                            Set as Default
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Inspect Button */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                  <span className="hover:text-cyan-400 transition-colors flex items-center gap-1">
                    {isSelected ? 'Currently focused in viewer' : 'Click to inspect in viewer'}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'rotate-90 text-cyan-400' : ''}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-500" />
          Multi-label classification allows simultaneous detection of comorbid conditions.
        </span>
      </div>
    </div>
  );
};
