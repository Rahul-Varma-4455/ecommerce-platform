import CustomerDashboard from './pages/CustomerDashboard'
import SellerDashboard from './pages/SellerDashboard'
import AdminDashboard from './pages/AdminDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import Products from './pages/Products' 
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderSuccess from './pages/OrderSuccess'
import Orders from './pages/Orders'  
import SellerProducts from './pages/SellerProducts'
import SellerProductForm from './pages/SellerProductForm'
import SellerInventory from './pages/SellerInventory'
import SellerOrders from './pages/SellerOrders'
import AdminProducts from './pages/AdminProducts'
import AdminUsers from './pages/AdminUsers'
import AdminAnalytics from './pages/AdminAnalytics'

import { Link, Route, Routes } from 'react-router-dom'
import './App.css'

import Home from './pages/Home'
import Login from './pages/login'
import Register from './pages/Register'

function App() {
  return (
    <div className="app">

      <nav className="navbar">

        <div className="logo">
          <Link to="/">
            ShopSphere
          </Link>
        </div>

        <div className="nav-links">
         <Link to="/">Home</Link>
         <Link to="/products">Products</Link>
         <Link to="/cart">Cart 🛒</Link>
         <Link to="/orders">My Orders</Link>
         <Link to="/login">Login</Link>
         <Link to="/register">Register</Link>
        </div>

      </nav>

      <main>

        <Routes>

          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />
           <Route
            path="/customer-dashboard"
             element={
                <ProtectedRoute allowedRole="customer">
                   <CustomerDashboard />
                </ProtectedRoute>
              }
           />

          <Route
           path="/seller-dashboard"
              element={
               <ProtectedRoute allowedRole="seller">
                 <SellerDashboard />
                </ProtectedRoute>
              }
            />

          <Route
           path="/admin-dashboard"
             element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
               </ProtectedRoute>
              }
          />
          <Route
           path="/products"
           element={<Products />}
          /> 

          <Route path="/cart" element={
            <ProtectedRoute allowedRole="customer">
            <Cart />
            </ProtectedRoute>
          } />
          
          <Route
              path="/checkout"
              element={
                 <ProtectedRoute allowedRole="customer">
                   <Checkout />
                 </ProtectedRoute>
              }
          />
          <Route
              path="/order-success"
              element={
                 <ProtectedRoute allowedRole="customer">
                 <OrderSuccess />
                 </ProtectedRoute>
                }
           />

           <Route
              path="/orders"
              element={
             <ProtectedRoute allowedRole="customer">
              <Orders />
             </ProtectedRoute>
              }
            />

          <Route
            path="/seller/products"
            element={
              <ProtectedRoute allowedRole="seller">
                <SellerProducts />
              </ProtectedRoute>
            }
          />

          <Route
            path="/seller/products/new"
            element={
              <ProtectedRoute allowedRole="seller">
               <SellerProductForm />
              </ProtectedRoute>
             }
          />

          <Route
            path="/seller/products/:productId/edit"
            element={
              <ProtectedRoute allowedRole="seller">
               <SellerProductForm />
             </ProtectedRoute>
            }
          />

          <Route
           path="/seller/inventory"
           element={
            <ProtectedRoute allowedRole="seller">
              <SellerInventory />
            </ProtectedRoute>
            }
          />
          <Route
            path="/seller/orders"
            element={
             <ProtectedRoute allowedRole="seller">
              <SellerOrders />
             </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute allowedRole="admin">
               <AdminProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
             <ProtectedRoute allowedRole="admin">
              <AdminUsers />
             </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminAnalytics />
             </ProtectedRoute>
            }
          />

        </Routes>

      </main>

      <footer className="footer">
        <p>
          © 2026 ShopSphere. All rights reserved.
        </p>
      </footer>

    </div>
  )
}

export default App

export async function getAdminProducts() {
  const token = localStorage.getItem('access_token')

  const response = await fetch(
    `${API_BASE_URL}/admin/products?skip=0&limit=100`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.detail || 'Failed to load admin products'
    )
  }

  return data
}

export async function updateProductApproval(
  productId,
  approvalStatus
) {
  const token = localStorage.getItem('access_token')

  const response = await fetch(
    `${API_BASE_URL}/admin/products/${productId}/approval`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        status: approvalStatus,
      }),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.detail || 'Failed to update product approval'
    )
  }

  return data
}

