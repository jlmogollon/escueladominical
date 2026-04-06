# Estructura Modular del Código (src/sections/)

Este directorio contiene la aplicación Escuela Dominical dividida en 6 módulos independientes cargados en orden secuencial por Babel.

## Orden de Carga (Crítico)

El `index.html` carga los archivos en este orden **exacto**:

1. **02_helpers.jsx** (398 líneas)
   - Imports de React: `useState`, `useEffect`, `useCallback`, `useRef`, `useMemo`
   - Constantes: `CLASE_COLORS`, `CLASES_LIST`, `EVAL_KEYS`, `EVAL_LABELS`, etc.
   - Funciones utilidad puras para manipulación de strings, nombres, datas
   - Helpers sin dependencias de otros módulos

2. **03_firebase.jsx** (479 líneas)
   - Configuración de Firebase: `FIREBASE_CONFIG`, `FIRESTORE_COLLECTION`, `FIRESTORE_DATA_KEYS`
   - Funciones core de Firebase:
     - `getDb()` - obtener referencia a Firestore
     - `waitForDb()` - esperar a que Firebase esté listo
     - `getDbNow()` - fuerza lectura síncrona (debug)
     - `getPendingWrites()` - lee cola de escritura offline
     - `setPendingWrites()` - guarda cola offline
     - `queuePendingWrite()` - encola un write para retry
     - `flushPendingWrites()` - sincroniza escrituras pendientes
   - `firebaseDiagnostico()` - verificación de conexión
   - `loadData(key)` - carga un documento específico
   - `saveData(key, data)` - guarda con retry automático
   - `subscribeData(keys, onData, onError)` - suscripción a documentos específicos (sin listQuery)
   - Funciones de reparación de datos: `restoreFotosFromClases`, `restoreAlumnoDataFromStored`, etc.

3. **04_components.jsx** (2649 líneas)
   - Componentes genéricos y utilitarios:
     - `LogoImg`, `LogoLogin` - branding
     - `AvatarUpload` - widget de foto con upload a Firebase Storage
     - `Modal` - sistema modal genérico
     - `BottomNav` - navegación inferior
     - `StatCard`, `BirthdayBanner`, `VerseBannerMaestros` - widgets dashboard
     - `ErrorBoundary` - error handling en React
   - Componente de autenticación:
     - `LoginScreen` - pantalla de login admin/maestro
   - Paneles de gestión principales:
     - `AdminDashboard` - vista general del admin
     - `MaestrosPanel` - CRUD de maestros
     - `CronogramaPanel` - horario de clases
     - `ClasesPanel` - gestión de clases
     - `FamiliasPanel` - datos de familias (teléfonos, encargos)
     - `AlumnosPanel` - fuente de verdad: aquí se cargan/editan alumnos
     - `CalifAdminPanel` - visualización de calificaciones por alumno/sesión
     - `EvaluacionesPanel` - evaluación de maestros (antiguo)
     - `EvaluacionesPanelUnificado` - evaluación + videos en una pestaña
     - `VideosPanel` - gestión de videos de clase
   - `formatCalifFecha()` y otras funciones de formato

4. **05_apps.jsx** (2136 líneas)
   - `TeacherApp` - aplicación completa para maestros
     - Tabs: inicio, mis clases, mis alumnos, calificaciones, más (evaluación/perfil)
     - Capacidad de calificar alumnos, cargar videos, cambiar contraseña
   - `PeticionesPanel` - panel de peticiones de oración (shared admin/teacher)
   - `AdminApp` - aplicación completa para admin
     - Tabs: maestros, horario, clases, alumnos, más (familias/cronograma/videos/evaluaciones/finanzas)
     - Acceso completo a todas las funciones de gestión
     - Acceso a backup/restore
   - `backupData()` - descarga JSON completo (sin passwordsteacher)
   - `restoreData()` - sube JSON con validación

5. **06_main.jsx**
   - Función `App()` - componente raíz que orquesta todo
     - Manejo de inicialización: `loadInitialData()`, `flushPendingWrites()`
     - Detección de login (admin/teacher)
     - Rutas: login → TeacherApp o AdminApp
     - Integración con Firebase subscriptions
     - Banner de instalación PWA (iOS/Android)
     - Reload automático si app estuvo en background >5 horas
   - `ReactDOM.createRoot()` y montaje en `#root`

## Dependencias y Flujo

```
02_helpers        (no depende de nadie)
     ↓
03_firebase       (usa 02_helpers)
     ↓
04_components     (usa 02_helpers, 03_firebase)
     ↓
05_apps           (usa 02_helpers, 03_firebase, 04_components)
     ↓
06_main           (usa todo lo anterior)
```

## Cambios Clave Respecto a la Versión Original

- **No se perdió nada**: El archivo `01_core.jsx` (5662 líneas) fue dividido exactamente en estos 4 módulos + 06_main.jsx
- **01_core.jsx original**: Renombrado a `_01_core_original_backup.jsx` (opcional, para referencia)
- **Offline-first**: `03_firebase.jsx` implementa cola de escrituras en localStorage que se sincroniza cuando hay conexión
- **Seguridad Firestore**: Los datos no se cargan por `listQuery` (prohibido en firestore.rules). Se usa suscripción a documentos específicos por clave
- **Datos de prueba vacíos**: `INITIAL_MAESTROS`, `INITIAL_CLASES`, etc. están vacías - los datos se cargan desde Firestore

## Cómo Editar

Si necesitas modificar:
- **Añadir funciones helper**: edita `02_helpers.jsx`
- **Cambiar Firebase config o añadir funciones de datos**: edita `03_firebase.jsx`
- **Crear / editar componentes UI**: edita `04_components.jsx`
- **Modificar TeacherApp o AdminApp**: edita `05_apps.jsx`
- **Cambiar inicialización de la app**: edita `06_main.jsx`

## Validación

Todos los archivos fueron validados para:
- ✅ No hay errores de sintaxis
- ✅ Todos los imports de React están presentes
- ✅ Las dependencias entre módulos respetan el orden de carga
- ✅ No hay funciones duplicadas
- ✅ Git commit guardado: fase de modulación completada

---

**Última actualización**: 2026  
**Versión modular**: 2.0 (dividida en 5 secciones de código + 1 de app principal)  
**Sistema de carga**: Babel standalone (scripts JSX)  
**Firebase**: Compatible con offline-first y retry automático
