import { useEffect, useState } from 'react'
import {
  getLowStockProducts,
  getSellerInventory,
  updateInventory,
} from '../services/api'

function SellerInventory() {
  const [inventory, setInventory] = useState([])
  const [lowStock, setLowStock] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingProductId, setSavingProductId] = useState(null)

  async function loadInventory() {
    setLoading(true)
    setError('')

    try {
      const inventoryData = await getSellerInventory()
      const lowStockData = await getLowStockProducts()

      setInventory(inventoryData)
      setLowStock(lowStockData)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInventory()
  }, [])

  async function handleUpdate(
    productId,
    quantity,
    reorderLevel
  ) {
    setSavingProductId(productId)
    setError('')

    try {
      await updateInventory(
        productId,
        Number(quantity),
        Number(reorderLevel)
      )

      await loadInventory()
    } catch (error) {
      setError(error.message)
    } finally {
      setSavingProductId(null)
    }
  }

  function getStockStatus(quantity, reorderLevel) {
    if (quantity === 0) {
      return {
        text: 'Out of Stock',
        className: 'stock-out',
      }
    }

    if (quantity <= reorderLevel) {
      return {
        text: 'Low Stock',
        className: 'stock-low',
      }
    }

    return {
      text: 'In Stock',
      className: 'stock-good',
    }
  }

  if (loading) {
    return (
      <div className="seller-inventory-page">
        <h1>Inventory</h1>
        <p>Loading inventory...</p>
      </div>
    )
  }

  return (
    <div className="seller-inventory-page">

      <div className="seller-page-header">
        <div>
          <h1>Inventory</h1>
          <p>
            Monitor and update your product stock.
          </p>
        </div>
      </div>

      {error && (
        <p className="error-message">
          {error}
        </p>
      )}

      {/* Low stock alert */}

      {lowStock.length > 0 && (
        <div className="low-stock-alert">

          <div>
            <strong>
              ⚠ Low Stock Alert
            </strong>

            <p>
              {lowStock.length} product(s) need
              attention.
            </p>
          </div>

        </div>
      )}

      {/* Inventory table */}

      {inventory.length === 0 ? (
        <div className="seller-empty">
          <h2>No Inventory Found</h2>
          <p>
            Create a product first to manage its
            inventory.
          </p>
        </div>
      ) : (
        <div className="seller-products-table-wrapper">

          <table className="seller-products-table">

            <thead>
              <tr>
                <th>Product</th>
                <th>Current Stock</th>
                <th>Reorder Level</th>
                <th>Status</th>
                <th>Update</th>
              </tr>
            </thead>

            <tbody>

              {inventory.map((item) => {

                const stockStatus =
                  getStockStatus(
                    item.quantity,
                    item.reorder_level
                  )

                return (
                  <InventoryRow
                    key={item.product_id}
                    item={item}
                    stockStatus={stockStatus}
                    saving={
                      savingProductId ===
                      item.product_id
                    }
                    onUpdate={handleUpdate}
                  />
                )
              })}

            </tbody>

          </table>

        </div>
      )}

    </div>
  )
}

function InventoryRow({
  item,
  stockStatus,
  saving,
  onUpdate,
}) {
  const [quantity, setQuantity] = useState(
    item.quantity
  )

  const [reorderLevel, setReorderLevel] =
    useState(item.reorder_level)

  useEffect(() => {
    setQuantity(item.quantity)
    setReorderLevel(item.reorder_level)
  }, [item.quantity, item.reorder_level])

  return (
    <tr>

      <td>
        <strong>
          {item.product_name}
        </strong>
      </td>

      <td>
        <input
          className="inventory-input"
          type="number"
          min="0"
          value={quantity}
          onChange={(event) =>
            setQuantity(event.target.value)
          }
        />
      </td>

      <td>
        <input
          className="inventory-input"
          type="number"
          min="0"
          value={reorderLevel}
          onChange={(event) =>
            setReorderLevel(event.target.value)
          }
        />
      </td>

      <td>
        <span
          className={`stock-status ${stockStatus.className}`}
        >
          {stockStatus.text}
        </span>
      </td>

      <td>
        <button
          className="primary-button inventory-update-button"
          disabled={saving}
          onClick={() =>
            onUpdate(
              item.product_id,
              quantity,
              reorderLevel
            )
          }
        >
          {saving ? 'Saving...' : 'Update'}
        </button>
      </td>

    </tr>
  )
}

export default SellerInventory