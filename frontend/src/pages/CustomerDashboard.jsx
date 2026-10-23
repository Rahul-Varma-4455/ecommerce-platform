import LogoutButton from '../components/LogoutButton'

function CustomerDashboard() {
  return (
    <div className="dashboard-page">

      <div className="dashboard-header">
        <div>
          <h1>Customer Dashboard</h1>

          <p>
            Welcome to your ShopSphere customer dashboard.
          </p>
        </div>

        <LogoutButton />
      </div>

    </div>
  )
}

export default CustomerDashboard