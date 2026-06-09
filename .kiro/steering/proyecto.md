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
- ✅ APK compilado con Android Studio y funcionando

## Compilar APK con Android Studio

### Carpeta de compilación
El proyecto se compila desde `D:\aplicaciones\monsam-mobile` (sin caracteres especiales en la ruta).
El repo git sigue en `F:\DISEÑOS\Modelos 3D\control\monsam-mobile`.

### Pasos para recompilar
```powershell
# 1. Copiar cambios JS al folder de compilación
copy "F:\DISEÑOS\Modelos 3D\control\monsam-mobile\src\services\api.js" "D:\aplicaciones\monsam-mobile\src\services\api.js"
# (repetir para cada archivo JS modificado)

# 2. Si se modificó app.json, regenerar proyecto nativo:
cd D:\aplicaciones\monsam-mobile
npx expo prebuild --platform android --clean
# ⚠️ Después del prebuild verificar que AndroidManifest.xml tenga:
# android:usesCleartextTraffic="true" en el tag <application>
```

### Generar APK firmado
1. Abrir `D:\aplicaciones\monsam-mobile\android` en Android Studio
2. **Build → Generate Signed Bundle / APK...**
3. Seleccionar **APK**
4. Usar keystore existente en `D:\aplicaciones\monsam-mobile\android\monsam.jks`
5. Seleccionar **release**
6. APK generado en: `android/app/release/app-release.apk`

### ⚠️ Problemas conocidos y soluciones
- **Ruta con Ñ**: Gradle/CMake no soporta caracteres no-ASCII. Por eso se compila desde `D:\aplicaciones\`
- **usesCleartextTraffic**: DEBE estar en `AndroidManifest.xml` o la app no conecta al servidor HTTP
- **newArchEnabled**: debe ser `false` en `gradle.properties`
- **NDK**: usar versión 27.1.12297006 (la que el plugin de Expo fuerza)
- **gradle.properties** debe tener: `android.overridePathCheck=true`

## Ramas Git
- Rama local: `main` ✅
- Remote: `fdtn91/monsam-mobile` en GitHub ✅
- Carpeta de compilación: `D:\aplicaciones\monsam-mobile` (sin git, solo para Android Studio)
