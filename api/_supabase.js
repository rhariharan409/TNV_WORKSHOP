import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hbocacibcgxkufvxhqpb.supabase.co';
const FALLBACK_KEY = Buffer.from('c2Jfc2VjcmV0X0FTSmNHcVZpU1NTOS1VWllDV2JlVUFfZmlvUVE5N3Q=', 'base64').toString('utf-8');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_KEY;

export function getAdminClient() {
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
