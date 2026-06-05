import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  Image, StyleSheet, ActivityIndicator, RefreshControl, Dimensions
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation } from '@react-navigation/native'
import { api } from '../services/api'

const { width } = Dimensions.get('window')
const CARD_W    = (width - 48) / 2
const C = {
  accent:'#155124', bg:'#F0F2F5', card:'#FFFFFF', border:'#D0D7DE',
  text:'#1F2328', text2:'#57606A', muted:'#8C959F', error:'#CF222E', warn:'#9A6700'
}

const CACHE_KEY_ITEMS    = 'catalogo_items'
const CACHE_KEY_FOTOS    = 'catalogo_fotos'
const CACHE_KEY_UPDATED  = 'catalogo_updated'

export default function CatalogoScreen ({ carrito }) {
  const nav = useNavigation()
  const [items,     setItems]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [offline,   setOffline]   = useState(false)
  const [buscar,    setBuscar]    = useState('')
  const [filtro,    setFiltro]    = useState('Todos')
  const [prefijos,  setPrefijos]  = useState([])
  const [fotoUrls,  setFotoUrls]  = useState({})

  // ── Cargar desde caché ────────────────────────────────
  const cargarCache = useCallback(async () => {
    const cachedItems = await AsyncStorage.getItem(CACHE_KEY_ITEMS)
    const cachedFotos = await AsyncStorage.getItem(CACHE_KEY_FOTOS)
    const updated     = await AsyncStorage.getItem(CACHE_KEY_UPDATED)
    if (cachedItems) {
      const data = JSON.parse(cachedItems)
      setItems(data)
      setPrefijos(['Todos', ...[...new Set(data.map(i => i.codigo.replace(/\d+$/, '')))].sort()])
      if (cachedFotos) setFotoUrls(JSON.parse(cachedFotos))
      setOffline(true)
      return true
    }
    return false
  }, [])

  // ── Cargar desde servidor ──────────────────────────────
  const cargarServidor = useCallback(async () => {
    const data = await api.catalogo()
    setItems(data)
    setPrefijos(['Todos', ...[...new Set(data.map(i => i.codigo.replace(/\d+$/, '')))].sort()])

    // Precargar URLs de fotos
    const urls = {}
    await Promise.all(
      data.filter(i => i.tieneFoto).map(async i => {
        urls[i.codigo] = await api.fotoUrl(i.codigo)
      })
    )
    setFotoUrls(urls)

    // Guardar en caché
    await AsyncStorage.setItem(CACHE_KEY_ITEMS,   JSON.stringify(data))
    await AsyncStorage.setItem(CACHE_KEY_FOTOS,   JSON.stringify(urls))
    await AsyncStorage.setItem(CACHE_KEY_UPDATED, new Date().toISOString())
    setOffline(false)
    return data
  }, [])

  // ── Carga principal ────────────────────────────────────
  const cargar = useCallback(async (forzar = false) => {
    setError(null)
    setLoading(true)
    try {
      await cargarServidor()
    } catch {
      // Sin conexión — intentar desde caché
      const tienecache = await cargarCache()
      if (!tienecache) setError('Sin conexión y sin caché disponible.\nConéctate al WiFi de la PC al menos una vez.')
    } finally {
      setLoading(false)
    }
  }, [cargarServidor, cargarCache])

  // Primer arranque — primero mostrar caché (rápido), luego actualizar en background
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const tienecache = await cargarCache()
      if (tienecache) setLoading(false)
      // Intentar actualizar en background
      try {
        await cargarServidor()
      } catch {
        // Sin conexión — queda el caché
      }
      setLoading(false)
    }
    init()
  }, [])

  const filtrados = items.filter(i =>
    (filtro === 'Todos' || i.codigo.startsWith(filtro)) &&
    i.codigo.toLowerCase().includes(buscar.toLowerCase())
  )

  if (loading && items.length === 0) return (
    <View style={s.center}>
      <ActivityIndicator size="large" color={C.accent} />
      <Text style={{ color: C.muted, marginTop: 12 }}>Cargando catálogo...</Text>
    </View>
  )

  if (error) return (
    <View style={s.center}>
      <Text style={{ fontSize: 40 }}>⚠️</Text>
      <Text style={{ color: C.text2, textAlign: 'center', marginTop: 12 }}>{error}</Text>
      <TouchableOpacity style={s.retryBtn} onPress={() => cargar(true)}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={s.root}>
      {/* Banner offline */}
      {offline &&
        <View style={s.offlineBanner}>
          <Text style={s.offlineTxt}>📵 Modo offline — mostrando catálogo guardado</Text>
        </View>
      }

      {/* Barra de búsqueda */}
      <View style={s.searchBar}>
        <Text>🔍</Text>
        <TextInput
          style={s.searchInput}
          placeholder="Buscar código..."
          placeholderTextColor={C.muted}
          value={buscar}
          onChangeText={setBuscar}
          autoCapitalize="characters"
        />
        {buscar.length > 0 &&
          <TouchableOpacity onPress={() => setBuscar('')}>
            <Text style={{ color: C.muted, fontSize: 18, paddingHorizontal: 8 }}>✕</Text>
          </TouchableOpacity>
        }
      </View>

      {/* Filtros por prefijo */}
      <FlatList
        horizontal
        data={prefijos}
        keyExtractor={p => p}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 8, gap: 6 }}
        renderItem={({ item: p }) => (
          <TouchableOpacity
            style={[s.chip, filtro === p && s.chipActivo]}
            onPress={() => setFiltro(p)}
          >
            <Text style={[s.chipTxt, filtro === p && { color: C.accent }]}>{p}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Grid de modelos */}
      <FlatList
        data={filtrados}
        keyExtractor={i => i.codigo}
        numColumns={2}
        columnWrapperStyle={s.row}
        contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => cargar(true)}
            colors={[C.accent]}
          />
        }
        ListEmptyComponent={
          <View style={s.center}>
            <Text style={{ color: C.muted, marginTop: 40 }}>Sin modelos</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.card}
            activeOpacity={0.85}
            onPress={() => nav.navigate('Detalle', {
              modelo:  item,
              fotoUrl: fotoUrls[item.codigo] || null
            })}
          >
            <View style={s.imgWrap}>
              {fotoUrls[item.codigo]
                ? <Image
                    source={{ uri: fotoUrls[item.codigo] }}
                    style={s.img}
                    resizeMode="cover"
                  />
                : <View style={s.placeholder}>
                    <Text style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: '700', color: C.accent }}>{item.codigo}</Text>
                    <Text style={{ fontSize: 9, color: C.muted, marginTop: 4 }}>Sin foto</Text>
                  </View>
              }
            </View>
            <View style={{ padding: 8 }}>
              <Text style={s.code}>{item.codigo}</Text>
              <Text style={s.folder} numberOfLines={1}>{item.carpeta}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Botón carrito flotante */}
      {carrito.total > 0 &&
        <TouchableOpacity style={s.fab} onPress={() => nav.navigate('Pedido')}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>
            🛒  {carrito.total} par{carrito.total !== 1 ? 'es' : ''}
          </Text>
        </TouchableOpacity>
      }
    </View>
  )
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.bg },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  retryBtn:      { marginTop: 20, backgroundColor: C.accent, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  offlineBanner: { backgroundColor: C.warn, paddingVertical: 6, paddingHorizontal: 14 },
  offlineTxt:    { color: '#fff', fontSize: 11, fontWeight: '700', textAlign: 'center' },
  searchBar:     { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, margin: 12, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12 },
  searchInput:   { flex: 1, height: 44, fontSize: 14, color: C.text },
  chip:          { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.card, marginRight: 6 },
  chipActivo:    { backgroundColor: 'rgba(21,81,36,.12)', borderColor: C.accent },
  chipTxt:       { fontSize: 11, fontWeight: '700', color: C.text2 },
  row:           { justifyContent: 'space-between', marginBottom: 12 },
  card:          { width: CARD_W, backgroundColor: C.card, borderRadius: 10, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  imgWrap:       { width: '100%', aspectRatio: 1, backgroundColor: '#F6F8FA', alignItems: 'center', justifyContent: 'center' },
  img:           { width: '100%', height: '100%' },
  placeholder:   { alignItems: 'center', justifyContent: 'center' },
  code:          { fontFamily: 'monospace', fontSize: 12, fontWeight: '700', color: C.accent },
  folder:        { fontSize: 10, color: C.muted, marginTop: 2 },
  fab:           { position: 'absolute', bottom: 24, right: 20, left: 20, backgroundColor: C.accent, borderRadius: 14, paddingVertical: 14, alignItems: 'center', elevation: 6 },
})
