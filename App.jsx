import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useLocation, Navigate } from 'react-router-dom';
import Login from './pages/login';
import PatientSelector from './pages/PatientSelector';
import Dashboard from './pages/dashboard';
import Upload from './pages/upload';
import Reports from './pages/Report';
import MedVault from './pages/medvault';
import History from './pages/history';

const LayoutWrapper = ({ children, auth }) => {
  const { patientId } = useParams();
  const location = useLocation();

  // Redirect to login if not authenticated
  if (!auth) return <Navigate to="/login" replace />;
  if (!patientId) return <>{children}</>;

  const navItems = [
    { path: `/patient/${patientId}`, label: '📊 Dashboard' },
    { path: `/patient/${patientId}/upload`, label: '📷 New Scan/Add' },
    { path: `/patient/${patientId}/reports`, label: '📈 Health Reports' },
    { path: `/patient/${patientId}/vault`, label: '💊 Med Vault' },
    { path: `/patient/${patientId}/history`, label: '📜 Medical History' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <nav className="w-64 bg-indigo-950 text-white p-6 flex flex-col fixed h-full shadow-2xl">
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-black italic text-white tracking-tighter">Medi<span className="text-indigo-400">Minds</span></h1>
        </div>
        <div className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${location.pathname === item.path ? 'bg-indigo-700 shadow-lg' : 'hover:bg-indigo-900'}`}>
              <span className="font-bold text-sm">{item.label}</span>
            </Link>
          ))}
        </div>
        <button 
          onClick={() => { localStorage.clear(); window.location.href = "/login"; }} 
          className="mt-auto p-3 text-xs text-indigo-300 hover:text-white border border-indigo-800 rounded-xl transition-colors"
        >
          Logout Session
        </button>
      </nav>
      <main className="flex-1 ml-64 p-8">{children}</main>
    </div>
  );
};

const App = () => {
  // Logic Fix: Check localStorage on mount. Default to FALSE if not found.
  const [auth, setAuth] = useState(() => {
    return localStorage.getItem("isLoggedIn") === "true";
  });

  return (
    <Router>
      <Routes>
        {/* If already logged in, redirect away from login page to home */}
        <Route path="/login" element={auth ? <Navigate to="/" replace /> : <Login setAuth={setAuth} />} />
        
        {/* Protected Routes */}
        <Route path="/" element={auth ? <PatientSelector /> : <Navigate to="/login" replace />} />
        <Route path="/patient/:patientId/*" element={<LayoutWrapper auth={auth}><PatientRoutes /></LayoutWrapper>} />
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to={auth ? "/" : "/login"} replace />} />
      </Routes>
    </Router>
  );
};

// Sub-router for patient-specific views to keep App.jsx clean
const PatientRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="upload" element={<Upload />} />
      <Route path="reports" element={<Reports />} />
      <Route path="vault" element={<MedVault />} />
      <Route path="history" element={<History />} />
    </Routes>
  );
};

export default App;