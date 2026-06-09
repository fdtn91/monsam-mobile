# MONSAM Mobile — Estado del Proyecto

## Stack
- **React Native** con **Expo SDK 54**
- **@react-navigation** v7 (bottom tabs + native stack)
- **AsyncStorage** para caché offline y ventas pendientes
- Node.js v20+ requerido (actualizado desde v16)

## Instalación
```bash
cd monsam-mobile
npm install --legacy-peer-deps
npx expo start
```
Escanea QR con Expo Go desde el celular.

## Pantallas
| Pantalla | Archivo | Descripción |
|---|---|---|
| Catálogo | CatalogoScreen.js | Grid 2 cols, búsqueda, filtros, fotos, caché offline |
| Detalle | DetalleScreen.js | Foto/render, selector de colores con swatches, contador pares |
| Pedido | PedidoScreen.js | Carrito, cliente+notas, envío WiFi o guardado offline |
| Ventas | VentasScreen.js | Inventario del servidor, ticket con descuento/IVA, offline |
| Historial | HistorialScreen.js | Pedidos locales + sincronización |
| Config | ConfigScreen.js | URL del servidor + ping de prueba |

## Conexión al servidor
- La app se conecta a `monsam-app` via HTTP en red local WiFi
- URL guardada en AsyncStorage (clave `serverUrl`)
- Default: `http://192.168.68.113:4000`
- Configurar en pestaña Config → "Probar conexión"

## Caché offline
- Catálogo: guardado en AsyncStorage (`catalogo_items`, `catalogo_fotos`)
- Al arrancar: muestra caché primero, actualiza en background
- Banner naranja "📵 Modo offline" cuando usa caché
- Pedidos offline: guardados en `pedidos_offline`, sincronizan desde Historial
- Ventas offline: guardadas en `ventas_offline`

## Pantalla Ventas
- Lista el inventario desde `/api/inventario` (solo items con pares > 0)
- Precio por par desde `/api/precio-venta`
- Datos del ticket desde `/api/config` (marca, RFC, dirección, etc.)
- Toque en item → agrega al ticket | segundo toque → quita del ticket
- Modal del ticket: pares editables, precio por item editable, descuento %, IVA automático si hay RFC
- Al registrar: envía a `POST /api/ventas` → descuenta inventario en PC
- Sin conexión: guarda en `ventas_offline`

## Estado actual (Junio 2026)
- ✅ Todas las pantallas funcionando
- ✅ Caché offline del catálogo
- ✅ Pedidos con envío WiFi y guardado offline
- ✅ Pantalla Ventas con ticket completo
- ✅ IVA automático según RFC del servidor
- ✅ Descuento % por ticket
- ⏳ APK pendiente de compilar con EAS Build

## Pendiente para próxima sesión — Generar APK
1. El usuario tiene cuenta en **expo.dev**
2. Necesita ejecutar: `eas build:configure` en la carpeta del proyecto
3. Usar icono de monsam-app (monsam1.png o monsam2.png del repo) como icono del APK
4. Crear `eas.json` con perfil `preview` para APK de prueba
5. Ejecutar: `eas build -p android --profile preview`
6. Descargar APK del link que da Expo y instalar en celular

## Pasos para el APK (próxima sesión)
```bash
cd "F:\DISEÑOS\Modelos 3D\control\monsam-mobile"
npm install -g eas-cli
eas login          # cuenta: fdtn91 en expo.dev
eas build:configure
eas build -p android --profile preview
```

## Ramas Git
- Rama local: `main` ✅
- Remote: `fdtn91/monsam-mobile` en GitHub ✅
