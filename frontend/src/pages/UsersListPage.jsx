import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import UserFormModal from '../components/UserFormModal';

function UsersListPage() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // 1) Load current user (same as Layout)
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await api.get('/api/auth/me');
        const me = res.data.data || res.data.user || null;
        setUser(me);
      } catch (err) {
        setUser(null);
        setError('Unauthorized access');
      }
    };

    fetchMe();
  }, []);

  const tenantId = user?.tenantId || user?.tenant_id || null;
  const isTenantAdmin = user?.role === 'tenant_admin';

  // 2) Load tenant users once user is known
  const loadUsers = async () => {
    if (!tenantId || !isTenantAdmin) return;
    try {
      setError('');
      setLoading(true);

      const params = {};
      if (search) params.search = search;
      if (roleFilter !== 'all') params.role = roleFilter;

      const res = await api.get(`/api/tenants/${tenantId}/users`, { params });
      const data = res.data.data || res.data;
      setUsers(data.users || data);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to load users.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId && isTenantAdmin) {
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, isTenantAdmin, roleFilter]);

  if (!user) {
    return <div>Loading...</div>;
  }

  if (!isTenantAdmin) {
    return <div>Not authorized.</div>;
  }

  const handleDelete = async (u) => {
    const ok = window.confirm(`Delete user "${u.fullName || u.full_name}"?`);
    if (!ok) return;

    try {
      await api.delete(`/api/users/${u.id}`);
      loadUsers();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to delete user.';
      setError(msg);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>Users</h2>

      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}

      <div style={{ marginBottom: 12 }}>
        <button
          onClick={() => {
            setEditingUser(null);
            setShowForm(true);
          }}
        >
          Add User
        </button>

        <input
          style={{ marginLeft: 12 }}
          placeholder="Search name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
        />

        <select
          style={{ marginLeft: 8 }}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All roles</option>
          <option value="user">User</option>
          <option value="tenant_admin">Tenant Admin</option>
        </select>

        <button style={{ marginLeft: 8 }} onClick={loadUsers}>
          Search
        </button>
      </div>

      {loading && <div>Loading...</div>}

      {!loading && users.length === 0 && <p>No users found.</p>}

      {users.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>Full Name</th>
              <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>Email</th>
              <th style={{ borderBottom: '1px solid #ccc' }}>Role</th>
              <th style={{ borderBottom: '1px solid #ccc' }}>Status</th>
              <th style={{ borderBottom: '1px solid #ccc' }}>Created</th>
              <th style={{ borderBottom: '1px solid #ccc' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.fullName || u.full_name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.isActive === false || u.is_active === false ? 'Inactive' : 'Active'}</td>
                <td>
                  {(u.createdAt || u.created_at)
                    ? new Date(u.createdAt || u.created_at).toLocaleDateString()
                    : '-'}
                </td>
                <td>
                  <button
                    onClick={() => {
                      setEditingUser(u);
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </button>{' '}
                  <button onClick={() => handleDelete(u)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <UserFormModal
          tenantId={tenantId}
          user={editingUser}
          onClose={(reload) => {
            setShowForm(false);
            setEditingUser(null);
            if (reload) loadUsers();
          }}
        />
      )}
    </div>
  );
}

export default UsersListPage;
