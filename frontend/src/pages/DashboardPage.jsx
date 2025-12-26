import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError('');
        setLoading(true);

        const res = await api.get('/projects', {
          params: { page: 1, limit: 50 }
        });

        const data = res.data.data || res.data;
        const projects = data.projects || [];
        const totalProjects = data.total || projects.length;

        let totalTasks = 0;
        let completedTasks = 0;

        projects.forEach((p) => {
          totalTasks += p.taskCount || 0;
          completedTasks += p.completedTaskCount || 0;
        });

        const pendingTasks = totalTasks - completedTasks;

        setStats({
          totalProjects,
          totalTasks,
          completedTasks,
          pendingTasks
        });

        setRecentProjects(projects.slice(0, 5));
      } catch (err) {
        const msg =
          err.response?.data?.message ||
          err.response?.data?.error ||
          'Failed to load dashboard data.please try again and contact support ';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="container mt-4">
      <h2 className="mb-3">Dashboard</h2>

      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}
      {loading && (
  <div className="text-muted">
    Loading dashboard statistics, please wait...
  </div>
      )}


      {/* Statistics */}
      <section className="mt-4">
        <h3 className="h5">Statistics</h3>
        <ul className="list-group list-group-flush mt-2">
          <li className="list-group-item px-0">
            <strong>Total Projects:</strong> {stats.totalProjects}
          </li>
          <li className="list-group-item px-0">
            <strong>Total Tasks:</strong> {stats.totalTasks}
          </li>
          <li className="list-group-item px-0">
            <strong>Completed Tasks:</strong> {stats.completedTasks}
          </li>
          <li className="list-group-item px-0">
            <strong>Pending Tasks:</strong> {stats.pendingTasks}
          </li>
        </ul>
      </section>

      {/* Recent projects */}
      <section className="mt-4">
        <h3 className="h5">Recent Projects</h3>
        {recentProjects.length === 0 ? (
          <p className="text-muted mt-2">No projects yet.</p>
        ) : (
          <ul className="list-group mt-2">
            {recentProjects.map((p) => (
              <li key={p.id} className="list-group-item">
                <strong>{p.name}</strong> – {p.status} – Tasks:{' '}
                {p.taskCount || 0}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* My Tasks placeholder */}
      <section className="mt-4">
        <h3 className="h5">My Tasks</h3>
        <p className="text-muted">
          Tasks assigned to you will be implemented in the next step.
        </p>
      </section>
    </div>
  );
}

export default DashboardPage;
