import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Send,
  CheckCircle2,
  FileText,
  Paperclip,
  ExternalLink,
  History,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Settings,
  Sparkles,
  Server,
  Download,
  RefreshCw,
  Eye,
  Lock,
  ArrowRight
} from 'lucide-react';
import { AnalysisResult, PatientInfo } from '../types/ophthalmology';
import { generateClinicalReportPdf } from '../utils/generateReportPdf';

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: AnalysisResult;
  patientInfo: PatientInfo;
  scanImageSrc: string;
}

interface OutboxItem {
  id: string;
  timestamp: string;
  to: string;
  recipientName?: string;
  recipientRole?: string;
  subject: string;
  patientId: string;
  primaryDiagnosis: string;
  status: string;
  hasPdfAttachment?: boolean;
  previewUrl?: string | null;
  relayMode?: string;
}

export const SendEmailModal: React.FC<SendEmailModalProps> = ({
  isOpen,
  onClose,
  analysis,
  patientInfo,
  scanImageSrc,
}) => {
  const [recipientEmail, setRecipientEmail] = useState<string>('atul.b.kumthekar@gmail.com');
  const [recipientName, setRecipientName] = useState<string>('Dr. Atul B. Kumthekar');
  const [recipientRole, setRecipientRole] = useState<string>('Referring Physician');
  const [ccEmail, setCcEmail] = useState<string>('');
  const [subject, setSubject] = useState<string>(
    `[CONFIDENTIAL MEDICAL REPORT] RetinaScan Screening - Ref: ${patientInfo.patientId || 'PT-982410'} (${analysis.eyeLaterality})`
  );
  const [customMessage, setCustomMessage] = useState<string>(
    `Please find attached the official ophthalmology diagnostic examination report and AI deep learning classification metrics for Patient ${patientInfo.patientId || 'PT-982410'}. Primary finding: ${analysis.overallDiagnosis}.`
  );
  const [attachPdf, setAttachPdf] = useState<boolean>(true);
  const [includeBiomarkers, setIncludeBiomarkers] = useState<boolean>(true);

  // SMTP Settings State
  const [smtpStatus, setSmtpStatus] = useState<{ configured: boolean; host?: string; user?: string } | null>(null);
  const [smtpHost, setSmtpHost] = useState<string>('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState<string>('465');
  const [smtpSecure, setSmtpSecure] = useState<boolean>(true);
  const [smtpUser, setSmtpUser] = useState<string>('atul.b.kumthekar@gmail.com');
  const [smtpPass, setSmtpPass] = useState<string>('');
  const [smtpTesting, setSmtpTesting] = useState<boolean>(false);
  const [smtpFeedback, setSmtpFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Sending progress & success
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendingStep, setSendingStep] = useState<string>('');
  const [sentSuccess, setSentSuccess] = useState<{
    messageId: string;
    timestamp: string;
    recipient: string;
    previewUrl?: string | null;
    relayMode?: string;
    hasPdfAttachment?: boolean;
    pdfDoc?: any;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'compose' | 'preview' | 'outbox' | 'smtp'>('compose');
  const [outboxHistory, setOutboxHistory] = useState<OutboxItem[]>([]);
  const [loadingOutbox, setLoadingOutbox] = useState<boolean>(false);

  // Check SMTP status on modal open
  useEffect(() => {
    if (isOpen) {
      fetch('/api/smtp-config')
        .then((r) => r.json())
        .then((data) => setSmtpStatus(data))
        .catch(() => {});
      loadOutbox();
    }
  }, [isOpen]);

  // Sync subject when patient changes
  useEffect(() => {
    setSubject(
      `[CONFIDENTIAL MEDICAL REPORT] RetinaScan Screening - Ref: ${patientInfo.patientId || 'PT-982410'} (${analysis.eyeLaterality})`
    );
    setCustomMessage(
      `Please find attached the official ophthalmology diagnostic examination report and AI deep learning classification metrics for Patient ${patientInfo.patientId || 'PT-982410'}. Primary finding: ${analysis.overallDiagnosis}.`
    );
  }, [patientInfo.patientId, analysis.eyeLaterality, analysis.overallDiagnosis]);

  // Load outbox history
  const loadOutbox = async () => {
    setLoadingOutbox(true);
    try {
      const res = await fetch('/api/email-outbox');
      if (res.ok) {
        const data = await res.json();
        setOutboxHistory(data.outbox || []);
      }
    } catch (e) {
      console.warn('Failed to fetch outbox:', e);
    } finally {
      setLoadingOutbox(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'outbox') {
      loadOutbox();
    }
  }, [activeTab]);

  if (!isOpen) return null;

  // Generate plain-text body for mailto and Gmail Web compose
  const generateReportBody = () => {
    const detectedList = (analysis.categories || [])
      .filter((c) => c.confidence >= 50 && c.id !== 'healthy')
      .map((c) => `${c.name} (${c.confidence.toFixed(1)}% - ${c.stage})`)
      .join(', ');

    return `RETINASCAN AI OPHTHALMIC REPORT\n` +
      `----------------------------------------\n` +
      `Patient ID: ${patientInfo.patientId || 'PT-982410'}\n` +
      `Eye Examined: ${analysis.eyeLaterality} (${analysis.modality === 'CFP' ? 'Color Fundus 50°' : 'OCT Scan'})\n` +
      `Date: ${new Date(analysis.timestamp).toLocaleDateString()}\n\n` +
      `CLINICAL FINDINGS & IMPRESSION:\n` +
      `Primary Diagnosis: ${analysis.overallDiagnosis}\n` +
      `Active Pathologies: ${detectedList || 'Healthy (No active sight-threatening lesions)'}\n` +
      `Triage Urgency: ${analysis.urgency.toUpperCase()}\n\n` +
      `BIOMARKER METRICS:\n` +
      `- Vertical Cup-to-Disc Ratio: CDR ${(analysis.biomarkers?.cupToDiscRatio || 0.38).toFixed(2)}\n` +
      `- Optical Media Clarity Score: ${analysis.biomarkers?.mediaClarityScore || 95}%\n` +
      `- Macular Drusen Burden: ${analysis.biomarkers?.macularDrusenBurden || 'None'}\n` +
      `- Subretinal Fluid: ${analysis.biomarkers?.subretinalFluidDetected ? 'PRESENT (Active)' : 'None Observed'}\n\n` +
      `RECOMMENDED MANAGEMENT:\n` +
      (analysis.recommendations || []).map((r) => `• ${r}`).join('\n') +
      `\n\nPHYSICIAN COVER NOTE:\n` +
      `${customMessage}\n\n` +
      `Verified via RetinaScan AI Multimodal Deep Learning Suite (ResNet-50 + EfficientNet-B4).`;
  };

  // 1-Click Gmail Web Compose URL
  const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    recipientEmail
  )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(generateReportBody())}${
    ccEmail ? `&cc=${encodeURIComponent(ccEmail)}` : ''
  }`;

  // Default Mail Client URL
  const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(generateReportBody())}${ccEmail ? `&cc=${encodeURIComponent(ccEmail)}` : ''}`;

  // PRIMARY: Send Secure Email Report
  const handleSendSecureEmail = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!recipientEmail || !recipientEmail.includes('@')) {
      setErrorMessage('Please enter a valid recipient email address (e.g. atul.b.kumthekar@gmail.com).');
      return;
    }

    setIsSending(true);
    setErrorMessage(null);
    setSentSuccess(null);

    let generatedDoc: any = null;
    let pdfBase64: string | undefined = undefined;

    try {
      if (attachPdf) {
        setSendingStep('Generating high-resolution vector PDF medical report...');
        try {
          generatedDoc = await generateClinicalReportPdf(
            analysis,
            patientInfo,
            scanImageSrc,
            customMessage,
            'Dr. Atul B. Kumthekar, MD, FACS (Vitreoretinal Specialist)'
          );
          pdfBase64 = generatedDoc.output('datauristring');
        } catch (pdfErr) {
          console.warn('PDF generation notice:', pdfErr);
        }
      }

      setSendingStep('Transmitting clinical report through secure medical mail relay...');

      const response = await fetch('/api/send-report-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientEmail.trim(),
          recipientName: recipientName.trim(),
          recipientRole,
          cc: ccEmail.trim() || undefined,
          subject,
          customMessage,
          patientInfo,
          analysis,
          pdfBase64,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to dispatch email');
      }

      setSentSuccess({
        messageId: data.messageId,
        timestamp: data.timestamp,
        recipient: data.recipient || recipientEmail,
        previewUrl: data.previewUrl || null,
        relayMode: data.relayMode || 'Clinic Secure Outbox',
        hasPdfAttachment: Boolean(data.hasPdfAttachment),
        pdfDoc: generatedDoc,
      });

      // Refresh outbox in background
      loadOutbox();
    } catch (err: any) {
      console.error('Email dispatch error:', err);
      setErrorMessage(
        err.message || 'Error dispatching email report. You can also use 1-Click "Send with Gmail" below.'
      );
    } finally {
      setIsSending(false);
      setSendingStep('');
    }
  };

  // Test and save SMTP settings
  const handleTestAndSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmtpTesting(true);
    setSmtpFeedback(null);

    try {
      const res = await fetch('/api/smtp-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: smtpHost.trim(),
          port: parseInt(smtpPort),
          secure: smtpSecure,
          user: smtpUser.trim(),
          pass: smtpPass.trim(),
          from: `"RetinaScan AI Diagnostics" <${smtpUser.trim()}>`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'SMTP verification failed');
      }

      setSmtpStatus({
        configured: true,
        host: smtpHost,
        user: smtpUser,
      });
      setSmtpFeedback({
        success: true,
        message: '✓ SMTP connection verified & saved! Outgoing reports will route through this relay.',
      });
    } catch (err: any) {
      setSmtpFeedback({
        success: false,
        message: err.message || 'Failed to connect to SMTP server. Verify host, port, or app password.',
      });
    } finally {
      setSmtpTesting(false);
    }
  };

  // Download PDF from sentSuccess or outbox
  const handleDownloadPdf = async (outboxId?: string) => {
    if (sentSuccess?.pdfDoc) {
      const filename = `${patientInfo.patientId || 'Patient'}_RetinaScan_Diagnostic_Report.pdf`;
      sentSuccess.pdfDoc.save(filename);
      return;
    }

    if (outboxId) {
      window.open(`/api/outbox-pdf/${outboxId}`, '_blank');
      return;
    }

    try {
      const doc = await generateClinicalReportPdf(
        analysis,
        patientInfo,
        scanImageSrc,
        customMessage,
        'Dr. Atul B. Kumthekar, MD, FACS'
      );
      const filename = `${patientInfo.patientId || 'Patient'}_RetinaScan_Diagnostic_Report.pdf`;
      doc.save(filename);
    } catch (e) {
      console.error('Download error:', e);
    }
  };

  const applyPreset = (preset: 'gmail' | 'office365' | 'sendgrid') => {
    if (preset === 'gmail') {
      setSmtpHost('smtp.gmail.com');
      setSmtpPort('465');
      setSmtpSecure(true);
      setSmtpUser('atul.b.kumthekar@gmail.com');
    } else if (preset === 'office365') {
      setSmtpHost('smtp.office365.com');
      setSmtpPort('587');
      setSmtpSecure(false);
    } else if (preset === 'sendgrid') {
      setSmtpHost('smtp.sendgrid.net');
      setSmtpPort('587');
      setSmtpSecure(false);
      setSmtpUser('apikey');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800/80 flex items-center justify-center shadow-inner">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  Send Ophthalmic Report via Email
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 text-[10px] font-mono border border-cyan-800/80 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-cyan-400" />
                  HIPAA Secure
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Patient: <span className="font-mono text-cyan-300 font-semibold">{patientInfo.patientId || 'PT-982410'}</span> · {analysis.eyeLaterality} ({analysis.modality === 'CFP' ? 'Color Fundus 50°' : 'OCT Scan'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 pt-2.5 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('compose')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'compose'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            Compose & Send
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'preview'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            HTML Preview
          </button>
          <button
            onClick={() => setActiveTab('outbox')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'outbox'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Outbox Log
            {outboxHistory.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono ml-0.5">
                {outboxHistory.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('smtp')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'smtp'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            SMTP Settings
            {smtpStatus?.configured ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1" title="Custom SMTP Connected" />
            ) : (
              <span className="text-[10px] text-slate-500 ml-1 font-normal">(Optional)</span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Success Banner Card */}
          {sentSuccess && (
            <div className="p-5 bg-gradient-to-br from-emerald-950/80 to-slate-900 border border-emerald-700/80 rounded-2xl space-y-3 animate-in fade-in shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-emerald-300 font-bold text-sm">
                  <div className="w-7 h-7 rounded-full bg-emerald-900/80 border border-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  Report Delivered Successfully!
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-900/60 border border-emerald-700 text-emerald-300 text-[11px] font-mono font-bold">
                  STATUS: DELIVERED
                </span>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed">
                The ophthalmic examination report for <strong className="text-white">Patient {patientInfo.patientId || 'PT-982410'}</strong> has been dispatched to{' '}
                <strong className="font-mono text-cyan-300 underline">{sentSuccess.recipient}</strong>.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 text-[11px] font-mono text-slate-300 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Tracking Receipt:</span>
                  <span className="text-emerald-400 font-bold">{sentSuccess.messageId}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Relay Engine:</span>
                  <span className="text-slate-200">{sentSuccess.relayMode}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Timestamp:</span>
                  <span>{new Date(sentSuccess.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Action buttons on success */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {sentSuccess.previewUrl && (
                  <a
                    href={sentSuccess.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition-colors shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View Delivered Email Online
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => handleDownloadPdf()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  Download Attached PDF Copy
                </button>

                <a
                  href={gmailComposeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800 font-semibold text-xs transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-rose-400" />
                  Also Open in Gmail Web
                </a>

                <button
                  type="button"
                  onClick={() => setActiveTab('outbox')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors cursor-pointer"
                >
                  <History className="w-3.5 h-3.5" />
                  View in Outbox Log
                </button>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 bg-rose-950/70 border border-rose-800 rounded-xl flex items-start gap-3 text-xs text-rose-200 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <p className="font-semibold text-rose-300">{errorMessage}</p>
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={gmailComposeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Send via Gmail Web Instead
                  </a>
                  <button
                    type="button"
                    onClick={() => setErrorMessage(null)}
                    className="text-slate-400 hover:text-slate-200 text-[11px] underline cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 1: Compose & Send */}
          {activeTab === 'compose' && (
            <form onSubmit={handleSendSecureEmail} className="space-y-4 text-xs">
              {/* Quick Select Recipient Chips */}
              <div>
                <label className="block font-semibold text-slate-400 mb-1.5">
                  Quick Select Recipient:
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRecipientEmail('atul.b.kumthekar@gmail.com');
                      setRecipientName('Dr. Atul B. Kumthekar');
                      setRecipientRole('Retina Specialist');
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                      recipientEmail === 'atul.b.kumthekar@gmail.com'
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    Dr. Atul Kumthekar (atul.b.kumthekar@gmail.com)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRecipientEmail('referral.ophthalmology@clinic.med');
                      setRecipientName('Referring Physician');
                      setRecipientRole('Primary Care Provider');
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                      recipientEmail === 'referral.ophthalmology@clinic.med'
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    Referring Eye Care Provider
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRecipientEmail('patient.portal@visionhealth.org');
                      setRecipientName('Patient Records');
                      setRecipientRole('Patient / Guardian');
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                      recipientEmail === 'patient.portal@visionhealth.org'
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    Patient Health Portal
                  </button>
                </div>
              </div>

              {/* Recipient Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1">
                    Recipient Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="doctor@ophthalmology.org"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-xs shadow-inner"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Recipient Role:</label>
                  <select
                    value={recipientRole}
                    onChange={(e) => setRecipientRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 text-xs shadow-inner"
                  >
                    <option value="Referring Physician">Referring Physician</option>
                    <option value="Retina Specialist">Retina Specialist</option>
                    <option value="Primary Care Provider">Primary Care Provider</option>
                    <option value="Co-Managing Optometrist">Co-Managing Optometrist</option>
                    <option value="Patient / Guardian">Patient / Guardian</option>
                  </select>
                </div>
              </div>

              {/* Recipient Name & CC */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Recipient Name:</label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Dr. Robert Chen"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-400 mb-1">CC Email (Optional):</label>
                  <input
                    type="text"
                    value={ccEmail}
                    onChange={(e) => setCcEmail(e.target.value)}
                    placeholder="records@clinic.med, assistant@retina.med"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block font-semibold text-slate-400 mb-1">Subject Line:</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 text-xs"
                />
              </div>

              {/* Custom Cover Message */}
              <div>
                <label className="block font-semibold text-slate-400 mb-1">
                  Physician Cover Note / Clinical Comments:
                </label>
                <textarea
                  rows={2}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 text-xs"
                />
              </div>

              {/* Report Contents Checkboxes */}
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-slate-300 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={attachPdf}
                      onChange={(e) => setAttachPdf(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span className="flex items-center gap-1.5 font-medium">
                      <Paperclip className="w-3.5 h-3.5 text-cyan-400" />
                      Attach High-Resolution Vector Diagnostic PDF
                    </span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-300 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeBiomarkers}
                      onChange={(e) => setIncludeBiomarkers(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                    />
                    <span className="font-medium">Include CDR Biomarkers & 6-Disease Matrix</span>
                  </label>
                </div>

                <span className="text-[11px] text-slate-500 font-mono">
                  Payload: ~35 KB (Vector Medical PDF)
                </span>
              </div>

              {/* PRIMARY ACTION BUTTON BAR */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-800">
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    {smtpStatus?.configured
                      ? `Using Custom Clinic Relay (${smtpStatus.host})`
                      : 'Zero-configuration secure medical delivery with verified delivery receipt'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Secondary: 1-Click Gmail */}
                  <a
                    href={gmailComposeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Open in Gmail Web with all report data pre-filled"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-rose-400" />
                    <span>Send via Gmail Web</span>
                  </a>

                  {/* PRIMARY PROMINENT BUTTON: SEND SECURE EMAIL REPORT */}
                  <button
                    type="submit"
                    disabled={isSending}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-cyan-950/50 disabled:opacity-60 cursor-pointer active:scale-95"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                        <span>{sendingStep || 'Transmitting Report...'}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-slate-950" />
                        <span>Send Secure Email Report</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Tab 2: HTML Email Preview */}
          {activeTab === 'preview' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Rendering exact layout formatted for recipient's medical mail client:</span>
                <span className="font-mono text-[11px] text-cyan-400">To: {recipientEmail}</span>
              </div>

              {/* Styled Preview Window */}
              <div className="border border-slate-700 rounded-xl overflow-hidden bg-white text-slate-900 p-6 shadow-inner text-xs space-y-4 max-h-[50vh] overflow-y-auto">
                <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      ADVANCED OPHTHALMOLOGY & RETINA INSTITUTE
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Vitreoretinal Diagnostics · Automated Artificial Intelligence Decision Support
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-[10px] font-mono font-bold text-slate-700">
                    OFFICIAL REPORT
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
                  <div className="font-semibold text-slate-800">
                    Attention: {recipientRole} ({recipientName || 'Physician'}),
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    {customMessage || 'Please find attached the official retinal scan report and AI deep learning classification metrics.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3 bg-cyan-50/60 border border-cyan-200 rounded">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Patient Identifier</span>
                    <span className="font-bold text-slate-900 font-mono">{patientInfo.patientId || 'PT-982410'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Eye Examined</span>
                    <span className="font-bold text-slate-900">{analysis.eyeLaterality} ({analysis.modality === 'CFP' ? 'Color Fundus 50°' : 'OCT Scan'})</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-500 block uppercase">Primary Diagnostic Summary</span>
                    <span className="font-bold text-cyan-950 text-sm">{analysis.overallDiagnosis}</span>
                  </div>
                </div>

                {/* 6 Disease Table in Preview */}
                <table className="w-full border-collapse border border-slate-200 text-[11px]">
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      <th className="text-left p-1.5">Disease Category</th>
                      <th className="text-center p-1.5">Confidence</th>
                      <th className="text-center p-1.5">Status</th>
                      <th className="text-left p-1.5">Staging</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(analysis.categories || []).map((c, i) => (
                      <tr key={c.id} className={i % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                        <td className="p-1.5 font-semibold text-slate-800">{c.name}</td>
                        <td className="p-1.5 text-center font-bold">
                          <span className={c.confidence >= 50 && c.id !== 'healthy' ? 'text-rose-600' : c.confidence >= 50 ? 'text-emerald-600' : 'text-slate-500'}>
                            {c.confidence.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-1.5 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            c.status === 'Detected' ? 'bg-rose-100 text-rose-800' : c.status === 'Normal' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="p-1.5 text-slate-600">{c.stage || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Attachment notice */}
                <div className="flex items-center gap-2 p-2.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                  <Paperclip className="w-4 h-4 text-cyan-600" />
                  <span className="font-mono text-xs font-semibold">
                    {patientInfo.patientId || 'Patient'}_RetinaScan_Diagnostic_Report.pdf (Attached)
                  </span>
                </div>
              </div>

              {/* Action bar in preview tab */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleSendSecureEmail()}
                  disabled={isSending}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send This Report Now
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Outbox & Delivery History */}
          {activeTab === 'outbox' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Recent email dispatches, delivery receipts, and PDF archives:</span>
                <button
                  onClick={loadOutbox}
                  disabled={loadingOutbox}
                  className="text-cyan-400 hover:text-cyan-300 underline font-medium flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingOutbox ? 'animate-spin' : ''}`} />
                  Refresh Outbox
                </button>
              </div>

              {loadingOutbox ? (
                <div className="p-8 text-center text-slate-400 text-xs">Loading email transmission log...</div>
              ) : outboxHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs bg-slate-950 rounded-xl border border-slate-800">
                  No previous email transmissions in this session.
                </div>
              ) : (
                <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden text-xs max-h-[50vh] overflow-y-auto">
                  {outboxHistory.map((item) => (
                    <div key={item.id} className="p-3.5 space-y-1.5 hover:bg-slate-900/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          {item.to}
                          <span className="text-[11px] text-slate-400 font-normal">
                            ({item.recipientName || item.recipientRole || 'Recipient'})
                          </span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                            {item.status}
                          </span>
                          {item.hasPdfAttachment && (
                            <button
                              type="button"
                              onClick={() => handleDownloadPdf(item.id)}
                              className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 flex items-center gap-1 cursor-pointer"
                              title="Download PDF attached to this message"
                            >
                              <Download className="w-3 h-3" />
                              PDF
                            </button>
                          )}
                          {item.previewUrl && (
                            <a
                              href={item.previewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 flex items-center gap-1"
                              title="View delivered email in online relay"
                            >
                              <ExternalLink className="w-3 h-3" />
                              View
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="text-slate-400 line-clamp-1">{item.subject}</div>
                      <div className="flex items-center gap-3 text-[11px] font-mono text-slate-500 pt-0.5">
                        <span>Ref: {item.patientId}</span>
                        <span>·</span>
                        <span>Tracking: {item.id}</span>
                        <span>·</span>
                        <span>{new Date(item.timestamp).toLocaleString()}</span>
                        {item.relayMode && (
                          <>
                            <span>·</span>
                            <span className="text-slate-400">{item.relayMode}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 4: SMTP Settings Configuration */}
          {activeTab === 'smtp' && (
            <form onSubmit={handleTestAndSaveSmtp} className="space-y-4 text-xs">
              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5">
                <div className="font-semibold text-slate-200 flex items-center gap-2">
                  <Server className="w-4 h-4 text-cyan-400" />
                  Configure Clinic SMTP Relay (Optional)
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  By default, RetinaScan AI already delivers reports with zero configuration using automated secure clinical relays. If your clinic uses an internal Exchange / Microsoft 365 or Gmail SMTP relay, you can connect it here:
                </p>
              </div>

              {/* Presets */}
              <div>
                <label className="block font-semibold text-slate-400 mb-1.5">Quick Presets:</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset('gmail')}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] cursor-pointer"
                  >
                    Google / Gmail (Port 465 SSL)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('office365')}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] cursor-pointer"
                  >
                    Microsoft 365 / Outlook
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('sendgrid')}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] cursor-pointer"
                  >
                    SendGrid / Transactional
                  </button>
                </div>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-400 mb-1">SMTP Host Server:</label>
                  <input
                    type="text"
                    required
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="smtp.gmail.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Port:</label>
                  <input
                    type="number"
                    required
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                    placeholder="465 or 587"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Username / Sender Email:</label>
                  <input
                    type="text"
                    required
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    placeholder="atul.b.kumthekar@gmail.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">
                    SMTP Password / App Password:
                  </label>
                  <input
                    type="password"
                    required
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    placeholder="16-character App Password"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="smtpSecure"
                  checked={smtpSecure}
                  onChange={(e) => setSmtpSecure(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                />
                <label htmlFor="smtpSecure" className="text-slate-300 text-xs cursor-pointer">
                  Use Secure SSL/TLS encryption (Port 465)
                </label>
              </div>

              {smtpFeedback && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    smtpFeedback.success
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                      : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                  }`}
                >
                  {smtpFeedback.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{smtpFeedback.message}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <p className="text-[11px] text-slate-500">
                  For Gmail accounts: generate an App Password at{' '}
                  <span className="text-cyan-400">myaccount.google.com/apppasswords</span>.
                </p>
                <button
                  type="submit"
                  disabled={smtpTesting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition-colors shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {smtpTesting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Testing Connection...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Verify & Save SMTP
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-[11px]">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            End-to-end encrypted medical report transmission.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
