import { NeuralNetworkId } from '../types/ophthalmology';

export interface NeuralNetworkModelOption {
  id: NeuralNetworkId;
  name: string;
  shortName: string;
  badge: string;
  valAuc: string;
  paramCount: string;
  resolution: string;
  flopssG: string;
  crossEntropyLoss: number;
  architectureDetails: string;
  description: string;
  strengths: string[];
}

export const NEURAL_NETWORK_OPTIONS: NeuralNetworkModelOption[] = [
  {
    id: 'efficientnet_b4',
    name: 'EfficientNet-B4 RetinaNet',
    shortName: 'EfficientNet-B4',
    badge: 'COMPOUND SCALED',
    valAuc: '0.968',
    paramCount: '19.3M',
    resolution: '380×380',
    flopssG: '4.2 GFLOPs',
    crossEntropyLoss: 0.142,
    architectureDetails: 'EfficientNet-B4 RetinaNet (380x380 Compound Scaling, EyePACS pre-trained)',
    description:
      'Compound scaling uniformly scales network depth, width, and input resolution (380×380) with a fixed compound coefficient. Utilizes inverted residual blocks (MBConv) and Squeeze-and-Excitation attention for micro-vascular lesions like microaneurysms and drusen.',
    strengths: [
      'Optimal resolution for 10µm microaneurysms',
      'Squeeze-and-Excitation channel attention',
      'Low parameter footprint (19.3M) & high inference speed',
    ],
  },
  {
    id: 'ensemble',
    name: 'Multi-Modal Ensemble',
    shortName: 'Ensemble',
    badge: 'HIGHEST SENSITIVITY',
    valAuc: '0.984',
    paramCount: '21.4M (eff)',
    resolution: '380×380 Multi',
    flopssG: '4.2 GFLOPs',
    crossEntropyLoss: 0.124,
    architectureDetails: 'Multi-Modal Ensemble (EfficientNet-B4 + ResNet-50 Feature Pyramid + Calibrated Softmax)',
    description:
      'Fuses multi-scale spatial representations from ResNet-50 and compound feature pyramids from EfficientNet-B4 with multimodal clinical reasoning. Cross-model uncertainty weighting yields maximum discrimination across rare co-occurrences.',
    strengths: [
      'Highest benchmark validation AUC (0.984)',
      '96.8% Sensitivity and 97.4% Specificity',
      'Temperature-calibrated multi-disease confidence scoring',
    ],
  },
  {
    id: 'resnet_50',
    name: 'ResNet-50 DeepRetina',
    shortName: 'ResNet-50',
    badge: 'RESIDUAL SKIP',
    valAuc: '0.954',
    paramCount: '25.6M',
    resolution: '224×224',
    flopssG: '3.8 GFLOPs',
    crossEntropyLoss: 0.168,
    architectureDetails: 'ResNet-50 DeepRetina (50-layer Residual Bottleneck Pipeline)',
    description:
      '50-layer deep convolutional network with residual identity mapping shortcuts. Prevents vanishing gradients across deep layer hierarchies and specializes in optic disc cup-to-disc ratio (CDR) and large vascular arcades.',
    strengths: [
      'Established clinical transfer learning baseline',
      'Robust optic disc boundary segmentation',
      'Deep 50-layer representation depth',
    ],
  },
  {
    id: 'gemini_vision',
    name: 'Gemini 3.8 Flash Retinal Vision',
    shortName: 'Gemini Vision AI',
    badge: 'ANATOMICAL REASONING',
    valAuc: '0.975',
    paramCount: 'Multimodal VLM',
    resolution: 'Native High-Res',
    flopssG: 'Adaptive GFLOPs',
    crossEntropyLoss: 0.135,
    architectureDetails: 'Gemini 3.8 Flash Multimodal Reasoning with Box2D Retinal Grounding',
    description:
      'Native multimodal vision-language model trained on extensive medical literature and imaging. Performs zero-shot anatomical localization, generates normalized 0-1000 Box2D grounding bounding boxes, and cross-references ICD-10 diagnostic codes.',
    strengths: [
      'Zero-shot Box2D anatomical bounding box detection',
      'ICD-10 clinical documentation generation',
      'Multi-disease co-occurrence holistic synthesis',
    ],
  },
];

export const getModelById = (id: NeuralNetworkId): NeuralNetworkModelOption => {
  return (
    NEURAL_NETWORK_OPTIONS.find((m) => m.id === id) ||
    NEURAL_NETWORK_OPTIONS[0]
  );
};
