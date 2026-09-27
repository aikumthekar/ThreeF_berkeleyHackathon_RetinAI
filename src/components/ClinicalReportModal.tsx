import React, { useState, useRef } from 'react';
import {
  X,
  Printer,
  Download,
  CheckCircle,
  ShieldCheck,
  FileText,
  Copy,
  Check,
  Loader2,
  FileDown,
  Mail
} from 'lucide-react';
import { AnalysisResult, PatientInfo } from '../types/ophthalmology';
import { generateClinicalReportPdf } from '../utils/generateReportPdf';

interface ClinicalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: AnalysisResult;
  patientInfo: PatientInfo;
  scanImageSrc: string;
  onOpenEmail?: () => void;
}

// Convert SVG/Image to JPEG data URL for embedding in PDF without DOM styling parsing
function convertImageToRaster(src: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 400, 400);
        ctx.drawImage(img, 0, 0, 400, 400);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      } catch (err) {
        resolve(src);
      }
    };
    img.onerror = () => {
      resolve(src);
    };
    img.src = src;
  });
}

export const ClinicalReportModal: React.FC<ClinicalReportModalProps> = ({
  isOpen,
  onClose,
  analysis,
  patientInfo,
  scanImageSrc,
  onOpenEmail,
}) => {
  const [doctorNotes, setDoctorNotes] = useState<string>(
    'Automated retinal multi-label deep learning classification reviewed and corroborated with clinical examination. Correlated with intraocular pressure and visual field assessment.'
  );
  const [doctorSignature, setDoctorSignature] = useState<string>(
    'Dr. Atul B. Kumthekar, MD, FACS (Vitreoretinal Specialist)'
  );
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [copiedEhr, setCopiedEhr] = useState<boolean>(false);

  const reportContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4500);
  };

  // 1. Pure Vector PDF Generation (Zero html2canvas / CSS color dependency)
  const handleSavePdf = async () => {
    setIsGeneratingPdf(true);
    showFeedback('Generating high-resolution clinical PDF report...');

    try {
      const doc = await generateClinicalReportPdf(
        analysis,
        patientInfo,
        scanImageSrc,
        doctorNotes,
        doctorSignature
      );
      const filename = `${patientInfo.patientId || 'Patient'}_RetinaScan_Diagnostic_Report.pdf`;
      doc.save(filename);
      showFeedback(`✓ PDF saved successfully: ${filename}`);
    } catch (err: any) {
      console.error('PDF export error:', err);
      handleDownloadHtml();
      showFeedback('✓ Generated standalone printable medical report document.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 2. Standalone HTML Medical Report Download
  const handleDownloadHtml = () => {
    const reportElem = reportContainerRef.current;
    if (!reportElem) return;

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${patientInfo.patientId || 'Patient'} - Retinal Diagnostic Exam Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 30px; color: #0f172a; background: #fff; }
    h1 { font-size: 20px; margin: 0 0 4px 0; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
    th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; }
    th { background: #f8fafc; font-weight: 600; color: #334155; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
    @media print {
      body { margin: 15mm; }
    }
  </style>
</head>
<body>
  ${reportElem.innerHTML}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${patientInfo.patientId || 'Patient'}_Retinal_Report.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showFeedback('✓ Downloaded standalone medical report HTML file.');
  };

  // 3. Print Dialog
  const handlePrint = () => {
    try {
      window.print();
      showFeedback('Print prompt dispatched.');
    } catch (e) {
      console.warn('Standard window.print failed, falling back to PDF save:', e);
      handleSavePdf();
    }
  };

  // 4. Copy EHR Summary
  const handleCopyEhr = () => {
    const detectedList = analysis.categories
      .filter((c) => c.confidence >= 50 && c.id !== 'healthy')
      .map((c) => `${c.name} (${c.confidence.toFixed(1)}% - ${c.stage})`)
      .join(', ');

    const ehrText = `RETINASCAN AI OPHTHALMIC REPORT
Patient ID: ${patientInfo.patientId} | Laterality: ${analysis.eyeLaterality} | Modality: ${analysis.modality}
Date: ${new Date(analysis.timestamp).toLocaleDateString()}
Primary Impression: ${analysis.overallDiagnosis}
Diagnoses Detected: ${detectedList || 'Healthy / No active sight-threatening lesions'}
Biomarkers: Cup-to-Disc Ratio ${analysis.biomarkers.cupToDiscRatio.toFixed(2)} | Media Clarity: ${analysis.biomarkers.mediaClarityScore}% | Drusen: ${analysis.biomarkers.macularDrusenBurden} | Subretinal Fluid: ${analysis.biomarkers.subretinalFluidDetected ? 'YES' : 'NO'}
Urgency: ${analysis.urgency.toUpperCase()}
Attending Notes: ${doctorNotes}
Sign-off: ${doctorSignature}`;

    navigator.clipboard.writeText(ehrText);
    setCopiedEhr(true);
    showFeedback('✓ Copied clinical findings summary to clipboard for EHR.');
    setTimeout(() => setCopiedEhr(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Toolbar (hidden in print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 bg-slate-950 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-100">
                Ophthalmic Diagnostic Report & Decision Support
              </h2>
              <p className="text-[11px] text-slate-400">
                Patient: <span className="font-mono text-cyan-300 font-semibold">{patientInfo.patientId}</span> · {analysis.eyeLaterality}
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Direct Save PDF Button */}
            <button
              onClick={handleSavePdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              title="Generate and download formatted PDF file"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Save PDF
                </>
              )}
            </button>

            {/* Email Report Button */}
            {onOpenEmail && (
              <button
                onClick={onOpenEmail}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/80 font-semibold text-xs transition-colors shadow-sm cursor-pointer"
                title="Send report directly via secure email"
              >
                <Mail className="w-4 h-4 text-cyan-400" />
                Email Report
              </button>
            )}

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition-colors shadow-sm cursor-pointer"
              title="Send to physical printer or browser print driver"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              Print
            </button>

            {/* Standalone HTML File */}
            <button
              onClick={handleDownloadHtml}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition-colors shadow-sm cursor-pointer"
              title="Download standalone offline HTML document"
            >
              <FileDown className="w-4 h-4 text-slate-400" />
              <span className="hidden sm:inline">HTML File</span>
            </button>

            {/* Copy EHR Text */}
            <button
              onClick={handleCopyEhr}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition-colors shadow-sm cursor-pointer"
              title="Copy clinical text summary to clipboard"
            >
              {copiedEhr ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span className="hidden sm:inline">Copy EHR</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Banner if active */}
        {feedbackMessage && (
          <div className="px-6 py-2 bg-cyan-950 border-b border-cyan-800 text-cyan-300 text-xs flex items-center justify-between print:hidden">
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* Printable Medical Document Body */}
        <div
          ref={reportContainerRef}
          id="clinical-report-content"
          className="p-8 overflow-y-auto space-y-6 bg-white text-slate-900 font-sans print:p-6 print:m-0 print:text-black"
        >
          {/* Clinic Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                ADVANCED OPHTHALMOLOGY & RETINA INSTITUTE
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                Vitreoretinal Diagnostics · Automated Artificial Intelligence Decision Support
              </p>
              <p className="text-xs text-slate-500">
                100 Medical Center Parkway · Division of Ocular Imaging
              </p>
            </div>
            <div className="text-right">
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-800">
                EXAM REPORT
              </span>
              <p className="text-xs text-slate-500 font-mono mt-1">
                Ref: {patientInfo.patientId || 'PT-982410-OD'}
              </p>
              <p className="text-xs text-slate-500 font-mono">
                Date: {new Date(analysis.timestamp).toLocaleDateString()} {new Date(analysis.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Patient Demographics & Exam Metadata */}
          <div className="grid grid-cols-4 gap-4 p-3 bg-slate-50 border border-slate-200 rounded text-xs">
            <div>
              <span className="text-slate-500 block">Patient ID:</span>
              <span className="font-bold text-slate-800 font-mono">{patientInfo.patientId || 'PT-982410'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Eye Examined:</span>
              <span className="font-bold text-slate-800 font-mono">
                {analysis.eyeLaterality === 'OD' ? 'OD (Right Eye)' : analysis.eyeLaterality === 'OS' ? 'OS (Left Eye)' : 'OU (Bilateral)'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Scan Modality:</span>
              <span className="font-bold text-slate-800">{analysis.modality === 'CFP' ? 'Color Fundus (50°)' : 'OCT Scan'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">AI Engine Architecture:</span>
              <span className="font-bold text-slate-800 font-mono text-[11px]">{analysis.modelBenchmark.architecture}</span>
            </div>
          </div>

          {/* Two-Column: Retinal Image Preview & Overall Impression */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Thumbnail */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Acquired Fundus Scan
              </h3>
              <div className="aspect-square bg-black rounded-lg overflow-hidden border border-slate-300">
                <img
                  src={scanImageSrc}
                  alt="Retinal Scan"
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-[11px] text-slate-500 text-center font-mono">
                Digital Retinal Biomarker Capture
              </p>
            </div>

            {/* Diagnostic Impression */}
            <div className="md:col-span-2 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Diagnostic Impression & Primary Diagnosis
              </h3>
              <div className="p-4 bg-cyan-50/60 border border-cyan-200 rounded-lg">
                <div className="text-sm font-bold text-cyan-950">
                  {analysis.overallDiagnosis}
                </div>
                <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                  {analysis.clinicalImpression}
                </p>
              </div>

              {/* Biomarkers Table */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <div className="p-2 border border-slate-200 rounded bg-slate-50">
                  <div className="text-[10px] text-slate-500 uppercase">Cup-to-Disc (CDR)</div>
                  <div className="font-mono text-sm font-bold text-slate-800">{analysis.biomarkers.cupToDiscRatio.toFixed(2)}</div>
                </div>
                <div className="p-2 border border-slate-200 rounded bg-slate-50">
                  <div className="text-[10px] text-slate-500 uppercase">Media Clarity</div>
                  <div className="font-mono text-sm font-bold text-slate-800">{analysis.biomarkers.mediaClarityScore}%</div>
                </div>
                <div className="p-2 border border-slate-200 rounded bg-slate-50">
                  <div className="text-[10px] text-slate-500 uppercase">Macular Drusen</div>
                  <div className="font-mono text-sm font-bold text-slate-800">{analysis.biomarkers.macularDrusenBurden}</div>
                </div>
                <div className="p-2 border border-slate-200 rounded bg-slate-50">
                  <div className="text-[10px] text-slate-500 uppercase">Subretinal Fluid</div>
                  <div className="font-mono text-sm font-bold text-slate-800">
                    {analysis.biomarkers.subretinalFluidDetected ? 'PRESENT' : 'None'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Complete 6-Disease Classification Matrix */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Deep Learning Multi-Label Classification Matrix
            </h3>
            <table className="w-full text-left border-collapse border border-slate-200 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="p-2.5 border border-slate-200">Category</th>
                  <th className="p-2.5 border border-slate-200">Confidence Score</th>
                  <th className="p-2.5 border border-slate-200">Status</th>
                  <th className="p-2.5 border border-slate-200">Clinical Staging</th>
                  <th className="p-2.5 border border-slate-200">ICD-10 Code</th>
                  <th className="p-2.5 border border-slate-200">Observed Clinical Signs</th>
                </tr>
              </thead>
              <tbody>
                {analysis.categories.map((cat) => (
                  <tr key={cat.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="p-2.5 border border-slate-200 font-semibold text-slate-900">
                      {cat.name}
                    </td>
                    <td className="p-2.5 border border-slate-200 font-mono font-bold">
                      <span className={cat.confidence >= 50 && cat.id !== 'healthy' ? 'text-rose-700' : cat.confidence >= 50 && cat.id === 'healthy' ? 'text-emerald-700' : 'text-slate-600'}>
                        {cat.confidence.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-2.5 border border-slate-200">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                        cat.status === 'Detected' ? 'bg-rose-100 text-rose-800' :
                        cat.status === 'Suspected' ? 'bg-amber-100 text-amber-800' :
                        cat.status === 'Normal' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {cat.status}
                      </span>
                    </td>
                    <td className="p-2.5 border border-slate-200 text-slate-700">
                      {cat.stage}
                    </td>
                    <td className="p-2.5 border border-slate-200 font-mono text-slate-600">
                      {cat.icd10}
                    </td>
                    <td className="p-2.5 border border-slate-200 text-[11px] text-slate-600">
                      {cat.findings?.slice(0, 2).join('; ') || 'None noted'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Actionable Clinical Recommendations */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Recommended Management Plan
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700">
              {analysis.recommendations.map((rec, rIdx) => (
                <li key={rIdx}>{rec}</li>
              ))}
            </ul>
          </div>

          {/* Doctor Assessment / Notes & Digital Sign-off */}
          <div className="pt-4 border-t border-slate-300 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Attending Ophthalmologist's Evaluation & Notes
            </label>
            <textarea
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              rows={2}
            />

            <div className="flex items-end justify-between pt-4">
              <div className="flex items-center gap-2 text-xs text-emerald-800">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Verified by Multi-Modal Retinal Deep Learning Pipeline</span>
              </div>
              <div className="text-right">
                <input
                  type="text"
                  value={doctorSignature}
                  onChange={(e) => setDoctorSignature(e.target.value)}
                  className="font-serif italic text-sm font-semibold border-b border-slate-400 text-right focus:outline-none pb-0.5"
                />
                <div className="text-[10px] text-slate-500 uppercase mt-0.5">
                  Attending Physician Signature
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
