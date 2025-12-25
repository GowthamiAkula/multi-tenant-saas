import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

function UserFormModal({ tenantId, user, onClose }) {
  const isEdit = !!user;

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setFullName(user.fullName || user.full_name || '');
      setRole(user.role || 'user');
      setIsActive(!(user.isActive === false || user.is_active === false));
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !fullName || (!isEdit && !password)) {
      setError('Email, full name, and password (for new user) are required.');
      return;
    }

    try {
      setSaving(true);
      if (isEdit) {
        await api.put(`/api/users/${user.id}`, {
          email,
          fullName,
          password: password || undefined,
          role,
          isActive
        });
      } else {
        await api.post(`/api/tenants/${tenantId}/users`, {
          email,
          fullName,
          password,
          role,
          isActive
        });
      }
      onClose(true);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to save user.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div style={{ background: '#fff', padding: 16, minWidth: 320 }}>
        <h3>{isEdit ? 'Edit User' : 'Add User'}</h3>

        {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 8 }}>
            <label>
              Email
              <br />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label>
              Full Name
              <br />
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </label>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label>
              Password {isEdit && '(leave blank to keep)'}
              <br />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label>
              Role
              <br />
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="user">User</option>
                <option value="tenant_admin">Tenant Admin</option>
              </select>
            </label>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />{' '}
              Active
            </label>
          </div>

          <div style={{ marginTop: 12 }}>
            <button type="button" onClick={() => onClose(false)} disabled={saving}>
              Cancel
            </button>{' '}
            <button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserFormModal;
