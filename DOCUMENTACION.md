# ☕ CaféControl — Sistema de Gestión Cafetera

> PWA offline para administrar fincas cafeteras.  
> Construido con HTML, CSS, JavaScript vanilla e IndexedDB.  
> **Última actualización**: 7 de marzo de 2026

---

## 📌 ¿Qué es?

Una aplicación web progresiva (PWA) que funciona **sin internet** para gestionar todas las operaciones de una finca cafetera: trabajadores, recolección de café, alimentación, tienda, pagos y reportes.

**Contraseña por defecto:** `1234`

---

## 📁 Estructura de Archivos

```
Gestion Cafetera/
├── index.html              → Página principal (SPA shell)
├── manifest.json           → Configuración PWA
├── sw.js                   → Service Worker (cache offline)
├── css/
│   └── styles.css          → Todos los estilos (tema oscuro café)
└── js/
    ├── db.js               → Base de datos (IndexedDB)
    ├── app.js              → Router SPA + autenticación
    ├── dashboard.js        → Panel principal con métricas
    ├── obreros.js          → Gestión de trabajadores
    ├── lotes.js            → Gestión de lotes de café
    ├── jornales.js         → Registro de recolección diaria
    ├── asistencia.js       → Calendario de asistencia
    ├── comida.js           → Control de alimentación
    ├── caja.js             → Tienda / punto de venta
    ├── cascota.js          → Tracking de cáscara de café
    ├── conversion.js       → Conversión café rojo → mojado
    ├── ciclos.js           → Períodos semanales de pago
    ├── transporte.js       → Registro de fletes y transporte
    ├── pagos.js            → Liquidación y recibos
    ├── reportes.js         → Reportes con exportación CSV
    └── config.js           → Configuración del sistema
```

---

## 🗄️ Base de Datos (IndexedDB)

La app usa **IndexedDB** como base de datos local del navegador. Se crea automáticamente al abrir la app por primera vez.

### Stores (tablas)

| Store | Descripción | Campos principales |
|-------|-------------|-------------------|
| `obreros` | Trabajadores | id, nombre, documento, telefono, estado |
| `lotes` | Parcelas de café | id, nombre, variedad, area |
| `jornales` | Registro diario de recolección | obreroId, loteId, fecha, kilosAM, kilosPM, kilosRecolectados, tipoPago, totalDia |
| `asistencia` | Asistencia por día | obreroId, fecha, tipo (completa/media/falta/domingo) |
| `comida` | Consumo de comida | obreroId, fecha, tipo (desayuno/almuerzo/cena), valor |
| `productos` | Inventario de tienda | nombre, categoria, precio, stock |
| `ventasCaja` | Ventas de la tienda | obreroId, productoId, fecha, valorTotal, fiado, pagado |
| `cascota` | Cáscara de café | loteId, fecha, kilos |
| `conversion` | Conversión rojo→mojado | fecha, kilosRojo, kilosMojado, factor |
| `pagos` | Liquidaciones realizadas | obreroId, fechaPago, totalGanado, netoAPagar, cicloId |
| `ciclos` | Semanas de producción | nombre, fechaInicio, fechaFin, activo, totalPagado |
| `transportes` | Fletes de café | id, fecha, loteId, transportista, latasMojado, precioLataMojado, latasCascota, precioLataCascota, total, notas, fincaId, cicloId, createdAt |
| `config` | Configuración del sistema | key, value |

### Configuración por defecto

| Clave | Valor | Descripción |
|-------|-------|-------------|
| `tarifaKilo` | $500 | Pago por kilo recolectado |
| `tarifaDia` | $40,000 | Pago por día de trabajo |
| `tarifaDomingo` | $60,000 | Pago domingo/festivo |
| `precioDesayuno` | $3,000 | Precio del desayuno |
| `precioAlmuerzo` | $5,000 | Precio del almuerzo |
| `precioCena` | $3,000 | Precio de la cena |
| `factorConversion` | 0.5 | Factor café rojo → mojado |
| `password` | 1234 | Contraseña de acceso |

---

## 📱 Módulos (12)

### 1. 📊 Dashboard

**Archivo:** `js/dashboard.js`

Panel principal que muestra un resumen de toda la operación:

- **KPIs**: kilos hoy, kilos semana, kilos mes, total pagado, obreros activos
- **Top 5 lotes**: gráfico de barras con los lotes más productivos
- **Top 5 recolectores**: ranking con medallas (🥇🥈🥉)
- **Gráfico 7 días**: curva de recolección de la última semana
- **Gastos**: resumen de comida + tienda + cascota

---

### 2. 👷 Obreros

**Archivo:** `js/obreros.js`

Gestión completa de trabajadores:

- **Crear/Editar/Eliminar** obreros con formulario modal
- **Campos**: nombre, documento, teléfono, estado (activo/inactivo)
- **Búsqueda** en tiempo real por nombre
- **Perfil detallado** con estadísticas:
  - Total días trabajados
  - Total kilos recolectados
  - Total ganado
  - Deuda acumulada (comida + tienda)

---

### 3. 🌿 Lotes

**Archivo:** `js/lotes.js`

Gestión de parcelas/lotes de café:

- CRUD completo con cards visuales
- Cada card muestra:
  - Nombre y variedad del lote
  - **Total kilos** recolectados (calculado automáticamente)
  - **Total cascota** producida

---

### 4. 📊 Jornales y Producción

**Archivo:** `js/jornales.js`

Registro de la recolección diaria con **dos modos**:

#### ⚡ Registro Rápido (Planilla)
Tabla con **todos los obreros activos** para registrar kilos en masa:
- Seleccionar fecha, lote y tipo de pago una sola vez
- Cada fila tiene campos: **🌅 Mañana** y **🌇 Tarde**
- Total por obrero calculado automáticamente
- Fila de **TOTALES** al fondo (sticky)
- Preview: "5 obreros con datos · 385 kg · $192,500"
- Botón **"Guardar Todos"** registra todo de un clic
- Navegación rápida con **Tab**

#### 👤 Registro Individual
Formulario clásico para un solo obrero:
- Fecha, obrero, lote, tipo de pago
- Kilos mañana + kilos tarde = total
- Cálculo automático del pago

#### Tipos de pago
- **Por kilo**: kilos × tarifa/kg
- **Por día**: tarifa fija diaria

#### Historial
- Filtros por fecha, obrero, lote
- KPIs: registros, kilos AM, kilos PM, total kilos, total a pagar
- Tabla con columnas: Fecha, Obrero, Lote, AM, PM, Total, Tipo, Valor

---

### 5. 📅 Asistencia

**Archivo:** `js/asistencia.js`

Calendario visual mensual:

- Seleccionar obrero y mes
- Click en cada día para cambiar estado:
  - ✅ Completa → 🔶 Media → ❌ Falta → 🔵 Domingo → ⬜ Vacío
- Navegación mes a mes (← →)
- Resumen de conteos al fondo

---

### 6. 🍽️ Consumo de Comida

**Archivo:** `js/comida.js`

Control de alimentación con **dos modos**:

#### ⚡ Registro Rápido (Planilla de Checkboxes)
Tabla con todos los obreros activos y columnas de checkboxes:

| Obrero | ☕ Desayuno | 🍛 Almuerzo | 🌙 Cena | 🍽️ Completa |

**Comportamiento:**
- Marcar **Completa** → marca automáticamente las 3 comidas
- Desmarcar cualquier comida → desmarca Completa
- **Click en el nombre** del obrero → marca comida completa
- **Botones rápidos**: "Desayuno a todos", "Almuerzo a todos", "Cena a todos", "Completa a todos"
- **Contadores en tiempo real**: Desayunos: X, Almuerzos: X, Cenas: X, Total: $XX
- **Autoguardado**: borrador se guarda en `localStorage` automáticamente
- Al recargar: "¿Deseas restaurar el borrador?"
- Tabla con scroll interno (`max-height: 500px`) para 40+ obreros

#### 👤 Registro Individual
Formulario para un obrero:
- Selección de tipo: Desayuno, Almuerzo, Cena, Completa
- Valor personalizado opcional

#### Precios (configurables)
- ☕ Desayuno: $3,000
- 🍛 Almuerzo: $5,000
- 🌙 Cena: $3,000
- 🍽️ Completa: $11,000 (suma de las 3)

---

### 7. 🛒 Caja / Tienda

**Archivo:** `js/caja.js`

Punto de venta con tres pestañas:

#### Ventas
- Seleccionar obrero, producto, cantidad
- Opción **"Fiado"** (se descuenta en la liquidación)
- Historial de ventas con filtros

#### Productos
- CRUD de productos (nombre, categoría, precio, stock)
- Actualización automática de stock al vender

#### Reporte
- Ventas agrupadas por producto
- Total vendido y cantidades

---

### 8. 🌾 Cascota

**Archivo:** `js/cascota.js`

Control de cáscara de café por lote:

- Registro: lote, fecha, kilos
- Resumen acumulado por lote (tabla)
- Historial filtrable por fecha y lote

---

### 9. 🔄 Conversión de Café

**Archivo:** `js/conversion.js`

Conversión de café rojo a café mojado:

- Ingresar kilos de café rojo
- Factor configurable (por defecto 0.5)
- Cálculo automático: `rojo × factor = mojado`
- Historial de conversiones
- Totales acumulados

---

### 10. 💰 Pagos y Liquidación

**Archivo:** `js/pagos.js`

Cálculo automático de pagos con descuentos:

#### Proceso de liquidación
1. Seleccionar obrero y rango de fechas
2. El sistema calcula automáticamente:

```
Total Ganado (jornales del período)
- Descuento comida
- Descuento tienda (fiado)
= NETO A PAGAR
```

#### Descuento de fiado (tienda)
- Muestra la **deuda total** de tienda con detalle de productos
- **Checkbox toggle** para activar/desactivar el descuento
- Al confirmar pago, las ventas fiadas se marcan como **pagadas**

#### Detalle de liquidación
- Tabla de jornales (fecha, lote, AM, PM, total, tipo, valor)
- Tabla de comidas consumidas
- Lista de compras fiadas
- Resumen: ganado - comida - fiado = neto

#### Acciones
- **✅ Pagar y Liquidar**: registra el pago en la base de datos
- **🧾 Ver Recibo**: comprobante imprimible con:
  - Datos del obrero
  - Período y kilos
  - Desglose de montos
  - Botón imprimir
  - Botón compartir por **WhatsApp**
- **Historial** de pagos registrados

---

### 11. 📋 Reportes

**Archivo:** `js/reportes.js`

Tres tipos de reporte:

#### Por Obrero
- Seleccionar obrero
- Tabla con: días, kilos, ganado, comida, caja, neto

#### Por Lote
- Seleccionar lote
- Tabla con: producción total, obreros que trabajaron, cascota

#### General Finca
- Resumen completo: total kilos, total pagado, total comida, promedio/día

#### Exportación
- Cada reporte tiene botón **"Exportar CSV"**
- Archivo descargable con encoding UTF-8 BOM (compatible con Excel)

---

### 12. ⚙️ Configuración

**Archivo:** `js/config.js`

#### Tarifas de trabajo
- Tarifa por kilo
- Tarifa por día
- Tarifa domingo/festivo

#### Precios de comida
- Desayuno, almuerzo, cena

#### Conversión
- Factor de conversión (rojo → mojado)

#### Seguridad
- Cambiar contraseña de acceso

#### Respaldo
- **Exportar**: descarga toda la base de datos como archivo JSON
- **Importar**: restaura la app desde archivo JSON
- **Cerrar sesión**

---

## 🎨 Diseño

- **Tema oscuro café** con gradientes y glassmorphism
- **Colores**: fondo `#0f0d0a`, cards `#221e19`, accent `#c8956c`
- **Tipografía**: Inter (Google Fonts)
- **Responsive**:
  - Desktop (>768px): sidebar fija a la izquierda
  - Mobile (≤768px): sidebar oculta, bottom nav con menú "Más"
- **Componentes**: cards, modals, toasts, badges, tabs, calendar, stat-cards, charts

---

## 📲 PWA (Progressive Web App)

| Característica | Detalle |
|---------------|---------|
| Instalable | Se puede agregar a pantalla de inicio en Android/iOS |
| Offline | Funciona sin internet (Service Worker cache-first) |
| Manifest | Nombre, colores, modo standalone |
| Datos | Almacenados en IndexedDB (persisten offline) |

---

## 🔐 Autenticación

- Pantalla de login al abrir la app
- Contraseña almacenada en IndexedDB (`config.password`)
- Sesión guardada en `sessionStorage` (se pierde al cerrar pestaña)
- Fallback a contraseña `1234` si IndexedDB no está disponible

---

## 🚀 Cómo Usar

### Opción 1: Abrir directamente
```
Doble click en index.html
```
> ⚠️ Puede requerir segundo intento de login en protocolo `file://`

### Opción 2: Servidor local (recomendado)
```bash
npx -y serve . -l 3000
```
Abrir: `http://localhost:3000`

### Opción 3: Python
```bash
python -m http.server 3000
```

---

## 📊 Métricas del Proyecto

| Métrica | Valor |
|---------|-------|
| Archivos | 18 |
| Total JavaScript | ~155 KB |
| Módulos funcionales | 12 |
| Object stores IDB | 11 |
| Dependencias externas | **0** |
| Frameworks | **Ninguno** |
