import { useEffect, useState } from 'react'
import {
  getAdminDashboardAnalytics,
  getAdminRevenueAnalytics,
} from '../services/api'

function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null)
  const [revenueAnalytics, setRevenueAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadAnalytics() {
    setLoading(true)
    setError('')

    try {
      const [dashboardData, revenueData] = await Promise.all([
        getAdminDashboardAnalytics(),
        getAdminRevenueAnalytics(),
      ])

      setAnalytics(dashboardData)
      setRevenueAnalytics(revenueData)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [])

  function formatDate(dateString) {
    const date = new Date(`${dateString}T00:00:00`)

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    })
  }

  function getMaxRevenue() {
    if (!revenueAnalytics?.daily?.length) {
      return 0
    }

    return Math.max(
      ...revenueAnalytics.daily.map((item) => item.revenue)
    )
  }

  function getChartHeight(revenue, maxRevenue) {
    if (maxRevenue === 0) {
      return 0
    }

    return (revenue / maxRevenue) * 180
  }

  if (loading) {
    return (
      <div className="admin-analytics-page">
        <h1>Platform Analytics</h1>
        <p>Loading analytics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-analytics-page">
        <h1>Platform Analytics</h1>
        <p className="error-message">{error}</p>

        <button
          className="analytics-refresh-button"
          onClick={loadAnalytics}
        >
          Try Again
        </button>
      </div>
    )
  }

  const maxRevenue = getMaxRevenue()

  return (
    <div className="admin-analytics-page">

      {/* PAGE HEADER */}

      <div className="admin-analytics-header">
        <div>
          <h1>Platform Analytics</h1>

          <p>
            Overview of ShopSphere's users, products,
            orders, and revenue.
          </p>
        </div>

        <button
          className="analytics-refresh-button"
          onClick={loadAnalytics}
        >
          Refresh Data
        </button>
      </div>


      {/* SUMMARY CARDS */}

      <div className="analytics-card-grid">

        <div className="analytics-card">
          <span className="analytics-card-label">
            Total Users
          </span>

          <strong className="analytics-card-value">
            {analytics.users.total}
          </strong>

          <span className="analytics-card-detail">
            {analytics.users.customers} customers
            {' · '}
            {analytics.users.sellers} sellers
            {' · '}
            {analytics.users.active} active
          </span>
        </div>


        <div className="analytics-card">
          <span className="analytics-card-label">
            Total Products
          </span>

          <strong className="analytics-card-value">
            {analytics.products.total}
          </strong>

          <span className="analytics-card-detail">
            Products currently in the platform
          </span>
        </div>


        <div className="analytics-card">
          <span className="analytics-card-label">
            Product Approval
          </span>

          <strong className="analytics-card-value">
            {analytics.products.approved}
          </strong>

          <span className="analytics-card-detail">
            {analytics.products.pending} pending ·{' '}
            {analytics.products.rejected} rejected
          </span>
        </div>


        <div className="analytics-card">
          <span className="analytics-card-label">
            Total Orders
          </span>

          <strong className="analytics-card-value">
            {analytics.orders.total}
          </strong>

          <span className="analytics-card-detail">
            All orders placed on the platform
          </span>
        </div>


        <div className="analytics-card analytics-revenue-card">
          <span className="analytics-card-label">
            Total Revenue
          </span>

          <strong className="analytics-card-value">
            ₹{analytics.revenue.total.toLocaleString('en-IN')}
          </strong>

          <span className="analytics-card-detail">
            Total order value
          </span>
        </div>

      </div>


      {/* REVENUE CHART */}

      <div className="analytics-section">

        <div className="analytics-section-header">
          <h2>Revenue — Last 7 Days</h2>

          <p>
            Daily order count and revenue generated on the platform.
          </p>
        </div>


        <div className="revenue-chart-card">

          <div className="revenue-chart-summary">

            <div>
              <span className="revenue-summary-label">
                7-Day Revenue
              </span>

              <strong className="revenue-summary-value">
                ₹
                {revenueAnalytics.daily
                  .reduce(
                    (total, item) => total + item.revenue,
                    0
                  )
                  .toLocaleString('en-IN')}
              </strong>
            </div>


            <div>
              <span className="revenue-summary-label">
                7-Day Orders
              </span>

              <strong className="revenue-summary-value">
                {revenueAnalytics.daily.reduce(
                  (total, item) => total + item.orders,
                  0
                )}
              </strong>
            </div>

          </div>


          {/* CHART */}

          <div className="revenue-chart">

            <div className="revenue-y-axis">
              <span>
                ₹{maxRevenue.toLocaleString('en-IN')}
              </span>

              <span>
                ₹
                {Math.round(
                  maxRevenue * 0.5
                ).toLocaleString('en-IN')}
              </span>

              <span>₹0</span>
            </div>


            <div className="revenue-chart-area">

              <div className="revenue-grid-line revenue-grid-top" />
              <div className="revenue-grid-line revenue-grid-middle" />
              <div className="revenue-grid-line revenue-grid-bottom" />


              <div className="revenue-bars">

                {revenueAnalytics.daily.map((item) => {

                  const height = getChartHeight(
                    item.revenue,
                    maxRevenue
                  )

                  return (
                    <div
                      className="revenue-bar-column"
                      key={item.date}
                    >

                      <div className="revenue-bar-value">
                        {item.revenue > 0
                          ? `₹${item.revenue.toLocaleString(
                              'en-IN'
                            )}`
                          : '₹0'}
                      </div>


                      <div className="revenue-bar-wrapper">

                        <div
                          className="revenue-bar"
                          style={{
                            height: `${height}px`,
                          }}
                          title={`${formatDate(item.date)}: ₹${item.revenue.toLocaleString(
                            'en-IN'
                          )}`}
                        />

                      </div>


                      <span className="revenue-bar-date">
                        {formatDate(item.date)}
                      </span>


                      <span className="revenue-bar-orders">
                        {item.orders}{' '}
                        {item.orders === 1
                          ? 'order'
                          : 'orders'}
                      </span>

                    </div>
                  )
                })}

              </div>

            </div>

          </div>

        </div>

      </div>


      {/* ORDER STATISTICS */}

      <div className="analytics-section">

        <div className="analytics-section-header">
          <h2>Order Statistics</h2>

          <p>
            Current distribution of orders by status.
          </p>
        </div>


        <div className="order-status-grid">

          <div className="order-status-card">
            <span>Placed</span>

            <strong>
              {analytics.orders.by_status.placed}
            </strong>

            <div className="order-status-bar">
              <div
                className="order-status-fill"
                style={{
                  width: `${
                    analytics.orders.total > 0
                      ? (
                          analytics.orders.by_status.placed /
                          analytics.orders.total
                        ) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>


          <div className="order-status-card">
            <span>Confirmed</span>

            <strong>
              {analytics.orders.by_status.confirmed}
            </strong>

            <div className="order-status-bar">
              <div
                className="order-status-fill"
                style={{
                  width: `${
                    analytics.orders.total > 0
                      ? (
                          analytics.orders.by_status.confirmed /
                          analytics.orders.total
                        ) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>


          <div className="order-status-card">
            <span>Shipped</span>

            <strong>
              {analytics.orders.by_status.shipped}
            </strong>

            <div className="order-status-bar">
              <div
                className="order-status-fill"
                style={{
                  width: `${
                    analytics.orders.total > 0
                      ? (
                          analytics.orders.by_status.shipped /
                          analytics.orders.total
                        ) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>


          <div className="order-status-card">
            <span>Delivered</span>

            <strong>
              {analytics.orders.by_status.delivered}
            </strong>

            <div className="order-status-bar">
              <div
                className="order-status-fill"
                style={{
                  width: `${
                    analytics.orders.total > 0
                      ? (
                          analytics.orders.by_status.delivered /
                          analytics.orders.total
                        ) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

        </div>

      </div>


      {/* BUSINESS SUMMARY */}

      <div className="analytics-summary">

        <div>
          <h2>Business Summary</h2>

          <p>
            ShopSphere currently has{' '}
            <strong>{analytics.users.total}</strong>{' '}
            registered users and{' '}
            <strong>{analytics.products.total}</strong>{' '}
            products.
          </p>

          <p>
            The platform has processed{' '}
            <strong>{analytics.orders.total}</strong>{' '}
            orders with total recorded revenue of{' '}
            <strong>
              ₹{analytics.revenue.total.toLocaleString('en-IN')}
            </strong>.
          </p>
        </div>

      </div>

    </div>
  )
}

export default AdminAnalytics