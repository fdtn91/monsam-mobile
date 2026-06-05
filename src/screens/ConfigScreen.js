import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native'
import { getBaseUrl, saveBaseUrl, api } from '../services/api'

const C = { accent:'#155124', bg:'#F0F2F5', card:'#FFFFFF', border:'#D0D7DE', text:'#1F2328', text2:'#57606A', muted:'#8C959F', ok:'#1A7F37', error:'#CF222E' }

export default function ConfigScreen () {
  const [url, setUrl]         = useState('')
  const [probando, setProbando] = useState(false)
  const [estado, setEstado]   = useState(null)
  const [version, setVersion] = useState(null)

  useEffect(() => { getBaseUrl().then(setUrl) }, [])

  const guardar = async () => {
    if (!url.trim()) { Alert.alert('URL requerida'); return }
    await saveBaseUrl(url.trim())
    Alert.alert('✅ Guardado', 'URL del servidor actualizada.')
  }

  const probar = async () => {
    setProbando(true); setEstado(null)
    try { const res = await api.ping(); setEstado('ok'); setVersion(res.version) }
    catch { setEstado('error') }
    finally { setProbando(false) }
  }

  return (
    <ScrollView style={s.root} contentContainerStyle={{ padding: 20 }}>
      <View style={s.card}>
        <Text style={s.cardTitle}>Servidor MONSAM (PC)</Text>
        <Text style={s.hint}>Ingresa la URL que aparece en{'\n'}<Text style={{ fontWeight: '700', color: C.accent }}>Configuración → App móvil</Text>{'\n'}de la app en tu PC.</Text>
        <Text style={s.label}>URL del servidor</Text>
        <TextInput style={s.input} value={url} onChangeText={setUrl} placeholder="http://192.168.x.x:4000" placeholderTextColor={C.muted} autoCapitalize="none" keyboardType="url" autoCorrect={false} />
        <View style={s.btnRow}>
          <TouchableOpacity style={[s.btn, s.btnSec]} onPress={probar} disabled={probando}>
            {probando ? <ActivityIndicator color={C.accent} size="small" /> : <Text style={s.btnSecTxt}>🔌 Probar</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={[s.btn, s.btnPri]} onPress={guardar}>
            <Text style={s.btnPriTxt}>Guardar</Text>
          </TouchableOpacity>
        </View>
        {estado === 'ok' && <View style={s.resultOk}><Text style={{ color: C.ok, fontWeight: '700' }}>✅ Conectado · v{version}</Text></View>}
        {estado === 'error' && <View style={s.resultErr}><Text style={{ color: C.error, fontWeight: '700' }}>❌ Sin conexión — verifica IP y WiFi</Text></View>}
      </View>
      <View style={s.card}>
        <Text style={s.cardTitle}>¿Cómo conectarse?</Text>
        {['1. Abre monsam-app en la PC','2. Ve a Configuración','3. Busca la sección "App móvil"','4. Copia la URL (ej: http://192.168.1.x:4000)','5. Pégala aquí arriba y guarda','6. Presiona "Probar conexión"','','⚠️ El celular y la PC deben estar en la misma red WiFi.'].map((l,i) => (
          <Text key={i} style={l.startsWith('⚠️') ? s.warn : s.step}>{l}</Text>
        ))}
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  root: { flex:1, backgroundColor:'#F0F2F5' },
  card: { backgroundColor:'#fff', borderRadius:12, borderWidth:1, borderColor:'#D0D7DE', padding:18, marginBottom:16 },
  cardTitle: { fontSize:11, fontWeight:'700', letterSpacing:1, color:'#8C959F', textTransform:'uppercase', marginBottom:12 },
  hint: { fontSize:13, color:'#57606A', lineHeight:20, marginBottom:16 },
  label: { fontSize:11, fontWeight:'700', color:'#8C959F', textTransform:'uppercase', letterSpacing:0.8, marginBottom:6 },
  input: { backgroundColor:'#F0F2F5', borderWidth:1, borderColor:'#D0D7DE', borderRadius:8, padding:12, fontSize:15, color:'#1F2328', fontFamily:'monospace' },
  btnRow: { flexDirection:'row', gap:10, marginTop:14 },
  btn: { flex:1, borderRadius:8, paddingVertical:12, alignItems:'center' },
  btnPri: { backgroundColor:'#155124' }, btnSec: { backgroundColor:'#F0F2F5', borderWidth:1, borderColor:'#D0D7DE' },
  btnPriTxt: { color:'#fff', fontWeight:'700', fontSize:14 }, btnSecTxt: { color:'#155124', fontWeight:'700', fontSize:13 },
  resultOk: { marginTop:12, padding:10, backgroundColor:'rgba(26,127,55,.1)', borderRadius:8 },
  resultErr: { marginTop:12, padding:10, backgroundColor:'rgba(207,34,46,.08)', borderRadius:8 },
  step: { fontSize:13, color:'#57606A', lineHeight:24 },
  warn: { fontSize:13, color:'#155124', fontWeight:'600', marginTop:8, lineHeight:20 },
})
