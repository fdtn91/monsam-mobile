import React, { useState, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { api } from '../services/api'

const ESTADO_COLOR = { pendiente_envio:'#9A6700', pendiente:'#CF222E', visto:'#0969DA', en_proceso:'#9A6700', listo:'#1A7F37', entregado:'#8C959F' }
const ESTADO_LABEL = { pendiente_envio:'⏳ Pendiente envío', pendiente:'🔴 Pendiente', visto:'👁 Visto', en_proceso:'⚙️ En proceso', listo:'✅ Listo', entregado:'📦 Entregado' }

export default function HistorialScreen () {
  const [offline, setOffline]   = useState([])
  const [online, setOnline]     = useState([])
  const [loading, setLoading]   = useState(false)
  const [sincronizando, setSinc] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    const raw = await AsyncStorage.getItem('pedidos_offline')
    setOffline(raw ? JSON.parse(raw) : [])
    try { setOnline(await api.pedidos()) } catch { setOnline([]) }
    setLoading(false)
  }, [])

  useFocusEffect(useCallback(() => { cargar() }, [cargar]))

  const sincronizarOffline = async () => {
    const raw = await AsyncStorage.getItem('pedidos_offline')
    const pending = raw ? JSON.parse(raw) : []
    if (!pending.length) { Alert.alert('Sin pendientes'); return }
    setSinc(true)
    let ok = 0, fail = 0
    const restantes = []
    for (const p of pending) {
      try { const r = await api.enviarPedido(p); if (r.ok) ok++; else { fail++; restantes.push(p) } }
      catch { fail++; restantes.push(p) }
    }
    await AsyncStorage.setItem('pedidos_offline', JSON.stringify(restantes))
    setSinc(false)
    Alert.alert('Sincronización', `✅ ${ok} enviados${fail>0?`\n❌ ${fail} fallidos`:''}`)
    cargar()
  }

  const todos = [...offline.map(p => ({ ...p, _isOffline: true })), ...online.map(p => ({ ...p, _isOffline: false }))]

  return (
    <View style={{ flex:1, backgroundColor:'#F0F2F5' }}>
      {offline.length > 0 && <TouchableOpacity style={{ backgroundColor:'#9A6700', padding:14, alignItems:'center' }} onPress={sincronizarOffline} disabled={sincronizando}>
        {sincronizando ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color:'#fff', fontWeight:'700', fontSize:13 }}>📤 Sincronizar {offline.length} pedido{offline.length!==1?'s':''} offline</Text>}
      </TouchableOpacity>}
      <FlatList data={todos} keyExtractor={(item,i) => item._isOffline?`off-${item._localId}`:`on-${item.id}`}
        contentContainerStyle={{ padding:16, paddingBottom:40 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={cargar} colors={['#155124']} />}
        ListEmptyComponent={<View style={{ alignItems:'center', marginTop:60, gap:12 }}><Text style={{ fontSize:40 }}>📋</Text><Text style={{ color:'#8C959F', fontSize:14 }}>Sin pedidos</Text></View>}
        renderItem={({ item }) => {
          const estado = item._isOffline ? item._estado : item.estado
          const fecha = new Date(item.fecha_pedido).toLocaleString('es-MX', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })
          return (
            <View style={[s.card, item._isOffline && s.cardOffline]}>
              <View style={{ flexDirection:'row', alignItems:'flex-start', marginBottom:10 }}>
                <View style={{ flex:1 }}>
                  <Text style={s.cliente}>👤 {item.cliente||'Sin nombre'}</Text>
                  <Text style={{ fontSize:10, color:'#8C959F', fontFamily:'monospace', marginTop:2 }}>{fecha}</Text>
                </View>
                <View style={[s.estadoChip, { backgroundColor:`${ESTADO_COLOR[estado]}18` }]}>
                  <Text style={[s.estadoTxt, { color:ESTADO_COLOR[estado] }]}>{ESTADO_LABEL[estado]||estado}</Text>
                </View>
              </View>
              {(item.items||[]).map((it,i) => <Text key={i} style={{ fontSize:12, color:'#57606A' }}><Text style={{ color:'#155124', fontWeight:'700' }}>{it.codigo}</Text>{' · '}{it.color}{' · '}<Text style={{ fontWeight:'700' }}>{it.pares}p</Text></Text>)}
              {item.notas ? <Text style={{ fontSize:11, color:'#8C959F', fontStyle:'italic', marginTop:4 }}>💬 {item.notas}</Text> : null}
            </View>
          )
        }}
      />
    </View>
  )
}

const s = StyleSheet.create({
  card: { backgroundColor:'#fff', borderRadius:10, borderWidth:1, borderColor:'#D0D7DE', padding:14, marginBottom:10 },
  cardOffline: { borderLeftWidth:3, borderLeftColor:'#9A6700' },
  cliente: { fontSize:14, fontWeight:'700', color:'#1F2328' },
  estadoChip: { paddingHorizontal:10, paddingVertical:4, borderRadius:20 },
  estadoTxt: { fontSize:10, fontWeight:'700' },
})
