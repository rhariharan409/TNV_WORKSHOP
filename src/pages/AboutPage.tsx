import React from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { GraduationCap, ShieldCheck, Cpu, Code2, Users2, Target } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* Intro */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="brand">Academic Engineering Excellence</Badge>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Empowering Next-Generation Software Architects
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          TNV Workshop was established to close the critical divide between standard academic theory and actual production engineering. We train students to build resilient, cloud-ready software systems with rigorous engineering standards.
        </p>
      </div>

      {/* Core Principles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="p-6 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400 flex items-center justify-center font-bold">
            <Code2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Relational Data & Security</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            We prioritize secure database normalization, Row Level Security, transactions, and index tuning rather than superficial frontend prototypes.
          </p>
        </Card>

        <Card className="p-6 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Strict Verification</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Certificates are strictly earned, not purchased. Students must satisfy module completion, graded assignments, project evaluations, and proctored exams.
          </p>
        </Card>

        <Card className="p-6 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center font-bold">
            <Users2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Architect Mentorship</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Guided by Dr. T. N. Venkatesh and industry engineering leaders who review real student GitHub repositories and provide architectural feedback.
          </p>
        </Card>
      </div>

      {/* Leadership Profile */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 sm:p-12 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        <div className="md:col-span-4 flex flex-col items-center text-center space-y-3">
          <div className="h-32 w-32 rounded-3xl overflow-hidden shadow-lg border-2 border-brand-500">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400"
              alt="Dr. T. N. Venkatesh"
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <h4 className="font-bold text-base text-slate-900 dark:text-white">Dr. T. N. Venkatesh</h4>
            <p className="text-xs text-brand-600 dark:text-brand-400 font-semibold">Chief Architect & Program Director</p>
          </div>
        </div>
        <div className="md:col-span-8 space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            With over 18 years in high-throughput distributed systems and enterprise software architecture, Dr. Venkatesh leads the technical curriculum at TNV Workshop. His mission is to bring genuine engineering discipline to university talent through verifiable project execution.
          </p>
          <p>
            The TNV Workshop platform is specifically architected as an extensible learning ecosystem, designed for seamless future integration into the broader <strong>TNV Hub</strong> developer ecosystem.
          </p>
        </div>
      </div>
    </div>
  );
};
