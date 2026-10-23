import { useEffect, useState } from 'react'

import { Link, useNavigate, useSearchParams, } from 'react-router-dom'
import {
  getCart,
  getMyOrders,
  placeOrder,
  createPayment,
  verifyPayment,
  cancelPayment,
} from '../services/api'

function Checkout() {
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [error, setError] = useState('')
  const [pendingOrder, setPendingOrder] = useState(null)

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const retryOrderId = searchParams.get('retry')

  async function loadCart() {
  setLoading(true)
  setError('')

  try {
    // Existing unpaid order retry
    if (retryOrderId) {
      const data = await getMyOrders()

      const existingOrder = data.orders.find(
        (order) =>
          order.order_id === Number(retryOrderId)
      )

      if (!existingOrder) {
        throw new Error(
          'Order not found'
        )
      }

      if (
        existingOrder.status !==
        'payment_pending'
      ) {
        throw new Error(
          'This order is no longer waiting for payment.'
        )
      }

      setCart({
        items: existingOrder.items.map(
          (item) => ({
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            price: item.price_at_purchase,
            subtotal: item.subtotal,
          })
        ),
        total: existingOrder.total_amount,
      })

      setPendingOrder({
        orderId: existingOrder.order_id,
        totalAmount: existingOrder.total_amount,
      })

      return
    }

    // Normal checkout flow
    const data = await getCart()
    setCart(data)

  } catch (error) {
    setError(error.message)
  } finally {
    setLoading(false)
  }
}



async function loadRetryOrder(orderId) {
  setLoading(true)
  setError('')

  try {
    const data = await getMyOrders()

    const existingOrder = data.orders.find(
      (order) =>
        order.order_id === Number(orderId)
    )

    if (!existingOrder) {
      throw new Error(
        'Order not found'
      )
    }

    if (
      existingOrder.status !==
      'payment_pending'
    ) {
      throw new Error(
        'This order cannot be paid again'
      )
    }

    setPendingOrder({
      orderId: existingOrder.order_id,
      totalAmount: existingOrder.total_amount,
    })
  } catch (error) {
    setError(error.message)
  } finally {
    setLoading(false)
  }
}

  useEffect(() => {
  if (retryOrderId) {
    loadRetryOrder(retryOrderId)
  } else {
    loadCart()
  }
}, [retryOrderId])

  async function handlePlaceOrder() {
  setPlacingOrder(true)
  setError('')

  try {
    let orderId
    let totalAmount

    // Create a new ShopSphere order only if
    // there is no existing unpaid order.
    if (!pendingOrder) {
      const orderData = await placeOrder()

      orderId = orderData.order.id
      totalAmount = orderData.order.total_amount

      setPendingOrder({
        orderId,
        totalAmount,
      })
    } else {
      // Retry payment for the existing order.
      orderId = pendingOrder.orderId
      totalAmount = pendingOrder.totalAmount
    }

    // Create or retrieve the Razorpay payment order.
    const paymentData = await createPayment(orderId)

    if (!window.Razorpay) {
      throw new Error(
        'Razorpay Checkout failed to load. Please refresh the page and try again.'
      )
    }

    const options = {
      key: paymentData.razorpay.key_id,

      amount: paymentData.razorpay.amount,

      currency: paymentData.razorpay.currency,

      name: 'ShopSphere',

      description: `Payment for Order #${orderId}`,

      order_id: paymentData.razorpay.order_id,

      handler: async function (response) {
        try {
          setError('')

          const verificationData = await verifyPayment({
            orderId,
            razorpayOrderId:
              response.razorpay_order_id,
            razorpayPaymentId:
              response.razorpay_payment_id,
            razorpaySignature:
              response.razorpay_signature,
          })

          navigate('/order-success', {
            state: {
              orderId:
                verificationData.order.id,

              totalAmount:
                verificationData.order.total_amount,

              paymentStatus:
                verificationData.payment.status,
            },
          })
        } catch (error) {
          setError(
            error.message ||
              'Payment verification failed.'
          )

          setPlacingOrder(false)
        }
      },

      prefill: {
        name: '',
        email: '',
      },

      theme: {
        color: '#2563eb',
      },

      modal: {
        ondismiss: async function () {
          try {
            await cancelPayment(orderId)

            setError(
              'Payment was cancelled. You can retry the payment for this order.'
            )
          } catch (error) {
            setError(error.message)
          } finally {
            setPlacingOrder(false)
          }
        },
      },
    }

    const razorpay = new window.Razorpay(options)

    razorpay.on(
      'payment.failed',
      async function (response) {
        console.error(
          'Razorpay payment failed:',
          response.error
        )

        setError(
          response.error?.description ||
            'Payment failed. You can retry the payment.'
        )

        setPlacingOrder(false)
      }
    )

    razorpay.open()

  } catch (error) {
    setError(error.message)
    setPlacingOrder(false)
  }
}

  if (loading) {
    return (
      <div className="checkout-page">
        <h1>Checkout</h1>
        <p>Loading order summary...</p>
      </div>
    )
  }

  if (error && !cart) {
    return (
      <div className="checkout-page">
        <h1>Checkout</h1>

        <p className="error-message">
          {error}
        </p>

        <Link
          to="/cart"
          className="primary-button"
        >
          Back to Cart
        </Link>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="checkout-page">
        <h1>Checkout</h1>

        <div className="cart-empty">
          <h2>Your cart is empty</h2>

          <p>
            Add products before proceeding to checkout.
          </p>

          <Link
            to="/products"
            className="primary-button"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout-page">

      <div className="checkout-header">
        <h1>Checkout</h1>

        <p>
          Review your order before placing it.
        </p>
      </div>

      {error && (
        <p className="error-message">
          {error}
        </p>
      )}

      <div className="checkout-layout">

        <div className="checkout-items">

          <h2>Order Items</h2>

          {cart.items.map((item) => (
            <div
              className="checkout-item"
              key={item.product_id}
            >
              <div>
                <h3>{item.product_name}</h3>

                <p>
                  ₹
                  {item.price.toLocaleString(
                    'en-IN'
                  )}

                  {' × '}

                  {item.quantity}
                </p>
              </div>

              <strong>
                ₹
                {item.subtotal.toLocaleString(
                  'en-IN'
                )}
              </strong>
            </div>
          ))}

        </div>

        <div className="checkout-summary">

          <h2>Order Summary</h2>

          <div className="checkout-summary-row">
            <span>Items</span>

            <span>
              {cart.items.length}
            </span>
          </div>

          <div className="checkout-summary-row checkout-total">
            <span>Total</span>

            <span>
              ₹
              {cart.total.toLocaleString(
                'en-IN'
              )}
            </span>
          </div>

          <button
            className="primary-button checkout-place-button"
            onClick={handlePlaceOrder}
            disabled={placingOrder}
          >
            {placingOrder
              ? 'Opening Payment...'
               : pendingOrder
               ? 'Retry Payment'
               : 'Pay Now'}
          </button>

          <Link
            to="/cart"
            className="secondary-button checkout-back-button"
          >
            Back to Cart
          </Link>

        </div>

      </div>

    </div>
  )
}

export default Checkout
