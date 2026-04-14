import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Auth pages
import Login    from './pages/Login';
import Register from './pages/Register';

// Student pages
import Dashboard   from './pages/Dashboard';
import AllCourses  from './pages/AllCourses';
import MyCourses   from './pages/MyCourses';
import Schedule    from './pages/Schedule';
import Quiz        from './pages/Quiz';
import PracticeHub from './pages/PracticeHub';
import CourseDetail  from './pages/CourseDetail';

// Admin pages — new premium UI
import AdminDashboard  from './pages/AdminDashboard';
import AdminCourses    from './pages/AdminCourses';
import AdminAddCourse  from './pages/AdminAddCourse';
import AdminStudents   from './pages/AdminStudents';
import AdminAnalytics  from './pages/AdminAnalytics';
import AdminSettings   from './pages/AdminSettings';

// Legacy admin pages (kept for backward compat)
import AdminContent from './pages/AdminContent';

// Shared layouts
import Layout       from './components/Layout';
import AdminLayout  from './components/AdminLayout';

// ─────────────────────────────────────────────────────────────────────────────
function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem('token');
  const user  = JSON.parse(localStorage.getItem('user') || 'null');

  if (!token || !user) return <Navigate to="/login" replace />;

  if (requiredRole && user.role !== requiredRole) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Public ─────────────────────────────────────────────────────── */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ── Student routes ──────────────────────────────────────────────── */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        }/>

        <Route path="/all-courses" element={
          <ProtectedRoute>
            <Layout><AllCourses /></Layout>
          </ProtectedRoute>
        }/>

        <Route path="/my-courses" element={
          <ProtectedRoute>
            <Layout><MyCourses /></Layout>
          </ProtectedRoute>
        }/>

        <Route path="/schedule" element={
          <ProtectedRoute>
            <Layout><Schedule /></Layout>
          </ProtectedRoute>
        }/>

        <Route path="/course/:courseId" element={
          <ProtectedRoute>
            <Layout><CourseDetail /></Layout>
          </ProtectedRoute>
        }/>

        <Route path="/quiz" element={
          <ProtectedRoute>
            <Layout><PracticeHub /></Layout>
          </ProtectedRoute>
        }/>

        <Route path="/quiz/:courseId/:lessonId" element={
          <ProtectedRoute>
            <Layout><Quiz /></Layout>
          </ProtectedRoute>
        }/>

        {/* ── Admin routes (new premium UI) ─────────────────────────────── */}
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout><AdminDashboard /></AdminLayout>
          </ProtectedRoute>
        }/>

        <Route path="/admin/courses" element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout><AdminCourses /></AdminLayout>
          </ProtectedRoute>
        }/>

        <Route path="/admin/add-course" element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout><AdminAddCourse /></AdminLayout>
          </ProtectedRoute>
        }/>

        <Route path="/admin/users" element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout><AdminStudents /></AdminLayout>
          </ProtectedRoute>
        }/>



        <Route path="/admin/analytics" element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout><AdminAnalytics /></AdminLayout>
          </ProtectedRoute>
        }/>

        <Route path="/admin/settings" element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout><AdminSettings /></AdminLayout>
          </ProtectedRoute>
        }/>

        {/* Legacy admin content route */}
        <Route path="/admin/content" element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout><AdminContent /></AdminLayout>
          </ProtectedRoute>
        }/>

        {/* ── Defaults ──────────────────────────────────────────────────── */}
        <Route path="/"  element={<Navigate to="/dashboard" replace />} />
        <Route path="*"  element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
