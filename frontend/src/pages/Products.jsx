import { useEffect, useState } from 'react'
import { getCategories, getProducts,addToCart } from '../services/api'

function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])

  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
    
  const [cartMessage, setCartMessage] = useState('')
  const [cartError, setCartError] = useState('')
  const [addingProductId, setAddingProductId] = useState(null)

  async function loadProducts(filters = {}) {
    setLoading(true)
    setError('')

    try {
      const data = await getProducts(filters)
      setProducts(data)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadCategories() {
    try {
      const data = await getCategories()
      setCategories(data)
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  async function handleAddToCart(productId) {
  const token = localStorage.getItem('access_token')

  if (!token) {
    setCartError('Please login as a customer to add products to cart.')
    return
  }

  setAddingProductId(productId)
  setCartMessage('')
  setCartError('')

  try {
    await addToCart(productId, 1)
    setCartMessage('Product added to cart successfully.')
  } catch (error) {
    setCartError(error.message)
  } finally {
    setAddingProductId(null)
  }
 }

  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [])

  function handleSearch() {
    loadProducts({
      search,
      categoryId,
      minPrice,
      maxPrice,
    })
  }

  function handleClearFilters() {
    setSearch('')
    setCategoryId('')
    setMinPrice('')
    setMaxPrice('')

    loadProducts()
  }

  if (loading) {
    return (
      <div className="products-page">
        <h1>Products</h1>
        <p>Loading products...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="products-page">
        <h1>Products</h1>
        <p className="error-message">{error}</p>
      </div>
    )
  }

  return (
    <div className="products-page">

      <div className="products-header">
        <h1>Products</h1>
        <p>Discover products from our sellers.</p>
      </div>

      <div className="product-filters">

        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
        >
          <option value="">All Categories</option>

          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Min Price"
          value={minPrice}
          onChange={(event) => setMinPrice(event.target.value)}
        />

        <input
          type="number"
          placeholder="Max Price"
          value={maxPrice}
          onChange={(event) => setMaxPrice(event.target.value)}
        />

        <button
          className="primary-button"
          onClick={handleSearch}
        >
          Apply Filters
        </button>

        <button
          className="clear-button"
          onClick={handleClearFilters}
        >
          Clear
        </button>

      </div>
       {cartMessage && (
         <p className="success-message">
         {cartMessage}
         </p>
        )}

       {cartError && (
        <p className="error-message">
          {cartError}
        </p>
       )}

      <div className="product-grid"></div>



      <div className="product-grid">

        {products.length === 0 ? (
          <p>No products found.</p>
        ) : (
          products.map((product) => (
            <div className="product-card" key={product.id}>

              <div className="product-image">
                🛍️
              </div>

              <div className="product-info">

                <h2>{product.name}</h2>

                <p className="product-description">
                  {product.description}
                </p>

                <p className="product-price">
                  ₹{product.price.toLocaleString('en-IN')}
                </p>

                <button
                  className="primary-button"
                  onClick={() => handleAddToCart(product.id)}
                   disabled={addingProductId === product.id}
                  >
                  {addingProductId === product.id ? 'Adding...' : 'Add to Cart'}
                </button>

              </div>

            </div>
          ))
        )}

      </div>

    </div>
  )
}

export default Products