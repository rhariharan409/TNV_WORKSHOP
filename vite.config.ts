import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'enrollment-api',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url?.startsWith('/api/enroll-course') && req.method === 'POST') {
              let body = '';
              req.on('data', (chunk) => {
                body += chunk;
              });
              req.on('end', async () => {
                try {
                  const { courseId, studentId } = JSON.parse(body);
                  const supabaseUrl = env.VITE_SUPABASE_URL;
                  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

                  if (!supabaseUrl || !serviceKey) {
                    throw new Error('Supabase environment variables are missing');
                  }

                  const adminClient = createClient(supabaseUrl, serviceKey);

                  // 1. Check existing enrollment
                  const { data: existing } = await adminClient
                    .from('course_enrollments')
                    .select('*, course:courses(*), student:profiles(*)')
                    .eq('course_id', courseId)
                    .eq('student_id', studentId)
                    .maybeSingle();

                  if (existing) {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(existing));
                    return;
                  }

                  // 2. Insert enrollment record
                  let insertResult = await adminClient
                    .from('course_enrollments')
                    .insert({
                      course_id: courseId,
                      student_id: studentId,
                      status: 'active',
                      progress_percentage: 0.0,
                      is_completed: false,
                      enrolled_at: new Date().toISOString(),
                    })
                    .select('*, course:courses(*), student:profiles(*)')
                    .single();

                  if (insertResult.error && (insertResult.error.message.includes('status') || insertResult.error.message.includes('column'))) {
                    insertResult = await adminClient
                      .from('course_enrollments')
                      .insert({
                        course_id: courseId,
                        student_id: studentId,
                        progress_percentage: 0.0,
                        is_completed: false,
                        enrolled_at: new Date().toISOString(),
                      })
                      .select('*, course:courses(*), student:profiles(*)')
                      .single();
                  }

                  if (insertResult.error) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: insertResult.error.message }));
                    return;
                  }

                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(insertResult.data));
                } catch (err: any) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: err.message }));
                }
              });
              return;
            }

            // --- INSTRUCTOR SCOPED DATA API ---
            if (req.url?.startsWith('/api/instructor/data') && req.method === 'GET') {
              try {
                const parsedUrl = new URL(req.url, 'http://localhost:5173');
                const instructorId = parsedUrl.searchParams.get('instructorId');
                const supabaseUrl = env.VITE_SUPABASE_URL || 'https://hbocacibcgxkufvxhqpb.supabase.co';
                const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || '';

                const adminClient = createClient(supabaseUrl, serviceKey);

                // 1. Fetch assigned courses for this instructor
                let assignedCourseIds: string[] = [];
                let assignedCourses: any[] = [];

                if (instructorId) {
                  const { data: ciList } = await adminClient
                    .from('course_instructors')
                    .select('course_id, course:courses(*)')
                    .eq('instructor_id', instructorId);

                  if (ciList && ciList.length > 0) {
                    assignedCourseIds = ciList.map((ci: any) => ci.course_id);
                    assignedCourses = ciList.map((ci: any) => ci.course).filter(Boolean);
                  }
                }

                // If no assignments explicitly recorded yet, or fallback for demo instructors
                if (assignedCourseIds.length === 0) {
                  const { data: allCourses } = await adminClient
                    .from('courses')
                    .select('*')
                    .order('created_at', { ascending: true });

                  if (allCourses && allCourses.length > 0) {
                    // Default to published courses (e.g., HTML)
                    const pub = allCourses.filter((c: any) => c.is_published);
                    assignedCourses = pub.length > 0 ? pub : allCourses.slice(0, 1);
                    assignedCourseIds = assignedCourses.map((c: any) => c.id);

                    // Ensure record exists in course_instructors for instructorId
                    if (instructorId && assignedCourses[0]?.id) {
                      await adminClient
                        .from('course_instructors')
                        .upsert(
                          { course_id: assignedCourses[0].id, instructor_id: instructorId },
                          { onConflict: 'course_id,instructor_id' }
                        );
                    }
                  }
                }

                // 2. Fetch enrollments for assigned courses
                let enrollments: any[] = [];
                if (assignedCourseIds.length > 0) {
                  const { data: enrs } = await adminClient
                    .from('course_enrollments')
                    .select('*, course:courses(*), student:profiles(*)')
                    .in('course_id', assignedCourseIds)
                    .order('enrolled_at', { ascending: false });
                  enrollments = enrs || [];
                }

                // 3. Fetch assignments for assigned courses
                let assignments: any[] = [];
                let assignmentIds: string[] = [];
                if (assignedCourseIds.length > 0) {
                  const { data: asns } = await adminClient
                    .from('assignments')
                    .select('*, course:courses(*)')
                    .in('course_id', assignedCourseIds);
                  assignments = asns || [];
                  assignmentIds = assignments.map((a: any) => a.id);
                }

                // 4. Fetch submissions for these assignments
                let submissions: any[] = [];
                if (assignmentIds.length > 0) {
                  const { data: subs } = await adminClient
                    .from('assignment_submissions')
                    .select('*, student:profiles!assignment_submissions_student_id_fkey(*), assignment:assignments(*)')
                    .in('assignment_id', assignmentIds)
                    .order('submitted_at', { ascending: false });
                  submissions = subs || [];
                }

                // 5. Fetch examinations for assigned courses (including questions)
                let examinations: any[] = [];
                let examIds: string[] = [];
                if (assignedCourseIds.length > 0) {
                  const { data: exams } = await adminClient
                    .from('examinations')
                    .select('*, course:courses(*), questions:exam_questions(*)')
                    .in('course_id', assignedCourseIds);
                  examinations = exams || [];
                  examIds = examinations.map((e: any) => e.id);
                }

                // 6. Fetch exam attempts
                let examAttempts: any[] = [];
                if (examIds.length > 0) {
                  const { data: atts } = await adminClient
                    .from('exam_attempts')
                    .select('*, student:profiles!exam_attempts_student_id_fkey(*), examination:examinations(*)')
                    .in('exam_id', examIds)
                    .order('started_at', { ascending: false });
                  examAttempts = atts || [];
                }

                // 7. Fetch live sessions
                let sessions: any[] = [];
                if (assignedCourseIds.length > 0) {
                  const { data: sess } = await adminClient
                    .from('live_sessions')
                    .select('*, course:courses(*)')
                    .in('course_id', assignedCourseIds);
                  sessions = sess || [];
                }

                // 8. Unique enrolled students profiles
                const studentMap = new Map();
                enrollments.forEach((e: any) => {
                  if (e.student?.id) {
                    studentMap.set(e.student.id, e.student);
                  }
                });
                const students = Array.from(studentMap.values());

                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    success: true,
                    assignedCourses,
                    enrollments,
                    assignments,
                    submissions,
                    examinations,
                    examAttempts,
                    sessions,
                    students,
                  })
                );
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message }));
              }
              return;
            }

            // --- INSTRUCTOR EXAM QUESTIONS API ---
            if (req.url?.startsWith('/api/instructor/exam-questions')) {
              const supabaseUrl = env.VITE_SUPABASE_URL || 'https://hbocacibcgxkufvxhqpb.supabase.co';
              const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || '';
              const adminClient = createClient(supabaseUrl, serviceKey);

              if (req.method === 'GET') {
                const parsedUrl = new URL(req.url, 'http://localhost:5173');
                const examId = parsedUrl.searchParams.get('examId');
                if (examId) {
                  const { data: qList, error } = await adminClient
                    .from('exam_questions')
                    .select('*')
                    .eq('exam_id', examId)
                    .order('order_index', { ascending: true });
                  if (error) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: error.message }));
                    return;
                  }
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(qList || []));
                  return;
                }
              }

              if (req.method === 'POST') {
                let body = '';
                req.on('data', (c) => { body += c; });
                req.on('end', async () => {
                  try {
                    const payload = JSON.parse(body);
                    const { data: newQ, error } = await adminClient
                      .from('exam_questions')
                      .insert(payload)
                      .select()
                      .single();
                    if (error) throw error;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(newQ));
                  } catch (e: any) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: e.message }));
                  }
                });
                return;
              }

              if (req.method === 'DELETE') {
                const parsedUrl = new URL(req.url, 'http://localhost:5173');
                const questionId = parsedUrl.searchParams.get('id');
                if (questionId) {
                  await adminClient.from('exam_questions').delete().eq('id', questionId);
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true }));
                  return;
                }
              }
            }

            // --- INSTRUCTOR ASSIGN COURSE API ---
            if (req.url?.startsWith('/api/instructor/assign-course') && req.method === 'POST') {
              let body = '';
              req.on('data', (chunk) => { body += chunk; });
              req.on('end', async () => {
                try {
                  const { courseId, instructorId } = JSON.parse(body);
                  const supabaseUrl = env.VITE_SUPABASE_URL || 'https://hbocacibcgxkufvxhqpb.supabase.co';
                  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || '';
                  const adminClient = createClient(supabaseUrl, serviceKey);

                  const { data, error } = await adminClient
                    .from('course_instructors')
                    .upsert({ course_id: courseId, instructor_id: instructorId }, { onConflict: 'course_id,instructor_id' })
                    .select();

                  if (error) throw error;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true, data }));
                } catch (err: any) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: err.message }));
                }
              });
              return;
            }

            // --- INSTRUCTOR REMOVE COURSE API ---
            if (req.url?.startsWith('/api/instructor/remove-course') && req.method === 'POST') {
              let body = '';
              req.on('data', (chunk) => { body += chunk; });
              req.on('end', async () => {
                try {
                  const { courseId, instructorId } = JSON.parse(body);
                  const supabaseUrl = env.VITE_SUPABASE_URL || 'https://hbocacibcgxkufvxhqpb.supabase.co';
                  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || '';
                  const adminClient = createClient(supabaseUrl, serviceKey);

                  const { error } = await adminClient
                    .from('course_instructors')
                    .delete()
                    .match({ course_id: courseId, instructor_id: instructorId });

                  if (error) throw error;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true }));
                } catch (err: any) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: err.message }));
                }
              });
              return;
            }

            // --- INSTRUCTOR PROMOTE USER API ---
            if (req.url?.startsWith('/api/instructor/promote-user') && req.method === 'POST') {
              let body = '';
              req.on('data', (chunk) => { body += chunk; });
              req.on('end', async () => {
                try {
                  const { studentId, courseIds } = JSON.parse(body);
                  const supabaseUrl = env.VITE_SUPABASE_URL || 'https://hbocacibcgxkufvxhqpb.supabase.co';
                  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || '';
                  const adminClient = createClient(supabaseUrl, serviceKey);

                  await adminClient.from('profiles').update({ role: 'instructor' }).eq('id', studentId);

                  if (Array.isArray(courseIds)) {
                    for (const cId of courseIds) {
                      await adminClient
                        .from('course_instructors')
                        .upsert({ course_id: cId, instructor_id: studentId }, { onConflict: 'course_id,instructor_id' });
                    }
                  }

                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true }));
                } catch (err: any) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: err.message }));
                }
              });
              return;
            }

            // --- INSTRUCTOR GRADE SUBMISSION API ---
            if (req.url?.startsWith('/api/instructor/grade-submission') && req.method === 'POST') {
              let body = '';
              req.on('data', (chunk) => { body += chunk; });
              req.on('end', async () => {
                try {
                  const { submissionId, marks, feedback, evaluatorId } = JSON.parse(body);
                  const supabaseUrl = env.VITE_SUPABASE_URL || 'https://hbocacibcgxkufvxhqpb.supabase.co';
                  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || '';
                  const adminClient = createClient(supabaseUrl, serviceKey);

                  const { data, error } = await adminClient
                    .from('assignment_submissions')
                    .update({
                      marks_obtained: Number(marks) || 0,
                      feedback,
                      status: 'evaluated',
                      evaluated_at: new Date().toISOString(),
                      evaluated_by: evaluatorId || null,
                    })
                    .eq('id', submissionId)
                    .select('*, student:profiles(*), assignment:assignments(*)')
                    .single();

                  if (error) throw error;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true, data }));
                } catch (err: any) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: err.message }));
                }
              });
              return;
            }
            next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
