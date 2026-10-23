const API_BASE_URL = 'http://127.0.0.1:8000'

export async function loginUser(email, password) {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail || 'Login failed')
  }

  return data
}

export async function getCurrentUser() {
  const token = localStorage.getItem('access_token')

  const response = await fetch(`${API_BASE_URL}/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to get user information')
  }

  return data
}
export async function getProducts({
  search = '',
  categoryId = '',
  minPrice = '',
  maxPrice = '',
} = {}) {

  const params = new URLSearchParams()

  params.append('skip', '0')
  params.append('limit', '20')

  if (search.trim()) {
    params.append('search', search.trim())
  }

  if (categoryId) {
    params.append('category_id', categoryId)
  }

  if (minPrice !== '') {
    params.append('min_price', minPrice)
  }

  if (maxPrice !== '') {
    params.append('max_price', maxPrice)
  }

  const response = await fetch(
    `${API_BASE_URL}/products?${params.toString()}`
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to load products')
  }

  return data
}

export async function getCategories() {
  const response = await fetch(`${API_BASE_URL}/categories`)

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to load categories')
  }

  return data
}

export async function addToCart(productId, quantity = 1) {
  const token = localStorage.getItem('access_token')

  const response = await fetch(`${API_BASE_URL}/cart/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      product_id: productId,
      quantity: quantity,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to add product to cart')
  }

  return data
}

export async function getCart() {
  const token = localStorage.getItem('access_token')

  const response = await fetch(`${API_BASE_URL}/cart`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to load cart')
  }

  return data
}
export async function removeFromCart(productId) {
  const token = localStorage.getItem('access_token')

  const response = await fetch(
    `${API_BASE_URL}/cart/items/${productId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to remove product from cart')
  }

  return data
}
export async function updateCartItem(productId, quantity) {
  const token = localStorage.getItem('access_token')

  const response = await fetch(
    `${API_BASE_URL}/cart/items/${productId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        quantity: quantity,
      }),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to update cart quantity')
  }

  return data
}

export async function placeOrder() {
  const token = localStorage.getItem('access_token')

  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to place order')
  }

  return data
}
export async function getMyOrders() {
  const token = localStorage.getItem('access_token')

  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to load orders')
  }

  return data
}


export async function getSellerProducts() {
  const token = localStorage.getItem('access_token')

  const response = await fetch(`${API_BASE_URL}/seller/products`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to load seller products')
  }

  return data
}

export async function createProduct(productData) {
  const token = localStorage.getItem('access_token')

  const response = await fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(productData),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to create product')
  }

  return data
}

export async function updateSellerProduct(productId, productData) {
  const token = localStorage.getItem('access_token')

  const response = await fetch(
    `${API_BASE_URL}/seller/products/${productId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(productData),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to update product')
  }

  return data
}

export async function deleteSellerProduct(productId) {
  const token = localStorage.getItem('access_token')

  const response = await fetch(
    `${API_BASE_URL}/seller/products/${productId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to deactivate product')
  }

  return data
}

export async function getSellerInventory() {
  const token = localStorage.getItem('access_token')

  const response = await fetch(
    `${API_BASE_URL}/seller/inventory`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.detail || 'Failed to load inventory'
    )
  }

  return data
}

export async function updateInventory(
  productId,
  quantity,
  reorderLevel
) {
  const token = localStorage.getItem('access_token')

  const response = await fetch(
    `${API_BASE_URL}/inventory/${productId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        quantity: quantity,
        reorder_level: reorderLevel,
      }),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.detail || 'Failed to update inventory'
    )
  }

  return data
}

export async function getLowStockProducts() {
  const token = localStorage.getItem('access_token')

  const response = await fetch(
    `${API_BASE_URL}/seller/inventory/low-stock`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.detail || 'Failed to load low-stock products'
    )
  }

  return data
}

export async function getSellerOrders() {
  const token = localStorage.getItem('access_token')

  const response = await fetch(`${API_BASE_URL}/seller/orders`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.detail || 'Failed to load seller orders'
    )
  }

  return data
}

export async function updateSellerOrderStatus(
  orderId,
  status
) {
  const token = localStorage.getItem('access_token')

  const response = await fetch(
    `${API_BASE_URL}/seller/orders/${orderId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        status: status,
      }),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.detail || 'Failed to update order status'
    )
  }

  return data
 }

 export async function getAdminProducts() {
  const token = localStorage.getItem('access_token')

  const response = await fetch(
    `${API_BASE_URL}/admin/products?skip=0&limit=100`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.detail || 'Failed to load admin products'
    )
  }

  return data
}

export async function updateProductApproval(
  productId,
  approvalStatus
) {
  const token = localStorage.getItem('access_token')

  const response = await fetch(
    `${API_BASE_URL}/admin/products/${productId}/approval`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        status: approvalStatus,
      }),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.detail || 'Failed to update product approval'
    )
  }

  return data
}

export async function getAdminUsers() {
  const token = localStorage.getItem('access_token')

  const response = await fetch(
    `${API_BASE_URL}/admin/users`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to load users')
  }

  return data
}

export async function updateUserRole(userId, role) {
  const token = localStorage.getItem('access_token')

  const response = await fetch(
    `${API_BASE_URL}/admin/users/${userId}/role`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        role: role,
      }),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to update user role')
  }

  return data
}

export async function updateUserStatus(userId, isActive) {
  const token = localStorage.getItem('access_token')

  const response = await fetch(
    `${API_BASE_URL}/admin/users/${userId}/status`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        is_active: isActive,
      }),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.detail || 'Failed to update user status'
    )
  }

  return data
}

export async function getAdminDashboardAnalytics() {
  const token = localStorage.getItem('access_token')

  const response = await fetch(
    `${API_BASE_URL}/admin/dashboard`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.detail || 'Failed to load admin analytics'
    )
  }

  return data
}

export async function getAdminRevenueAnalytics() {
  const token = localStorage.getItem('access_token')

  const response = await fetch(
    `${API_BASE_URL}/admin/analytics/revenue`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.detail || 'Failed to load revenue analytics'
    )
  }

  return data
}

export async function createPayment(orderId) {
  const token = localStorage.getItem('access_token')

  const response = await fetch(
    `${API_BASE_URL}/payments/create`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        order_id: orderId,
      }),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.detail || 'Failed to create payment'
    )
  }

  return data
}


export async function verifyPayment({
  orderId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) {
  const token = localStorage.getItem('access_token')

  const response = await fetch(
    `${API_BASE_URL}/payments/verify`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        order_id: orderId,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
      }),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.detail || 'Payment verification failed'
    )
  }

  return data
}

export async function cancelPayment(orderId) {
  const token = localStorage.getItem('access_token')

  const response = await fetch(
    `${API_BASE_URL}/payments/cancel`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        order_id: orderId,
      }),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.detail || 'Failed to cancel payment'
    )
  }

  return data
}

export async function cancelMyOrder(orderId) {
  const token = localStorage.getItem('access_token')

  const response = await fetch(
    `${API_BASE_URL}/orders/${orderId}/cancel`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.detail || 'Failed to cancel order'
    )
  }

  return data
}


export async function cancelSellerOrder(orderId) {
  const token = localStorage.getItem('access_token')

  const response = await fetch(
    `${API_BASE_URL}/seller/orders/${orderId}/cancel`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data.detail || 'Failed to cancel order'
    )
  }

  return data
}