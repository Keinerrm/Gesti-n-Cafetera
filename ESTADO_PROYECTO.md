# ☕ CaféControl — Estado del Proyecto

> **Fecha:** 7 de marzo de 2026  
> **Versión:** 1.2  
> **Estado:** En desarrollo activo — funcional

---

## 🧑‍💻 Lenguajes y Tecnologías

### HTML5

El archivo `index.html` es el **esqueleto único** de toda la aplicación. CaféControl es una **SPA** (Single Page Application): el HTML define la estructura base (login, sidebar, área de contenido) y JavaScript se encarga de renderizar cada módulo dinámicamente dentro de `<main id="app">`.

**Se usa para:**
- Estructura semántica de la página
- Formularios de login
- Navegación (sidebar desktop + bottom nav mobile)
- Meta tags para PWA (manifest, theme-color, viewport)
- Carga de Google Fonts (Inter)

**Archivo:** `index.html` (197 líneas)

---

### CSS3

Un solo archivo `styles.css` contiene **todo el diseño visual** del sistema. No se usa ningún framework CSS. Todo está escrito a mano con un sistema de diseño basado en variables CSS.

**Se usa para:**
- **Variables CSS** (`--accent`, `--bg-card`, etc.) — cambian todo el tema desde un solo lugar
- **Tema oscuro café** — colores inspirados en tonos de café tostado
- **Layout responsive** — `@media` queries para desktop (sidebar) y mobile (bottom nav)
- **Componentes** — cards, modals, toasts, tabs, badges, tablas, botones, checkboxes custom
- **Animaciones** — `fadeIn`, `fadeInUp`, `slideUp`, `float`, `shake`
- **Scrollbar personalizado** — estilo minimalista

**Archivo:** `css/styles.css` (~1,760 líneas)

**Técnicas CSS usadas:**
| Técnica | Uso en el proyecto |
|---------|-------------------|
| CSS Variables | Todo el sistema de colores, bordes, sombras, tipografía |
| Flexbox | Layout de sidebar, cards, botones, modals |
| CSS Grid | Grillas de stats (grid-2, grid-3, grid-4) |
| Gradients | Botón primario, sidebar active, header de login |
| `backdrop-filter: blur()` | Glassmorphism en login y bottom nav |
| `position: sticky` | Headers de tablas que se fijan al hacer scroll |
| `@media` queries | Responsive: 768px (tablet) y 480px (móvil) |
| `env(safe-area-inset)` | Soporte para iPhones con notch |
| `@media print` | Estilos de impresión para recibos |
| Custom checkboxes | Planilla de comida con animaciones |

---

### JavaScript (ES6+ Vanilla)

**14 archivos JS** conforman toda la lógica del sistema. No se usa React, Vue, Angular, jQuery ni ningún framework. Todo es JavaScript puro moderno (ES6+).

**Se usa para:**
- Lógica de negocio de cada módulo
- Router SPA (navegación sin recargar la página)
- Interacción con IndexedDB (base de datos)
- Renderizado dinámico del DOM (template literals)
- Validación de formularios
- Cálculos financieros (pagos, liquidaciones)
- Generación de PDFs con jsPDF
- Gestión de estado (localStorage, sessionStorage)

**Archivos y responsabilidades:**

| Archivo | Líneas | Responsabilidad |
|---------|--------|----------------|
| `db.js` | ~260 | Base de datos IndexedDB — CRUD genérico, config, helpers |
| `app.js` | ~120 | Router SPA, autenticación, navegación, toast notifications |
| `dashboard.js` | ~310 | Panel principal, KPIs, gráficos, alertas inteligentes, selector de finca |
| `obreros.js` | ~180 | CRUD de trabajadores, perfil con stats |
| `lotes.js` | ~170 | CRUD de lotes, cálculo de kg/ha |
| `jornales.js` | ~510 | Registro rápido masivo + individual de recolección |
| `asistencia.js` | ~130 | Calendario visual de asistencia mensual |
| `comida.js` | ~500 | Planilla de checkboxes + registro individual de comida |
| `caja.js` | ~350 | Punto de venta, inventario, ventas fiadas |
| `cascota.js` | ~140 | Control de cáscara de café por lote |
| `conversion.js` | ~140 | Conversión café rojo → mojado |
| `pagos.js` | ~375 | Liquidación con descuento de fiado, recibos, WhatsApp |
| `reportes.js` | ~350 | Reportes por obrero/lote/finca, export CSV + PDF |
| `config.js` | ~150 | Tarifas, precios, contraseña, backup/restore |

**Características de JS usadas:**

| Característica ES6+ | Ejemplo de uso |
|---------------------|----------------|
| `async/await` | Todas las operaciones con IndexedDB |
| Template literals | Renderizado de HTML dinámico |
| `const/let` | Variables con scope de bloque |
| Arrow functions `=>` | Callbacks, `.map()`, `.filter()`, `.reduce()` |
| Destructuring | `const { jsPDF } = window.jspdf` |
| `Promise` | Capa de datos en `db.js` |
| `Object.entries()` | Iteración de stores de IDB |
| Spread operator `...` | `{ ...l, totalKilos: kilos }` |
| Optional chaining `?.` | `document.getElementById('x')?.value` |
| Módulos como objetos | `const Dashboard = { render() {}, ... }` |

---

### IndexedDB

Base de datos **NoSQL del navegador**. Los datos se almacenan localmente y persisten incluso sin internet. No se usa Firebase, SQLite ni ningún servidor — todo vive en el navegador del usuario.

**Se usa para:**
- Almacenar todos los registros (obreros, jornales, comida, ventas, pagos, etc.)
- 12 object stores (tablas)
- Índices para búsquedas rápidas por obreroId, loteId, fecha, fincaId
- Versionado con migración automática (actualmente v3)
- Backup/restore (exportar/importar como JSON)

**Stores actuales:**

```
obreros, lotes, jornales, asistencia, comida,
productos, ventasCaja, cascota, conversion,
pagos, fincas, config
```

---

### Service Worker + PWA

El `sw.js` convierte la app en una **Progressive Web App** instalable que funciona offline.

**Se usa para:**
- Cachear todos los archivos estáticos (HTML, CSS, JS, fuentes)
- Estrategia **cache-first** — sirve desde cache, luego actualiza
- `manifest.json` — nombre, colores, iconos, modo standalone
- Instalable en Android/iOS como app nativa

**Limitación:** El Service Worker solo funciona con `localhost` o `https://`. No funciona con `file:///`.

---

### jsPDF (librería externa)

Única dependencia externa del proyecto. Archivo local `js/lib/jspdf.umd.min.js` (~97KB).

**Se usa para:**
- Generar reportes en PDF descargables
- Layout profesional con header, tablas con bordes, footer con paginación
- Funciona 100% offline (archivo local, no CDN)

---

### JSON

**Se usa para:**
- `manifest.json` — configuración de la PWA
- `package.json` — no existe (no hay npm)
- Backup de datos — export/import como `.json`
- `.vscode/launch.json` — configuración de desarrollo

---

## 📁 Estructura del Proyecto

```
Gestion Cafetera/
│
├── index.html              ← SPA shell (197 líneas)
├── manifest.json           ← Config PWA
├── sw.js                   ← Service Worker
├── DOCUMENTACION.md        ← Documentación completa
├── ESTADO_PROYECTO.md      ← Este archivo
│
├── css/
│   └── styles.css          ← Todo el diseño (~1,760 líneas)
│
├── js/
│   ├── lib/
│   │   └── jspdf.umd.min.js  ← Generador de PDF
│   │
│   ├── db.js               ← IndexedDB (datos)
│   ├── app.js              ← Router + auth
│   ├── dashboard.js        ← Panel + alertas + fincas
│   ├── obreros.js          ← Trabajadores
│   ├── lotes.js            ← Lotes + kg/ha
│   ├── jornales.js         ← Recolección diaria
│   ├── asistencia.js       ← Calendario
│   ├── comida.js           ← Alimentación
│   ├── caja.js             ← Tienda
│   ├── cascota.js          ← Cáscara de café
│   ├── conversion.js       ← Rojo → mojado
│   ├── pagos.js            ← Liquidación
│   ├── reportes.js         ← Reportes + PDF
│   └── config.js           ← Configuración
│
└── .vscode/
    ├── launch.json          ← Debug con Chrome
    └── settings.json        ← Config Live Server
```

---

## 📊 Métricas Actuales

| Métrica | Valor |
|---------|-------|
| Archivos totales | ~20 |
| Líneas de JavaScript | ~3,685 |
| Líneas de CSS | ~1,760 |
| Líneas de HTML | ~197 |
| **Total código** | **~5,642 líneas** |
| Módulos funcionales | 12 |
| Object stores IDB | 12 |
| Dependencias externas | 1 (jsPDF) |
| Frameworks | **0** |
| Peso total (sin jsPDF) | ~85 KB |

---

## 🚀 Funcionalidades Implementadas

| # | Módulo | Funcionalidad principal | Estado |
|---|--------|------------------------|--------|
| 1 | Dashboard | KPIs, gráficos, top lotes/recolectores | ✅ |
| 2 | Dashboard | Alertas inteligentes (producción, stock, inactividad) | ✅ |
| 3 | Dashboard | Selector multi-finca con CRUD | ✅ |
| 4 | Obreros | CRUD + perfil con estadísticas | ✅ |
| 5 | Lotes | CRUD + producción/hectárea (kg/ha) | ✅ |
| 6 | Jornales | Registro rápido masivo (planilla para 20+ obreros) | ✅ |
| 7 | Jornales | Registro individual con AM/PM | ✅ |
| 8 | Asistencia | Calendario visual mensual clickeable | ✅ |
| 9 | Comida | Registro rápido masivo con checkboxes | ✅ |
| 10 | Comida | Autoguardado borrador + restaurar | ✅ |
| 11 | Caja | Punto de venta + inventario + fiado | ✅ |
| 12 | Cascota | Control por lote | ✅ |
| 13 | Conversión | Rojo → mojado con factor configurable | ✅ |
| 14 | Pagos | Liquidación con descuento automático de fiado | ✅ |
| 15 | Pagos | Recibo imprimible + compartir por WhatsApp | ✅ |
| 16 | Reportes | CSV exportable para Excel | ✅ |
| 17 | Reportes | PDF exportable con jsPDF | ✅ |
| 18 | Config | Tarifas, precios, backup/restore JSON | ✅ |
| 19 | PWA | Instalable + offline (Service Worker) | ✅ |

---

## 🧱 Arquitectura

```
┌─────────────────────────────────────────┐
│              index.html (SPA)           │
│  ┌─────────┐  ┌─────────┐  ┌────────┐  │
│  │ Sidebar │  │  #app   │  │ Toasts │  │
│  │  (nav)  │  │ (main)  │  │        │  │
│  └─────────┘  └────┬────┘  └────────┘  │
│                    │                     │
│  ┌─────────────────┼───────────────────┐ │
│  │            app.js (Router)          │ │
│  │  hash → render módulo correcto     │ │
│  └─────────────────┼───────────────────┘ │
│                    │                     │
│  ┌─────────────────┼───────────────────┐ │
│  │     Módulos (dashboard, obreros,    │ │
│  │     jornales, comida, pagos, etc.)  │ │
│  │     Cada uno: { render(), save() }  │ │
│  └─────────────────┼───────────────────┘ │
│                    │                     │
│  ┌─────────────────┼───────────────────┐ │
│  │          db.js (IndexedDB)          │ │
│  │   add, put, get, getAll, delete     │ │
│  │   getAllByFinca, getConfig          │ │
│  └─────────────────────────────────────┘ │
│                                          │
│  ┌──────────────────────────────────────┐│
│  │    sw.js (Service Worker / Cache)    ││
│  └──────────────────────────────────────┘│
└──────────────────────────────────────────┘
```

**Patrón de diseño:** Cada módulo es un **objeto JavaScript** con métodos (`render`, `save`, `delete`, `loadHistory`, etc.). El router en `app.js` escucha el hash de la URL (`#dashboard`, `#obreros`, etc.) y llama al `render()` del módulo correspondiente.

---

## 🛠️ Entorno de Desarrollo

| Herramienta | Uso |
|-------------|-----|
| VS Code | Editor de código |
| Live Server (extensión) | Servidor local en puerto 5500 |
| Chrome DevTools | Debug, IndexedDB inspector, console |
| Sin Node.js | No se requiere npm ni paquetes |
| Sin bundler | No webpack, no vite — archivos directos |

---

## 📝 Por qué estas tecnologías

**¿Por qué vanilla JS sin frameworks?**
- La app debe funcionar **offline en zonas rurales** con conexión limitada
- Cero dependencias = cero problemas de instalación
- Se abre con doble click en `index.html` o con Live Server
- Peso mínimo (~85 KB sin contar jsPDF)
- Cualquier persona con conocimiento básico de JS puede mantenerla

**¿Por qué IndexedDB y no localStorage?**
- `localStorage` tiene límite de 5MB y solo guarda strings
- IndexedDB soporta **cientos de MB**, almacena objetos, tiene índices para búsquedas rápidas
- Ideal para una app con miles de registros de jornales, ventas y comidas

**¿Por qué PWA?**
- Se instala como app nativa en celulares Android/iOS
- Funciona sin internet después de la primera carga
- El administrador de la finca puede usarla desde su celular en el campo
