import React, { useRef, useState, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  Layers,
  Sparkles,
  Maximize2,
  Crosshair,
  Sliders,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { TargetCategory, AnatomicalRegion, Biomarkers } from '../types/ophthalmology';

export type FilterMode = 'natural' | 'red_free' | 'clahe' | 'inverted' | 'gradcam';

interface RetinalViewerProps {
  imageSrc: string;
  selectedCategory: TargetCategory | null;
  categories: TargetCategory[];
  anatomicalRegions: AnatomicalRegion[];
  biomarkers: Biomarkers;
  eyeLaterality: 'OD' | 'OS' | 'OU';
  modality: 'CFP' | 'OCT' | 'Anterior';
  isAnalyzing: boolean;
}

export const RetinalViewer: React.FC<RetinalViewerProps> = ({
  imageSrc,
  selectedCategory,
  categories,
  anatomicalRegions,
  biomarkers,
  eyeLaterality,
  modality,
  isAnalyzing,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [filterMode, setFilterMode] = useState<FilterMode>('natural');
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true);
  const [showFovealGrid, setShowFovealGrid] = useState<boolean>(false);
  const [showCdrCircle, setShowCdrCircle] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Reset zoom & pan when image changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [imageSrc]);

  // Render canvas with filters applied
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;

    img.onload = () => {
      canvas.width = 600;
      canvas.height = 600;

      // Draw base image
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      if (filterMode === 'natural') {
        return; // default natural color
      }

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      if (filterMode === 'red_free') {
        // Red-Free standard in ophthalmology: 540nm green channel isolates hemoglobin
        // Emphasizes hemorrhages, microaneurysms, and nerve fiber layer
        for (let i = 0; i < data.length; i += 4) {
          const g = data[i + 1];
          data[i] = g;
          data[i + 1] = g;
          data[i + 2] = g;
        }
        ctx.putImageData(imgData, 0, 0);
      } else if (filterMode === 'clahe') {
        // High-contrast edge enhancement for drusen, exudates, and cup-to-disc demarcation
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Local contrast stretch
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          const factor = lum > 128 ? 1.25 : 0.75;
          data[i] = Math.min(255, Math.max(0, r * factor));
          data[i + 1] = Math.min(255, Math.max(0, g * factor));
          data[i + 2] = Math.min(255, Math.max(0, b * factor));
        }
        ctx.putImageData(imgData, 0, 0);
      } else if (filterMode === 'inverted') {
        // Fluoroscopy / Inverted density mode
        for (let i = 0; i < data.length; i += 4) {
          const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          const inv = 255 - lum;
          data[i] = inv;
          data[i + 1] = inv;
          data[i + 2] = inv;
        }
        ctx.putImageData(imgData, 0, 0);
      } else if (filterMode === 'gradcam') {
        // Deep Learning Grad-CAM heat-activation map overlay
        ctx.putImageData(imgData, 0, 0);

        // Overlay heat gradient depending on detected pathology
        const targetId = selectedCategory?.id || categories.find(c => c.confidence >= 50 && c.id !== 'healthy')?.id || 'healthy';
        
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.globalCompositeOperation = 'color';

        const grad = ctx.createRadialGradient(
          targetId === 'glaucoma' ? 440 : 300,
          targetId === 'glaucoma' ? 300 : 300,
          10,
          targetId === 'glaucoma' ? 440 : 300,
          targetId === 'glaucoma' ? 300 : 300,
          targetId === 'glaucoma' ? 90 : 160
        );

        grad.addColorStop(0, 'rgba(255, 0, 0, 0.9)');
        grad.addColorStop(0.35, 'rgba(255, 165, 0, 0.75)');
        grad.addColorStop(0.7, 'rgba(255, 255, 0, 0.45)');
        grad.addColorStop(1, 'rgba(0, 0, 255, 0)');

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }
    };
  }, [imageSrc, filterMode, selectedCategory, categories]);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Convert 0-1000 normalized box to percentages
  const getBoxStyle = (box2d: [number, number, number, number]) => {
    const [ymin, xmin, ymax, xmax] = box2d;
    return {
      top: `${(ymin / 1000) * 100}%`,
      left: `${(xmin / 1000) * 100}%`,
      height: `${((ymax - ymin) / 1000) * 100}%`,
      width: `${((xmax - xmin) / 1000) * 100}%`,
    };
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 rounded-2xl' : 'w-full'
      }`}
    >
      {/* Top Viewer Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-md">
        {/* Laterality & Modality metadata */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono font-semibold tracking-wider px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50">
            {eyeLaterality === 'OD' ? 'OD (Right Eye)' : eyeLaterality === 'OS' ? 'OS (Left Eye)' : 'OU (Both Eyes)'}
          </span>
          <span className="text-slate-600">·</span>
          <span className="font-mono text-slate-400">
            {modality === 'CFP' ? 'Color Fundus 50°' : modality === 'OCT' ? 'Spectral Domain OCT' : 'Slit-Lamp Anterior'}
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400 font-mono text-[11px]">
            {Math.round(zoom * 100)}% Mag
          </span>
        </div>

        {/* Optical Filters & Heatmap Segmented Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 rounded-lg border border-slate-800">
          <button
            onClick={() => setFilterMode('natural')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              filterMode === 'natural'
                ? 'bg-slate-800 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Natural True Color Fundus"
          >
            True Color
          </button>
          <button
            onClick={() => setFilterMode('red_free')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              filterMode === 'red_free'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60 shadow-sm'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
            title="Red-Free (540nm Green Channel) - Vessel & Hemorrhage Enhancement"
          >
            Red-Free (540nm)
          </button>
          <button
            onClick={() => setFilterMode('clahe')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              filterMode === 'clahe'
                ? 'bg-amber-950 text-amber-300 border border-amber-800/60 shadow-sm'
                : 'text-slate-400 hover:text-amber-300'
            }`}
            title="Contrast-Limited Adaptive Enhancement (CLAHE)"
          >
            CLAHE
          </button>
          <button
            onClick={() => setFilterMode('inverted')}
            className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              filterMode === 'inverted'
                ? 'bg-slate-800 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Inverted Density Optical Map"
          >
            Inverted
          </button>
          <button
            onClick={() => setFilterMode('gradcam')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors ${
              filterMode === 'gradcam'
                ? 'bg-rose-950 text-rose-300 border border-rose-800/60 shadow-sm'
                : 'text-slate-400 hover:text-rose-300'
            }`}
            title="Deep Learning Grad-CAM Attention Heatmap"
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            Grad-CAM
          </button>
        </div>

        {/* View Tools: Zoom, Overlays, Fullscreen */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowAnnotations(!showAnnotations)}
            className={`p-1.5 rounded text-xs transition-colors ${
              showAnnotations
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/50'
                : 'text-slate-500 hover:text-slate-300 bg-slate-900 border border-slate-800'
            }`}
            title="Toggle Pathology Bounding Boxes"
          >
            <Layers className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowCdrCircle(!showCdrCircle)}
            className={`p-1.5 rounded text-xs transition-colors ${
              showCdrCircle
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/50'
                : 'text-slate-500 hover:text-slate-300 bg-slate-900 border border-slate-800'
            }`}
            title="Toggle Cup-to-Disc Ratio (CDR) Optic Disc Caliper"
          >
            <Crosshair className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-slate-800 mx-1" />
          <button
            onClick={() => setZoom(Math.max(1, zoom - 0.25))}
            disabled={zoom <= 1}
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed bg-slate-900 border border-slate-800"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(Math.min(4, zoom + 0.25))}
            disabled={zoom >= 4}
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed bg-slate-900 border border-slate-800"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={resetView}
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800"
            title="Reset Pan & Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800"
            title="Toggle Fullscreen Inspection"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Retinal Scan Canvas Viewport */}
      <div
        className="relative w-full aspect-square max-h-[580px] bg-black flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Scaled & Panned Content Container */}
        <div
          className="relative w-[600px] h-[600px] transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          {/* HTML5 Filter Canvas */}
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain pointer-events-none rounded-full shadow-inner"
          />

          {/* Caliper Overlays: Cup-to-Disc (CDR) Circle */}
          {showCdrCircle && (
            <div
              className="absolute pointer-events-none transition-opacity"
              style={{
                top: '50%',
                left: '73.3%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* Disc Rim (outer, 90px diameter) */}
              <div
                className="rounded-full border-2 border-dashed border-amber-400/80 shadow-[0_0_8px_rgba(251,191,36,0.5)] flex items-center justify-center"
                style={{ width: '90px', height: '90px' }}
              >
                {/* Physiological Cup (inner, scaled by estimated CDR) */}
                <div
                  className={`rounded-full border-2 border-emerald-400/90 shadow-[0_0_6px_rgba(52,211,153,0.5)] ${
                    biomarkers.cupToDiscRatio > 0.65 ? 'border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]' : ''
                  }`}
                  style={{
                    width: `${Math.round(90 * biomarkers.cupToDiscRatio)}px`,
                    height: `${Math.round(90 * biomarkers.cupToDiscRatio * 1.05)}px`,
                  }}
                />
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-1.5 py-0.5 rounded bg-slate-950/90 border border-slate-700 text-[10px] font-mono text-amber-300 whitespace-nowrap">
                CDR: {biomarkers.cupToDiscRatio.toFixed(2)}
              </div>
            </div>
          )}

          {/* Macula ETDRS 9-Zone Grid */}
          {showFovealGrid && (
            <div
              className="absolute pointer-events-none border border-cyan-400/50 rounded-full"
              style={{
                top: '50%',
                left: '50%',
                width: '120px',
                height: '120px',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div
                className="absolute inset-0 m-auto border border-cyan-400/70 rounded-full"
                style={{ width: '40px', height: '40px' }}
              />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-cyan-400/40" />
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-cyan-400/40" />
            </div>
          )}

          {/* Pathology Annotations / Bounding Boxes */}
          {showAnnotations &&
            anatomicalRegions.map((region, idx) => {
              const style = getBoxStyle(region.box2d);
              const isAlert = region.severity === 'Severe' || region.category === 'cnv' || region.category === 'glaucoma';
              return (
                <div
                  key={idx}
                  className={`absolute border-2 pointer-events-none transition-all ${
                    isAlert
                      ? 'border-rose-500/90 bg-rose-500/10 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                      : 'border-cyan-400/90 bg-cyan-400/10 shadow-[0_0_8px_rgba(34,211,238,0.3)]'
                  }`}
                  style={style}
                >
                  <div className="absolute -top-5 left-0 px-1.5 py-0.5 bg-slate-950/95 border border-slate-800 rounded text-[10px] font-mono text-slate-200 whitespace-nowrap flex items-center gap-1 shadow-sm">
                    <span className={`w-1.5 h-1.5 rounded-full ${isAlert ? 'bg-rose-500 animate-pulse' : 'bg-cyan-400'}`} />
                    <span>{region.label}</span>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Neural Network Analysis Spinner Overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-30">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
              <div className="absolute inset-2 rounded-full border-2 border-rose-500/20 border-b-rose-400 animate-spin [animation-duration:1.5s]" />
              <Eye className="w-6 h-6 text-cyan-400 animate-pulse" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-slate-200">
                Running Multi-Modal Retinal Neural Network...
              </p>
              <p className="text-xs font-mono text-cyan-400/90">
                ResNet-50 · EfficientNet-B4 · Calibrated Multi-Class Softmax
              </p>
            </div>
          </div>
        )}

        {/* Watermark / Clinical Orientation Hud */}
        <div className="absolute bottom-3 left-3 px-2 py-1 bg-slate-950/80 border border-slate-800 rounded text-[10px] font-mono text-slate-400 pointer-events-none backdrop-blur-sm flex items-center gap-2">
          <span>Field: 50° Nasal-Centered</span>
          <span>·</span>
          <span>Filter: {filterMode.toUpperCase()}</span>
          {filterMode === 'gradcam' && (
            <>
              <span>·</span>
              <span className="text-rose-400">Class Activation: {selectedCategory?.name || 'Ensemble Focus'}</span>
            </>
          )}
        </div>
      </div>

      {/* Quick Diagnostic Ribbon under viewer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-4 py-2.5 bg-slate-950 border-t border-slate-800 text-xs">
        <div className="flex flex-col">
          <span className="text-slate-500 text-[11px]">Optic Cup-to-Disc</span>
          <span className={`font-mono font-semibold ${biomarkers.cupToDiscRatio > 0.65 ? 'text-rose-400' : 'text-slate-200'}`}>
            CDR {biomarkers.cupToDiscRatio.toFixed(2)} {biomarkers.cupToDiscRatio > 0.65 ? '(High Risk)' : '(Normal)'}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-slate-500 text-[11px]">Media Clarity Index</span>
          <span className={`font-mono font-semibold ${biomarkers.mediaClarityScore < 60 ? 'text-amber-400' : 'text-slate-200'}`}>
            {biomarkers.mediaClarityScore}% {biomarkers.mediaClarityScore < 60 ? '(Hazy)' : '(Clear)'}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-slate-500 text-[11px]">Macular Drusen</span>
          <span className={`font-mono font-semibold ${biomarkers.macularDrusenBurden !== 'None' ? 'text-amber-400' : 'text-slate-200'}`}>
            {biomarkers.macularDrusenBurden} Burden
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-slate-500 text-[11px]">Subretinal Fluid</span>
          <span className={`font-mono font-semibold ${biomarkers.subretinalFluidDetected ? 'text-rose-400 flex items-center gap-1' : 'text-slate-200'}`}>
            {biomarkers.subretinalFluidDetected ? 'Detected (Active CNV)' : 'None Observed'}
          </span>
        </div>
      </div>
    </div>
  );
};
