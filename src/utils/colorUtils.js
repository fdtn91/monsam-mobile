/**
 * Genera el estilo de background para un color, soportando degradados bicolor/tricolor.
 * Para React Native usamos LinearGradient o simplemente el primer color como fallback.
 */
export function getSwatchStyle (color) {
  if (!color) return { backgroundColor: '#888888' }
  const hex  = color.hex  || color.color_hex || '#888888'
  const hex2 = color.hex2 || null
  const hex3 = color.hex3 || null
  // React Native no soporta linear-gradient en style directo
  // Devolvemos los colores para que el componente decida cómo renderizar
  return { hex, hex2, hex3 }
}

export function isDegradado (color) {
  return !!(color && color.hex2)
}
