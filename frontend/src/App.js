import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RegisterTenantPage from './pages/RegisterTenantPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailsPage from './pages/ProjectDetailsPage';
import UsersListPage from './pages/UsersListPage';

function App() {
  return (
    <Routes>
      <Route path="/register" element={<RegisterTenantPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <Layout>
              <ProjectsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/projects/:projectId"
        element={
          <ProtectedRoute>
            <Layout>
              <ProjectDetailsPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* NEW: users list page */}
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <Layout>
              <UsersListPage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* default: redirect unknown routes to login */}
      <Route path="*" element={<LoginPage />} />
    </Routes>
  );
}

export default App;
