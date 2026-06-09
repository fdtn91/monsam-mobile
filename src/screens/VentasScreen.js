import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Modal
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { api } from '../services/api'

const C = {
  accent: '#155124', accent2: '#1E7A37',
  bg: '#F0F2F5', card: '#FFFFFF', border: '#D0D7DE',
  text: '#1F2328', text2: '#57606A', muted: '#8C959F',
  ok: '#1A7F37', error: '#CF222E', warn: '#9A6700'
}

export default function VentasScreen () {
  const [inventario,   setInventario]   = useState([])
  const [cfgServidor,  setCfgServidor]  = useState({})
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [buscar,       setBuscar]       = useState('')
  const [ticketItems,  setTicketItems]  = useState([])
  const [descuentoPct, setDescuentoPct] = useState('0')
  const [cliente,      setCliente]      = useState('')
  const [enviando,     setEnviando]     = useState(false)
  const [showTicket,   setShowTicket]   = useState(false)

  const cargar = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)
      const [inv, cfg] = await Promise.all([api.inventario(), api.configServidor()])
      setInventario(inv)
      setCfgServidor(cfg)
    } catch (e) {
      setError('No se pudo conectar con la PC.\nVerifica la IP en Configuración.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  // ── Cálculos del ticket ──────────────────────────────────
  const subtotal  = ticketItems.reduce((s, i) => s + (i.precio_par || 0) * i.pares, 0)
  const descPct   = parseFloat(descuentoPct) || 0
  const descuento = subtotal * (descPct / 100)
  const base      = subtotal - descuento
  const tieneRFC  = !!(cfgServidor.rfc && cfgServidor.rfc.trim())
  const iva       = tieneRFC ? base * 0.16 : 0
  const total     = base + iva

  // ── Agregar al ticket ─────────────────────────────────────
  const agregarItem = (item) => {
    setBuscar('')
    setTicketItems(prev => {
      const existente = prev.find(i => i.sku === item.sku)
      if (existente) {
        if (existente.pares >= item.pares) {
          Alert.alert('Stock máximo', `Solo hay ${item.pares} pares disponibles`)
          return prev
        }
        return prev.map(i => i.sku === item.sku ? { ...i, pares: i.pares + 1 } : i)
      }
      return [...prev, {
        sku:       item.sku,
        modelo:    item.modelo,
        color:     item.color,
        pares:     1,
        precio_par: cfgServidor.precioVentaPar || 0,
        disponibles: item.pares
      }]
    })
  }

  const cambiarPares = (sku, delta) => {
    setTicketItems(prev =>
      prev.map(i => {
        if (i.sku !== sku) return i
        const nuevo = i.pares + delta
        if (nuevo <= 0) return null
        if (nuevo > i.disponibles) {
          Alert.alert('Stock máximo', `Solo hay ${i.disponibles} pares`)
          return i
        }
        return { ...i, pares: nuevo }
      }).filter(Boolean)
    )
  }

  const cambiarPrecio = (sku, val) => {
    setTicketItems(prev =>
      prev.map(i => i.sku === sku ? { ...i, precio_par: parseFloat(val) || 0 } : i)
    )
  }

  const quitarItem = (sku) => setTicketItems(prev => prev.filter(i => i.sku !== sku))

  const limpiarTicket = () => {
    setTicketItems([])
    setCliente('')
    setDescuentoPct('0')
  }

  // ── Enviar venta ──────────────────────────────────────────
  const enviarVenta = async () => {
    if (!ticketItems.length) return
    setEnviando(true)
    const venta = {
      cliente,
      items: ticketItems.map(i => ({
        sku:       i.sku,
        modelo:    i.modelo,
        color:     i.color,
        pares:     i.pares,
        precio_par: i.precio_par,
        subtotal:  i.precio_par * i.pares
      })),
      descuento_pct:   descPct,
      descuento_monto: descuento,
      iva,
      total,
      origen: 'mobile'
    }
    try {
      const res = await api.enviarVenta(venta)
      if (res.ok) {
        limpiarTicket()
        setShowTicket(false)
        Alert.alert('✅ Venta registrada', `Total: $${total.toFixed(2)}\nEl inventario fue actualizado.`)
        cargar() // recargar inventario
      } else throw new Error(res.error || 'Error al guardar')
    } catch (e) {
      // Guardar offline
      const raw     = await AsyncStorage.getItem('ventas_offline') || '[]'
      const offline = JSON.parse(raw)
      offline.push({ ...venta, _localId: Date.now(), fecha: new Date().toISOString() })
      await AsyncStorage.setItem('ventas_offline', JSON.stringify(offline))
      limpiarTicket()
      setShowTicket(false)
      Alert.alert('⚠️ Sin conexión', 'Venta guardada localmente.\nSe sincronizará cuando haya conexión.')
    } finally {
      setEnviando(false)
    }
  }

  // ── Filtrar inventario ────────────────────────────────────
  const filtrado = inventario.filter(i =>
    i.pares > 0 && (
      i.sku.toLowerCase().includes(buscar.toLowerCase()) ||
      i.modelo.toLowerCase().includes(buscar.toLowerCase()) ||
      i.color.toLowerCase().includes(buscar.toLowerCase())
    )
  )

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator size="large" color={C.accent} />
      <Text style={{ color: C.muted, marginTop: 12 }}>Cargando inventario...</Text>
    </View>
  )

  if (error) return (
    <View style={s.center}>
      <Text style={{ fontSize: 40 }}>⚠️</Text>
      <Text style={{ color: C.text2, textAlign: 'center', marginTop: 12 }}>{error}</Text>
      <TouchableOpacity style={s.retryBtn} onPress={cargar}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.root}>

        {/* Buscador */}
        <View style={s.searchBar}>
          <Text>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Buscar SKU, modelo o color..."
            placeholderTextColor={C.muted}
            value={buscar}
            onChangeText={setBuscar}
          />
          {buscar.length > 0 &&
            <TouchableOpacity onPress={() => setBuscar('')}>
              <Text style={{ color: C.muted, fontSize: 18, paddingHorizontal: 8 }}>✕</Text>
            </TouchableOpacity>
          }
        </View>

        {/* Lista de inventario */}
        <FlatList
          data={buscar ? filtrado : inventario.filter(i => i.pares > 0)}
          keyExtractor={i => i.sku}
          contentContainerStyle={{ padding: 12, paddingBottom: ticketItems.length > 0 ? 100 : 20 }}
          ListEmptyComponent={
            <View style={s.center}>
              <Text style={{ color: C.muted, marginTop: 30 }}>Sin resultados</Text>
            </View>
          }
          renderItem={({ item }) => {
            const enTicket = ticketItems.find(t => t.sku === item.sku)
            return (
              <TouchableOpacity
                style={[s.invCard, enTicket && s.invCardActivo]}
                onPress={() => agregarItem(item)}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[s.invSku, enTicket && { color: C.accent2 }]}>{item.sku}</Text>
                  <Text style={s.invSub}>{item.modelo} · {item.color}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[s.invPares, { color: item.pares > 5 ? C.ok : C.warn }]}>
                    {item.pares}p
                  </Text>
                  {enTicket &&
                    <Text style={{ fontSize: 10, color: C.accent, fontWeight: '700' }}>
                      ✓ {enTicket.pares} en ticket
                    </Text>
                  }
                </View>
              </TouchableOpacity>
            )
          }}
        />

        {/* Botón flotante — ver ticket */}
        {ticketItems.length > 0 &&
          <TouchableOpacity style={s.fab} onPress={() => setShowTicket(true)}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>
              🧾  {ticketItems.length} item{ticketItems.length !== 1 ? 's' : ''} · ${total.toFixed(2)}
            </Text>
          </TouchableOpacity>
        }

        {/* Modal del ticket */}
        <Modal visible={showTicket} animationType="slide" presentationStyle="pageSheet">
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={{ flex: 1, backgroundColor: C.bg }}>
              {/* Header */}
              <View style={s.ticketHeader}>
                <Text style={{ fontSize: 17, fontWeight: '800', color: C.text }}>Ticket de venta</Text>
                <TouchableOpacity onPress={() => setShowTicket(false)}>
                  <Text style={{ color: C.accent, fontWeight: '700', fontSize: 14 }}>Cerrar</Text>
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                {/* Items */}
                {ticketItems.map((item, idx) => (
                  <View key={item.sku} style={s.ticketItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'monospace', fontWeight: '700', color: C.accent, fontSize: 12 }}>
                        {item.sku}
                      </Text>
                      <Text style={{ fontSize: 10, color: C.text2 }}>{item.modelo} · {item.color}</Text>
                    </View>
                    {/* Pares */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <TouchableOpacity style={s.qtBtn} onPress={() => cambiarPares(item.sku, -1)}>
                        <Text style={s.qtTxt}>−</Text>
                      </TouchableOpacity>
                      <Text style={{ fontWeight: '800', minWidth: 20, textAlign: 'center' }}>{item.pares}</Text>
                      <TouchableOpacity style={s.qtBtn} onPress={() => cambiarPares(item.sku, 1)}>
                        <Text style={s.qtTxt}>+</Text>
                      </TouchableOpacity>
                    </View>
                    {/* Precio */}
                    <View style={{ alignItems: 'flex-end', minWidth: 70 }}>
                      <TextInput
                        value={String(item.precio_par)}
                        onChangeText={v => cambiarPrecio(item.sku, v)}
                        keyboardType="numeric"
                        style={s.precioInput}
                      />
                      <Text style={{ fontSize: 9, color: C.muted }}>
                        ${((item.precio_par || 0) * item.pares).toFixed(2)}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => quitarItem(item.sku)} style={{ paddingLeft: 6 }}>
                      <Text style={{ color: C.error, fontSize: 16 }}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Cliente */}
                <View style={s.fieldWrap}>
                  <Text style={s.fieldLabel}>Cliente (opcional)</Text>
                  <TextInput
                    style={s.fieldInput}
                    value={cliente}
                    onChangeText={setCliente}
                    placeholder="Nombre del cliente..."
                    placeholderTextColor={C.muted}
                  />
                </View>

                {/* Descuento */}
                <View style={s.fieldWrap}>
                  <Text style={s.fieldLabel}>Descuento (%)</Text>
                  <TextInput
                    style={[s.fieldInput, { width: 80 }]}
                    value={descuentoPct}
                    onChangeText={setDescuentoPct}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={C.muted}
                  />
                </View>

                {/* Totales */}
                <View style={s.totalesCard}>
                  <View style={s.totalesRow}>
                    <Text style={s.totalesLabel}>Subtotal</Text>
                    <Text style={s.totalesVal}>${subtotal.toFixed(2)}</Text>
                  </View>
                  {descPct > 0 &&
                    <View style={s.totalesRow}>
                      <Text style={s.totalesLabel}>Descuento ({descPct}%)</Text>
                      <Text style={[s.totalesVal, { color: C.error }]}>-${descuento.toFixed(2)}</Text>
                    </View>
                  }
                  {tieneRFC &&
                    <View style={s.totalesRow}>
                      <Text style={s.totalesLabel}>IVA (16%)</Text>
                      <Text style={[s.totalesVal, { color: C.warn }]}>${iva.toFixed(2)}</Text>
                    </View>
                  }
                  <View style={[s.totalesRow, { marginTop: 8, paddingTop: 8, borderTopWidth: 2, borderColor: C.border }]}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: C.text }}>TOTAL</Text>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: C.accent }}>${total.toFixed(2)}</Text>
                  </View>
                </View>

                {/* Datos empresa */}
                {(cfgServidor.marca || cfgServidor.rfc) &&
                  <View style={[s.totalesCard, { marginTop: 8 }]}>
                    <Text style={{ fontSize: 10, color: C.muted, fontWeight: '700', marginBottom: 4 }}>DATOS DE FACTURACIÓN</Text>
                    {cfgServidor.marca       && <Text style={s.cfgDato}>{cfgServidor.marca}</Text>}
                    {cfgServidor.razonSocial && <Text style={s.cfgDato}>{cfgServidor.razonSocial}</Text>}
                    {cfgServidor.rfc         && <Text style={s.cfgDato}>RFC: {cfgServidor.rfc}</Text>}
                    {cfgServidor.direccion   && <Text style={s.cfgDato}>{cfgServidor.direccion}</Text>}
                    {cfgServidor.telefono    && <Text style={s.cfgDato}>Tel: {cfgServidor.telefono}</Text>}
                  </View>
                }

                {/* Botones */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                  <TouchableOpacity style={[s.btnSecondary, { flex: 1 }]} onPress={limpiarTicket}>
                    <Text style={{ color: C.text2, fontWeight: '700', textAlign: 'center' }}>Limpiar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.btnPrimary, { flex: 2 }, enviando && { opacity: 0.7 }]}
                    onPress={enviarVenta}
                    disabled={enviando}
                  >
                    {enviando
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={{ color: '#fff', fontWeight: '800', textAlign: 'center' }}>
                          ✅ Registrar venta
                        </Text>
                    }
                  </TouchableOpacity>
                </View>

              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.bg },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  retryBtn:     { marginTop: 20, backgroundColor: C.accent, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  searchBar:    { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, margin: 12, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12 },
  searchInput:  { flex: 1, height: 44, fontSize: 13, color: C.text },

  invCard:      { backgroundColor: C.card, borderRadius: 8, borderWidth: 1, borderColor: C.border, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
  invCardActivo:{ borderColor: C.accent, backgroundColor: 'rgba(21,81,36,.04)' },
  invSku:       { fontFamily: 'monospace', fontWeight: '700', fontSize: 12, color: C.text },
  invSub:       { fontSize: 10, color: C.text2, marginTop: 2 },
  invPares:     { fontFamily: 'monospace', fontWeight: '700', fontSize: 14 },

  fab:          { position: 'absolute', bottom: 24, right: 16, left: 16, backgroundColor: C.accent, borderRadius: 14, paddingVertical: 14, alignItems: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: .2, shadowRadius: 6 },

  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderColor: C.border, backgroundColor: C.card },
  ticketItem:   { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 8, borderWidth: 1, borderColor: C.border, padding: 10, marginBottom: 8, gap: 8 },
  qtBtn:        { width: 28, height: 28, borderRadius: 14, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  qtTxt:        { fontSize: 18, fontWeight: '700', color: C.text, lineHeight: 22 },
  precioInput:  { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 4, padding: 4, fontSize: 12, fontFamily: 'monospace', color: C.text, textAlign: 'right', width: 64 },

  fieldWrap:    { marginBottom: 10 },
  fieldLabel:   { fontSize: 10, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  fieldInput:   { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 10, fontSize: 13, color: C.text },

  totalesCard:  { backgroundColor: C.card, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 14, marginTop: 12 },
  totalesRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalesLabel: { fontSize: 13, color: C.text2 },
  totalesVal:   { fontFamily: 'monospace', fontSize: 13, color: C.text },
  cfgDato:      { fontSize: 11, color: C.text2, paddingVertical: 1 },

  btnPrimary:   { backgroundColor: C.accent, borderRadius: 10, paddingVertical: 14 },
  btnSecondary: { backgroundColor: C.card, borderRadius: 10, paddingVertical: 14, borderWidth: 1, borderColor: C.border },
})
