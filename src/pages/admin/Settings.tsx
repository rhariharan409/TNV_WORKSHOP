import React, { useEffect, useState } from 'react';
import { dataProvider } from '../../lib/dataProvider';
import { AdminSettings } from '../../types/database';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Settings, Save, CheckCircle2, MessageCircle, CreditCard, Award, HelpCircle } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [upiId, setUpiId] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [signatory, setSignatory] = useState('Thamilaran');
  const [signatoryTitle, setSignatoryTitle] = useState('Program Director & Chief Architect');

  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    dataProvider.getAdminSettings().then((s) => {
      setSettings(s);
      setWhatsappUrl(s.whatsapp_group_url || '');
      setSupportEmail(s.support_email || '');
      setSupportPhone(s.support_phone || '');
      setUpiId(s.payment_upi_id || '');
      setQrCodeUrl(s.payment_qr_code_url || '');
      if (s.certificate_signatory) setSignatory(s.certificate_signatory);
      if (s.certificate_title) setSignatoryTitle(s.certificate_title);
    }).catch(err => {
      console.error('Error loading admin settings:', err);
    });
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    try {
      await dataProvider.updateAdminSettings({
        whatsapp_group_url: whatsappUrl,
        support_email: supportEmail,
        support_phone: supportPhone,
        payment_upi_id: upiId,
        payment_qr_code_url: qrCodeUrl,
        certificate_signatory: signatory,
        certificate_title: signatoryTitle,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      setErrorMessage(err.message || 'Failed to save settings to database');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <Badge variant="brand">Configuration Engine</Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
          Platform & Workshop Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure the active WhatsApp community channel, payment gateway UPI details, and certificate signatories dynamically.
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center gap-2 border border-emerald-200 shadow-sm">
          <CheckCircle2 className="w-5 h-5" /> Settings updated successfully in database! Changes reflect immediately across all portals.
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-2 border border-rose-200 shadow-sm">
          <Settings className="w-5 h-5 text-rose-500" /> {errorMessage}
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* WhatsApp & Community Settings (Section 14) */}
        <Card wavy className="p-6 sm:p-8 space-y-5 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Doubt Clarification & WhatsApp Community
              </h2>
              <p className="text-xs text-slate-500">
                Update the official WhatsApp group link accessible to all registered and approved students.
              </p>
            </div>
          </div>

          <Input
            label="WhatsApp Community Group Link *"
            placeholder="https://chat.whatsapp.com/..."
            value={whatsappUrl}
            onChange={(e) => setWhatsappUrl(e.target.value)}
            helperText="Students click 'Join WhatsApp Group' on their dashboard to access this link directly."
            required
          />
        </Card>

        {/* Manual Payment UPI Settings (Section 4) */}
        <Card wavy className="p-6 sm:p-8 space-y-5 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Payment Verification Information
              </h2>
              <p className="text-xs text-slate-500">
                Configure the manual payment receiver information displayed to students with pending verification.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Official Receiver UPI ID *"
              placeholder="tnvworkshop@okhdfcbank"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              required
            />

            <Input
              label="Payment QR Code Image URL"
              placeholder="https://images.unsplash.com/..."
              value={qrCodeUrl}
              onChange={(e) => setQrCodeUrl(e.target.value)}
            />
          </div>
        </Card>

        {/* Certificate Customization & Signatory (Section 15) */}
        <Card wavy className="p-6 sm:p-8 space-y-5 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Certificate Credentials & Signatory
              </h2>
              <p className="text-xs text-slate-500">
                Printed on downloadable PDF certificates generated for graduating students.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Primary Signatory Name *"
              value={signatory}
              onChange={(e) => setSignatory(e.target.value)}
              required
            />

            <Input
              label="Primary Signatory Title *"
              value={signatoryTitle}
              onChange={(e) => setSignatoryTitle(e.target.value)}
              required
            />
          </div>
        </Card>

        {/* Support Helpline Settings */}
        <Card wavy className="p-6 sm:p-8 space-y-5 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Helpline Contacts
              </h2>
              <p className="text-xs text-slate-500">
                Displayed in landing page footer and student support channels.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Support Email *"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              required
            />

            <Input
              label="Academic Helpline Phone *"
              value={supportPhone}
              onChange={(e) => setSupportPhone(e.target.value)}
              required
            />
          </div>
        </Card>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSaving}
            className="font-bold shadow-md"
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save All Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
