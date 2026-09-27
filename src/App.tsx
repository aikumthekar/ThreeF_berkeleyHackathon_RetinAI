import React, { useState, useEffect } from 'react';
import { SAMPLE_SCANS } from './data/sampleScans';
import {
  AnalysisResult,
  PatientInfo,
  SampleScan,
  TargetCategory,
  NeuralNetworkId,
} from './types/ophthalmology';
import { NEURAL_NETWORK_OPTIONS, getModelById } from './data/modelsConfig';
import { Header } from './components/Header';
import { SampleScansStrip } from './components/SampleScansStrip';
import { BiomarkersBar } from './components/BiomarkersBar';
import { RetinalViewer } from './components/RetinalViewer';
import { ClassificationScoreboard } from './components/ClassificationScoreboard';
import { ClinicalReportModal } from './components/ClinicalReportModal';
import { ModelArchitectureModal } from './components/ModelArchitectureModal';
import { ScanUploadModal } from './components/ScanUploadModal';
import { SendEmailModal } from './components/SendEmailModal';
import {
  AlertCircle,
  FileCheck,
  CheckCircle2,
  Stethoscope,
  Info,
  Calendar,
  FileText,
  Clock,
  Mail,
  Star,
  Check,
  X
} from 'lucide-react';

export default function App() {
  const initialScan = SAMPLE_SCANS[0]; // Healthy initial scan

  // Retrieve initial default neural network from localStorage or fallback to EfficientNet-B4
  const [defaultModel, setDefaultModel] = useState<NeuralNetworkId>(() => {
    try {
      const saved = localStorage.getItem('retinascan_default_model');
      if (
        saved &&
        ['ensemble', 'efficientnet_b4', 'resnet_50', 'gemini_vision'].includes(saved)
      ) {
        return saved as NeuralNetworkId;
      }
    } catch (e) {
      // ignore
    }
    return 'efficientnet_b4';
  });

  const [currentImageSrc, setCurrentImageSrc] = useState<string>(initialScan.dataUrl);
  const [currentScanId, setCurrentScanId] = useState<string>(initialScan.id);
  const [activeModel, setActiveModel] = useState<NeuralNetworkId>(defaultModel);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    patientId: 'PT-982410',
    eyeLaterality: 'OS',
    modality: 'CFP',
    historyNotes: 'Routine screening. Visual acuity 20/20 OU. No ocular symptoms.',
  });

  const initialModelMeta = getModelById(defaultModel);

  const [analysis, setAnalysis] = useState<AnalysisResult>({
    timestamp: new Date().toISOString(),
    modelUsed: defaultModel,
    eyeLaterality: 'OS',
    modality: 'CFP',
    overallDiagnosis: 'Healthy Retinal Scan - No Active Sight-Threatening Pathology Detected',
    clinicalImpression:
      'Retinal vasculature, optic nerve head, and foveal reflex appear anatomically intact without signs of diabetic retinopathy, glaucoma cup enlargement, cataract media distortion, drusen formation, or choroidal neovascularization.',
    urgency: 'Routine',
    categories: initialScan.sampleCategories,
    biomarkers: initialScan.biomarkers,
    anatomicalRegions: [
      {
        label: 'Optic Disc (CDR 0.36)',
        category: 'glaucoma',
        box2d: [350, 680, 620, 920],
        severity: 'Normal',
      },
      {
        label: 'Macular Center (Fovea Centralis)',
        category: 'amd',
        box2d: [440, 360, 560, 480],
        severity: 'Intact',
      },
    ],
    recommendations: [
      'Correlate findings with dilated indirect ophthalmoscopy and visual field perimetry.',
      'Schedule routine 12-month follow-up examination.',
      'Monitor intraocular pressure (IOP) and baseline optical coherence tomography if indicated.',
    ],
    modelBenchmark: {
      architecture: initialModelMeta.architectureDetails,
      flopssG: initialModelMeta.flopssG,
      parameterCount: `${initialModelMeta.paramCount} params`,
      validationDataset: 'EyePACS + Messidor-2 + ODIR + OCT-2017 Cohort',
      crossEntropyLoss: initialModelMeta.crossEntropyLoss,
    },
  });

  const [selectedCategory, setSelectedCategory] = useState<TargetCategory | null>(
    analysis.categories[0]
  );

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState<boolean>(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Check health and API key on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setHasApiKey(Boolean(data.hasApiKey));
      })
      .catch((err) => console.log('Backend health check:', err));
  }, []);

  // Handler to set manual default evaluation neural network
  const handleSetDefaultModel = (model: NeuralNetworkId, alsoActivateCurrent: boolean = true) => {
    try {
      localStorage.setItem('retinascan_default_model', model);
    } catch (e) {
      console.warn('Unable to persist default model to localStorage:', e);
    }
    setDefaultModel(model);
    const meta = getModelById(model);
    setToastMessage(`Default evaluation neural network set to ${meta.name}`);

    // If also requested to activate or if activeModel differs, switch active model too
    if (alsoActivateCurrent && activeModel !== model) {
      setActiveModel(model);
      executeScanAnalysis(currentImageSrc, model, patientInfo);
    }
  };

  // Analyze eye scan
  const executeScanAnalysis = async (
    imageBase64: string,
    model: NeuralNetworkId,
    info: PatientInfo
  ) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          modelChoice: model,
          eyeLaterality: info.eyeLaterality,
          modality: info.modality,
          patientInfo: info,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const result: AnalysisResult = await response.json();
      setAnalysis(result);

      // Select top positive disease or healthy
      const topPositive =
        result.categories.find((c) => c.confidence >= 50 && c.id !== 'healthy') ||
        result.categories.find((c) => c.id === 'healthy') ||
        result.categories[0];
      setSelectedCategory(topPositive);
    } catch (err: any) {
      console.warn('Analysis fallback used:', err.message);
      const modelMeta = getModelById(model);
      // Fallback: update model used on existing analysis
      setAnalysis((prev) => ({
        ...prev,
        modelUsed: model,
        timestamp: new Date().toISOString(),
        modelBenchmark: {
          architecture: modelMeta.architectureDetails,
          flopssG: modelMeta.flopssG,
          parameterCount: `${modelMeta.paramCount} params`,
          validationDataset: 'EyePACS + Messidor-2 + ODIR + OCT-2017 Cohort',
          crossEntropyLoss: modelMeta.crossEntropyLoss,
        },
      }));
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle sample scan switch
  const handleSelectSample = (sample: SampleScan) => {
    setCurrentScanId(sample.id);
    setCurrentImageSrc(sample.dataUrl);

    const updatedInfo: PatientInfo = {
      patientId: `PT-${Math.floor(100000 + Math.random() * 900000)}`,
      eyeLaterality: sample.eye,
      modality: sample.modality,
      historyNotes: sample.description,
    };
    setPatientInfo(updatedInfo);

    const activeMeta = getModelById(activeModel);

    // Set curated sample analysis
    const sampleAnalysis: AnalysisResult = {
      timestamp: new Date().toISOString(),
      modelUsed: activeModel,
      eyeLaterality: sample.eye,
      modality: sample.modality,
      overallDiagnosis: sample.title,
      clinicalImpression: sample.clinicalFindings,
      urgency:
        sample.categoryTag === 'cnv'
          ? 'Emergent'
          : sample.categoryTag === 'diabetic_retinopathy' ||
            sample.categoryTag === 'glaucoma' ||
            sample.categoryTag === 'co_occurrence'
          ? 'Urgent'
          : sample.categoryTag === 'amd' || sample.categoryTag === 'cataract'
          ? 'Moderate'
          : 'Routine',
      categories: sample.sampleCategories,
      biomarkers: sample.biomarkers,
      anatomicalRegions: getSampleRegions(sample.categoryTag, sample.biomarkers.cupToDiscRatio),
      recommendations: getSampleRecommendations(sample.categoryTag),
      modelBenchmark: {
        architecture: activeMeta.architectureDetails,
        flopssG: activeMeta.flopssG,
        parameterCount: `${activeMeta.paramCount} params`,
        validationDataset: 'EyePACS + Messidor-2 + ODIR + OCT-2017 Cohort',
        crossEntropyLoss: activeMeta.crossEntropyLoss,
      },
    };

    setAnalysis(sampleAnalysis);
    const topPositive =
      sampleAnalysis.categories.find((c) => c.confidence >= 50 && c.id !== 'healthy') ||
      sampleAnalysis.categories.find((c) => c.id === 'healthy') ||
      sampleAnalysis.categories[0];
    setSelectedCategory(topPositive);
  };

  // Helper to provide anatomical bounding boxes for samples
  function getSampleRegions(tag: string, cdr: number) {
    if (tag === 'dr') {
      return [
        {
          label: 'Circinate Hard Exudates',
          category: 'diabetic_retinopathy' as const,
          box2d: [380, 360, 520, 480] as [number, number, number, number],
          severity: 'Moderate',
        },
        {
          label: 'Intraretinal Hemorrhages',
          category: 'diabetic_retinopathy' as const,
          box2d: [350, 480, 480, 620] as [number, number, number, number],
          severity: 'Moderate',
        },
        {
          label: 'Cotton Wool Spot (Infarct)',
          category: 'diabetic_retinopathy' as const,
          box2d: [380, 580, 480, 700] as [number, number, number, number],
          severity: 'Severe',
        },
      ];
    }
    if (tag === 'glaucoma' || tag === 'co_occurrence') {
      return [
        {
          label: `Glaucomatous Cup (CDR ${cdr.toFixed(2)})`,
          category: 'glaucoma' as const,
          box2d: [360, 640, 620, 880] as [number, number, number, number],
          severity: 'Severe',
        },
        {
          label: 'Inferior Neuroretinal Notch',
          category: 'glaucoma' as const,
          box2d: [560, 700, 630, 810] as [number, number, number, number],
          severity: 'Severe',
        },
      ];
    }
    if (tag === 'amd') {
      return [
        {
          label: 'Soft Confluent Drusen Macula',
          category: 'amd' as const,
          box2d: [420, 420, 580, 580] as [number, number, number, number],
          severity: 'Moderate',
        },
        {
          label: 'RPE Hyperpigmentation',
          category: 'amd' as const,
          box2d: [480, 470, 530, 520] as [number, number, number, number],
          severity: 'Moderate',
        },
      ];
    }
    if (tag === 'cnv') {
      return [
        {
          label: 'Choroidal Neovascular Membrane',
          category: 'cnv' as const,
          box2d: [450, 440, 560, 560] as [number, number, number, number],
          severity: 'Severe',
        },
        {
          label: 'Subretinal Fluid Elevation',
          category: 'cnv' as const,
          box2d: [400, 400, 600, 600] as [number, number, number, number],
          severity: 'Severe',
        },
        {
          label: 'Marginal Hemorrhage',
          category: 'cnv' as const,
          box2d: [480, 530, 540, 590] as [number, number, number, number],
          severity: 'Severe',
        },
      ];
    }
    return [
      {
        label: `Optic Disc (CDR ${cdr.toFixed(2)})`,
        category: 'normal' as const,
        box2d: [360, 660, 620, 900] as [number, number, number, number],
        severity: 'Normal',
      },
      {
        label: 'Macular Center (FAZ Intact)',
        category: 'normal' as const,
        box2d: [450, 450, 550, 550] as [number, number, number, number],
        severity: 'Normal',
      },
    ];
  }

  function getSampleRecommendations(tag: string) {
    switch (tag) {
      case 'cnv':
        return [
          'Immediate vitreoretinal consultation for optical coherence tomography angiography (OCT-A).',
          'Urgent evaluation for anti-vascular endothelial growth factor (anti-VEGF) intravitreal therapy.',
          'Advise patient on home daily Amsler grid self-monitoring of metamorphopsia.',
        ];
      case 'dr':
        return [
          'Perform dilated indirect ophthalmoscopy with scleral indentation to rule out peripheral neovascularization.',
          'Order Macular Spectral-Domain OCT to assess for center-involved diabetic macular edema (DME).',
          'Coordinate with endocrinologist for strict glycemic control (HbA1c target < 7.0%) and blood pressure management.',
        ];
      case 'glaucoma':
        return [
          'Obtain automated 24-2 Humphrey Visual Field perimetry to map functional visual scotoma.',
          'Perform pachymetry for central corneal thickness (CCT) and 4-mirror gonioscopy for angle closure risk.',
          'Initiate topical ocular hypotensive prostaglandin analogue therapy (target IOP reduction > 25%).',
        ];
      case 'cataract':
        return [
          'Evaluate subjective visual disability and best-corrected visual acuity under glare testing.',
          'Schedule pre-operative biometry and optical coherence topography for intraocular lens (IOL) calculation.',
          'Advise patient regarding phacoemulsification with posterior chamber IOL implantation when visual needs dictate.',
        ];
      case 'amd':
        return [
          'Prescribe AREDS-2 antioxidant and zinc micronutrient supplement formulation to reduce progression risk.',
          'Issue daily Amsler grid chart; educate patient to report immediate sudden distortion or central blind spot.',
          'Schedule high-definition SD-OCT follow-up in 3 months to monitor for exudative transition to CNV.',
        ];
      case 'co_occurrence':
        return [
          'Dual management protocol: Initiate IOP-lowering therapy and schedule diabetic retinopathy staging examination.',
          'Order both RNFL thickness analysis and Macular OCT cube scans.',
          'Close 4-6 week follow-up interval for multimodal monitoring.',
        ];
      case 'healthy':
      default:
        return [
          'No evidence of active ocular pathology or sight-threatening lesions on fundus examination.',
          'Recommend regular routine 12-month comprehensive eye examination.',
          'Counsel on UV protection, balanced nutrition, and standard ocular hygiene.',
        ];
    }
  }

  // Handle uploaded scan
  const handleScanSubmitted = (base64Image: string, info: PatientInfo) => {
    setCurrentScanId('uploaded-custom');
    setCurrentImageSrc(base64Image);
    setPatientInfo(info);
    executeScanAnalysis(base64Image, activeModel, info);
  };

  // Handle model switch
  const handleModelChange = (model: NeuralNetworkId) => {
    setActiveModel(model);
    executeScanAnalysis(currentImageSrc, model, patientInfo);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300 relative">
      {/* Clinical App Header */}
      <Header
        activeModel={activeModel}
        defaultModel={defaultModel}
        onSelectModel={handleModelChange}
        onSetDefaultModel={handleSetDefaultModel}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onOpenReport={() => setIsReportModalOpen(true)}
        onOpenEmail={() => setIsEmailModalOpen(true)}
        onOpenArchitecture={() => setIsArchitectureModalOpen(true)}
        hasApiKey={hasApiKey}
      />

      {/* Main Clinical Dashboard Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Preloaded Test Scans Carousel */}
        <SampleScansStrip
          currentScanId={currentScanId}
          onSelectSample={handleSelectSample}
        />

        {/* Quantitative Clinical Biomarkers Bar */}
        <BiomarkersBar
          biomarkers={analysis.biomarkers}
          urgency={analysis.urgency}
        />

        {/* Core Workspace: Retinal Viewer (Left) + Multi-Disease Scoreboard (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (Viewer & Diagnostic Controls): 7 Columns on Large Screens */}
          <div className="lg:col-span-7 space-y-4">
            <RetinalViewer
              imageSrc={currentImageSrc}
              selectedCategory={selectedCategory}
              categories={analysis.categories}
              anatomicalRegions={analysis.anatomicalRegions}
              biomarkers={analysis.biomarkers}
              eyeLaterality={patientInfo.eyeLaterality}
              modality={patientInfo.modality}
              isAnalyzing={isAnalyzing}
            />

            {/* Clinical Impression & Findings Card */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-slate-100">
                    Ophthalmologist Clinical Impression & AI Synthesis
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(analysis.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-bold text-cyan-300">
                  {analysis.overallDiagnosis}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {analysis.clinicalImpression}
                </p>
              </div>

              {/* Actionable Recommendations */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Recommended Action Plan:
                </span>
                <ul className="space-y-1 text-xs text-slate-300">
                  {analysis.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold mt-0.5">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column (Classification Scoreboard & Calibrated Confidences): 5 Columns */}
          <div className="lg:col-span-5 space-y-4">
            <ClassificationScoreboard
              categories={analysis.categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              activeModel={activeModel}
              defaultModel={defaultModel}
              onSetDefaultModel={handleSetDefaultModel}
              onOpenArchitecture={() => setIsArchitectureModalOpen(true)}
            />

            {/* Patient Context & Quick Meta Card */}
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs space-y-2.5">
              <div className="flex items-center justify-between font-mono text-slate-400 border-b border-slate-800 pb-2">
                <span>
                  Patient ID: <strong className="text-slate-200">{patientInfo.patientId}</strong>
                </span>
                <span>
                  Laterality: <strong className="text-cyan-300">{patientInfo.eyeLaterality}</strong>
                </span>
              </div>
              <div className="text-slate-400">
                <span className="text-slate-500 block mb-0.5">Clinical Referral Notes:</span>
                <p className="text-slate-300 bg-slate-950 p-2.5 rounded border border-slate-850 italic">
                  "{patientInfo.historyNotes || 'No specific clinical history provided.'}"
                </p>
              </div>
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 font-mono">
                <span>Dataset: EyePACS + ODIR-5K</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="text-cyan-400 hover:text-cyan-300 underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <FileText className="w-3 h-3" />
                    Report
                  </button>
                  <button
                    onClick={() => setIsEmailModalOpen(true)}
                    className="text-cyan-400 hover:text-cyan-300 underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Mail className="w-3 h-3" />
                    Email
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Toast Notification for Default Model Updates */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-in bg-slate-900/95 border border-emerald-500/80 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md max-w-md">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Star className="w-4 h-4 fill-emerald-400 text-emerald-400" />
          </div>
          <div className="flex-1">
            <div className="text-xs font-bold text-white flex items-center gap-1">
              <span>Default Neural Network Configured</span>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-[11px] text-emerald-300 font-medium mt-0.5">
              {toastMessage}
            </div>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modals */}
      <ScanUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onScanSubmitted={handleScanSubmitted}
        activeModel={activeModel}
        defaultModel={defaultModel}
        onSelectModel={handleModelChange}
        onSetDefaultModel={(model) => handleSetDefaultModel(model, false)}
      />

      <ClinicalReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        analysis={analysis}
        patientInfo={patientInfo}
        scanImageSrc={currentImageSrc}
        onOpenEmail={() => {
          setIsReportModalOpen(false);
          setIsEmailModalOpen(true);
        }}
      />

      <SendEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        analysis={analysis}
        patientInfo={patientInfo}
        scanImageSrc={currentImageSrc}
      />

      <ModelArchitectureModal
        isOpen={isArchitectureModalOpen}
        onClose={() => setIsArchitectureModalOpen(false)}
        activeModel={activeModel}
        defaultModel={defaultModel}
        onSelectModel={(model) => {
          handleModelChange(model);
          setIsArchitectureModalOpen(false);
        }}
        onSetDefaultModel={(model) => {
          handleSetDefaultModel(model, false);
        }}
      />
    </div>
  );
}
