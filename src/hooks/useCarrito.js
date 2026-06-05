import { useState, useCallback } from 'react'

export function useCarrito () {
  const [items, setItems] = useState([])

  const agregar = useCallback((modelo, color) => {
    setItems(prev => {
      const key = `${modelo.codigo}-${color.id}`
      const idx = prev.findIndex(i => i.key === key)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], pares: next[idx].pares + 1 }
        return next
      }
      return [...prev, { key, codigo: modelo.codigo, carpeta: modelo.carpeta, color: color.nombre, color_hex: color.hex, pares: 1 }]
    })
  }, [])

  const cambiarPares = useCallback((key, delta) => {
    setItems(prev => prev.map(i => i.key === key ? { ...i, pares: Math.max(1, i.pares + delta) } : i).filter(i => i.pares > 0))
  }, [])

  const quitar  = useCallback((key) => setItems(prev => prev.filter(i => i.key !== key)), [])
  const limpiar = useCallback(() => setItems([]), [])
  const total   = items.reduce((s, i) => s + i.pares, 0)

  return { items, agregar, cambiarPares, quitar, limpiar, total }
}
