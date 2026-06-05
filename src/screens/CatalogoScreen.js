import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TextInput, TouchableOpacity, Image, StyleSheet, ActivityIndicator, RefreshControl, Dimensions } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { api } from '../services/api'

const { width } = Dimensions.get('window')
const CARD_W = (width - 48) / 2
const C = { accent:'#155124', bg:'#F0F2F5', card:'#FFFFFF', border:'#D0D7DE', text:'#1F2328', text2:'#57606A', muted:'#8C959F', error:'#CF222E' }

export default function CatalogoScreen ({ carrito }) {
  const nav = useNavigation()
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [buscar, setBuscar]   = useState('')
  const [filtro, setFiltro]   = useState('Todos')
  const [prefijos, setPrefijos] = useState([])
  const [fotoUrls, setFotoUrls] = useState({})

  const cargar = useCallback(async () => {
    try {
      setError(null); setLoading(true)
      const data = await api.catalogo()
      setItems(data)
      setPrefijos(['Todos', ...[...new Set(data.map(i => i.codigo.replace(/\d+$/, '')))].sort()])
      const urls = {}
      await Promise.all(data.filter(i => i.tieneFoto).map(async i => { urls[i.codigo] = await api.fotoUrl(i.codigo) }))
      setFotoUrls(urls)
    } catch { setError('No se pudo conectar.\nVerifica la IP en Configuración.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const filtrados = items.filter(i => (filtro === 'Todos' || i.codigo.startsWith(filtro)) && i.codigo.toLowerCase().includes(buscar.toLowerCase()))

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={C.accent} /><Text style={{ color:C.muted, marginTop:12 }}>Cargando catálogo...</Text></View>
  if (error)   return <View style={s.center}><Text style={{ fontSize:40 }}>⚠️</Text><Text style={{ color:C.text2, textAlign:'center', marginTop:12 }}>{error}</Text><TouchableOpacity style={s.retryBtn} onPress={cargar}><Text style={{ color:'#fff', fontWeight:'700' }}>Reintentar</Text></TouchableOpacity></View>

  return (
    <View style={s.root}>
      <View style={s.searchBar}>
        <Text>🔍</Text>
        <TextInput style={s.searchInput} placeholder="Buscar código..." placeholderTextColor={C.muted} value={buscar} onChangeText={setBuscar} autoCapitalize="characters" />
        {buscar.length > 0 && <TouchableOpacity onPress={() => setBuscar('')}><Text style={{ color:C.muted, fontSize:18, paddingHorizontal:8 }}>✕</Text></TouchableOpacity>}
      </View>
      <FlatList horizontal data={prefijos} keyExtractor={p => p} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal:12, paddingBottom:8, gap:6 }}
        renderItem={({ item: p }) => (
          <TouchableOpacity style={[s.chip, filtro===p && s.chipActivo]} onPress={() => setFiltro(p)}>
            <Text style={[s.chipTxt, filtro===p && { color:C.accent }]}>{p}</Text>
          </TouchableOpacity>
        )}
      />
      <FlatList data={filtrados} keyExtractor={i => i.codigo} numColumns={2} columnWrapperStyle={s.row} contentContainerStyle={{ padding:12, paddingBottom:100 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={cargar} colors={[C.accent]} />}
        ListEmptyComponent={<View style={s.center}><Text style={{ color:C.muted, marginTop:40 }}>Sin modelos</Text></View>}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} activeOpacity={0.85} onPress={() => nav.navigate('Detalle', { modelo: item, fotoUrl: fotoUrls[item.codigo] || null })}>
            <View style={s.imgWrap}>
              {fotoUrls[item.codigo] ? <Image source={{ uri: fotoUrls[item.codigo] }} style={s.img} resizeMode="cover" /> : <View style={s.placeholder}><Text style={{ fontSize:32 }}>🖨</Text></View>}
            </View>
            <View style={{ padding:8 }}>
              <Text style={s.code}>{item.codigo}</Text>
              <Text style={s.folder} numberOfLines={1}>{item.carpeta}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
      {carrito.total > 0 && <TouchableOpacity style={s.fab} onPress={() => nav.navigate('Pedido')}><Text style={{ color:'#fff', fontWeight:'800', fontSize:15 }}>🛒  {carrito.total} par{carrito.total!==1?'es':''}</Text></TouchableOpacity>}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex:1, backgroundColor:'#F0F2F5' },
  center: { flex:1, alignItems:'center', justifyContent:'center', padding:24 },
  retryBtn: { marginTop:20, backgroundColor:'#155124', paddingHorizontal:24, paddingVertical:10, borderRadius:8 },
  searchBar: { flexDirection:'row', alignItems:'center', backgroundColor:'#fff', margin:12, borderRadius:10, borderWidth:1, borderColor:'#D0D7DE', paddingHorizontal:12 },
  searchInput: { flex:1, height:44, fontSize:14, color:'#1F2328' },
  chip: { paddingHorizontal:14, paddingVertical:6, borderRadius:20, borderWidth:1, borderColor:'#D0D7DE', backgroundColor:'#fff', marginRight:6 },
  chipActivo: { backgroundColor:'rgba(21,81,36,.12)', borderColor:'#155124' },
  chipTxt: { fontSize:11, fontWeight:'700', color:'#57606A' },
  row: { justifyContent:'space-between', marginBottom:12 },
  card: { width:CARD_W, backgroundColor:'#fff', borderRadius:10, borderWidth:1, borderColor:'#D0D7DE', overflow:'hidden' },
  imgWrap: { width:'100%', aspectRatio:1, backgroundColor:'#F6F8FA', alignItems:'center', justifyContent:'center' },
  img: { width:'100%', height:'100%' },
  placeholder: { alignItems:'center', justifyContent:'center' },
  code: { fontFamily:'monospace', fontSize:12, fontWeight:'700', color:'#155124' },
  folder: { fontSize:10, color:'#8C959F', marginTop:2 },
  fab: { position:'absolute', bottom:24, right:20, left:20, backgroundColor:'#155124', borderRadius:14, paddingVertical:14, alignItems:'center', elevation:6 },
})
