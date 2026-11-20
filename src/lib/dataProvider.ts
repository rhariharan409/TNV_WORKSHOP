import { supabase, isSupabaseConfigured } from './supabase';
import {
  Workshop,
  WorkshopEnrollment,
  Payment,
  Course,
  Module,
  Session,
  VideoLecture,
  LearningMaterial,
  SessionProgress,
  Assignment,
  AssignmentSubmission,
  Quiz,
  QuizQuestion,
  QuizAttempt,
  Project,
  ProjectSubmission,
  Examination,
  ExamQuestion,
  ExamAttempt,
  LiveSession,
  Attendance,
  Certificate,
  Feedback,
  Notification,
  AdminSettings,
  Profile,
} from '../types/database';
import { generateUUID } from './utils';

const STORAGE_PREFIX = 'tnv_lms_';

function getLocalStore<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setLocalStore<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to save to local storage: ${key}`, err);
  }
}

// Default Seed Data for In-Memory / Local Storage state
const SEED_WORKSHOPS: Workshop[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    title: 'Full-Stack Cloud & AI Engineering',
    slug: 'full-stack-cloud-ai-engineering',
    short_description: 'Master modern React, TypeScript, Supabase, PostgreSQL, and Gemini AI integration to build enterprise-grade cloud applications.',
    description: 'This intensive 6-week hands-on workshop takes students through the complete modern full-stack development cycle. You will learn frontend mastery with React, Vite, and Tailwind, secure relational database modeling with PostgreSQL and Supabase, robust Role-Based Access Control, edge computing, AI orchestration, and production deployment on Vercel.',
    thumbnail_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
    duration: '6 Weeks (36 Hours)',
    instructor_name: 'Dr. T. N. Venkatesh',
    instructor_title: 'Chief Architect & Senior Software Engineer',
    instructor_bio: 'Over 18 years of experience leading engineering teams at top-tier software organizations. Specialized in scalable distributed systems and cloud-native architectures.',
    instructor_avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    total_seats: 120,
    available_seats: 38,
    price: 4999,
    is_active: true,
    start_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 47 * 86400000).toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    title: 'Embedded Systems & Edge AI Bootcamp',
    slug: 'embedded-systems-edge-ai',
    short_description: 'Design hardware-software integrated IoT systems with ESP32, FreeRTOS, TinyML, and MQTT cloud pipelines.',
    description: 'Bridging firmware and cloud. Explore microcontroller architecture, real-time operating systems, sensor fusion, wireless communication protocols, and deploy lightweight neural networks on edge silicon.',
    thumbnail_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
    duration: '4 Weeks (24 Hours)',
    instructor_name: 'Prof. Rajesh K. Sharma',
    instructor_title: 'Principal IoT Systems Researcher',
    instructor_bio: 'Former Senior Firmware Architect with multiple patents in low-power industrial telemetry and sensor networks.',
    instructor_avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    total_seats: 80,
    available_seats: 15,
    price: 3999,
    is_active: true,
    start_date: new Date(Date.now() + 12 * 86400000).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 40 * 86400000).toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  },
  {
    id: 'a0000000-0000-0000-0000-000000000003',
    title: 'Cybersecurity & DevSecOps Mastery',
    slug: 'cybersecurity-devsecops-mastery',
    short_description: 'From vulnerability research and OWASP Top 10 mitigation to zero-trust architecture and automated CI/CD security scanning.',
    description: 'Understand red and blue team methodologies. Perform web penetration testing, network traffic analysis, container hardening, secrets management, and automated SAST/DAST pipelines.',
    thumbnail_url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
    duration: '5 Weeks (30 Hours)',
    instructor_name: 'Arunachalam V.',
    instructor_title: 'Lead Security Architect & Ethical Hacker',
    instructor_bio: 'Certified Information Systems Security Professional (CISSP) and active security researcher with bug bounties from global Fortune 500 tech companies.',
    instructor_avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    total_seats: 100,
    available_seats: 44,
    price: 4499,
    is_active: true,
    start_date: new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 55 * 86400000).toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  },
];

const SEED_COURSES: Course[] = [
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    workshop_id: 'a0000000-0000-0000-0000-000000000001',
    title: 'Full-Stack Architecture & Cloud Database Engineering',
    slug: 'fullstack-architecture-cloud-database',
    description: 'Core architecture, database normalization, Row Level Security, and high-performance React frontends.',
    instructor_name: 'Dr. T. N. Venkatesh',
    duration: '36 Hours',
    order_index: 1,
    is_published: true,
    created_at: new Date().toISOString(),
  },
];

const SEED_MODULES: Module[] = [
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    course_id: 'b0000000-0000-0000-0000-000000000001',
    title: 'Module 1: Modern Software Architecture & React 18 Foundations',
    description: 'Component design patterns, state management with React Query, and TypeScript type safety.',
    order_index: 1,
    is_published: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    course_id: 'b0000000-0000-0000-0000-000000000001',
    title: 'Module 2: Relational Schema Design & Supabase PostgreSQL Deep Dive',
    description: 'Database normalization, indexes, triggers, stored procedures, and Row Level Security (RLS) enforcement.',
    order_index: 2,
    is_published: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    course_id: 'b0000000-0000-0000-0000-000000000001',
    title: 'Module 3: Authentication, RBAC & Cloud Storage Workflows',
    description: 'JWT token lifecycles, session persistence, role-based routing, and secure bucket storage for media.',
    order_index: 3,
    is_published: true,
    created_at: new Date().toISOString(),
  },
];

const SEED_SESSIONS: Session[] = [
  {
    id: 'd0000000-0000-0000-0000-000000000001',
    module_id: 'c0000000-0000-0000-0000-000000000001',
    title: 'Session 1.1: System Architecture & Modern Tooling Setup',
    description: 'Architectural overview of modern single-page applications, Vite bundler internals, and TypeScript configs.',
    session_type: 'lecture',
    order_index: 1,
    duration_minutes: 45,
    is_published: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'd0000000-0000-0000-0000-000000000002',
    module_id: 'c0000000-0000-0000-0000-000000000001',
    title: 'Session 1.2: Advanced React Patterns & Hook Composition',
    description: 'Custom hooks, optimistic UI updates, and server-cache synchronization with React Query.',
    session_type: 'lecture',
    order_index: 2,
    duration_minutes: 50,
    is_published: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'd0000000-0000-0000-0000-000000000003',
    module_id: 'c0000000-0000-0000-0000-000000000002',
    title: 'Session 2.1: PostgreSQL Relational Modeling & Schema Normalization',
    description: 'Designing 3NF entities, foreign keys, cascades, composite keys, and indexing strategies.',
    session_type: 'lecture',
    order_index: 1,
    duration_minutes: 60,
    is_published: true,
    created_at: new Date().toISOString(),
  },
];

const SEED_VIDEOS: VideoLecture[] = [
  {
    id: 'e0000000-0000-0000-0000-000000000001',
    session_id: 'd0000000-0000-0000-0000-000000000001',
    title: 'System Architecture & Modern Tooling Masterclass',
    description: 'Full recorded video lecture explaining modern decoupled architectures, bundlers, and developer workflows.',
    drive_url: 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/preview',
    drive_file_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs',
    duration_minutes: 45,
    is_available: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'e0000000-0000-0000-0000-000000000002',
    session_id: 'd0000000-0000-0000-0000-000000000002',
    title: 'React Query & Server-State Synchronization In-Depth',
    description: 'Hands-on coding session demonstrating optimistic updates, caching strategies, and pagination.',
    drive_url: 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/preview',
    drive_file_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs',
    duration_minutes: 50,
    is_available: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'e0000000-0000-0000-0000-000000000003',
    session_id: 'd0000000-0000-0000-0000-000000000003',
    title: 'PostgreSQL Schema Engineering & Performance Tuning',
    description: 'Practical walkthrough of indexing, query plans (EXPLAIN ANALYZE), and database constraints.',
    drive_url: 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/preview',
    drive_file_id: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs',
    duration_minutes: 60,
    is_available: true,
    created_at: new Date().toISOString(),
  },
];

const SEED_MATERIALS: LearningMaterial[] = [
  {
    id: 'f0000000-0000-0000-0000-000000000001',
    session_id: 'd0000000-0000-0000-0000-000000000001',
    module_id: 'c0000000-0000-0000-0000-000000000001',
    course_id: 'b0000000-0000-0000-0000-000000000001',
    title: 'Session 1.1 Complete Architecture Handout & Blueprint',
    description: 'Detailed PDF lecture notes covering microservices, monorepos, and bundle optimization.',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_type: 'pdf',
    file_size_bytes: 2450000,
    external_link: 'https://react.dev',
    is_downloadable: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'f0000000-0000-0000-0000-000000000002',
    session_id: 'd0000000-0000-0000-0000-000000000003',
    module_id: 'c0000000-0000-0000-0000-000000000002',
    course_id: 'b0000000-0000-0000-0000-000000000001',
    title: 'PostgreSQL & Supabase Security Cheatsheet',
    description: 'Essential SQL syntax for RLS policies, role delegation, and index types.',
    file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_type: 'pdf',
    file_size_bytes: 1820000,
    external_link: 'https://supabase.com/docs',
    is_downloadable: true,
    created_at: new Date().toISOString(),
  },
];

const SEED_ASSIGNMENTS: Assignment[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    course_id: 'b0000000-0000-0000-0000-000000000001',
    module_id: 'c0000000-0000-0000-0000-000000000001',
    session_id: 'd0000000-0000-0000-0000-000000000002',
    title: 'Assignment 1: Build a Reusable Data Table Component with TypeScript',
    description: 'Construct a generic data table supporting sorting, filtering, and pagination without third-party heavy dependencies.',
    instructions: 'Submit either your GitHub link or paste your core React hook implementation and unit tests.',
    assignment_type: 'text_or_file',
    max_marks: 100,
    passing_marks: 50,
    due_date: new Date(Date.now() + 14 * 86400000).toISOString(),
    is_published: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    course_id: 'b0000000-0000-0000-0000-000000000001',
    module_id: 'c0000000-0000-0000-0000-000000000002',
    session_id: 'd0000000-0000-0000-0000-000000000003',
    title: 'Assignment 2: Multi-Tenant RLS Policy Implementation',
    description: 'Design and write SQL policies ensuring organization isolation for a multi-tenant SaaS workspace.',
    instructions: 'Write the SQL migration containing tables: organizations, memberships, and projects, along with SELECT, INSERT, UPDATE RLS policies.',
    assignment_type: 'text_or_file',
    max_marks: 100,
    passing_marks: 60,
    due_date: new Date(Date.now() + 21 * 86400000).toISOString(),
    is_published: true,
    created_at: new Date().toISOString(),
  },
];

const SEED_QUIZZES: Quiz[] = [
  {
    id: '20000000-0000-0000-0000-000000000001',
    course_id: 'b0000000-0000-0000-0000-000000000001',
    module_id: 'c0000000-0000-0000-0000-000000000001',
    title: 'Module 1 Assessment: React Internals & Modern Web Architecture',
    description: 'Test your understanding of reconciliation, useEffect dependencies, and TypeScript generics.',
    time_limit_minutes: 20,
    passing_percentage: 60,
    is_published: true,
    created_at: new Date().toISOString(),
    questions: [
      {
        id: 'q1',
        quiz_id: '20000000-0000-0000-0000-000000000001',
        question_text: 'What is the primary benefit of React Query / TanStack Query over basic useEffect data fetching?',
        options: [
          'It automatically generates CSS styles',
          'It provides automated caching, deduplication, background re-validation, and optimistic updates',
          'It compiles JavaScript to WebAssembly',
          'It disables all asynchronous requests',
        ],
        correct_option_index: 1,
        explanation: 'TanStack Query acts as an asynchronous state manager that handles caching, cache invalidation, and server-state synchronization seamlessly.',
        marks: 10,
        order_index: 1,
      },
      {
        id: 'q2',
        quiz_id: '20000000-0000-0000-0000-000000000001',
        question_text: 'In PostgreSQL, which command enables Row Level Security on a target table?',
        options: [
          'ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;',
          'CREATE RLS ON table_name;',
          'SET SECURITY POLICY TRUE;',
          'SECURE TABLE table_name;',
        ],
        correct_option_index: 0,
        explanation: 'PostgreSQL requires explicit ALTER TABLE tbl ENABLE ROW LEVEL SECURITY before policies take effect for unprivileged roles.',
        marks: 10,
        order_index: 2,
      },
    ],
  },
];

const SEED_PROJECTS: Project[] = [
  {
    id: '30000000-0000-0000-0000-000000000001',
    course_id: 'b0000000-0000-0000-0000-000000000001',
    title: 'Capstone: Production Full-Stack Cloud Application',
    description: 'Build and deploy a scalable, multi-role web platform featuring authentication, real-time messaging, file uploads, and admin dashboards.',
    requirements: '1. Validated authentication and profile onboarding. 2. Role-based dashboards (Student & Admin). 3. Secure file uploads to storage bucket. 4. Deployed live on Vercel with public URL. 5. Clean GitHub repository with README and architecture diagram.',
    submission_deadline: new Date(Date.now() + 30 * 86400000).toISOString(),
    max_marks: 100,
    passing_marks: 60,
    is_published: true,
    created_at: new Date().toISOString(),
  },
];

const SEED_EXAMS: Examination[] = [
  {
    id: '40000000-0000-0000-0000-000000000001',
    course_id: 'b0000000-0000-0000-0000-000000000001',
    title: 'TNV Certified Full-Stack Cloud Architect - Comprehensive Examination',
    description: 'Official proctored qualification exam assessing database design, security architecture, and system scalability.',
    instructions: 'Timer starts as soon as you click Start. Answers are auto-saved. Multiple tabs or switching windows will be flagged. Passing score is 50%.',
    duration_minutes: 45,
    total_marks: 50,
    passing_marks: 25,
    is_published: true,
    created_at: new Date().toISOString(),
    questions: [
      {
        id: 'eq1',
        exam_id: '40000000-0000-0000-0000-000000000001',
        question_text: 'Which HTTP header is essential for mitigating Cross-Site Scripting (XSS) attacks in modern web applications?',
        options: [
          'Access-Control-Allow-Origin',
          'Content-Security-Policy (CSP)',
          'X-Forwarded-For',
          'Cache-Control',
        ],
        correct_option_index: 1,
        marks: 10,
        order_index: 1,
      },
      {
        id: 'eq2',
        exam_id: '40000000-0000-0000-0000-000000000001',
        question_text: 'What does the PostgreSQL EXPLAIN ANALYZE command do?',
        options: [
          'Formats the SQL query into standard lowercase',
          'Executes the query and outputs the actual execution time, plan, and buffer usage',
          'Rolls back all uncommitted transactions',
          'Deletes index records',
        ],
        correct_option_index: 1,
        marks: 10,
        order_index: 2,
      },
      {
        id: 'eq3',
        exam_id: '40000000-0000-0000-0000-000000000001',
        question_text: 'Why is it a security vulnerability to expose the Supabase service_role key in frontend source code?',
        options: [
          'It slows down page rendering',
          'It completely bypasses all Row Level Security (RLS) policies giving full superuser database access',
          'It invalidates TLS certificates',
          'It limits the maximum number of connections',
        ],
        correct_option_index: 1,
        marks: 10,
        order_index: 3,
      },
      {
        id: 'eq4',
        exam_id: '40000000-0000-0000-0000-000000000001',
        question_text: 'In a relational database, what does a foreign key with ON DELETE CASCADE signify?',
        options: [
          'Child rows are preserved when the referenced parent row is deleted',
          'Referenced child rows are automatically deleted when the parent row is deleted',
          'The table is dropped on error',
          'The database prevents deleting any row forever',
        ],
        correct_option_index: 1,
        marks: 10,
        order_index: 4,
      },
      {
        id: 'eq5',
        exam_id: '40000000-0000-0000-0000-000000000001',
        question_text: 'Which React hook is specifically designed to memoize expensive computations between renders?',
        options: ['useCallback', 'useMemo', 'useRef', 'useLayoutEffect'],
        correct_option_index: 1,
        marks: 10,
        order_index: 5,
      },
    ],
  },
];

const SEED_LIVE_SESSIONS: LiveSession[] = [
  {
    id: '50000000-0000-0000-0000-000000000001',
    course_id: 'b0000000-0000-0000-0000-000000000001',
    module_id: 'c0000000-0000-0000-0000-000000000001',
    title: 'Live Orientation & Architectural Framework Blueprinting',
    description: 'Interactive session introducing the curriculum, development environment, and project deliverables.',
    scheduled_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    start_time: '18:00',
    end_time: '19:30',
    meeting_link: 'https://meet.google.com/tnv-work-live',
    platform: 'Google Meet',
    instructor_name: 'Dr. T. N. Venkatesh',
    is_published: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '50000000-0000-0000-0000-000000000002',
    course_id: 'b0000000-0000-0000-0000-000000000001',
    module_id: 'c0000000-0000-0000-0000-000000000002',
    title: 'Live Q&A and PostgreSQL Performance Workshop',
    description: 'Live query optimization, database tuning, and doubt resolution for Module 2.',
    scheduled_date: new Date(Date.now() + 9 * 86400000).toISOString().split('T')[0],
    start_time: '19:00',
    end_time: '20:30',
    meeting_link: 'https://meet.google.com/tnv-work-live',
    platform: 'Google Meet',
    instructor_name: 'Dr. T. N. Venkatesh',
    is_published: true,
    created_at: new Date().toISOString(),
  },
];

const SEED_ADMIN_SETTINGS: AdminSettings = {
  whatsapp_group_url: 'https://chat.whatsapp.com/TNVWorkshop2024DevCommunity',
  support_email: 'support@tnvworkshop.edu.in',
  support_phone: '+91 98765 43210',
  payment_upi_id: 'tnvworkshop@okhdfcbank',
  payment_qr_code_url: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=500&auto=format&fit=crop&q=60',
  certificate_signatory: 'Dr. T. N. Venkatesh',
  certificate_title: 'Program Director & Chief Architect',
  min_attendance_percentage: 75,
  min_exam_percentage: 50,
};

// Seed student and enrollment for immediate verification
const SEED_STUDENTS: Profile[] = [
  {
    id: 'student-demo-id-1',
    email: 'student@tnvworkshop.edu.in',
    full_name: 'Aditya Ramanathan',
    phone: '+91 98765 11223',
    college_name: 'PSG College of Technology',
    department: 'Computer Science and Engineering',
    year_of_study: '3rd Year',
    role: 'student',
    is_suspended: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'student-demo-id-2',
    email: 'kavitha.s@annauniv.edu',
    full_name: 'Kavitha S.',
    phone: '+91 94432 55667',
    college_name: 'College of Engineering Guindy (CEG)',
    department: 'Information Technology',
    year_of_study: '4th Year',
    role: 'student',
    is_suspended: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'admin-demo-id-1',
    email: 'admin@tnvworkshop.edu.in',
    full_name: 'Dr. T. N. Venkatesh (Admin)',
    phone: '+91 98765 43210',
    college_name: 'TNV Workshop Academy',
    department: 'Program Administration',
    year_of_study: 'Faculty',
    role: 'admin',
    is_suspended: false,
    created_at: new Date().toISOString(),
  },
];

const SEED_ENROLLMENTS: WorkshopEnrollment[] = [
  {
    id: 'enr-1',
    workshop_id: 'a0000000-0000-0000-0000-000000000001',
    student_id: 'student-demo-id-1',
    status: 'approved',
    registered_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    approved_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    notes: 'Payment verified via UPI',
  },
  {
    id: 'enr-2',
    workshop_id: 'a0000000-0000-0000-0000-000000000002',
    student_id: 'student-demo-id-2',
    status: 'payment_verification_pending',
    registered_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    notes: 'UPI Ref #UPI889218319 pending admin verification',
  },
];

const SEED_PAYMENTS: Payment[] = [
  {
    id: 'pay-1',
    enrollment_id: 'enr-1',
    student_id: 'student-demo-id-1',
    amount: 4999,
    currency: 'INR',
    payment_method: 'UPI',
    transaction_reference: 'UPI7749201948',
    status: 'verified',
    verified_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'pay-2',
    enrollment_id: 'enr-2',
    student_id: 'student-demo-id-2',
    amount: 3999,
    currency: 'INR',
    payment_method: 'GPay',
    transaction_reference: 'UPI889218319',
    status: 'pending',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

// Seed Certificates
const SEED_CERTIFICATES: Certificate[] = [
  {
    id: 'cert-1',
    certificate_number: 'TNV-2024-A8F29C14',
    student_id: 'student-demo-id-1',
    workshop_id: 'a0000000-0000-0000-0000-000000000001',
    issue_date: new Date().toISOString().split('T')[0],
    completion_date: new Date().toISOString().split('T')[0],
    status: 'issued',
    created_at: new Date().toISOString(),
  },
];

// Unified Data Provider API
export const dataProvider = {
  // WORKSHOPS
  async getWorkshops(): Promise<Workshop[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('workshops').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length) return data;
    }
    return getLocalStore('workshops', SEED_WORKSHOPS);
  },

  async getWorkshopBySlug(slug: string): Promise<Workshop | null> {
    const workshops = await this.getWorkshops();
    return workshops.find((w) => w.slug === slug || w.id === slug) || null;
  },

  async createWorkshop(workshop: Partial<Workshop>): Promise<Workshop> {
    const newWorkshop: Workshop = {
      id: generateUUID(),
      title: workshop.title || 'Untitled Workshop',
      slug: (workshop.title || 'workshop').toLowerCase().replace(/[^a-z0-9]/g, '-'),
      description: workshop.description || '',
      short_description: workshop.short_description || '',
      thumbnail_url: workshop.thumbnail_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
      duration: workshop.duration || '4 Weeks',
      instructor_name: workshop.instructor_name || 'Dr. T. N. Venkatesh',
      instructor_title: workshop.instructor_title || 'Chief Architect',
      instructor_bio: workshop.instructor_bio || '',
      instructor_avatar_url: workshop.instructor_avatar_url || '',
      total_seats: workshop.total_seats || 100,
      available_seats: workshop.available_seats || 100,
      price: workshop.price || 0,
      is_active: workshop.is_active ?? true,
      start_date: workshop.start_date || null,
      end_date: workshop.end_date || null,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      await supabase.from('workshops').insert(newWorkshop);
    }
    const current = getLocalStore<Workshop[]>('workshops', SEED_WORKSHOPS);
    setLocalStore('workshops', [newWorkshop, ...current]);
    return newWorkshop;
  },

  async updateWorkshop(id: string, updates: Partial<Workshop>): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabase.from('workshops').update(updates).eq('id', id);
    }
    const current = getLocalStore<Workshop[]>('workshops', SEED_WORKSHOPS);
    const updated = current.map((w) => (w.id === id ? { ...w, ...updates, updated_at: new Date().toISOString() } : w));
    setLocalStore('workshops', updated);
  },

  async deleteWorkshop(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabase.from('workshops').delete().eq('id', id);
    }
    const current = getLocalStore<Workshop[]>('workshops', SEED_WORKSHOPS);
    setLocalStore('workshops', current.filter((w) => w.id !== id));
  },

  // ENROLLMENTS & STUDENTS
  async getProfiles(): Promise<Profile[]> {
    if (isSupabaseConfigured()) {
      const { data } = await supabase.from('profiles').select('*');
      if (data && data.length) return data;
    }
    return getLocalStore('profiles', SEED_STUDENTS);
  },

  async getEnrollments(): Promise<WorkshopEnrollment[]> {
    if (isSupabaseConfigured()) {
      const { data } = await supabase.from('workshop_enrollments').select('*, workshop:workshops(*), student:profiles(*)');
      if (data && data.length) return data;
    }
    const enrollments = getLocalStore<WorkshopEnrollment[]>('enrollments', SEED_ENROLLMENTS);
    const workshops = await this.getWorkshops();
    const students = await this.getProfiles();
    return enrollments.map((enr) => ({
      ...enr,
      workshop: workshops.find((w) => w.id === enr.workshop_id),
      student: students.find((s) => s.id === enr.student_id),
    }));
  },

  async getStudentEnrollments(studentId: string): Promise<WorkshopEnrollment[]> {
    const all = await this.getEnrollments();
    return all.filter((e) => e.student_id === studentId);
  },

  async createEnrollment(workshopId: string, studentId: string): Promise<WorkshopEnrollment> {
    const newEnr: WorkshopEnrollment = {
      id: generateUUID(),
      workshop_id: workshopId,
      student_id: studentId,
      status: 'payment_pending',
      registered_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      await supabase.from('workshop_enrollments').insert(newEnr);
    }
    const all = getLocalStore<WorkshopEnrollment[]>('enrollments', SEED_ENROLLMENTS);
    setLocalStore('enrollments', [newEnr, ...all]);
    return newEnr;
  },

  async updateEnrollmentStatus(
    enrollmentId: string,
    status: WorkshopEnrollment['status'],
    notes?: string
  ): Promise<void> {
    if (isSupabaseConfigured()) {
      await supabase.from('workshop_enrollments').update({
        status,
        notes: notes || null,
        approved_at: status === 'approved' ? new Date().toISOString() : null,
      }).eq('id', enrollmentId);
    }
    const all = getLocalStore<WorkshopEnrollment[]>('enrollments', SEED_ENROLLMENTS);
    const updated = all.map((e) =>
      e.id === enrollmentId
        ? {
            ...e,
            status,
            notes: notes ?? e.notes,
            approved_at: status === 'approved' ? new Date().toISOString() : e.approved_at,
          }
        : e
    );
    setLocalStore('enrollments', updated);
  },

  // PAYMENTS
  async getPayments(): Promise<Payment[]> {
    if (isSupabaseConfigured()) {
      const { data } = await supabase.from('payments').select('*, student:profiles(*)');
      if (data && data.length) return data;
    }
    const payments = getLocalStore<Payment[]>('payments', SEED_PAYMENTS);
    const students = await this.getProfiles();
    return payments.map((p) => ({
      ...p,
      student: students.find((s) => s.id === p.student_id),
    }));
  },

  async submitPayment(
    enrollmentId: string,
    studentId: string,
    amount: number,
    transactionRef: string,
    proofUrl?: string
  ): Promise<Payment> {
    const newPayment: Payment = {
      id: generateUUID(),
      enrollment_id: enrollmentId,
      student_id: studentId,
      amount,
      currency: 'INR',
      payment_method: 'UPI',
      transaction_reference: transactionRef,
      payment_proof_url: proofUrl || null,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      await supabase.from('payments').insert(newPayment);
      await supabase.from('workshop_enrollments').update({
        status: 'payment_verification_pending',
      }).eq('id', enrollmentId);
    }

    const current = getLocalStore<Payment[]>('payments', SEED_PAYMENTS);
    setLocalStore('payments', [newPayment, ...current]);

    // Update enrollment status to payment_verification_pending
    await this.updateEnrollmentStatus(enrollmentId, 'payment_verification_pending', `Txn: ${transactionRef}`);

    return newPayment;
  },

  async verifyPayment(paymentId: string, status: 'verified' | 'rejected', notes?: string): Promise<void> {
    const allPayments = getLocalStore<Payment[]>('payments', SEED_PAYMENTS);
    const target = allPayments.find((p) => p.id === paymentId);
    if (!target) return;

    if (isSupabaseConfigured()) {
      await supabase.from('payments').update({
        status,
        admin_notes: notes || null,
        verified_at: new Date().toISOString(),
      }).eq('id', paymentId);
    }

    const updatedPayments = allPayments.map((p) =>
      p.id === paymentId
        ? { ...p, status, admin_notes: notes || null, verified_at: new Date().toISOString() }
        : p
    );
    setLocalStore('payments', updatedPayments);

    // If verified, automatically update corresponding enrollment to approved
    if (status === 'verified') {
      await this.updateEnrollmentStatus(target.enrollment_id, 'approved', 'Payment verified by administrator');
    } else if (status === 'rejected') {
      await this.updateEnrollmentStatus(target.enrollment_id, 'rejected', notes || 'Payment rejected by administrator');
    }
  },

  // COURSES & MODULES & SESSIONS
  async getCourses(workshopId?: string): Promise<Course[]> {
    if (isSupabaseConfigured()) {
      let query = supabase.from('courses').select('*').order('order_index');
      if (workshopId) query = query.eq('workshop_id', workshopId);
      const { data } = await query;
      if (data && data.length) return data;
    }
    const courses = getLocalStore<Course[]>('courses', SEED_COURSES);
    return workshopId ? courses.filter((c) => c.workshop_id === workshopId) : courses;
  },

  async getModules(courseId: string): Promise<Module[]> {
    if (isSupabaseConfigured()) {
      const { data } = await supabase.from('modules').select('*').eq('course_id', courseId).order('order_index');
      if (data && data.length) return data;
    }
    const modules = getLocalStore<Module[]>('modules', SEED_MODULES);
    return modules.filter((m) => m.course_id === courseId);
  },

  async getSessions(moduleId: string): Promise<Session[]> {
    if (isSupabaseConfigured()) {
      const { data } = await supabase.from('sessions').select('*').eq('module_id', moduleId).order('order_index');
      if (data && data.length) return data;
    }
    const sessions = getLocalStore<Session[]>('sessions', SEED_SESSIONS);
    return sessions.filter((s) => s.module_id === moduleId);
  },

  async getVideoBySession(sessionId: string): Promise<VideoLecture | null> {
    if (isSupabaseConfigured()) {
      const { data } = await supabase.from('video_lectures').select('*').eq('session_id', sessionId).maybeSingle();
      if (data) return data;
    }
    const videos = getLocalStore<VideoLecture[]>('videos', SEED_VIDEOS);
    return videos.find((v) => v.session_id === sessionId) || null;
  },

  async getLearningMaterials(courseId?: string, sessionId?: string): Promise<LearningMaterial[]> {
    if (isSupabaseConfigured()) {
      let q = supabase.from('learning_materials').select('*');
      if (courseId) q = q.eq('course_id', courseId);
      if (sessionId) q = q.eq('session_id', sessionId);
      const { data } = await q;
      if (data && data.length) return data;
    }
    const materials = getLocalStore<LearningMaterial[]>('materials', SEED_MATERIALS);
    if (sessionId) return materials.filter((m) => m.session_id === sessionId);
    if (courseId) return materials.filter((m) => m.course_id === courseId);
    return materials;
  },

  async getSessionProgress(studentId: string): Promise<SessionProgress[]> {
    return getLocalStore<SessionProgress[]>(`progress_${studentId}`, [
      {
        id: 'prog-1',
        student_id: studentId,
        session_id: 'd0000000-0000-0000-0000-000000000001',
        is_completed: true,
        completed_at: new Date().toISOString(),
      },
    ]);
  },

  async toggleSessionCompleted(studentId: string, sessionId: string): Promise<boolean> {
    const progressList = await this.getSessionProgress(studentId);
    const existing = progressList.find((p) => p.session_id === sessionId);
    let newStatus = true;

    if (existing) {
      newStatus = !existing.is_completed;
      existing.is_completed = newStatus;
      existing.completed_at = newStatus ? new Date().toISOString() : null;
    } else {
      progressList.push({
        id: generateUUID(),
        student_id: studentId,
        session_id: sessionId,
        is_completed: true,
        completed_at: new Date().toISOString(),
      });
    }

    setLocalStore(`progress_${studentId}`, progressList);
    return newStatus;
  },

  // ASSIGNMENTS & SUBMISSIONS
  async getAssignments(courseId?: string): Promise<Assignment[]> {
    if (isSupabaseConfigured()) {
      let q = supabase.from('assignments').select('*');
      if (courseId) q = q.eq('course_id', courseId);
      const { data } = await q;
      if (data && data.length) return data;
    }
    const assignments = getLocalStore<Assignment[]>('assignments', SEED_ASSIGNMENTS);
    return courseId ? assignments.filter((a) => a.course_id === courseId) : assignments;
  },

  async getAssignmentSubmissions(assignmentId?: string, studentId?: string): Promise<AssignmentSubmission[]> {
    const submissions = getLocalStore<AssignmentSubmission[]>('submissions', [
      {
        id: 'sub-1',
        assignment_id: '10000000-0000-0000-0000-000000000001',
        student_id: 'student-demo-id-1',
        submission_text: 'https://github.com/tnv-student/react-reusable-table-lib',
        status: 'evaluated',
        marks_obtained: 95,
        feedback: 'Excellent modular structure, clear typing and 100% test coverage.',
        submitted_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        evaluated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
    ]);

    const students = await this.getProfiles();
    const assignments = await this.getAssignments();

    let list = submissions.map((s) => ({
      ...s,
      student: students.find((st) => st.id === s.student_id),
      assignment: assignments.find((a) => a.id === s.assignment_id),
    }));

    if (assignmentId) list = list.filter((s) => s.assignment_id === assignmentId);
    if (studentId) list = list.filter((s) => s.student_id === studentId);
    return list;
  },

  async submitAssignment(assignmentId: string, studentId: string, text: string, fileUrl?: string): Promise<AssignmentSubmission> {
    const current = getLocalStore<AssignmentSubmission[]>('submissions', []);
    const existingIndex = current.findIndex((s) => s.assignment_id === assignmentId && s.student_id === studentId);

    const sub: AssignmentSubmission = {
      id: existingIndex >= 0 ? current[existingIndex].id : generateUUID(),
      assignment_id: assignmentId,
      student_id: studentId,
      submission_text: text,
      file_url: fileUrl || null,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      current[existingIndex] = sub;
    } else {
      current.push(sub);
    }

    setLocalStore('submissions', current);
    return sub;
  },

  async evaluateSubmission(submissionId: string, marks: number, feedback: string): Promise<void> {
    const current = getLocalStore<AssignmentSubmission[]>('submissions', []);
    const updated = current.map((s) =>
      s.id === submissionId
        ? {
            ...s,
            marks_obtained: marks,
            feedback,
            status: 'evaluated' as const,
            evaluated_at: new Date().toISOString(),
          }
        : s
    );
    setLocalStore('submissions', updated);
  },

  // QUIZZES & EXAMS
  async getQuizzes(courseId?: string): Promise<Quiz[]> {
    const quizzes = getLocalStore<Quiz[]>('quizzes', SEED_QUIZZES);
    return courseId ? quizzes.filter((q) => q.course_id === courseId) : quizzes;
  },

  async submitQuiz(quizId: string, studentId: string, answers: { question_id: string; selected_option_index: number }[]): Promise<QuizAttempt> {
    const quizzes = await this.getQuizzes();
    const quiz = quizzes.find((q) => q.id === quizId);
    if (!quiz) throw new Error('Quiz not found');

    let score = 0;
    let totalMarks = 0;

    quiz.questions?.forEach((q) => {
      totalMarks += q.marks;
      const given = answers.find((a) => a.question_id === q.id);
      if (given && given.selected_option_index === q.correct_option_index) {
        score += q.marks;
      }
    });

    const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
    const is_passed = percentage >= quiz.passing_percentage;

    const attempt: QuizAttempt = {
      id: generateUUID(),
      quiz_id: quizId,
      student_id: studentId,
      score,
      total_marks: totalMarks,
      percentage,
      is_passed,
      started_at: new Date(Date.now() - 10 * 60000).toISOString(),
      submitted_at: new Date().toISOString(),
      status: 'completed',
    };

    const attempts = getLocalStore<QuizAttempt[]>(`quiz_attempts_${studentId}`, []);
    setLocalStore(`quiz_attempts_${studentId}`, [attempt, ...attempts]);
    return attempt;
  },

  async getExaminations(courseId?: string): Promise<Examination[]> {
    const exams = getLocalStore<Examination[]>('examinations', SEED_EXAMS);
    return courseId ? exams.filter((e) => e.course_id === courseId) : exams;
  },

  async getExamById(examId: string): Promise<Examination | null> {
    const exams = await this.getExaminations();
    return exams.find((e) => e.id === examId) || null;
  },

  async submitExam(examId: string, studentId: string, answers: Record<string, number>): Promise<ExamAttempt> {
    const exam = await this.getExamById(examId);
    if (!exam) throw new Error('Exam not found');

    let score = 0;
    let totalMarks = 0;

    exam.questions?.forEach((q) => {
      totalMarks += q.marks;
      const selected = answers[q.id];
      if (selected !== undefined && selected === q.correct_option_index) {
        score += q.marks;
      }
    });

    const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
    const is_passed = score >= exam.passing_marks;

    const attempt: ExamAttempt = {
      id: generateUUID(),
      exam_id: examId,
      student_id: studentId,
      score,
      total_marks: totalMarks,
      percentage,
      is_passed,
      started_at: new Date(Date.now() - 30 * 60000).toISOString(),
      submitted_at: new Date().toISOString(),
      status: 'evaluated',
    };

    const currentAttempts = getLocalStore<ExamAttempt[]>('exam_attempts', []);
    setLocalStore('exam_attempts', [attempt, ...currentAttempts]);
    return attempt;
  },

  async getExamAttempts(studentId?: string): Promise<ExamAttempt[]> {
    const current = getLocalStore<ExamAttempt[]>('exam_attempts', [
      {
        id: 'attempt-1',
        exam_id: '40000000-0000-0000-0000-000000000001',
        student_id: 'student-demo-id-1',
        score: 40,
        total_marks: 50,
        percentage: 80,
        is_passed: true,
        started_at: new Date(Date.now() - 86400000).toISOString(),
        submitted_at: new Date(Date.now() - 86400000 + 40 * 60000).toISOString(),
        status: 'evaluated',
      },
    ]);
    const students = await this.getProfiles();
    const exams = await this.getExaminations();

    const enriched = current.map((att) => ({
      ...att,
      student: students.find((s) => s.id === att.student_id),
      examination: exams.find((e) => e.id === att.exam_id),
    }));

    return studentId ? enriched.filter((a) => a.student_id === studentId) : enriched;
  },

  // PROJECTS & SUBMISSIONS
  async getProjects(courseId?: string): Promise<Project[]> {
    const projects = getLocalStore<Project[]>('projects', SEED_PROJECTS);
    return courseId ? projects.filter((p) => p.course_id === courseId) : projects;
  },

  async getProjectSubmissions(studentId?: string): Promise<ProjectSubmission[]> {
    const submissions = getLocalStore<ProjectSubmission[]>('project_submissions', [
      {
        id: 'proj-sub-1',
        project_id: '30000000-0000-0000-0000-000000000001',
        student_id: 'student-demo-id-1',
        project_title: 'Enterprise Workshop LMS on Cloud',
        project_description: 'Implemented multi-tenant workshop LMS with Supabase, React 18, and Vercel.',
        github_url: 'https://github.com/tnv-student/workshop-lms-capstone',
        live_demo_url: 'https://tnv-workshop-demo.vercel.app',
        status: 'approved',
        marks_obtained: 94,
        feedback: 'Outstanding architecture, clear documentation and comprehensive unit testing.',
        submitted_at: new Date(Date.now() - 4 * 86400000).toISOString(),
        reviewed_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
    ]);

    const students = await this.getProfiles();
    const projects = await this.getProjects();

    const enriched = submissions.map((s) => ({
      ...s,
      student: students.find((st) => st.id === s.student_id),
      project: projects.find((p) => p.id === s.project_id),
    }));

    return studentId ? enriched.filter((s) => s.student_id === studentId) : enriched;
  },

  async submitProject(
    projectId: string,
    studentId: string,
    data: { project_title: string; project_description: string; github_url: string; live_demo_url?: string }
  ): Promise<ProjectSubmission> {
    const all = getLocalStore<ProjectSubmission[]>('project_submissions', []);
    const sub: ProjectSubmission = {
      id: generateUUID(),
      project_id: projectId,
      student_id: studentId,
      project_title: data.project_title,
      project_description: data.project_description,
      github_url: data.github_url,
      live_demo_url: data.live_demo_url || null,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    };
    setLocalStore('project_submissions', [sub, ...all]);
    return sub;
  },

  async reviewProject(submissionId: string, status: ProjectSubmission['status'], marks: number, feedback: string): Promise<void> {
    const all = getLocalStore<ProjectSubmission[]>('project_submissions', []);
    const updated = all.map((s) =>
      s.id === submissionId
        ? {
            ...s,
            status,
            marks_obtained: marks,
            feedback,
            reviewed_at: new Date().toISOString(),
          }
        : s
    );
    setLocalStore('project_submissions', updated);
  },

  // LIVE SESSIONS & ATTENDANCE
  async getLiveSessions(courseId?: string): Promise<LiveSession[]> {
    const sessions = getLocalStore<LiveSession[]>('live_sessions', SEED_LIVE_SESSIONS);
    return courseId ? sessions.filter((s) => s.course_id === courseId) : sessions;
  },

  async createLiveSession(session: Partial<LiveSession>): Promise<LiveSession> {
    const newSession: LiveSession = {
      id: generateUUID(),
      course_id: session.course_id || 'b0000000-0000-0000-0000-000000000001',
      title: session.title || 'Live Workshop Session',
      description: session.description || '',
      scheduled_date: session.scheduled_date || new Date().toISOString().split('T')[0],
      start_time: session.start_time || '18:00',
      end_time: session.end_time || '19:30',
      meeting_link: session.meeting_link || 'https://meet.google.com/tnv-work-live',
      platform: session.platform || 'Google Meet',
      instructor_name: session.instructor_name || 'Dr. T. N. Venkatesh',
      is_published: true,
      created_at: new Date().toISOString(),
    };
    const current = getLocalStore<LiveSession[]>('live_sessions', SEED_LIVE_SESSIONS);
    setLocalStore('live_sessions', [newSession, ...current]);
    return newSession;
  },

  async getAttendance(liveSessionId?: string, studentId?: string): Promise<Attendance[]> {
    const records = getLocalStore<Attendance[]>('attendance', [
      {
        id: 'att-1',
        live_session_id: '50000000-0000-0000-0000-000000000001',
        student_id: 'student-demo-id-1',
        status: 'present',
        marked_at: new Date().toISOString(),
      },
    ]);
    const students = await this.getProfiles();
    const liveSessions = await this.getLiveSessions();

    let list = records.map((r) => ({
      ...r,
      student: students.find((s) => s.id === r.student_id),
      live_session: liveSessions.find((ls) => ls.id === r.live_session_id),
    }));

    if (liveSessionId) list = list.filter((r) => r.live_session_id === liveSessionId);
    if (studentId) list = list.filter((r) => r.student_id === studentId);
    return list;
  },

  async markAttendance(liveSessionId: string, studentId: string, status: Attendance['status'], remarks?: string): Promise<void> {
    const all = getLocalStore<Attendance[]>('attendance', []);
    const existingIndex = all.findIndex((a) => a.live_session_id === liveSessionId && a.student_id === studentId);

    const record: Attendance = {
      id: existingIndex >= 0 ? all[existingIndex].id : generateUUID(),
      live_session_id: liveSessionId,
      student_id: studentId,
      status,
      remarks: remarks || null,
      marked_at: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      all[existingIndex] = record;
    } else {
      all.push(record);
    }

    setLocalStore('attendance', all);
  },

  // CERTIFICATES
  async getCertificates(): Promise<Certificate[]> {
    const certs = getLocalStore<Certificate[]>('certificates', SEED_CERTIFICATES);
    const students = await this.getProfiles();
    const workshops = await this.getWorkshops();

    return certs.map((c) => ({
      ...c,
      student: students.find((s) => s.id === c.student_id),
      workshop: workshops.find((w) => w.id === c.workshop_id),
    }));
  },

  async getStudentCertificate(studentId: string, workshopId: string): Promise<Certificate | null> {
    const all = await this.getCertificates();
    return all.find((c) => c.student_id === studentId && c.workshop_id === workshopId && c.status === 'issued') || null;
  },

  async checkEligibility(studentId: string, workshopId: string): Promise<{
    is_eligible: boolean;
    progress_percentage: number;
    assignments_satisfied: boolean;
    projects_satisfied: boolean;
    already_issued: boolean;
    existing_certificate?: Certificate | null;
  }> {
    const existing = await this.getStudentCertificate(studentId, workshopId);
    if (existing) {
      return {
        is_eligible: true,
        progress_percentage: 100,
        assignments_satisfied: true,
        projects_satisfied: true,
        already_issued: true,
        existing_certificate: existing,
      };
    }

    // Check enrollment status
    const enrollments = await this.getStudentEnrollments(studentId);
    const enr = enrollments.find((e) => e.workshop_id === workshopId);
    if (!enr || enr.status !== 'approved') {
      return {
        is_eligible: false,
        progress_percentage: 0,
        assignments_satisfied: false,
        projects_satisfied: false,
        already_issued: false,
      };
    }

    // Check project status
    const projects = await this.getProjectSubmissions(studentId);
    const hasApprovedProject = projects.some((p) => p.status === 'approved');

    // Check assignments
    const submissions = await this.getAssignmentSubmissions(undefined, studentId);
    const hasAssignments = submissions.length > 0;

    return {
      is_eligible: hasApprovedProject && hasAssignments,
      progress_percentage: hasApprovedProject ? 90 : 65,
      assignments_satisfied: hasAssignments,
      projects_satisfied: hasApprovedProject,
      already_issued: false,
    };
  },

  async issueCertificate(studentId: string, workshopId: string): Promise<Certificate> {
    const certNumber = `TNV-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const newCert: Certificate = {
      id: generateUUID(),
      certificate_number: certNumber,
      student_id: studentId,
      workshop_id: workshopId,
      issue_date: new Date().toISOString().split('T')[0],
      completion_date: new Date().toISOString().split('T')[0],
      status: 'issued',
      created_at: new Date().toISOString(),
    };

    const current = getLocalStore<Certificate[]>('certificates', SEED_CERTIFICATES);
    setLocalStore('certificates', [newCert, ...current]);

    // Send notification
    await this.createNotification(
      studentId,
      'Certificate of Excellence Issued!',
      `Your official certificate for workshop completion has been generated. Verification ID: ${certNumber}`,
      'success',
      '/student/certificates'
    );

    return newCert;
  },

  async revokeCertificate(certificateId: string, reason: string): Promise<void> {
    const current = getLocalStore<Certificate[]>('certificates', SEED_CERTIFICATES);
    const updated = current.map((c) =>
      c.id === certificateId ? { ...c, status: 'revoked' as const, revoked_reason: reason } : c
    );
    setLocalStore('certificates', updated);
  },

  // FEEDBACK & COMPLAINTS
  async getFeedbacks(studentId?: string): Promise<Feedback[]> {
    const list = getLocalStore<Feedback[]>('feedbacks', [
      {
        id: 'fb-1',
        student_id: 'student-demo-id-1',
        category: 'improvement',
        subject: 'Request additional hands-on code examples for Vector DBs',
        description: 'Would love if Dr. Venkatesh could provide a sample repo using pgvector with Supabase in Module 2.',
        status: 'resolved',
        admin_response: 'Added sample repository link in Session 2.2 learning materials!',
        resolved_at: new Date().toISOString(),
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
    ]);
    const students = await this.getProfiles();
    const enriched = list.map((f) => ({ ...f, student: students.find((s) => s.id === f.student_id) }));
    return studentId ? enriched.filter((f) => f.student_id === studentId) : enriched;
  },

  async submitFeedback(studentId: string, category: Feedback['category'], subject: string, description: string): Promise<Feedback> {
    const all = getLocalStore<Feedback[]>('feedbacks', []);
    const fb: Feedback = {
      id: generateUUID(),
      student_id: studentId,
      category,
      subject,
      description,
      status: 'open',
      created_at: new Date().toISOString(),
    };
    setLocalStore('feedbacks', [fb, ...all]);
    return fb;
  },

  async respondToFeedback(feedbackId: string, response: string, status: Feedback['status']): Promise<void> {
    const all = getLocalStore<Feedback[]>('feedbacks', []);
    const updated = all.map((f) =>
      f.id === feedbackId
        ? {
            ...f,
            admin_response: response,
            status,
            resolved_at: status === 'resolved' || status === 'closed' ? new Date().toISOString() : f.resolved_at,
          }
        : f
    );
    setLocalStore('feedbacks', updated);
  },

  // NOTIFICATIONS
  async getNotifications(userId: string): Promise<Notification[]> {
    const all = getLocalStore<Notification[]>(`notifications_${userId}`, [
      {
        id: 'notif-1',
        user_id: userId,
        title: 'Welcome to TNV Workshop',
        message: 'Explore your enrolled workshops and access modern curriculum.',
        type: 'info',
        is_read: false,
        created_at: new Date().toISOString(),
      },
      {
        id: 'notif-2',
        user_id: userId,
        title: 'Upcoming Live Orientation',
        message: 'Live session with Dr. T. N. Venkatesh is scheduled this weekend.',
        type: 'warning',
        link_url: '/student/live-sessions',
        is_read: false,
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
    ]);
    return all;
  },

  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: Notification['type'] = 'info',
    linkUrl?: string
  ): Promise<Notification> {
    const list = await this.getNotifications(userId);
    const notif: Notification = {
      id: generateUUID(),
      user_id: userId,
      title,
      message,
      type,
      link_url: linkUrl || null,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setLocalStore(`notifications_${userId}`, [notif, ...list]);
    return notif;
  },

  async markNotificationRead(userId: string, notificationId: string): Promise<void> {
    const list = await this.getNotifications(userId);
    const updated = list.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n));
    setLocalStore(`notifications_${userId}`, updated);
  },

  // ADMIN SETTINGS
  async getAdminSettings(): Promise<AdminSettings> {
    return getLocalStore<AdminSettings>('admin_settings', SEED_ADMIN_SETTINGS);
  },

  async updateAdminSettings(settings: Partial<AdminSettings>): Promise<AdminSettings> {
    const current = await this.getAdminSettings();
    const updated = { ...current, ...settings };
    setLocalStore('admin_settings', updated);
    return updated;
  },

  // ADMIN DASHBOARD & ANALYTICS METRICS
  async getAdminDashboardMetrics() {
    const students = await this.getProfiles();
    const enrollments = await this.getEnrollments();
    const workshops = await this.getWorkshops();
    const courses = await this.getCourses();
    const submissions = await this.getAssignmentSubmissions();
    const projectSubmissions = await this.getProjectSubmissions();
    const exams = await this.getExamAttempts();
    const certificates = await this.getCertificates();
    const payments = await this.getPayments();

    const registeredStudents = students.filter((s) => s.role === 'student');
    const approvedEnrollments = enrollments.filter((e) => e.status === 'approved');
    const pendingVerifications = enrollments.filter((e) => e.status === 'payment_verification_pending' || e.status === 'payment_pending');
    const totalRevenue = payments
      .filter((p) => p.status === 'verified')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return {
      totalRegisteredStudents: registeredStudents.length,
      totalApprovedEnrollments: approvedEnrollments.length,
      pendingVerificationsCount: pendingVerifications.length,
      totalWorkshops: workshops.length,
      totalCourses: courses.length,
      totalAssignmentsSubmitted: submissions.length,
      totalProjectsSubmitted: projectSubmissions.length,
      totalExamsTaken: exams.length,
      totalCertificatesIssued: certificates.filter((c) => c.status === 'issued').length,
      totalRevenue,
    };
  },
};
