import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import Card from '../common/Card';
import Button from '../common/Button';
import InputField from '../common/InputField';
import { consentFormService } from '../../api/services/consentForm';
import { practitionerService } from '../../api/services/practitioner';
import { ConsentTemplate } from '../../api/types';

interface TemplateFormState {
  name?: string;
  consent_type_id: string;
  consent_type_label: string;
  language: 'en' | 'ml';
  doctor: string;
  is_active: boolean;
  sort_order: number;
  summary_text: string;
  declaration_text: string;
  guardian_declaration_text: string;
  sections_json: string;
}

const makeDefaultForm = (): TemplateFormState => ({
  consent_type_id: '',
  consent_type_label: '',
  language: 'en',
  doctor: '',
  is_active: true,
  sort_order: 0,
  summary_text: '',
  declaration_text: '',
  guardian_declaration_text: '',
  sections_json: '[\n  {\n    "heading": "",\n    "body": ""\n  }\n]',
});

const ConsentTemplatesTab: React.FC = () => {
  const [templates, setTemplates] = useState<ConsentTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [form, setForm] = useState<TemplateFormState>(() => makeDefaultForm());
  const [practitioners, setPractitioners] = useState<Array<{ id: string; name: string }>>([]);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const [templateResp, practitionerResp] = await Promise.all([
        consentFormService.getConsentTemplates({ include_inactive: true, for_settings: true }),
        practitionerService.getPractitioners().catch(() => ({ data: [] as any[] } as any)),
      ]);

      setTemplates(templateResp.templates || []);

      const practitionerRows = Array.isArray((practitionerResp as any)?.data)
        ? (practitionerResp as any).data
        : [];

      setPractitioners(
        practitionerRows.map((row: any) => ({
          id: row.name,
          name: row.practitioner_name || row.name,
        }))
      );
    } catch (error: any) {
      console.error('Failed to load consent templates', error);
      toast.error(error?.message || 'Failed to load consent templates', { id: 'consent-templates-load-error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const typeOptions = useMemo(() => {
    const seen = new Map<string, string>();
    templates.forEach((row) => {
      if (!seen.has(row.consent_type_id)) {
        seen.set(row.consent_type_id, row.consent_type_label || row.consent_type_id);
      }
    });
    return Array.from(seen.entries()).map(([id, label]) => ({ id, label }));
  }, [templates]);

  const startNewTemplate = () => {
    setForm(makeDefaultForm());
  };

  const startEditTemplate = (template: ConsentTemplate) => {
    setForm({
      name: template.name,
      consent_type_id: template.consent_type_id,
      consent_type_label: template.consent_type_label,
      language: template.language,
      doctor: template.doctor || '',
      is_active: Boolean(template.is_active),
      sort_order: template.sort_order || 0,
      summary_text: template.summary_text || '',
      declaration_text: template.declaration_text || '',
      guardian_declaration_text: template.guardian_declaration_text || '',
      sections_json: JSON.stringify(template.sections || [], null, 2),
    });
  };

  const saveTemplate = async () => {
    try {
      setIsSaving(true);
      const parsedSections = JSON.parse(form.sections_json || '[]');

      await consentFormService.saveConsentTemplate({
        name: form.name,
        consent_type_id: form.consent_type_id.trim(),
        consent_type_label: form.consent_type_label.trim(),
        language: form.language,
        doctor: form.doctor || null,
        is_active: form.is_active,
        sort_order: Number(form.sort_order) || 0,
        summary_text: form.summary_text,
        declaration_text: form.declaration_text,
        guardian_declaration_text: form.guardian_declaration_text,
        sections: parsedSections,
      });

      toast.success(form.name ? 'Template updated' : 'Template created');
      await loadTemplates();
      if (!form.name) {
        setForm(makeDefaultForm());
      }
    } catch (error: any) {
      console.error('Failed to save template', error);
      toast.error(error?.message || 'Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTemplate = async () => {
    if (!form.name) {
      return;
    }

    if (!window.confirm('Delete this consent template?')) {
      return;
    }

    try {
      setIsDeleting(true);
      await consentFormService.deleteConsentTemplate(form.name);
      toast.success('Template deleted');
      setForm(makeDefaultForm());
      await loadTemplates();
    } catch (error: any) {
      console.error('Failed to delete template', error);
      toast.error(error?.message || 'Failed to delete template');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card title="Consent Form Templates">
        <p className="text-sm text-gray-600">
          Manage bilingual consent templates by clinic and doctor. These templates power the Consent Form Builder,
          QR links, and WhatsApp sharing flow.
        </p>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-base font-semibold text-gray-900">Available Templates</h3>
          <Button size="sm" variant="outline" onClick={startNewTemplate}>Add New Template</Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-600">Loading templates...</p>
        ) : templates.length === 0 ? (
          <p className="text-sm text-gray-600">No templates found yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Language</th>
                  <th className="py-2 pr-3">Doctor Scope</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((row) => (
                  <tr key={row.name} className="border-b last:border-0">
                    <td className="py-2 pr-3 text-gray-900">{row.consent_type_label}</td>
                    <td className="py-2 pr-3 uppercase">{row.language}</td>
                    <td className="py-2 pr-3">{row.doctor || 'Clinic Default'}</td>
                    <td className="py-2 pr-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${row.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {row.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-2 pr-3">
                      <button
                        onClick={() => startEditTemplate(row)}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <h3 className="text-base font-semibold text-gray-900 mb-4">{form.name ? 'Edit Template' : 'Create Template'}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Consent Type ID</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              value={form.consent_type_id}
              onChange={(event) => setForm((prev) => ({ ...prev, consent_type_id: event.target.value }))}
              placeholder="e.g. general, endodontic"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Consent Type Label</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              value={form.consent_type_label}
              onChange={(event) => setForm((prev) => ({ ...prev, consent_type_label: event.target.value }))}
              placeholder="Readable label"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
              value={form.language}
              onChange={(event) => setForm((prev) => ({ ...prev, language: event.target.value as 'en' | 'ml' }))}
            >
              <option value="en">English</option>
              <option value="ml">Malayalam</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Scope (optional)</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
              value={form.doctor}
              onChange={(event) => setForm((prev) => ({ ...prev, doctor: event.target.value }))}
            >
              <option value="">Clinic Default</option>
              {practitioners.map((row) => (
                <option key={row.id} value={row.id}>{row.name}</option>
              ))}
            </select>
          </div>

          <InputField
            label="Sort Order"
            type="number"
            value={String(form.sort_order)}
            onChange={(event) => setForm((prev) => ({ ...prev, sort_order: Number(event.target.value) || 0 }))}
          />

          <div className="flex items-end pb-2">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={form.is_active}
                onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
              />
              Active template
            </label>
          </div>
        </div>

        {typeOptions.length > 0 && (
          <p className="mt-3 text-xs text-gray-500">
            Existing type IDs: {typeOptions.map((row) => row.id).join(', ')}
          </p>
        )}

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Summary Text</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 min-h-[96px]"
              value={form.summary_text}
              onChange={(event) => setForm((prev) => ({ ...prev, summary_text: event.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Declaration Text</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 min-h-[72px]"
              value={form.declaration_text}
              onChange={(event) => setForm((prev) => ({ ...prev, declaration_text: event.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Declaration Text</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 min-h-[72px]"
              value={form.guardian_declaration_text}
              onChange={(event) => setForm((prev) => ({ ...prev, guardian_declaration_text: event.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sections JSON</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 min-h-[280px] font-mono text-xs"
              value={form.sections_json}
              onChange={(event) => setForm((prev) => ({ ...prev, sections_json: event.target.value }))}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3 justify-end">
          {form.name && (
            <Button variant="danger" size="sm" onClick={deleteTemplate} isLoading={isDeleting}>
              Delete Template
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={startNewTemplate}>Reset</Button>
          <Button size="sm" onClick={saveTemplate} isLoading={isSaving}>Save Template</Button>
        </div>
      </Card>
    </div>
  );
};

export default ConsentTemplatesTab;
