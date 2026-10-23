import { Link } from 'react-router-dom'
import LogoutButton from '../components/LogoutButton'

function AdminDashboard() {
  return (
    <div className="admin-dashboard-page">

      <div className="admin-dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>
          Welcome to your ShopSphere admin dashboard.
        </p>
      </div>

      <div className="admin-dashboard-grid">

        <Link
          to="/admin/products"
          className="admin-dashboard-card"
        >
          <h2>Product Management</h2>
          <p>
            Review, approve, and reject products submitted
            by sellers.
          </p>
        </Link>

        <Link
          to="/admin/users"
          className="admin-dashboard-card"
        >
          <h2>User Management</h2>
          <p>
            View users and manage their roles and permissions.
          </p>
        </Link>

        <Link
          to="/admin/analytics"
          className="admin-dashboard-card"
        >
          <h2>Platform Analytics</h2>
          <p>
            View platform-wide users, products, orders,
            and revenue statistics.
          </p>
        </Link>

      </div>

      <div style={{ marginTop: '30px' }}>
        <LogoutButton />
      </div>

    </div>
  )
}

export default AdminDashboard