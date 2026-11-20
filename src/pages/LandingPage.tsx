import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dataProvider } from '../lib/dataProvider';
import { Workshop } from '../types/database';
import { formatCurrency } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import {
  ArrowRight,
  CheckCircle2,
  Users,
  Award,
  Video,
  FileCode2,
  Sparkles,
  HelpCircle,
  Clock,
  Layers,
  ChevronRight,
  ShieldCheck,
  Terminal,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    dataProvider.getWorkshops().then((data) => {
      setWorkshops(data);
      setIsLoading(false);
    });
  }, []);

  const steps = [
    { title: '1. Registration', desc: 'Sign up with college details and secure your workshop seat.' },
    { title: '2. Learning Modules', desc: 'Structured, NPTEL-style sequential module curriculum.' },
    { title: '3. Video Lectures', desc: 'Watch in-depth technical sessions with architectural blueprints.' },
    { title: '4. Hands-on Assignments', desc: 'Implement core algorithms, data models, and test suites.' },
    { title: '5. Capstone Project', desc: 'Build and deploy a full-scale cloud project to GitHub & Vercel.' },
    { title: '6. Technical Examination', desc: 'Time-constrained proctored evaluation of core concepts.' },
    { title: '7. Official Certification', desc: 'Earn verifiable industry-recognized credential with unique ID.' },
  ];

  const faqs = [
    {
      q: 'How does payment verification work?',
      a: 'After registering for your chosen workshop, you will be prompted to submit your UPI or bank transaction reference. Our administration team verifies the transaction and immediately activates your full workshop access.',
    },
    {
      q: 'Are the video lectures pre-recorded or live?',
      a: 'TNV Workshop uses a hybrid model. Core deep-dive curriculum is delivered through high-definition sessions, complemented by scheduled interactive live weekend masterclasses with Dr. T. N. Venkatesh for doubt clearance.',
    },
    {
      q: 'What are the criteria for receiving the certificate?',
      a: 'To receive the verified Certificate of Industry Excellence, students must complete at least 75% of modules, submit all required assignments, pass the capstone project review, and achieve passing marks on the examination.',
    },
    {
      q: 'Can I access the workshop materials after completion?',
      a: 'Yes, enrolled students retain lifetime access to lecture slides, downloadable cheat sheets, architecture blueprints, and workshop reference code.',
    },
  ];

  return (
    <div className="space-y-20 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(50,126,255,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(30,58,183,0.25),rgba(4,7,13,0))]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 dark:bg-brand-950/60 dark:border-brand-800 dark:text-brand-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>Next Cohort Starts in 5 Days • Limited Seats</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
                Practical Engineering. <br />
                <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 bg-clip-text text-transparent">
                  Real Production Systems.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                TNV Workshop is an intensive, outcome-oriented learning management platform. Go beyond static tutorials: build real cloud applications, master PostgreSQL & RLS, complete proctored exams, and earn industry-verified certificates.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <Link to="/register">
                  <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Register Now
                  </Button>
                </Link>
                <Link to="/workshops">
                  <Button variant="outline" size="lg">
                    Explore Workshops
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>College-Recognized</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Verified PDF Certificate</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <Users className="w-4 h-4 text-brand-500" />
                  <span>Active WhatsApp Mentorship</span>
                </div>
              </div>
            </div>

            {/* Visual Learning Representation Card */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">tnv-lms-v2.0</span>
                </div>

                <div className="py-5 space-y-4 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 text-slate-100 flex items-center justify-between shadow-inner">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-brand-400" />
                      <span>$ init workshop --approved</span>
                    </div>
                    <span className="text-emerald-400 text-[10px]">SUCCESS</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400">Course Progress: Full-Stack Cloud</span>
                      <span className="font-bold text-brand-600 dark:text-brand-400">82%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-brand-600 rounded-full w-[82%]"></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                      <p className="text-[10px] text-slate-400 uppercase">Assignments</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">2 / 2 Evaluated</p>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                      <p className="text-[10px] text-slate-400 uppercase">Exam Score</p>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">40 / 50 (Passed)</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-center gap-2.5 text-amber-800 dark:text-amber-300">
                    <Award className="w-5 h-5 text-amber-600 shrink-0" />
                    <div className="text-[11px] leading-tight">
                      <p className="font-bold">Certificate Eligible</p>
                      <p className="text-[10px] opacity-80">Unique ID: TNV-2024-A8F29C14</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ABOUT TNV WORKSHOP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white border border-slate-200/80 p-8 sm:p-12 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="max-w-3xl space-y-4">
            <Badge variant="brand">About TNV Workshop</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Bridging University Curriculums with Industry Software Standards
            </h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm sm:text-base">
              Founded and mentored by veteran software architects, TNV Workshop transforms aspiring college engineers into competent full-stack and systems practitioners. We don’t just teach syntax; we dive deep into database normalization, multi-tenant Row Level Security, scalable component trees, and real-time event architectures.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <FileCode2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Hands-on Architecture</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Work on actual production patterns rather than toy apps. Build multi-tenant databases with Supabase and deploy live.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Strict Quality & Verification</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Every code submission, assignment and capstone is evaluated by seasoned mentors before completion credits are granted.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Dedicated Doubts Community</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Direct WhatsApp peer community and scheduled live interaction sessions ensure you never get stuck on a roadblock.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. AVAILABLE WORKSHOPS (Dynamically retrieved from database) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <Badge variant="brand">Featured Curriculum</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
              Active Industry Workshops
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Live database offerings with verified mentor curriculum and limited enrollment seats.
            </p>
          </div>
          <Link to="/workshops">
            <Button variant="outline" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
              View All Workshops
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-96 rounded-2xl bg-slate-100 dark:bg-slate-800/60 animate-pulse"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {workshops.map((w) => (
              <Card key={w.id} className="flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300 group border-slate-200 dark:border-slate-800">
                <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                  <img
                    src={w.thumbnail_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800'}
                    alt={w.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge variant="brand" className="backdrop-blur-md bg-white/90 dark:bg-slate-900/90 shadow-sm font-bold">
                      {formatCurrency(w.price)}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="text-[11px] font-semibold text-white bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-md">
                      {w.duration}
                    </span>
                  </div>
                </div>

                <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1 group-hover:text-brand-600 transition-colors">
                      {w.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {w.short_description || w.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-medium text-slate-500">Instructor:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{w.instructor_name}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Available Seats:</span>
                      <span className="font-bold text-brand-600 dark:text-brand-400">
                        {w.available_seats} / {w.total_seats}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Link to={`/workshops/${w.slug}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          Details
                        </Button>
                      </Link>
                      <Link to={`/register?workshop=${w.id}`} className="flex-1">
                        <Button variant="primary" size="sm" className="w-full">
                          Enroll
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* 4. SEVEN-STEP LEARNING PROCESS (NPTEL-style) */}
      <section className="bg-slate-900 text-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold tracking-widest text-brand-400 uppercase">
              Curriculum Progression
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              The 7-Step Learning Engine
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Modeled after premier national technology initiatives like NPTEL, our framework enforces genuine technical accomplishment at every milestone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((st, idx) => (
              <div
                key={st.title}
                className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-brand-500/60 transition-all space-y-2 relative"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white font-bold text-xs mb-3">
                  0{idx + 1}
                </div>
                <h4 className="font-bold text-sm text-white">{st.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FREQUENTLY ASKED QUESTIONS */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <Badge variant="brand">Got Questions?</Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {faqs.map((faq) => (
            <div
              key={faq.q}
              className="p-6 rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 space-y-2 shadow-sm"
            >
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-brand-600 shrink-0" />
                {faq.q}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-6">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. CALL TO ACTION BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-brand-600 via-brand-700 to-indigo-700 p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to Upgrade Your Engineering Career?
            </h3>
            <p className="text-brand-100 text-sm leading-relaxed">
              Join hundreds of engineering students already enrolled in TNV Workshop cohorts. Register today to lock in your seat and start building.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <Link to="/register">
              <Button variant="secondary" size="lg" className="bg-white text-slate-900 hover:bg-slate-100 font-bold">
                Register for Workshop
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" size="lg" className="text-white border-white/40 hover:bg-white/10">
                Contact Helpline
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
