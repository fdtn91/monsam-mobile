import React, { useState } from 'react'
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { api } from '../services/api'
import ColorSwatch from '../components/ColorSwatch'

const C = { accent:'#155124', bg:'#F0F2F5', card:'#FFFFFF', border:'#D0D7DE', text:'#1F2328', text2:'#57606A', muted:'#8C959F', error:'#CF222E' }

export default function PedidoScreen ({ carrito }) {
  const nav = useNavigation()
  const [cliente, setCliente]   = useState('')
  const [notas, setNotas]       = useState('')
  const [enviando, setEnviando] = useState(false)

  const guardarOffline = async (pedido) => {
    const raw     = await AsyncStorage.getItem('pedidos_offline')
    const offline = raw ? JSON.parse(raw) : []
    offline.push({ ...pedido, _localId: Date.now(), _estado: 'pendiente_envio' })
    await AsyncStorage.setItem('pedidos_offline', JSON.stringify(offline))
  }

  const enviar = async () => {
    if (!carrito.items.length) return
    setEnviando(true)
    const pedido = { cliente: cliente.trim(), notas: notas.trim(), items: carrito.items, fecha_pedido: new Date().toISOString() }
    try {
      const res = await api.enviarPedido(pedido)
      if (res.ok) {
        carrito.limpiar()
        Alert.alert('✅ Pedido enviado', `ID #${res.id}`, [{ text:'OK', onPress: () => nav.navigate('Catálogo') }])
      } else throw new Error(res.error)
    } catch {
      await guardarOffline(pedido)
      Alert.alert('⚠️ Sin conexión', 'Pedido guardado localmente.\nEnvíalo desde Historial.', [{ text:'OK', onPress: () => { carrito.limpiar(); nav.navigate('Historial') } }])
    } finally { setEnviando(false) }
  }

  if (!carrito.items.length) return (
    <View style={{ flex:1, alignItems:'center', justifyContent:'center', gap:12, backgroundColor:C.bg }}>
      <Text style={{ fontSize:48 }}>🛒</Text>
      <Text style={{ color:C.muted, fontSize:16 }}>El pedido está vacío</Text>
      <TouchableOpacity style={{ backgroundColor:C.card, borderWidth:1, borderColor:C.border, borderRadius:8, paddingHorizontal:24, paddingVertical:10 }} onPress={() => nav.navigate('Catálogo')}>
        <Text style={{ color:C.accent, fontWeight:'700' }}>← Ir al catálogo</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS==='ios'?'padding':undefined}>
      <View style={{ flex:1, backgroundColor:C.bg }}>
        <FlatList data={carrito.items} keyExtractor={i => i.key} contentContainerStyle={{ padding:16, paddingBottom:0 }}
          ListHeaderComponent={<Text style={{ fontSize:13, fontWeight:'700', color:C.text2, marginBottom:12, textTransform:'uppercase', letterSpacing:0.5 }}>{carrito.items.reduce((s,i)=>s+i.pares,0)} pares en el pedido</Text>}
          renderItem={({ item }) => (
            <View style={s.itemCard}>
              <ColorSwatch hex={item.color_hex} hex2={item.color_hex2} hex3={item.color_hex3} size={20} style={{ borderWidth:1, borderColor:'#D0D7DE' }} />
              <View style={{ flex:1 }}>
                <Text style={s.itemCode}>{item.codigo}</Text>
                <Text style={s.itemColor} numberOfLines={1}>{item.color}</Text>
              </View>
              <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}>
                <TouchableOpacity style={s.qtBtn} onPress={() => carrito.cambiarPares(item.key,-1)}><Text style={s.qtTxt}>−</Text></TouchableOpacity>
                <Text style={{ fontSize:16, fontWeight:'800', minWidth:24, textAlign:'center' }}>{item.pares}</Text>
                <TouchableOpacity style={s.qtBtn} onPress={() => carrito.cambiarPares(item.key,1)}><Text style={s.qtTxt}>+</Text></TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => carrito.quitar(item.key)}><Text style={{ color:C.error, fontSize:16 }}>🗑</Text></TouchableOpacity>
            </View>
          )}
          ListFooterComponent={
            <View style={{ paddingTop:8 }}>
              <Text style={s.label}>Cliente (opcional)</Text>
              <TextInput style={s.input} placeholder="Nombre..." placeholderTextColor={C.muted} value={cliente} onChangeText={setCliente} />
              <Text style={[s.label, { marginTop:12 }]}>Notas (opcional)</Text>
              <TextInput style={[s.input, { height:80, textAlignVertical:'top' }]} placeholder="Observaciones..." placeholderTextColor={C.muted} value={notas} onChangeText={setNotas} multiline />
            </View>
          }
        />
        <View style={{ padding:16, backgroundColor:C.card, borderTopWidth:1, borderColor:C.border }}>
          <TouchableOpacity style={[s.enviarBtn, enviando && { opacity:0.7 }]} onPress={enviar} disabled={enviando}>
            {enviando ? <ActivityIndicator color="#fff" /> : <Text style={{ color:'#fff', fontWeight:'800', fontSize:15 }}>📤  Enviar pedido a PC</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  itemCard: { flexDirection:'row', alignItems:'center', backgroundColor:'#fff', borderRadius:10, borderWidth:1, borderColor:'#D0D7DE', padding:12, marginBottom:8, gap:10 },
  swatch: { width:20, height:20, borderRadius:10, borderWidth:1, borderColor:'#D0D7DE' },
  itemCode: { fontFamily:'monospace', fontWeight:'700', fontSize:13, color:'#155124' },
  itemColor: { fontSize:11, color:'#57606A', marginTop:2 },
  qtBtn: { width:30, height:30, borderRadius:15, backgroundColor:'#F0F2F5', borderWidth:1, borderColor:'#D0D7DE', alignItems:'center', justifyContent:'center' },
  qtTxt: { fontSize:18, fontWeight:'700', color:'#1F2328', lineHeight:22 },
  label: { fontSize:11, fontWeight:'700', color:'#8C959F', textTransform:'uppercase', letterSpacing:0.8, marginBottom:6 },
  input: { backgroundColor:'#fff', borderWidth:1, borderColor:'#D0D7DE', borderRadius:8, padding:12, fontSize:14, color:'#1F2328' },
  enviarBtn: { backgroundColor:'#155124', borderRadius:12, paddingVertical:16, alignItems:'center' },
})
