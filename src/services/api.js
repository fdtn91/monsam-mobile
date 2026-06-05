import AsyncStorage from '@react-native-async-storage/async-storage'

const DEFAULT_URL = 'http://192.168.68.113:4000'

export async function getBaseUrl () {
  const saved = await AsyncStorage.getItem('serverUrl')
  return saved || DEFAULT_URL
}

export async function saveBaseUrl (url) {
  await AsyncStorage.setItem('serverUrl', url.trim().replace(/\/$/, ''))
}

async function request (path, options = {}) {
  const base = await getBaseUrl()
  const res  = await fetch(`${base}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export const api = {
  ping:         ()           => request('/api/ping'),
  catalogo:     ()           => request('/api/catalogo'),
  colores:      ()           => request('/api/colores'),
  fotoUrl:      (codigo)     => getBaseUrl().then(b => `${b}/api/foto/${encodeURIComponent(codigo)}`),
  pedidos:      ()           => request('/api/pedidos'),
  enviarPedido: (pedido)     => request('/api/pedidos', { method: 'POST', body: JSON.stringify(pedido) }),
  setEstado:    (id, estado) => request(`/api/pedidos/${id}/estado`, { method: 'PUT', body: JSON.stringify({ estado }) }),
}
