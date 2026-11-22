
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  throw new Error('Missing Supabase environment variables');
}

async function testStudentEnroll() {
  const studentClient = createClient(supabaseUrl, anonKey);

  const { data: authData, error: loginErr } =
    await studentClient.auth.signInWithPassword({
      email: process.env.TEST_STUDENT_EMAIL,
      password: process.env.TEST_STUDENT_PASSWORD
    });

  if (loginErr) {
    console.error('Login failed:', loginErr.message);
    return;
  }

  console.log('Student user id:', authData?.user?.id);

  const { data: courses, error: courseErr } = await studentClient
    .from('courses')
    .select('id, title, is_published, workshop_id')
    .eq('is_published', true);

  if (courseErr) {
    console.error('Course fetch failed:', courseErr.message);
    return;
  }

  console.log('Available published courses:', courses);

  if (courses && courses.length > 0) {
    const course = courses[0];

    console.log('Attempting enrollment:', course.title);

    const { data: enrData, error: enrErr } = await studentClient
      .from('course_enrollments')
      .insert({
        course_id: course.id,
        student_id: authData.user.id,
        status: 'active',
        progress_percentage: 0,
        is_completed: false,
        enrolled_at: new Date().toISOString()
      })
      .select()
      .single();

    console.log('Enrollment result:', enrData, enrErr);
  }
}

testStudentEnroll();
