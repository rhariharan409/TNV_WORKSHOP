import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dataProvider } from '../lib/dataProvider';
import { Course } from '../types/database';
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
  BookOpen,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    dataProvider.getCourses({ publishedOnly: true }).then((data) => {
      setCourses(data);
      setIsLoading(false);
    });
  }, []);

  const steps = [
    { title: '1. Registration', desc: 'Sign up with college details and secure your workshop seat.' },
    { title: '2. Learning Modules', desc: 'Structured, industry-aligned sequential module curriculum.' },
    { title: '3. Video Lectures', desc: 'Watch in-depth technical sessions with architectural blueprints.' },
    { title: '4. Hands-on Assignments', desc: 'Implement core algorithms, data models, and test suites.' },
    { title: '5. Technical Examination', desc: 'Time-constrained proctored evaluation of core concepts.' },
    { title: '6. Official Certification', desc: 'Earn verifiable industry-recognized credential with unique ID.' },
  ];

  const faqs = [
    {
      q: 'How does payment verification work?',
      a: 'After registering for your chosen workshop, you will be prompted to submit your UPI or bank transaction reference. Our administration team verifies the transaction and immediately activates your full workshop access.',
    },
    {
      q: 'Are the video lectures pre-recorded or live?',
      a: 'TNV Workshop uses a hybrid model. Core deep-dive curriculum is delivered through high-definition sessions, complemented by scheduled interactive live weekend masterclasses with Thamilaran for doubt clearance.',
    },
    {
      q: 'What are the criteria for receiving the certificate?',
      a: 'To receive the verified Certificate of Industry Excellence, students must complete at least 75% of modules, submit all required assignments, and achieve passing marks on the examination.',
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
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(27,107,58,0.18),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(18,77,41,0.35),rgba(4,7,13,0))]"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-green-tint border border-brand-200 text-brand-green-dark dark:bg-brand-950/80 dark:border-brand-800 dark:text-brand-300 text-xs font-semibold">
                <img src="/tnv-logo.png" alt="TNV Crest" className="w-4 h-4 rounded-full object-contain" />
                <span>Tamil Nadu Volunteers • Next Cohort Starts Soon</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
                Practical Engineering. <br />
                <span className="bg-gradient-to-r from-brand-green via-emerald-600 to-brand-green-dark dark:from-emerald-400 dark:via-brand-200 dark:to-brand-green bg-clip-text text-transparent">
                  Real Production Systems.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                TNV Workshop is the technical learning division of <span className="font-semibold text-brand-green dark:text-brand-300">Tamil Nadu Volunteers (தமிழ்நாடு தன்னார்வலர்கள்)</span>. Go beyond static tutorials: build real cloud applications, master PostgreSQL & RLS, complete proctored exams, and earn industry-verified certificates.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <Link to="/register">
                  <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Register Now
                  </Button>
                </Link>
                <Link to="/student/available-courses">
                  <Button variant="outline" size="lg">
                    Explore Courses
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-brand-green" />
                  <span>College-Recognized</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <Award className="w-4 h-4 text-brand-yellow" />
                  <span>Verified PDF Certificate</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <Users className="w-4 h-4 text-brand-green" />
                  <span>Active TNV Mentorship</span>
                </div>
              </div>
            </div>

            {/* Visual Learning Representation Card */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-2xl backdrop-blur-xl dark:border-brand-900/40 dark:bg-slate-900/90">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">tnv-workshop-academy v2.0</span>
                </div>

                <div className="py-5 space-y-4 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-navy-900 text-slate-100 flex items-center justify-between shadow-inner border border-brand-900/50">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-brand-yellow" />
                      <span>$ tnv-academy enroll --verified</span>
                    </div>
                    <span className="text-emerald-400 text-[10px] font-bold">READY</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400">Course Progress: Full-Stack Cloud</span>
                      <span className="font-bold text-brand-green dark:text-emerald-400">82%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-brand-green rounded-full w-[82%]"></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                      <p className="text-[10px] text-slate-400 uppercase">Assignments</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">2 / 2 Evaluated</p>
                    </div>
                    <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                      <p className="text-[10px] text-slate-400 uppercase">Exam Score</p>
                      <p className="text-sm font-bold text-brand-green dark:text-emerald-400 mt-0.5">40 / 50 (Passed)</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-brand-yellow-tint dark:bg-amber-950/30 border border-amber-300 dark:border-amber-900/60 flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
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
        <div className="rounded-3xl bg-white border border-slate-200/80 p-8 sm:p-12 shadow-sm dark:bg-slate-900 dark:border-brand-900/40">
          <div className="max-w-3xl space-y-4">
            <Badge variant="brand">About TNV Workshop Academy</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Empowering Tamil Nadu's Next-Gen Engineers with Real Industry Standards
            </h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm sm:text-base">
              Founded under the banner of <span className="font-semibold text-brand-green dark:text-brand-300">Tamilnadu Volunteers Trust</span>, the TNV Workshop Academy bridges the critical gap between university syllabi and enterprise production engineering. We guide students through rigorous architectural patterns, multi-tenant databases, strict Row Level Security, full-stack deployment pipelines, and verifiable industry certifications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            <div className="p-6 rounded-2xl bg-brand-50/60 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900/50 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-green text-white flex items-center justify-center font-bold shadow-xs">
                <FileCode2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Production Architectures</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Work on actual production code bases rather than toy examples. Build scalable PostgreSQL schemas, implement microservices, and deploy live.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-brand-yellow-tint/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-brand-yellow text-slate-900 flex items-center justify-center font-bold shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Verified Academic Quality</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Every code submission, assignment, and proctored examination is rigorously evaluated before official credentials are authenticated and issued.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center font-bold shadow-xs">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">TNV Volunteer Network</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Direct peer mentorship, interactive doubt clearance masterclasses, and an active statewide student engineering community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. AVAILABLE COURSES (Dynamically retrieved from database) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <Badge variant="brand">Featured Curriculum</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
              Active Industry Courses
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Interactive sequential modules, full video lectures, and graded evaluations.
            </p>
          </div>
          <Link to="/student/available-courses">
            <Button variant="outline" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
              View All Courses
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-96 rounded-2xl bg-slate-100 dark:bg-slate-800/60 animate-pulse"></div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <Card className="p-12 text-center text-slate-500 border-slate-200 dark:border-slate-800">
            <BookOpen className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h4 className="font-bold text-base text-slate-900 dark:text-white">Courses Coming Soon</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              New syllabus tracks and interactive modules are currently being prepared by our architects.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {courses.map((c) => (
              <Card key={c.id} className="flex flex-col overflow-hidden hover:shadow-xl hover:border-brand-green/40 transition-all duration-300 group border-slate-200 dark:border-slate-800">
                <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                  <img
                    src={c.thumbnail_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800'}
                    alt={c.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge variant="brand" className="shadow-sm font-bold">
                      {c.category || 'Technical Track'}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="text-[11px] font-semibold text-white bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-md">
                      {c.duration || 'Self-Paced'}
                    </span>
                  </div>
                </div>

                <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1 group-hover:text-brand-green transition-colors">
                      {c.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {c.description || 'Hands-on curriculum with sequential learning modules, video lectures, and graded evaluations.'}
                    </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-medium text-slate-500">Instructor:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{c.instructor_name || 'Thamilaran'}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Link to="/student/available-courses" className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          Preview
                        </Button>
                      </Link>
                      <Link to={`/register?course=${c.id}`} className="flex-1">
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

      {/* 4. SEVEN-STEP LEARNING PROCESS (TNV Architecture) */}
      <section className="bg-navy-800 text-white py-16 lg:py-24 border-y border-brand-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold tracking-widest text-brand-yellow uppercase">
              Curriculum Progression
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              The 7-Step Learning Engine
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Modeled after premier national technology standards, our framework enforces genuine technical accomplishment at every milestone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((st, idx) => (
              <div
                key={st.title}
                className="p-6 rounded-2xl bg-navy-900/90 border border-brand-900/40 hover:border-brand-yellow/60 transition-all space-y-2 relative group shadow-sm"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-green group-hover:bg-brand-yellow group-hover:text-slate-900 text-white font-bold text-xs mb-3 transition-colors">
                  0{idx + 1}
                </div>
                <h4 className="font-bold text-sm text-white">{st.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{st.desc}</p>
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
                <HelpCircle className="w-4 h-4 text-brand-green shrink-0" />
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
        <div className="rounded-3xl bg-gradient-to-r from-brand-green-dark via-brand-green to-emerald-900 p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 border border-brand-green/30">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to Upgrade Your Engineering Career?
            </h3>
            <p className="text-brand-100 text-sm leading-relaxed">
              Join engineering students across Tamil Nadu already learning in TNV Workshop cohorts. Register today to lock in your seat and build real systems.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <Link to="/register">
              <Button variant="yellow" size="lg" className="font-bold">
                Register & Start Learning
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
