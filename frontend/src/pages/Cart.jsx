import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCart, removeFromCart,updateCartItem, } from '../services/api'

function Cart() {
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [removingProductId, setRemovingProductId] = useState(null)

  async function loadCart() {
    setLoading(true)
    setError('')

    try {
      const data = await getCart()
      setCart(data)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCart()
  }, [])

  async function handleRemove(productId) {
    setRemovingProductId(productId)
    setError('')

    try {
      await removeFromCart(productId)
      await loadCart()
    } catch (error) {
      setError(error.message)
    } finally {
      setRemovingProductId(null)
    }
  }
  async function handleQuantityChange(productId, newQuantity) {
  if (newQuantity < 1) {
    return
  }

  setError('')

  try {
    await updateCartItem(productId, newQuantity)
    await loadCart()
  } catch (error) {
    setError(error.message)
  }
}

  if (loading) {
    return (
      <div className="cart-page">
        <h1>Your Cart</h1>
        <p>Loading cart...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="cart-page">
        <h1>Your Cart</h1>
        <p className="error-message">{error}</p>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-empty">
          <h1>Your Cart is Empty</h1>
          <p>Add some products to your cart to continue shopping.</p>

          <Link to="/products" className="primary-button">
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page">

      <div className="cart-header">
        <div>
          <h1>Your Cart</h1>
          <p>{cart.items.length} item(s) in your cart</p>
        </div>

        <Link to="/products" className="secondary-button">
          Continue Shopping
        </Link>
      </div>

      <div className="cart-layout">

        <div className="cart-items">

          {cart.items.map((item) => (
            <div className="cart-item" key={item.product_id}>

              <div className="cart-item-image">
                🛍️
              </div>

              <div className="cart-item-details">

                <h2>{item.product_name}</h2>

                <p className="cart-item-price">
                  ₹{item.price.toLocaleString('en-IN')}
                </p>

                <div className="quantity-control">
  <button
    onClick={() =>
      handleQuantityChange(
        item.product_id,
        item.quantity - 1
      )
    }
    disabled={item.quantity === 1}
  >
    −
  </button>

  <span>{item.quantity}</span>

  <button
    onClick={() =>
      handleQuantityChange(
        item.product_id,
        item.quantity + 1
      )
    }
  >
    +
  </button>
</div>

                <p className="cart-item-subtotal">
                  Subtotal: ₹{item.subtotal.toLocaleString('en-IN')}
                </p>

                <button
                  className="remove-button"
                  onClick={() => handleRemove(item.product_id)}
                  disabled={removingProductId === item.product_id}
                >
                  {removingProductId === item.product_id
                    ? 'Removing...'
                    : 'Remove'}
                </button>

              </div>

            </div>
          ))}

        </div>

        <div className="cart-summary">

          <h2>Order Summary</h2>

          <div className="cart-summary-row">
            <span>Items</span>
            <span>{cart.items.length}</span>
          </div>

          <div className="cart-summary-row cart-total">
            <span>Total</span>
            <span>
              ₹{cart.total.toLocaleString('en-IN')}
            </span>
          </div>

          <Link
            to="/checkout"
            className="primary-button checkout-button"
          >
            Proceed to Checkout
          </Link>

        </div>

      </div>

    </div>
  )
}

export default Cart