import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages Placeholder (We will create these)
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ManageUsers from './pages/ManageUsers';
import ReceptionDashboard from './pages/ReceptionDashboard';
import OPRegistration from './pages/OPRegistration';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorAnalysis from './pages/DoctorAnalysis';
import PharmacyInventory from './pages/PharmacyInventory';
import PharmacyBilling from './pages/PharmacyBilling';
import LabDashboard from './pages/LabDashboard';
import PatientSearch from './pages/PatientSearch';
import Unauthorized from './pages/Unauthorized';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Dashboard Layout wrapper for protected routes */}
        <Route path="/" element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            
            {/* Redirect root based on role could be handled in a separate component, but for now we just show a welcome or redirect */}
            <Route index element={<Navigate to="/patient-search" />} />
            
            <Route path="patient-search" element={<PatientSearch />} />

            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
              <Route path="admin/dashboard" element={<AdminDashboard />} />
              <Route path="admin/users" element={<ManageUsers />} />
            </Route>

            {/* Reception Routes */}
            <Route element={<ProtectedRoute allowedRoles={['Reception', 'Admin']} />}>
              <Route path="reception/dashboard" element={<ReceptionDashboard />} />
              <Route path="reception/register" element={<OPRegistration />} />
            </Route>

            {/* Doctor Routes */}
            <Route element={<ProtectedRoute allowedRoles={['Doctor']} />}>
              <Route path="doctor/dashboard" element={<DoctorDashboard />} />
              <Route path="doctor/analysis" element={<DoctorAnalysis />} />
            </Route>

            {/* Pharmacy Routes */}
            <Route element={<ProtectedRoute allowedRoles={['Pharmacy', 'Admin']} />}>
              <Route path="pharmacy/inventory" element={<PharmacyInventory />} />
              <Route path="pharmacy/billing" element={<PharmacyBilling />} />
            </Route>

            {/* Laboratory Routes */}
            <Route element={<ProtectedRoute allowedRoles={['Laboratory', 'Admin']} />}>
              <Route path="lab/dashboard" element={<LabDashboard />} />
            </Route>

          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
