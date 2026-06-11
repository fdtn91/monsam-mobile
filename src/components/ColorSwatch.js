import React from 'react'
import { View } from 'react-native'

/**
 * Muestra un swatch de color. Soporta degradados bicolor/tricolor
 * usando múltiples Views superpuestas (React Native no tiene linear-gradient nativo).
 */
export default function ColorSwatch ({ hex, hex2, hex3, size = 16, borderRadius, style }) {
  const br = borderRadius !== undefined ? borderRadius : size / 2
  const baseStyle = { width: size, height: size, borderRadius: br, overflow: 'hidden', ...style }

  if (!hex2) {
    return <View style={[baseStyle, { backgroundColor: hex || '#888888' }]} />
  }

  if (hex3) {
    // Tricolor: 3 franjas verticales
    return (
      <View style={[baseStyle, { flexDirection: 'row' }]}>
        <View style={{ flex: 1, backgroundColor: hex }} />
        <View style={{ flex: 1, backgroundColor: hex2 }} />
        <View style={{ flex: 1, backgroundColor: hex3 }} />
      </View>
    )
  }

  // Bicolor: 2 mitades diagonales simuladas con 2 triángulos
  return (
    <View style={[baseStyle, { flexDirection: 'row' }]}>
      <View style={{ flex: 1, backgroundColor: hex }} />
      <View style={{ flex: 1, backgroundColor: hex2 }} />
    </View>
  )
}
