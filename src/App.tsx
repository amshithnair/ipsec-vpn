import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { CaptureHistoryPage } from './pages/CaptureHistoryPage';
import { NewCapturePage } from './pages/NewCapturePage';
import { AnalysisProgressPage } from './pages/AnalysisProgressPage';
import { AnalysisOverviewPage } from './pages/AnalysisOverviewPage';
import { SecurityAssessmentPage } from './pages/SecurityAssessmentPage';
import { TechnicalDetailsPage } from './pages/TechnicalDetailsPage';
import { TechnicalReportPage } from './pages/TechnicalReportPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          {/* Dashboard */}
          <Route path="/" element={<DashboardPage />} />

          {/* Capture history */}
          <Route path="/captures" element={<CaptureHistoryPage />} />

          {/* Upload */}
          <Route path="/captures/new" element={<NewCapturePage />} />

          {/* Analysis progress */}
          <Route path="/captures/:id/analyzing" element={<AnalysisProgressPage />} />

          {/* Analysis overview (hero) */}
          <Route path="/captures/:id" element={<AnalysisOverviewPage />} />

          {/* Security assessment */}
          <Route path="/captures/:id/security" element={<SecurityAssessmentPage />} />

          {/* Technical details */}
          <Route path="/captures/:id/technical" element={<TechnicalDetailsPage />} />

          {/* Technical report */}
          <Route path="/captures/:id/report" element={<TechnicalReportPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
