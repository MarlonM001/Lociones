import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { getProductPrices } from '@/services/products'

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
          regularPrice: product.regularPrice ?? product.price,
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

  /**
   * El carrito guarda el precio de cuando se agregó el producto, pero el precio (una oferta que empezó o
   * terminó) y el stock cambian. Esto los pone al día con el servidor, saca lo que ya no se vende y
   * devuelve qué pasó para avisarle al cliente. Sin conexión no toca nada.
   */
  const refreshCart = useCallback(async () => {
    const summary = { priceChanged: false, removed: [], reduced: [] }
    if (items.length === 0) return summary

    let fresh
    try {
      fresh = await getProductPrices(items.map((item) => item.productId))
    } catch {
      return summary
    }
    const byId = new Map(fresh.map((entry) => [entry.id, entry]))
    const isSellable = (latest) => latest && latest.active && latest.stock > 0

    for (const item of items) {
      const latest = byId.get(item.productId)
      if (!isSellable(latest)) summary.removed.push(item.name)
      else {
        if (latest.price !== item.price) summary.priceChanged = true
        if (latest.stock < item.quantity) summary.reduced.push(item.name)
      }
    }

    // La actualización en sí no acumula nada: React puede ejecutarla más de una vez.
    setItems((current) =>
      current.flatMap((item) => {
        const latest = byId.get(item.productId)
        if (!isSellable(latest)) return []
        return [
          {
            ...item,
            price: latest.price,
            regularPrice: latest.regularPrice,
            stock: latest.stock,
            quantity: Math.min(item.quantity, latest.stock),
          },
        ]
      }),
    )
    return summary
  }, [items])

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
    refreshCart,
    ...totals,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
