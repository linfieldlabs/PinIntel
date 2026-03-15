import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import SetupPage from './pages/SetupPage';
import AnalysisPage from './pages/AnalysisPage';
import DashboardPage from './pages/DashboardPage';
import ExportPage from './pages/ExportPage';
import GeneralImprovementsPage from './pages/GeneralImprovementsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/analysis/:id" element={<AnalysisPage />} />
        <Route path="/dashboard/:id" element={<DashboardPage />} />
        <Route path="/improvements/:id" element={<GeneralImprovementsPage />} />
        <Route path="/export/:id" element={<ExportPage />} />
      </Routes>
    </Router>
  );
}

export default App;
