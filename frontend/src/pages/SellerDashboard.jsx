import { Link } from 'react-router-dom'

function SellerDashboard() {
  return (
    <div className="dashboard-page">
      <h1>Seller Dashboard</h1>

      <p>
        Welcome to your ShopSphere seller dashboard.
      </p>
      
      <Link
        to="/seller/products"
        className="dashboard-card"
      >
       <h2>My Products</h2>
       <p>Manage your products.</p>
     </Link>

     <Link
       to="/seller/inventory"
       className="dashboard-card"
      >
       <h2>Inventory</h2>
       <p>Manage stock and low-stock alerts.</p>
      </Link>

      <Link
       to="/seller/orders"
       className="dashboard-card"
      >
        <h2>Orders</h2>
        <p>View and manage customer orders.</p>
      </Link>
    </div>
  )
  
}

export default SellerDashboard

