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
import { WorkshopsPage } from './pages/WorkshopsPage';
import { WorkshopDetailPage } from './pages/WorkshopDetailPage';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { VerifyCertificatePage } from './pages/VerifyCertificatePage';

// Student Pages
import { StudentDashboard } from './pages/student/Dashboard';
import { MyCourses } from './pages/student/MyCourses';
import { CourseView } from './pages/student/CourseView';
import { ModuleView } from './pages/student/ModuleView';
import { Assignments } from './pages/student/Assignments';
import { AssignmentDetail } from './pages/student/AssignmentDetail';
import { Projects } from './pages/student/Projects';
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
import { AdminModules } from './pages/admin/Modules';
import { AdminAssignments } from './pages/admin/Assignments';
import { AdminSubmissions } from './pages/admin/Submissions';
import { AdminProjects } from './pages/admin/Projects';
import { AdminExaminations } from './pages/admin/Examinations';
import { AdminLiveSessions } from './pages/admin/LiveSessions';
import { AdminAttendance } from './pages/admin/Attendance';
import { AdminCertificates } from './pages/admin/Certificates';
import { AdminFeedback } from './pages/admin/Feedback';
import { AdminReports } from './pages/admin/Reports';
import { AdminSettingsPage } from './pages/admin/Settings';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <ConfigBanner />
          <Routes>
            {/* PUBLIC WEBSITE EXPERIENCE */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<LandingPage />} />
              <Route path="workshops" element={<WorkshopsPage />} />
              <Route path="workshops/:id" element={<WorkshopDetailPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
              <Route path="reset-password" element={<ResetPasswordPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="verify-certificate/:id" element={<VerifyCertificatePage />} />
            </Route>

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
              <Route path="my-courses" element={<MyCourses />} />
              <Route path="courses/:id" element={<CourseView />} />
              <Route path="courses/:id/modules/:moduleId" element={<ModuleView />} />
              <Route path="assignments" element={<Assignments />} />
              <Route path="assignments/:id" element={<AssignmentDetail />} />
              <Route path="projects" element={<Projects />} />
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
              <Route path="courses/create" element={<AdminCourses />} />
              <Route path="courses/:id" element={<AdminCourses />} />
              <Route path="modules" element={<AdminModules />} />
              <Route path="assignments" element={<AdminAssignments />} />
              <Route path="submissions" element={<AdminSubmissions />} />
              <Route path="projects" element={<AdminProjects />} />
              <Route path="examinations" element={<AdminExaminations />} />
              <Route path="live-sessions" element={<AdminLiveSessions />} />
              <Route path="attendance" element={<AdminAttendance />} />
              <Route path="certificates" element={<AdminCertificates />} />
              <Route path="feedback" element={<AdminFeedback />} />
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
