import { getAdminClient, sendJson } from '../_supabase.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 200, { ok: true });
  }

  try {
    const adminClient = getAdminClient();
    const parsedUrl = new URL(req.url, 'http://localhost');
    const instructorId = req.query?.instructorId || parsedUrl.searchParams.get('instructorId');

    // 1. Fetch assigned courses for this instructor
    let assignedCourseIds = [];
    let assignedCourses = [];

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

    // 2. Fetch enrollments for assigned courses
    let enrollments = [];
    if (assignedCourseIds.length > 0) {
      const { data: enrs } = await adminClient
        .from('course_enrollments')
        .select('*, course:courses(*), student:profiles(*)')
        .in('course_id', assignedCourseIds)
        .order('enrolled_at', { ascending: false });
      enrollments = enrs || [];
    }

    // 3. Fetch assignments
    let assignments = [];
    let assignmentIds = [];
    if (assignedCourseIds.length > 0) {
      const { data: asns } = await adminClient
        .from('assignments')
        .select('*, course:courses(*)')
        .in('course_id', assignedCourseIds);
      assignments = asns || [];
      assignmentIds = assignments.map((a) => a.id);
    }

    // 4. Fetch submissions
    let submissions = [];
    if (assignmentIds.length > 0) {
      const { data: subs } = await adminClient
        .from('assignment_submissions')
        .select('*, student:profiles!assignment_submissions_student_id_fkey(*), assignment:assignments(*)')
        .in('assignment_id', assignmentIds)
        .order('submitted_at', { ascending: false });
      submissions = subs || [];
    }

    // 5. Fetch examinations with questions
    let examinations = [];
    let examIds = [];
    if (assignedCourseIds.length > 0) {
      const { data: exams } = await adminClient
        .from('examinations')
        .select('*, course:courses(*), questions:exam_questions(*)')
        .in('course_id', assignedCourseIds);
      examinations = exams || [];
      examIds = examinations.map((e) => e.id);
    }

    // 6. Fetch exam attempts
    let examAttempts = [];
    if (examIds.length > 0) {
      const { data: atts } = await adminClient
        .from('exam_attempts')
        .select('*, student:profiles!exam_attempts_student_id_fkey(*), examination:examinations(*)')
        .in('exam_id', examIds)
        .order('started_at', { ascending: false });
      examAttempts = atts || [];
    }

    // 7. Fetch live sessions
    let sessions = [];
    if (assignedCourseIds.length > 0) {
      const { data: sess } = await adminClient
        .from('live_sessions')
        .select('*, course:courses(*)')
        .in('course_id', assignedCourseIds);
      sessions = sess || [];
    }

    // 8. Unique enrolled students profiles
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
