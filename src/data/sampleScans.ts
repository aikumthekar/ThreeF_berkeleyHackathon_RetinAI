import { SampleScan } from '../types/ophthalmology';

function encodeSvg(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
}

// Generate realistic SVG retinal fundus scans
function createFundusSvg(type: 'healthy' | 'dr' | 'glaucoma' | 'cataract' | 'amd' | 'cnv' | 'co_occurrence'): string {
  const width = 600;
  const height = 600;

  // Base background
  const isCataract = type === 'cataract';
  const bgFill = isCataract ? 'url(#cataractGrad)' : 'url(#fundusGrad)';

  // Pathology layers
  let pathologyElements = '';

  if (type === 'dr') {
    // Microaneurysms, hemorrhages, hard exudates
    pathologyElements = `
      <!-- Diabetic Retinopathy Lesions -->
      <!-- Dot and blot hemorrhages -->
      <g fill="#800000" opacity="0.88">
        <circle cx="270" cy="240" r="5" />
        <circle cx="285" cy="250" r="3.5" />
        <circle cx="330" cy="230" r="6" />
        <circle cx="220" cy="310" r="7" />
        <circle cx="240" cy="340" r="4.5" />
        <circle cx="360" cy="360" r="5.5" />
        <circle cx="380" cy="340" r="4" />
        <circle cx="290" cy="380" r="6" />
        <circle cx="340" cy="410" r="4" />
        <circle cx="190" cy="280" r="5" />
      </g>
      <!-- Microaneurysms (tiny punctate red dots) -->
      <g fill="#990000">
        <circle cx="260" cy="265" r="2.2" />
        <circle cx="275" cy="285" r="2" />
        <circle cx="310" cy="260" r="1.8" />
        <circle cx="345" cy="280" r="2.4" />
        <circle cx="355" cy="320" r="2" />
        <circle cx="250" cy="370" r="2.1" />
        <circle cx="320" cy="375" r="2.3" />
      </g>
      <!-- Hard exudates (lipid deposits, yellow/white clusters) -->
      <g fill="#ffea78" opacity="0.92">
        <path d="M 230 250 Q 235 248 238 253 Q 234 258 230 250 Z" />
        <path d="M 242 255 Q 248 252 247 259 Q 240 260 242 255 Z" />
        <path d="M 236 264 Q 241 262 243 268 Q 238 270 236 264 Z" />
        <path d="M 225 260 Q 230 258 229 265 Q 222 266 225 260 Z" />
        <!-- Circinate ring arc -->
        <circle cx="245" cy="275" r="3" />
        <circle cx="255" cy="290" r="3.5" />
        <circle cx="260" cy="305" r="2.8" />
      </g>
      <!-- Cotton wool spots (fluffy white infarctions) -->
      <g fill="#ffffff" opacity="0.65" filter="url(#blurFeather)">
        <ellipse cx="370" cy="260" rx="16" ry="11" transform="rotate(-15 370 260)" />
        <ellipse cx="210" cy="340" rx="14" ry="9" transform="rotate(25 210 340)" />
      </g>
    `;
  } else if (type === 'amd') {
    // Confluent drusen in macula
    pathologyElements = `
      <!-- Age-Related Macular Degeneration (AMD) -->
      <!-- Soft confluent drusen deposits in macula -->
      <g fill="#ffe082" opacity="0.85" filter="url(#drusenSoft)">
        <circle cx="300" cy="300" r="14" />
        <circle cx="285" cy="305" r="11" />
        <circle cx="315" cy="295" r="12" />
        <circle cx="295" cy="318" r="10" />
        <circle cx="310" cy="315" r="13" />
        <circle cx="275" cy="290" r="8" />
        <circle cx="328" cy="310" r="9" />
        <circle cx="300" cy="282" r="10" />
        <circle cx="280" cy="325" r="7" />
        <circle cx="320" cy="330" r="8" />
      </g>
      <!-- Hard distinct drusen dots -->
      <g fill="#fff59d" opacity="0.95">
        <circle cx="265" cy="300" r="3" />
        <circle cx="335" cy="290" r="2.8" />
        <circle cx="290" cy="270" r="3.2" />
        <circle cx="310" cy="340" r="2.5" />
        <circle cx="270" cy="315" r="2.7" />
      </g>
      <!-- RPE pigment mottling -->
      <g fill="#5d4037" opacity="0.4">
        <circle cx="298" cy="302" r="4" />
        <circle cx="304" cy="296" r="3" />
        <circle cx="292" cy="310" r="3.5" />
      </g>
    `;
  } else if (type === 'cnv') {
    // Choroidal Neovascularization: subretinal gray-green membrane, subretinal fluid, bleed
    pathologyElements = `
      <!-- Choroidal Neovascular Membrane (CNV) -->
      <!-- Subretinal fluid halo (elevation) -->
      <ellipse cx="305" cy="305" rx="48" ry="42" fill="#d7ccc8" opacity="0.35" filter="url(#blurFeather)" />
      <!-- CNV complex membrane (greyish-green fibrovascular net) -->
      <g filter="url(#blurSmall)">
        <path d="M 285 295 Q 300 280 320 290 Q 330 310 315 320 Q 295 325 285 310 Z" fill="#607d8b" opacity="0.8" />
        <!-- Fine neovascular fronds -->
        <path d="M 290 300 Q 305 292 315 305" stroke="#37474f" stroke-width="2" fill="none" />
        <path d="M 295 315 Q 310 312 320 318" stroke="#37474f" stroke-width="1.8" fill="none" />
      </g>
      <!-- Subretinal / intraretinal hemorrhage collar -->
      <g fill="#7f0000" opacity="0.88">
        <path d="M 322 300 Q 336 295 340 312 Q 332 320 324 312 Z" />
        <circle cx="282" cy="302" r="5" />
        <circle cx="290" cy="324" r="4.5" />
      </g>
    `;
  } else if (type === 'co_occurrence') {
    // Co-occurrence: Diabetic Retinopathy + Glaucoma (enlarged cup + hemorrhages + exudates)
    pathologyElements = `
      <!-- Co-occurrence: DR + Glaucoma -->
      <g fill="#800000" opacity="0.88">
        <circle cx="260" cy="250" r="5" />
        <circle cx="340" cy="240" r="5.5" />
        <circle cx="230" cy="320" r="6" />
        <circle cx="350" cy="360" r="5" />
        <circle cx="280" cy="370" r="4.5" />
      </g>
      <g fill="#ffea78" opacity="0.9">
        <circle cx="240" cy="265" r="3" />
        <circle cx="248" cy="275" r="3.5" />
        <circle cx="255" cy="285" r="2.8" />
      </g>
    `;
  }

  // Optic disc details
  const isGlaucoma = type === 'glaucoma' || type === 'co_occurrence';
  // Normal disc: cup radius 18 (CDR ~0.36). Glaucoma disc: cup radius 38 (CDR ~0.82)
  const discOuterRadius = 45;
  const cupRadius = isGlaucoma ? 37 : 17;
  const cupFill = isGlaucoma ? '#fff8e1' : '#ffe0b2';
  const rimStroke = isGlaucoma ? '#b71c1c' : '#d84315';
  const rimStrokeWidth = isGlaucoma ? 1.5 : 5;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <!-- Retinal background gradient -->
    <radialGradient id="fundusGrad" cx="48%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#cf5025" />
      <stop offset="45%" stop-color="#b83818" />
      <stop offset="85%" stop-color="#801c0c" />
      <stop offset="100%" stop-color="#360a04" />
    </radialGradient>

    <!-- Cataract hazy diffuse gradient -->
    <radialGradient id="cataractGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#b07d4b" stop-opacity="0.85" />
      <stop offset="50%" stop-color="#8c582f" stop-opacity="0.88" />
      <stop offset="85%" stop-color="#5a3318" />
      <stop offset="100%" stop-color="#261206" />
    </radialGradient>

    <!-- Optic Disc Gradient -->
    <radialGradient id="discGrad" cx="45%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#fff9c4" />
      <stop offset="60%" stop-color="#ffcc80" />
      <stop offset="100%" stop-color="#ffa726" />
    </radialGradient>

    <!-- Filters -->
    <filter id="blurFeather" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="6" />
    </filter>
    <filter id="blurSmall" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2.5" />
    </filter>
    <filter id="drusenSoft" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="3.5" />
    </filter>
  </defs>

  <!-- Dark viewport mask / aperture -->
  <rect width="600" height="600" fill="#030712" />

  <!-- Main Fundus Globe -->
  <circle cx="300" cy="300" r="280" fill="${bgFill}" />

  <!-- Choroidal texture subtle variation -->
  <g opacity="0.15" stroke="#ffe082" stroke-width="1.2" fill="none">
    <path d="M 120 180 Q 200 160 300 170 T 480 190" />
    <path d="M 100 240 Q 220 220 340 235 T 510 250" />
    <path d="M 90 320 Q 210 330 320 315 T 500 330" />
    <path d="M 110 400 Q 230 420 350 400 T 490 410" />
  </g>

  <!-- Optic Nerve Head (Nasal side in OS, or Temporal in OD; let us place it at x=440, y=300 for left eye / OS) -->
  <g id="optic-disc" transform="translate(440, 300)">
    <!-- Peripapillary halo / beta zone if glaucoma -->
    ${isGlaucoma ? '<ellipse cx="3" cy="2" rx="51" ry="51" fill="#8d6e63" opacity="0.45" filter="url(#blurSmall)" />' : ''}
    
    <!-- Neuroretinal Rim Outer Boundary -->
    <circle cx="0" cy="0" r="${discOuterRadius}" fill="url(#discGrad)" stroke="${rimStroke}" stroke-width="${rimStrokeWidth}" />
    
    <!-- Physiological Cup (Central Depression) -->
    <ellipse cx="${isGlaucoma ? 1 : 2}" cy="0" rx="${cupRadius}" ry="${cupRadius * (isGlaucoma ? 1.08 : 0.96)}" fill="${cupFill}" opacity="0.95" />
    
    <!-- Glaucoma lamina cribrosa pores visibility -->
    ${isGlaucoma ? `
      <g fill="#795548" opacity="0.4">
        <circle cx="-5" cy="-8" r="1.5" />
        <circle cx="6" cy="-6" r="1.4" />
        <circle cx="0" cy="0" r="1.7" />
        <circle cx="-6" cy="10" r="1.5" />
        <circle cx="8" cy="8" r="1.4" />
      </g>
    ` : ''}
  </g>

  <!-- Retinal Vascular Arcades (Superior & Inferior Arterioles and Venules) -->
  <!-- Veins (darker crimson, wider) and Arteries (bright scarlet, narrower) -->
  <g id="retinal-vessels" opacity="${isCataract ? 0.35 : 0.95}">
    <!-- Superior Temporal Arcade -->
    <path d="M 440 295 C 410 260 380 180 300 170 C 230 160 170 190 140 220" stroke="#7f0000" stroke-width="4.8" fill="none" stroke-linecap="round" />
    <path d="M 440 295 C 412 258 382 178 300 168 C 228 158 168 188 138 218" stroke="#d50000" stroke-width="2.6" fill="none" stroke-linecap="round" />

    <!-- Inferior Temporal Arcade -->
    <path d="M 440 305 C 415 350 375 425 295 435 C 225 445 165 410 135 375" stroke="#7f0000" stroke-width="4.8" fill="none" stroke-linecap="round" />
    <path d="M 440 305 C 417 352 377 427 295 437 C 223 447 163 412 133 377" stroke="#d50000" stroke-width="2.6" fill="none" stroke-linecap="round" />

    <!-- Superior Nasal Vessels -->
    <path d="M 445 285 C 460 230 480 190 515 160" stroke="#800000" stroke-width="3.5" fill="none" stroke-linecap="round" />
    <path d="M 445 285 C 460 230 480 190 515 160" stroke="#e53935" stroke-width="1.8" fill="none" stroke-linecap="round" />

    <!-- Inferior Nasal Vessels -->
    <path d="M 445 315 C 465 370 485 415 520 440" stroke="#800000" stroke-width="3.5" fill="none" stroke-linecap="round" />
    <path d="M 445 315 C 465 370 485 415 520 440" stroke="#e53935" stroke-width="1.8" fill="none" stroke-linecap="round" />

    <!-- Fine Macular Branchlets curling toward FAZ -->
    <path d="M 330 200 Q 300 240 280 270" stroke="#b71c1c" stroke-width="1.4" fill="none" />
    <path d="M 320 405 Q 295 365 278 335" stroke="#b71c1c" stroke-width="1.4" fill="none" />
  </g>

  <!-- Macula Lutea & Fovea Centralis (located at approx x=300, y=300) -->
  <g id="macula">
    <!-- Macular yellow pigment / luteal zone -->
    <circle cx="300" cy="300" r="42" fill="#ffb300" opacity="${type === 'amd' || type === 'cnv' ? 0.08 : 0.16}" filter="url(#blurFeather)" />
    <!-- Foveal Avascular Zone (FAZ) darker center -->
    <circle cx="300" cy="300" r="16" fill="#4a1505" opacity="0.45" />
    <!-- Sharp foveolar central light reflex (lost in edema/AMD/CNV) -->
    ${type === 'healthy' || type === 'glaucoma' || type === 'cataract' ? '<circle cx="300" cy="300" r="1.8" fill="#ffffff" opacity="0.8" />' : ''}
  </g>

  <!-- Pathology specific elements inserted here -->
  ${pathologyElements}

  <!-- Cataract lens opacity haze overlay across the entire optic aperture -->
  ${isCataract ? `
    <circle cx="300" cy="300" r="280" fill="#d7a15c" opacity="0.52" filter="url(#blurFeather)" />
    <circle cx="300" cy="300" r="280" fill="#ffecb3" opacity="0.25" />
    <!-- Diffuse cortical lens spokes / opacity fibers -->
    <g stroke="#ffffff" stroke-width="8" opacity="0.2" filter="url(#blurSmall)">
      <line x1="300" y1="300" x2="160" y2="160" />
      <line x1="300" y1="300" x2="440" y2="160" />
      <line x1="300" y1="300" x2="180" y2="420" />
      <line x1="300" y1="300" x2="420" y2="440" />
    </g>
  ` : ''}

  <!-- Circular Aperture Edge Vignette -->
  <circle cx="300" cy="300" r="280" fill="none" stroke="#000000" stroke-width="12" opacity="0.75" />
</svg>`;
}

export const SAMPLE_SCANS: SampleScan[] = [
  {
    id: 'sample-healthy',
    title: 'Normal Retinal Fundus (Healthy)',
    categoryTag: 'healthy',
    categoryLabel: 'Healthy / No Pathology',
    eye: 'OS',
    modality: 'CFP',
    description: 'Physiological optic disc with crisp margins, cup-to-disc ratio 0.36, distinct foveal light reflex, patent retinal vascular arcades without microaneurysms or drusen.',
    clinicalFindings: 'Intact neuroretinal rim obeying the ISNT rule. Absence of hemorrhages, lipid exudates, or media opacity.',
    dataUrl: encodeSvg(createFundusSvg('healthy')),
    expectedConfidence: 96.4,
    biomarkers: {
      cupToDiscRatio: 0.36,
      mediaClarityScore: 95,
      macularDrusenBurden: 'None',
      subretinalFluidDetected: false,
      hemorrhageCountEstimate: 0,
    },
    sampleCategories: [
      { id: 'healthy', name: 'Healthy', confidence: 96.4, status: 'Normal', stage: 'No Pathology Detected', icd10: 'Z01.00', findings: ['Normal CDR (0.36)', 'Sharp foveal reflex', 'Healthy retinal arcades'] },
      { id: 'diabetic_retinopathy', name: 'Diabetic Retinopathy', confidence: 2.1, status: 'Excluded', stage: 'No Apparent DR', icd10: 'E11.319', findings: ['No microaneurysms', 'No hemorrhages'] },
      { id: 'glaucoma', name: 'Glaucoma', confidence: 3.8, status: 'Excluded', stage: 'Low Risk', icd10: 'H40.10X0', findings: ['Healthy optic nerve head', 'Normal CDR'] },
      { id: 'cataract', name: 'Cataract', confidence: 1.5, status: 'Excluded', stage: 'Clear Optical Media', icd10: 'H26.9', findings: ['High media clarity (95%)', 'No obscuration'] },
      { id: 'amd', name: 'AMD', confidence: 2.8, status: 'Excluded', stage: 'No Maculopathy', icd10: 'H35.30', findings: ['Macula free of drusen', 'Intact RPE'] },
      { id: 'cnv', name: 'CNV', confidence: 0.8, status: 'Excluded', stage: 'No Active Membrane', icd10: 'H35.32', findings: ['No subretinal fluid', 'No choroidal neovascularization'] },
    ],
  },
  {
    id: 'sample-dr',
    title: 'Diabetic Retinopathy (Moderate NPDR)',
    categoryTag: 'diabetic_retinopathy',
    categoryLabel: 'Diabetic Retinopathy',
    eye: 'OS',
    modality: 'CFP',
    description: 'Multiple discrete dot-and-blot intraretinal hemorrhages, microaneurysms, and circinate clusters of yellowish hard lipid exudates encroaching toward the posterior pole.',
    clinicalFindings: 'Non-proliferative diabetic retinopathy (NPDR) with macular threat. Microvascular leakage and localized retinal ischemia.',
    dataUrl: encodeSvg(createFundusSvg('dr')),
    expectedConfidence: 94.2,
    biomarkers: {
      cupToDiscRatio: 0.38,
      mediaClarityScore: 88,
      macularDrusenBurden: 'None',
      subretinalFluidDetected: false,
      hemorrhageCountEstimate: 14,
    },
    sampleCategories: [
      { id: 'diabetic_retinopathy', name: 'Diabetic Retinopathy', confidence: 94.2, status: 'Detected', stage: 'Moderate NPDR', icd10: 'E11.339', findings: ['14+ dot-and-blot hemorrhages', 'Hard lipid exudate rings', 'Cotton-wool ischemic infarcts'] },
      { id: 'healthy', name: 'Healthy', confidence: 3.5, status: 'Excluded', stage: 'Pathology Present', icd10: 'Z01.00', findings: ['Abnormal vascular signs'] },
      { id: 'glaucoma', name: 'Glaucoma', confidence: 5.2, status: 'Excluded', stage: 'Low Risk', icd10: 'H40.10X0', findings: ['CDR 0.38 within normal limits'] },
      { id: 'cataract', name: 'Cataract', confidence: 4.1, status: 'Excluded', stage: 'Minimal Nuclear Sclerosis', icd10: 'H26.9', findings: ['Slight media attenuation'] },
      { id: 'amd', name: 'AMD', confidence: 6.9, status: 'Excluded', stage: 'No Primary Drusen', icd10: 'H35.30', findings: ['Exudates are lipid, not soft drusen'] },
      { id: 'cnv', name: 'CNV', confidence: 2.4, status: 'Excluded', stage: 'No Choroidal Membrane', icd10: 'H35.32', findings: ['No subretinal fluid detected'] },
    ],
  },
  {
    id: 'sample-glaucoma',
    title: 'Advanced Glaucomatous Optic Neuropathy',
    categoryTag: 'glaucoma',
    categoryLabel: 'Glaucoma',
    eye: 'OS',
    modality: 'CFP',
    description: 'Markedly enlarged vertical cup-to-disc ratio (CDR 0.82), pronounced thinning of the superior and inferior neuroretinal rim, vessel bayoneting at disc margin, peripapillary beta-zone atrophy.',
    clinicalFindings: 'Glaucomatous excavation and retinal nerve fiber layer (RNFL) loss. High risk of visual field scotoma.',
    dataUrl: encodeSvg(createFundusSvg('glaucoma')),
    expectedConfidence: 95.8,
    biomarkers: {
      cupToDiscRatio: 0.82,
      mediaClarityScore: 91,
      macularDrusenBurden: 'None',
      subretinalFluidDetected: false,
      hemorrhageCountEstimate: 0,
    },
    sampleCategories: [
      { id: 'glaucoma', name: 'Glaucoma', confidence: 95.8, status: 'Detected', stage: 'Advanced Optic Neuropathy', icd10: 'H40.113', findings: ['Severe cupping (CDR 0.82)', 'Vessel bayoneting', 'Inferior rim thinning'] },
      { id: 'healthy', name: 'Healthy', confidence: 2.1, status: 'Excluded', stage: 'Abnormal Optic Nerve', icd10: 'Z01.00', findings: ['Severe rim loss'] },
      { id: 'diabetic_retinopathy', name: 'Diabetic Retinopathy', confidence: 4.0, status: 'Excluded', stage: 'No Apparent DR', icd10: 'E11.319', findings: ['No microaneurysms'] },
      { id: 'cataract', name: 'Cataract', confidence: 3.4, status: 'Excluded', stage: 'Clear Lens', icd10: 'H26.9', findings: ['Sharp disc boundary visible'] },
      { id: 'amd', name: 'AMD', confidence: 3.1, status: 'Excluded', stage: 'Normal Macula', icd10: 'H35.30', findings: ['Fovea undisturbed'] },
      { id: 'cnv', name: 'CNV', confidence: 1.2, status: 'Excluded', stage: 'No Neovascularization', icd10: 'H35.32', findings: ['Dry retina'] },
    ],
  },
  {
    id: 'sample-cataract',
    title: 'Cataract (Diffuse Optical Media Opacity)',
    categoryTag: 'cataract',
    categoryLabel: 'Cataract',
    eye: 'OS',
    modality: 'CFP',
    description: 'Diffuse yellowish-brown haze with significant loss of retinal detail, blurred vessel bifurcations, and reduced contrast due to advanced nuclear cataract.',
    clinicalFindings: 'Significant media obscuration interfering with posterior pole visualization. Pre-operative cataract evaluation indicated.',
    dataUrl: encodeSvg(createFundusSvg('cataract')),
    expectedConfidence: 93.7,
    biomarkers: {
      cupToDiscRatio: 0.40,
      mediaClarityScore: 42,
      macularDrusenBurden: 'None',
      subretinalFluidDetected: false,
      hemorrhageCountEstimate: 0,
    },
    sampleCategories: [
      { id: 'cataract', name: 'Cataract', confidence: 93.7, status: 'Detected', stage: 'Grade 3 Nuclear/Cortical', icd10: 'H25.13', findings: ['Severe media haze (Clarity 42%)', 'Loss of peripheral vessel resolution', 'Diffuse chromatic shift'] },
      { id: 'healthy', name: 'Healthy', confidence: 8.2, status: 'Excluded', stage: 'Optical Media Compromised', icd10: 'Z01.00', findings: ['Unable to confirm normal fundus'] },
      { id: 'diabetic_retinopathy', name: 'Diabetic Retinopathy', confidence: 12.5, status: 'Suspected', stage: 'Indeterminate due to haze', icd10: 'E11.319', findings: ['Obscured fine vasculature'] },
      { id: 'glaucoma', name: 'Glaucoma', confidence: 14.1, status: 'Suspected', stage: 'Evaluation Limited', icd10: 'H40.10X0', findings: ['Optic disc borders hazy'] },
      { id: 'amd', name: 'AMD', confidence: 11.2, status: 'Suspected', stage: 'Macula Obscured', icd10: 'H35.30', findings: ['Foveal reflex attenuated'] },
      { id: 'cnv', name: 'CNV', confidence: 4.0, status: 'Excluded', stage: 'No Gross Hemorrhage', icd10: 'H35.32', findings: ['No elevated grey membrane'] },
    ],
  },
  {
    id: 'sample-amd',
    title: 'Age-Related Macular Degeneration (Dry/Intermediate AMD)',
    categoryTag: 'amd',
    categoryLabel: 'AMD',
    eye: 'OS',
    modality: 'CFP',
    description: 'Extensive confluence of large soft drusen centered within the 1500um macular perimeter, accompanied by localized retinal pigment epithelium (RPE) hyperplasia and depigmentation.',
    clinicalFindings: 'Intermediate dry age-related macular degeneration. High risk for progression to geographic atrophy or choroidal neovascularization.',
    dataUrl: encodeSvg(createFundusSvg('amd')),
    expectedConfidence: 96.1,
    biomarkers: {
      cupToDiscRatio: 0.35,
      mediaClarityScore: 92,
      macularDrusenBurden: 'High',
      subretinalFluidDetected: false,
      hemorrhageCountEstimate: 0,
    },
    sampleCategories: [
      { id: 'amd', name: 'AMD', confidence: 96.1, status: 'Detected', stage: 'Intermediate Dry AMD (AREDS Cat 3)', icd10: 'H35.31', findings: ['Confluent soft macular drusen (>125um)', 'RPE pigmentary mottling', 'Intact neurosensory retina'] },
      { id: 'healthy', name: 'Healthy', confidence: 2.4, status: 'Excluded', stage: 'Maculopathy Present', icd10: 'Z01.00', findings: ['Central macular degradation'] },
      { id: 'cnv', name: 'CNV', confidence: 18.5, status: 'Suspected', stage: 'Early Subclinical Neovascularization Risk', icd10: 'H35.32', findings: ['No active fluid leak, but high risk transition'] },
      { id: 'diabetic_retinopathy', name: 'Diabetic Retinopathy', confidence: 5.3, status: 'Excluded', stage: 'No DR Signs', icd10: 'E11.319', findings: ['Lesions are drusen, not diabetic exudates'] },
      { id: 'glaucoma', name: 'Glaucoma', confidence: 4.1, status: 'Excluded', stage: 'Normal Optic Disc', icd10: 'H40.10X0', findings: ['CDR 0.35'] },
      { id: 'cataract', name: 'Cataract', confidence: 3.0, status: 'Excluded', stage: 'Clear Lens', icd10: 'H26.9', findings: ['High clarity (92%)'] },
    ],
  },
  {
    id: 'sample-cnv',
    title: 'Choroidal Neovascularization (Wet AMD / CNV Membrane)',
    categoryTag: 'cnv',
    categoryLabel: 'CNV',
    eye: 'OS',
    modality: 'CFP',
    description: 'Elevated grayish-green subretinal fibrovascular membrane adjacent to the foveal avascular zone, encircled by an active subretinal fluid cuff and submacular petechial hemorrhage.',
    clinicalFindings: 'Active type 2 choroidal neovascularization (CNV). Emergent indication for anti-VEGF intravitreal injection therapy.',
    dataUrl: encodeSvg(createFundusSvg('cnv')),
    expectedConfidence: 97.5,
    biomarkers: {
      cupToDiscRatio: 0.37,
      mediaClarityScore: 89,
      macularDrusenBurden: 'Moderate',
      subretinalFluidDetected: true,
      hemorrhageCountEstimate: 3,
    },
    sampleCategories: [
      { id: 'cnv', name: 'CNV', confidence: 97.5, status: 'Detected', stage: 'Active Subfoveal CNV Membrane', icd10: 'H35.32', findings: ['Grayish-green subretinal membrane', 'Subretinal fluid halo', 'Marginal subretinal hemorrhage'] },
      { id: 'amd', name: 'AMD', confidence: 91.2, status: 'Detected', stage: 'Neovascular / Wet AMD', icd10: 'H35.32', findings: ['Underlying drusen and RPE disruption'] },
      { id: 'healthy', name: 'Healthy', confidence: 1.1, status: 'Excluded', stage: 'Severe Sight Threat', icd10: 'Z01.00', findings: ['Acute macular lesion'] },
      { id: 'diabetic_retinopathy', name: 'Diabetic Retinopathy', confidence: 14.8, status: 'Excluded', stage: 'Hemorrhage is Subretinal/CNV', icd10: 'E11.319', findings: ['No peripheral microaneurysms'] },
      { id: 'glaucoma', name: 'Glaucoma', confidence: 3.6, status: 'Excluded', stage: 'Normal Optic Nerve', icd10: 'H40.10X0', findings: ['CDR 0.37'] },
      { id: 'cataract', name: 'Cataract', confidence: 2.9, status: 'Excluded', stage: 'Minimal Sclerosis', icd10: 'H26.9', findings: ['Good fundus visibility'] },
    ],
  },
  {
    id: 'sample-co-occurrence',
    title: 'Dual Pathology: Glaucoma + Diabetic Retinopathy',
    categoryTag: 'co_occurrence',
    categoryLabel: 'Multi-Pathology Co-occurrence',
    eye: 'OS',
    modality: 'CFP',
    description: 'Concurrently demonstrates advanced glaucomatous cupping (CDR 0.80) with intraretinal dot hemorrhages and lipid exudate rings from diabetic microvascular disease.',
    clinicalFindings: 'Multi-factorial ocular morbidity requiring dual management: IOP lowering therapy alongside glycemic/retinal microvascular intervention.',
    dataUrl: encodeSvg(createFundusSvg('co_occurrence')),
    expectedConfidence: 94.0,
    biomarkers: {
      cupToDiscRatio: 0.80,
      mediaClarityScore: 87,
      macularDrusenBurden: 'None',
      subretinalFluidDetected: false,
      hemorrhageCountEstimate: 8,
    },
    sampleCategories: [
      { id: 'glaucoma', name: 'Glaucoma', confidence: 94.0, status: 'Detected', stage: 'Glaucomatous Cupping', icd10: 'H40.11', findings: ['CDR 0.80', 'Neuroretinal rim notch', 'Loss of ISNT pattern'] },
      { id: 'diabetic_retinopathy', name: 'Diabetic Retinopathy', confidence: 89.4, status: 'Detected', stage: 'Moderate NPDR', icd10: 'E11.339', findings: ['8+ dot hemorrhages', 'Hard exudate cluster'] },
      { id: 'healthy', name: 'Healthy', confidence: 1.8, status: 'Excluded', stage: 'Dual Pathology', icd10: 'Z01.00', findings: ['Multiple disease markers'] },
      { id: 'cataract', name: 'Cataract', confidence: 6.2, status: 'Excluded', stage: 'Early Nuclear Coloration', icd10: 'H26.9', findings: ['Moderate media clarity'] },
      { id: 'amd', name: 'AMD', confidence: 5.0, status: 'Excluded', stage: 'No Soft Drusen', icd10: 'H35.30', findings: ['No primary drusen'] },
      { id: 'cnv', name: 'CNV', confidence: 2.1, status: 'Excluded', stage: 'No Neovascularization', icd10: 'H35.32', findings: ['No subretinal membrane'] },
    ],
  },
];
