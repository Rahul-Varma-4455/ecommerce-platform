import { useEffect, useState } from 'react'
import {
  getAdminUsers,
  updateUserRole,
  updateUserStatus,
} from '../services/api'

function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingUserId, setUpdatingUserId] = useState(null)

  async function loadUsers() {
    setLoading(true)
    setError('')

    try {
      const data = await getAdminUsers()
      setUsers(data.users)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  async function handleRoleChange(userId, newRole) {
    const user = users.find((item) => item.id === userId)

    if (!user || user.role === newRole) {
      return
    }

    const confirmed = window.confirm(
      `Change ${user.name}'s role from ${user.role} to ${newRole}?`
    )

    if (!confirmed) {
      return
    }

    setUpdatingUserId(userId)
    setError('')

    try {
      await updateUserRole(userId, newRole)
      await loadUsers()
    } catch (error) {
      setError(error.message)
    } finally {
      setUpdatingUserId(null)
    }
  }

  if (loading) {
    return (
      <div className="admin-users-page">
        <h1>User Management</h1>
        <p>Loading users...</p>
      </div>
    )
  }

  async function handleStatusChange(userId, newStatus) {
  const user = users.find((item) => item.id === userId)

  if (!user) {
    return
  }

  const action = newStatus
    ? 'activate'
    : 'deactivate'

  const confirmed = window.confirm(
    `Are you sure you want to ${action} ${user.name}'s account?`
  )

  if (!confirmed) {
    return
  }

  setUpdatingUserId(userId)
  setError('')

  try {
    await updateUserStatus(userId, newStatus)
    await loadUsers()
  } catch (error) {
    setError(error.message)
  } finally {
    setUpdatingUserId(null)
  }
}

  return (
    <div className="admin-users-page">
      <div className="seller-page-header">
        <div>
          <h1>User Management</h1>
          <p>
            Manage user roles while protecting administrator access.
          </p>
        </div>
      </div>

      {error && (
        <p className="error-message">
          {error}
        </p>
      )}

      <div className="admin-users-table-wrapper">
        <table className="admin-users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
  <td>{user.id}</td>

  <td>
    <strong>{user.name}</strong>
  </td>

  <td>{user.email}</td>

  <td>
    <span className={`user-role role-${user.role}`}>
      {user.role}
    </span>
  </td>

  <td>
    <span
      className={
        user.is_active
          ? 'user-status user-status-active'
          : 'user-status user-status-inactive'
      }
    >
      {user.is_active ? 'Active' : 'Inactive'}
    </span>
  </td>

  <td>
    <div className="admin-user-actions">

      {user.role === 'admin' ? (
        <span className="admin-role-locked">
          🔒 Admin
        </span>
      ) : (
        <select
          value={user.role}
          disabled={updatingUserId === user.id}
          onChange={(event) =>
            handleRoleChange(
              user.id,
              event.target.value
            )
          }
        >
          <option value="customer">
            Customer
          </option>

          <option value="seller">
            Seller
          </option>

          <option value="admin">
            Admin
          </option>
        </select>
      )}

      <button
        className={
          user.is_active
            ? 'deactivate-button'
            : 'activate-button'
          }
          disabled={updatingUserId === user.id}
          onClick={() =>
            handleStatusChange(
               user.id,
               !user.is_active
            )
           }
          >
            {user.is_active
              ? 'Deactivate'
              : 'Activate'}
             </button>

              </div>
             </td>
            </tr>
              
          ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminUsers