import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import {
  LandingPage,
  DashboardPage,
  CaptureHistoryPage,
  NewCapturePage,
  AnalysisProgressPage,
  AnalysisOverviewPage,
  SecurityAssessmentPage,
  TechnicalDetailsPage,
  TechnicalReportPage,
  SecurityPosturePage,
  InvestigationWorkspacePage,
  CaptureComparisonPage,
  RemediationCenterPage,
  ModelCenterPage,
  DemoLabPage,
} from './pages';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page (Opens First at /) */}
        <Route path="/" element={<LandingPage />} />

        {/* Analyst Application Routes (Inside AppShell) */}
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/app" element={<Navigate to="/dashboard" replace />} />

          {/* Captures */}
          <Route path="/captures" element={<CaptureHistoryPage />} />
          <Route path="/captures/new" element={<NewCapturePage />} />
          <Route path="/captures/:id/analyzing" element={<AnalysisProgressPage />} />

          {/* Investigation Hub */}
          <Route path="/investigations/:id" element={<InvestigationWorkspacePage />} />
          <Route path="/captures/:id" element={<InvestigationWorkspacePage />} />
          <Route path="/captures/:id/overview" element={<AnalysisOverviewPage />} />
          <Route path="/captures/:id/security" element={<SecurityAssessmentPage />} />
          <Route path="/captures/:id/technical" element={<TechnicalDetailsPage />} />
          <Route path="/captures/:id/report" element={<TechnicalReportPage />} />

          {/* Security Posture & Remediation */}
          <Route path="/posture" element={<SecurityPosturePage />} />
          <Route path="/remediation" element={<RemediationCenterPage />} />

          {/* Analysis & Hardening Comparison */}
          <Route path="/compare" element={<CaptureComparisonPage />} />

          {/* Intelligence & Demo */}
          <Route path="/models" element={<ModelCenterPage />} />
          <Route path="/demo" element={<DemoLabPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
