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
