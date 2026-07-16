import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { DisclaimerBanner } from './components/DisclaimerBanner'
import { Navbar } from './components/Navbar'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { PatientDashboard } from './pages/patient/PatientDashboard'
import { RecordingSession } from './pages/patient/RecordingSession'
import { ReportView } from './pages/patient/ReportView'
import { DoctorDashboard } from './pages/doctor/DoctorDashboard'
import { PatientDetail } from './pages/doctor/PatientDetail'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <DisclaimerBanner />
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              <Route
                path="/patient"
                element={
                  <ProtectedRoute requiredRole="patient">
                    <PatientDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/scan"
                element={
                  <ProtectedRoute requiredRole="patient">
                    <RecordingSession />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patient/report/:id"
                element={
                  <ProtectedRoute requiredRole="patient">
                    <ReportView />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/doctor"
                element={
                  <ProtectedRoute requiredRole="doctor">
                    <DoctorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/doctor/patients/:patientId"
                element={
                  <ProtectedRoute requiredRole="doctor">
                    <PatientDetail />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}
