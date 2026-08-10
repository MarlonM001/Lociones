import { createContext, useEffect, useMemo, useState } from 'react'

export const CartContext = createContext(null)

const STORAGE_KEY = 'essence_cart'

function readStoredCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readStoredCart)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addItem = (product, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((item) => item.productId === product.id)
      if (existing) {
        return current.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock || 99) }
            : item,
        )
      }
      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          slug: product.slug,
          image: product.image,
          price: product.price,
          stock: product.stock,
          quantity,
        },
      ]
    })
  }

  const removeItem = (productId) => {
    setItems((current) => current.filter((item) => item.productId !== productId))
  }

  const updateQuantity = (productId, quantity) => {
    setItems((current) =>
      current.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.max(1, Math.min(quantity, item.stock || 99)) }
          : item,
      ),
    )
  }

  const clearCart = () => setItems([])

  const totals = useMemo(() => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0)
    return { totalItems, subtotal }
  }, [items])

  const value = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    ...totals,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
