import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Auth pages
import Login    from './pages/Login';
import Register from './pages/Register';

// Student pages
import Dashboard   from './pages/Dashboard';
import AllCourses  from './pages/AllCourses';    // ← TASK 4: browse all courses
import MyCourses   from './pages/MyCourses';     // ← TASK 5: student's selected courses
import Schedule    from './pages/Schedule';
import Quiz        from './pages/Quiz';
import CourseDetail  from './pages/CourseDetail';

// Admin pages
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers     from './pages/AdminUsers';
import AdminContent   from './pages/AdminContent';
import Courses        from './pages/Courses';

// Shared
import Layout from './components/Layout';

// ─────────────────────────────────────────────────────────────────────────────
// ProtectedRoute — redirects to login if not authenticated
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

        {/* PAGE 1: All courses — student browses and adds */}
        <Route path="/all-courses" element={
          <ProtectedRoute>
            <Layout><AllCourses /></Layout>
          </ProtectedRoute>
        }/>

        {/* PAGE 2: My courses — student's personal selected list */}
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
        <Route path="/quiz/:courseId/:lessonId" element={
          <ProtectedRoute>
            <Layout><Quiz /></Layout>
          </ProtectedRoute>
        }/>

        {/* ── Admin routes ────────────────────────────────────────────────── */}
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="admin">
            <Layout><AdminDashboard /></Layout>
          </ProtectedRoute>
        }/>
        <Route path="/admin/users" element={
          <ProtectedRoute requiredRole="admin">
            <Layout><AdminUsers /></Layout>
          </ProtectedRoute>
        }/>
        <Route path="/admin/courses" element={
          <ProtectedRoute requiredRole="admin">
            <Layout><Courses /></Layout>
          </ProtectedRoute>
        }/>
        <Route path="/admin/content" element={
          <ProtectedRoute requiredRole="admin">
            <Layout><AdminContent /></Layout>
          </ProtectedRoute>
        }/>

        {/* ── Defaults ──────────────────────────────────────────────────── */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
