-- ==============================================================================
-- TNV WORKSHOP LEARNING MANAGEMENT SYSTEM (LMS)
-- 03_SEED_DATA.SQL - Industry-Ready Workspaces, Courses, Modules, Sessions, Exams
-- ==============================================================================

-- 1. ADMIN SETTINGS
INSERT INTO public.admin_settings (key, value, description)
VALUES 
    ('whatsapp_group_url', '"https://chat.whatsapp.com/TNVWorkshop2024DevCommunity"', 'Official TNV Workshop community WhatsApp channel for doubts and updates'),
    ('support_email', '"support@tnvworkshop.edu.in"', 'Official student support email address'),
    ('support_phone', '"+91 98765 43210"', 'Direct academic helpline number'),
    ('payment_upi_id', '"tnvworkshop@okhdfcbank"', 'Primary UPI ID for manual payment transactions'),
    ('payment_qr_code_url', '"https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=500&auto=format&fit=crop&q=60"', 'QR code image for student manual payment upload')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. SEED WORKSHOPS
INSERT INTO public.workshops (
    id,
    title,
    slug,
    short_description,
    description,
    thumbnail_url,
    duration,
    instructor_name,
    instructor_title,
    instructor_bio,
    total_seats,
    available_seats,
    price,
    is_active,
    start_date,
    end_date
) VALUES 
(
    'a0000000-0000-0000-0000-000000000001',
    'Full-Stack Cloud & AI Engineering',
    'full-stack-cloud-ai-engineering',
    'Master modern React, TypeScript, Supabase, PostgreSQL, and Gemini AI integration to build enterprise-grade cloud applications.',
    'This intensive 6-week hands-on workshop takes students through the complete modern full-stack development cycle. You will learn frontend mastery with React, Vite, and Tailwind, secure relational database modeling with PostgreSQL and Supabase, robust Role-Based Access Control, edge computing, AI orchestration, and production deployment on Vercel.',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
    '6 Weeks (36 Hours)',
    'Thamilaran',
    'Chief Architect & Senior Software Engineer',
    'Over 18 years of experience leading engineering teams at top-tier software organizations. Specialized in scalable distributed systems and cloud-native architectures.',
    120,
    38,
    4999.00,
    TRUE,
    CURRENT_DATE + INTERVAL '5 days',
    CURRENT_DATE + INTERVAL '47 days'
),
(
    'a0000000-0000-0000-0000-000000000002',
    'Embedded Systems & Edge AI Bootcamp',
    'embedded-systems-edge-ai',
    'Design hardware-software integrated IoT systems with ESP32, FreeRTOS, TinyML, and MQTT cloud pipelines.',
    'Bridging firmware and cloud. Explore microcontroller architecture, real-time operating systems, sensor fusion, wireless communication protocols, and deploy lightweight neural networks on edge silicon.',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
    '4 Weeks (24 Hours)',
    'Prof. Rajesh K. Sharma',
    'Principal IoT Systems Researcher',
    'Former Senior Firmware Architect with multiple patents in low-power industrial telemetry and sensor networks.',
    80,
    15,
    3999.00,
    TRUE,
    CURRENT_DATE + INTERVAL '12 days',
    CURRENT_DATE + INTERVAL '40 days'
),
(
    'a0000000-0000-0000-0000-000000000003',
    'Cybersecurity & DevSecOps Mastery',
    'cybersecurity-devsecops-mastery',
    'From vulnerability research and OWASP Top 10 mitigation to zero-trust architecture and automated CI/CD security scanning.',
    'Understand red and blue team methodologies. Perform web penetration testing, network traffic analysis, container hardening, secrets management, and automated SAST/DAST pipelines.',
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
    '5 Weeks (30 Hours)',
    'Arunachalam V.',
    'Lead Security Architect & Ethical Hacker',
    'Certified Information Systems Security Professional (CISSP) and active security researcher with bug bounties from global Fortune 500 tech companies.',
    100,
    44,
    4499.00,
    TRUE,
    CURRENT_DATE + INTERVAL '20 days',
    CURRENT_DATE + INTERVAL '55 days'
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    price = EXCLUDED.price;

-- 3. SEED COURSES
INSERT INTO public.courses (
    id,
    workshop_id,
    title,
    slug,
    description,
    instructor_name,
    duration,
    order_index,
    is_published
) VALUES 
(
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Full-Stack Architecture & Cloud Database Engineering',
    'fullstack-architecture-cloud-database',
    'Core architecture, database normalization, Row Level Security, and high-performance React frontends.',
    'Thamilaran',
    '36 Hours',
    1,
    TRUE
),
(
    'b0000000-0000-0000-0000-000000000002',
    'Microcontroller Firmware & Embedded RTOS',
    'microcontroller-firmware-rtos',
    'Hardware abstraction, FreeRTOS scheduling, interrupts, and peripherals.',
    'Prof. Rajesh K. Sharma',
    '24 Hours',
    1,
    TRUE
)
ON CONFLICT (id) DO NOTHING;

-- 4. SEED MODULES
INSERT INTO public.modules (
    id,
    course_id,
    title,
    description,
    order_index,
    is_published
) VALUES 
(
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Module 1: Modern Software Architecture & React 18 Foundations',
    'Component design patterns, state management with React Query, and TypeScript type safety.',
    1,
    TRUE
),
(
    'c0000000-0000-0000-0000-000000000002',
    'Module 2: Relational Schema Design & Supabase PostgreSQL Deep Dive',
    'Database normalization, indexes, triggers, stored procedures, and Row Level Security (RLS) enforcement.',
    2,
    TRUE
),
(
    'c0000000-0000-0000-0000-000000000003',
    'Module 3: Authentication, RBAC & Cloud Storage Workflows',
    'JWT token lifecycles, session persistence, role-based routing, and secure bucket storage for media.',
    3,
    TRUE
),
(
    'c0000000-0000-0000-0000-000000000004',
    'Module 4: Enterprise Capstone Project & Production Deployment',
    'Building, testing, edge caching, CI/CD pipeline automation, and multi-tenant security.',
    4,
    TRUE
)
ON CONFLICT (id) DO NOTHING;

-- 5. SEED SESSIONS
INSERT INTO public.sessions (
    id,
    module_id,
    title,
    description,
    session_type,
    order_index,
    duration_minutes,
    is_published
) VALUES 
(
    'd0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'Session 1.1: System Architecture & Modern Tooling Setup',
    'Architectural overview of modern single-page applications, Vite bundler internals, and TypeScript configs.',
    'lecture',
    1,
    45,
    TRUE
),
(
    'd0000000-0000-0000-0000-000000000002',
    'Session 1.2: Advanced React Patterns & Hook Composition',
    'Custom hooks, optimistic UI updates, and server-cache synchronization with React Query.',
    'lecture',
    2,
    50,
    TRUE
),
(
    'd0000000-0000-0000-0000-000000000003',
    'Session 2.1: PostgreSQL Relational Modeling & Schema Normalization',
    'Designing 3NF entities, foreign keys, cascades, composite keys, and indexing strategies.',
    'lecture',
    1,
    60,
    TRUE
),
(
    'd0000000-0000-0000-0000-000000000004',
    'Session 2.2: Row Level Security (RLS) & Stored Functions',
    'Crafting robust RLS policies, tenant isolation, and writing secure PL/pgSQL procedures.',
    'lecture',
    2,
    55,
    TRUE
)
ON CONFLICT (id) DO NOTHING;

-- 6. SEED VIDEO LECTURES (Google Drive links)
INSERT INTO public.video_lectures (
    id,
    session_id,
    title,
    description,
    drive_url,
    drive_file_id,
    duration_minutes,
    is_available
) VALUES 
(
    'e0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'System Architecture & Modern Tooling Masterclass',
    'Watch the full recorded session explaining modern decoupled architectures, bundlers, and developer workflows.',
    'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/preview',
    '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs',
    45,
    TRUE
),
(
    'e0000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000002',
    'React Query & Server-State Synchronization In-Depth',
    'Hands-on coding session demonstrating optimistic updates, caching strategies, and pagination.',
    'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/preview',
    '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs',
    50,
    TRUE
),
(
    'e0000000-0000-0000-0000-000000000003',
    'd0000000-0000-0000-0000-000000000003',
    'PostgreSQL Schema Engineering & Performance Tuning',
    'Practical walkthrough of indexing, query plans (EXPLAIN ANALYZE), and database constraints.',
    'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/preview',
    '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs',
    60,
    TRUE
)
ON CONFLICT (id) DO NOTHING;

-- 7. SEED LEARNING MATERIALS
INSERT INTO public.learning_materials (
    id,
    session_id,
    module_id,
    course_id,
    title,
    description,
    file_url,
    file_type,
    file_size_bytes,
    external_link,
    is_downloadable
) VALUES 
(
    'f0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Session 1.1 Complete Architecture Handout & Blueprint',
    'Detailed PDF lecture notes covering microservices, monorepos, and bundle optimization.',
    'https://raw.githubusercontent.com/shadcn-ui/ui/main/README.md',
    'pdf',
    2450000,
    'https://react.dev',
    TRUE
),
(
    'f0000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000001',
    'PostgreSQL & Supabase Security Cheatsheet',
    'Essential SQL syntax for RLS policies, role delegation, and index types.',
    'https://supabase.com/docs',
    'pdf',
    1820000,
    'https://supabase.com/docs/guides/database/postgres/row-level-security',
    TRUE
)
ON CONFLICT (id) DO NOTHING;

-- 8. SEED ASSIGNMENTS
INSERT INTO public.assignments (
    id,
    course_id,
    module_id,
    session_id,
    title,
    description,
    instructions,
    assignment_type,
    max_marks,
    passing_marks,
    due_date,
    is_published
) VALUES 
(
    '10000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000002',
    'Assignment 1: Build a Reusable Data Table Component with TypeScript',
    'Construct a generic data table supporting sorting, filtering, and pagination without third-party heavy dependencies.',
    'Submit either your GitHub link or paste your core React hook implementation and unit tests.',
    'text_or_file',
    100,
    50,
    now() + INTERVAL '14 days',
    TRUE
),
(
    '10000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000004',
    'Assignment 2: Multi-Tenant RLS Policy Implementation',
    'Design and write SQL policies ensuring organization isolation for a multi-tenant SaaS workspace.',
    'Write the SQL migration containing tables: organizations, memberships, and projects, along with SELECT, INSERT, UPDATE RLS policies.',
    'text_or_file',
    100,
    60,
    now() + INTERVAL '21 days',
    TRUE
)
ON CONFLICT (id) DO NOTHING;

-- 9. SEED QUIZZES & QUESTIONS
INSERT INTO public.quizzes (
    id,
    course_id,
    module_id,
    title,
    description,
    time_limit_minutes,
    passing_percentage,
    is_published
) VALUES 
(
    '20000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'Module 1 Assessment: React Internals & Modern Web Architecture',
    'Test your understanding of reconciliation, useEffect dependencies, and TypeScript generics.',
    20,
    60,
    TRUE
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quiz_questions (
    quiz_id,
    question_text,
    options,
    correct_option_index,
    explanation,
    marks,
    order_index
) VALUES 
(
    '20000000-0000-0000-0000-000000000001',
    'What is the primary benefit of React Query / TanStack Query over basic useEffect data fetching?',
    '["It automatically generates CSS styles", "It provides automated caching, deduplication, background re-validation, and optimistic updates", "It compiles JavaScript to WebAssembly", "It disables all asynchronous requests"]'::jsonb,
    1,
    'TanStack Query acts as an asynchronous state manager that handles caching, cache invalidation, and server-state synchronization seamlessly.',
    10,
    1
),
(
    '20000000-0000-0000-0000-000000000001',
    'In PostgreSQL, which command enables Row Level Security on a target table?',
    '["ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;", "CREATE RLS ON table_name;", "SET SECURITY POLICY TRUE;", "SECURE TABLE table_name;"]'::jsonb,
    0,
    'PostgreSQL requires explicit ALTER TABLE tbl ENABLE ROW LEVEL SECURITY before policies take effect for unprivileged roles.',
    10,
    2
)
ON CONFLICT DO NOTHING;

-- 10. SEED PROJECTS
INSERT INTO public.projects (
    id,
    course_id,
    title,
    description,
    requirements,
    submission_deadline,
    max_marks,
    passing_marks,
    is_published
) VALUES 
(
    '30000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Capstone: Production Full-Stack Cloud Application',
    'Build and deploy a scalable, multi-role web platform featuring authentication, real-time messaging, file uploads, and admin dashboards.',
    '1. Validated authentication and profile onboarding. 2. Role-based dashboards (Student & Admin). 3. Secure file uploads to storage bucket. 4. Deployed live on Vercel with public URL. 5. Clean GitHub repository with README and architecture diagram.',
    now() + INTERVAL '30 days',
    100,
    60,
    TRUE
)
ON CONFLICT (id) DO NOTHING;

-- 11. SEED EXAMINATIONS & QUESTIONS
INSERT INTO public.examinations (
    id,
    course_id,
    title,
    description,
    instructions,
    duration_minutes,
    total_marks,
    passing_marks,
    is_published
) VALUES 
(
    '40000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'TNV Certified Full-Stack Cloud Architect - Comprehensive Examination',
    'Official proctored qualification exam assessing database design, security architecture, and system scalability.',
    'Timer starts as soon as you click Start. Answers are auto-saved. Multiple tabs or switching windows will be flagged. Passing score is 50%.',
    45,
    50,
    25,
    TRUE
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exam_questions (
    exam_id,
    question_text,
    options,
    correct_option_index,
    marks,
    order_index
) VALUES 
(
    '40000000-0000-0000-0000-000000000001',
    'Which HTTP header is essential for mitigating Cross-Site Scripting (XSS) attacks in modern web applications?',
    '["Access-Control-Allow-Origin", "Content-Security-Policy (CSP)", "X-Forwarded-For", "Cache-Control"]'::jsonb,
    1,
    10,
    1
),
(
    '40000000-0000-0000-0000-000000000001',
    'What does the PostgreSQL EXPLAIN ANALYZE command do?',
    '["Formats the SQL query into standard lowercase", "Executes the query and outputs the actual execution time, plan, and buffer usage", "Rolls back all uncommitted transactions", "Deletes index records"]'::jsonb,
    1,
    10,
    2
),
(
    '40000000-0000-0000-0000-000000000001',
    'Why is it a security vulnerability to expose the Supabase service_role key in frontend source code?',
    '["It slows down page rendering", "It completely bypasses all Row Level Security (RLS) policies giving full superuser database access", "It invalidates TLS certificates", "It limits the maximum number of connections"]'::jsonb,
    1,
    10,
    3
),
(
    '40000000-0000-0000-0000-000000000001',
    'In a relational database, what does a foreign key with ON DELETE CASCADE signify?',
    '["Child rows are preserved when the referenced parent row is deleted", "Referenced child rows are automatically deleted when the parent row is deleted", "The table is dropped on error", "The database prevents deleting any row forever"]'::jsonb,
    1,
    10,
    4
),
(
    '40000000-0000-0000-0000-000000000001',
    'Which React hook is specifically designed to memoize expensive computations between renders?',
    '["useCallback", "useMemo", "useRef", "useLayoutEffect"]'::jsonb,
    1,
    10,
    5
)
ON CONFLICT DO NOTHING;

-- 12. SEED LIVE SESSIONS
INSERT INTO public.live_sessions (
    id,
    course_id,
    module_id,
    title,
    description,
    scheduled_date,
    start_time,
    end_time,
    meeting_link,
    platform,
    instructor_name,
    is_published
) VALUES 
(
    '50000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'Live Orientation & Architectural Framework Blueprinting',
    'Interactive session introducing the curriculum, development environment, and project deliverables.',
    CURRENT_DATE + INTERVAL '2 days',
    '18:00:00',
    '19:30:00',
    'https://meet.google.com/tnv-work-live',
    'Google Meet',
    'Thamilaran',
    TRUE
),
(
    '50000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'Live Q&A and PostgreSQL Performance Workshop',
    'Live query optimization, database tuning, and doubt resolution for Module 2.',
    CURRENT_DATE + INTERVAL '9 days',
    '19:00:00',
    '20:30:00',
    'https://meet.google.com/tnv-work-live',
    'Google Meet',
    'Thamilaran',
    TRUE
)
ON CONFLICT (id) DO NOTHING;

-- 13. SEED CERTIFICATE TEMPLATES
INSERT INTO public.certificate_templates (
    id,
    workshop_id,
    template_name,
    signatory_name,
    signatory_title,
    badge_title,
    min_course_progress_percentage,
    require_all_assignments,
    require_project_approval,
    min_exam_percentage,
    is_active
) VALUES 
(
    '60000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'TNV Workshop Professional Certification Template',
    'Thamilaran',
    'Program Director & Chief Architect, TNV Workshop',
    'Certificate of Industry Excellence',
    75.00,
    TRUE,
    TRUE,
    50.00,
    TRUE
)
ON CONFLICT (id) DO NOTHING;
