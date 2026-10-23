import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  deleteSellerProduct,
  getSellerProducts,
} from '../services/api'

function SellerProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadProducts() {
    setLoading(true)
    setError('')

    try {
      const data = await getSellerProducts()
      setProducts(data)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  async function handleDeactivate(productId) {
    const confirmed = window.confirm(
      'Are you sure you want to deactivate this product?'
    )

    if (!confirmed) {
      return
    }

    try {
      await deleteSellerProduct(productId)
      await loadProducts()
    } catch (error) {
      setError(error.message)
    }
  }

  if (loading) {
    return (
      <div className="seller-products-page">
        <h1>My Products</h1>
        <p>Loading products...</p>
      </div>
    )
  }

  return (
    <div className="seller-products-page">

      <div className="seller-page-header">
        <div>
          <h1>My Products</h1>
          <p>Manage the products you sell.</p>
        </div>

        <Link
          to="/seller/products/new"
          className="primary-button"
        >
          + Add Product
        </Link>
      </div>

      {error && (
        <p className="error-message">
          {error}
        </p>
      )}

      {products.length === 0 ? (
        <div className="seller-empty">
          <h2>No Products Yet</h2>
          <p>Create your first product to start selling.</p>

          <Link
            to="/seller/products/new"
            className="primary-button"
          >
            Add Product
          </Link>
        </div>
      ) : (
        <div className="seller-products-table-wrapper">

          <table className="seller-products-table">

            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Status</th>
                <th>Active</th>
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
                    {product.is_active ? 'Yes' : 'No'}
                  </td>

                  <td>

                    <div className="seller-actions">

                      <Link
                        to={`/seller/products/${product.id}/edit`}
                        className="edit-button"
                      >
                        Edit
                      </Link>

                      {product.is_active && (
                        <button
                          className="remove-button"
                          onClick={() =>
                            handleDeactivate(product.id)
                          }
                        >
                          Deactivate
                        </button>
                      )}

                    </div>

                  </td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>
      )}

    </div>
  )
}

export default SellerProducts