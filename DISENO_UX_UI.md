# Propuesta de Rediseño UX/UI: CaféControl

> **Rol:** Diseñador UX/UI Senior
> **Versión del Documento:** 1.0.0
> **Tipo de Sistema:** Progressive Web App (PWA) Offline-First / Mobile-First Dashboard
> **Dominio:** SaaS para Gestión de Fincas Cafeteras

---

## 1. Sistema de Diseño (Design System)

Para lograr un aspecto premium, empresarial y eliminar el aspecto lúdico o básico de los emojis, introducimos un *Design System* sobrio, confiable y orientado a la productividad.

### Paleta de Colores Profesional
La interfaz debe evocar la naturaleza agrícola pero manteniendo la seriedad de una herramienta financiera (liquidaciones, pagos).

- **Color Primario (Accent):** `#16A34A` (Verde Esmeralda/Cafeto). Se usarán variaciones como `#15803D` para estados *hover* en botones principales.
- **Color Secundario (Destacados/Brand):** `#B45309` (Marrón Tierra/Tostado). Se usarán variaciones sutiles para detalles, iconos activos o estados de deuda/liquidación.
- **Fondo General (Background - Modo Oscuro):** `#111827` (Gris Azulado Profundo). Un modo oscuro real reduce la fatiga visual de los capataces bajo el sol y ahorra batería en dispositivos OLED. Alternativa para tarjetas: `#1F2937` (Gris Intermedio).
- **Fondo General (Background - Modo Claro):** `#F3F4F6` (Gris Neutro Cálido). Alternativa para tarjetas o superficies elevadas: `#FFFFFF` Puro.
- **Colores Semánticos Funcionales:**
  - *Éxito / Ingresos:* `#10B981`
  - *Advertencia / Deuda / Gastos:* `#EF4444` o `#F59E0B`
  - *Informativo / Neutro:* `#3B82F6`

### Tipografía Recomendada
Reemplazar fuentes del sistema por tipografías web modernas, legibles a nivel de datos.
- **Primaria (Títulos y Headers):** `Inter` o `Outfit`. (Limpias, geométricas, excelentes en pesos gruesos).
- **Secundaria (Datos, Tablas y Cuerpos de Texto):** `Inter` o `Roboto`.
- **Cifras Monetarias y Pesos:** Usar la variante tabular de la fuente CSS `font-variant-numeric: tabular-nums;` para que los números en tablas y liquidaciones se alineen perfectamente en columnas.

### Estilos Generales
- **Espaciado y Jerarquía Visual:** Sistema de grilla de 4px (`0.25rem`). Padding estándar en tarjetas de `16px` o `24px`. Márgenes grandes entre secciones para no agobiar de datos.
- **Botones:** Bordes ligeramente redondeados (`border-radius: 6px` o `8px`). Sombras sutiles en reposo, presión visible al hacer clic (`transform: scale(0.98)`).
- **Tarjetas (Cards):** Superficies planas con bordes finos (ej. `border: 1px solid #E5E7EB` en claro, o `border: 1px solid #374151` en oscuro). Sombra perimetral muy suave `box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1)`.
- **Formularios:** Inputs de tamaño grande (`min-height: 48px`). Etiquetas claras encima del input. Focus state fuertemente marcado con un anillo de color (`ring: 2px solid #16A34A`).
- **Tablas:** Limpias, sin líneas divisorias verticales, padding espacioso en las celdas, zebra-striping muy sutil o separación única por `border-bottom` sutil.
- **Modales:** Elevados con `backdrop-filter: blur(4px)` en el fondo, cierre visible y botones de acción en la base alineados a la derecha.

---

## 2. Layout General de la Aplicación

CaféControl se utilizará mayoritariamente en móviles durante el trabajo de campo, y eventualmente en escritorio/tablets para administración (Liquidaciones y Dashboard). Se propone un esquema responsivo universal.

### En Dispositivos Móviles (Menos de 768px - Principal)
- **Barra Superior (Top App Bar):** Muy delgada. Muestra el Título de la vista actual ("Jornales", "Asistencia"), la semana activa en pequeño y un botón de Perfil o Notificaciones a la derecha.
- **Área de Contenido:** Contenedor fluid (`width: 100%; padding: 16px`). Permite scroll vertical libre para largas listas de trabajadores.
- **Navegación Inferior (Bottom Navigation Bar):** Fija, al alcance de los pulgares. 4 o 5 pestañas principales usando iconografía limpia (Dashboard, Jornales, Personal, Tienda/Caja, Pagos). Quitar el menú hamburguesa que requiere doble acción.

### En Dispositivos de Escritorio / Tablets (Mayor a 768px)
- **Barra Lateral Izquierda (Sidebar):** Fija. Contiene el isotipo "CaféControl" y el menú expandido con todos los módulos. Opción de colapsarse.
- **Barra Superior:** Búsqueda global, estado del Ciclo y perfil del administrador.
- **Área de Contenido (Main Panel):** Superficie de visualización amplia con sistema de columnas para mostrar gráficos y tablas extendidas en paralelo.

---

## 3. Rediseño de cada Módulo

### 1. Trabajadores (Personal)
- **Estructura Visual:** Lista vertical estilo "Directorio". Arriba, un campo de búsqueda prominente flotante y filtro (Activos/Inactivos).
- **Componentes:** *User Cards* modulares. Cada tarjeta muestra Foto/Avatar genérico elegante (letras del nombre, no emojis), Nombre, Rol en un 'Badge' (Píldora) diminuto, y un ícono chevron derecho `>` indicando expansión. Botón de FAB (Floating Action Button) abajo a la derecha, para "Añadir Nuevo".

### 2. Lotes
- **Estructura Visual:** Vista de cuadrícula (Grid) de tarjetas. Cada tarjeta debe parecer una "Parcela".
- **Interacción:** Las tarjetas muestran el Nombre del lote en grande, la variedad y el tamaño (Hectáreas). Un gráfico circular de progreso diminuto o barra de "kg recolectados esta semana" dentro de la misma tarjeta del lote le da un feeling analítico premium.

### 3. Jornales (El Core de Captura Rápida)
- **Estructura Visual:** Esta interfaz debe ser la más rápida. Arriba: Selección de Lote (Dropdown premium o Botones Toggle grandes). Medio: Buscador/Filtro reactivo. Abajo: Lista de obreros listos para el pesaje.
- **Componentes:** Renglón por obrero. A la izquierda su nombre; al centro el Total acumulado hoy (texto de apoyo); a la derecha, un *Input numérico in-line* súper rápido con dos botones tipo `Stepper` al lado del input (`-` y `+` para ajustes rápidos de báscula) y un botón de "Guardar" estilo Check (`✓`) verde que confirma sin recargar.

### 4. Asistencia
- **Estructura Visual:** Matrices tipo tablero de control. Un renglón por empleado.
- **Componentes:** Botones tipo *Segmented Controls* (`[Presente] [Ausente] [Permiso]`) que cambian de color sólido (Verde/Rojo/Gris) al tocarse. Feedback visual inmediato sin necesidad de botón de "Enviar todo".

### 5. Comida / Caja
- **Estructura Visual:** Similar al de jornadas pero con feeling financiero/transaccional. Split view en escritorio, o tabs en móvil (`Tab: Ingresar Tienda | Tab: Efectivo Caja`).
- **Componentes:** Input grande monetario (con prefijo de divisa `$`). Al seleccionar el empleado, mostrar de forma limpia el `Saldo Deudor Actual:` para evitar sobre-endeudamientos, pintado de naranja si se acerca al umbral del sueldo proyectado.

### 6. Liquidación y Pagos
- **Estructura Visual:** Diseño estilo *Statement / Factura Bancaria*. Formato limpio, apto para impresión en tiqueteras.
- **Jerarquía:** Lista general agrupada. Al expandir a un obrero, se ve una vista detallada: Título: "[Nombre]". Gran encabezado numérico: "Neto a Pagar: $X,XXX". Debajo, desglose a dos columnas (Derecha: Abonos, Izquierda: Descuentos). Todo en fuente monoespaciada o de tabla.
- **Interacción:** Botón ancho, sólido y prominente "Aprobar y Pagar", que activa un modal de confirmación irreversible.

### 7. Dashboard Inicial
- **Estructura Visual:** Cartas de reporte con estilo de herramienta BI (Business Intelligence).
- **Componentes:** 
  - *Hero Widget (Top):* KPI principales: "Ciclo Actual", "Total Kg Hoy", "Nómina Estimada Global". 
  - Gráficos de barra sutiles (Ej. Librería nativa o CSS) mostrando recolección Lunes vs Martes.
  - *Recent Activity Feed:* Una lista de las últimas 5 transacciones registradas, dando vida al sistema (ej. "Hace 5m: Juan Pérez recolectó 15kg en Lote Norte").

---

## 4. Componentes Reutilizables (Vanilla JS y CSS Semántico)

La creación del CSS se basará en clases de utilidad estandarizadas o en un patrón BEM, evitando la importación de frameworks pesados (Bootstrap/Tailwind runtime), ganando velocidad para PWA.

1. **`.card-base`**:
   Un bloque blanco/gris con radio 8px, padding 16px, `box-shadow` suave y transición de 200ms al *hover*.
2. **`.input-premium`**:
   Input sin borde nativo, delimitado por un pseudo-estado debajo (`border-bottom`) o mediante un input contorneado claro, letras color sólido, placeholder gris, label flotante que reduce su tamaño al ganar *focus*.
3. **`.btn-primary` / `.btn-secondary` / `.btn-danger`**:
   No usar iconos genéricos ASCII. Todos deben tener padding `12px 24px`, fuente negrita 500, transiciones y un icono SVG alineado verticalmente (`display: flex; gap: 8px; align-items: center`).
4. **`.badge-status`**:
   Píldoras para definir si un lote está inactivo o un obrero está pagado. Ej: `.badge-success` (Fondo Verde transparente 20%, Letras Verdes 100%).
5. **`.data-table-modern`**:
   Sobrescribir el estilo feo nativo de `<table>`. El `thead` con color sutil, letra mayúscula minúscula (`text-transform: uppercase`, `font-size: 0.75rem`), y márgenes anchos.

---

## 5. Iconografía Profesional

Para desterrar los Emojis 🚜 ☕ 👨‍🌾 de las etiquetas y volver un producto "SaaS", se debe integrar un sistema visual coherente mediante SVGs ligeros inyectados localmente o una fuente mínima.

### Librerías Sugeridas (Carga Local o In-line SVGs)
1. **Lucide Icons** (Altamente recomendada): Continuación de Feather Icons. Lineal, neutra, respira bien con grosor de línea de `2px`. Se ve moderna.
2. **Heroicons** (Creada por el equipo de Tailwind): Muy pulida para UIs de formularios y Dashboards.
3. **Phosphor Icons**: Excelente para dashboards por su variante dual-tone y consistencia.

### Dónde usar cada ícono
- **Navegación / Menú:** Lucide de 24px (ej. `users` para Personal, `leaf` o `map` para Lotes, `scale` para Jornales, `shopping-cart` para Tienda, `wallet` para Liquidación, `layout-dashboard` para inicio).
- **Acciones Directas:** SVG de 16px (ej. `plus` [Nuevo], `trash-2` [Borrar rojo], `edit-3` [Editar], `check-circle` [Aprobar]).
- **Vistas Vacías (Empty States):** Una ilustración isométrica SVG genérica si no hay datos de nómina, o un icono gris central y grande `inbox` indicando "No hay registros hoy". Evita el sentimiento de aplicación vacía o rota.

---

## 6. Mejores Prácticas UX para Apps usadas en el Campo Agrícola

1. **Ley de Fitts (Botones Grandes):** Las interfaces en campo se usan con manos ocupadas, luz cegadora y dedos imprecisos/mojados o en movimiento constante ("sobre una mula"). Las áreas tocables (`touch targets`) no deben ser menores a `48px x 48px`.
2. **Contraste Aumentado / Anti-Glare:** El uso nativo al aire libre reduce la visibilidad de la pantalla. Textos importantes (Nombres, Números en $, Kilos), deben tener contraste de `WCAG AAA` (mínimo 7:1) respecto a su fondo.
3. **Formularios Súper Rápidos sin Teclados Complejos:**
   - Usar `type="tel"` en lugar de `type="number"` en móviles (invoca un teclado numérico mucho más grande).
   - El input debe autoseleccionar su contenido en el primer tap (`onfocus="this.select()"`), así al teclear reemplazan el `0` por `15` al instante de presionar las teclas en lugar de usar `015`.
4. **Navegación Clara y Sin Escondites:** Mantener siempre visible la acción primaria en un "Botón Fijo Flotante" (FAB) si el módulo es de listas eternas.
5. **Feedback Háptico y Visual Inmediato:** En Javascript puro, cada inserción exitosa de datos en `db.js` debe arrojar un Toast (Notificación diminuta en el fondo superior) verde que diga "✅ Guardado". Considerar usar `navigator.vibrate(50)` opcional para que el capataz sienta "el clic de registro" al pesar, para no depender sólo de mirar la pantalla cada que guarda un obrero.

---

## 7. Propuesta de Estilo Visual Premium (SaaS Appearance)

### El "Paso de Básico a Profesional" a través de HTML/CSS/JS Puro

- **Eliminar Elementos "Boxy":** Quitar los bordes fuertes en negro nativo e inputs cuadrados predeterminados del navegador. Reemplazarlos por contenedores que agrupan información (Layout).
- **Glassmorphism Táctico (Opcional minimalista):** El borde superior adherido a la pantalla puede contar con `backdrop-filter: blur(10px)` y `background-color: rgba(255, 255, 255, 0.8)`. Esto da efecto de "pantalla viva" y quita de inmediato ese aspecto de sistema primitivo nativo de los 2000s; denota sistema moderno OS y aplicación premium iOS/Android.
- **Tipografía y Tensión Espacial:** En lugar de aumentar el tamaño del texto para destacar, aprovecha el peso. Ej.: En liquidaciones `Neto: `<span style="font-weight: 800; font-size: 1.5rem">`$ 15,300`</span>. Dejar *aire* blanco alrededor de este dato eleva de forma inmediata el estándar visual al percibir un sistema que "respira".

### Ejemplo de "Limpieza de Componente":

*Antiguo/Básico:*
```html
<div>🧑‍🌾 Nombre: Juan Perez - KILOS: 15 <button>Ok</button></div>
```

*Nuevo Rediseño Moderno (Concepto DOM):*
```html
<div class="user-row">
  <div class="user-info">
    <div class="avatar">JP</div>
    <div class="details">
      <span class="name">Juan Perez</span>
      <span class="role">Recolector Activo</span>
    </div>
  </div>
  <div class="action-pad">
    <input type="tel" class="input-light-weigh" placeholder="0" />
    <span class="unit-label">kg</span>
  </div>
</div>
```

Este acercamiento, completamente realizable ensamblando *vanilla CSS variables*, transformará **CaféControl** no sólo en una herramienta ingenieril potente (por su sólida base offline) sino en un atractivo dashboard de grado comercial o SaaS con potencial para estandarizar la industria cafetera.
