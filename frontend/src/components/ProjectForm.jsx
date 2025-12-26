import React, { useState } from 'react';
import { api } from '../api/client';

function ProjectForm({ project, onClose }) {
  const isEdit = !!project;

  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [status, setStatus] = useState(project?.status || 'active');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Project name is required.');
      return;
    }
    if (description.length > 500) {
  setError('Description must be 500 characters or less.');
  return;
    }

    try {
      setLoading(true);

      if (isEdit) {
        await api.put(`/projects/${project.id}`, {
          name,
          description,
          status
        });
      } else {
        await api.post('/projects', {
          name,
          description,
          status
        });
      }

      onClose(true); // reload list
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to save project.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div style={{ background: '#fff', padding: 16, width: 400 }}>
        <h3>{isEdit ? 'Edit Project' : 'Create Project'}</h3>

        <form onSubmit={handleSubmit}>
          <div>
            <label>Project Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label>Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}

          <div style={{ marginTop: 12 }}>
            <button type="button" onClick={() => onClose(false)}>
              Cancel
            </button>{' '}
            <button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProjectForm;
