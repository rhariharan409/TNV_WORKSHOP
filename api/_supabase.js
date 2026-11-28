import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getAdminClient() {
  if (!SUPABASE_URL) {
    throw new Error('Supabase configuration error: process.env.SUPABASE_URL or process.env.VITE_SUPABASE_URL is required.');
  }
  if (!SERVICE_KEY) {
    throw new Error('Supabase configuration error: process.env.SUPABASE_SERVICE_ROLE_KEY is required.');
  }
  return createClient(SUPABASE_URL, SERVICE_KEY);
}

export function sendJson(res, statusCode, data) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (typeof res.status === 'function') {
    return res.status(statusCode).json(data);
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify(data));
}

/**
 * Validates caller's Authorization: Bearer <token>, checks against Supabase Auth,
 * and fetches caller's profile role from the profiles table.
 * 
 * @param {object} req - HTTP request object
 * @param {string[]} roles - Allowed role array e.g. ['instructor', 'admin', 'super_admin']
 * @returns {Promise<{user?: object, profile?: object, role?: string, adminClient?: object, error?: string, status?: number}>}
 */
export async function requireUser(req, roles = []) {
  const authHeader = req.headers?.authorization || req.headers?.Authorization || '';
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    return { error: 'Missing or invalid Authorization header', status: 401 };
  }

  const token = authHeader.replace(/^bearer\s+/i, '').trim();
  if (!token) {
    return { error: 'Missing token in Authorization header', status: 401 };
  }

  try {
    const adminClient = getAdminClient();
    const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !user) {
      return { error: 'Invalid or expired authorization token', status: 401 };
    }

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return { error: 'User profile not found', status: 403 };
    }

    const userRole = profile.role;
    if (roles && roles.length > 0 && !roles.includes(userRole)) {
      return { error: 'Forbidden: Insufficient permissions', status: 403 };
    }

    return { user, profile, role: userRole, adminClient };
  } catch (err) {
    return { error: err.message || 'Authentication error', status: 500 };
  }
}
