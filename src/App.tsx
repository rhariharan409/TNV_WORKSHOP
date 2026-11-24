import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { ConfigBanner } from './components/common/ConfigBanner';

// Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { StudentLayout } from './layouts/StudentLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { AuthCallback } from './pages/auth/AuthCallback';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { VerifyCertificatePage } from './pages/VerifyCertificatePage';

// Student Pages
import { StudentDashboard } from './pages/student/Dashboard';
import { AvailableCourses } from './pages/student/AvailableCourses';
import { MyCourses } from './pages/student/MyCourses';
import { CourseView } from './pages/student/CourseView';
import { ModuleView } from './pages/student/ModuleView';
import { Assignments } from './pages/student/Assignments';
import { AssignmentDetail } from './pages/student/AssignmentDetail';
import { Examinations } from './pages/student/Examinations';
import { ExamTake } from './pages/student/ExamTake';
import { LiveSessions } from './pages/student/LiveSessions';
import { Certificates } from './pages/student/Certificates';
import { Doubts } from './pages/student/Doubts';
import { FeedbackPage } from './pages/student/Feedback';
import { ProfilePage } from './pages/student/Profile';
import { NotificationsPage } from './pages/student/Notifications';

// Admin Pages
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminStudents } from './pages/admin/Students';
import { AdminCourses } from './pages/admin/Courses';
import { AdminCourseCreate } from './pages/admin/CourseCreate';
import { AdminAssignments } from './pages/admin/Assignments';
import { AdminSubmissions } from './pages/admin/Submissions';
import { AdminExaminations } from './pages/admin/Examinations';
import { AdminLiveSessions } from './pages/admin/LiveSessions';
import { AdminAttendance } from './pages/admin/Attendance';
import { AdminCertificates } from './pages/admin/Certificates';
import { AdminCertificateTemplates } from './pages/admin/CertificateTemplates';
import { AdminFeedback } from './pages/admin/Feedback';
import { AdminReports } from './pages/admin/Reports';
import { AdminSettingsPage } from './pages/admin/Settings';
import { AdminNotifications } from './pages/admin/Notifications';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* STARTING TNV WORKSHOP WEBSITE AUTH & SIGN IN (Matching Image 2) */}
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/complete-registration" element={<Navigate to="/student/dashboard" replace />} />
            <Route path="/verify-certificate/:id" element={<VerifyCertificatePage />} />
            <Route path="/about" element={<Navigate to="/" replace />} />
            <Route path="/contact" element={<Navigate to="/" replace />} />
            <Route path="/courses" element={<Navigate to="/" replace />} />
            <Route path="/workshops" element={<Navigate to="/" replace />} />
            <Route path="/workshops/:id" element={<Navigate to="/" replace />} />

            {/* DEDICATED 100% FULL-SCREEN STANDALONE LEARNING PORTAL VIEW (No Sidebars / Full Theater View) */}
            <Route
              path="/student/courses/:id"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin', 'super_admin']}>
                  <CourseView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/courses/:id/modules/:moduleId"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin', 'super_admin']}>
                  <ModuleView />
                </ProtectedRoute>
              }
            />

            {/* STUDENT PORTAL (Protected, Role: student / admin) */}
            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRoles={['student', 'admin', 'super_admin']}>
                  <StudentLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/student/dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="available-courses" element={<AvailableCourses />} />
              <Route path="my-courses" element={<MyCourses />} />
              <Route path="assignments" element={<Assignments />} />
              <Route path="assignments/:id" element={<AssignmentDetail />} />
              <Route path="examinations" element={<Examinations />} />
              <Route path="examinations/:id" element={<ExamTake />} />
              <Route path="live-sessions" element={<LiveSessions />} />
              <Route path="certificates" element={<Certificates />} />
              <Route path="doubts" element={<Doubts />} />
              <Route path="feedback" element={<FeedbackPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="notifications" element={<NotificationsPage />} />
            </Route>

            {/* ADMIN PORTAL (Protected, Role: admin / super_admin) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="students" element={<AdminStudents />} />
              <Route path="courses" element={<AdminCourses />} />
              <Route path="courses/create" element={<AdminCourseCreate />} />
              <Route path="courses/edit/:courseId" element={<AdminCourseCreate />} />
              <Route path="courses/:id" element={<AdminCourses />} />
              <Route path="assignments" element={<AdminAssignments />} />
              <Route path="submissions" element={<AdminSubmissions />} />
              <Route path="examinations" element={<AdminExaminations />} />
              <Route path="live-sessions" element={<AdminLiveSessions />} />
              <Route path="attendance" element={<AdminAttendance />} />
              <Route path="certificates" element={<AdminCertificates />} />
              <Route path="certificate-templates" element={<AdminCertificateTemplates />} />
              <Route path="feedback" element={<AdminFeedback />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>

            {/* Fallback to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
