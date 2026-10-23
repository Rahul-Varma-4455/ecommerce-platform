import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyOrders,cancelMyOrder, } from '../services/api'

function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadOrders() {
    setLoading(true)
    setError('')

    try {
      const data = await getMyOrders()
      setOrders(data.orders)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCancelOrder(orderId) {
  const confirmed = window.confirm(
    'Are you sure you want to cancel this unpaid order?'
  )

  if (!confirmed) {
    return
  }

  setError('')

  try {
    await cancelMyOrder(orderId)
    await loadOrders()
  } catch (error) {
    setError(error.message)
  }
}

  useEffect(() => {
    loadOrders()
  }, [])

  function getStatusClass(status) {
    return `order-status status-${status}`
  }

  if (loading) {
    return (
      <div className="orders-page">
        <h1>My Orders</h1>
        <p>Loading your orders...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="orders-page">
        <h1>My Orders</h1>
        <p className="error-message">{error}</p>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="orders-page">
        <div className="orders-empty">
          <h1>No Orders Yet</h1>

          <p>
            You haven't placed any orders yet.
          </p>

          <Link
            to="/products"
            className="primary-button"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="orders-page">

      <div className="orders-header">
        <div>
          <h1>My Orders</h1>
          <p>
            View your order history and current order status.
          </p>
        </div>

        <Link
          to="/products"
          className="secondary-button"
        >
          Continue Shopping
        </Link>
      </div>

      <div className="orders-list">

        {orders.map((order) => (

          <div
            className="order-card"
            key={order.order_id}
          >

            <div className="order-card-header">

              <div>
                <h2>
                  Order #{order.order_id}
                </h2>

                <p>
                  {order.items.length} item(s)
                </p>
              </div>

              <span className={getStatusClass(order.status)}>
                {order.status}
              </span>

            </div>

            <div className="order-items">

              {order.items.map((item) => (

                <div
                  className="order-item"
                  key={item.product_id}
                >

                  <div>
                    <h3>{item.product_name}</h3>

                    <p>
                      ₹{Number(
                        item.price_at_purchase
                      ).toLocaleString('en-IN')}
                      {' × '}
                      {item.quantity}
                    </p>
                  </div>

                  <strong>
                    ₹{Number(
                      item.subtotal
                    ).toLocaleString('en-IN')}
                  </strong>

                </div>

              ))}

            </div>
             {order.status === 'payment_pending' && (
              <div className="order-payment-actions">

                <div className="order-payment-info">

                  <strong>
                    Payment{' '}
                    {order.payment_status === 'cancelled'
                     ? 'Cancelled'
                     : 'Pending'}
                  </strong>

                 <span>
                  Complete payment to confirm your order.
                 </span>

                </div>

                <div className="order-payment-buttons">

                 <Link
                   to={`/checkout?retry=${order.order_id}`}
                   className="primary-button"
                  >
                   Retry Payment
                  </Link>

                  <button
                    className="danger-button"
                    onClick={() =>
                      handleCancelOrder(order.order_id)
                   }
                 >
                  Cancel Order
               </button>

              </div>

            </div>
          )}

            <div className="order-card-footer">

              <span>Total</span>

              <strong>
                ₹{Number(
                  order.total_amount
                ).toLocaleString('en-IN')}
              </strong>

            </div>

          </div>

        ))}

      </div>

    </div>
  )
}

export default Orders