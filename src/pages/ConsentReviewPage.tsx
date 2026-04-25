import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import Button from '../components/common/Button';
import { consentFormService } from '../api/services/consentForm';
import { SharedConsentPayload } from '../api/types';
import { generatePdfBlobFromHtml } from '../utils/printUtils';
import {
  dedupeRepeatedParagraphs,
  escapeHtml,
  hydrateConsentSections,
  replaceConsentPlaceholders,
  renderSectionHtml,
} from '../utils/consentForm';

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      resolve(result.includes(',') ? result.split(',', 2)[1] : result);
    };
    reader.onerror = () => reject(reader.error || new Error('Failed to read PDF blob'));
    reader.readAsDataURL(blob);
  });

const ConsentReviewPage: React.FC = () => {
  const { token = '' } = useParams();

  const [data, setData] = useState<SharedConsentPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const [minorMode, setMinorMode] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [signerPhone, setSignerPhone] = useState('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const response = await consentFormService.getSharedConsent(token);
        setData(response);
        const payload = response.payload || {};
        setMinorMode(Boolean(payload.minor_mode));
        setSignerName(payload.minor_mode ? payload.guardian_name || '' : payload.patient_name || '');
        setSignerPhone(payload.minor_mode ? payload.guardian_phone || '' : payload.patient_phone || '');
      } catch (error: any) {
        console.error('Failed to load shared consent', error);
        toast.error(error?.message || 'Could not open consent link');
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      load();
    }
  }, [token]);

  const payload = useMemo(() => (data?.payload || {}) as Record<string, any>, [data]);
  const template = data?.template || null;

  const placeholderContext = useMemo(
    () => ({
      doctor: payload.doctor_name || data?.session?.doctor_name || '',
      procedure: (payload.rows || [])
        .map((row: any) => row?.procedure?.trim())
        .filter(Boolean)
        .join(', '),
      condition: (payload.rows || [])
        .map((row: any) => row?.condition?.trim())
        .filter(Boolean)
        .join(', '),
      anesthesia: (payload.anesthesia_tags || []).join(', '),
    }),
    [payload, data]
  );

  const sections = useMemo(() => hydrateConsentSections(template?.sections || [], placeholderContext), [template, placeholderContext]);

  const summary = useMemo(
    () => dedupeRepeatedParagraphs(replaceConsentPlaceholders(payload.summary_text || data?.session?.summary_text || template?.summary_text || '', placeholderContext)),
    [payload, data, template, placeholderContext]
  );

  const declaration = useMemo(() => {
    const text = minorMode
      ? template?.guardian_declaration_text || template?.declaration_text || ''
      : template?.declaration_text || '';
    return replaceConsentPlaceholders(text, placeholderContext);
  }, [minorMode, template, placeholderContext]);

  const buildConsentHtml = () => {
    const sectionsHtml = sections.map((section) => renderSectionHtml(section)).join('');
    const tableRowsHtml = (payload.rows || [])
      .map(
        (row: any) =>
          `<tr><td style="border:1px solid #d1d5db;padding:8px;">${escapeHtml(row?.toothNumber || '-')}</td><td style="border:1px solid #d1d5db;padding:8px;">${escapeHtml(row?.condition || '-')}</td><td style="border:1px solid #d1d5db;padding:8px;">${escapeHtml(row?.procedure || '-')}</td></tr>`
      )
      .join('');
    const medicalHistory = payload.medical_history && typeof payload.medical_history === 'object' ? payload.medical_history : {};
    const medicalHistoryRows = Object.entries(medicalHistory)
      .filter(([, value]) => value !== null && value !== undefined && value !== '' && value !== false)
      .map(
        ([key, value]) =>
          `<div style="margin:0 0 6px;"><strong>${escapeHtml(key.replace(/[_-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()))}:</strong> ${escapeHtml(typeof value === 'boolean' ? 'Yes' : String(value))}</div>`
      )
      .join('');

    return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Consent - ${escapeHtml(data?.patient?.patient_name || data?.patient?.name || 'Patient')}</title>
</head>
<body style="font-family:Arial,sans-serif;color:#111827;line-height:1.5;padding:24px;">
  <h2 style="margin:0 0 12px;">${escapeHtml(payload.clinic_name || 'Clinic')}</h2>
  <p style="margin:0 0 8px;"><strong>Patient:</strong> ${escapeHtml(data?.patient?.patient_name || data?.patient?.name || '')}</p>
  <p style="margin:0 0 8px;"><strong>Consent Type:</strong> ${escapeHtml(data?.session?.consent_type_label || '')}</p>
  <p style="margin:0 0 12px;"><strong>Language:</strong> ${escapeHtml((data?.session?.language || '').toUpperCase())}</p>
  <h3 style="margin:16px 0 8px;">Medical History</h3>
  <div style="margin-bottom:12px;">${medicalHistoryRows || '<div style="margin:0;color:#6b7280;">No significant medical history recorded.</div>'}</div>
  <h3 style="margin:16px 0 8px;">Condition / Procedure</h3>
  <table style="width:100%;border-collapse:collapse;margin-bottom:12px;"><thead><tr><th style="border:1px solid #d1d5db;padding:8px;text-align:left;">Tooth</th><th style="border:1px solid #d1d5db;padding:8px;text-align:left;">Condition</th><th style="border:1px solid #d1d5db;padding:8px;text-align:left;">Procedure</th></tr></thead><tbody>${tableRowsHtml}</tbody></table>
  <h3 style="margin:16px 0 8px;">Summary</h3>
  <p style="white-space:pre-wrap;margin:0 0 16px;">${escapeHtml(summary)}</p>
  <h3 style="margin:16px 0 8px;">Consent Content</h3>
  ${sectionsHtml}
  <h3 style="margin:16px 0 8px;">Declaration</h3>
  <p style="white-space:pre-wrap;margin:0 0 16px;">${escapeHtml(declaration)}</p>
</body>
</html>
    `;
  };

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ratio = window.devicePixelRatio || 1;
    if (canvas.width === 0 || canvas.height === 0) {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(ratio, ratio);
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
      }
    }

    const context = canvas.getContext('2d');
    if (!context) return;

    const rect = canvas.getBoundingClientRect();
    context.beginPath();
    context.moveTo(event.clientX - rect.left, event.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const rect = canvas.getBoundingClientRect();
    context.lineTo(event.clientX - rect.left, event.clientY - rect.top);
    context.stroke();
    context.beginPath();
    context.moveTo(event.clientX - rect.left, event.clientY - rect.top);
  };

  const stopDrawing = () => {
    const context = canvasRef.current?.getContext('2d');
    context?.beginPath();
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  const submit = async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error('Signature pad not ready');
      return;
    }
    if (!data) {
      toast.error('Consent data is unavailable');
      return;
    }

    const signatureDataUrl = canvas.toDataURL('image/png');
    if (!signerName.trim()) {
      toast.error('Please enter signer name');
      return;
    }

    setIsSubmitting(true);
    try {
      const patientLabel = data.patient?.patient_name || data.patient?.name || 'patient';
      const consentTypeId = data.session?.consent_type_id || 'consent';
      const pdfBlob = await generatePdfBlobFromHtml(
        buildConsentHtml(),
        `${patientLabel}-consent.pdf`
      );
      const pdfBase64 = await blobToBase64(pdfBlob);
      await consentFormService.acceptSharedConsent({
        token,
        signer_name: signerName,
        signer_phone: signerPhone,
        signer_role: minorMode ? 'Parent/Guardian' : 'Patient',
        signature_data_url: signatureDataUrl,
        consent_pdf_base64: pdfBase64,
        consent_pdf_filename: `${patientLabel}-${consentTypeId}.pdf`,
        summary_text: summary,
      });
      setAccepted(true);
      toast.success('Consent submitted successfully');
    } catch (error: any) {
      console.error('Failed to submit consent', error);
      toast.error(error?.message || 'Failed to submit consent');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-600">Loading consent...</div>;
  }

  if (!data) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-600">Consent link is unavailable.</div>;
  }

  if (accepted || data.session.status === 'Signed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
          <h1 className="text-xl font-semibold text-gray-900">Consent Submitted</h1>
          <p className="text-sm text-gray-600 mt-2">Thank you. The clinic has received your signed consent.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 py-4 px-3 sm:px-4 ${data.session.language === 'ml' ? 'consent-ml-text' : ''}`}>
      <div className="max-w-3xl mx-auto space-y-4">
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
          <h1 className="text-xl font-semibold text-gray-900">{data.session.consent_type_label}</h1>
          <p className="text-sm text-gray-500 mt-1">Patient: {data.patient?.patient_name || data.patient?.name || '-'}</p>
          <p className="text-sm text-gray-500">Doctor: {payload.doctor_name || data.session.doctor_name || '-'}</p>

          {summary && (
            <div className="mt-4 rounded-lg bg-gray-50 border border-gray-200 p-3">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Summary</p>
              <p className="text-sm whitespace-pre-wrap text-gray-800 mt-1">{summary}</p>
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6 space-y-4 text-sm text-gray-800 leading-relaxed">
          {sections.map((section, index) => (
            <div key={index}>
              {section.heading && <h3 className="font-semibold text-gray-900 mb-1">{section.heading}</h3>}
              {section.body && <p className="whitespace-pre-wrap">{section.body}</p>}
              {section.items && section.items.length > 0 && (
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  {section.items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}
                </ul>
              )}
              {section.numbered && section.numbered.length > 0 && (
                <ol className="list-decimal pl-5 mt-1 space-y-1">
                  {section.numbered.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}
                </ol>
              )}
              {section.footer && <p className="whitespace-pre-wrap mt-1">{section.footer}</p>}
            </div>
          ))}

          {declaration && (
            <div className="border-t pt-4">
              <p className="whitespace-pre-wrap">{declaration}</p>
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Sign Consent</h2>

          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="rounded border-gray-300"
              checked={minorMode}
              onChange={(event) => setMinorMode(event.target.checked)}
            />
            I am signing as parent/guardian
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Signer Name</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                value={signerName}
                onChange={(event) => setSignerName(event.target.value)}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                value={signerPhone}
                onChange={(event) => setSignerPhone(event.target.value)}
                placeholder="Contact number"
              />
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              className="w-full h-52 touch-none"
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerLeave={stopDrawing}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={clearSignature}>Clear</Button>
            <Button size="sm" onClick={submit} isLoading={isSubmitting}>Submit Consent</Button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ConsentReviewPage;
