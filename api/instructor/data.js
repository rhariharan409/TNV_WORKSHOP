import { sendJson, requireUser } from '../_supabase.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 200, { ok: true });
  }

  // Optimize client & CDN caching for instructor responses
  res.setHeader('Cache-Control', 'private, max-age=30');

  try {
    const auth = await requireUser(req, ['instructor', 'admin', 'super_admin']);
    if (auth.error) {
      return sendJson(res, auth.status || 401, { error: auth.error });
    }

    const adminClient = auth.adminClient;
    const isCallerAdmin = auth.role === 'admin' || auth.role === 'super_admin';

    const parsedUrl = new URL(req.url, 'http://localhost');
    let instructorId;
    if (isCallerAdmin) {
      // Admins may pass instructorId
      instructorId = req.query?.instructorId || parsedUrl.searchParams.get('instructorId');
    } else {
      // For instructors, ignore the instructorId query param and use the verified user id
      instructorId = auth.user.id;
    }

    // 1. Fetch assigned courses for this instructor
    let assignedCourseIds = [];
    let assignedCourses = [];

    // If caller is admin and did not specify a target instructor, or target is an admin, return all courses
    let shouldReturnAllCourses = false;
    if (isCallerAdmin) {
      if (!instructorId || instructorId === auth.user.id) {
        shouldReturnAllCourses = true;
      } else {
        const { data: targetProfile } = await adminClient
          .from('profiles')
          .select('role')
          .eq('id', instructorId)
          .maybeSingle();
        if (targetProfile && (targetProfile.role === 'admin' || targetProfile.role === 'super_admin')) {
          shouldReturnAllCourses = true;
        }
      }
    }

    if (shouldReturnAllCourses) {
      const { data: allCourses } = await adminClient
        .from('courses')
        .select('*')
        .order('created_at', { ascending: true });
      assignedCourses = allCourses || [];
      assignedCourseIds = assignedCourses.map((c) => c.id);
    } else if (instructorId) {
      const { data: ciList } = await adminClient
        .from('course_instructors')
        .select('course_id, course:courses(*)')
        .eq('instructor_id', instructorId);

      if (ciList && ciList.length > 0) {
        assignedCourseIds = ciList.map((ci) => ci.course_id);
        assignedCourses = ciList.map((ci) => ci.course).filter(Boolean);
      } else {
        // Instructor has no assigned courses: return empty list so "Request Course Assignment" screen displays
        assignedCourseIds = [];
        assignedCourses = [];
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
