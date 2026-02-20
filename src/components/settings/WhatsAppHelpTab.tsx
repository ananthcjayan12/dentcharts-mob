import React from 'react';

const WhatsAppHelpTab: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-8 overflow-y-auto max-h-[calc(100vh-250px)]">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">WhatsApp Integration Setup Guide</h1>
        <p className="text-gray-600">
          This guide provides step-by-step instructions for setting up the WhatsApp Cloud API integration in our system. 
          This integration allows you to send automated appointment reminders, prescriptions, invoices, and engage in two-way conversations with your patients.
        </p>
      </div>

      <div className="border-t border-gray-100 pt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">1. Prerequisites</h2>
        <ul className="list-disc ml-5 space-y-2 text-sm text-gray-700">
          <li>A <strong>Facebook Business Manager</strong> account.</li>
          <li>A <strong>WhatsApp Business</strong> account (verified if possible).</li>
          <li>A valid phone number to use for WhatsApp Business (cannot be used with a standard WhatsApp app simultaneously).</li>
        </ul>
      </div>

      <div className="border-t border-gray-100 pt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">2. Step 1: Meta Developer Portal Setup</h2>
        <ol className="list-decimal ml-5 space-y-2 text-sm text-gray-700">
          <li>Go to the <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">Meta for Developers Portal</a>.</li>
          <li>Click <strong>My Apps</strong> &gt; <strong>Create App</strong>.</li>
          <li>Select <strong>Other</strong> &gt; <strong>Business</strong> as the app type.</li>
          <li>Give your app a name (e.g., "Clinic WhatsApp Integration").</li>
          <li>Once the app is created, scroll down and click <strong>Set Up</strong> on the <strong>WhatsApp</strong> tile.</li>
          <li>Follow the prompts to select your Business Account.</li>
          <li>Under the <strong>API Setup</strong> tab, you will see your:
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li><strong>Phone Number ID</strong> (a long string of numbers).</li>
              <li><strong>WhatsApp Business Account ID</strong> (another long string of numbers).</li>
              <li><strong>Temporary Access Token</strong> (Note: do not use this for production, it expires in 24 hours).</li>
            </ul>
          </li>
        </ol>
      </div>

      <div className="border-t border-gray-100 pt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">3. Step 2: Get a Permanent Access Token</h2>
        <p className="text-sm text-gray-700 mb-3">Meta's default token expires quickly. For a production system, you need a <strong>System User Token</strong>:</p>
        <ol className="list-decimal ml-5 space-y-2 text-sm text-gray-700">
          <li>Go to <strong>Business Settings</strong> in Facebook Business Manager.</li>
          <li>Navigate to <strong>Users</strong> &gt; <strong>System Users</strong>.</li>
          <li>Click <strong>Add</strong> to create a new System User (Role: Admin).</li>
          <li>Select the user and click <strong>Add Assets</strong>.</li>
          <li>Select <strong>Apps</strong> &gt; [Your WhatsApp App] and enable <strong>Full Control</strong>.</li>
          <li>Click <strong>Generate New Token</strong>.</li>
          <li>Select your app from the list and check the <code>whatsapp_business_messaging</code> and <code>whatsapp_business_management</code> permissions.</li>
          <li><strong>Save this token securely.</strong> You will not be able to see it again!</li>
        </ol>
      </div>

      <div className="border-t border-gray-100 pt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">4. Step 3: Configure IDs and Tokens in the System</h2>
        <ol className="list-decimal ml-5 space-y-2 text-sm text-gray-700">
          <li>Open the <strong>WhatsApp Manager</strong> (this page) in the Settings tab.</li>
          <li>Toggle <strong>Enable WhatsApp Integration</strong> to "On".</li>
          <li>Enter the following details:
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li><strong>WhatsApp Phone Number ID</strong>: Copy from Meta API Setup.</li>
              <li><strong>WhatsApp Business Account ID</strong>: Copy from Meta API Setup.</li>
              <li><strong>WhatsApp Access Token</strong>: Paste the <strong>Permanent System User Token</strong> you generated.</li>
            </ul>
          </li>
          <li>(Optional) Enter your <strong>Template Names</strong> if you have pre-approved templates.</li>
          <li>Click <strong>Save Settings</strong>.</li>
        </ol>
      </div>

      <div className="border-t border-gray-100 pt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">5. Step 4: Configure Webhooks for Incoming Messages</h2>
        <p className="text-sm text-gray-700 mb-3">To receive replies from your patients, you must configure a Webhook in the Meta Developer Portal:</p>
        <ol className="list-decimal ml-5 space-y-2 text-sm text-gray-700">
          <li>In your Meta App, go to <strong>WhatsApp</strong> &gt; <strong>Configuration</strong>.</li>
          <li>Click <strong>Edit</strong> under Webhooks.</li>
          <li><strong>Callback URL</strong>: Use your domain followed by <code>/api/method/mob_clinic.mob_clinic.api.whatsapp.handle_webhook?clinic=[YOUR_CLINIC_NAME]</code>.</li>
          <li><strong>Verify Token</strong>: Enter your <strong>WhatsApp Business Account ID</strong> (WABA ID).</li>
          <li>Click <strong>Verify and Save</strong>.</li>
          <li>Under <strong>Webhook Fields</strong>, click <strong>Manage</strong> and subscribe to the <code>messages</code> field.</li>
        </ol>
      </div>

      <div className="border-t border-gray-100 pt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">6. Troubleshooting & Usage</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Troubleshooting</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>Messages not sending?</strong> Check Access Token and Meta balance.</li>
              <li>• <strong>Webhook not working?</strong> Ensure domain is public and HTTPS is enabled.</li>
              <li>• <strong>Outside 24-hour window?</strong> Meta only allows Template messages after 24h.</li>
            </ul>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">WhatsApp Manager Docs</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Chat:</strong> Two-way conversations with patients.</li>
              <li>• <strong>Logs:</strong> History and status of all messages.</li>
              <li>• <strong>Analytics:</strong> Usage metrics and failure rates.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppHelpTab;
