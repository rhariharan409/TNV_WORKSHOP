import React, { useEffect, useState } from 'react';
import { dataProvider } from '../../lib/dataProvider';
import { AdminSettings } from '../../types/database';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { MessageCircle, HelpCircle, Mail, Phone, ExternalLink, ShieldCheck } from 'lucide-react';

export const Doubts: React.FC = () => {
  const [settings, setSettings] = useState<AdminSettings | null>(null);

  useEffect(() => {
    dataProvider.getAdminSettings().then(setSettings);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <Badge variant="brand">Peer & Mentor Support</Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
          Workshop Doubts & Community
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Connect directly with your batchmates, teaching assistants, and Thamilaran on WhatsApp for quick doubt resolution.
        </p>
      </div>

      {/* Main WhatsApp Card */}
      <Card className="overflow-hidden border-emerald-200 dark:border-emerald-900/60 shadow-lg bg-gradient-to-br from-emerald-50/50 via-white to-emerald-50/30 dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900 p-8 sm:p-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shrink-0">
              <MessageCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Official Batch WhatsApp Community
              </h2>
              <p className="text-xs text-slate-500">
                Live peer channels, session reminders, code snippets, and direct access to instructor.
              </p>
            </div>
          </div>

          <a
            href={settings?.whatsapp_group_url || 'https://chat.whatsapp.com'}
            target="_blank"
            rel="noreferrer"
            className="shrink-0"
          >
            <Button
              variant="success"
              size="lg"
              className="font-bold shadow-md"
              rightIcon={<ExternalLink className="w-4 h-4" />}
            >
              Join WhatsApp Group
            </Button>
          </a>
        </div>

        <div className="pt-4 border-t border-emerald-100 dark:border-emerald-900/60 text-xs text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Configured and monitored by TNV Workshop academic coordination desk.</span>
        </div>
      </Card>

      {/* Additional Help Channels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card className="p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400 flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Email Query Support</h3>
          <p className="text-xs text-slate-500">
            For code reviews, assignment clarification, or evaluation feedback inquiries.
          </p>
          <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">
            {settings?.support_email || 'support@tnvworkshop.edu.in'}
          </p>
        </Card>

        <Card className="p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400 flex items-center justify-center">
            <Phone className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Academic Helpline</h3>
          <p className="text-xs text-slate-500">
            Available Monday to Saturday from 9:00 AM to 7:00 PM for enrollment and portal issues.
          </p>
          <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">
            {settings?.support_phone || '+91 98765 43210'}
          </p>
        </Card>
      </div>
    </div>
  );
};
