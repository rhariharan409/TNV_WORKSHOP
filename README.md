# TNV Workshop – Complete Workshop Learning Management System (LMS)

[![React 18](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%26%20RLS-3ecf8e.svg)](https://supabase.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**TNV Workshop** is a production-grade, enterprise-scale Workshop Learning Management System (LMS) specifically designed for modern engineering workshops, outcome-based certifications, and future integration with the broader **TNV Hub** ecosystem.

It provides a dual experience:
1. **Public Discovery Website**: High-conversion landing page with active database offerings, 7-step NPTEL curriculum breakdown, FAQ, and public certificate verification.
2. **Student Learning Portal**: Structured courses, hierarchical modules, Google Drive video lectures, downloadable notes, graded assignments, capstone project repository review, time-constrained proctored examinations, live masterclasses, and verifiable PDF certificate generation.
3. **Administrator Operations Dashboard**: Real-time Recharts analytics, manual UPI payment verification & student enrollment approvals, workshops CRUD, module/session manager, assignment grader, capstone reviewer, examination builder, live session scheduler, attendance marking sheets, certificate issuance/revocation, student complaints manager, and CSV reporting.

---

## 1. Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React icons
- **State Management & Server Cache**: TanStack React Query (`@tanstack/react-query`)
- **Routing**: React Router DOM v6
- **Database & Authentication**: Supabase, PostgreSQL 15, Row Level Security (RLS)
- **Analytics & Visualizations**: Recharts
- **PDF Generation**: jsPDF (with high-res vector rendering, signature blocks, and verification codes)
- **Deployment**: Vercel (Frontend), Supabase (Database, Auth, and Storage)

---

## 2. Database Schema (32 Entities)

The PostgreSQL database is organized into 32 relational entities defined in `supabase/migrations/`:

| # | Table Name | Purpose |
|---|------------|---------|
| 1 | `profiles` | Extended user identity (College, department, year, role, suspension status) |
| 2 | `workshops` | Workshop offerings, capacity, pricing, duration, instructor profile |
| 3 | `workshop_enrollments` | Student enrollment state machine (`registered`, `payment_pending`, `payment_verification_pending`, `approved`, `rejected`, `suspended`) |
| 4 | `payments` | Transaction references, UPI receipts, verification audit logs |
| 5 | `courses` | Specific courses mapped to workshops |
| 6 | `course_enrollments` | Course-level tracking and progress milestones |
| 7 | `modules` | Sequenced modules within a course (NPTEL-style) |
| 8 | `sessions` | Sessions inside modules (Lectures, readings, lab exercises) |
| 9 | `video_lectures` | Google Drive lecture embed links and duration |
| 10 | `learning_materials` | Downloadable PDF handouts, slides, and external references |
| 11 | `session_progress` | Granular student completion per session |
| 12 | `assignments` | Assignment briefs, max marks, passing marks, deadlines |
| 13 | `assignment_questions` | Individual assignment questions and criteria |
| 14 | `assignment_submissions` | Student code solutions, GitHub URLs, evaluator marks, and feedback |
| 15 | `quizzes` | Module-level self-assessments |
| 16 | `quiz_questions` | Multiple-choice questions with server-side validation |
| 17 | `quiz_attempts` | Student quiz attempt records |
| 18 | `quiz_answers` | Granular question-level student selections |
| 19 | `projects` | Capstone project briefs and requirements |
| 20 | `project_submissions` | GitHub repo URL, live demo URL, status, and marks |
| 21 | `examinations` | Proctored qualification exams with timer durations |
| 22 | `exam_questions` | Exam MCQs and option arrays |
| 23 | `exam_attempts` | Proctored exam attempt sessions and scores |
| 24 | `exam_answers` | Granular answer submissions |
| 25 | `live_sessions` | Scheduled Google Meet / Zoom masterclasses |
| 26 | `attendance` | Live session student attendance logs (`present`, `absent`, `excused`) |
| 27 | `certificates` | Official certificates with unique alphanumeric codes (`TNV-YYYY-XXXXXXXX`) |
| 28 | `feedback` | Complaints, technical bug reports, and suggestions with admin replies |
| 29 | `notifications` | Real-time in-app user notifications |
| 30 | `activity_logs` | Audit trail for security and grading operations |
| 31 | `admin_settings` | Dynamic runtime settings (WhatsApp link, UPI ID, helpline numbers) |
| 32 | `certificate_templates`| Certificate signatory configurations and eligibility thresholds |

---

## 3. SQL Migrations

Located in `supabase/migrations/`:
- `20240101000000_initial_schema.sql` – All 32 tables, foreign keys, cascades, enums, and performance indexes.
- `20240101000001_security_policies.sql` – Row Level Security (RLS) policies protecting student privacy and payment access controls.
- `20240101000002_functions_and_triggers.sql` – Stored procedures, auth signup profile trigger, server-side quiz & exam scoring RPCs, and certificate eligibility validator.
- `20240101000003_seed_data.sql` – Production-ready seed data containing workshops, courses, modules, Google Drive lectures, assignments, quizzes, and live sessions.

---

## 4. Local Development Setup

### Prerequisites
- Node.js v18 or higher (tested on Node v24)
- npm or pnpm

### Step 1: Clone and Install Dependencies
```bash
git clone <repository-url>
cd TNV_WORKSHOP_NEW
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_APP_NAME="TNV Workshop"
VITE_APP_URL=http://localhost:5173
VITE_DEFAULT_WHATSAPP_URL=https://chat.whatsapp.com/TNVWorkshop2024DevCommunity
```

> **Note**: Even without connecting to a live Supabase project initially, the application includes a **Full Reactive Local State Provider**. All buttons, forms, student payments, admin approvals, exams, and PDF certificate downloads work out of the box!

### Step 3: Run the Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### Step 4: Build for Production
```bash
npm run build
```

---

## 5. Supabase Setup Instructions

1. Sign up or log in at [supabase.com](https://supabase.com).
2. Create a new project called `tnv-workshop-lms`.
3. Navigate to **SQL Editor** in the Supabase Dashboard.
4. Execute the migration scripts sequentially:
   - Run `supabase/migrations/20240101000000_initial_schema.sql`
   - Run `supabase/migrations/20240101000001_security_policies.sql`
   - Run `supabase/migrations/20240101000002_functions_and_triggers.sql`
   - Run `supabase/migrations/20240101000003_seed_data.sql`
5. Go to **Project Settings > API**, copy your `URL` and `anon public key`, and paste them into your `.env` file.

### Admin Account Creation in Supabase
To grant administrator access to a user in Supabase:
1. Register a user in the frontend or through the Supabase **Authentication** panel.
2. In the **SQL Editor**, execute:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE email = 'your-admin-email@tnvworkshop.edu.in';
   ```

---

## 6. Default Demo Credentials

For quick evaluation and testing of all role permissions, use the quick-fill buttons on `/login` or the top preview banner:
- **Student Account**: `student@tnvworkshop.edu.in` (Password: `DemoStudent123!`)
- **Admin Account**: `admin@tnvworkshop.edu.in` (Password: `DemoAdmin123!`)

---

## 7. Production Deployment on Vercel

1. Push this repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_URL`
4. Deploy! Vercel will build the Vite React application and serve it globally with edge caching.

---

## 8. Future TNV Hub Architecture

The TNV Workshop application is architected for modular integration into the future **TNV Hub** ecosystem:
- Auth logic is decoupled inside `src/context/AuthContext.tsx`.
- User profiles maintain universal identifiers (`UUID`).
- APIs and service providers are abstracted behind `src/lib/dataProvider.ts`, ready for future SSO (Single Sign-On) and OAuth2 providers.
#   T N V _ W O R K S H O P  
 