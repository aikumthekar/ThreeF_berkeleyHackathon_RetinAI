export type CategoryId =
  | 'healthy'
  | 'diabetic_retinopathy'
  | 'glaucoma'
  | 'cataract'
  | 'amd'
  | 'cnv';

export type CategoryStatus = 'Detected' | 'Suspected' | 'Excluded' | 'Normal';

export interface ModelScoreBreakdown {
  efficientNetB4: number;
  resnet50: number;
  retinalVisionAi: number;
}

export interface TargetCategory {
  id: CategoryId;
  name: string;
  confidence: number; // 0 to 100
  status: CategoryStatus;
  stage: string;
  findings: string[];
  icd10: string;
  modelWeights?: ModelScoreBreakdown;
}

export interface Biomarkers {
  cupToDiscRatio: number;
  mediaClarityScore: number;
  macularDrusenBurden: 'None' | 'Low' | 'Moderate' | 'High';
  subretinalFluidDetected: boolean;
  hemorrhageCountEstimate: number;
}

export interface AnatomicalRegion {
  label: string;
  category: CategoryId | 'normal' | 'anatomy';
  box2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] 0-1000 scale
  severity?: string;
  description?: string;
}

export type NeuralNetworkId = 'ensemble' | 'efficientnet_b4' | 'resnet_50' | 'gemini_vision';

export interface ModelBenchmark {
  architecture: string;
  flopssG: string;
  parameterCount: string;
  validationDataset: string;
  crossEntropyLoss: number;
}

export interface AnalysisResult {
  timestamp: string;
  modelUsed: NeuralNetworkId;
  eyeLaterality: 'OD' | 'OS' | 'OU';
  modality: 'CFP' | 'OCT' | 'Anterior';
  overallDiagnosis: string;
  clinicalImpression: string;
  urgency: 'Routine' | 'Moderate' | 'Urgent' | 'Emergent';
  categories: TargetCategory[];
  biomarkers: Biomarkers;
  anatomicalRegions: AnatomicalRegion[];
  recommendations: string[];
  modelBenchmark: ModelBenchmark;
  doctorNotes?: string;
  doctorConfirmedDiagnosis?: string;
}

export interface PatientInfo {
  patientId: string;
  name?: string;
  age?: number;
  gender?: 'M' | 'F' | 'Other';
  eyeLaterality: 'OD' | 'OS' | 'OU';
  modality: 'CFP' | 'OCT' | 'Anterior';
  historyNotes?: string;
}

export interface SampleScan {
  id: string;
  title: string;
  categoryTag: CategoryId | 'co_occurrence';
  categoryLabel: string;
  eye: 'OD' | 'OS';
  modality: 'CFP' | 'OCT';
  description: string;
  clinicalFindings: string;
  dataUrl: string;
  expectedConfidence: number;
  biomarkers: Biomarkers;
  sampleCategories: TargetCategory[];
}
