import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Mail, Phone, MapPin, Send, MessageCircle, CheckCircle2 } from 'lucide-react';
import { isValidEmail } from '../lib/utils';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError(null);
    setSent(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Contact & Academic Helpline</h1>
        <p className="text-xs text-slate-500">Have questions about enrollment, syllabus, or payment verification? Reach our coordination desk.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 max-w-5xl mx-auto">
        {/* Info Column */}
        <div className="md:col-span-5 space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">TNV Trust Coordination Desk</h3>
            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-brand-green shrink-0" />
                <span>support@tnvolunteers.in</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-brand-green shrink-0" />
                <span>+91 90872 93339 (Official TNV Helpline)</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
                <span>Tamilnadu Volunteers Trust, No. 34, CIT Nagar 1st Main Road, CIT Nagar West, CIT Nagar, Chennai, Tamil Nadu 600035</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <a
                href="https://chat.whatsapp.com/TNVWorkshop2024DevCommunity"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Join Official WhatsApp Support</span>
              </a>
            </div>
          </Card>
        </div>

        {/* Form Column */}
        <div className="md:col-span-7">
          <Card wavy className="p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg">Send a Direct Message</CardTitle>
              <CardDescription className="text-xs">We typically respond within 2-4 business hours.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {sent ? (
                <div className="text-center py-8 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Inquiry Received</h4>
                  <p className="text-xs text-slate-500">Thank you for contacting TNV Workshop. Our academic counselor will reach out shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold">
                      {error}
                    </div>
                  )}
                  <Input
                    label="Full Name *"
                    placeholder="e.g. Priyadarshini M."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <Input
                    label="Email Address *"
                    type="email"
                    placeholder="student@college.edu.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Message / Question *
                    </label>
                    <textarea
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Ask about workshops, payment verification, or syllabus..."
                      className="w-full rounded-2xl border-none bg-[#eef3f8] dark:bg-slate-800 p-3.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]"
                      required
                    ></textarea>
                  </div>
                  <Button type="submit" variant="primary" size="lg" className="w-full" rightIcon={<Send className="w-4 h-4" />}>
                    Submit Inquiry
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
