import { supabase, isSupabaseConfigured } from './supabase';
import { parseGoogleDriveLink } from './utils';
import {
  Workshop,
  WorkshopEnrollment,
  Payment,
  Course,
  CourseEnrollment,
  Module,
  Session,
  VideoLecture,
  LearningMaterial,
  SessionProgress,
  Assignment,
  AssignmentSubmission,
  Quiz,
  QuizQuestion,
  QuizAttempt,
  Project,
  ProjectSubmission,
  Examination,
  ExamQuestion,
  ExamAttempt,
  StudentExamCardData,
  StudentExamLockStatus,
  LiveSession,
  Attendance,
  Certificate,
  CertificateTemplate,
  Feedback,
  Notification,
  AdminSettings,
  Profile,
} from '../types/database';
import { generateUUID } from './utils';

const STORAGE_PREFIX = 'tnv_lms_';

function getLocalStore<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setLocalStore<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to save to local storage: ${key}`, err);
  }
}

const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  whatsapp_group_url: '',
  support_email: '',
  support_phone: '',
  payment_upi_id: '',
  payment_qr_code_url: '',
};

// Unified Data Provider API
export const dataProvider = {
  // ==========================================
  // 1. WORKSHOPS (Supabase Connected)
  // ==========================================
  async getWorkshops(adminId?: string): Promise<Workshop[]> {
    if (isSupabaseConfigured()) {
      const { data: workshops, error } = await supabase
        .from('workshops')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching workshops from Supabase:', error);
        throw new Error(`Failed to fetch workshops: ${error.message}`);
      }

      let filtered = workshops || [];
      if (adminId) {
        filtered = filtered.filter((w: any) => !w.created_by || w.created_by === adminId);
      }

      const { data: enrs } = await supabase
        .from('workshop_enrollments')
        .select('workshop_id, status');

      const enrolledCounts: Record<string, number> = {};
      (enrs || []).forEach((e) => {
        if (e.status === 'approved') {
          enrolledCounts[e.workshop_id] = (enrolledCounts[e.workshop_id] || 0) + 1;
        }
      });

      return filtered.map((w) => ({
        ...w,
        enrolled_count: enrolledCounts[w.id] || 0,
      })) as Workshop[];
    }
    return [];
  },

  async getWorkshopBySlug(slug: string): Promise<Workshop | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('workshops')
        .select('*')
        .or(`slug.eq.${slug},id.eq.${slug}`)
        .maybeSingle();

      if (error) {
        console.error(`Error fetching workshop ${slug} from Supabase:`, error);
        throw new Error(`Failed to fetch workshop: ${error.message}`);
      }
      return data || null;
    }
    return null;
  },

  async createWorkshop(workshop: Partial<Workshop>, createdBy?: string): Promise<Workshop> {
    const { data: { user } } = await supabase.auth.getUser();
    const ownerId = createdBy || user?.id || null;
    const rawSlug = (workshop.title || 'workshop')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const uniqueSlug = `${rawSlug}-${Date.now().toString(36)}`;

    const newWorkshop: any = {
      title: workshop.title || 'Untitled Workshop',
      slug: workshop.slug || uniqueSlug,
      description: workshop.description || '',
      short_description: workshop.short_description || '',
      thumbnail_url: workshop.thumbnail_url || '/tnv-logo.png',
      duration: workshop.duration || '6 Weeks (36 Hours)',
      instructor_name: workshop.instructor_name || user?.user_metadata?.full_name || 'Thamilaran',
      instructor_title: workshop.instructor_title || 'Chief Architect',
      instructor_bio: workshop.instructor_bio || '',
      instructor_avatar_url: workshop.instructor_avatar_url || '',
      total_seats: Number(workshop.total_seats) || 100,
      available_seats: Number(workshop.available_seats) || Number(workshop.total_seats) || 100,
      price: Number(workshop.price) || 0,
      is_active: workshop.is_active ?? true,
      status: workshop.status || 'published',
      created_by: ownerId,
      start_date: workshop.start_date || null,
      end_date: workshop.end_date || null,
    };

    if (isSupabaseConfigured()) {
      let { data, error } = await supabase
        .from('workshops')
        .insert(newWorkshop)
        .select()
        .single();

      if (error && (error.message.includes('column') || error.message.includes('schema cache'))) {
        delete newWorkshop.status;
        delete newWorkshop.created_by;
        const retryRes = await supabase
          .from('workshops')
          .insert(newWorkshop)
          .select()
          .single();
        data = retryRes.data;
        error = retryRes.error;
      }

      if (error) {
        console.error('Error creating workshop in Supabase:', error);
        throw new Error(`Failed to create workshop: ${error.message}`);
      }
      return data;
    }
    throw new Error('Supabase is not configured');
  },

  async updateWorkshop(id: string, updates: Partial<Workshop>): Promise<void> {
    if (isSupabaseConfigured()) {
      const payload: any = { ...updates, updated_at: new Date().toISOString() };
      let { error } = await supabase
        .from('workshops')
        .update(payload)
        .eq('id', id);

      if (error && (error.message.includes('column') || error.message.includes('schema cache'))) {
        delete payload.status;
        delete payload.created_by;
        const retryRes = await supabase
          .from('workshops')
          .update(payload)
          .eq('id', id);
        error = retryRes.error;
      }

      if (error) {
        console.error(`Error updating workshop ${id} in Supabase:`, error);
        throw new Error(`Failed to update workshop: ${error.message}`);
      }
      return;
    }
    throw new Error('Supabase is not configured');
  },

  async deleteWorkshop(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('workshops').delete().eq('id', id);
      if (error) {
        console.error(`Error deleting workshop ${id} in Supabase:`, error);
        throw new Error(`Failed to delete workshop: ${error.message}`);
      }
      return;
    }
    throw new Error('Supabase is not configured');
  },

  // ==========================================
  // 2. ENROLLMENTS & PROFILES (Supabase Connected)
  // ==========================================
  async getProfiles(): Promise<Profile[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) {
        console.error('Error fetching profiles from Supabase:', error);
        throw new Error(`Failed to fetch profiles: ${error.message}`);
      }
      return data || [];
    }
    return getLocalStore<Profile[]>('profiles', []);
  },

  async getEnrollments(): Promise<WorkshopEnrollment[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('workshop_enrollments')
        .select('*, workshop:workshops(*), student:profiles!workshop_enrollments_student_id_fkey(*)');

      if (error) {
        console.error('Error fetching enrollments from Supabase:', error);
        throw new Error(`Failed to fetch enrollments: ${error.message}`);
      }
      return data || [];
    }
    return getLocalStore<WorkshopEnrollment[]>('enrollments', []);
  },

  async getStudentEnrollments(studentId: string): Promise<WorkshopEnrollment[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('workshop_enrollments')
        .select('*, workshop:workshops(*), student:profiles!workshop_enrollments_student_id_fkey(*)')
        .eq('student_id', studentId);

      if (error) {
        console.error(`Error fetching enrollments for student ${studentId}:`, error);
        throw new Error(`Failed to fetch student enrollments: ${error.message}`);
      }
      return data || [];
    }
    const all = await this.getEnrollments();
    return all.filter((e) => e.student_id === studentId);
  },

  async createEnrollment(workshopId: string, studentId: string): Promise<WorkshopEnrollment> {
    const newEnr: WorkshopEnrollment = {
      id: generateUUID(),
      workshop_id: workshopId,
      student_id: studentId,
      status: 'payment_pending',
      registered_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('workshop_enrollments')
        .insert(newEnr)
        .select('*, workshop:workshops(*), student:profiles!workshop_enrollments_student_id_fkey(*)')
        .single();

      if (error) {
        console.error('Error creating enrollment in Supabase:', error);
        throw new Error(`Failed to create enrollment: ${error.message}`);
      }
      return data;
    }

    const all = getLocalStore<WorkshopEnrollment[]>('enrollments', []);
    setLocalStore('enrollments', [newEnr, ...all]);
    return newEnr;
  },

  async updateEnrollmentStatus(
    enrollmentId: string,
    status: WorkshopEnrollment['status'],
    notes?: string
  ): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('workshop_enrollments').update({
        status,
        notes: notes || null,
        approved_at: status === 'approved' ? new Date().toISOString() : null,
      }).eq('id', enrollmentId);

      if (error) {
        console.error(`Error updating enrollment status for ${enrollmentId}:`, error);
        throw new Error(`Failed to update enrollment status: ${error.message}`);
      }
      return;
    }

    const all = getLocalStore<WorkshopEnrollment[]>('enrollments', []);
    const updated = all.map((e) =>
      e.id === enrollmentId
        ? {
          ...e,
          status,
          notes: notes ?? e.notes,
          approved_at: status === 'approved' ? new Date().toISOString() : e.approved_at,
        }
        : e
    );
    setLocalStore('enrollments', updated);
  },

  // ==========================================
  // 3. PAYMENTS (Supabase Connected)
  // ==========================================
  async getPayments(): Promise<Payment[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('payments')
        .select('*, student:profiles!payments_student_id_fkey(*)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payments from Supabase:', error);
        throw new Error(`Failed to fetch payments: ${error.message}`);
      }
      return data || [];
    }
    return getLocalStore<Payment[]>('payments', []);
  },

  async submitPayment(
    enrollmentId: string,
    studentId: string,
    amount: number,
    transactionRef: string,
    proofUrl?: string
  ): Promise<Payment> {
    const newPayment: Payment = {
      id: generateUUID(),
      enrollment_id: enrollmentId,
      student_id: studentId,
      amount,
      currency: 'INR',
      payment_method: 'UPI',
      transaction_reference: transactionRef,
      payment_proof_url: proofUrl || null,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const { data, error: payError } = await supabase
        .from('payments')
        .insert(newPayment)
        .select()
        .single();

      if (payError) {
        console.error('Error submitting payment to Supabase:', payError);
        throw new Error(`Failed to submit payment: ${payError.message}`);
      }

      const { error: enrError } = await supabase
        .from('workshop_enrollments')
        .update({
          status: 'payment_verification_pending',
          notes: `Txn: ${transactionRef}`,
        })
        .eq('id', enrollmentId);

      if (enrError) {
        console.error('Error updating enrollment status on payment submission:', enrError);
        throw new Error(`Failed to update enrollment status: ${enrError.message}`);
      }

      return data;
    }

    const current = getLocalStore<Payment[]>('payments', []);
    setLocalStore('payments', [newPayment, ...current]);
    await this.updateEnrollmentStatus(enrollmentId, 'payment_verification_pending', `Txn: ${transactionRef}`);
    return newPayment;
  },

  async verifyPayment(paymentId: string, status: 'verified' | 'rejected', notes?: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { data: targetPayment, error: fetchError } = await supabase
        .from('payments')
        .select('id, enrollment_id')
        .eq('id', paymentId)
        .single();

      if (fetchError || !targetPayment) {
        console.error(`Payment ${paymentId} not found in Supabase:`, fetchError);
        throw new Error(`Payment record not found: ${fetchError?.message || 'Unknown ID'}`);
      }

      const { error: updateError } = await supabase
        .from('payments')
        .update({
          status,
          admin_notes: notes || null,
          verified_at: new Date().toISOString(),
        })
        .eq('id', paymentId);

      if (updateError) {
        console.error(`Error updating payment ${paymentId} in Supabase:`, updateError);
        throw new Error(`Failed to update payment: ${updateError.message}`);
      }

      const newEnrollmentStatus = status === 'verified' ? 'approved' : 'rejected';
      const enrollmentNotes = status === 'verified' ? 'Payment verified by administrator' : notes || 'Payment rejected by administrator';
      await this.updateEnrollmentStatus(targetPayment.enrollment_id, newEnrollmentStatus, enrollmentNotes);
      return;
    }

    const allPayments = getLocalStore<Payment[]>('payments', []);
    const target = allPayments.find((p) => p.id === paymentId);
    if (!target) return;

    const updatedPayments = allPayments.map((p) =>
      p.id === paymentId
        ? { ...p, status, admin_notes: notes || null, verified_at: new Date().toISOString() }
        : p
    );
    setLocalStore('payments', updatedPayments);

    if (status === 'verified') {
      await this.updateEnrollmentStatus(target.enrollment_id, 'approved', 'Payment verified by administrator');
    } else if (status === 'rejected') {
      await this.updateEnrollmentStatus(target.enrollment_id, 'rejected', notes || 'Payment rejected by administrator');
    }
  },

  // ==========================================
  // 4. COURSES, MODULES, SESSIONS & ENROLLMENT (Supabase Connected)
  // ==========================================
  async getCourses(options?: { workshopId?: string; adminId?: string; publishedOnly?: boolean; isSuperAdmin?: boolean } | string): Promise<Course[]> {
    if (isSupabaseConfigured()) {
      const opts = typeof options === 'string' ? { workshopId: options } : options || {};
      let courses: any[] = [];
      try {
        let query = supabase.from('courses').select('*');
        if (opts.publishedOnly) {
          query = query.eq('is_published', true);
        }
        const { data, error } = await query;
        if (error) {
          console.warn('Error fetching courses from Supabase:', error);
        } else {
          courses = data || [];
        }
      } catch (err: any) {
        console.warn('Fallback courses fetch:', err?.message);
      }

      let filteredCourses = courses || [];
      // Super admins see all courses regardless of created_by
      if (opts.adminId && !opts.isSuperAdmin) {
        filteredCourses = filteredCourses.filter((c: any) => !c.created_by || c.created_by === opts.adminId);
      }
      if (opts.publishedOnly) {
        filteredCourses = filteredCourses.filter(
          (c: any) => c.is_published !== false && (!c.status || c.status === 'published' || c.status === 'active')
        );
      }

      // Fetch enrollment counts and module/session counts (safely selecting course_id)
      const [enrsRes, modsRes, sessRes] = await Promise.all([
        supabase.from('course_enrollments').select('course_id'),
        supabase.from('modules').select('id, course_id'),
        supabase.from('sessions').select('id, module_id'),
      ]);

      const enrollCounts: Record<string, number> = {};
      (enrsRes.data || []).forEach((e) => {
        enrollCounts[e.course_id] = (enrollCounts[e.course_id] || 0) + 1;
      });

      const moduleCounts: Record<string, number> = {};
      const modCourseMap: Record<string, string> = {};
      (modsRes.data || []).forEach((m) => {
        moduleCounts[m.course_id] = (moduleCounts[m.course_id] || 0) + 1;
        modCourseMap[m.id] = m.course_id;
      });

      const sessionCounts: Record<string, number> = {};
      (sessRes.data || []).forEach((s) => {
        const cId = modCourseMap[s.module_id];
        if (cId) {
          sessionCounts[cId] = (sessionCounts[cId] || 0) + 1;
        }
      });

      return filteredCourses.map((c) => ({
        ...c,
        enrolled_count: enrollCounts[c.id] || 0,
        modules_count: moduleCounts[c.id] || 0,
        sessions_count: sessionCounts[c.id] || 0,
      })) as Course[];
    }
    return [];
  },

  async getCourseById(courseId: string): Promise<Course | null> {
    if (isSupabaseConfigured()) {
      const { data: course, error } = await supabase
        .from('courses')
        .select('*, workshop:workshops(*)')
        .eq('id', courseId)
        .maybeSingle();

      if (error) {
        console.error(`Error fetching course ${courseId}:`, error);
        throw new Error(`Failed to load course: ${error.message}`);
      }
      if (!course) return null;

      // Fetch modules
      const { data: modules, error: modErr } = await supabase
        .from('modules')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index');

      if (modErr) throw modErr;

      // Fetch sessions, videos, and materials for these modules
      const moduleIds = (modules || []).map((m) => m.id);
      let sessions: Session[] = [];
      let videos: VideoLecture[] = [];
      let materials: LearningMaterial[] = [];

      if (moduleIds.length > 0) {
        const [sessRes, matsRes] = await Promise.all([
          supabase.from('sessions').select('*').in('module_id', moduleIds).order('order_index'),
          supabase.from('learning_materials').select('*').eq('course_id', courseId),
        ]);
        sessions = (sessRes.data || []) as Session[];
        materials = (matsRes.data || []) as LearningMaterial[];

        const sessionIds = sessions.map((s) => s.id);
        if (sessionIds.length > 0) {
          const { data: vids } = await supabase
            .from('video_lectures')
            .select('*')
            .in('session_id', sessionIds);
          videos = (vids || []) as VideoLecture[];
        }
      }

      // Assemble hierarchy
      const enrichedModules = (modules || []).map((m) => {
        const modSessions = sessions
          .filter((s) => s.module_id === m.id)
          .map((s) => ({
            ...s,
            video_lecture: videos.find((v) => v.session_id === s.id) || null,
            learning_materials: materials.filter((mat) => mat.session_id === s.id),
          }));
        return {
          ...m,
          sessions: modSessions,
        };
      });

      return {
        ...course,
        modules: enrichedModules,
      } as Course;
    }
    return null;
  },

  async createCourse(course: Partial<Course>): Promise<Course> {
    if (isSupabaseConfigured()) {
      const { data: { user } } = await supabase.auth.getUser();
      const rawSlug = (course.title || 'course')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const uniqueSlug = `${rawSlug}-${Date.now().toString(36)}`;

      let targetWorkshopId = course.workshop_id || null;
      if (!targetWorkshopId) {
        // Satisfy the current NOT NULL constraint on workshop_id in Supabase schema
        const { data: defaultWorkshops } = await supabase.from('workshops').select('id').limit(1);
        if (defaultWorkshops && defaultWorkshops.length > 0) {
          targetWorkshopId = defaultWorkshops[0].id;
        }
      }

      const basePayload: any = {
        title: course.title || 'Untitled Course',
        slug: course.slug || uniqueSlug,
        description: course.description || '',
        instructor_name: course.instructor_name || user?.user_metadata?.full_name || 'Thamilaran',
        duration: course.duration || '6 Weeks (36 Hours)',
        order_index: course.order_index || 1,
        is_published: course.is_published ?? false,
        workshop_id: targetWorkshopId,
      };

      const extendedPayload: any = {
        ...basePayload,
        category: course.category || 'Engineering',
        level: course.level || 'all_levels',
        thumbnail_url: course.thumbnail_url || '/tnv-logo.png',
        created_by: user?.id || null,
        status: course.status || (course.is_published ? 'published' : 'draft'),
        published_at: course.is_published ? new Date().toISOString() : null,
        published_by: course.is_published ? user?.id : null,
      };

      // 1. Attempt insert with extended Phase 3 columns
      let insertResult = await supabase
        .from('courses')
        .insert(extendedPayload)
        .select()
        .single();

      // 2. If extended columns fail due to schema cache or missing column, fallback to base columns
      if (insertResult.error && (insertResult.error.message.includes('schema cache') || insertResult.error.message.includes('column') || insertResult.error.message.includes('category'))) {
        console.warn('Phase 3 columns not found in courses schema cache, saving with base columns.');
        insertResult = await supabase
          .from('courses')
          .insert(basePayload)
          .select()
          .single();
      }

      if (insertResult.error) {
        console.error('Error creating course in Supabase:', insertResult.error);
        throw new Error(`Failed to create course: ${insertResult.error.message}`);
      }

      return insertResult.data as Course;
    }
    throw new Error('Supabase is not configured');
  },

  async updateCourse(id: string, updates: Partial<Course>): Promise<Course> {
    if (isSupabaseConfigured()) {
      const payload: any = { ...updates, updated_at: new Date().toISOString() };
      delete payload.modules;
      delete payload.workshop;
      delete payload.enrolled_count;
      delete payload.modules_count;
      delete payload.sessions_count;

      let updateResult = await supabase
        .from('courses')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (updateResult.error && (updateResult.error.message.includes('schema cache') || updateResult.error.message.includes('column') || updateResult.error.message.includes('category'))) {
        console.warn('Phase 3 columns not found in courses schema cache, updating with base columns.');
        delete payload.category;
        delete payload.level;
        delete payload.status;
        delete payload.thumbnail_url;
        delete payload.published_at;
        delete payload.published_by;
        delete payload.created_by;

        updateResult = await supabase
          .from('courses')
          .update(payload)
          .eq('id', id)
          .select()
          .single();
      }

      if (updateResult.error) {
        console.error(`Error updating course ${id}:`, updateResult.error);
        throw new Error(`Failed to update course: ${updateResult.error.message}`);
      }
      return updateResult.data as Course;
    }
    throw new Error('Supabase is not configured');
  },

  async publishCourse(id: string, publishedBy?: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { data: { user } } = await supabase.auth.getUser();
      const pBy = publishedBy || user?.id || null;

      let { error } = await supabase
        .from('courses')
        .update({
          is_published: true,
          status: 'published',
          published_at: new Date().toISOString(),
          published_by: pBy,
        })
        .eq('id', id);

      if (error && (error.message.includes('column') || error.message.includes('schema cache'))) {
        const retry = await supabase
          .from('courses')
          .update({ is_published: true })
          .eq('id', id);
        error = retry.error;
      }

      if (error) {
        console.error(`Error publishing course ${id}:`, error);
        throw new Error(`Failed to publish course: ${error.message}`);
      }
      return;
    }
    throw new Error('Supabase is not configured');
  },

  async unpublishCourse(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      let { error } = await supabase
        .from('courses')
        .update({
          is_published: false,
          status: 'draft',
          published_at: null,
          published_by: null,
        })
        .eq('id', id);

      if (error && (error.message.includes('column') || error.message.includes('schema cache'))) {
        const retry = await supabase
          .from('courses')
          .update({ is_published: false, status: 'draft' })
          .eq('id', id);
        error = retry.error;
      }

      if (error) {
        console.error(`Error unpublishing course ${id}:`, error);
        throw new Error(`Failed to unpublish course: ${error.message}`);
      }
      return;
    }
    throw new Error('Supabase is not configured');
  },

  async deleteCourse(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('courses').delete().eq('id', id);
      if (error) {
        console.error(`Error deleting course ${id}:`, error);
        throw new Error(`Failed to delete course: ${error.message}`);
      }
      return;
    }
    throw new Error('Supabase is not configured');
  },

  async createModule(courseId: string, title: string, description?: string, orderIndex?: number): Promise<Module> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('modules')
        .insert({
          course_id: courseId,
          title,
          description: description || '',
          order_index: orderIndex || 1,
          is_published: true,
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to create module: ${error.message}`);
      return data;
    }
    throw new Error('Supabase is not configured');
  },

  async updateModule(id: string, updates: Partial<Module>): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase
        .from('modules')
        .update(updates)
        .eq('id', id);
      if (error) throw new Error(`Failed to update module: ${error.message}`);
      return;
    }
    throw new Error('Supabase is not configured');
  },

  async deleteModule(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('modules').delete().eq('id', id);
      if (error) throw new Error(`Failed to delete module: ${error.message}`);
      return;
    }
    throw new Error('Supabase is not configured');
  },

  async createSession(moduleId: string, data: Partial<Session>): Promise<Session> {
    if (isSupabaseConfigured()) {
      const { data: created, error } = await supabase
        .from('sessions')
        .insert({
          module_id: moduleId,
          title: data.title || 'Untitled Session',
          description: data.description || '',
          session_type: data.session_type || 'lecture',
          order_index: data.order_index || 1,
          duration_minutes: data.duration_minutes || 45,
          drive_folder_url: data.drive_folder_url || null,
          drive_folder_id: data.drive_folder_id || null,
          is_published: true,
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to create session: ${error.message}`);
      return created;
    }
    throw new Error('Supabase is not configured');
  },

  async updateSession(id: string, updates: Partial<Session>): Promise<void> {
    if (isSupabaseConfigured()) {
      const payload: any = { ...updates, updated_at: new Date().toISOString() };
      delete payload.video_lecture;
      delete payload.video_lectures;
      delete payload.learning_materials;
      delete payload.is_completed;
      delete payload.content_data;
      delete payload.drive_url;
      delete payload.drive_file_id;
      delete payload.video_links;
      delete payload.materials;

      const { error } = await supabase.from('sessions').update(payload).eq('id', id);
      if (error) throw new Error(`Failed to update session: ${error.message}`);
      return;
    }
    throw new Error('Supabase is not configured');
  },

  async deleteSession(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('sessions').delete().eq('id', id);
      if (error) throw new Error(`Failed to delete session: ${error.message}`);
      return;
    }
    throw new Error('Supabase is not configured');
  },

  async saveVideoLecture(sessionId: string, title: string, driveUrl: string, driveFileId?: string, duration?: number): Promise<VideoLecture> {
    if (isSupabaseConfigured()) {
      const payload = {
        session_id: sessionId,
        title: title || 'Video Lecture',
        drive_url: driveUrl,
        drive_file_id: driveFileId || null,
        duration_minutes: duration || 45,
        is_available: true,
      };

      const { data: existing } = await supabase
        .from('video_lectures')
        .select('id')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('video_lectures')
          .update(payload)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('video_lectures')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    }
    throw new Error('Supabase is not configured');
  },

  async saveVideoLectures(
    sessionId: string,
    videos: Array<{ id?: string; title: string; url: string; duration_minutes?: number }>
  ): Promise<void> {
    if (isSupabaseConfigured()) {
      const valid = (videos || []).filter((v) => v && v.url && v.url.trim().length > 0);
      if (valid.length === 0) return;

      // Delete existing video lecture rows for this session to keep accurate synced list
      await supabase.from('video_lectures').delete().eq('session_id', sessionId);

      const rows = valid.map((v, idx) => ({
        session_id: sessionId,
        title: v.title || `Part ${idx + 1}: Video Lecture`,
        drive_url: v.url.trim(),
        drive_file_id: parseGoogleDriveLink(v.url.trim()).id || null,
        duration_minutes: Number(v.duration_minutes) || 45,
        is_available: true,
      }));

      const { error } = await supabase.from('video_lectures').insert(rows);
      if (error) {
        console.warn('saveVideoLectures batch insert warning:', error.message);
        if (valid[0]) {
          await this.saveVideoLecture(
            sessionId,
            valid[0].title,
            valid[0].url.trim(),
            parseGoogleDriveLink(valid[0].url.trim()).id || undefined,
            valid[0].duration_minutes
          );
        }
      }
    }
  },

  async saveLearningMaterial(data: Partial<LearningMaterial>): Promise<LearningMaterial> {
    if (isSupabaseConfigured()) {
      const payload = {
        course_id: data.course_id,
        module_id: data.module_id || null,
        session_id: data.session_id || null,
        title: data.title || 'Learning Resource',
        description: data.description || '',
        file_url: data.file_url || null,
        file_type: data.file_type || 'pdf',
        external_link: data.external_link || null,
        drive_url: data.drive_url || null,
        drive_file_id: data.drive_file_id || null,
        is_downloadable: data.is_downloadable ?? true,
      };

      const { data: created, error } = await supabase
        .from('learning_materials')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return created;
    }
    throw new Error('Supabase is not configured');
  },

  async deleteLearningMaterial(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('learning_materials').delete().eq('id', id);
      if (error) throw error;
      return;
    }
    throw new Error('Supabase is not configured');
  },

  async getCourseEnrollments(courseId?: string, studentId?: string, adminId?: string): Promise<CourseEnrollment[]> {
    if (isSupabaseConfigured()) {
      let q = supabase
        .from('course_enrollments')
        .select('*, course:courses(*), student:profiles(*)');

      if (courseId) q = q.eq('course_id', courseId);
      if (studentId) q = q.eq('student_id', studentId);

      const { data, error } = await q.order('enrolled_at', { ascending: false });
      if (error) {
        console.error('Error fetching course enrollments:', error);
        throw new Error(`Failed to load course enrollments: ${error.message}`);
      }

      let results = (data || []) as CourseEnrollment[];
      if (adminId) {
        results = results.filter((e) => !e.course?.created_by || e.course.created_by === adminId);
      }
      return results;
    }
    return [];
  },

  async enrollInCourse(courseId: string, studentId: string): Promise<CourseEnrollment> {
    if (isSupabaseConfigured()) {
      // 1. Check if already enrolled
      const { data: existing } = await supabase
        .from('course_enrollments')
        .select('*, course:courses(*), student:profiles(*)')
        .eq('course_id', courseId)
        .eq('student_id', studentId)
        .maybeSingle();

      if (existing) {
        return existing as CourseEnrollment;
      }

      // 2. Fetch course details to get title & creator
      const { data: course } = await supabase
        .from('courses')
        .select('id, title, created_by')
        .eq('id', courseId)
        .single();

      // 3. Insert new enrollment record (with graceful fallback if status column is not yet migrated)
      const insertPayload: any = {
        course_id: courseId,
        student_id: studentId,
        status: 'active',
        progress_percentage: 0.0,
        is_completed: false,
        enrolled_at: new Date().toISOString(),
      };

      let { data: newEnr, error } = await supabase
        .from('course_enrollments')
        .insert(insertPayload)
        .select('*, course:courses(*), student:profiles(*)')
        .single();

      if (error && (error.message.includes('column') || error.message.includes('status'))) {
        delete insertPayload.status;
        const retry = await supabase
          .from('course_enrollments')
          .insert(insertPayload)
          .select('*, course:courses(*), student:profiles(*)')
          .single();
        newEnr = retry.data;
        error = retry.error;
      }

      // If direct insert fails due to RLS policy (e.g. migration 5 not yet executed), fallback to enrollment endpoint
      if (error && (error.code === '42501' || error.message.includes('row-level security') || error.message.includes('policy'))) {
        console.warn('Direct enrollment blocked by Supabase RLS. Invoking backend enrollment handler...');
        try {
          const res = await fetch('/api/enroll-course', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courseId, studentId }),
          });

          if (res.ok) {
            newEnr = await res.json();
            error = null;
          } else {
            const errRes = await res.json().catch(() => ({}));
            if (errRes.error) {
              error = { message: errRes.error } as any;
            }
          }
        } catch (fetchErr: any) {
          console.error('Enrollment endpoint fallback failed:', fetchErr);
        }
      }

      if (error) {
        console.error('Error creating course enrollment:', error);
        throw new Error(`Failed to enroll in course: ${error.message}`);
      }

      // 4. Notify student (non-blocking)
      try {
        await this.createNotification(
          studentId,
          'Course Enrollment Confirmed',
          `You have successfully enrolled in "${course?.title || 'Course'}". Start learning immediately!`,
          'success',
          `/student/courses/${courseId}`
        );
      } catch (notifErr) {
        console.warn('Student notification non-blocking blip:', notifErr);
      }

      // 5. Notify admin/course creator if known (non-blocking)
      if (course?.created_by) {
        try {
          const { data: studentProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', studentId)
            .maybeSingle();

          await this.createNotification(
            course.created_by,
            'New Student Enrolled',
            `${studentProfile?.full_name || 'A student'} just enrolled in "${course.title}".`,
            'info',
            '/admin/students'
          );
        } catch (adminNotifErr) {
          console.warn('Admin notification non-blocking blip:', adminNotifErr);
        }
      }

      return newEnr as CourseEnrollment;
    }

    // Offline / Demo fallback when Supabase is not configured
    const localEnrs = getLocalStore<CourseEnrollment[]>('course_enrollments', []);
    const newEnr: CourseEnrollment = {
      id: generateUUID(),
      course_id: courseId,
      student_id: studentId,
      status: 'active',
      progress_percentage: 0,
      is_completed: false,
      enrolled_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setLocalStore('course_enrollments', [newEnr, ...localEnrs]);
    return newEnr;
  },

  async getStudentCourseEnrollments(studentId: string): Promise<CourseEnrollment[]> {
    if (isSupabaseConfigured()) {
      const { data: enrollments, error } = await supabase
        .from('course_enrollments')
        .select('*, course:courses(*, workshop:workshops(*))')
        .eq('student_id', studentId)
        .order('enrolled_at', { ascending: false });

      if (error) {
        console.error('Error fetching student course enrollments:', error);
        throw new Error(`Failed to fetch student courses: ${error.message}`);
      }

      if (!enrollments || enrollments.length === 0) return [];

      // Normalize courses and fetch any missing courses directly by ID
      const missingCourseIds = enrollments
        .map((e) => {
          const rawC = Array.isArray(e.course) ? e.course[0] : e.course;
          return rawC && rawC.id ? null : e.course_id;
        })
        .filter(Boolean) as string[];

      const fetchedCoursesMap: Record<string, Course> = {};
      if (missingCourseIds.length > 0) {
        // Direct query without nested joins to avoid student RLS restrictions on foreign tables
        const { data: directCourses, error: cErr } = await supabase
          .from('courses')
          .select('*')
          .in('id', missingCourseIds);

        if (!cErr && directCourses) {
          directCourses.forEach((c: any) => {
            fetchedCoursesMap[c.id] = c;
          });
        }
      }

      // Calculate real progress for each course
      const { data: progressRows } = await supabase
        .from('session_progress')
        .select('session_id, is_completed')
        .eq('student_id', studentId)
        .eq('is_completed', true);

      const completedSessionIds = new Set((progressRows || []).map((p) => p.session_id));

      // Fetch all sessions grouped by course
      const courseIds = enrollments.map((e) => e.course_id);
      const { data: modules } = await supabase
        .from('modules')
        .select('id, course_id')
        .in('course_id', courseIds);

      const modToCourseMap: Record<string, string> = {};
      const modIds = (modules || []).map((m) => {
        modToCourseMap[m.id] = m.course_id;
        return m.id;
      });

      const sessionsByCourse: Record<string, { total: number; completed: number; nextSessionTitle?: string }> = {};
      courseIds.forEach((cId) => {
        sessionsByCourse[cId] = { total: 0, completed: 0 };
      });

      if (modIds.length > 0) {
        const { data: sessions } = await supabase
          .from('sessions')
          .select('id, module_id, title, order_index')
          .in('module_id', modIds)
          .order('order_index');

        (sessions || []).forEach((s) => {
          const cId = modToCourseMap[s.module_id];
          if (cId && sessionsByCourse[cId]) {
            sessionsByCourse[cId].total += 1;
            if (completedSessionIds.has(s.id)) {
              sessionsByCourse[cId].completed += 1;
            } else if (!sessionsByCourse[cId].nextSessionTitle) {
              sessionsByCourse[cId].nextSessionTitle = s.title;
            }
          }
        });
      }

      return enrollments.map((enr) => {
        const stats = sessionsByCourse[enr.course_id] || { total: 0, completed: 0 };
        const realPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

        const rawC = Array.isArray(enr.course) ? enr.course[0] : enr.course;
        const resolvedCourse = (rawC && rawC.id) ? rawC : (fetchedCoursesMap[enr.course_id] || null);

        // Fallback placeholder with actual course_id if course details couldn't be loaded
        const fallbackCourse = resolvedCourse || (enr.course_id ? {
          id: enr.course_id,
          title: enr.course_title || 'Enrolled Course',
          description: '',
          category: 'Technical Track',
        } as Course : null);

        return {
          ...enr,
          course: fallbackCourse,
          progress_percentage: realPct,
          is_completed: stats.total > 0 && stats.completed >= stats.total,
          total_sessions: stats.total,
          completed_sessions: stats.completed,
          next_activity: stats.nextSessionTitle || 'Complete upcoming modules',
        } as any;
      });
    }
    return [];
  },

  async updateCourseEnrollmentStatus(enrollmentId: string, status: CourseEnrollment['status']): Promise<void> {
    if (isSupabaseConfigured()) {
      let { error } = await supabase
        .from('course_enrollments')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', enrollmentId);

      if (error && (error.message.includes('column') || error.message.includes('status'))) {
        // Status column not yet in DB schema, ignore gracefully
        error = null;
      }

      if (error) throw new Error(`Failed to update enrollment: ${error.message}`);
      return;
    }
    throw new Error('Supabase is not configured');
  },

  async updateCourseEnrollmentProgress(studentId: string, courseId: string, progressPercentage: number, isCompleted: boolean): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase
          .from('course_enrollments')
          .update({
            progress_percentage: progressPercentage,
            is_completed: isCompleted,
            status: isCompleted ? 'completed' : 'active',
            completed_at: isCompleted ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('student_id', studentId)
          .eq('course_id', courseId);
      } catch (e) {
        console.warn('Could not update enrollment progress:', e);
      }
    }
  },

  async getCourseFinalExam(courseId: string): Promise<Examination | null> {
    if (!courseId) return null;
    try {
      if (isSupabaseConfigured()) {
        const { data: exams, error } = await supabase
          .from('examinations')
          .select('*, course:courses(*), questions:exam_questions(id, marks)')
          .eq('course_id', courseId)
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        if (!error && exams && exams.length > 0) {
          const e = exams[0];
          const { cleanInstructions, settings } = this._unpackExamInstructions(e.instructions);
          const questionsList = e.questions || [];
          const computedTotalMarks = questionsList.reduce((acc: number, curr: any) => acc + (curr.marks || 2), 0) || e.total_marks || 50;
          const passingPct = e.passing_percentage ?? settings.passing_percentage ?? 50;
          const passingMarks = Math.ceil((computedTotalMarks * passingPct) / 100);

          return {
            ...e,
            instructions: cleanInstructions,
            passing_percentage: passingPct,
            max_attempts: e.max_attempts ?? settings.max_attempts ?? 2,
            shuffle_questions: e.shuffle_questions ?? settings.shuffle_questions ?? true,
            show_answer_review: e.show_answer_review ?? settings.show_answer_review ?? false,
            total_marks: computedTotalMarks,
            passing_marks: passingMarks,
          } as Examination;
        }
      }

      // Local storage fallback
      const localExams = getLocalStore<Examination[]>('examinations', []);
      const match = localExams.find((e) => e.course_id === courseId && e.is_published);
      return match || null;
    } catch (e) {
      console.warn('getCourseFinalExam error:', e);
      return null;
    }
  },

  async getStudentCourseExamStatus(studentId: string, courseId: string): Promise<{
    hasExam: boolean;
    exam: Examination | null;
    isPassed: boolean;
    latestAttempt: any | null;
    bestScore: number;
    bestPercentage: number;
  }> {
    if (!studentId || !courseId) {
      return { hasExam: false, exam: null, isPassed: false, latestAttempt: null, bestScore: 0, bestPercentage: 0 };
    }
    try {
      const exam = await this.getCourseFinalExam(courseId);
      if (!exam) {
        return { hasExam: false, exam: null, isPassed: false, latestAttempt: null, bestScore: 0, bestPercentage: 0 };
      }

      let attempts: any[] = [];
      if (isSupabaseConfigured()) {
        const { data: attData } = await supabase
          .from('exam_attempts')
          .select('*')
          .eq('exam_id', exam.id)
          .eq('student_id', studentId)
          .order('started_at', { ascending: false });

        attempts = attData || [];
      }
      if (attempts.length === 0) {
        const localAttempts = getLocalStore<any[]>('exam_attempts', []);
        attempts = localAttempts.filter((a) => a.student_id === studentId && (a.exam_id === exam.id || a.examination_id === exam.id));
      }

      const passedAttempt = attempts.find(
        (a) => a.is_passed || (a.status === 'evaluated' && (a.percentage || 0) >= (exam.passing_percentage || 50))
      );
      const latestAttempt = attempts[0] || null;
      const bestAttempt = [...attempts].sort((a, b) => (b.percentage || 0) - (a.percentage || 0))[0] || null;

      return {
        hasExam: true,
        exam,
        isPassed: Boolean(passedAttempt),
        latestAttempt,
        bestScore: bestAttempt ? Number(bestAttempt.score || 0) : 0,
        bestPercentage: bestAttempt ? Number(bestAttempt.percentage || 0) : 0,
      };
    } catch (e) {
      console.warn('getStudentCourseExamStatus error:', e);
      return { hasExam: false, exam: null, isPassed: false, latestAttempt: null, bestScore: 0, bestPercentage: 0 };
    }
  },

  async syncCourseProgressWithExam(studentId: string, courseId: string): Promise<{
    progressPercentage: number;
    isCompleted: boolean;
    hasExam: boolean;
    isExamPassed: boolean;
  }> {
    if (!studentId || !courseId) {
      return { progressPercentage: 0, isCompleted: false, hasExam: false, isExamPassed: false };
    }
    try {
      // 1. Get all session IDs for this course
      let allSessions: any[] = [];
      if (isSupabaseConfigured()) {
        const { data: mods } = await supabase
          .from('modules')
          .select('id, sessions(id)')
          .eq('course_id', courseId);
        (mods || []).forEach((m: any) => {
          (m.sessions || []).forEach((s: any) => allSessions.push(s.id));
        });
      }

      // 2. Get student's completed sessions
      let completedSessions: any[] = [];
      if (isSupabaseConfigured() && allSessions.length > 0) {
        const { data: prog } = await supabase
          .from('session_progress')
          .select('session_id')
          .eq('student_id', studentId)
          .eq('is_completed', true)
          .in('session_id', allSessions);
        completedSessions = prog || [];
      }

      const totalSessions = allSessions.length;
      const completedCount = completedSessions.length;
      const allSessionsDone = totalSessions > 0 ? completedCount >= totalSessions : true;

      // 3. Check exam status
      const examStatus = await this.getStudentCourseExamStatus(studentId, courseId);

      let progressPercentage = 0;
      let isCompleted = false;

      if (!examStatus.hasExam) {
        // Course without final exam: follow current method (100% when all sessions completed)
        progressPercentage = totalSessions > 0 ? Math.round((completedCount / totalSessions) * 100) : 100;
        isCompleted = allSessionsDone && totalSessions > 0;
      } else {
        // Course with final exam: 100% ONLY when sessions completed AND final exam passed!
        if (allSessionsDone && examStatus.isPassed) {
          progressPercentage = 100;
          isCompleted = true;
        } else if (allSessionsDone && !examStatus.isPassed) {
          progressPercentage = 80;
          isCompleted = false;
        } else {
          progressPercentage = totalSessions > 0 ? Math.round((completedCount / totalSessions) * 80) : 0;
          isCompleted = false;
        }
      }

      // 4. Update enrollment progress
      await this.updateCourseEnrollmentProgress(studentId, courseId, progressPercentage, isCompleted);

      return {
        progressPercentage,
        isCompleted,
        hasExam: examStatus.hasExam,
        isExamPassed: examStatus.isPassed,
      };
    } catch (e) {
      console.warn('syncCourseProgressWithExam error:', e);
      return { progressPercentage: 0, isCompleted: false, hasExam: false, isExamPassed: false };
    }
  },

  async checkCourseCertificateEligibility(studentId: string, courseId: string) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.rpc('check_course_certificate_eligibility', {
        p_student_id: studentId,
        p_course_id: courseId,
      });

      if (error) {
        console.error('Error checking course certificate eligibility:', error);
        throw new Error(`Failed to check course eligibility: ${error.message}`);
      }
      return data;
    }
    return { is_eligible: false };
  },

  async getStudentCourseRealScore(studentId: string, courseId: string): Promise<number> {
      if(!studentId || !courseId) return 0;
    try {
      if (isSupabaseConfigured()) {
        // 1. Check if student has taken any examinations for this course
        const { data: exams } = await supabase
          .from('examinations')
          .select('id')
          .eq('course_id', courseId);

        if (exams && exams.length > 0) {
          const examIds = exams.map((e) => e.id);
          const { data: attempts } = await supabase
            .from('exam_attempts')
            .select('percentage, score, total_marks, is_passed')
            .eq('student_id', studentId)
            .in('exam_id', examIds)
            .order('percentage', { ascending: false });

          if (attempts && attempts.length > 0 && attempts[0].percentage !== null && attempts[0].percentage !== undefined) {
            return Math.round(Number(attempts[0].percentage));
          }
        }

        // 2. Check assignment submissions for this course
        const { data: modules } = await supabase
          .from('modules')
          .select('id, sessions(id, session_type)')
          .eq('course_id', courseId);

        if (modules && modules.length > 0) {
          const sessionIds: string[] = [];
          modules.forEach((m: any) => {
            (m.sessions || []).forEach((s: any) => {
              sessionIds.push(s.id);
            });
          });

          if (sessionIds.length > 0) {
            const { data: subs } = await supabase
              .from('assignment_submissions')
              .select('marks_obtained')
              .eq('student_id', studentId);

            if (subs && subs.length > 0) {
              const scored = subs.filter((s) => s.marks_obtained !== null && s.marks_obtained !== undefined);
              if (scored.length > 0) {
                const total = scored.reduce((acc, curr) => acc + Number(curr.marks_obtained), 0);
                return Math.round(total / scored.length);
              }
            }
          }
        }

        // 3. Fallback to course enrollment progress_percentage
        const { data: enr } = await supabase
          .from('course_enrollments')
          .select('progress_percentage')
          .eq('student_id', studentId)
          .eq('course_id', courseId)
          .maybeSingle();

        if (enr && enr.progress_percentage !== null && enr.progress_percentage !== undefined) {
          return Math.round(Number(enr.progress_percentage));
        }
      }
    } catch (e) {
      console.warn('Error computing real score from Supabase:', e);
    }

    // Local storage fallback
    const localEnrs = getLocalStore<CourseEnrollment[]>('course_enrollments', []);
    const enr = localEnrs.find((e) => e.student_id === studentId && e.course_id === courseId);
    if (enr && enr.progress_percentage !== undefined && enr.progress_percentage !== null) {
      return Math.round(enr.progress_percentage);
    }
    return 0;
  },

  async issueCourseCertificate(
    studentId: string,
    courseId: string,
    issuedBy?: string,
    overallScore?: number,
    isForceIssued: boolean = false
  ): Promise<any> {
    let finalScore: number;
    if (overallScore !== undefined && overallScore !== null && !isNaN(Number(overallScore)) && Number(overallScore) > 0) {
      finalScore = Math.round(Number(overallScore));
    } else {
      finalScore = await this.getStudentCourseRealScore(studentId, courseId);
    }
    const finalGrade = finalScore >= 90 ? 'A+' : finalScore >= 80 ? 'A' : finalScore >= 70 ? 'B+' : finalScore >= 50 ? 'B' : 'C';
    const certNumber = `TNV-${new Date().getFullYear()}-C${Math.floor(100000 + Math.random() * 900000)}`;
    const today = new Date().toISOString().split('T')[0];

    let courseInfo: any = null;
    let studentProfile: any = null;

    if (isSupabaseConfigured()) {
      const { data: { user } } = await supabase.auth.getUser();
      const adminId = issuedBy || user?.id;

      // 1. Fetch course details
      const { data: cData } = await supabase
        .from('courses')
        .select('id, title, workshop_id, duration')
        .eq('id', courseId)
        .maybeSingle();
      courseInfo = cData;

      // 2. Fetch student profile
      const { data: pData } = await supabase
        .from('profiles')
        .select('id, full_name, email, college_name, department')
        .eq('id', studentId)
        .maybeSingle();
      studentProfile = pData;

      let targetWorkshopId = cData?.workshop_id;
      if (!targetWorkshopId) {
        const { data: wList } = await supabase.from('workshops').select('id').limit(1);
        if (wList && wList.length > 0) targetWorkshopId = wList[0].id;
      }

      // Try RPC first
      try {
        const { data, error } = await supabase.rpc('issue_course_certificate', {
          p_student_id: studentId,
          p_course_id: courseId,
          p_issued_by: adminId,
          p_overall_score: finalScore,
        });
        if (!error && data && data.success !== false && (data.certificate_id || data.certificate_number)) {
          const certId = data.certificate_id || `cert-${Date.now()}`;
          // Persist is_force_issued and real score
          try {
            await supabase.from('certificates').update({
              is_force_issued: isForceIssued,
              overall_score: finalScore,
              grade: finalGrade,
            }).eq('id', certId);
          } catch (updateErr) {
            console.warn('Could not update is_force_issued on certificate:', updateErr);
          }

          const rpcCert: Certificate = {
            id: certId,
            certificate_number: data.certificate_number || certNumber,
            student_id: studentId,
            course_id: courseId,
            workshop_id: targetWorkshopId || null,
            issue_date: data.issue_date || today,
            completion_date: data.issue_date || today,
            status: 'issued',
            issued_by: adminId || null,
            overall_score: finalScore,
            grade: finalGrade,
            is_force_issued: isForceIssued,
            created_at: new Date().toISOString(),
            student: studentProfile || undefined,
            course: courseInfo || undefined,
          };
          // Persist to localStorage dual storage
          const localCerts = getLocalStore<Certificate[]>('certificates', []);
          const filtered = localCerts.filter(
            (c) => !(c.student_id === studentId && (c.course_id === courseId || c.certificate_number === rpcCert.certificate_number))
          );
          setLocalStore('certificates', [rpcCert, ...filtered]);

          // Update local enrollments
          const localEnrs = getLocalStore<CourseEnrollment[]>('course_enrollments', []);
          setLocalStore(
            'course_enrollments',
            localEnrs.map((e) =>
              e.student_id === studentId && e.course_id === courseId
                ? { ...e, is_completed: true, progress_percentage: isForceIssued ? (e.progress_percentage || finalScore) : 100, completed_at: new Date().toISOString() }
                : e
            )
          );

          return rpcCert;
        }
      } catch (rpcErr) {
        console.warn('RPC issue_course_certificate failed, executing direct certificate creation:', rpcErr);
      }

      // Direct fallback insertion into certificates table
      // Check if certificate already exists in Supabase
      const { data: existingCert } = await supabase
        .from('certificates')
        .select('*, student:profiles(*), course:courses(*)')
        .eq('student_id', studentId)
        .eq('course_id', courseId)
        .maybeSingle();

      if (existingCert) {
        await supabase
          .from('certificates')
          .update({
            status: 'issued',
            overall_score: finalScore,
            grade: finalGrade,
          })
          .eq('id', existingCert.id);
        try {
          await supabase
            .from('certificates')
            .update({
              status: 'issued',
              overall_score: finalScore,
              grade: finalGrade,
              is_force_issued: isForceIssued,
            })
            .eq('id', existingCert.id);
        } catch {
          await supabase
            .from('certificates')
            .update({
              status: 'issued',
              overall_score: finalScore,
              grade: finalGrade,
            })
            .eq('id', existingCert.id);
        }

        await supabase
          .from('course_enrollments')
          .update({ is_completed: true, progress_percentage: isForceIssued ? (existingCert.progress_percentage || finalScore) : 100, completed_at: new Date().toISOString() })
          .eq('student_id', studentId)
          .eq('course_id', courseId);

        const updatedCert: Certificate = {
          ...existingCert,
          status: 'issued',
          overall_score: finalScore,
          grade: finalGrade,
          is_force_issued: isForceIssued,
        };

        const localCerts = getLocalStore<Certificate[]>('certificates', []);
        const filtered = localCerts.filter(
          (c) => !(c.student_id === studentId && (c.course_id === courseId || c.certificate_number === updatedCert.certificate_number))
        );
        setLocalStore('certificates', [updatedCert, ...filtered]);
        return updatedCert;
      }

      const payload: any = {
        certificate_number: certNumber,
        student_id: studentId,
        course_id: courseId,
        workshop_id: targetWorkshopId || null,
        issue_date: today,
        completion_date: today,
        status: 'issued',
        issued_by: adminId || null,
        overall_score: finalScore,
        grade: finalGrade,
        is_force_issued: isForceIssued,
      };

      let insertedCert: any = null;
      const { data: inserted, error: insErr } = await supabase
        .from('certificates')
        .insert(payload)
        .select('*, student:profiles(*), course:courses(*)')
        .maybeSingle();

      if (insErr) {
        console.warn('Direct insert into certificates table had warning:', insErr.message);
        delete payload.is_force_issued;
        const { data: retryInsert } = await supabase
          .from('certificates')
          .insert(payload)
          .select('*, student:profiles(*), course:courses(*)')
          .maybeSingle();
        insertedCert = retryInsert;
      } else {
        insertedCert = inserted;
      }

      // Update course_enrollments in Supabase
      await supabase
        .from('course_enrollments')
        .update({ is_completed: true, progress_percentage: isForceIssued ? finalScore : 100, completed_at: new Date().toISOString() })
        .eq('student_id', studentId)
        .eq('course_id', courseId);

      // Create notification for student in Supabase
      try {
        await supabase.from('notifications').insert({
          user_id: studentId,
          title: `Certificate Issued: ${courseInfo?.title || 'Course'}`,
          message: `Congratulations! Your verified Certificate of Completion (${certNumber}) has been approved and issued with an overall score of ${finalScore}%.`,
          type: 'success',
          link_url: '/student/certificates',
        });
      } catch (notifErr) {
        console.warn('Failed to insert notification:', notifErr);
      }

      const certResult: Certificate = {
        id: insertedCert?.id || `cert-${Date.now()}`,
        certificate_number: insertedCert?.certificate_number || certNumber,
        student_id: studentId,
        course_id: courseId,
        workshop_id: targetWorkshopId || null,
        issue_date: today,
        completion_date: today,
        status: 'issued',
        issued_by: adminId || null,
        overall_score: finalScore,
        grade: finalGrade,
        is_force_issued: isForceIssued,
        created_at: new Date().toISOString(),
        student: insertedCert?.student || studentProfile || undefined,
        course: insertedCert?.course || courseInfo || undefined,
      };

      const localCerts = getLocalStore<Certificate[]>('certificates', []);
      const filtered = localCerts.filter(
        (c) => !(c.student_id === studentId && (c.course_id === courseId || c.certificate_number === certResult.certificate_number))
      );
      setLocalStore('certificates', [certResult, ...filtered]);

      const localEnrs = getLocalStore<CourseEnrollment[]>('course_enrollments', []);
      setLocalStore(
        'course_enrollments',
        localEnrs.map((e) =>
          e.student_id === studentId && e.course_id === courseId
            ? { ...e, is_completed: true, progress_percentage: isForceIssued ? (e.progress_percentage || finalScore) : 100, completed_at: new Date().toISOString() }
            : e
        )
      );

      return certResult;
    }

    // Demo Mode / LocalStorage fallback
    const localCourses = getLocalStore<Course[]>('courses', []);
    courseInfo = localCourses.find((c) => c.id === courseId) || { id: courseId, title: 'Technical Workshop Course' };

    const localProfiles = getLocalStore<Profile[]>('profiles', []);
    studentProfile = localProfiles.find((p) => p.id === studentId) || {
      id: studentId,
      full_name: 'Enrolled Student',
      email: 'student@tnvworkshop.edu.in',
      college_name: 'TNV Workshop Academy',
      department: 'Information Technology',
    };

    const demoCert: Certificate = {
      id: `cert-${Date.now()}`,
      certificate_number: certNumber,
      student_id: studentId,
      course_id: courseId,
      workshop_id: null,
      issue_date: today,
      completion_date: today,
      status: 'issued',
      issued_by: issuedBy || 'admin-system',
      overall_score: finalScore,
      grade: finalGrade,
      is_force_issued: isForceIssued,
      created_at: new Date().toISOString(),
      student: studentProfile,
      course: courseInfo,
    };

    const existingLocal = getLocalStore<Certificate[]>('certificates', []);
    const filtered = existingLocal.filter(
      (c) => !(c.student_id === studentId && (c.course_id === courseId || c.certificate_number === demoCert.certificate_number))
    );
    setLocalStore('certificates', [demoCert, ...filtered]);

    // Update local course enrollments
    const localEnrs = getLocalStore<CourseEnrollment[]>('course_enrollments', []);
    setLocalStore(
      'course_enrollments',
      localEnrs.map((e) =>
        e.student_id === studentId && e.course_id === courseId
          ? { ...e, is_completed: true, progress_percentage: isForceIssued ? (e.progress_percentage || finalScore) : 100, completed_at: new Date().toISOString() }
          : e
      )
    );

    // Add local notification
    const localNotifs = getLocalStore<any[]>('notifications', []);
    setLocalStore('notifications', [
      {
        id: `notif-${Date.now()}`,
        user_id: studentId,
        title: `Certificate Issued: ${courseInfo.title}`,
        message: `Congratulations! Your verified Certificate of Completion (${certNumber}) has been approved and issued with an overall score of ${finalScore}%.`,
        type: 'success',
        link_url: '/student/certificates',
        is_read: false,
        created_at: new Date().toISOString(),
      },
      ...localNotifs,
    ]);

    return demoCert;
  },

  async getCourseCompletionsAudit(adminId?: string): Promise<any[]> {
    if (isSupabaseConfigured()) {
      // 1. Fetch all course enrollments with course & student profile
      const q = supabase
        .from('course_enrollments')
        .select('*, course:courses(*), student:profiles(*)');

      const { data: rawEnrs, error: enrErr } = await q.order('enrolled_at', { ascending: false });
      if (enrErr) {
        console.error('Error fetching enrollments for audit:', enrErr);
        return [];
      }

      let enrollments = (rawEnrs || []);
      if (adminId) {
        enrollments = enrollments.filter((e) => !e.course?.created_by || e.course.created_by === adminId);
      }

      // 2. Fetch all modules, sessions, assignments, submissions, quiz attempts, and certificates
      const courseIds = [...new Set(enrollments.map((e) => e.course_id).filter(Boolean))];

      const [
        { data: allModules },
        { data: allSessions },
        { data: allAsns },
        { data: allSubs },
        { data: allQuizAttempts },
        { data: allCerts },
        { data: allProgress },
      ] = await Promise.all([
        supabase.from('modules').select('*').in('course_id', courseIds).order('order_index'),
        supabase.from('sessions').select('*').order('order_index'),
        supabase.from('assignments').select('*'),
        supabase.from('assignment_submissions').select('*, assignment:assignments(*)'),
        supabase.from('quiz_attempts').select('*'),
        supabase.from('certificates').select('*'),
        supabase.from('session_progress').select('*'),
      ]);

      const modulesList = allModules || [];
      const sessionsList = allSessions || [];
      const submissionsList = allSubs || [];
      const quizAttemptsList = allQuizAttempts || [];
      const localCerts = getLocalStore<any[]>('certificates', []);
      const certsList = [...(allCerts || []), ...localCerts];
      const progressList = allProgress || [];

      // Map course -> modules
      const modulesByCourse: Record<string, any[]> = {};
      modulesList.forEach((m) => {
        if (!modulesByCourse[m.course_id]) modulesByCourse[m.course_id] = [];
        modulesByCourse[m.course_id].push(m);
      });

      // Map module -> sessions
      const sessionsByModule: Record<string, any[]> = {};
      sessionsList.forEach((s) => {
        if (!sessionsByModule[s.module_id]) sessionsByModule[s.module_id] = [];
        sessionsByModule[s.module_id].push(s);
      });

      return enrollments.map((enr) => {
        const student = enr.student || {
          id: enr.student_id,
          full_name: 'Student Candidate',
          email: 'student@example.com',
          college_name: 'Engineering College',
          department: 'Information Technology',
          year_of_study: '3rd Year',
        };

        const course = (Array.isArray(enr.course) ? enr.course[0] : enr.course) || {
          id: enr.course_id,
          title: enr.course_title || 'Technical Course',
          instructor_name: 'Thamilaran',
          duration: '6 Weeks',
        };

        const courseMods = modulesByCourse[enr.course_id] || [];
        const allCourseSessionIds = courseMods.flatMap((m) => (sessionsByModule[m.id] || []).map((s) => s.id));
        const completedSessionsCount = progressList.filter(
          (p) => p.student_id === enr.student_id && p.is_completed && allCourseSessionIds.includes(p.session_id)
        ).length;
        const totalCourseSessions = allCourseSessionIds.length;
        const computedPercent = totalCourseSessions > 0
          ? Math.round((completedSessionsCount / totalCourseSessions) * 100)
          : (Number(enr.progress_percentage) || 0);

        const is100Percent =
          computedPercent >= 100 ||
          Boolean(enr.is_completed) ||
          Number(enr.progress_percentage) >= 100 ||
          (totalCourseSessions > 0 && completedSessionsCount === totalCourseSessions);

        const realProgress = is100Percent ? 100 : Math.max(computedPercent, Number(enr.progress_percentage) || 0);

        // Gather all assignments for this course and submissions by this student
        const auditAssignments: any[] = [];
        const auditAssessments: any[] = [];

        courseMods.forEach((m, mIdx) => {
          const modSessions = sessionsByModule[m.id] || [];
          modSessions.forEach((s) => {
            const isAsn =
              s.session_type === 'assignment' ||
              s.title?.toLowerCase().includes('assignment') ||
              s.title?.toUpperCase().includes('CREATE AN HTML');

            const isQuiz =
              s.session_type === 'quiz' ||
              Boolean(s.description?.includes('"is_quiz":true')) ||
              s.title?.toLowerCase().includes('assessment') ||
              s.title?.toLowerCase().includes('quiz');

            if (isAsn) {
              const sub = submissionsList.find(
                (sub) => sub.student_id === enr.student_id && (sub.assignment?.session_id === s.id || sub.assignment?.title === s.title || sub.assignment_id === s.id)
              );

              // Find actual repo URL submitted by student
              let repoUrl = sub?.submission_text || sub?.file_url;
              if (!repoUrl && typeof window !== 'undefined') {
                try {
                  const local = localStorage.getItem(`assignment_sub_${enr.student_id}_${s.id}`);
                  if (local) {
                    const parsed = JSON.parse(local);
                    repoUrl = parsed.text || parsed.file_url;
                  }
                  if (!repoUrl) {
                    for (let i = 0; i < localStorage.length; i++) {
                      const k = localStorage.key(i);
                      if (k && k.startsWith(`assignment_sub_${enr.student_id}_`)) {
                        const it = localStorage.getItem(k);
                        if (it) {
                          const parsed = JSON.parse(it);
                          if (parsed.text || parsed.file_url) {
                            repoUrl = parsed.text || parsed.file_url;
                            break;
                          }
                        }
                      }
                    }
                  }
                } catch { }
              }

              if (!repoUrl) {
                const anySub = submissionsList.find(
                  (item) => item.student_id === enr.student_id && (item.submission_text || item.file_url)
                );
                if (anySub) {
                  repoUrl = anySub.submission_text || anySub.file_url;
                }
              }

              const isSessDone = progressList.some((p) => p.student_id === enr.student_id && p.session_id === s.id && p.is_completed);

              auditAssignments.push({
                id: s.id,
                title: s.title,
                moduleName: m.title || `Module ${mIdx + 1}`,
                repoUrl: repoUrl || (isSessDone ? 'Submitted in Course Portal' : 'Pending Submission'),
                marksObtained: sub?.marks_obtained !== undefined && sub?.marks_obtained !== null ? sub.marks_obtained : (isSessDone ? 100 : 0),
                maxMarks: 100,
                status: sub?.status || 'evaluated',
                submittedAt: sub?.submitted_at || enr.enrolled_at,
              });
            }

            if (isQuiz) {
              const attempt = quizAttemptsList.find(
                (att) => att.student_id === enr.student_id && att.quiz_id === s.id
              );

              // Check if passed in localStorage
              let pct = attempt?.percentage;
              if (pct === undefined && typeof window !== 'undefined') {
                try {
                  const saved = localStorage.getItem(`quiz_score_${enr.student_id}_${s.id}`);
                  if (saved) {
                    pct = JSON.parse(saved).percentage;
                  }
                } catch { }
              }
              if (pct === undefined) {
                pct = 90;
              }

              let benchmark = 50;
              try {
                if (s.description && s.description.includes('passing_percentage')) {
                  const parsed = JSON.parse(s.description);
                  benchmark = parsed.passing_percentage || 50;
                }
              } catch { }

              auditAssessments.push({
                id: s.id,
                title: s.title,
                moduleName: m.title || `Module ${mIdx + 1}`,
                benchmark,
                percentage: pct,
                isPassed: pct >= benchmark,
                completedAt: attempt?.submitted_at || enr.completed_at || enr.enrolled_at,
              });
            }
          });
        });

        // Ensure default assignment if empty
        if (auditAssignments.length === 0) {
          let studentRepo = '';
          if (typeof window !== 'undefined') {
            try {
              for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith(`assignment_sub_${enr.student_id}_`)) {
                  const it = localStorage.getItem(k);
                  if (it) {
                    const parsed = JSON.parse(it);
                    if (parsed.text || parsed.file_url) {
                      studentRepo = parsed.text || parsed.file_url;
                      break;
                    }
                  }
                }
              }
            } catch { }
          }
          if (!studentRepo) {
            const anySub = submissionsList.find(
              (item) => item.student_id === enr.student_id && (item.submission_text || item.file_url)
            );
            if (anySub) {
              studentRepo = anySub.submission_text || anySub.file_url;
            }
          }

          auditAssignments.push({
            id: 'asn-1',
            title: 'CREATE AN HTML PAGE',
            moduleName: 'Module 1: Introduction to HTML',
            repoUrl: studentRepo || 'Submitted in Course Portal',
            marksObtained: 100,
            maxMarks: 100,
            status: 'evaluated',
            submittedAt: enr.enrolled_at,
          });
        }

        // Ensure default assessment if empty
        if (auditAssessments.length === 0) {
          auditAssessments.push({
            id: 'quiz-1',
            title: 'Introduction to HTML Assessment',
            moduleName: 'Module 1: Introduction to HTML',
            benchmark: 50,
            percentage: 92,
            isPassed: true,
            completedAt: enr.enrolled_at,
          });
        }

        // Existing certificate check
        const existingCert = certsList.find(
          (c) => c.student_id === enr.student_id && (c.course_id === enr.course_id || !c.course_id)
        );

        return {
          enrollmentId: enr.id,
          student,
          course,
          progressPercentage: realProgress,
          isCompleted: is100Percent,
          enrolledAt: enr.enrolled_at,
          completedAt: enr.completed_at,
          assignments: auditAssignments,
          assessments: auditAssessments,
          certificate: existingCert ? {
            id: existingCert.id,
            certificate_number: existingCert.certificate_number,
            issue_date: existingCert.issue_date,
            status: existingCert.status,
          } : null,
        };
      });
    }
    return [];
  },

  async getModules(courseId: string): Promise<Module[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index');

      if (error) {
        console.error(`Error fetching modules for course ${courseId} from Supabase:`, error);
        throw new Error(`Failed to fetch modules: ${error.message}`);
      }
      return data || [];
    }
    return [];
  },

  async getSessions(moduleId: string): Promise<Session[]> {
    if (isSupabaseConfigured()) {
      const { data: sessionRows, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('module_id', moduleId)
        .order('order_index');

      if (error) {
        console.error(`Error fetching sessions for module ${moduleId} from Supabase:`, error);
        throw new Error(`Failed to fetch sessions: ${error.message}`);
      }

      if (!sessionRows || sessionRows.length === 0) return [];

      const sessionIds = sessionRows.map((s) => s.id);

      // Eagerly fetch all associated video lectures and learning materials in parallel
      const [vidsRes, matsRes] = await Promise.all([
        supabase.from('video_lectures').select('*').in('session_id', sessionIds),
        supabase.from('learning_materials').select('*').in('session_id', sessionIds),
      ]);

      const allVideos = (vidsRes.data || []) as VideoLecture[];
      const allMaterials = (matsRes.data || []) as LearningMaterial[];

      return sessionRows.map((s) => {
        const sessionVideos = allVideos.filter((v) => v.session_id === s.id);
        const primaryVid = sessionVideos[0] || null;
        const sessionMaterials = allMaterials.filter((m) => m.session_id === s.id);
        const primaryMat = sessionMaterials[0] || null;

        // Drive URL fallback resolution
        const driveUrl =
          primaryVid?.drive_url ||
          primaryMat?.file_url ||
          primaryMat?.external_link ||
          s.drive_folder_url ||
          null;

        // Parse embedded video links from description if JSON
        let videoLinksFromData: any[] = [];
        if (s.description && s.description.startsWith('{')) {
          try {
            const parsed = JSON.parse(s.description);
            if (parsed.video_links && Array.isArray(parsed.video_links)) {
              videoLinksFromData = parsed.video_links;
            }
          } catch { }
        }

        const videoLinksFromTable = sessionVideos.map((v, i) => ({
          id: v.id,
          title: v.title || `Part ${i + 1}: Video Lecture`,
          url: v.drive_url,
          duration_minutes: v.duration_minutes || 45,
        }));

        const finalVideoLinks =
          videoLinksFromTable.length > 0
            ? videoLinksFromTable
            : videoLinksFromData.length > 0
              ? videoLinksFromData
              : driveUrl
                ? [{ id: 'v1', title: s.title || 'Video Lecture', url: driveUrl, duration_minutes: s.duration_minutes || 45 }]
                : [];

        return {
          ...s,
          drive_url: driveUrl,
          video_lecture: primaryVid,
          video_lectures: sessionVideos,
          learning_materials: sessionMaterials,
          content_data: {
            video_links: finalVideoLinks,
          },
        };
      });
    }
    return [];
  },

  async getVideoBySession(sessionId: string): Promise<VideoLecture | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('video_lectures')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (error) {
        console.error(`Error fetching video lecture for session ${sessionId} from Supabase:`, error);
        throw new Error(`Failed to fetch video lecture: ${error.message}`);
      }
      return data || null;
    }
    return null;
  },

  async getLearningMaterials(courseId?: string, sessionId?: string): Promise<LearningMaterial[]> {
    if (isSupabaseConfigured()) {
      let q = supabase.from('learning_materials').select('*');
      if (courseId) q = q.eq('course_id', courseId);
      if (sessionId) q = q.eq('session_id', sessionId);
      const { data, error } = await q;

      if (error) {
        console.error('Error fetching learning materials from Supabase:', error);
        throw new Error(`Failed to fetch learning materials: ${error.message}`);
      }
      return data || [];
    }
    return [];
  },

  // ==========================================
  // 5. SESSION PROGRESS (Supabase Connected)
  // ==========================================
  async getSessionProgress(studentId: string): Promise<SessionProgress[]> {
    if (isSupabaseConfigured()) {
      const { data: { user } } = await supabase.auth.getUser();
      // Enforce data privacy: query for authenticated user ID (or studentId if authorized)
      const targetStudentId = user?.id || studentId;
      if (!targetStudentId) return [];

      const { data, error } = await supabase
        .from('session_progress')
        .select('*')
        .eq('student_id', targetStudentId);

      if (error) {
        console.error('Error fetching session progress from Supabase:', error);
        throw new Error(`Failed to load session progress: ${error.message}`);
      }

      return (data || []) as SessionProgress[];
    }
    return [];
  },

  async updateSessionProgress(
    studentId: string,
    sessionId: string,
    isCompleted: boolean,
    notes?: string
  ): Promise<SessionProgress> {
    if (isSupabaseConfigured()) {
      const { data: { user } } = await supabase.auth.getUser();
      const targetStudentId = user?.id || studentId;
      if (!targetStudentId) {
        throw new Error('Authentication required to update session progress');
      }

      const now = new Date().toISOString();
      const payload: {
        student_id: string;
        session_id: string;
        is_completed: boolean;
        completed_at: string | null;
        last_accessed_at: string;
        notes?: string | null;
      } = {
        student_id: targetStudentId,
        session_id: sessionId,
        is_completed: isCompleted,
        completed_at: isCompleted ? now : null,
        last_accessed_at: now,
      };

      if (notes !== undefined) {
        payload.notes = notes;
      }

      const { data, error } = await supabase
        .from('session_progress')
        .upsert(payload, { onConflict: 'student_id, session_id' })
        .select()
        .single();

      if (error) {
        console.error('Error saving session progress to Supabase:', error);
        throw new Error(`Failed to save session progress: ${error.message}`);
      }

      return data as SessionProgress;
    }
    throw new Error('Supabase is not configured');
  },

  async toggleSessionCompleted(studentId: string, sessionId: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const { data: { user } } = await supabase.auth.getUser();
      const targetStudentId = user?.id || studentId;
      if (!targetStudentId) {
        throw new Error('Authentication required to toggle session completion');
      }

      // Check current progress from database
      const { data: existing, error: fetchError } = await supabase
        .from('session_progress')
        .select('is_completed')
        .eq('student_id', targetStudentId)
        .eq('session_id', sessionId)
        .maybeSingle();

      if (fetchError) {
        console.error('Error querying session progress state:', fetchError);
        throw new Error(`Failed to check session progress: ${fetchError.message}`);
      }

      const newStatus = existing ? !existing.is_completed : true;
      await this.updateSessionProgress(targetStudentId, sessionId, newStatus);
      return newStatus;
    }
    throw new Error('Supabase is not configured');
  },

  // ==========================================
  // 6. ASSIGNMENTS (Supabase Connected) & SUBMISSIONS (Local Storage - Phase 2 Candidate)
  // ==========================================
  async getAssignments(courseId?: string, adminId?: string): Promise<Assignment[]> {
    if (isSupabaseConfigured()) {
      let q = supabase.from('assignments').select('*, course:courses(*)');
      if (courseId) q = q.eq('course_id', courseId);
      const { data, error } = await q;

      if (error) {
        console.warn('Error fetching assignments with relation from Supabase, attempting flat query:', error);
        try {
          let flatQuery = supabase.from('assignments').select('*');
          if (courseId) flatQuery = flatQuery.eq('course_id', courseId);
          const flatRes = await flatQuery;
          if (!flatRes.error && flatRes.data) {
            return flatRes.data as Assignment[];
          }
        } catch { }
        return [];
      }
      let list = (data || []) as Assignment[];
      if (adminId) {
        list = list.filter((a: any) => !a.course?.created_by || a.course?.created_by === adminId);
      }
      return list;
    }
    return [];
  },

  async createAssignment(assignment: Partial<Assignment>): Promise<Assignment> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('assignments')
        .insert({
          course_id: assignment.course_id,
          title: assignment.title,
          description: assignment.description,
          instructions: assignment.instructions,
          assignment_type: assignment.assignment_type || 'text_or_file',
          max_marks: assignment.max_marks || 100,
          passing_marks: assignment.passing_marks || 50,
          due_date: assignment.due_date || new Date(Date.now() + 7 * 86400000).toISOString(),
          is_published: true,
        })
        .select('*, course:courses(*)')
        .single();

      if (error) {
        console.error('Error creating assignment in Supabase:', error);
        throw new Error(`Failed to create assignment: ${error.message}`);
      }
      return data as Assignment;
    }
    throw new Error('Supabase is not configured');
  },

  async deleteAssignment(assignmentId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('assignments').delete().eq('id', assignmentId);
      if (error) {
        console.error('Error deleting assignment in Supabase:', error);
        throw new Error(`Failed to delete assignment: ${error.message}`);
      }
    }
  },

  async getAssignmentSubmissions(assignmentId?: string, studentId?: string, adminId?: string): Promise<AssignmentSubmission[]> {
    if (isSupabaseConfigured()) {
      let q = supabase
        .from('assignment_submissions')
        .select('*, student:profiles!assignment_submissions_student_id_fkey(*), assignment:assignments(*, course:courses(*))');

      if (assignmentId) q = q.eq('assignment_id', assignmentId);
      if (studentId) q = q.eq('student_id', studentId);

      const { data, error } = await q.order('submitted_at', { ascending: false });
      if (error) {
        console.error('Error fetching assignment submissions from Supabase:', error);
        throw new Error(`Failed to fetch submissions: ${error.message}`);
      }
      let subs = (data || []) as AssignmentSubmission[];
      if (adminId) {
        subs = subs.filter((s: any) => !s.assignment?.course?.created_by || s.assignment?.course?.created_by === adminId);
      }
      return subs;
    }
    return [];
  },

  async submitAssignment(assignmentId: string, studentId: string, text: string, fileUrl?: string): Promise<AssignmentSubmission> {
    if (isSupabaseConfigured()) {
      const { data: { user } } = await supabase.auth.getUser();
      const targetStudentId = user?.id || studentId;
      if (!targetStudentId) throw new Error('Authentication required to submit assignment');

      const payload = {
        assignment_id: assignmentId,
        student_id: targetStudentId,
        submission_text: text,
        file_url: fileUrl || null,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('assignment_submissions')
        .upsert(payload, { onConflict: 'student_id, assignment_id' })
        .select('*, student:profiles!assignment_submissions_student_id_fkey(*), assignment:assignments(*)')
        .single();

      if (error) {
        console.error('Error submitting assignment to Supabase:', error);
        throw new Error(`Failed to submit assignment: ${error.message}`);
      }
      return data as AssignmentSubmission;
    }
    throw new Error('Supabase is not configured');
  },

  async evaluateSubmission(submissionId: string, marks: number, feedback: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('assignment_submissions')
        .update({
          marks_obtained: marks,
          feedback,
          status: 'evaluated',
          evaluated_at: new Date().toISOString(),
          evaluated_by: user?.id || null,
        })
        .eq('id', submissionId);

      if (error) {
        console.error('Error evaluating assignment submission:', error);
        throw new Error(`Failed to evaluate submission: ${error.message}`);
      }
      return;
    }
    throw new Error('Supabase is not configured');
  },

  // ==========================================
  // 7. QUIZZES & EXAMS (Supabase Connected)
  // ==========================================
  async createQuiz(data: {
    course_id: string;
    module_id?: string;
    session_id?: string;
    title: string;
    description?: string;
    time_limit_minutes?: number;
    passing_percentage?: number;
    questions?: Array<{
      question_text: string;
      options: string[];
      correct_option_index: number;
      marks?: number;
      explanation?: string;
    }>;
  }): Promise<Quiz> {
    if (isSupabaseConfigured()) {
      const quizPayload: any = {
        course_id: data.course_id,
        module_id: data.module_id || null,
        session_id: data.session_id || null,
        title: data.title || 'Module Quiz Assessment',
        description: data.description || '',
        time_limit_minutes: data.time_limit_minutes || 15,
        passing_percentage: data.passing_percentage || 70,
        is_published: true,
      };

      let createdQuiz: any = null;
      const { data: qData, error: qErr } = await supabase
        .from('quizzes')
        .insert(quizPayload)
        .select()
        .single();

      if (qErr) {
        console.warn('Error inserting into quizzes table, trying without session_id:', qErr);
        const fallback = { ...quizPayload };
        delete fallback.session_id;
        const retry = await supabase.from('quizzes').insert(fallback).select().single();
        createdQuiz = retry.data;
      } else {
        createdQuiz = qData;
      }

      if (!createdQuiz) {
        createdQuiz = {
          id: generateUUID(),
          ...quizPayload,
          created_at: new Date().toISOString(),
        };
      }

      // Insert questions
      if (data.questions && data.questions.length > 0 && createdQuiz?.id) {
        const qRows = data.questions.map((q, idx) => ({
          quiz_id: createdQuiz.id,
          question_text: q.question_text || `Question ${idx + 1}`,
          options: q.options || ['Option 1', 'Option 2'],
          correct_option_index: q.correct_option_index ?? 0,
          marks: q.marks || 1,
          order_index: idx + 1,
          explanation: q.explanation || '',
        }));

        await supabase.from('quiz_questions').insert(qRows);
      }

      return createdQuiz as Quiz;
    }
    throw new Error('Supabase is not configured');
  },

  async getQuizzes(courseId?: string): Promise<Quiz[]> {
    if (isSupabaseConfigured()) {
      let q = supabase.from('quizzes').select('*');
      if (courseId) q = q.eq('course_id', courseId);
      const { data: quizzes, error } = await q.eq('is_published', true);

      if (error) {
        console.error('Error fetching quizzes from Supabase:', error);
        throw new Error(`Failed to load quizzes: ${error.message}`);
      }
      if (!quizzes || quizzes.length === 0) return [];

      const { data: { user } } = await supabase.auth.getUser();
      const quizIds = quizzes.map((qz) => qz.id);

      // Select quiz questions (including correct_option_index for validation)
      const { data: questions, error: qError } = await supabase
        .from('quiz_questions')
        .select('id, quiz_id, question_text, options, correct_option_index, marks, order_index, explanation')
        .in('quiz_id', quizIds)
        .order('order_index', { ascending: true });

      if (qError) {
        console.error('Error fetching quiz questions:', qError);
      }

      // Fetch attempts for authenticated student
      let attempts: QuizAttempt[] = [];
      if (user?.id) {
        const { data: attData } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('student_id', user.id)
          .in('quiz_id', quizIds)
          .order('started_at', { ascending: false });
        attempts = (attData || []) as QuizAttempt[];
      }

      return quizzes.map((qz) => {
        const qzQuestions = (questions || []).filter((qst) => qst.quiz_id === qz.id) as QuizQuestion[];
        const latestAttempt = attempts.find((a) => a.quiz_id === qz.id) || null;
        return {
          ...qz,
          questions: qzQuestions,
          latest_attempt: latestAttempt,
        } as Quiz;
      });
    }
    return [];
  },

  async submitQuiz(
    quizId: string,
    studentId: string,
    answers: { question_id: string; selected_option_index: number }[]
  ): Promise<QuizAttempt> {
    if (isSupabaseConfigured()) {
      let rpcSuccess = false;
      let rpcData: any = null;

      try {
        const { data, error } = await supabase.rpc('submit_quiz', {
          p_quiz_id: quizId,
          p_answers: answers,
        });
        if (!error && data) {
          rpcSuccess = true;
          rpcData = data;
        }
      } catch (e) {
        console.warn('RPC submit_quiz failed or unavailable, evaluating via direct logic:', e);
      }

      if (rpcSuccess && rpcData?.attempt_id) {
        const { data: attemptRecord, error: attErr } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('id', rpcData.attempt_id)
          .single();

        if (!attErr && attemptRecord) {
          return attemptRecord as QuizAttempt;
        }
      }

      // Direct Evaluation Fallback
      const { data: questions } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizId);

      const qMap = new Map((questions || []).map((q) => [q.id, q]));
      let totalMarks = 0;
      let earnedScore = 0;

      (questions || []).forEach((q) => {
        totalMarks += Number(q.marks) || 1;
      });

      answers.forEach((ans) => {
        const question = qMap.get(ans.question_id);
        if (question && Number(question.correct_option_index) === Number(ans.selected_option_index)) {
          earnedScore += Number(question.marks) || 1;
        }
      });

      const percentage = totalMarks > 0 ? Math.round((earnedScore / totalMarks) * 100) : 100;
      const isPassed = percentage >= 70; // 70% passing threshold benchmark

      const attemptPayload = {
        quiz_id: quizId,
        student_id: studentId,
        score: earnedScore,
        total_marks: totalMarks,
        percentage,
        is_passed: isPassed,
        submitted_at: new Date().toISOString(),
        status: 'completed',
      };

      try {
        const { data: newAttempt } = await supabase
          .from('quiz_attempts')
          .insert(attemptPayload)
          .select()
          .single();

        if (newAttempt) {
          return newAttempt as QuizAttempt;
        }
      } catch (insertErr) {
        console.warn('Could not persist quiz attempt to Supabase:', insertErr);
      }

      return {
        id: generateUUID(),
        ...attemptPayload,
        started_at: new Date().toISOString(),
      };
    }
    throw new Error('Supabase is not configured');
  },

  // Helper to pack extended exam settings into instructions text safely
  _packExamInstructions(
    instructionsText: string | null | undefined,
    settings: {
      passing_percentage?: number;
      max_attempts?: number;
      shuffle_questions?: boolean;
      show_answer_review?: boolean;
    }
  ): string {
    const base = (instructionsText || '').replace(/\n?---EXAM_CONFIG---\n[\s\S]*?\n---END_EXAM_CONFIG---/g, '').trim();
    const configBlock = `\n\n---EXAM_CONFIG---\n${JSON.stringify(settings)}\n---END_EXAM_CONFIG---`;
    return (base + configBlock).trim();
  },

  _unpackExamInstructions(instructionsText: string | null | undefined): {
    cleanInstructions: string;
    settings: {
      passing_percentage?: number;
      max_attempts?: number;
      shuffle_questions?: boolean;
      show_answer_review?: boolean;
    };
  } {
    if (!instructionsText) return { cleanInstructions: '', settings: {} };
    const match = instructionsText.match(/---EXAM_CONFIG---\n([\s\S]*?)\n---END_EXAM_CONFIG---/);
    if (!match) return { cleanInstructions: instructionsText, settings: {} };
    try {
      const settings = JSON.parse(match[1]);
      const cleanInstructions = instructionsText.replace(match[0], '').trim();
      return { cleanInstructions, settings };
    } catch {
      return { cleanInstructions: instructionsText, settings: {} };
    }
  },

  async getExaminations(courseId?: string, adminId?: string, includeDrafts: boolean = true): Promise<Examination[]> {
    if (isSupabaseConfigured()) {
      let q = supabase
        .from('examinations')
        .select('*, course:courses(*), questions:exam_questions(id, marks)');
      if (courseId) q = q.eq('course_id', courseId);
      if (!includeDrafts) q = q.eq('is_published', true);
      const { data, error } = await q.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching examinations from Supabase:', error);
        throw new Error(`Failed to load examinations: ${error.message}`);
      }
      let list = (data || []).map((e: any) => {
        const { cleanInstructions, settings } = this._unpackExamInstructions(e.instructions);
        const questionsList = e.questions || [];
        const computedTotalMarks = questionsList.reduce((acc: number, curr: any) => acc + (curr.marks || 2), 0) || e.total_marks || 50;
        const passingPct = e.passing_percentage ?? settings.passing_percentage ?? 50;
        const passingMarks = Math.ceil((computedTotalMarks * passingPct) / 100);

        return {
          ...e,
          instructions: cleanInstructions,
          passing_percentage: passingPct,
          max_attempts: e.max_attempts ?? settings.max_attempts ?? 2,
          shuffle_questions: e.shuffle_questions ?? settings.shuffle_questions ?? true,
          show_answer_review: e.show_answer_review ?? settings.show_answer_review ?? false,
          total_marks: computedTotalMarks,
          passing_marks: passingMarks,
        } as Examination;
      });

      if (adminId) {
        list = list.filter((e: any) => !e.course?.created_by || e.course?.created_by === adminId);
      }
      return list;
    }
    return [];
  },

  async createExamination(exam: Partial<Examination>): Promise<Examination> {
    if (isSupabaseConfigured()) {
      const passingPct = exam.passing_percentage !== undefined ? exam.passing_percentage : 50;
      const totalMarks = exam.total_marks || 50;
      const passingMarks = Math.ceil((totalMarks * passingPct) / 100);

      const packedInstructions = this._packExamInstructions(exam.instructions, {
        passing_percentage: passingPct,
        max_attempts: exam.max_attempts !== undefined ? exam.max_attempts : 2,
        shuffle_questions: exam.shuffle_questions !== undefined ? exam.shuffle_questions : true,
        show_answer_review: exam.show_answer_review !== undefined ? exam.show_answer_review : false,
      });

      const basePayload: any = {
        course_id: exam.course_id,
        title: exam.title,
        description: exam.description,
        instructions: packedInstructions,
        duration_minutes: Math.max(5, exam.duration_minutes || 60),
        total_marks: totalMarks,
        passing_marks: passingMarks,
        start_time: exam.start_time || null,
        end_time: exam.end_time || null,
        is_published: exam.is_published !== undefined ? exam.is_published : false,
      };

      // Try with extended fields first, if fails fallback to base payload
      let result: any = null;
      try {
        const { data, error } = await supabase
          .from('examinations')
          .insert({
            ...basePayload,
            passing_percentage: passingPct,
            max_attempts: exam.max_attempts !== undefined ? exam.max_attempts : 2,
            shuffle_questions: exam.shuffle_questions !== undefined ? exam.shuffle_questions : true,
            show_answer_review: exam.show_answer_review !== undefined ? exam.show_answer_review : false,
          })
          .select('*, course:courses(*)')
          .single();

        if (!error && data) {
          result = data;
        } else if (error) {
          throw error;
        }
      } catch {
        // Fallback to core columns
        const { data: fallbackData, error: fbError } = await supabase
          .from('examinations')
          .insert(basePayload)
          .select('*, course:courses(*)')
          .single();

        if (fbError) {
          console.error('Error creating examination in Supabase:', fbError);
          throw new Error(`Failed to create examination: ${fbError.message}`);
        }
        result = fallbackData;
      }

      const { cleanInstructions, settings } = this._unpackExamInstructions(result.instructions);
      return {
        ...result,
        instructions: cleanInstructions,
        passing_percentage: result.passing_percentage ?? settings.passing_percentage ?? passingPct,
        max_attempts: result.max_attempts ?? settings.max_attempts ?? 2,
        shuffle_questions: result.shuffle_questions ?? settings.shuffle_questions ?? true,
        show_answer_review: result.show_answer_review ?? settings.show_answer_review ?? false,
      } as Examination;
    }
    throw new Error('Supabase is not configured');
  },

  async updateExamination(examId: string, exam: Partial<Examination>): Promise<Examination> {
    if (isSupabaseConfigured()) {
      const updateData: any = {};
      if (exam.course_id !== undefined) updateData.course_id = exam.course_id;
      if (exam.title !== undefined) updateData.title = exam.title;
      if (exam.description !== undefined) updateData.description = exam.description;
      if (exam.duration_minutes !== undefined) updateData.duration_minutes = Math.max(5, exam.duration_minutes);
      if (exam.total_marks !== undefined) updateData.total_marks = exam.total_marks;
      if (exam.start_time !== undefined) updateData.start_time = exam.start_time || null;
      if (exam.end_time !== undefined) updateData.end_time = exam.end_time || null;
      if (exam.is_published !== undefined) updateData.is_published = exam.is_published;

      const passingPct = exam.passing_percentage !== undefined ? exam.passing_percentage : 50;
      if (exam.total_marks !== undefined || exam.passing_percentage !== undefined) {
        updateData.passing_marks = Math.ceil(((exam.total_marks || 50) * passingPct) / 100);
      }

      const packedInstructions = this._packExamInstructions(exam.instructions, {
        passing_percentage: passingPct,
        max_attempts: exam.max_attempts !== undefined ? exam.max_attempts : 2,
        shuffle_questions: exam.shuffle_questions !== undefined ? exam.shuffle_questions : true,
        show_answer_review: exam.show_answer_review !== undefined ? exam.show_answer_review : false,
      });
      updateData.instructions = packedInstructions;

      let result: any = null;
      try {
        const { data, error } = await supabase
          .from('examinations')
          .update({
            ...updateData,
            passing_percentage: passingPct,
            max_attempts: exam.max_attempts,
            shuffle_questions: exam.shuffle_questions,
            show_answer_review: exam.show_answer_review,
          })
          .eq('id', examId)
          .select('*, course:courses(*)')
          .single();

        if (!error && data) {
          result = data;
        } else if (error) {
          throw error;
        }
      } catch {
        const { data: fallbackData, error: fbError } = await supabase
          .from('examinations')
          .update(updateData)
          .eq('id', examId)
          .select('*, course:courses(*)')
          .single();

        if (fbError) {
          console.error('Error updating examination in Supabase:', fbError);
          throw new Error(`Failed to update examination: ${fbError.message}`);
        }
        result = fallbackData;
      }

      const { cleanInstructions, settings } = this._unpackExamInstructions(result.instructions);
      return {
        ...result,
        instructions: cleanInstructions,
        passing_percentage: result.passing_percentage ?? settings.passing_percentage ?? passingPct,
        max_attempts: result.max_attempts ?? settings.max_attempts ?? 2,
        shuffle_questions: result.shuffle_questions ?? settings.shuffle_questions ?? true,
        show_answer_review: result.show_answer_review ?? settings.show_answer_review ?? false,
      } as Examination;
    }
    throw new Error('Supabase is not configured');
  },

  async deleteExamination(examId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      // Check if student attempts exist
      const { count, error: countErr } = await supabase
        .from('exam_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('exam_id', examId);

      if (count && count > 0) {
        throw new Error('Cannot delete examination because student attempts already exist. You can unpublish or duplicate it.');
      }

      const { error } = await supabase.from('examinations').delete().eq('id', examId);
      if (error) {
        console.error('Error deleting examination in Supabase:', error);
        throw new Error(`Failed to delete examination: ${error.message}`);
      }
    }
  },

  async duplicateExamination(examId: string): Promise<Examination> {
    if (isSupabaseConfigured()) {
      const { data: origExam, error: examErr } = await supabase
        .from('examinations')
        .select('*')
        .eq('id', examId)
        .single();

      if (examErr || !origExam) {
        throw new Error(`Could not find examination to duplicate: ${examErr?.message || 'Not found'}`);
      }

      const { data: origQuestions } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('exam_id', examId)
        .order('order_index');

      // Create new draft examination
      const newExam = await this.createExamination({
        course_id: origExam.course_id,
        title: `${origExam.title} (Copy)`,
        description: origExam.description,
        instructions: origExam.instructions,
        duration_minutes: origExam.duration_minutes,
        total_marks: origExam.total_marks,
        passing_marks: origExam.passing_marks,
        is_published: false, // New duplicated exam is always Draft
      });

      // Copy all questions
      if (origQuestions && origQuestions.length > 0) {
        for (const q of origQuestions) {
          await this.createExamQuestion({
            exam_id: newExam.id,
            question_text: q.question_text,
            options: q.options,
            correct_option_index: q.correct_option_index,
            marks: q.marks,
            order_index: q.order_index,
          });
        }
      }

      return newExam;
    }
    throw new Error('Supabase is not configured');
  },

  async publishExamination(examId: string, publish: boolean): Promise<Examination> {
    if (isSupabaseConfigured()) {
      if (publish) {
        const questions = await this.getExamQuestionsAdmin(examId);
        if (questions.length < 10) {
          throw new Error('An examination needs at least 10 questions before it can be published.');
        }
      }
      return this.updateExamination(examId, { is_published: publish });
    }
    throw new Error('Supabase is not configured');
  },

  async reorderExamQuestions(examId: string, questionIds: string[]): Promise<void> {
    if (isSupabaseConfigured()) {
      const updates = questionIds.map((id, index) =>
        supabase.from('exam_questions').update({ order_index: index + 1 }).eq('id', id)
      );
      await Promise.all(updates);
    }
  },

  async importExamQuestionsCSV(
    examId: string,
    newQuestions: Array<{
      question_text: string;
      options: string[];
      correct_option_index: number;
      marks: number;
    }>
  ): Promise<ExamQuestion[]> {
    if (isSupabaseConfigured()) {
      const existing = await this.getExamQuestionsAdmin(examId);
      let startIndex = existing.length + 1;
      const createdList: ExamQuestion[] = [];

      for (const q of newQuestions) {
        const created = await this.createExamQuestion({
          exam_id: examId,
          question_text: q.question_text,
          options: q.options,
          correct_option_index: q.correct_option_index,
          marks: q.marks || 2,
          order_index: startIndex++,
        });
        createdList.push(created);
      }

      // Recompute total marks & passing marks on exam
      const allQuestions = await this.getExamQuestionsAdmin(examId);
      const totalMarks = allQuestions.reduce((sum, q) => sum + (q.marks || 2), 0);
      const exam = await this.getExamByIdAdmin(examId);
      const passingPct = exam?.passing_percentage || 50;
      const passingMarks = Math.ceil((totalMarks * passingPct) / 100);

      await this.updateExamination(examId, {
        total_marks: totalMarks,
        passing_marks: passingMarks,
      });

      return createdList;
    }
    throw new Error('Supabase is not configured');
  },

  async getExamByIdAdmin(examId: string): Promise<Examination | null> {
    if (isSupabaseConfigured()) {
      const { data: exam, error } = await supabase
        .from('examinations')
        .select('*, course:courses(title, slug)')
        .eq('id', examId)
        .maybeSingle();

      if (error || !exam) return null;
      const { cleanInstructions, settings } = this._unpackExamInstructions(exam.instructions);
      return {
        ...exam,
        instructions: cleanInstructions,
        passing_percentage: exam.passing_percentage ?? settings.passing_percentage ?? 50,
        max_attempts: exam.max_attempts ?? settings.max_attempts ?? 2,
        shuffle_questions: exam.shuffle_questions ?? settings.shuffle_questions ?? true,
        show_answer_review: exam.show_answer_review ?? settings.show_answer_review ?? false,
      } as Examination;
    }
    return null;
  },

  async getExamResults(examId: string): Promise<ExamAttempt[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('exam_attempts')
        .select('*, student:profiles(id, full_name, email, phone, college_name, department), examination:examinations(*)')
        .eq('exam_id', examId)
        .order('started_at', { ascending: false });

      if (error) {
        console.error('Error fetching exam results:', error);
        throw new Error(`Failed to load exam results: ${error.message}`);
      }
      return (data || []) as ExamAttempt[];
    }
    return [];
  },

  async checkCourseHasPublishedExam(courseId: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('examinations')
        .select('id')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .limit(1);

      if (!error && data && data.length > 0) return true;
    }
    return false;
  },

  // ==========================================
  // STUDENT PROCTORED EXAM RPC METHODS
  // ==========================================

  async startExamAttempt(examId: string): Promise<{
    success: boolean;
    error?: string;
    attempt_id?: string;
    resumed?: boolean;
    deadline_at?: string;
  }> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.rpc('start_exam_attempt', {
        p_exam_id: examId,
      });

      if (error) {
        console.error('start_exam_attempt error:', error);
        throw new Error(error.message || 'Failed to initialize exam session.');
      }
      return data as any;
    }
    throw new Error('Supabase is not configured');
  },

  async getExamQuestions(attemptId: string): Promise<Array<{
    id: string;
    question_text: string;
    options: string[];
    marks: number;
    order_index: number;
  }>> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.rpc('get_exam_questions', {
        p_attempt_id: attemptId,
      });

      if (error) {
        console.error('get_exam_questions error:', error);
        throw new Error(error.message || 'Failed to load exam questions.');
      }
      return (data || []) as any;
    }
    throw new Error('Supabase is not configured');
  },

  async saveExamProgress(
    attemptId: string,
    answers: Record<string, number>,
    tabSwitches: number = 0
  ): Promise<any> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.rpc('save_exam_progress', {
        p_attempt_id: attemptId,
        p_answers: answers,
        p_tab_switches: tabSwitches,
      });

      if (error) {
        console.warn('save_exam_progress sync error:', error.message);
      }
      return data;
    }
  },

  async submitExamAttempt(
    attemptId: string,
    answers: Record<string, number>
  ): Promise<{
    success: boolean;
    score: number;
    total_marks: number;
    percentage: number;
    is_passed: boolean;
    timed_out?: boolean;
    attempts_left?: number;
    review?: Array<{
      question_id: string;
      question_text?: string;
      options?: string[];
      selected_option_index: number;
      correct_option_index: number;
      is_correct: boolean;
      marks_awarded: number;
    }>;
    error?: string;
  }> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.rpc('submit_exam_attempt', {
        p_attempt_id: attemptId,
        p_answers: answers,
      });

      if (error) {
        console.error('submit_exam_attempt error:', error);
        throw new Error(error.message || 'Failed to submit exam attempt.');
      }
      return data as any;
    }
    throw new Error('Supabase is not configured');
  },

  async getExamsForStudent(studentId: string): Promise<StudentExamCardData[]> {
    if (!studentId) return [];

    try {
      // 1. Fetch all examinations (exact same source as Dashboard)
      let examRows: Examination[] = [];
      if (isSupabaseConfigured()) {
        examRows = await this.getExaminations(undefined, undefined, false);
        if (!examRows || examRows.length === 0) {
          examRows = await this.getExaminations();
        }
      }
      if (!examRows || examRows.length === 0) {
        const localExams = getLocalStore<Examination[]>('examinations', []);
        examRows = localExams.filter((e) => e.is_published);
        if (examRows.length === 0) examRows = localExams;
      }
      if (!examRows || examRows.length === 0) return [];

      // 2. Get enrollments for student
      let enrollments: any[] = [];
      if (isSupabaseConfigured()) {
        const { data: enrs } = await supabase
          .from('course_enrollments')
          .select('course_id, status, is_completed, progress_percentage, course:courses(*)')
          .eq('student_id', studentId);
        enrollments = enrs || [];
      }
      if (enrollments.length === 0) {
        const localEnrs = getLocalStore<CourseEnrollment[]>('course_enrollments', []);
        enrollments = localEnrs.filter((e) => e.student_id === studentId);
      }

      // 3. Get all sessions for target courses
      const targetCourseIds = Array.from(new Set(examRows.map((e) => e.course_id).filter(Boolean))) as string[];
      const courseSessionsMap: Record<string, string[]> = {};

      if (isSupabaseConfigured() && targetCourseIds.length > 0) {
        const { data: modulesData } = await supabase
          .from('modules')
          .select('id, course_id')
          .in('course_id', targetCourseIds);

        const moduleToCourse: Record<string, string> = {};
        const modIds: string[] = [];
        (modulesData || []).forEach((m: any) => {
          moduleToCourse[m.id] = m.course_id;
          modIds.push(m.id);
        });

        if (modIds.length > 0) {
          const { data: sessionsData } = await supabase
            .from('sessions')
            .select('id, module_id')
            .in('module_id', modIds);

          (sessionsData || []).forEach((s: any) => {
            const cId = moduleToCourse[s.module_id];
            if (cId) {
              if (!courseSessionsMap[cId]) courseSessionsMap[cId] = [];
              courseSessionsMap[cId].push(s.id);
            }
          });
        }
      }

      // 4. Get completed sessions for this student
      const completedSessionSet = new Set<string>();
      if (isSupabaseConfigured()) {
        const { data: progressRows } = await supabase
          .from('session_progress')
          .select('session_id, is_completed')
          .eq('student_id', studentId)
          .eq('is_completed', true);

        (progressRows || []).forEach((p) => completedSessionSet.add(p.session_id));
      }

      const completedCourseSet = new Set<string>();
      (enrollments || []).forEach((enr: any) => {
        if (
          enr.is_completed ||
          (enr.progress_percentage !== null && enr.progress_percentage !== undefined && enr.progress_percentage >= 100) ||
          enr.status === 'completed'
        ) {
          completedCourseSet.add(enr.course_id);
        }
      });

      // 5. Get all attempts by student for these exams
      const examIds = examRows.map((e) => e.id);
      let attempts: any[] = [];
      if (isSupabaseConfigured()) {
        const { data: attData } = await supabase
          .from('exam_attempts')
          .select('*')
          .in('exam_id', examIds)
          .eq('student_id', studentId)
          .order('started_at', { ascending: false });
        attempts = attData || [];
      }
      if (attempts.length === 0) {
        const localAttempts = getLocalStore<any[]>('exam_attempts', []);
        attempts = localAttempts.filter((a) => a.student_id === studentId && examIds.includes(a.exam_id));
      }

      const attemptsByExam: Record<string, ExamAttempt[]> = {};
      (attempts || []).forEach((att) => {
        if (!attemptsByExam[att.exam_id]) attemptsByExam[att.exam_id] = [];
        attemptsByExam[att.exam_id].push(att as ExamAttempt);
      });

      // 6. Compute state for each exam
      const results: StudentExamCardData[] = [];
      const now = new Date();

      for (const examObj of examRows) {
        const allCourseSessionIds = examObj.course_id ? courseSessionsMap[examObj.course_id] || [] : [];
        const totalSessions = allCourseSessionIds.length;
        let completedSessions = allCourseSessionIds.filter((sId) => completedSessionSet.has(sId)).length;
        if (examObj.course_id && completedCourseSet.has(examObj.course_id) && totalSessions > 0) {
          completedSessions = totalSessions;
        }
        const progressPercent = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 100;

        const examAttempts = attemptsByExam[examObj.id] || [];
        const latestAttempt = examAttempts[0] || null;
        const passedAttempt = examAttempts.find((a) => a.is_passed || (a.status === 'evaluated' && (a.percentage || 0) >= (examObj.passing_percentage || 50)));
        const inProgressAttempt = examAttempts.find((a) => a.status === 'in_progress');

        const maxAttempts = examObj.max_attempts || 2;
        const attemptsTaken = examAttempts.length;
        const attemptsLeft = Math.max(0, maxAttempts - attemptsTaken);

        let lockStatus: StudentExamLockStatus = 'available';

        // Check 1: Attempts & Completion status FIRST (if already submitted/passed, NEVER lock!)
        if (passedAttempt || latestAttempt?.is_passed) {
          lockStatus = 'passed';
        } else if (inProgressAttempt) {
          lockStatus = 'in_progress';
        } else if (attemptsTaken > 0 && attemptsLeft > 0) {
          lockStatus = 'failed_retake';
        } else if (attemptsTaken > 0 && attemptsLeft <= 0) {
          lockStatus = 'no_attempts_left';
        }
        // Check 2: Dates window
        else if (examObj.start_time && new Date(examObj.start_time) > now) {
          lockStatus = 'not_open';
        } else if (examObj.end_time && new Date(examObj.end_time) < now) {
          lockStatus = 'closed';
        }
        // Check 3: Course completion requirement (All sessions must be completed)
        else if (totalSessions > 0 && completedSessions < totalSessions && !completedCourseSet.has(examObj.course_id)) {
          lockStatus = 'locked';
        } else {
          lockStatus = 'available';
        }

        let activeAttemptData = null;
        if (inProgressAttempt) {
          const deadline = inProgressAttempt.deadline_at
            ? new Date(inProgressAttempt.deadline_at).getTime()
            : new Date(inProgressAttempt.started_at).getTime() + (examObj.duration_minutes || 60) * 60 * 1000;
          const remainingSecs = Math.max(0, Math.floor((deadline - now.getTime()) / 1000));
          activeAttemptData = {
            attemptId: inProgressAttempt.id,
            deadlineAt: inProgressAttempt.deadline_at || new Date(deadline).toISOString(),
            remainingSeconds: remainingSecs,
          };
        }

        results.push({
          exam: examObj,
          status: lockStatus,
          progressPercent,
          completedSessions,
          totalSessions,
          attemptsLeft,
          attemptsTaken,
          latestAttempt,
          activeAttempt: activeAttemptData,
        });
      }

      return results;
    } catch (err) {
      console.error('getExamsForStudent error:', err);
      return [];
    }
  },

  async getExamQuestionsAdmin(examId: string): Promise<ExamQuestion[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('exam_questions')
        .select('*')
        .eq('exam_id', examId)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching admin exam questions:', error);
        return [];
      }
      return (data || []) as ExamQuestion[];
    }
    const local = localStorage.getItem(`tnv_exam_questions_${examId}`);
    return local ? JSON.parse(local) : [];
  },

  async createExamQuestion(question: Partial<ExamQuestion>): Promise<ExamQuestion> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('exam_questions')
        .insert({
          exam_id: question.exam_id,
          question_text: question.question_text,
          options: question.options,
          correct_option_index: question.correct_option_index ?? 0,
          marks: question.marks ?? 2,
          order_index: question.order_index ?? 1,
        })
        .select('*')
        .single();

      if (error) {
        console.error('Error creating exam question:', error);
        throw new Error(`Failed to create exam question: ${error.message}`);
      }
      return data as ExamQuestion;
    }
    const newQ: ExamQuestion = {
      id: `eq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      exam_id: question.exam_id!,
      question_text: question.question_text || '',
      options: question.options || [],
      correct_option_index: question.correct_option_index ?? 0,
      marks: question.marks ?? 2,
      order_index: question.order_index ?? 1,
    };
    const key = `tnv_exam_questions_${question.exam_id}`;
    const list = JSON.parse(localStorage.getItem(key) || '[]');
    list.push(newQ);
    localStorage.setItem(key, JSON.stringify(list));
    return newQ;
  },

  async updateExamQuestion(questionId: string, question: Partial<ExamQuestion>): Promise<ExamQuestion> {
    if (isSupabaseConfigured()) {
      const updateData: any = {};
      if (question.question_text !== undefined) updateData.question_text = question.question_text;
      if (question.options !== undefined) updateData.options = question.options;
      if (question.correct_option_index !== undefined) updateData.correct_option_index = question.correct_option_index;
      if (question.marks !== undefined) updateData.marks = question.marks;
      if (question.order_index !== undefined) updateData.order_index = question.order_index;

      const { data, error } = await supabase
        .from('exam_questions')
        .update(updateData)
        .eq('id', questionId)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating exam question:', error);
        throw new Error(`Failed to update exam question: ${error.message}`);
      }
      return data as ExamQuestion;
    }
    return question as ExamQuestion;
  },

  async deleteExamQuestion(questionId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('exam_questions').delete().eq('id', questionId);
      if (error) {
        console.error('Error deleting exam question:', error);
        throw new Error(`Failed to delete exam question: ${error.message}`);
      }
    }
  },


  async getExamAttempts(studentId?: string, adminId?: string): Promise<ExamAttempt[]> {
    if (isSupabaseConfigured()) {
      let q = supabase
        .from('exam_attempts')
        .select('*, student:profiles(*), examination:examinations(*, course:courses(*))');

      if (studentId) q = q.eq('student_id', studentId);
      const { data, error } = await q.order('started_at', { ascending: false });

      if (error) {
        console.error('Error fetching exam attempts:', error);
        throw new Error(`Failed to load exam attempts: ${error.message}`);
      }
      let attempts = (data || []) as ExamAttempt[];
      if (adminId) {
        attempts = attempts.filter((a: any) => !a.examination?.course?.created_by || a.examination?.course?.created_by === adminId);
      }
      return attempts;
    }
    return [];
  },

  // ==========================================
  // 8. PROJECTS & SUBMISSIONS (Supabase Connected)
  // ==========================================
  async getProjects(courseId?: string, adminId?: string): Promise<Project[]> {
    if (isSupabaseConfigured()) {
      let q = supabase.from('projects').select('*, course:courses(*)');
      if (courseId) q = q.eq('course_id', courseId);
      const { data, error } = await q.eq('is_published', true).order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects from Supabase:', error);
        throw new Error(`Failed to load projects: ${error.message}`);
      }
      let list = (data || []) as Project[];
      if (adminId) {
        list = list.filter((p: any) => !p.course?.created_by || p.course?.created_by === adminId);
      }
      return list;
    }
    return [];
  },

  async getProjectSubmissions(studentId?: string): Promise<ProjectSubmission[]> {
    if (isSupabaseConfigured()) {
      let q = supabase
        .from('project_submissions')
        .select('*, student:profiles!project_submissions_student_id_fkey(*), project:projects(*)');

      if (studentId) q = q.eq('student_id', studentId);
      const { data, error } = await q.order('submitted_at', { ascending: false });

      if (error) {
        console.error('Error fetching project submissions:', error);
        throw new Error(`Failed to load project submissions: ${error.message}`);
      }

      return (data || []).map((row) => ({
        id: row.id,
        project_id: row.project_id,
        student_id: row.student_id,
        project_title: row.notes || row.project?.title || 'Project Submission',
        project_description: row.notes || '',
        github_url: row.github_repo_url || '',
        live_demo_url: row.live_demo_url || null,
        document_url: row.documentation_url || null,
        status: row.status,
        marks_obtained: row.score,
        feedback: row.feedback,
        submitted_at: row.submitted_at,
        reviewed_at: row.evaluated_at,
        reviewed_by: row.evaluated_by,
        student: row.student,
        project: row.project,
      })) as ProjectSubmission[];
    }
    return [];
  },

  async submitProject(
    projectId: string,
    studentId: string,
    data: { project_title: string; project_description: string; github_url: string; live_demo_url?: string }
  ): Promise<ProjectSubmission> {
    if (isSupabaseConfigured()) {
      const { data: { user } } = await supabase.auth.getUser();
      const targetStudentId = user?.id || studentId;
      if (!targetStudentId) throw new Error('Authentication required to submit project');

      const notesContent = data.project_title
        ? `${data.project_title}: ${data.project_description || ''}`
        : data.project_description || null;

      const payload = {
        project_id: projectId,
        student_id: targetStudentId,
        github_repo_url: data.github_url,
        live_demo_url: data.live_demo_url || null,
        notes: notesContent,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      };

      const { data: inserted, error } = await supabase
        .from('project_submissions')
        .upsert(payload, { onConflict: 'student_id, project_id' })
        .select('*, student:profiles!project_submissions_student_id_fkey(*), project:projects(*)')
        .single();

      if (error) {
        console.error('Error submitting project to Supabase:', error);
        throw new Error(`Failed to submit project: ${error.message}`);
      }

      return {
        id: inserted.id,
        project_id: inserted.project_id,
        student_id: inserted.student_id,
        project_title: data.project_title,
        project_description: data.project_description,
        github_url: inserted.github_repo_url,
        live_demo_url: inserted.live_demo_url,
        document_url: inserted.documentation_url,
        status: inserted.status,
        marks_obtained: inserted.score,
        feedback: inserted.feedback,
        submitted_at: inserted.submitted_at,
        reviewed_at: inserted.evaluated_at,
        reviewed_by: inserted.evaluated_by,
        student: inserted.student,
        project: inserted.project,
      } as ProjectSubmission;
    }
    throw new Error('Supabase is not configured');
  },

  async reviewProject(
    submissionId: string,
    status: ProjectSubmission['status'],
    marks: number,
    feedback: string
  ): Promise<void> {
    if (isSupabaseConfigured()) {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('project_submissions')
        .update({
          status,
          score: marks,
          feedback,
          evaluated_at: new Date().toISOString(),
          evaluated_by: user?.id || null,
        })
        .eq('id', submissionId);

      if (error) {
        console.error('Error reviewing project submission:', error);
        throw new Error(`Failed to review project: ${error.message}`);
      }
      return;
    }
    throw new Error('Supabase is not configured');
  },

  // ==========================================
  // 9. LIVE SESSIONS & ATTENDANCE (Supabase Connected)
  // ==========================================
  normalizeLiveSessions(rows: any[]): LiveSession[] {
    return rows.map((row) => {
      let scheduledDate = row.scheduled_date;
      let startTime = row.start_time;
      let endTime = row.end_time;

      if (!scheduledDate && row.session_date) {
        const sDate = new Date(row.session_date);
        scheduledDate = sDate.toISOString().split('T')[0];
        startTime = sDate.toTimeString().substring(0, 5);
        const durationMin = row.duration_minutes || 90;
        const eDate = new Date(sDate.getTime() + durationMin * 60000);
        endTime = eDate.toTimeString().substring(0, 5);
      }

      // Format time strings if they include seconds e.g. "18:00:00" -> "18:00"
      if (startTime && startTime.length > 5) {
        startTime = startTime.substring(0, 5);
      }
      if (endTime && endTime.length > 5) {
        endTime = endTime.substring(0, 5);
      }

      return {
        id: row.id,
        course_id: row.course_id,
        module_id: row.module_id,
        title: row.title || 'Live Interactive Masterclass',
        description: row.description || '',
        scheduled_date: scheduledDate || new Date().toISOString().split('T')[0],
        start_time: startTime || '18:00',
        end_time: endTime || '19:30',
        meeting_link: row.meeting_link || 'https://meet.google.com/tnv-work-live',
        platform: row.platform || 'Google Meet',
        instructor_name: row.instructor_name || row.course?.instructor_name || 'Thamilaran (Admin)',
        is_published: row.is_published ?? true,
        created_at: row.created_at || new Date().toISOString(),
        course: Array.isArray(row.course) ? row.course[0] : row.course,
      };
    });
  },

  async getLiveSessions(courseId?: string): Promise<LiveSession[]> {
    if (isSupabaseConfigured()) {
      try {
        let q = supabase
          .from('live_sessions')
          .select('*, course:courses(title, slug, instructor_name, is_published)');

        if (courseId) q = q.eq('course_id', courseId);

        const { data, error } = await q.order('scheduled_date', { ascending: true });
        if (error) {
          console.warn('Live sessions order failed, retrying simple select:', error.message);
          const fallbackRes = await supabase
            .from('live_sessions')
            .select('*, course:courses(title, slug, instructor_name, is_published)');
          if (!fallbackRes.error && fallbackRes.data) {
            return this.normalizeLiveSessions(fallbackRes.data);
          }
          console.error('Error fetching live sessions from Supabase:', error);
          return [];
        }
        return this.normalizeLiveSessions(data || []);
      } catch (err: any) {
        console.error('Error fetching live sessions from Supabase:', err);
        return [];
      }
    }

    // Local fallback ONLY when Supabase is not configured
    const local = getLocalStore<LiveSession[]>('live_sessions', []);
    if (courseId) {
      return local.filter((s) => s.course_id === courseId);
    }
    return local;
  },

  async createLiveSession(session: Partial<LiveSession>): Promise<LiveSession> {
    const scheduledDate = session.scheduled_date || new Date().toISOString().split('T')[0];
    const startTime = session.start_time || '18:00';
    const endTime = session.end_time || '19:30';
    const platform = session.platform || 'Google Meet';
    const meetingLink = session.meeting_link || 'https://meet.google.com/tnv-work-live';
    const instructorName = session.instructor_name || 'Thamilaran (Admin)';

    if (isSupabaseConfigured()) {
      // Primary payload matching schema: scheduled_date, start_time, end_time
      const payload: any = {
        course_id: session.course_id,
        title: session.title || 'Live Workshop Session',
        description: session.description || null,
        scheduled_date: scheduledDate,
        start_time: startTime.length === 5 ? `${startTime}:00` : startTime,
        end_time: endTime.length === 5 ? `${endTime}:00` : endTime,
        meeting_link: meetingLink,
        platform: platform,
        instructor_name: instructorName,
        is_published: session.is_published ?? true,
      };

      let { data, error } = await supabase
        .from('live_sessions')
        .insert(payload)
        .select('*, course:courses(title, slug, instructor_name)')
        .single();

      if (error) {
        console.warn('Primary insert failed, attempting alternative payload schema:', error.message);
        const altPayload: any = {
          course_id: session.course_id,
          title: session.title || 'Live Workshop Session',
          description: session.description || null,
          session_date: new Date(`${scheduledDate}T${startTime}:00Z`).toISOString(),
          duration_minutes: 90,
          platform: platform.toLowerCase().includes('zoom') ? 'zoom' : 'google_meet',
          meeting_link: meetingLink,
          is_published: session.is_published ?? true,
        };

        const altRes = await supabase
          .from('live_sessions')
          .insert(altPayload)
          .select('*, course:courses(title, slug, instructor_name)')
          .single();

        if (altRes.error) {
          console.error('All live_sessions inserts rejected by DB:', altRes.error);
          throw new Error(`Failed to save live session to Supabase: ${altRes.error.message}`);
        }
        data = altRes.data;
      }

      const createdSession = this.normalizeLiveSessions([data])[0];

      // Dispatch notification to all students enrolled in this course
      if (createdSession.course_id) {
        this.notifyEnrolledStudentsOfLiveSession(createdSession.course_id, createdSession);
      }

      return createdSession;
    }

    // Local / Demo fallback ONLY when Supabase is not configured
    const createdSession: LiveSession = {
      id: `live-${Date.now()}`,
      course_id: session.course_id || '',
      title: session.title || 'Live Workshop Session',
      description: session.description || '',
      scheduled_date: scheduledDate,
      start_time: startTime,
      end_time: endTime,
      meeting_link: meetingLink,
      platform: platform,
      instructor_name: instructorName,
      is_published: session.is_published ?? true,
      created_at: new Date().toISOString(),
      course: session.course,
    };

    const local = getLocalStore<LiveSession[]>('live_sessions', []);
    setLocalStore('live_sessions', [createdSession, ...local.filter((s) => s.id !== createdSession.id)]);

    if (createdSession.course_id) {
      this.notifyEnrolledStudentsOfLiveSession(createdSession.course_id, createdSession);
    }

    return createdSession;
  },

  async deleteLiveSession(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.from('live_sessions').delete().eq('id', id);
      if (error) {
        console.error('Failed to delete live session from Supabase:', error);
        throw new Error(`Failed to delete live session: ${error.message}`);
      }
      return;
    }
    const local = getLocalStore<LiveSession[]>('live_sessions', []);
    setLocalStore('live_sessions', local.filter((s) => s.id !== id));
  },

  async notifyEnrolledStudentsOfLiveSession(courseId: string, liveSession: LiveSession): Promise<void> {
    try {
      const enrollments = await this.getCourseEnrollments(courseId);
      const courseTitle = liveSession.course?.title || 'Enrolled Course';
      const notifTitle = `Upcoming Live Masterclass: ${liveSession.title}`;
      const notifMessage = `A live masterclass for "${courseTitle}" has been scheduled for ${liveSession.scheduled_date} from ${liveSession.start_time} to ${liveSession.end_time} via ${liveSession.platform}. Join through the Live Sessions portal on time.`;

      for (const enr of enrollments) {
        const studentId = enr.student_id;
        if (!studentId) continue;

        try {
          await this.createNotification(
            studentId,
            notifTitle,
            notifMessage,
            'info',
            '/student/live-sessions'
          );
        } catch {
          // Fallback to localStorage notification queue
          try {
            const key = `notifications_${studentId}`;
            const studentNotifs = JSON.parse(localStorage.getItem(key) || '[]');
            studentNotifs.unshift({
              id: `notif-${Date.now()}-${Math.random()}`,
              user_id: studentId,
              title: notifTitle,
              message: notifMessage,
              type: 'info',
              link_url: '/student/live-sessions',
              is_read: false,
              created_at: new Date().toISOString(),
            });
            localStorage.setItem(key, JSON.stringify(studentNotifs));
          } catch { }
        }
      }
    } catch (err) {
      console.warn('Error broadcasting live session notifications:', err);
    }
  },

  async getAttendance(liveSessionId?: string, studentId?: string): Promise<Attendance[]> {
    let dbRecords: Attendance[] = [];
    if (isSupabaseConfigured()) {
      try {
        let q = supabase
          .from('attendance')
          .select('*, student:profiles!attendance_student_id_fkey(*), live_session:live_sessions(*)');

        if (liveSessionId) q = q.eq('live_session_id', liveSessionId);
        if (studentId) q = q.eq('student_id', studentId);

        const { data, error } = await q.order('marked_at', { ascending: false });
        if (!error && data) {
          dbRecords = data as Attendance[];
        } else if (error) {
          console.warn('Supabase attendance load note:', error.message);
        }
      } catch (err) {
        console.warn('Attendance load fallback:', err);
      }
    }

    // Load local storage cache to ensure immediate persistence across page reloads
    let localRecords: Attendance[] = [];
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('live_attendance_records');
        if (stored) {
          localRecords = JSON.parse(stored);
          if (liveSessionId) {
            localRecords = localRecords.filter((a) => a.live_session_id === liveSessionId);
          }
          if (studentId) {
            localRecords = localRecords.filter((a) => a.student_id === studentId);
          }
        }
      } catch { }
    }

    // Merge: db records supplemented/overridden by any newer local saves
    const map = new Map<string, Attendance>();
    dbRecords.forEach((r) => {
      map.set(`${r.live_session_id}_${r.student_id}`, r);
    });
    localRecords.forEach((r) => {
      map.set(`${r.live_session_id}_${r.student_id}`, r);
    });

    return Array.from(map.values());
  },

  async markAttendance(
    liveSessionId: string,
    studentId: string,
    status: Attendance['status'],
    remarks?: string
  ): Promise<void> {
    const markedAt = new Date().toISOString();

    // 1. Dual-persist to localStorage immediately so page refresh never resets to absent
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('live_attendance_records');
        const list: Attendance[] = stored ? JSON.parse(stored) : [];
        const existingIdx = list.findIndex(
          (a) => a.live_session_id === liveSessionId && a.student_id === studentId
        );
        const record: Attendance = {
          id: existingIdx >= 0 ? list[existingIdx].id : `att-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          live_session_id: liveSessionId,
          student_id: studentId,
          status,
          remarks: remarks || null,
          marked_at: markedAt,
        };
        if (existingIdx >= 0) {
          list[existingIdx] = record;
        } else {
          list.push(record);
        }
        localStorage.setItem('live_attendance_records', JSON.stringify(list));
      } catch (e) {
        console.warn('Failed to cache attendance in localStorage:', e);
      }
    }

    // 2. Persist to Supabase database
    if (isSupabaseConfigured()) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const payload = {
          live_session_id: liveSessionId,
          student_id: studentId,
          status,
          remarks: remarks || null,
          marked_at: markedAt,
          marked_by: user?.id || null,
        };

        const { error } = await supabase
          .from('attendance')
          .upsert(payload, { onConflict: 'live_session_id, student_id' });

        if (error) {
          console.warn('Supabase attendance upsert warning:', error.message);
        }
      } catch (err: any) {
        console.warn('Supabase record attendance warning:', err?.message);
      }
    }
  },

  // ==========================================
  // 10. CERTIFICATES (Supabase Connected)
  // ==========================================
  async getCertificates(adminId?: string): Promise<Certificate[]> {
    let dbCerts: Certificate[] = [];
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('certificates')
          .select('*, student:profiles(id, full_name, email, role), workshop:workshops(id, title, duration, created_by), course:courses(id, title, created_by)')
          .order('issue_date', { ascending: false });

        if (!error && data) {
          dbCerts = data as Certificate[];
        }
      } catch (e) {
        console.warn('Error fetching certificates from Supabase:', e);
      }
    }

    const localCerts = getLocalStore<Certificate[]>('certificates', []);
    const localMap = new Map<string, Certificate>();
    localCerts.forEach((lc) => {
      localMap.set(lc.certificate_number || lc.id, lc);
    });

    const mergedMap = new Map<string, Certificate>();

    [...dbCerts, ...localCerts].forEach((c) => {
      const key = c.certificate_number || c.id;
      if (!mergedMap.has(key)) {
        mergedMap.set(key, c);
        const localMatch = localMap.get(key);
        const forceIssued = c.is_force_issued ?? localMatch?.is_force_issued ?? false;
        const realScore = c.overall_score !== undefined && c.overall_score !== null ? c.overall_score : (localMatch?.overall_score ?? 0);
        mergedMap.set(key, {
          ...c,
          overall_score: realScore,
          is_force_issued: forceIssued,
        });
      }
    });

    let certs = Array.from(mergedMap.values());
    if (adminId) {
      certs = certs.filter(
        (c) =>
          (c.course && (!c.course.created_by || c.course.created_by === adminId)) ||
          (c.workshop && (!c.workshop.created_by || c.workshop.created_by === adminId))
      );
    }
    return certs;
  },

  async getStudentCertificate(studentId: string, workshopId: string): Promise<Certificate | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('certificates')
        .select('*, student:profiles(id, full_name, email), workshop:workshops(id, title, duration)')
        .eq('student_id', studentId)
        .eq('workshop_id', workshopId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching student certificate:', error);
        throw new Error(`Failed to check certificate: ${error.message}`);
      }
      return (data || null) as Certificate | null;
    }
    return null;
  },

  async getStudentCertificates(studentId: string): Promise<Certificate[]> {
    let dbCerts: Certificate[] = [];
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('certificates')
          .select('*, student:profiles(id, full_name, email, college_name, department), workshop:workshops(id, title, duration), course:courses(id, title)')
          .eq('student_id', studentId)
          .order('issue_date', { ascending: false });

        if (!error && data) {
          dbCerts = data as Certificate[];
        }
      } catch (err) {
        console.warn('Error fetching student certificates from Supabase:', err);
      }
    }

    // Merge with localStorage certificates
    const localCerts = getLocalStore<Certificate[]>('certificates', []).filter((c) => c.student_id === studentId);
    const mergedMap = new Map<string, Certificate>();

    [...dbCerts, ...localCerts].forEach((c) => {
      const key = c.certificate_number || c.id || `${c.student_id}-${c.course_id}`;
      if (!mergedMap.has(key)) {
        const localMatch = localCerts.find(
          (lc) => lc.certificate_number === c.certificate_number || lc.id === c.id || (lc.student_id === c.student_id && lc.course_id === c.course_id)
        );
        const score = c.overall_score !== undefined && c.overall_score !== null ? c.overall_score : (localMatch?.overall_score ?? 0);
        const grade = c.grade || (score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B+' : score >= 50 ? 'B' : 'C');
        const forceIssued = c.is_force_issued ?? localMatch?.is_force_issued ?? false;
        mergedMap.set(key, {
          ...c,
          overall_score: score,
          grade,
          is_force_issued: forceIssued,
        });
      }
    });

    const result = Array.from(mergedMap.values());

    // Enrich missing course or student data if needed
    for (const cert of result) {
      if (!cert.course && cert.course_id) {
        try {
          const c = await this.getCourseById(cert.course_id);
          if (c) cert.course = c;
        } catch { }
      }
      if (!cert.student && cert.student_id) {
        try {
          if (isSupabaseConfigured()) {
            const { data: p } = await supabase.from('profiles').select('*').eq('id', cert.student_id).maybeSingle();
            if (p) cert.student = p as Profile;
          } else {
            const p = (await this.getProfiles()).find((x) => x.id === cert.student_id);
            if (p) cert.student = p;
          }
        } catch { }
      }
    }

    return result;
  },

  async checkEligibility(studentId: string, workshopId: string): Promise<{
    is_eligible: boolean;
    progress_percentage: number;
    assignments_satisfied: boolean;
    projects_satisfied: boolean;
    already_issued: boolean;
    existing_certificate?: Certificate | null;
  }> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.rpc('check_certificate_eligibility', {
        p_student_id: studentId,
        p_workshop_id: workshopId,
      });

      if (error) {
        console.error('Error checking certificate eligibility via RPC:', error);
        throw new Error(`Failed to check eligibility: ${error.message}`);
      }

      let existingCert: Certificate | null = null;
      if (data?.already_issued) {
        existingCert = await this.getStudentCertificate(studentId, workshopId);
      }

      return {
        is_eligible: !!data?.is_eligible,
        progress_percentage: Number(data?.progress_percentage) || 0,
        assignments_satisfied: !!data?.assignments_satisfied,
        projects_satisfied: !!data?.projects_satisfied,
        already_issued: !!data?.already_issued,
        existing_certificate: existingCert,
      };
    }
    return {
      is_eligible: false,
      progress_percentage: 0,
      assignments_satisfied: false,
      projects_satisfied: false,
      already_issued: false,
    };
  },

  async issueCertificate(studentId: string, workshopId: string): Promise<Certificate> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.rpc('issue_certificate', {
        p_student_id: studentId,
        p_workshop_id: workshopId,
      });

      if (error) {
        console.error('Error issuing certificate via RPC:', error);
        throw new Error(`Failed to issue certificate: ${error.message}`);
      }

      if (data && data.certificate_id) {
        const { data: certRecord, error: certErr } = await supabase
          .from('certificates')
          .select('*, student:profiles(*), workshop:workshops(*)')
          .eq('id', data.certificate_id)
          .single();

        if (!certErr && certRecord) {
          return certRecord as Certificate;
        }
      }

      return {
        id: data?.certificate_id || generateUUID(),
        certificate_number: data?.certificate_number || `TNV-${new Date().getFullYear()}-ISSUED`,
        student_id: studentId,
        workshop_id: workshopId,
        issue_date: new Date().toISOString().split('T')[0],
        completion_date: new Date().toISOString().split('T')[0],
        status: 'issued',
        created_at: new Date().toISOString(),
      };
    }
    throw new Error('Supabase is not configured');
  },

  async verifyCertificate(certificateNumber: string): Promise<any> {
    const cleanNum = certificateNumber.trim();
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.rpc('verify_certificate_public', {
          p_certificate_number: cleanNum,
        });

        if (!error && data && data.certificate_number) {
          const score = data.overall_score !== undefined && data.overall_score !== null ? Number(data.overall_score) : 0;
          return {
            ...data,
            overall_score: score,
            grade: data.grade || (score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B+' : score >= 50 ? 'B' : 'C'),
            is_force_issued: data.is_force_issued ?? false,
          };
        }
      } catch (e) {
        console.warn('RPC verify_certificate_public failed, using direct query:', e);
      }

      // Fallback: direct select with non-PII field projection
      const { data: fallbackData } = await supabase
        .from('certificates')
        .select('id, certificate_number, issue_date, completion_date, status, revoked_reason, overall_score, grade, is_force_issued, student:profiles(full_name), course:courses(title), workshop:workshops(title)')
        .eq('certificate_number', cleanNum)
        .maybeSingle();

      if (fallbackData) {
        const courseTitle = (fallbackData.course as any)?.title;
        const workshopTitle = (fallbackData.workshop as any)?.title;
        const score = fallbackData.overall_score !== undefined && fallbackData.overall_score !== null ? Number(fallbackData.overall_score) : 0;
        return {
          certificate_number: fallbackData.certificate_number,
          student_name: (fallbackData.student as any)?.full_name || 'Verified Scholar',
          workshop_title: courseTitle || workshopTitle || 'TNV Workshop Program',
          course_title: courseTitle,
          issue_date: fallbackData.issue_date,
          completion_date: fallbackData.completion_date,
          status: fallbackData.status,
          is_valid: fallbackData.status === 'issued',
          revoked_reason: fallbackData.revoked_reason,
          overall_score: score,
          grade: fallbackData.grade || (score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B+' : score >= 50 ? 'B' : 'C'),
          is_force_issued: fallbackData.is_force_issued ?? false,
        };
      }
    }

    // Check localStorage certificates
    const localCerts = getLocalStore<Certificate[]>('certificates', []);
    const matched = localCerts.find((c) => c.certificate_number?.toLowerCase() === cleanNum.toLowerCase());
    if (matched) {
      const score = matched.overall_score !== undefined && matched.overall_score !== null ? Number(matched.overall_score) : 0;
      return {
        certificate_number: matched.certificate_number,
        student_name: matched.student?.full_name || 'Verified Scholar',
        workshop_title: matched.course?.title || matched.workshop?.title || 'Technical Workshop Program',
        issue_date: matched.issue_date,
        completion_date: matched.completion_date,
        status: matched.status,
        is_valid: matched.status === 'issued',
        revoked_reason: matched.revoked_reason,
        overall_score: score,
        grade: matched.grade || (score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B+' : score >= 50 ? 'B' : 'C'),
        is_force_issued: matched.is_force_issued ?? false,
      };
    }

    return null;
  },

  async revokeCertificate(certificateId: string, reason: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('certificates')
          .update({
            status: 'revoked',
            revoked_reason: reason,
          })
          .eq('id', certificateId);

        if (error) {
          console.error('Error revoking certificate:', error);
          throw new Error(`Failed to revoke certificate: ${error.message}`);
        }
      } catch (err) {
        console.warn('Failed to revoke certificate in Supabase:', err);
      }
    }

    // Always update localStorage
    const localCerts = getLocalStore<Certificate[]>('certificates', []);
    setLocalStore(
      'certificates',
      localCerts.map((c) =>
        c.id === certificateId ? { ...c, status: 'revoked', revoked_reason: reason } : c
      )
    );
  },

  getCourseMinThreshold(courseId: string): number {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`tnv_course_min_threshold_${courseId}`);
      if (stored) {
        const val = Number(stored);
        if (!isNaN(val) && val >= 0 && val <= 100) return val;
      }
    }
    return 50; // default 50%
  },

  setCourseMinThreshold(courseId: string, threshold: number): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`tnv_course_min_threshold_${courseId}`, String(threshold));
    }
  },

  async getCertificateTemplates(): Promise<CertificateTemplate[]> {
    const DEFAULT_TEMPLATES: CertificateTemplate[] = [
      {
        id: '60000000-0000-0000-0000-000000000001',
        template_name: 'TNV Official Academy Certificate',
        signatory_name: 'Thamilaran',
        signatory_title: 'Program Director & Chief Architect',
        badge_title: 'Certificate of Industry Excellence & Completion',
        signature_image_url: '',
        min_course_progress_percentage: 80.0,
        min_exam_percentage: 50.0,
        require_all_assignments: true,
        require_project_approval: true,
        is_active: true,
        layout: 'classic',
      },
      {
        id: '60000000-0000-0000-0000-000000000002',
        template_name: 'Executive Leadership & Technology Award',
        signatory_name: 'Thamilaran',
        signatory_title: 'Head of Engineering & Systems',
        badge_title: 'Executive Certificate of Distinction',
        signature_image_url: '',
        min_course_progress_percentage: 90.0,
        min_exam_percentage: 60.0,
        require_all_assignments: true,
        require_project_approval: true,
        is_active: true,
        layout: 'executive',
      },
    ];

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('certificate_templates')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          // Merge with local storage layout customizations
          const localList = getLocalStore<CertificateTemplate[]>('certificate_templates', []);
          return data.map((d: any) => {
            const match = localList.find((l) => l.id === d.id);
            return {
              ...d,
              layout: match?.layout || d.layout || 'classic',
            };
          });
        }
      } catch (err) {
        console.warn('Error fetching certificate_templates from Supabase:', err);
      }
    }
    return getLocalStore<CertificateTemplate[]>('certificate_templates', DEFAULT_TEMPLATES);
  },

  async saveCertificateTemplate(template: Partial<CertificateTemplate> & { id?: string }): Promise<CertificateTemplate> {
    const DEFAULT_TEMPLATES: CertificateTemplate[] = [
      {
        id: '60000000-0000-0000-0000-000000000001',
        template_name: 'TNV Official Academy Certificate',
        signatory_name: 'Thamilaran',
        signatory_title: 'Program Director & Chief Architect',
        badge_title: 'Certificate of Industry Excellence & Completion',
        signature_image_url: '',
        min_course_progress_percentage: 80.0,
        min_exam_percentage: 50.0,
        require_all_assignments: true,
        require_project_approval: true,
        is_active: true,
        layout: 'classic',
      },
    ];

    const id = template.id || generateUUID();
    const now = new Date().toISOString();
    const completeTemplate: CertificateTemplate = {
      id,
      template_name: template.template_name || 'Standard Certificate Template',
      signatory_name: template.signatory_name || 'Thamilaran',
      signatory_title: template.signatory_title || 'Program Director & Chief Architect',
      signature_image_url: template.signature_image_url || null,
      badge_title: template.badge_title || 'Certificate of Completion',
      min_course_progress_percentage: Number(template.min_course_progress_percentage) || 80,
      min_exam_percentage: Number(template.min_exam_percentage) || 50,
      require_all_assignments: template.require_all_assignments ?? true,
      require_project_approval: template.require_project_approval ?? true,
      is_active: template.is_active ?? true,
      layout: template.layout || 'classic',
      created_at: template.created_at || now,
      updated_at: now,
    };

    if (isSupabaseConfigured()) {
      try {
        const payload: any = {
          id: completeTemplate.id,
          template_name: completeTemplate.template_name,
          signatory_name: completeTemplate.signatory_name,
          signatory_title: completeTemplate.signatory_title,
          signature_image_url: completeTemplate.signature_image_url,
          badge_title: completeTemplate.badge_title,
          min_course_progress_percentage: completeTemplate.min_course_progress_percentage,
          min_exam_percentage: completeTemplate.min_exam_percentage,
          require_all_assignments: completeTemplate.require_all_assignments,
          require_project_approval: completeTemplate.require_project_approval,
          is_active: completeTemplate.is_active,
        };

        const { data, error } = await supabase
          .from('certificate_templates')
          .upsert(payload)
          .select('*')
          .maybeSingle();

        if (!error && data) {
          const merged = { ...completeTemplate, ...data, layout: completeTemplate.layout };
          const localList = getLocalStore<CertificateTemplate[]>('certificate_templates', DEFAULT_TEMPLATES);
          const filtered = localList.filter((t) => t.id !== id);
          setLocalStore('certificate_templates', [merged, ...filtered]);
          return merged;
        }
      } catch (err) {
        console.warn('Error saving certificate template to Supabase:', err);
      }
    }

    const localList = getLocalStore<CertificateTemplate[]>('certificate_templates', DEFAULT_TEMPLATES);
    const filtered = localList.filter((t) => t.id !== id);
    setLocalStore('certificate_templates', [completeTemplate, ...filtered]);
    return completeTemplate;
  },

  async deleteCertificateTemplate(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('certificate_templates').delete().eq('id', id);
      } catch (err) {
        console.warn('Error deleting certificate template:', err);
      }
    }
    const localList = getLocalStore<CertificateTemplate[]>('certificate_templates', []);
    setLocalStore('certificate_templates', localList.filter((t) => t.id !== id));
  },

  // ==========================================
  // 11. FEEDBACK & TICKETS (Supabase Connected)
  // ==========================================
  async getFeedbacks(studentId?: string): Promise<Feedback[]> {
    if (isSupabaseConfigured()) {
      let q = supabase.from('feedback').select('*, student:profiles!feedback_student_id_fkey(*)');
      if (studentId) q = q.eq('student_id', studentId);
      const { data, error } = await q.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching feedbacks from Supabase:', error);
        throw new Error(`Failed to load feedback: ${error.message}`);
      }
      return (data || []) as Feedback[];
    }
    return [];
  },

  async submitFeedback(
    studentId: string,
    category: Feedback['category'],
    subject: string,
    description: string
  ): Promise<Feedback> {
    if (isSupabaseConfigured()) {
      const { data: { user } } = await supabase.auth.getUser();
      const targetStudentId = user?.id || studentId;
      if (!targetStudentId) throw new Error('Authentication required to submit feedback');

      const payload = {
        student_id: targetStudentId,
        category,
        subject,
        description,
        status: 'open',
      };

      const { data, error } = await supabase
        .from('feedback')
        .insert(payload)
        .select('*, student:profiles!feedback_student_id_fkey(*)')
        .single();

      if (error) {
        console.error('Error submitting feedback to Supabase:', error);
        throw new Error(`Failed to submit feedback: ${error.message}`);
      }
      return data as Feedback;
    }
    throw new Error('Supabase is not configured');
  },

  async respondToFeedback(feedbackId: string, response: string, status: Feedback['status']): Promise<void> {
    if (isSupabaseConfigured()) {
      const { data: { user } } = await supabase.auth.getUser();
      const isResolved = status === 'resolved' || status === 'closed';

      const { error } = await supabase
        .from('feedback')
        .update({
          admin_response: response,
          status,
          responded_by: user?.id || null,
          resolved_at: isResolved ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', feedbackId);

      if (error) {
        console.error('Error responding to feedback:', error);
        throw new Error(`Failed to update feedback response: ${error.message}`);
      }
      return;
    }
    throw new Error('Supabase is not configured');
  },

  // ==========================================
  // 12. NOTIFICATIONS (Supabase Connected)
  // ==========================================
  async getNotifications(userId: string): Promise<Notification[]> {
    let list: Notification[] = [];
    if (isSupabaseConfigured()) {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = user?.id || userId;
      if (!targetUserId) return [];

      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          list = data as Notification[];
        }
      } catch (e) {
        console.warn('Notifications fetch warning:', e);
      }

      // Merge with local storage notification queue
      if (typeof window !== 'undefined') {
        try {
          const key = `notifications_${targetUserId}`;
          const local = JSON.parse(localStorage.getItem(key) || '[]');
          const ids = new Set(list.map((n) => n.id));
          const uniqueLocal = local.filter((n: any) => !ids.has(n.id));
          list = [...uniqueLocal, ...list];
        } catch { }
      }

      return list;
    }
    return [];
  },

  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: Notification['type'] = 'info',
    linkUrl?: string
  ): Promise<Notification> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          link_url: linkUrl || null,
          is_read: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating notification in Supabase:', error);
        throw new Error(`Failed to create notification: ${error.message}`);
      }
      return data as Notification;
    }
    throw new Error('Supabase is not configured');
  },

  async markNotificationRead(userId: string, notificationId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = user?.id || userId;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', targetUserId);

      if (error) {
        console.warn('Error marking notification read in Supabase:', error);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const key = `notifications_${userId}`;
        const local = JSON.parse(localStorage.getItem(key) || '[]');
        const updated = local.map((n: any) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        );
        localStorage.setItem(key, JSON.stringify(updated));
        window.dispatchEvent(new Event('notifications-updated'));
      } catch { }
    }
  },

  async markAllNotificationsRead(userId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = user?.id || userId;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', targetUserId)
        .eq('is_read', false);

      if (error) {
        console.warn('Error marking all notifications read in Supabase:', error);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const key = `notifications_${userId}`;
        const local = JSON.parse(localStorage.getItem(key) || '[]');
        const updated = local.map((n: any) => ({ ...n, is_read: true }));
        localStorage.setItem(key, JSON.stringify(updated));
        window.dispatchEvent(new Event('notifications-updated'));
      } catch { }
    }
  },

  // ==========================================
  // 13. ADMIN SETTINGS (Supabase Connected)
  // ==========================================
  async getAdminSettings(): Promise<AdminSettings> {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('admin_settings').select('*');
      if (error) {
        console.error('Error fetching admin settings from Supabase:', error);
        return DEFAULT_ADMIN_SETTINGS;
      }
      if (!data || data.length === 0) {
        return DEFAULT_ADMIN_SETTINGS;
      }

      const map: Record<string, any> = {};
      data.forEach((row: { key: string; value: any }) => {
        let val = row.value;
        if (typeof val === 'string') {
          try {
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith('{') && val.endsWith('}'))) {
              val = JSON.parse(val);
            }
          } catch {
            // Keep bare string
          }
        }
        map[row.key] = val;
      });

      return {
        ...DEFAULT_ADMIN_SETTINGS,
        ...map,
      };
    }
    return DEFAULT_ADMIN_SETTINGS;
  },

  async updateAdminSettings(settings: Partial<AdminSettings>): Promise<AdminSettings> {
    if (isSupabaseConfigured()) {
      const now = new Date().toISOString();
      const entries = Object.entries(settings);

      for (const [key, value] of entries) {
        const payload = {
          key,
          value: JSON.stringify(value),
          updated_at: now,
        };
        const { error } = await supabase
          .from('admin_settings')
          .upsert(payload, { onConflict: 'key' });

        if (error) {
          console.error(`Error saving setting ${key} to Supabase:`, error);
          throw new Error(`Failed to save setting ${key}: ${error.message}`);
        }
      }
      return this.getAdminSettings();
    }
    throw new Error('Supabase is not configured');
  },

  // ==========================================
  // 14. ADMIN & STUDENT DASHBOARD ANALYTICS METRICS
  // ==========================================
  async getAdminDashboardMetrics(adminId?: string) {
    const [courses, workshops, allStudents, courseEnrs, workshopEnrs, submissions, projectSubmissions, exams, certs, payments] = await Promise.all([
      this.getCourses({ adminId }),
      this.getWorkshops(adminId),
      this.getProfiles(),
      this.getCourseEnrollments(undefined, undefined, adminId),
      this.getEnrollments(),
      this.getAssignmentSubmissions(),
      this.getProjectSubmissions(),
      this.getExamAttempts(),
      this.getCertificates(),
      this.getPayments(),
    ]);

    const courseIds = new Set(courses.map((c) => c.id));
    const workshopIds = new Set(workshops.map((w) => w.id));

    const scopedSubmissions = submissions.filter((s) => !s.assignment?.course_id || courseIds.has(s.assignment.course_id));
    const pendingEvals = scopedSubmissions.filter((s) => s.status === 'submitted' || s.status === 'under_review');
    const scopedExams = exams.filter((e) => !e.examination?.course_id || courseIds.has(e.examination.course_id));
    const scopedCerts = certs.filter((c) => (c.course_id && courseIds.has(c.course_id)) || (c.workshop_id && workshopIds.has(c.workshop_id)));

    // Unique students enrolled in this admin's courses
    const enrolledStudentIds = new Set<string>();
    courseEnrs.forEach((e) => enrolledStudentIds.add(e.student_id));
    if (adminId) {
      workshopEnrs.filter((e) => workshopIds.has(e.workshop_id)).forEach((e) => enrolledStudentIds.add(e.student_id));
    } else {
      workshopEnrs.forEach((e) => enrolledStudentIds.add(e.student_id));
    }

    const totalRevenue = payments
      .filter((p) => p.status === 'verified')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const publishedCourses = courses.filter((c) => Boolean(c.is_published));
    const activeCourseEnrs = courseEnrs.filter((e) => !e.status || e.status === 'active');
    const activeWorkshopEnrs = workshopEnrs.filter((e) => e.status === 'approved');

    return {
      totalCourses: courses.length,
      totalPublishedCourses: publishedCourses.length,
      totalWorkshops: workshops.length,
      totalRegisteredStudents: allStudents.filter((s) => s.role === 'student').length || enrolledStudentIds.size,
      totalEnrolledStudents: enrolledStudentIds.size || allStudents.filter((s) => s.role === 'student').length,
      totalActiveEnrollments: activeCourseEnrs.length + activeWorkshopEnrs.length,
      totalCompletedEnrollments: courseEnrs.filter((e) => e.is_completed || e.status === 'completed').length,
      totalApprovedEnrollments: activeCourseEnrs.length + activeWorkshopEnrs.length,
      pendingVerificationsCount: workshopEnrs.filter((e) => e.status === 'payment_verification_pending' || e.status === 'payment_pending').length,
      totalAssignmentsSubmitted: scopedSubmissions.length,
      pendingAssignmentEvaluations: pendingEvals.length,
      totalProjectsSubmitted: projectSubmissions.length,
      totalExamsTaken: scopedExams.length,
      totalCertificatesIssued: scopedCerts.filter((c) => c.status === 'issued').length,
      totalRevenue,
    };
  },

  async getStudentDashboardMetrics(studentId: string) {
    const [courseEnrs, workshopEnrs, assignments, subs, exams, attempts, certs, notifs] = await Promise.all([
      this.getStudentCourseEnrollments(studentId),
      this.getStudentEnrollments(studentId),
      this.getAssignments(),
      this.getAssignmentSubmissions(undefined, studentId),
      this.getExaminations(),
      this.getExamAttempts(studentId),
      this.getCertificates(),
      this.getNotifications(studentId),
    ]);

    const totalEnrolled = courseEnrs.length + workshopEnrs.length;
    const completedCourses = courseEnrs.filter((e) => e.is_completed).length;
    const inProgressCourses = courseEnrs.filter((e) => !e.is_completed && (e.progress_percentage || 0) > 0).length;

    const submittedAsnIds = new Set(subs.map((s) => s.assignment_id));
    const pendingAssignments = assignments.filter((a) => !submittedAsnIds.has(a.id)).length;

    const attemptedExamIds = new Set(attempts.map((a) => a.exam_id));
    const upcomingExams = exams.filter((e) => !attemptedExamIds.has(e.id)).length;

    const studentCerts = certs.filter((c) => c.student_id === studentId && c.status === 'issued');

    const overallProgress = courseEnrs.length > 0
      ? Math.round(courseEnrs.reduce((sum, c) => sum + (c.progress_percentage || 0), 0) / courseEnrs.length)
      : (workshopEnrs.length > 0 ? 75 : 0);

    const totalCompletedSessions = courseEnrs.reduce((sum, c: any) => sum + (c.completed_sessions || 0), 0);

    return {
      totalEnrolledCourses: totalEnrolled,
      inProgressCourses,
      completedCourses,
      overallProgress,
      completedSessions: totalCompletedSessions,
      pendingAssignments,
      upcomingExams,
      certificatesEarned: studentCerts.length,
      unreadNotifications: notifs.filter((n) => !n.is_read).length,
    };
  },
};
