# ☕ CaféControl — Estado del Proyecto

> **Fecha:** 24 de mayo de 2026  
> **Versión:** 2.0 (Supabase & Obrero Integration)  
> **Estado:** En desarrollo activo — funcional con sincronización en la nube

---

## 🧑‍💻 Lenguajes y Tecnologías

### HTML5

El archivo `index.html` es el **esqueleto único** de toda la aplicación. CaféControl es una **SPA** (Single Page Application): el HTML define la estructura base (login, sidebar, área de contenido) y JavaScript se encarga de renderizar cada módulo dinámicamente dentro de `<main id="app">`.

**Se usa para:**
- Estructura semántica de la página.
- Formularios de login rediseñados con efecto glassmorphism y botón con cargador.
- Navegación optimizada (sidebar desktop + bottom nav mobile).
- Meta tags para PWA (manifest, theme-color, viewport) y soporte para notch.
- Carga de Supabase SDK y Google Fonts (Inter).

**Archivo:** `index.html` (390 líneas)

---

### CSS3 (Vanilla & Custom Utility Engine)

El sistema visual de la app está potenciado por tres archivos de estilo escritos a mano que gestionan la adaptabilidad del diseño mediante variables y clases de estilo avanzado (similares a Tailwind CSS).

**Archivos:**
- `css/styles.css` (2,071 líneas) — Diseño general de componentes, modales, toasts, animaciones y overrides premium.
- `css/themes.css` (626 líneas) — Paletas de colores dinámicas para los temas (Café, Light, Dark).
- `css/design-system.css` (243 líneas) — Sistema de tokens tipográficos, espaciados y sombras premium.

**Características CSS destacadas:**
| Técnica | Uso en el proyecto |
|---------|-------------------|
| CSS Variables | Control global del cambio de tema (Café, Claro, Oscuro). |
| Flexbox y Grid | Layouts responsivos de modales, grillas de stats y el grid del Portal de Obreros. |
| Glassmorphic Login | Efectos de desenfoque (`backdrop-filter`) de nivel cinematográfico en el Login. |
| Animations | Micro-animaciones e interactividad al enfocar campos, botones y transiciones de carga. |
| @media Queries | Grid dinámico que pasa de una columna en móvil a múltiples columnas en pantallas de escritorio. |
| @media print | Soporte de impresión optimizado para facturas y recibos de pago de obreros. |

---

### JavaScript (ES6+ Vanilla & Supabase Client)

La lógica de negocio y presentación está distribuida en **21 archivos JavaScript**, eliminando por completo la necesidad de frameworks pesados (React, Vue, Angular). Todo es código nativo altamente modular.

**Se usa para:**
- Integración en tiempo real con **Supabase** (Autenticación y Persistencia SQL).
- Router SPA que renderiza módulos de manera segura basándose en roles del usuario.
- Encriptación y validación de datos en cliente (`SHA-256` para contraseñas locales).
- Construcción y manipulación dinámica del DOM mediante plantillas de texto (Template Literals).
- Renderizado de estadísticas en tiempo real y descarga de reportes PDF dinámicos.

**Archivos y responsabilidades:**

| Archivo | Líneas | Responsabilidad |
|---------|--------|----------------|
| `app.js` | 741 | Router SPA principal, control de accesos (guards) por rol, autenticación, animaciones de login y notificaciones flotantes (Toasts). |
| `config.js` | 921 | Configuración de tarifas, base de usuarios administrativos, sincronización en nube y carga/vínculo dinámico de obreros a cuentas del sistema. |
| `pagos.js` | 867 | Liquidación de recolectores, descuentos de comida y tienda, exportación a WhatsApp y recibos. |
| `reportes.js` | 711 | Consultas analíticas de producción, exportación a CSV e integraciones con visor de reportes. |
| `comida.js` | 688 | Planilla de alimentación masiva con guardado automático y borradores persistentes. |
| `asistencia.js` | 679 | Calendario mensual interactivo de asistencia por trabajador. |
| `jornales.js` | 632 | Planilla rápida de recolección de café diario (individual y masiva). |
| `caja.js` | 576 | Punto de venta interno de la finca (caja registradora), registro de deudas y abonos. |
| `dashboard.js` | 576 | Métricas generales, selector de finca activa, gráficos rápidos de rendimiento y alertas proactivas. |
| `obreros.js` | 534 | Altas, bajas e historial de recolectores/obreros registrados en la finca. |
| `ciclos.js` | 501 | Control de períodos o ciclos de cosecha activos e históricos en la finca. |
| `mi-rendimiento.js` | 434 | **Portal del Obrero (Módulo Obrero)**: Vista responsiva optimizada para móviles que muestra a los recolectores su acumulado semanal, estimación de ganancias brutas/netas, historial de pesajes diarios y botón de cierre/cápsula de apariencias. |
| `db.js` | 379 | Capa de base de datos unificada que actúa como adaptador de consultas hacia el cliente de Supabase. |
| `pdf.js` | 252 | Configuración e inicialización de jsPDF para reportes y exportación física offline. |
| `transporte.js` | 208 | Registro de envíos de café y costos de transporte/fletes. |
| `historial.js` | 198 | Listados históricos de movimientos financieros y pesajes detallados. |
| `conversion.js` | 193 | Conversión y cálculo de rendimiento de café cereza a café pergamino seco. |
| `theme.js` | 164 | Lógica del motor de temas globales (Café, Light, Dark) con persistencia en localStorage. |
| `cascota.js` | 157 | Registro y control de café en pasilla / cáscara por lote. |
| `supabase.js` | 3 | Instanciador y configurador global del cliente Supabase. |

---

### Supabase & Base de Datos SQL

CaféControl ha migrado de una base puramente offline (IndexedDB) a una arquitectura **Cloud Híbrida con Supabase (PostgreSQL)**, permitiendo multi-dispositivo con control de acceso granular y seguridad a nivel de base de datos.

**Se usa para:**
- **Autenticación en la nube:** Control de inicio de sesión seguro para roles administrativos y obreros.
- **Roles en la base de datos:** `super_admin`, `admin`, `tienda`, `transporte`, `cuenta` y `obrero`.
- **Políticas de Seguridad RLS:** Restricciones estrictas para que los recolectores solo puedan consultar su información personal y registros propios de rendimiento.
- **Esquema Relacional:** Tablas para usuarios, obreros, jornales, comidas y configuraciones globales vinculadas dinámicamente.

---

### Service Worker + PWA

El Service Worker (`sw.js`) garantiza el funcionamiento de la SPA incluso en ubicaciones rurales sin señal móvil.

**Beneficios:**
- Estrategia **Cache-First** para activos estáticos (HTML, CSS, JS, Iconos).
- `manifest.json` configurado para comportamiento de aplicación standalone a pantalla completa.
- Pestaña agregable a pantallas de inicio de iOS y Android.

---

## 📁 Estructura del Proyecto

```
Gestion Cafetera/
│
├── index.html              ← SPA shell principal (390 líneas)
├── manifest.json           ← Configuración PWA
├── sw.js                   ← Service Worker offline
├── DOCUMENTACION.md        ← Guía de uso y APIs
├── ESTADO_PROYECTO.md      ← Este archivo
├── supabase_usuarios.sql   ← Migración de esquema y políticas RLS
│
├── css/
│   ├── design-system.css   ← Tokens y variables de diseño (243 líneas)
│   ├── styles.css          ← Todo el diseño interactivo (2,071 líneas)
│   └── themes.css          ← Definición de paletas de color (626 líneas)
│
├── js/
│   ├── lib/
│   │   └── jspdf.umd.min.js ← Librería local de generación de PDFs
│   │
│   ├── app.js              ← Router SPA, auth visual y notificaciones
│   ├── asistencia.js       ← Gestión de asistencia
│   ├── caja.js             ← Punto de venta e inventario
│   ├── cascota.js          ← Control de pasilla/cáscara
│   ├── ciclos.js           ← Ciclos de cosecha
│   ├── comida.js           ← Planilla de alimentación
│   ├── config.js           ← Gestión administrativa y vínculo de obreros
│   ├── conversion.js       ← Rendimientos de cereza a seco
│   ├── dashboard.js        ← Estadísticas generales y alertas
│   ├── db.js               ← Capa adaptador de base de datos
│   ├── historial.js        ← Auditorías de jornales
│   ├── jornales.js         ← Planilla de recolección diaria
│   ├── lotes.js            ← Administración de terrenos/lotes
│   ├── mi-rendimiento.js   ← Módulo/Portal Obrero premium
│   ├── obreros.js          ← Perfiles de recolectores
│   ├── pagos.js            ← Liquidación y facturas de pago
│   ├── pdf.js              ← Controlador jsPDF
│   ├── reportes.js         ← Exportaciones analíticas
│   ├── supabase.js         ← Cliente global de Supabase
│   └── theme.js            ← Gestor visual de color de la app
│
└── .vscode/
    └── mcp.json            ← Ajustes locales de desarrollo (Ignorado en Git)
```

---

## 📊 Métricas Actuales

| Métrica | Valor |
|---------|-------|
| Archivos totales | ~30 |
| Líneas de JavaScript | **~9,638** |
| Líneas de CSS | **~2,940** |
| Líneas de HTML | **~390** |
| **Total de código fuente** | **~12,968 líneas** |
| Módulos funcionales | 16 |
| Base de Datos Principal | **Supabase (PostgreSQL Cloud)** |
| Frameworks Frontend | **0 (Pure Vanilla ES6+)** |

---

## 🚀 Funcionalidades Especiales de la Versión 2.0

1. **Portal Obrero de Alto Rendimiento**:
   - Acceso exclusivo para usuarios con rol `obrero` para consultar su actividad semanal de manera privada.
   - Resumen visual con barra de progreso circular para kilos acumulados.
   - Desglose de ingresos estimados (Kilos recolectados × tarifa) y descuentos de comida.
   - Historial en lista móvil con scroll infinito de jornales recientes.

2. **Administración de Usuarios con Vínculo Dinámico**:
   - Integración con base de datos de trabajadores activos.
   - Al crear un usuario, permite vincularlo con un "Obrero" existente mediante un dropdown.
   - Autocompleta automáticamente cédula, celular y nombre, agilizando el flujo del administrador.

3. **Experiencia de Inicio de Sesión Cinemática**:
   - Fondo enriquecido con desenfoque de cristal (backdrop blur).
   - Botón interactivo con estado de carga ("Validando...") que previene envíos múltiples.
   - Opción para visualizar contraseñas usando un botón con icono del ojo (Lucide SVG).

4. **Selector de Apariencia con Cápsula Unida**:
   - Menú flotante ubicado en el encabezado (Header), justo al lado del botón "Salir".
   - Control horizontal con diseño premium de pastilla que agrupa los tres temas de CaféControl: **Café** (Coffee), **Claro** (Sun) y **Oscuro** (Moon).
   - Animación fluida de selección activa y persistencia de tema.
