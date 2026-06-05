import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'

import Login    from './pages/Login'
import Register from './pages/Register'

import StudentDashboard  from './pages/student/Dashboard'
import TutorDashboard    from './pages/tutor/Dashboard'
import WardenDashboard   from './pages/warden/Dashboard'
import SecurityDashboard from './pages/security/Dashboard'
import AdminDashboard    from './pages/admin/Dashboard'
import ParentDashboard   from './pages/parent/Dashboard'

// Redirects to the right dashboard based on role
const RoleRedirect = () => {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />
  const routes = {
    student:  '/student',
    tutor:    '/tutor',
    warden:   '/warden',
    security: '/security',
    admin:    '/admin',
    parent:   '/parent',
  }
  return <Navigate to={routes[user.role] || '/login'} />
}

// Protects routes — redirects to login if not authenticated
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth()
  if (loading) return <div style={{padding:'2rem'}}>Loading...</div>
  if (!user)   return <Navigate to="/login" />
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/"         element={<RoleRedirect />} />

        <Route path="/student"  element={<ProtectedRoute allowedRoles={['student']}> <StudentDashboard />  </ProtectedRoute>} />
        <Route path="/tutor"    element={<ProtectedRoute allowedRoles={['tutor']}>   <TutorDashboard />    </ProtectedRoute>} />
        <Route path="/warden"   element={<ProtectedRoute allowedRoles={['warden']}>  <WardenDashboard />   </ProtectedRoute>} />
        <Route path="/security" element={<ProtectedRoute allowedRoles={['security']}><SecurityDashboard /> </ProtectedRoute>} />
        <Route path="/admin"    element={<ProtectedRoute allowedRoles={['admin']}>   <AdminDashboard />    </ProtectedRoute>} />
        <Route path="/parent"   element={<ProtectedRoute allowedRoles={['parent']}>  <ParentDashboard />   </ProtectedRoute>} />
      </Routes>
    </AuthProvider>
  )
}