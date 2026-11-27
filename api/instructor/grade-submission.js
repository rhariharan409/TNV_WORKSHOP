import { getAdminClient, sendJson } from '../_supabase.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 200, { ok: true });
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const adminClient = getAdminClient();
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }
    const { submissionId, marks, feedback, evaluatorId } = body || {};

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
    return sendJson(res, 200, { success: true, data });
  } catch (err) {
    return sendJson(res, 400, { error: err.message });
  }
}
