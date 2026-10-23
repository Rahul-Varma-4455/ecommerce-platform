import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  createProduct,
  getCategories,
  getSellerProducts,
  updateSellerProduct,
} from '../services/api'

function SellerProductForm() {
  const { productId } = useParams()
  const navigate = useNavigate()

  const isEditMode = Boolean(productId)

  const [categories, setCategories] = useState([])

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')

  const [loading, setLoading] = useState(isEditMode)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function loadCategories() {
    const data = await getCategories()
    setCategories(data)
  }

  async function loadProduct() {
    const products = await getSellerProducts()

    const product = products.find(
      (item) => item.id === Number(productId)
    )

    if (!product) {
      throw new Error('Product not found')
    }

    setName(product.name)
    setDescription(product.description || '')
    setPrice(product.price)
    setCategoryId(String(product.category_id))
  }

  async function loadForm() {
    setLoading(true)
    setError('')

    try {
      await loadCategories()

      if (isEditMode) {
        await loadProduct()
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadForm()
  }, [productId])

  async function handleSubmit(event) {
    event.preventDefault()

    setSaving(true)
    setError('')

    try {
      const productData = {
        name: name.trim(),
        description: description.trim() || null,
        price: Number(price),
        category_id: Number(categoryId),
      }

      if (isEditMode) {
        await updateSellerProduct(
          Number(productId),
          productData
        )
      } else {
        await createProduct(productData)
      }

      navigate('/seller/products')
    } catch (error) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="seller-form-page">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="seller-form-page">

      <div className="seller-form-card">

        <div className="seller-form-header">
          <div>
            <h1>
              {isEditMode
                ? 'Edit Product'
                : 'Add Product'}
            </h1>

            <p>
              {isEditMode
                ? 'Update your product information.'
                : 'Create a new product to sell.'}
            </p>
          </div>

          <Link
            to="/seller/products"
            className="secondary-button"
          >
            Back
          </Link>
        </div>

        {error && (
          <p className="error-message">
            {error}
          </p>
        )}

        <form
          className="seller-product-form"
          onSubmit={handleSubmit}
        >

          <div className="form-group">
            <label htmlFor="product-name">
              Product Name
            </label>

            <input
              id="product-name"
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Enter product name"
              minLength="2"
              maxLength="200"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="product-description">
              Description
            </label>

            <textarea
              id="product-description"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Describe your product"
              maxLength="1000"
              rows="5"
            />
          </div>

          <div className="form-group">
            <label htmlFor="product-price">
              Price
            </label>

            <input
              id="product-price"
              type="number"
              value={price}
              onChange={(event) =>
                setPrice(event.target.value)
              }
              placeholder="Enter price"
              min="0.01"
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="product-category">
              Category
            </label>

            <select
              id="product-category"
              value={categoryId}
              onChange={(event) =>
                setCategoryId(event.target.value)
              }
              required
            >
              <option value="">
                Select a category
              </option>

              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="seller-form-actions">

            <Link
              to="/seller/products"
              className="secondary-button"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {saving
                ? 'Saving...'
                : isEditMode
                  ? 'Update Product'
                  : 'Create Product'}
            </button>

          </div>

        </form>

      </div>

    </div>
  )
}

export default SellerProductForm