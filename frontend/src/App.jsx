import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import LoginPage from './pages/LoginPage';
import TeacherDashboard from './pages/TeacherDashboard';
import BulkSubmissionAnalyzer from './pages/BulkSubmissionAnalyzer';
import SubmissionReview from './pages/SubmissionReview';
import StudentDashboard from './pages/StudentDashboard';
import AssignmentWork from './pages/AssignmentWork';
import AssignmentDetail from './pages/AssignmentDetail';
import CompanyProjectVerification from './pages/CompanyProjectVerification';
import ProjectManagement from './pages/ProjectManagement';
import FileUpload from './pages/FileUpload';
import ProjectAnalysis from './pages/ProjectAnalysis';
import TeamContribution from './pages/TeamContribution';
import SkillGraphPage from './pages/SkillGraphPage';
import PublicProfile from './pages/PublicProfile';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Landing Page - GrowMint */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Teacher Workspace (Wrapped in layout) */}
          <Route path="/teacher/dashboard" element={<Layout><TeacherDashboard /></Layout>} />
          <Route path="/teacher/class-analysis" element={<Layout><BulkSubmissionAnalyzer /></Layout>} />
          <Route path="/teacher/submissions/:id" element={<Layout><SubmissionReview /></Layout>} />

          {/* Student Workspace (Wrapped in layout) */}
          <Route path="/student/dashboard" element={<Layout><StudentDashboard /></Layout>} />
          <Route path="/student/assignment/:id/brief" element={<Layout><AssignmentDetail /></Layout>} />
          <Route path="/student/assignment/:id" element={<Layout><AssignmentWork /></Layout>} />
          <Route path="/student/team/manage" element={<Layout><ProjectManagement /></Layout>} />
          <Route path="/student/team/upload/:projectId" element={<Layout><FileUpload /></Layout>} />
          <Route path="/student/team/analyze/:projectId" element={<Layout><ProjectAnalysis /></Layout>} />
          <Route path="/student/team/:id" element={<Layout><TeamContribution /></Layout>} />
          <Route path="/student/skillgraph" element={<Layout><SkillGraphPage /></Layout>} />
          <Route path="/student/company-verification" element={<Layout><CompanyProjectVerification /></Layout>} />

          {/* Public Verified Resume Link */}
          <Route path="/profile/:id" element={<Layout><PublicProfile /></Layout>} />

          {/* Backward compatibility */}
          <Route path="/teacher" element={<Navigate to="/teacher/dashboard" replace />} />
          <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />

          {/* Catch-all to prevent stuck users on deleted routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
