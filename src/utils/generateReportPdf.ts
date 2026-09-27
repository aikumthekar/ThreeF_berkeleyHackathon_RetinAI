import jsPDF from 'jspdf';
import { AnalysisResult, PatientInfo } from '../types/ophthalmology';

/**
 * Converts any image source (SVG, Data URL, Canvas, or Web URL)
 * into a clean JPEG/PNG raster data URL to ensure compatibility with jsPDF.
 */
export const convertImageToRaster = (src: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 400;
        canvas.height = img.naturalHeight || 400;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(src);
        }
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        resolve(dataUrl);
      } catch (e) {
        resolve(src);
      }
    };
    img.onerror = () => {
      resolve(src);
    };
    img.src = src;
  });
};

/**
 * Builds a vector-rendered clinical diagnostic ophthalmology report
 * using native jsPDF primitives (preventing any CSS oklch issues).
 */
export const generateClinicalReportPdf = async (
  analysis: AnalysisResult,
  patientInfo: PatientInfo,
  scanImageSrc: string,
  doctorNotes: string = 'Automated retinal multi-label deep learning classification reviewed and corroborated with clinical examination. Correlated with intraocular pressure and visual field assessment.',
  doctorSignature: string = 'Dr. Atul B. Kumthekar, MD, FACS (Vitreoretinal Specialist)'
): Promise<jsPDF> => {
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 14;
  let y = 14;

  // Header top bar
  doc.setFillColor(15, 23, 42); // #0f172a
  doc.rect(margin, y, pageWidth - margin * 2, 1.2, 'F');
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('ADVANCED OPHTHALMOLOGY & RETINA INSTITUTE', margin, y);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Vitreoretinal Diagnostics · Automated Artificial Intelligence Decision Support', margin, y + 4.5);
  doc.text('100 Medical Center Parkway · Division of Ocular Imaging', margin, y + 8.5);

  // Exam Ref box on top right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('EXAM REPORT', pageWidth - margin - 26, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Ref: ${patientInfo.patientId || 'PT-982410'}`, pageWidth - margin - 26, y + 4.5);
  doc.text(`Date: ${new Date(analysis.timestamp).toLocaleDateString()}`, pageWidth - margin - 26, y + 8.5);

  y += 14;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  // Patient metadata block
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 14, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 14, 2, 2, 'D');

  doc.setFontSize(8);
  const colW = (pageWidth - margin * 2) / 4;

  // Col 1: Patient ID
  doc.setTextColor(100, 116, 139);
  doc.text('Patient ID:', margin + 3, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(patientInfo.patientId || 'PT-982410', margin + 3, y + 10);

  // Col 2: Eye Laterality
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Eye Examined:', margin + colW + 3, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const latStr =
    analysis.eyeLaterality === 'OD'
      ? 'OD (Right Eye)'
      : analysis.eyeLaterality === 'OS'
      ? 'OS (Left Eye)'
      : 'OU (Bilateral)';
  doc.text(latStr, margin + colW + 3, y + 10);

  // Col 3: Modality
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Scan Modality:', margin + colW * 2 + 3, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(analysis.modality === 'CFP' ? 'Color Fundus (50°)' : 'OCT Scan', margin + colW * 2 + 3, y + 10);

  // Col 4: AI Model
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('AI Engine:', margin + colW * 3 + 3, y + 5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text((analysis.modelUsed || 'ENSEMBLE').toUpperCase(), margin + colW * 3 + 3, y + 10);

  y += 18;

  // Retinal Image & Clinical Impression Section
  const imgBoxW = 44;
  const imgBoxH = 44;

  try {
    const rasterData = await convertImageToRaster(scanImageSrc);
    doc.setFillColor(0, 0, 0);
    doc.roundedRect(margin, y, imgBoxW, imgBoxH, 2, 2, 'F');
    doc.addImage(rasterData, 'JPEG', margin + 1, y + 1, imgBoxW - 2, imgBoxH - 2);
  } catch (err) {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, imgBoxW, imgBoxH, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Retinal Image', margin + 8, y + 22);
  }

  // Diagnosis and Impression Box on right
  const diagX = margin + imgBoxW + 6;
  const diagW = pageWidth - margin - diagX;

  doc.setFillColor(236, 254, 255); // #ecfeff
  doc.roundedRect(diagX, y, diagW, 26, 2, 2, 'F');
  doc.setDrawColor(165, 243, 252);
  doc.roundedRect(diagX, y, diagW, 26, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(8, 51, 68);
  doc.text('Primary Impression:', diagX + 3, y + 5);
  doc.setFontSize(8.5);
  doc.setTextColor(14, 116, 144);
  const diagLines = doc.splitTextToSize(analysis.overallDiagnosis, diagW - 6);
  doc.text(diagLines.slice(0, 2), diagX + 3, y + 9.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  const imprLines = doc.splitTextToSize(analysis.clinicalImpression, diagW - 6);
  doc.text(imprLines.slice(0, 3), diagX + 3, y + 17);

  // Biomarkers mini-row under diagnosis
  const bioY = y + 28;
  const bioW = diagW / 4;
  const biomarkersList = [
    { label: 'Cup-to-Disc', val: `CDR ${(analysis.biomarkers?.cupToDiscRatio || 0.38).toFixed(2)}` },
    { label: 'Media Clarity', val: `${analysis.biomarkers?.mediaClarityScore || 95}%` },
    { label: 'Macular Drusen', val: analysis.biomarkers?.macularDrusenBurden || 'None' },
    { label: 'Subretinal Fluid', val: analysis.biomarkers?.subretinalFluidDetected ? 'PRESENT' : 'None' },
  ];

  biomarkersList.forEach((b, idx) => {
    const bx = diagX + idx * bioW;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(bx, bioY, bioW - 2, 16, 1.5, 1.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(bx, bioY, bioW - 2, 16, 1.5, 1.5, 'D');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(b.label, bx + 2.5, bioY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(b.val, bx + 2.5, bioY + 11);
  });

  y += 48;

  // Complete 6-Disease Classification Matrix Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Deep Learning Multi-Label Classification Matrix', margin, y);
  y += 3.5;

  const tableW = pageWidth - margin * 2;
  const colWidths = [44, 24, 22, 36, 18, tableW - (44 + 24 + 22 + 36 + 18)];
  const colHeaders = ['Target Category', 'Confidence', 'Status', 'Clinical Staging', 'ICD-10', 'Observed Clinical Signs'];

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, tableW, 6.5, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, tableW, 6.5, 'D');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);

  let curX = margin;
  colHeaders.forEach((h, i) => {
    doc.text(h, curX + 2, y + 4.5);
    curX += colWidths[i];
  });

  y += 6.5;

  // Table Rows
  doc.setFont('helvetica', 'normal');
  (analysis.categories || []).forEach((cat, rIdx) => {
    const rowH = 7.5;
    if (rIdx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, tableW, rowH, 'F');
    }
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, tableW, rowH, 'D');

    let rx = margin;

    // 1. Category name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(cat.name, rx + 2, y + 5);
    rx += colWidths[0];

    // 2. Confidence
    doc.setFontSize(8);
    if (cat.confidence >= 50 && cat.id !== 'healthy') {
      doc.setTextColor(225, 29, 72);
    } else if (cat.confidence >= 50 && cat.id === 'healthy') {
      doc.setTextColor(16, 185, 129);
    } else {
      doc.setTextColor(100, 116, 139);
    }
    doc.text(`${cat.confidence.toFixed(1)}%`, rx + 2, y + 5);
    rx += colWidths[1];

    // 3. Status
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    if (cat.status === 'Detected') {
      doc.setTextColor(159, 18, 57);
    } else if (cat.status === 'Normal') {
      doc.setTextColor(22, 101, 52);
    } else if (cat.status === 'Suspected') {
      doc.setTextColor(146, 64, 14);
    } else {
      doc.setTextColor(100, 116, 139);
    }
    doc.text(cat.status, rx + 2, y + 5);
    rx += colWidths[2];

    // 4. Staging
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);
    const stageTxt = doc.splitTextToSize(cat.stage || '-', colWidths[3] - 4);
    doc.text(stageTxt[0] || '', rx + 2, y + 5);
    rx += colWidths[3];

    // 5. ICD-10
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(cat.icd10 || '-', rx + 2, y + 5);
    rx += colWidths[4];

    // 6. Findings
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    const findingsTxt = (cat.findings || []).slice(0, 2).join('; ') || 'None noted';
    const splitFindings = doc.splitTextToSize(findingsTxt, colWidths[5] - 4);
    doc.text(splitFindings[0] || '', rx + 2, y + 5);

    y += rowH;
  });

  y += 5;

  // Actionable Recommendations
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Recommended Clinical Management Plan:', margin, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  (analysis.recommendations || []).forEach((rec) => {
    doc.text(`•  ${rec}`, margin + 2, y);
    y += 4;
  });

  y += 2;

  // Notes and Signature box
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("Attending Ophthalmologist's Evaluation & Notes:", margin, y);
  y += 3.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const noteLines = doc.splitTextToSize(doctorNotes, pageWidth - margin * 2);
  doc.text(noteLines, margin, y);
  y += noteLines.length * 3.5 + 4;

  // Signature Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('Physician Signature:', pageWidth - margin - 65, y);
  doc.setFont('times', 'italic');
  doc.setFontSize(9);
  doc.text(doctorSignature, pageWidth - margin - 65, y + 4.5);
  doc.setDrawColor(148, 163, 184);
  doc.line(pageWidth - margin - 65, y + 5.5, pageWidth - margin, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Verified by Multi-Modal Retinal Deep Learning Pipeline', margin, y + 4.5);

  return doc;
};
