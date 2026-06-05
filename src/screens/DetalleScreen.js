import React, { useState, useEffect } from 'react'
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { api } from '../services/api'

const C = { accent:'#155124', bg:'#F0F2F5', card:'#FFFFFF', border:'#D0D7DE', text:'#1F2328', text2:'#57606A', muted:'#8C959F', ok:'#1A7F37' }

export default function DetalleScreen ({ carrito }) {
  const nav = useNavigation()
  const { modelo, fotoUrl } = useRoute().params
  const [colores, setColores]   = useState([])
  const [colorSel, setColorSel] = useState(null)
  const [pares, setPares]       = useState(1)
  const [loading, setLoading]   = useState(true)
  const [agregado, setAgregado] = useState(false)

  useEffect(() => { api.colores().then(d => { setColores(d); setColorSel(d[0]||null) }).finally(() => setLoading(false)) }, [])

  const handleAgregar = () => {
    if (!colorSel) return
    for (let i = 0; i < pares; i++) carrito.agregar(modelo, colorSel)
    setAgregado(true); setTimeout(() => setAgregado(false), 1500)
  }

  return (
    <ScrollView style={{ flex:1, backgroundColor:C.bg }} contentContainerStyle={{ paddingBottom:40 }}>
      <View style={{ width:'100%', aspectRatio:1.2, backgroundColor:C.card, alignItems:'center', justifyContent:'center' }}>
        {fotoUrl ? <Image source={{ uri: fotoUrl }} style={{ width:'100%', height:'100%' }} resizeMode="contain" /> : <Text style={{ fontSize:56 }}>🖨</Text>}
      </View>
      <View style={{ padding:20 }}>
        <Text style={s.codigo}>{modelo.codigo}</Text>
        <Text style={{ fontSize:12, color:C.muted, marginBottom:20 }}>{modelo.carpeta}</Text>
        <Text style={s.sectionTitle}>Color / Filamento</Text>
        {loading ? <ActivityIndicator color={C.accent} style={{ marginVertical:16 }} /> :
          <FlatList horizontal data={colores} keyExtractor={c => String(c.id)} showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap:10, paddingBottom:4 }}
            renderItem={({ item: c }) => (
              <TouchableOpacity style={[s.colorChip, colorSel?.id===c.id && s.colorChipSel]} onPress={() => setColorSel(c)}>
                <View style={[s.swatch, { backgroundColor: c.hex||'#888' }]} />
                <Text style={[{ fontSize:10, color:C.text2, textAlign:'center' }, colorSel?.id===c.id && { color:C.accent }]} numberOfLines={2}>{c.nombre}</Text>
                <Text style={{ fontSize:9, color:C.muted }}>{c.stockGr}gr</Text>
              </TouchableOpacity>
            )}
          />
        }
        <Text style={[s.sectionTitle, { marginTop:16 }]}>Pares</Text>
        <View style={{ flexDirection:'row', alignItems:'center', gap:20, marginVertical:4, marginBottom:20 }}>
          <TouchableOpacity style={s.qtBtn} onPress={() => setPares(p => Math.max(1,p-1))}><Text style={s.qtBtnTxt}>−</Text></TouchableOpacity>
          <Text style={{ fontSize:28, fontWeight:'800', color:C.text, minWidth:40, textAlign:'center' }}>{pares}</Text>
          <TouchableOpacity style={s.qtBtn} onPress={() => setPares(p => p+1)}><Text style={s.qtBtnTxt}>+</Text></TouchableOpacity>
        </View>
        <TouchableOpacity style={[s.addBtn, (!colorSel||agregado) && { opacity:0.8 }]} onPress={handleAgregar} disabled={!colorSel||agregado}>
          <Text style={s.addBtnTxt}>{agregado ? '✓ Agregado' : '+ Agregar al pedido'}</Text>
        </TouchableOpacity>
        {carrito.total > 0 && <TouchableOpacity style={s.carritoBtn} onPress={() => nav.navigate('Pedido')}>
          <Text style={{ color:C.accent, fontWeight:'700', fontSize:14 }}>Ver pedido ({carrito.total} pares) →</Text>
        </TouchableOpacity>}
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  codigo: { fontSize:22, fontWeight:'800', color:'#1F2328', fontFamily:'monospace' },
  sectionTitle: { fontSize:11, fontWeight:'700', letterSpacing:1, color:'#8C959F', textTransform:'uppercase', marginBottom:10 },
  colorChip: { width:90, padding:8, borderRadius:10, borderWidth:1.5, borderColor:'#D0D7DE', backgroundColor:'#fff', alignItems:'center', gap:4 },
  colorChipSel: { borderColor:'#155124', backgroundColor:'rgba(21,81,36,.06)' },
  swatch: { width:28, height:28, borderRadius:14, borderWidth:1, borderColor:'#D0D7DE' },
  qtBtn: { width:44, height:44, borderRadius:22, backgroundColor:'#fff', borderWidth:1, borderColor:'#D0D7DE', alignItems:'center', justifyContent:'center' },
  qtBtnTxt: { fontSize:22, color:'#1F2328', fontWeight:'700' },
  addBtn: { backgroundColor:'#155124', borderRadius:12, paddingVertical:16, alignItems:'center', marginBottom:10 },
  addBtnTxt: { color:'#fff', fontWeight:'800', fontSize:15 },
  carritoBtn: { backgroundColor:'rgba(21,81,36,.08)', borderRadius:12, paddingVertical:14, alignItems:'center', borderWidth:1.5, borderColor:'#155124' },
})
