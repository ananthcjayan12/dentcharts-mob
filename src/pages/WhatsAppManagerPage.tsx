import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import Sidebar from '../components/common/Sidebar';
import TopBar from '../components/common/TopBar';
import WhatsAppHelpTab from '../components/settings/WhatsAppHelpTab';
import { useClinic } from '../contexts/ClinicContext';
import { useAuth } from '../contexts/AuthContext';
import {
  whatsappService,
  WhatsAppConversationMessage,
  WhatsAppConversationSummary,
  WhatsAppMessageLog,
  WhatsAppSettings,
} from '../api/services/whatsapp';

type TabKey = 'overview' | 'settings' | 'logs' | 'conversations' | 'analytics' | 'help';

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'settings', label: 'Settings' },
  { key: 'logs', label: 'Logs' },
  { key: 'conversations', label: 'Conversations' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'help', label: 'Setup Guide' },
];

const emptySettings: WhatsAppSettings = {
  clinic: '',
  whatsapp_enabled: 0,
  whatsapp_phone_number_id: '',
  whatsapp_business_account_id: '',
  whatsapp_access_token_masked: '',
  has_whatsapp_access_token: 0,
  whatsapp_appointment_template: '',
  whatsapp_review_template: '',
  whatsapp_prescription_template: '',
  whatsapp_invoice_template: '',
};

const WhatsAppManagerPage: React.FC = () => {
  const { clinicId } = useClinic();
  const { user } = useAuth();
  const isClinicAdmin = Boolean(user?.permissions?.is_clinic_admin);

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [isLoading, setIsLoading] = useState(false);

  const [settings, setSettings] = useState<WhatsAppSettings>(emptySettings);
  const [tokenInput, setTokenInput] = useState('');

  const [logs, setLogs] = useState<WhatsAppMessageLog[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const logsLimit = 20;
  const [logsOffset, setLogsOffset] = useState(0);
  const [logsStatus, setLogsStatus] = useState('');
  const [logsType, setLogsType] = useState('');
  const [logsDateFrom, setLogsDateFrom] = useState('');
  const [logsDateTo, setLogsDateTo] = useState('');
  const [logsRecipientSearch, setLogsRecipientSearch] = useState('');

  const [conversations, setConversations] = useState<WhatsAppConversationSummary[]>([]);
  const [conversationSearch, setConversationSearch] = useState('');
  const [conversationUnreadOnly, setConversationUnreadOnly] = useState(false);
  const [activeConversation, setActiveConversation] = useState<WhatsAppConversationSummary | null>(null);
  const [conversationMessages, setConversationMessages] = useState<WhatsAppConversationMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [replyTemplateName, setReplyTemplateName] = useState('');
  const [replyTemplateParams, setReplyTemplateParams] = useState('');

  const [stats, setStats] = useState<any>(null);
  const [statsFrom, setStatsFrom] = useState('');
  const [statsTo, setStatsTo] = useState('');
  const [statsGranularity, setStatsGranularity] = useState<'day' | 'week' | 'month'>('day');

  const visibleTabs = useMemo(
    () => TABS.filter((tab) => (isClinicAdmin ? true : tab.key !== 'settings')),
    [isClinicAdmin]
  );

  const pageCount = useMemo(() => Math.max(1, Math.ceil(logsTotal / logsLimit)), [logsTotal, logsLimit]);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const settings = await whatsappService.getWhatsAppSettings(clinicId || undefined);
      setSettings(settings || emptySettings);
      setTokenInput('');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load WhatsApp settings');
    } finally {
      setIsLoading(false);
    }
  }, [clinicId]);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await whatsappService.getMessageLogs(clinicId || undefined, {
        limit: logsLimit,
        offset: logsOffset,
        status: logsStatus || undefined,
        messageType: logsType || undefined,
        dateFrom: logsDateFrom || undefined,
        dateTo: logsDateTo || undefined,
        recipientSearch: logsRecipientSearch || undefined,
      });
      setLogs(response.logs || []);
      setLogsTotal(response.total || 0);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load logs');
    } finally {
      setIsLoading(false);
    }
  }, [clinicId, logsLimit, logsOffset, logsStatus, logsType, logsDateFrom, logsDateTo, logsRecipientSearch]);

  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await whatsappService.getConversations({
        clinic: clinicId || undefined,
        search: conversationSearch || undefined,
        unreadOnly: conversationUnreadOnly,
        limit: 50,
      });
      const list = response.data?.conversations || [];
      setConversations(list);
      setActiveConversation((prev) => prev || list[0] || null);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, [clinicId, conversationSearch, conversationUnreadOnly]);

  const loadConversationMessages = useCallback(async (conversationId: string) => {
    setIsLoading(true);
    try {
      const response = await whatsappService.getConversationMessages(conversationId, {
        clinic: clinicId || undefined,
        limit: 200,
      });
      setConversationMessages(response.data?.messages || []);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load conversation messages');
    } finally {
      setIsLoading(false);
    }
  }, [clinicId]);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await whatsappService.getWhatsAppStats({
        clinic: clinicId || undefined,
        dateFrom: statsFrom || undefined,
        dateTo: statsTo || undefined,
        granularity: statsGranularity,
      });
      setStats(response.data);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, [clinicId, statsFrom, statsTo, statsGranularity]);

  useEffect(() => {
    if (!clinicId || !isClinicAdmin) {
      return;
    }
    loadSettings();
  }, [clinicId, isClinicAdmin, loadSettings]);

  useEffect(() => {
    if (!isClinicAdmin && activeTab === 'settings') {
      setActiveTab('overview');
    }
  }, [activeTab, isClinicAdmin]);

  useEffect(() => {
    if (activeTab === 'logs' && clinicId) {
      loadLogs();
    }
  }, [activeTab, clinicId, logsOffset, loadLogs]);

  useEffect(() => {
    if (activeTab === 'conversations' && clinicId) {
      loadConversations();
    }
  }, [activeTab, clinicId, loadConversations]);

  useEffect(() => {
    if (activeTab === 'analytics' && clinicId) {
      loadStats();
    }
  }, [activeTab, clinicId, loadStats]);

  useEffect(() => {
    if (activeConversation?.name) {
      loadConversationMessages(activeConversation.name);
    }
  }, [activeConversation?.name, loadConversationMessages]);

  const onSaveSettings = async () => {
    try {
      const payload: any = {
        clinic: clinicId,
        whatsapp_enabled: settings.whatsapp_enabled,
        whatsapp_phone_number_id: settings.whatsapp_phone_number_id,
        whatsapp_business_account_id: settings.whatsapp_business_account_id,
        whatsapp_appointment_template: settings.whatsapp_appointment_template,
        whatsapp_review_template: settings.whatsapp_review_template,
        whatsapp_prescription_template: settings.whatsapp_prescription_template,
        whatsapp_invoice_template: settings.whatsapp_invoice_template,
      };
      if (tokenInput.trim()) {
        payload.whatsapp_access_token = tokenInput.trim();
      }

      const updatedSettings = await whatsappService.updateWhatsAppSettings(payload);
      setSettings(updatedSettings || settings);
      setTokenInput('');
      toast.success('WhatsApp settings updated');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save settings');
    }
  };

  const onTestConnection = async () => {
    try {
      const response = await whatsappService.testConnection(clinicId || '');
      if (response.success) {
        toast.success(response.message || 'Connection successful');
      } else {
        toast.error(response.error || 'Connection failed');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Connection test failed');
    }
  };

  const onMarkRead = async () => {
    if (!activeConversation?.name) return;
    try {
      await whatsappService.markConversationRead(activeConversation.name, clinicId || undefined);
      toast.success('Conversation marked as read');
      await Promise.all([loadConversations(), loadConversationMessages(activeConversation.name)]);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to mark conversation as read');
    }
  };

  const onSendReply = async () => {
    if (!activeConversation?.name) return;

    const isSessionActive = Boolean(activeConversation.is_session_active);
    if (!isSessionActive && !replyTemplateName.trim()) {
      toast.error('Session expired. Template name is required.');
      return;
    }

    if (isSessionActive && !replyText.trim()) {
      toast.error('Reply message is required.');
      return;
    }

    const templateParams = replyTemplateParams
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    try {
      await whatsappService.sendConversationReply({
        clinic: clinicId || undefined,
        conversation_id: activeConversation.name,
        message_text: isSessionActive ? replyText : undefined,
        template_name: !isSessionActive ? replyTemplateName || undefined : undefined,
        template_params: !isSessionActive ? templateParams : undefined,
      });
      toast.success('Reply sent');
      setReplyText('');
      setReplyTemplateName('');
      setReplyTemplateParams('');
      await Promise.all([loadConversations(), loadConversationMessages(activeConversation.name)]);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to send reply');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar for Desktop */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative lg:pl-20">
        <TopBar title="WhatsApp Manager" showMenu />

        {/* Scrollable Content */}
        <div className="overflow-y-auto pb-20 lg:pb-4 flex-1" style={{ height: 'calc(100vh - 64px)' }}>
          <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-2 flex flex-wrap gap-2">
          {visibleTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${activeTab === tab.key ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">WhatsApp Manager</h2>
              <p className="text-sm text-gray-600 mt-1">Manage WhatsApp settings, logs, conversations, and analytics for clinic: {clinicId || '-'}</p>
            </div>

            {!settings.whatsapp_enabled && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-blue-900">Get Started</h3>
                  <p className="text-xs text-blue-800 mt-1">
                    WhatsApp integration is not yet enabled for this clinic. 
                    Check out the <button onClick={() => setActiveTab('help')} className="font-bold underline">Setup Guide</button> to learn how to configure it.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
            {/* Enable Toggle */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <input
                type="checkbox"
                id="enable-whatsapp"
                className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                checked={Boolean(settings.whatsapp_enabled)}
                onChange={(e) => setSettings((prev) => ({ ...prev, whatsapp_enabled: e.target.checked ? 1 : 0 }))}
              />
              <div className="flex-1">
                <label htmlFor="enable-whatsapp" className="block text-sm font-semibold text-gray-900 cursor-pointer">
                  Enable WhatsApp Integration
                </label>
                <p className="text-xs text-gray-600 mt-1">
                  Allow sending automated WhatsApp messages to patients
                </p>
              </div>
            </div>

            {/* API Configuration */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">API Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phone Number ID *
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="Enter Phone Number ID"
                    value={settings.whatsapp_phone_number_id || ''}
                    onChange={(e) => setSettings((prev) => ({ ...prev, whatsapp_phone_number_id: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Business Account ID *
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="Enter Business Account ID"
                    value={settings.whatsapp_business_account_id || ''}
                    onChange={(e) => setSettings((prev) => ({ ...prev, whatsapp_business_account_id: e.target.value }))}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Access Token
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all font-mono"
                    placeholder="Leave blank to keep current token"
                    type="password"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                  />
                  {settings.has_whatsapp_access_token === 1 && (
                    <p className="mt-1.5 text-xs text-green-600 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Token configured: {settings.whatsapp_access_token_masked}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Message Templates */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Message Templates</h3>
              <p className="text-xs text-gray-600 -mt-2">Template names must be pre-approved in Meta Business Manager</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Appointment Template
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="e.g., appointment_reminder"
                    value={settings.whatsapp_appointment_template || ''}
                    onChange={(e) => setSettings((prev) => ({ ...prev, whatsapp_appointment_template: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Review Template
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="e.g., review_request"
                    value={settings.whatsapp_review_template || ''}
                    onChange={(e) => setSettings((prev) => ({ ...prev, whatsapp_review_template: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Prescription Template
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="e.g., prescription_share"
                    value={settings.whatsapp_prescription_template || ''}
                    onChange={(e) => setSettings((prev) => ({ ...prev, whatsapp_prescription_template: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Invoice Template
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="e.g., invoice_share"
                    value={settings.whatsapp_invoice_template || ''}
                    onChange={(e) => setSettings((prev) => ({ ...prev, whatsapp_invoice_template: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
              <button 
                className="px-4 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors shadow-sm"
                onClick={onSaveSettings}
                data-testid="whatsapp-settings-save"
              >
                Save Settings
              </button>
              <button 
                className="px-4 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium transition-colors"
                onClick={onTestConnection}
              >
                Test Connection
              </button>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
              <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Recipient" value={logsRecipientSearch} onChange={(e) => setLogsRecipientSearch(e.target.value)} />
              <select className="border rounded-lg px-3 py-2 text-sm" value={logsStatus} onChange={(e) => setLogsStatus(e.target.value)}>
                <option value="">All Status</option>
                <option value="Sent">Sent</option>
                <option value="Delivered">Delivered</option>
                <option value="Read">Read</option>
                <option value="Failed">Failed</option>
              </select>
              <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Message Type" value={logsType} onChange={(e) => setLogsType(e.target.value)} />
              <input className="border rounded-lg px-3 py-2 text-sm" type="date" value={logsDateFrom} onChange={(e) => setLogsDateFrom(e.target.value)} />
              <input className="border rounded-lg px-3 py-2 text-sm" type="date" value={logsDateTo} onChange={(e) => setLogsDateTo(e.target.value)} />
              <button className="px-3 py-2 rounded-lg bg-gray-200 text-sm" onClick={() => { setLogsOffset(0); loadLogs(); }}>Apply</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 border-b">
                    <th className="py-2">Recipient</th>
                    <th className="py-2">Template</th>
                    <th className="py-2">Type</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Sent At</th>
                    <th className="py-2">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.name} className="border-b border-gray-100">
                      <td className="py-2">{log.recipient_phone}</td>
                      <td className="py-2">{log.template_name || '-'}</td>
                      <td className="py-2">{log.message_type || '-'}</td>
                      <td className="py-2">{log.status || '-'}</td>
                      <td className="py-2">{log.sent_at || '-'}</td>
                      <td className="py-2 text-red-600">{log.error_message || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Total: {logsTotal}</span>
              <div className="flex items-center gap-2">
                <button
                  className="px-2 py-1 rounded bg-gray-100 disabled:opacity-50"
                  disabled={logsOffset <= 0}
                  onClick={() => setLogsOffset((prev) => Math.max(0, prev - logsLimit))}
                >
                  Prev
                </button>
                <span>{Math.floor(logsOffset / logsLimit) + 1} / {pageCount}</span>
                <button
                  className="px-2 py-1 rounded bg-gray-100 disabled:opacity-50"
                  disabled={logsOffset + logsLimit >= logsTotal}
                  onClick={() => setLogsOffset((prev) => prev + logsLimit)}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'conversations' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 p-3 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 border rounded-lg px-3 py-2 text-sm"
                  placeholder="Search conversations"
                  value={conversationSearch}
                  onChange={(e) => setConversationSearch(e.target.value)}
                />
                <button className="px-3 py-2 rounded-lg bg-gray-200 text-sm" onClick={loadConversations}>Search</button>
              </div>
              <label className="text-sm text-gray-700 flex items-center gap-2">
                <input type="checkbox" checked={conversationUnreadOnly} onChange={(e) => setConversationUnreadOnly(e.target.checked)} />
                Unread only
              </label>
              <button className="px-3 py-2 rounded-lg bg-gray-100 text-sm" onClick={loadConversations}>Refresh</button>

              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.name}
                    className={`w-full text-left p-3 rounded-lg border ${activeConversation?.name === conversation.name ? 'border-primary-400 bg-primary-50' : 'border-gray-200'}`}
                    onClick={() => setActiveConversation(conversation)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm text-gray-900">{conversation.customer_name || conversation.customer_phone || conversation.wa_id}</div>
                      <div className="text-xs text-gray-500">{conversation.unread_count || 0}</div>
                    </div>
                    <div className="text-xs text-gray-600 mt-1 truncate">{conversation.last_message_preview || '-'}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-3 space-y-3">
              {!activeConversation ? (
                <div className="text-sm text-gray-500">Select a conversation</div>
              ) : (
                <>
                  <div className="flex items-center justify-between border-b pb-2">
                    <div>
                      <div className="font-semibold text-gray-900">{activeConversation.customer_name || activeConversation.customer_phone || activeConversation.wa_id}</div>
                      <div className="text-xs text-gray-600">
                        {activeConversation.is_session_active ? 'Session active' : 'Session expired (template required)'}
                      </div>
                    </div>
                    <button className="px-3 py-2 rounded-lg bg-gray-100 text-sm" onClick={onMarkRead}>Mark read</button>
                  </div>

                  <div className="space-y-2 max-h-[52vh] overflow-y-auto bg-gray-50 rounded-lg p-3">
                    {conversationMessages.map((message) => (
                      <div key={message.name} className={`max-w-[80%] p-2 rounded-lg text-sm ${message.direction === 'Outbound' ? 'ml-auto bg-primary-100 text-primary-900' : 'bg-white text-gray-900 border border-gray-200'}`}>
                        <div>{message.content || '-'}</div>
                        <div className="text-[11px] text-gray-500 mt-1">{message.message_timestamp || ''} • {message.status || ''}</div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    {activeConversation.is_session_active ? (
                      <textarea
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        rows={3}
                        placeholder="Type reply"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                      />
                    ) : (
                      <>
                        <input
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                          placeholder="Template name"
                          value={replyTemplateName}
                          onChange={(e) => setReplyTemplateName(e.target.value)}
                        />
                        <input
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                          placeholder="Template params (comma separated)"
                          value={replyTemplateParams}
                          onChange={(e) => setReplyTemplateParams(e.target.value)}
                        />
                      </>
                    )}
                    <button className="px-3 py-2 rounded-lg bg-primary-600 text-white text-sm" onClick={onSendReply}>Send</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <input className="border rounded-lg px-3 py-2 text-sm" type="date" value={statsFrom} onChange={(e) => setStatsFrom(e.target.value)} />
              <input className="border rounded-lg px-3 py-2 text-sm" type="date" value={statsTo} onChange={(e) => setStatsTo(e.target.value)} />
              <select className="border rounded-lg px-3 py-2 text-sm" value={statsGranularity} onChange={(e) => setStatsGranularity(e.target.value as any)}>
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
              <button className="px-3 py-2 rounded-lg bg-gray-200 text-sm" onClick={loadStats}>Apply</button>
            </div>

            {stats ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="rounded-lg border border-gray-200 p-3"><div className="text-xs text-gray-500">Total</div><div className="text-lg font-semibold">{stats.kpis?.total || 0}</div></div>
                  <div className="rounded-lg border border-gray-200 p-3"><div className="text-xs text-gray-500">Sent</div><div className="text-lg font-semibold">{stats.kpis?.sent || 0}</div></div>
                  <div className="rounded-lg border border-gray-200 p-3"><div className="text-xs text-gray-500">Delivered</div><div className="text-lg font-semibold">{stats.kpis?.delivered || 0}</div></div>
                  <div className="rounded-lg border border-gray-200 p-3"><div className="text-xs text-gray-500">Read</div><div className="text-lg font-semibold">{stats.kpis?.read || 0}</div></div>
                  <div className="rounded-lg border border-gray-200 p-3"><div className="text-xs text-gray-500">Failed</div><div className="text-lg font-semibold">{stats.kpis?.failed || 0}</div></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Trend</h3>
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                      <table className="w-full text-sm">
                        <thead><tr className="text-left text-gray-600 border-b"><th className="py-2 px-2">Bucket</th><th className="py-2 px-2">Total</th><th className="py-2 px-2">Failed</th></tr></thead>
                        <tbody>
                          {(stats.trends || []).map((row: any) => (
                            <tr key={row.bucket} className="border-b border-gray-100"><td className="py-2 px-2">{row.bucket}</td><td className="py-2 px-2">{row.total}</td><td className="py-2 px-2">{row.failed}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Top Failure Reasons</h3>
                    <div className="space-y-2">
                      {(stats.failure_reasons || []).map((item: any, idx: number) => (
                        <div key={`${item.error_message || 'na'}-${idx}`} className="rounded-lg border border-gray-200 p-2 text-sm">
                          <div className="text-gray-800">{item.error_message || 'Unknown error'}</div>
                          <div className="text-xs text-gray-500">Count: {item.total}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-500">No analytics available</div>
            )}
          </div>
        )}

        {activeTab === 'help' && <WhatsAppHelpTab />}

        {isLoading && <div className="text-sm text-gray-500">Loading…</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppManagerPage;
