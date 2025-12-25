import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import ProjectForm from '../components/ProjectForm';
import TaskForm from '../components/TaskForm';

function ProjectDetailsPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const loadData = async () => {
    try {
      setError('');
      setLoading(true);

      const [projRes, tasksRes] = await Promise.all([
        api.get(`/api/projects/${projectId}`),
        api.get(`/api/projects/${projectId}/tasks`)
      ]);

      const projData = projRes.data.data || projRes.data;
      const tasksData = tasksRes.data.data || tasksRes.data;

      setProject(projData.project || projData);
      setTasks(tasksData.tasks || tasksData);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to load project.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleProjectDelete = async () => {
    if (!project) return;
    const ok = window.confirm(`Delete project "${project.name}"?`);
    if (!ok) return;

    try {
      await api.delete(`/api/projects/${project.id}`);
      navigate('/projects');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to delete project.';
      setError(msg);
    }
  };

  const handleProjectFormClose = (reload = false) => {
    setShowProjectForm(false);
    if (reload) loadData();
  };

  const handleTaskFormClose = (reload = false) => {
    setShowTaskForm(false);
    setEditingTask(null);
    if (reload) loadData();
  };

  const handleChangeTaskStatus = async (task, newStatus) => {
    try {
      await api.patch(
        `/api/projects/${projectId}/tasks/${task.id}/status`,
        { status: newStatus }
      );
      loadData();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to update task status.';
      setError(msg);
    }
  };

  const handleDeleteTask = async (task) => {
    const ok = window.confirm(`Delete task "${task.title}"?`);
    if (!ok) return;

    try {
      await api.delete(`/api/projects/${projectId}/tasks/${task.id}`);
      loadData();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to delete task.';
      setError(msg);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (
      assignedFilter !== 'all' &&
      String(t.assignedToId || '') !== String(assignedFilter)
    )
      return false;
    return true;
  });

  return (
    <div className="container mt-4">
      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}
      {loading && <div>Loading...</div>}

      {project && (
        <>
          {/* Project header */}
          <section className="mb-4">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h2 className="mb-1">{project.name}</h2>
                <span className="badge bg-secondary">{project.status}</span>
                <p className="mt-2 mb-0">{project.description}</p>
              </div>
              <div>
                <button
                  className="btn btn-outline-secondary me-2"
                  onClick={() => setShowProjectForm(true)}
                >
                  Edit Project
                </button>
                <button
                  className="btn btn-outline-danger"
                  onClick={handleProjectDelete}
                >
                  Delete Project
                </button>
              </div>
            </div>
          </section>

          {/* Tasks section */}
          <section>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="h5 mb-0">Tasks</h3>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setEditingTask(null);
                  setShowTaskForm(true);
                }}
              >
                Add Task
              </button>
            </div>

            {/* Filters */}
            <div className="d-flex flex-wrap gap-2 mb-3">
              <select
                className="form-select"
                style={{ maxWidth: 180 }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="todo">Todo</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>

              <select
                className="form-select"
                style={{ maxWidth: 180 }}
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="all">All priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>

              <select
                className="form-select"
                style={{ maxWidth: 180 }}
                value={assignedFilter}
                onChange={(e) => setAssignedFilter(e.target.value)}
              >
                <option value="all">All assignees</option>
                {Array.from(
                  new Set(
                    tasks
                      .filter((t) => t.assignedToId)
                      .map((t) => String(t.assignedToId))
                  )
                ).map((id) => (
                  <option key={id} value={id}>
                    User {id}
                  </option>
                ))}
              </select>
            </div>

            {/* Empty state */}
            {!loading && filteredTasks.length === 0 && (
              <p className="text-muted">
                No tasks yet. Click &quot;Add Task&quot; to create one.
              </p>
            )}

            {/* Tasks table */}
            {filteredTasks.length > 0 && (
              <table className="table table-striped table-bordered align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Assigned To</th>
                    <th>Due Date</th>
                    <th style={{ width: 220 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((t) => (
                    <tr key={t.id}>
                      <td>{t.title}</td>
                      <td>{t.status}</td>
                      <td>{t.priority}</td>
                      <td>{t.assignedToName || t.assigned_to_name || '-'}</td>
                      <td>
                        {t.dueDate || t.due_date
                          ? new Date(
                              t.dueDate || t.due_date
                            ).toLocaleDateString()
                          : '-'}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-secondary me-1"
                          onClick={() => {
                            setEditingTask(t);
                            setShowTaskForm(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-success me-1"
                          onClick={() =>
                            handleChangeTaskStatus(
                              t,
                              t.status === 'completed' ? 'todo' : 'completed'
                            )
                          }
                        >
                          {t.status === 'completed' ? 'Mark Todo' : 'Mark Done'}
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteTask(t)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Project edit modal */}
            {showProjectForm && (
              <ProjectForm project={project} onClose={handleProjectFormClose} />
            )}

            {/* Task create/edit modal */}
            {showTaskForm && (
              <TaskForm
                projectId={project.id}
                task={editingTask}
                onClose={handleTaskFormClose}
              />
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default ProjectDetailsPage;
