import { Link, useLocation } from 'react-router-dom'

function OrderSuccess() {
  const location = useLocation()

  const orderId = location.state?.orderId
  const totalAmount = location.state?.totalAmount

  if (!orderId) {
    return (
      <div className="order-success-page">
        <div className="order-success-card">
          <h1>Order Not Found</h1>

          <p>
            We could not find the order information.
          </p>

          <Link to="/products" className="primary-button">
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="order-success-page">

      <div className="order-success-card">

        <div className="success-icon">
          ✓
        </div>

        <h1>Order Successful!</h1>

        <p className="success-description">
          Thank you for your purchase. Your order has been
          successfully placed.
        </p>

        <div className="order-success-details">

          <div>
            <span>Order ID</span>
            <strong>#{orderId}</strong>
          </div>

          <div>
            <span>Total Amount</span>
            <strong>
              ₹{Number(totalAmount).toLocaleString('en-IN')}
            </strong>
          </div>

        </div>

        <div className="order-success-actions">

          <Link
            to="/customer-dashboard"
            className="primary-button"
          >
            View My Orders
          </Link>

          <Link
            to="/products"
            className="secondary-button"
          >
            Continue Shopping
          </Link>

        </div>

      </div>

    </div>
  )
}

export default OrderSuccess