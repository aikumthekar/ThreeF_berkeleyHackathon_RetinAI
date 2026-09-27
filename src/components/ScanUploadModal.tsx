import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Camera, Clipboard, Eye, RefreshCw, Star, Cpu } from 'lucide-react';
import { PatientInfo, NeuralNetworkId } from '../types/ophthalmology';
import { NEURAL_NETWORK_OPTIONS } from '../data/modelsConfig';

interface ScanUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSubmitted: (base64Image: string, patientInfo: PatientInfo) => void;
  activeModel?: NeuralNetworkId;
  defaultModel?: NeuralNetworkId;
  onSelectModel?: (model: NeuralNetworkId) => void;
  onSetDefaultModel?: (model: NeuralNetworkId) => void;
}

export const ScanUploadModal: React.FC<ScanUploadModalProps> = ({
  isOpen,
  onClose,
  onScanSubmitted,
  activeModel,
  defaultModel,
  onSelectModel,
  onSetDefaultModel,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'camera' | 'paste'>('upload');
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [patientId, setPatientId] = useState<string>(`PT-${Math.floor(100000 + Math.random() * 900000)}`);
  const [eyeLaterality, setEyeLaterality] = useState<'OD' | 'OS' | 'OU'>('OD');
  const [modality, setModality] = useState<'CFP' | 'OCT' | 'Anterior'>('OCT');
  const [historyNotes, setHistoryNotes] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera when closing modal or switching tabs
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (isOpen) {
      setModality('OCT');
      setPreviewSrc(null);
      setHistoryNotes('');
      setPatientId(`PT-${Math.floor(100000 + Math.random() * 900000)}`);
      setActiveTab('upload');
      setEyeLaterality('OD');
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const handleStartCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment', // prefer back camera on mobile / adapter
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access camera. Please verify device permissions.');
    }
  };

  const handleCaptureFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setPreviewSrc(dataUrl);
      stopCamera();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPreviewSrc(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handlePaste = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            const reader = new FileReader();
            reader.onload = (e) => {
              setPreviewSrc(e.target?.result as string);
            };
            reader.readAsDataURL(blob);
            return;
          }
        }
      }
    } catch (err) {
      console.error('Clipboard paste failed:', err);
    }
  };

  const handleSubmit = () => {
    if (!previewSrc) return;
    stopCamera();
    onScanSubmitted(previewSrc, {
      patientId,
      eyeLaterality,
      modality,
      historyNotes,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Submit Eye Scan for Deep Learning Classification
              </h2>
              <p className="text-xs text-slate-400">
                Upload Macular OCT (SD-OCT), color fundus photograph, or acquire slit-lamp feed.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 pt-3 gap-2">
          <button
            onClick={() => {
              stopCamera();
              setActiveTab('upload');
            }}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'upload'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            File Upload / Drop
          </button>
          <button
            onClick={() => {
              setActiveTab('camera');
              if (!isCameraActive) handleStartCamera();
            }}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'camera'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            Live Slit-Lamp / Camera
          </button>
          <button
            onClick={() => {
              stopCamera();
              setActiveTab('paste');
            }}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'paste'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clipboard className="w-4 h-4" />
            Clipboard Paste
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Tab 1: File Upload / Drag & Drop */}
          {activeTab === 'upload' && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-cyan-500/80 rounded-xl p-8 text-center cursor-pointer bg-slate-950/50 hover:bg-slate-950 transition-all flex flex-col items-center justify-center gap-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-cyan-950 text-cyan-400 flex items-center justify-center border border-cyan-800/60 shadow-inner">
                <Upload className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-200">
                  Click to browse or drag and drop retinal scan
                </p>
                <p className="text-xs text-slate-500">
                  Supports DICOM exported PNG, JPEG, TIFF, BMP, WebP (Macular OCT or Fundus)
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Live Slit-Lamp / Camera */}
          {activeTab === 'camera' && (
            <div className="space-y-3">
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Circular fundus alignment guide */}
                <div className="absolute inset-0 m-auto w-64 h-64 border-2 border-cyan-400/60 rounded-full pointer-events-none flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-cyan-400/80" />
                </div>
                {cameraError && (
                  <div className="absolute inset-0 bg-slate-950/90 flex items-center justify-center p-4 text-center">
                    <p className="text-xs text-rose-400">{cameraError}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={handleCaptureFrame}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg"
                >
                  <Camera className="w-4 h-4" />
                  Capture Retinal Frame
                </button>
                <button
                  type="button"
                  onClick={handleStartCamera}
                  className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                  title="Reload Camera"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Clipboard Paste */}
          {activeTab === 'paste' && (
            <div className="border border-slate-800 rounded-xl p-8 text-center bg-slate-950/50 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center">
                <Clipboard className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-200">
                Paste an image copied from PACS, EHR, or screenshot
              </p>
              <button
                type="button"
                onClick={handlePaste}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs border border-slate-700 flex items-center gap-2"
              >
                <Clipboard className="w-4 h-4 text-cyan-400" />
                Read from Clipboard (or press Ctrl+V)
              </button>
            </div>
          )}

          {/* Image Preview if available */}
          {previewSrc && (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-4">
              <div className="w-20 h-20 bg-black rounded-lg overflow-hidden shrink-0 border border-slate-700">
                <img src={previewSrc} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  ✓ Image scan loaded and verified
                </span>
                <p className="text-[11px] text-slate-400">
                  Ready for multi-disease inference across ResNet-50 and EfficientNet-B4.
                </p>
              </div>
            </div>
          )}

          {/* Clinical Scan Metadata Form */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Patient Identifier:
              </label>
              <input
                type="text"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Eye Laterality:
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(['OD', 'OS', 'OU'] as const).map((lat) => (
                  <button
                    key={lat}
                    type="button"
                    onClick={() => setEyeLaterality(lat)}
                    className={`py-2 text-xs font-mono font-bold rounded-lg border transition-colors ${
                      eyeLaterality === lat
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {lat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Scan Modality:
              </label>
              <select
                value={modality}
                onChange={(e) => setModality(e.target.value as any)}
                className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="OCT">Macular OCT (SD-OCT) [Default]</option>
                <option value="CFP">Color Fundus (CFP 50°)</option>
                <option value="Anterior">Slit-Lamp Anterior</option>
              </select>
            </div>
          </div>

          {/* Neural Network Model Selection & Default Option */}
          {activeModel && onSelectModel && (
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  Evaluation Neural Network:
                </span>
                {defaultModel && activeModel === defaultModel ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-700/60 px-2 py-0.5 rounded">
                    <Star className="w-2.5 h-2.5 fill-emerald-400" />
                    Default Evaluation Network
                  </span>
                ) : (
                  onSetDefaultModel && (
                    <button
                      type="button"
                      onClick={() => onSetDefaultModel(activeModel)}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300 hover:text-amber-200 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800/70 px-2 py-0.5 rounded transition-colors cursor-pointer"
                      title="Set current engine as default for all future scans"
                    >
                      <Star className="w-2.5 h-2.5 text-amber-400" />
                      Set as Default
                    </button>
                  )
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {NEURAL_NETWORK_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onSelectModel(opt.id)}
                    className={`p-2 rounded-lg border text-left flex flex-col justify-between transition-colors ${
                      activeModel === opt.id
                        ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-medium text-[11px] truncate flex items-center justify-between">
                      <span>{opt.shortName}</span>
                      {opt.id === defaultModel && (
                        <span className="text-[9px] font-mono text-amber-400 font-bold">★ Default</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      AUC: {opt.valAuc} · {opt.paramCount}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Clinical Context / Referral Notes (Optional):
            </label>
            <input
              type="text"
              placeholder="e.g. Type 2 Diabetic screening, elevated IOP 24 mmHg, central vision blur..."
              value={historyNotes}
              onChange={(e) => setHistoryNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-950 border-t border-slate-800">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!previewSrc}
            onClick={handleSubmit}
            className="px-5 py-2 text-xs font-bold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
          >
            Analyze Retinal Scan
          </button>
        </div>
      </div>
    </div>
  );
};
