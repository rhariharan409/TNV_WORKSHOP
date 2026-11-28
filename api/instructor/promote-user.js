import { sendJson, requireUser } from '../_supabase.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 200, { ok: true });
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const auth = await requireUser(req, ['admin', 'super_admin']);
  if (auth.error) {
    return sendJson(res, auth.status || 401, { error: auth.error });
  }

  try {
    const adminClient = auth.adminClient;
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }
    const { studentId, courseIds } = body || {};

    await adminClient.from('profiles').update({ role: 'instructor' }).eq('id', studentId);

    if (Array.isArray(courseIds)) {
      for (const cId of courseIds) {
        await adminClient
          .from('course_instructors')
          .upsert(
            { course_id: cId, instructor_id: studentId },
            { onConflict: 'course_id,instructor_id' }
          );
      }
    }

    return sendJson(res, 200, { success: true });
  } catch (err) {
    return sendJson(res, 400, { error: err.message });
  }
}
