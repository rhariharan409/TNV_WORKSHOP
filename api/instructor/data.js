import { getAdminClient, sendJson } from '../_supabase.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 200, { ok: true });
  }

  // Optimize client & CDN caching for instructor responses
  res.setHeader('Cache-Control', 'private, max-age=30');

  try {
    const adminClient = getAdminClient();
    const parsedUrl = new URL(req.url, 'http://localhost');
    const instructorId = req.query?.instructorId || parsedUrl.searchParams.get('instructorId');

    // 1. Fetch assigned courses for this instructor
    let assignedCourseIds = [];
    let assignedCourses = [];

    let isAdmin = false;
    if (instructorId) {
      const { data: profile } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', instructorId)
        .maybeSingle();
      if (profile && (profile.role === 'admin' || profile.role === 'super_admin')) {
        isAdmin = true;
      }
    }

    if (isAdmin) {
      const { data: allCourses } = await adminClient
        .from('courses')
        .select('*')
        .order('created_at', { ascending: true });
      assignedCourses = allCourses || [];
      assignedCourseIds = assignedCourses.map((c) => c.id);
    } else {
      if (instructorId) {
        const { data: ciList } = await adminClient
          .from('course_instructors')
          .select('course_id, course:courses(*)')
          .eq('instructor_id', instructorId);

        if (ciList && ciList.length > 0) {
          assignedCourseIds = ciList.map((ci) => ci.course_id);
          assignedCourses = ciList.map((ci) => ci.course).filter(Boolean);
        }
      }

      if (assignedCourseIds.length === 0) {
        const { data: allCourses } = await adminClient
          .from('courses')
          .select('*')
          .order('created_at', { ascending: true });

        if (allCourses && allCourses.length > 0) {
          const pub = allCourses.filter((c) => c.is_published);
          assignedCourses = pub.length > 0 ? pub : allCourses.slice(0, 1);
          assignedCourseIds = assignedCourses.map((c) => c.id);

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
    }

    // 2. Fetch independent queries in parallel via Promise.all
    let enrollments = [];
    let assignments = [];
    let examinations = [];
    let sessions = [];

    if (assignedCourseIds.length > 0) {
      const [enrRes, asnRes, examRes, sessRes] = await Promise.all([
        adminClient
          .from('course_enrollments')
          .select('*, course:courses(*), student:profiles(*)')
          .in('course_id', assignedCourseIds)
          .order('enrolled_at', { ascending: false }),
        adminClient
          .from('assignments')
          .select('*, course:courses(*)')
          .in('course_id', assignedCourseIds),
        adminClient
          .from('examinations')
          .select('*, course:courses(*), questions:exam_questions(*)')
          .in('course_id', assignedCourseIds),
        adminClient
          .from('live_sessions')
          .select('*, course:courses(*)')
          .in('course_id', assignedCourseIds),
      ]);

      enrollments = enrRes.data || [];
      assignments = asnRes.data || [];
      examinations = examRes.data || [];
      sessions = sessRes.data || [];
    }

    const assignmentIds = assignments.map((a) => a.id);
    const examIds = examinations.map((e) => e.id);

    // 3. Fetch dependent queries in parallel
    let submissions = [];
    let examAttempts = [];

    if (assignmentIds.length > 0 || examIds.length > 0) {
      const [subsRes, attsRes] = await Promise.all([
        assignmentIds.length > 0
          ? adminClient
              .from('assignment_submissions')
              .select('*, student:profiles!assignment_submissions_student_id_fkey(*), assignment:assignments(*)')
              .in('assignment_id', assignmentIds)
              .order('submitted_at', { ascending: false })
          : Promise.resolve({ data: [] }),
        examIds.length > 0
          ? adminClient
              .from('exam_attempts')
              .select('*, student:profiles!exam_attempts_student_id_fkey(*), examination:examinations(*)')
              .in('exam_id', examIds)
              .order('started_at', { ascending: false })
          : Promise.resolve({ data: [] }),
      ]);

      submissions = subsRes.data || [];
      examAttempts = attsRes.data || [];
    }

    // 4. Unique enrolled students profiles
    const studentMap = new Map();
    enrollments.forEach((e) => {
      if (e.student?.id) {
        studentMap.set(e.student.id, e.student);
      }
    });
    const students = Array.from(studentMap.values());

    return sendJson(res, 200, {
      success: true,
      assignedCourses,
      enrollments,
      assignments,
      submissions,
      examinations,
      examAttempts,
      sessions,
      students,
    });
  } catch (err) {
    return sendJson(res, 500, { error: err.message });
  }
}
