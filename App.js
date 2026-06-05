import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'

import CatalogoScreen  from './src/screens/CatalogoScreen'
import DetalleScreen   from './src/screens/DetalleScreen'
import PedidoScreen    from './src/screens/PedidoScreen'
import HistorialScreen from './src/screens/HistorialScreen'
import ConfigScreen    from './src/screens/ConfigScreen'
import { useCarrito }  from './src/hooks/useCarrito'

const Tab   = createBottomTabNavigator()
const Stack = createNativeStackNavigator()
const ACCENT = '#155124'
const MUTED  = '#8C959F'

function TabIcon ({ label, focused }) {
  const icons = { 'Catálogo': '🗂', Pedido: '🛒', Historial: '📋', Config: '⚙️' }
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{icons[label] || '•'}</Text>
    </View>
  )
}

function CatalogoStack ({ carrito }) {
  return (
    <Stack.Navigator screenOptions={{
      headerStyle: { backgroundColor: '#fff' },
      headerTintColor: ACCENT,
      headerTitleStyle: { fontWeight: '800' },
    }}>
      <Stack.Screen name="Catalogo" options={{ title: 'Catálogo' }}>
        {props => <CatalogoScreen {...props} carrito={carrito} />}
      </Stack.Screen>
      <Stack.Screen name="Detalle" options={({ route }) => ({ title: route.params?.modelo?.codigo || 'Detalle' })}>
        {props => <DetalleScreen {...props} carrito={carrito} />}
      </Stack.Screen>
      <Stack.Screen name="Pedido" options={{ title: 'Mi pedido' }}>
        {props => <PedidoScreen {...props} carrito={carrito} />}
      </Stack.Screen>
    </Stack.Navigator>
  )
}

export default function App () {
  const carrito = useCarrito()
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: ACCENT,
          tabBarInactiveTintColor: MUTED,
          tabBarStyle: { borderTopColor: '#D0D7DE', backgroundColor: '#fff', height: 60, paddingBottom: 8 },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
          tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
        })}
      >
        <Tab.Screen name="Catálogo" options={{ tabBarBadge: carrito.total > 0 ? carrito.total : undefined }}>
          {() => <CatalogoStack carrito={carrito} />}
        </Tab.Screen>
        <Tab.Screen name="Pedido">
          {props => <PedidoScreen {...props} carrito={carrito} />}
        </Tab.Screen>
        <Tab.Screen name="Historial" component={HistorialScreen} />
        <Tab.Screen name="Config" component={ConfigScreen} options={{
          headerShown: true, headerTitle: 'Configuración',
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: ACCENT, headerTitleStyle: { fontWeight: '800' },
        }} />
      </Tab.Navigator>
    </NavigationContainer>
  )
}
