import { useEffect, useState } from 'react'
import {
  getAdminProducts,
  updateProductApproval,
} from '../services/api'

function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingProductId, setUpdatingProductId] =
    useState(null)

  async function loadProducts() {
    setLoading(true)
    setError('')

    try {
      const data = await getAdminProducts()
      setProducts(data.products)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  async function handleApproval(productId, newStatus) {
    setUpdatingProductId(productId)
    setError('')

    try {
      await updateProductApproval(
        productId,
        newStatus
      )

      await loadProducts()
    } catch (error) {
      setError(error.message)
    } finally {
      setUpdatingProductId(null)
    }
  }

  if (loading) {
    return (
      <div className="admin-products-page">
        <h1>Product Management</h1>
        <p>Loading products...</p>
      </div>
    )
  }

  return (
    <div className="admin-products-page">

      <div className="seller-page-header">
        <div>
          <h1>Product Management</h1>
          <p>
            Review and manage products submitted by sellers.
          </p>
        </div>
      </div>

      {error && (
        <p className="error-message">
          {error}
        </p>
      )}

      <div className="admin-products-table-wrapper">

        <table className="admin-products-table">

          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Seller</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>

            {products.map((product) => (
              <tr key={product.id}>

                <td>
                  <strong>{product.name}</strong>

                  <small>
                    {product.description}
                  </small>
                </td>

                <td>
                  {product.category}
                </td>

                <td>
                  <strong>
                    {product.seller.name}
                  </strong>

                  <small>
                    {product.seller.email}
                  </small>
                </td>

                <td>
                  ₹{product.price.toLocaleString('en-IN')}
                </td>

                <td>
                  <span
                    className={`product-status status-${product.approval_status}`}
                  >
                    {product.approval_status}
                  </span>
                </td>

                <td>
                  <div className="admin-product-actions">

                    {product.approval_status !==
                      'approved' && (
                      <button
                        className="approve-button"
                        disabled={
                          updatingProductId ===
                          product.id
                        }
                        onClick={() =>
                          handleApproval(
                            product.id,
                            'approved'
                          )
                        }
                      >
                        Approve
                      </button>
                    )}

                    {product.approval_status !==
                      'rejected' && (
                      <button
                        className="reject-button"
                        disabled={
                          updatingProductId ===
                          product.id
                        }
                        onClick={() =>
                          handleApproval(
                            product.id,
                            'rejected'
                          )
                        }
                      >
                        Reject
                      </button>
                    )}

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

export default AdminProducts