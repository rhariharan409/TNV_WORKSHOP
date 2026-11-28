import { sendJson, requireUser } from '../_supabase.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return sendJson(res, 200, { ok: true });
  }

  const auth = await requireUser(req, ['instructor', 'admin', 'super_admin']);
  if (auth.error) {
    return sendJson(res, auth.status || 401, { error: auth.error });
  }

  const adminClient = auth.adminClient;

  if (req.method === 'GET') {
    try {
      const parsedUrl = new URL(req.url, 'http://localhost');
      const examId = req.query?.examId || parsedUrl.searchParams.get('examId');
      if (!examId) {
        return sendJson(res, 400, { error: 'examId required' });
      }

      const { data: qList, error } = await adminClient
        .from('exam_questions')
        .select('*')
        .eq('exam_id', examId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return sendJson(res, 200, qList || []);
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        body = JSON.parse(body);
      }
      const { data: newQ, error } = await adminClient
        .from('exam_questions')
        .insert(body)
        .select()
        .single();

      if (error) throw error;
      return sendJson(res, 200, newQ);
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const parsedUrl = new URL(req.url, 'http://localhost');
      const questionId = req.query?.id || parsedUrl.searchParams.get('id');
      if (questionId) {
        await adminClient.from('exam_questions').delete().eq('id', questionId);
      }
      return sendJson(res, 200, { success: true });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  return sendJson(res, 405, { error: 'Method not allowed' });
}
