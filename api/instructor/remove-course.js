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
    const { courseId, instructorId } = body || {};

    const { error } = await adminClient
      .from('course_instructors')
      .delete()
      .match({ course_id: courseId, instructor_id: instructorId });

    if (error) throw error;
    return sendJson(res, 200, { success: true });
  } catch (err) {
    return sendJson(res, 400, { error: err.message });
  }
}
