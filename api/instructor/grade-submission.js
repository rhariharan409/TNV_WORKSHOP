import { sendJson, requireUser } from '../_supabase.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 200, { ok: true });
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const auth = await requireUser(req, ['instructor', 'admin', 'super_admin']);
  if (auth.error) {
    return sendJson(res, auth.status || 401, { error: auth.error });
  }

  try {
    const adminClient = auth.adminClient;
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }
    const { submissionId, marks, feedback, evaluatorId } = body || {};

    // For instructors, evaluator is verified user id; admins may pass evaluatorId
    const evaluatedBy = auth.role === 'instructor' ? auth.user.id : (evaluatorId || auth.user.id);

    const { data, error } = await adminClient
      .from('assignment_submissions')
      .update({
        marks_obtained: Number(marks) || 0,
        feedback,
        status: 'evaluated',
        evaluated_at: new Date().toISOString(),
        evaluated_by: evaluatedBy,
      })
      .eq('id', submissionId)
      .select('*, student:profiles(*), assignment:assignments(*)')
      .single();

    if (error) throw error;
    return sendJson(res, 200, { success: true, data });
  } catch (err) {
    return sendJson(res, 400, { error: err.message });
  }
}
