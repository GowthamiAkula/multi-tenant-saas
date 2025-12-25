import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import ProjectForm from '../components/ProjectForm';
import { Link } from 'react-router-dom';

function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const loadProjects = async () => {
    try {
      setError('');
      setLoading(true);

      const res = await api.get('/api/projects', {
        params: {
          status: statusFilter !== 'all' ? statusFilter : undefined,
          search: search || undefined
        }
      });

      const data = res.data.data || res.data;
      setProjects(data.projects || []);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to load projects.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadProjects();
  };

  const handleCreateNew = () => {
    setEditingProject(null);
    setShowForm(true);
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setShowForm(true);
  };

  const handleDelete = async (project) => {
    const ok = window.confirm(`Delete project "${project.name}"?`);
    if (!ok) return;

    try {
      await api.delete(`/api/projects/${project.id}`);
      await loadProjects();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to delete project.';
      setError(msg);
    }
  };

  const handleFormClose = (reload = false) => {
    setShowForm(false);
    setEditingProject(null);
    if (reload) loadProjects();
  };

  return (
  <div className="container mt-4">
    <div className="d-flex justify-content-between align-items-center mb-3">
      <h2 className="mb-0">Projects</h2>
      <button className="btn btn-primary" onClick={handleCreateNew}>
        Create New Project
      </button>
    </div>

    {/* Filters */}
    <div className="d-flex flex-wrap align-items-center mb-3 gap-2">
      <form
        onSubmit={handleSearchSubmit}
        className="d-flex align-items-center"
      >
        <input
          type="text"
          className="form-control"
          placeholder="Search by name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 220 }}
        />
        <button type="submit" className="btn btn-outline-secondary ms-2">
          Search
        </button>
      </form>

      <select
        className="form-select ms-2"
        style={{ maxWidth: 180 }}
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
      >
        <option value="all">All statuses</option>
        <option value="active">Active</option>
        <option value="completed">Completed</option>
        <option value="archived">Archived</option>
      </select>
    </div>

    {error && (
      <div className="alert alert-danger py-2" role="alert">
        {error}
      </div>
    )}
    {loading && <div>Loading projects...</div>}

    {!loading && projects.length === 0 && (
      <p className="text-muted">
        No projects yet. Click &quot;Create New Project&quot; to add one.
      </p>
    )}

    {projects.length > 0 && (
      <table className="table table-striped table-bordered align-middle">
        <thead className="table-light">
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Status</th>
            <th>Tasks</th>
            <th>Created</th>
            <th>Creator</th>
            <th style={{ width: 180 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{(p.description || '').slice(0, 60)}</td>
              <td>{p.status}</td>
              <td>{p.taskCount || 0}</td>
              <td>
                {new Date(p.createdAt || p.created_at).toLocaleString()}
              </td>
              <td>{p.createdByName || p.created_by_name || '-'}</td>
              <td>
                <Link to={`/projects/${p.id}`} className="btn btn-link btn-sm">
                  View
                </Link>
                <button
                  className="btn btn-sm btn-outline-secondary me-1"
                  onClick={() => handleEdit(p)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleDelete(p)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}

    {showForm && (
      <ProjectForm project={editingProject} onClose={handleFormClose} />
    )}
  </div>
);

}

export default ProjectsPage;
