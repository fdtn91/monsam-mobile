# MONSAM Mobile — Estado del Proyecto

## Stack
- **React Native** con **Expo SDK 54**
- **@react-navigation** v7 (bottom tabs + native stack)
- **AsyncStorage** para caché offline y ventas pendientes
- **expo-camera** ~16.0.0 — escáner de código de barras en Ventas
- Node.js v20+ requerido

## Pantallas
| Pantalla | Archivo | Descripción |
|---|---|---|
| Catálogo | CatalogoScreen.js | Grid 2 cols, búsqueda, filtros, fotos, caché offline |
| Detalle | DetalleScreen.js | Foto/render, selector de colores con swatches (bi/tricolor), contador pares |
| Pedido | PedidoScreen.js | Carrito, cliente+notas, envío WiFi o guardado offline |
| Ventas | VentasScreen.js | Inventario del servidor, ticket con descuento/IVA, offline, escáner código de barras |
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

## Colores degradados (bi/tricolor)
- Los colores se guardan en la DB como `hex1|hex2|hex3`
- `api.colores()` parsea automáticamente y devuelve `hex`, `hex2`, `hex3`
- Componente `ColorSwatch` muestra franjas visuales para bi/tricolor
- Se aplica en DetalleScreen (selector) y PedidoScreen (carrito)

## Estado actual (Junio 2026)
- ✅ Todas las pantallas funcionando
- ✅ Caché offline del catálogo
- ✅ Pedidos con envío WiFi y guardado offline
- ✅ Pantalla Ventas con ticket completo + escáner código de barras
- ✅ IVA automático según RFC del servidor
- ✅ Descuento % por ticket
- ✅ Soporte colores degradados bi/tricolor
- ✅ Bug fix: cerrar modal ticket al borrar todos los items
- ⚠️ APK en proceso — problemas con Android Studio (ver sección abajo)

## Compilar APK con Android Studio

### Carpeta de compilación
El proyecto se compila desde `D:\aplicaciones\monsam-mobile` (sin caracteres especiales).
El repo git está configurado en esa misma carpeta (`git pull origin main`).

### Flujo normal (solo cambios JS)
```powershell
cd D:\aplicaciones\monsam-mobile
git pull
# Build → Generate Signed APK → release → Finish
```

### Si cambia app.json o package.json
```powershell
git pull
npm install --legacy-peer-deps
npx expo prebuild --platform android --clean
# Verificar AndroidManifest.xml (ver abajo)
# Build → Generate Signed APK → release → Finish
```

### ⚠️ usesCleartextTraffic — YA AUTOMATIZADO
El plugin local `plugins/withCleartextTraffic.js` lo agrega automáticamente durante el prebuild.
Ya NO hay que agregarlo a mano en el `AndroidManifest.xml`.

### Generar APK firmado
1. Abrir `D:\aplicaciones\monsam-mobile\android` en Android Studio
2. **Build → Generate Signed Bundle / APK...**
3. Seleccionar **APK**
4. Usar keystore: `D:\aplicaciones\monsam-mobile\android\monsam.jks`
5. Seleccionar **release**
6. APK en: `android/app/release/app-release.apk`

### ⚠️ Problemas conocidos en Android Studio
- **Ruta con Ñ**: Gradle/CMake no soporta caracteres no-ASCII → compilar desde `D:\aplicaciones\`
- **android.jar faltante**: Si falla con `NoSuchFileException: android-35\android.jar` → reinstalar Android SDK Platform 35 desde SDK Manager (desinstalar + borrar carpeta + reinstalar)
- **Kotlin version**: El proyecto requiere Kotlin 2.0.21+ en `android/build.gradle`
- **enableBundleCompression**: Si aparece ese error, comentar esa línea en `android/app/build.gradle`
- **NDK**: usar versión 27.1.12297006
- **gradle.properties** debe tener: `android.overridePathCheck=true`, `newArchEnabled=false`
- **Kotlin en build.gradle raíz**:
  ```gradle
  ext { kotlinVersion = "2.0.21" }
  // y en dependencies:
  classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:2.0.21")
  ```

### ⚠️ Estado APK (Junio 2026)
- Compilación actual en progreso — resolviendo problemas de Android SDK 35 corrupt/faltante
- El APK anterior funcionaba correctamente con conexión al servidor
- Pendiente: verificar que el nuevo APK con escáner de cámara compila bien

## Icono y Splash
- `assets/icon.png` — logo cuadrado 1024x1024px
- `assets/icon_foreground.png` — logo con transparencia (ícono adaptativo Android)
- `assets/splash.png` — imagen splash (cover, fondo #155124)
- Splash configurado con `resizeMode: "cover"` — ocupa pantalla completa

## Ramas Git
- Repo: `fdtn91/monsam-mobile`
- Carpeta de compilación: `D:\aplicaciones\monsam-mobile` (con git configurado)
- `git pull origin main` para actualizar
