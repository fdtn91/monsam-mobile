import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Text, View, Image, StyleSheet } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as SplashScreen from 'expo-splash-screen'

import CatalogoScreen  from './src/screens/CatalogoScreen'
import DetalleScreen   from './src/screens/DetalleScreen'
import PedidoScreen    from './src/screens/PedidoScreen'
import HistorialScreen from './src/screens/HistorialScreen'
import ConfigScreen    from './src/screens/ConfigScreen'
import VentasScreen    from './src/screens/VentasScreen'
import { useCarrito }  from './src/hooks/useCarrito'

// Mantener el splash nativo visible hasta que React Native esté listo
SplashScreen.preventAutoHideAsync()

const Tab   = createBottomTabNavigator()
const Stack = createNativeStackNavigator()
const ACCENT = '#155124'
const MUTED  = '#8C959F'

const HEADER_OPTS = {
  headerStyle:      { backgroundColor: '#fff' },
  headerTintColor:  ACCENT,
  headerTitleStyle: { fontWeight: '800' },
}

function TabIcon ({ label, focused }) {
  const icons = { 'Catálogo': '🗂', Pedido: '🛒', Ventas: '🧾', Historial: '📋', Config: '⚙️' }
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>
      {icons[label] || '•'}
    </Text>
  )
}

// ── Stack del Catálogo ────────────────────────────────────
function CatalogoStack ({ carrito }) {
  return (
    <Stack.Navigator screenOptions={HEADER_OPTS}>
      <Stack.Screen name="Catalogo" options={{ title: 'Catálogo' }}>
        {props => <CatalogoScreen {...props} carrito={carrito} />}
      </Stack.Screen>
      <Stack.Screen
        name="Detalle"
        options={({ route }) => ({ title: route.params?.modelo?.codigo || 'Detalle' })}
      >
        {props => <DetalleScreen {...props} carrito={carrito} />}
      </Stack.Screen>
      <Stack.Screen name="Pedido" options={{ title: 'Mi pedido' }}>
        {props => <PedidoScreen {...props} carrito={carrito} />}
      </Stack.Screen>
    </Stack.Navigator>
  )
}

// ── Stack de Pedido (tab directa) ────────────────────────
function PedidoStack ({ carrito }) {
  return (
    <Stack.Navigator screenOptions={HEADER_OPTS}>
      <Stack.Screen name="PedidoMain" options={{ title: 'Mi pedido' }}>
        {props => <PedidoScreen {...props} carrito={carrito} />}
      </Stack.Screen>
    </Stack.Navigator>
  )
}

// ── Stack de Ventas ──────────────────────────────────────
function VentasStack () {
  return (
    <Stack.Navigator screenOptions={HEADER_OPTS}>
      <Stack.Screen name="VentasMain" options={{ title: 'Ventas' }}
        component={VentasScreen} />
    </Stack.Navigator>
  )
}

// ── Stack de Historial ───────────────────────────────────
function HistorialStack () {
  return (
    <Stack.Navigator screenOptions={HEADER_OPTS}>
      <Stack.Screen name="HistorialMain" options={{ title: 'Historial' }}
        component={HistorialScreen} />
    </Stack.Navigator>
  )
}

// ── Stack de Config ──────────────────────────────────────
function ConfigStack () {
  return (
    <Stack.Navigator screenOptions={HEADER_OPTS}>
      <Stack.Screen name="ConfigMain" options={{ title: 'Configuración' }}
        component={ConfigScreen} />
    </Stack.Navigator>
  )
}

export default function App () {
  const carrito   = useCarrito()
  const [appReady, setAppReady] = useState(false)

  useEffect(() => {
    // Ocultar el splash nativo (que en Android 12+ es pequeño/centrado)
    // y reemplazarlo con nuestra vista personalizada a pantalla completa
    SplashScreen.hideAsync().then(() => setAppReady(true))
  }, [])

  // ── Splash personalizado a pantalla completa ──────────────
  if (!appReady) {
    return (
      <View style={styles.splash}>
        <Image
          source={require('./assets/splash.png')}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      </View>
    )
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown:             false,
            tabBarActiveTintColor:   ACCENT,
            tabBarInactiveTintColor: MUTED,
            tabBarStyle: {
              borderTopColor:  '#D0D7DE',
              backgroundColor: '#fff',
            },
            tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
            tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
          })}
        >
          <Tab.Screen
            name="Catálogo"
            options={{ tabBarBadge: carrito.total > 0 ? carrito.total : undefined }}
          >
            {() => <CatalogoStack carrito={carrito} />}
          </Tab.Screen>

          <Tab.Screen name="Pedido">
            {() => <PedidoStack carrito={carrito} />}
          </Tab.Screen>

          <Tab.Screen name="Ventas" component={VentasStack} />

          <Tab.Screen name="Historial" component={HistorialStack} />
          <Tab.Screen name="Config"    component={ConfigStack} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: '#155124' },
})
