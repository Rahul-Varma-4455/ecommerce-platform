import { useEffect, useState } from 'react'
import {
  getSellerOrders,
  updateSellerOrderStatus,
  cancelSellerOrder,
} from '../services/api'

function SellerOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingOrderId, setUpdatingOrderId] = useState(null)

  async function loadOrders() {
    setLoading(true)
    setError('')

    try {
      const data = await getSellerOrders()

      const groupedOrders = groupOrders(data.orders)

      setOrders(groupedOrders)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  async function handleStatusUpdate(orderId, newStatus) {
    setUpdatingOrderId(orderId)
    setError('')

    try {
      await updateSellerOrderStatus(
        orderId,
        newStatus
      )

      await loadOrders()
    } catch (error) {
      setError(error.message)
    } finally {
      setUpdatingOrderId(null)
    }
  }
  async function handleCancelOrder(orderId) {
  const confirmed = window.confirm(
    'Are you sure you want to cancel this unpaid order?'
  )

  if (!confirmed) {
    return
  }

  setUpdatingOrderId(orderId)
  setError('')

  try {
    await cancelSellerOrder(orderId)
    await loadOrders()
  } catch (error) {
    setError(error.message)
  } finally {
    setUpdatingOrderId(null)
  }
}

  if (loading) {
    return (
      <div className="seller-orders-page">
        <h1>Orders</h1>
        <p>Loading orders...</p>
      </div>
    )
  }

  return (
    <div className="seller-orders-page">

      <div className="seller-page-header">
        <div>
          <h1>Orders</h1>
          <p>
            Manage orders containing your products.
          </p>
        </div>
      </div>

      {error && (
        <p className="error-message">
          {error}
        </p>
      )}

      {orders.length === 0 ? (
        <div className="seller-empty">
          <h2>No Orders Yet</h2>
          <p>
            You don't have any orders for your products.
          </p>
        </div>
      ) : (
        <div className="seller-orders-list">

          {orders.map((order) => (
            <SellerOrderCard
              key={order.order_id}
              order={order}
              updating={
                updatingOrderId === order.order_id
              }
              onStatusUpdate={handleStatusUpdate}
              onCancelOrder={handleCancelOrder}
            />
          ))}

        </div>
      )}

    </div>
  )
}


/*
 * Converts:
 *
 * Order 2 → Laptop
 * Order 2 → Mouse
 *
 * into:
 *
 * Order 2
 *   ├── Laptop
 *   └── Mouse
 */
function groupOrders(orderRows) {
  const orderMap = new Map()

  orderRows.forEach((row) => {

    if (!orderMap.has(row.order_id)) {
      orderMap.set(row.order_id, {
        order_id: row.order_id,
        customer: row.customer,
        status: row.order_status,
        items: [],
        total_amount: 0,
      })
    }

    const order = orderMap.get(row.order_id)

    order.items.push({
      product_id: row.product.id,
      product_name: row.product.name,
      quantity: row.quantity,
      price_at_purchase: row.price_at_purchase,
      subtotal: row.subtotal,
    })

    order.total_amount += Number(row.subtotal)
  })

  return Array.from(orderMap.values())
}

function formatOrderStatus(status) {
  const statusLabels = {
    payment_pending: 'Payment Pending',
    placed: 'Placed',
    confirmed: 'Confirmed',
    shipped: 'Shipped',
    delivered: 'Delivered',
     cancelled: 'Cancelled'
  }

  return (
    labels[status] ||
    'Unknown Status'
  )
}


function SellerOrderCard({
  order,
  updating,
  onStatusUpdate,
  onCancelOrder,
}) {
  return (
    <div className="seller-order-card">

      <div className="seller-order-header">

        <div>
          <h2>
            Order #{order.order_id}
          </h2>

          <p>
            Customer: {order.customer.name}
          </p>

          <p>
            {order.customer.email}
          </p>
        </div>

        <span
          className={`order-status status-${order.status}`}
        >
         {order.status}

        </span>

      </div>


      <div className="seller-order-items">

        {order.items.map((item) => (
          <div
            className="seller-order-item"
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


      <div className="seller-order-footer">

        <div>
          <span>Total</span>

          <strong>
            ₹{Number(
              order.total_amount
            ).toLocaleString('en-IN')}
          </strong>
        </div>

        <StatusActions
          status={order.status}
          orderId={order.order_id}
          updating={updating}
          onStatusUpdate={onStatusUpdate}
           onCancelOrder={onCancelOrder}
        />

      </div>

    </div>
  )
}


function StatusActions({
  status,
  orderId,
  updating,
  onStatusUpdate,
  onCancelOrder,
}) {
  if (status === 'payment_pending') {
    return (
      <div className="payment-pending-action">

        <div>
          <strong>
            Payment Pending
          </strong>

          <span>
            Waiting for successful customer payment.
          </span>
        </div>

        <button
          className="danger-button"
          disabled={updating}
          onClick={() =>
            onCancelOrder(orderId)
          }
        >
          {updating
            ? 'Cancelling...'
            : 'Cancel Order'}
        </button>

      </div>
    )
  }

  if (status === 'placed') {
    return (
      <button
        className="primary-button"
        disabled={updating}
        onClick={() =>
          onStatusUpdate(
            orderId,
            'confirmed'
          )
        }
      >
        {updating
          ? 'Updating...'
          : 'Confirm Order'}
      </button>
    )
  }

  if (status === 'confirmed') {
    return (
      <button
        className="primary-button"
        disabled={updating}
        onClick={() =>
          onStatusUpdate(
            orderId,
            'shipped'
          )
        }
      >
        {updating
          ? 'Updating...'
          : 'Mark as Shipped'}
      </button>
    )
  }

  if (status === 'shipped') {
    return (
      <button
        className="primary-button"
        disabled={updating}
        onClick={() =>
          onStatusUpdate(
            orderId,
            'delivered'
          )
        }
      >
        {updating
          ? 'Updating...'
          : 'Mark as Delivered'}
      </button>
    )
  }

  if (status === 'delivered') {
    return (
      <span className="order-completed">
        ✓ Order Delivered
      </span>
    )
  }

  if (status === 'cancelled') {
    return (
      <span className="order-cancelled">
        ✕ Order Cancelled
      </span>
    )
  }

  return (
    <span className="order-unknown">
      Unknown Order Status
    </span>
  )
}

export default SellerOrders