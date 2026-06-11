import AsyncStorage from '@react-native-async-storage/async-storage'

const DEFAULT_URL = 'http://192.168.68.113:4000'

export async function getBaseUrl () {
  const saved = await AsyncStorage.getItem('serverUrl')
  return saved || DEFAULT_URL
}

export async function saveBaseUrl (url) {
  await AsyncStorage.setItem('serverUrl', url.trim().replace(/\/$/, ''))
}

// Helper para parsear colores degradados
function parsearColores (colores) {
  return colores.map(c => {
    const parts = (c.hex || '#888888').split('|')
    return { ...c, hex: parts[0], hex2: parts[1] || null, hex3: parts[2] || null }
  })
}

async function request (path, options = {}) {
  const base = await getBaseUrl()
  const fullUrl = `${base}${path}`
  console.log('[API] request:', fullUrl)
  try {
    const res = await fetch(fullUrl, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  } catch (err) {
    console.log('[API] error:', err.message, 'url:', fullUrl)
    throw err
  }
}

export const api = {
  ping:            ()           => request('/api/ping'),
  catalogo:        ()           => request('/api/catalogo'),
  colores:         ()           => request('/api/colores').then(parsearColores),
  fotoUrl:         (codigo)     => getBaseUrl().then(b => `${b}/api/foto/${encodeURIComponent(codigo)}`),
  pedidos:         ()           => request('/api/pedidos'),
  enviarPedido:    (pedido)     => request('/api/pedidos', { method: 'POST', body: JSON.stringify(pedido) }),
  setEstado:       (id, estado) => request(`/api/pedidos/${id}/estado`, { method: 'PUT', body: JSON.stringify({ estado }) }),
  // Ventas
  inventario:      ()           => request('/api/inventario'),
  precioVenta:     ()           => request('/api/precio-venta'),
  enviarVenta:     (venta)      => request('/api/ventas', { method: 'POST', body: JSON.stringify(venta) }),
  // Config del servidor (para datos del ticket)
  configServidor:  ()           => request('/api/config'),
}
