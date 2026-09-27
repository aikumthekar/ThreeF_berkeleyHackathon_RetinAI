import React, { useState } from 'react';
import {
  X,
  Cpu,
  Layers,
  Award,
  CheckCircle2,
  Zap,
  ArrowRight,
  BrainCircuit,
  Star,
  Check,
  Sparkles
} from 'lucide-react';
import { NeuralNetworkId } from '../types/ophthalmology';
import { NEURAL_NETWORK_OPTIONS, getModelById } from '../data/modelsConfig';

interface ModelArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeModel: NeuralNetworkId;
  defaultModel: NeuralNetworkId;
  onSelectModel: (model: NeuralNetworkId) => void;
  onSetDefaultModel: (model: NeuralNetworkId) => void;
}

export const ModelArchitectureModal: React.FC<ModelArchitectureModalProps> = ({
  isOpen,
  onClose,
  activeModel,
  defaultModel,
  onSelectModel,
  onSetDefaultModel,
}) => {
  const [justSetDefault, setJustSetDefault] = useState<NeuralNetworkId | null>(null);

  if (!isOpen) return null;

  const currentDefaultMeta = getModelById(defaultModel);

  const handleSetDefault = (modelId: NeuralNetworkId) => {
    onSetDefaultModel(modelId);
    setJustSetDefault(modelId);
    setTimeout(() => {
      setJustSetDefault(null);
    }, 3000);
  };

  const getModelIcon = (id: NeuralNetworkId) => {
    switch (id) {
      case 'efficientnet_b4':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'ensemble':
        return <BrainCircuit className="w-4 h-4 text-cyan-400" />;
      case 'resnet_50':
        return <Layers className="w-4 h-4 text-emerald-400" />;
      case 'gemini_vision':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      default:
        return <Cpu className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <span>Retinal Neural Network Architecture & Benchmarks</span>
              </h2>
              <p className="text-xs text-slate-400">
                Configure default evaluation engine, compare transfer learning parameters, and switch models.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Default Neural Network Status Ribbon */}
          <div className="p-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/40 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                    Default Evaluation Neural Network:
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-600/60 font-mono font-bold text-xs">
                    {currentDefaultMeta.name}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Initializes automatically for all new retinal uploads and diagnostic evaluations. Use the manual buttons on each card to set any network as default.
                </p>
              </div>
            </div>

            {justSetDefault && (
              <div className="animate-fade-in flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/90 border border-emerald-500 text-emerald-200 font-medium text-[11px]">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Default network updated successfully!</span>
              </div>
            )}
          </div>

          {/* Clinical Literature Recommendation Banner */}
          <div className="p-4 bg-cyan-950/30 border border-cyan-800/60 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-cyan-300 font-semibold text-sm">
              <Award className="w-4 h-4 text-cyan-400" />
              Which deep learning model is recommended for clinical screening?
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              In peer-reviewed ophthalmic literature (EyePACS, Messidor-2, and Kermany OCT cohorts), <strong>EfficientNet-B4</strong> balances depth, width, and high-resolution input (380×380) crucial for resolving fine 10µm microaneurysms and drusen with low compute overhead (19.3M params). Our <strong>Multi-Modal Ensemble</strong> fuses EfficientNet-B4 with ResNet-50 and Retinal Vision AI for an exceptional <strong>0.984 AUC</strong> and maximum sensitivity. You can manually assign either—or any model—as your personal default evaluation engine below.
            </p>
          </div>

          {/* Model Selection & Default Management Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {NEURAL_NETWORK_OPTIONS.map((model) => {
              const isDefault = defaultModel === model.id;
              const isActive = activeModel === model.id;

              return (
                <div
                  key={model.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between relative ${
                    isDefault
                      ? 'bg-slate-950/90 border-amber-500/60 shadow-lg ring-1 ring-amber-500/30'
                      : isActive
                      ? 'bg-cyan-950/40 border-cyan-500/80 shadow-md ring-1 ring-cyan-500/30'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Card Header & Badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {getModelIcon(model.id)}
                        <h3 className="font-semibold text-slate-100 text-sm">
                          {model.name}
                        </h3>
                      </div>

                      <div className="flex items-center flex-wrap gap-1.5 justify-end">
                        {isDefault && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/50 font-mono text-[10px] font-bold">
                            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                            DEFAULT
                          </span>
                        )}
                        {isActive && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 font-mono text-[10px] font-bold">
                            <CheckCircle2 className="w-2.5 h-2.5 text-cyan-400" />
                            ACTIVE
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                          {model.paramCount}
                        </span>
                      </div>
                    </div>

                    {/* Architecture Description */}
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      {model.description}
                    </p>

                    {/* Benchmark Metrics Grid */}
                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800/80 font-mono text-[10px]">
                      <div>
                        <span className="text-slate-500 block">Val AUC:</span>
                        <span className="text-emerald-400 font-bold">{model.valAuc}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Resolution:</span>
                        <span className="text-slate-200 font-bold">{model.resolution}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Compute:</span>
                        <span className="text-slate-200 font-bold">{model.flopssG}</span>
                      </div>
                    </div>

                    {/* Strengths List */}
                    <ul className="space-y-1 text-[10px] text-slate-400 pt-1">
                      {model.strengths.map((s, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <span className="text-cyan-400 font-bold">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Dual Action Buttons: Set as Default & Activate */}
                  <div className="pt-4 mt-3 border-t border-slate-800/80 space-y-2">
                    {/* Primary manual default button */}
                    {isDefault ? (
                      <div className="w-full py-1.5 px-3 rounded-lg bg-emerald-950/80 border border-emerald-600/70 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm">
                        <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                        <span>Current Default Evaluation Network</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSetDefault(model.id)}
                        className="w-full py-1.5 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/40 hover:border-amber-500/70 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm group cursor-pointer"
                        title="Set this model as the default evaluation neural network for future sessions and uploads"
                      >
                        <Star className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                        <span>Set as Default Neural Network</span>
                      </button>
                    )}

                    {/* Secondary button: Activate for current evaluation */}
                    <div className="flex gap-2">
                      {isActive ? (
                        <button
                          disabled
                          className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800/80 flex items-center justify-center gap-1 cursor-default opacity-90"
                        >
                          <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                          <span>Active in Workspace</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onSelectModel(model.id)}
                          className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span>Evaluate Current Scan With This Model</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Benchmark Cohorts */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <h4 className="font-semibold text-slate-200 text-xs uppercase tracking-wider">
              Training & Validation Benchmark Cohorts
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-400 text-[11px]">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <div className="font-semibold text-slate-200">EyePACS & Messidor-2</div>
                <div className="text-[10px] text-slate-500">88,702 Color Fundus Images</div>
                <div className="mt-1 text-cyan-400 font-mono">DR Sensitivity: 96.1%</div>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <div className="font-semibold text-slate-200">ODIR-5K Challenge</div>
                <div className="text-[10px] text-slate-500">Multi-label 8 Ophthalmic Classes</div>
                <div className="mt-1 text-cyan-400 font-mono">Glaucoma AUC: 0.963</div>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <div className="font-semibold text-slate-200">Kermany OCT-2017</div>
                <div className="text-[10px] text-slate-500">84,495 Spectral-Domain OCTs</div>
                <div className="mt-1 text-cyan-400 font-mono">CNV / Drusen Acc: 98.2%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
