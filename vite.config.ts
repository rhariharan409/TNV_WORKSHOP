import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'enrollment-api',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url?.startsWith('/api/enroll-course') && req.method === 'POST') {
              let body = '';
              req.on('data', (chunk) => {
                body += chunk;
              });
              req.on('end', async () => {
                try {
                  const { courseId, studentId } = JSON.parse(body);
                  const supabaseUrl = env.VITE_SUPABASE_URL;
                  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

                  if (!supabaseUrl || !serviceKey) {
                    throw new Error('Supabase environment variables are missing');
                  }

                  const adminClient = createClient(supabaseUrl, serviceKey);

                  // 1. Check existing enrollment
                  const { data: existing } = await adminClient
                    .from('course_enrollments')
                    .select('*, course:courses(*), student:profiles(*)')
                    .eq('course_id', courseId)
                    .eq('student_id', studentId)
                    .maybeSingle();

                  if (existing) {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(existing));
                    return;
                  }

                  // 2. Insert enrollment record
                  let insertResult = await adminClient
                    .from('course_enrollments')
                    .insert({
                      course_id: courseId,
                      student_id: studentId,
                      status: 'active',
                      progress_percentage: 0.0,
                      is_completed: false,
                      enrolled_at: new Date().toISOString(),
                    })
                    .select('*, course:courses(*), student:profiles(*)')
                    .single();

                  if (insertResult.error && (insertResult.error.message.includes('status') || insertResult.error.message.includes('column'))) {
                    insertResult = await adminClient
                      .from('course_enrollments')
                      .insert({
                        course_id: courseId,
                        student_id: studentId,
                        progress_percentage: 0.0,
                        is_completed: false,
                        enrolled_at: new Date().toISOString(),
                      })
                      .select('*, course:courses(*), student:profiles(*)')
                      .single();
                  }

                  if (insertResult.error) {
                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: insertResult.error.message }));
                    return;
                  }

                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(insertResult.data));
                } catch (err: any) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: err.message }));
                }
              });
              return;
            }
            next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
