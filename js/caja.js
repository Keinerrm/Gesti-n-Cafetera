/* ============================================
   caja.js — Tienda / Caja de la Finca (Mini-POS)
   Refactorizado: Premium Design System & One-Tap Sales
   ============================================ */

const Caja = {
    activeTab: 'ventas',
    _selectedObreroId: null,
    _modoContado: false,

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="animate-in">
                <div class="header-premium" style="margin-bottom:24px;">
                    <div style="display:flex; align-items:center; gap:16px">
                        <div class="header-icon" style="background:var(--color-primary); color:#fff; width:48px; height:48px; flex-shrink:0"><i data-lucide="shopping-cart" style="width:24px; height:24px"></i></div>
                        <div style="flex:1">
                            <h2 style="margin:0; font-size:1.3rem; font-weight:800; color:var(--text-main)">Punto de Venta</h2>
                            <p style="margin:4px 0 0 0; font-size:0.85rem; color:var(--text-muted); font-weight:500">Gestión de tienda, créditos de obreros y maestras de artículos</p>
                        </div>
                    </div>
                </div>

                <div class="tabs" style="margin-bottom:24px; display:flex; gap:8px">
                    <button class="btn-premium ${this.activeTab === 'ventas' ? 'primary' : 'secondary'} flex-1" onclick="Caja.switchTab('ventas')">
                        <i data-lucide="store"></i> Punto de Venta
                    </button>
                    <button class="btn-premium ${this.activeTab === 'productos' ? 'primary' : 'secondary'} flex-1" onclick="Caja.switchTab('productos')">
                        <i data-lucide="package"></i> Inventario
                    </button>
                    <button class="btn-premium ${this.activeTab === 'historico' ? 'primary' : 'secondary'}" onclick="Caja.switchTab('historico')">
                        <i data-lucide="history"></i>
                    </button>
                </div>

                <div id="cj-content" style="margin-bottom:32px"></div>
            </div>
            <style>
                .product-pos-card { background: var(--bg-surface-hover); border: 1px solid var(--border-color); border-radius: var(--border-radius-md); padding: 16px; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; }
                .product-pos-card:active { transform: scale(0.96); border-color: var(--color-primary); }
                .product-pos-card.no-stock { opacity: 0.5; pointer-events: none; filter: grayscale(1); }
                
                .worker-pos-selector { max-height: 250px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; border: 1px solid var(--border-color); border-radius: 12px; padding: 12px; }
            </style>
        `;

        Caja.renderTab();
    },

    switchTab(tab) {
        Caja.activeTab = tab;
        this.render();
    },

    async renderTab() {
        const container = document.getElementById('cj-content');
        if (!container) return;

        container.innerHTML = `<div style="padding:40px; text-align:center"><i data-lucide="loader-2" class="spin" style="width:32px;height:32px;color:var(--color-primary)"></i></div>`;
        if (window.lucide) window.lucide.createIcons();

        if (Caja.activeTab === 'ventas') {
            await Caja.renderPOS(container);
        } else if (Caja.activeTab === 'productos') {
            await Caja.renderProductos(container);
        } else {
            await Caja.renderHistorico(container);
        }
    },

    /* ========================================
       TAB 1: Punto de Venta (POS)
       ======================================== */
    async renderPOS(container) {
        const obreros = (await db.getByFinca('obreros')).filter(o => o.estado === 'activo');
        const productos = await db.getByFinca('productos');

        let html = ``;

        // STEP 1: Seleccionar Obrero
        if (!this._selectedObreroId) {
            html += `
                <div class="card-premium animate-in" style="margin-bottom:24px">
                    <div class="header-premium" style="margin-bottom:16px;">
                        <div class="header-icon" style="background:var(--bg-app); color:var(--color-primary)"><i data-lucide="users"></i></div>
                        <div>
                            <h3 style="margin:0; font-size:1.1rem">Seleccione Comprador</h3>
                            <p class="text-muted" style="font-size:0.85rem; margin:0">¿A qué trabajador se le cargará el consumo?</p>
                        </div>
                    </div>
                    
                    <div class="input-group" style="margin-bottom:16px">
                        <div style="position:relative">
                            <i data-lucide="search" style="position:absolute; left:16px; top:50%; transform:translateY(-50%); width:18px; color:var(--text-muted)"></i>
                            <input type="text" class="input-premium" id="pos-search-worker" placeholder="Buscar trabajador por nombre..." 
                                style="padding-left:44px" onkeyup="Caja.filterWorkersPOS(this.value)">
                        </div>
                    </div>

                    <div class="worker-pos-selector" id="pos-worker-list">
                        ${obreros.map(o => `
                            <div class="worker-row-premium" onclick="Caja.selectWorkerPOS(${o.id})" style="cursor:pointer; padding:12px; display:flex; align-items:center; gap:12px; border-bottom:1px solid var(--border-color)">
                                <div class="avatar" style="width:36px; height:36px; border-radius:10px; background:rgba(34, 197, 94, 0.1); color:var(--color-primary); display:flex; align-items:center; justify-content:center; font-weight:700">
                                    ${o.nombre.charAt(0)}
                                </div>
                                <span style="font-weight:600; font-size:1rem; flex:1">${o.nombre}</span>
                                <i data-lucide="chevron-right" style="color:var(--text-muted)"></i>
                            </div>
                        `).join('')
                }
                    </div>
                </div>
    `;
        } else {
            // STEP 2: POS Activo para un Obrero
            const obrero = obreros.find(o => o.id === this._selectedObreroId);

            // Calculate DEBT
            const todasVentas = await db.getAllByIndex('ventasCaja', 'obreroId', obrero.id);
            const ventasFiadoPendiente = todasVentas.filter(v => v.fiado && !v.pagado);
            const deudaTotal = ventasFiadoPendiente.reduce((sum, v) => sum + (v.valorTotal || 0), 0);

            html += `
    <!--Worker Anchor Banner-->
                <div class="card-premium animate-in" style="padding:16px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center; border:1px solid var(--color-primary)">
                    <div style="display:flex; align-items:center; gap:12px">
                        <div class="avatar" style="width:48px; height:48px; border-radius:12px; background:var(--color-primary); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:1.2rem">
                            ${obrero?.nombre.charAt(0)}
                        </div>
                        <div>
                            <div style="font-weight:700; font-size:1.1rem; color:var(--text-main)">${obrero?.nombre}</div>
                            <div style="font-size:0.85rem; color:var(--text-muted); cursor:pointer; text-decoration:underline" onclick="Caja.clearWorkerPOS()">Cambiar trabajador</div>
                        </div>
                    </div>
                    
                    <div style="text-align:right">
                        <div class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:700">Deuda Tienda</div>
                        <div class="tabular-data" style="font-size:1.4rem; font-weight:800; color:${deudaTotal > 0 ? 'var(--color-danger)' : 'var(--text-muted)'}">
                            $${deudaTotal.toLocaleString()}
                        </div>
                    </div>
                </div>

                <!--Modifiers -->
                <div class="card-premium" style="padding:12px 16px; margin-bottom:16px; background:var(--bg-app)!important; display:flex; justify-content:space-between; align-items:center">
                     <span style="font-weight:600; font-size:0.9rem; display:flex; align-items:center; gap:8px">
                        <i data-lucide="toggle-left" style="width:18px; color:var(--text-muted)" id="icon-modo"></i>
                        Modalidad de compra
                     </span>
                     <select class="input-premium" id="pos-modo" style="min-height:36px; padding:0 12px; width:auto; font-size:0.85rem; font-weight:700" onchange="Caja.toggleModoPOS(this.value)">
                        <option value="fiado" ${!this._modoContado ? 'selected' : ''}>A Crédito (Fiado) 🛒</option>
                        <option value="contado" ${this._modoContado ? 'selected' : ''}>Contado (Efectivo) 💵</option>
                     </select>
                </div>

                <!--Product Catalog(Táctil)-->
    ${productos.length === 0 ? `
                    <div class="empty-state card-premium text-center" style="padding:40px">
                        <i data-lucide="package-search" style="width:48px; height:48px; opacity:0.2; margin:0 auto 16px; display:block"></i>
                        <h3>Inventario Vacío</h3>
                        <p class="text-muted text-sm">Agrega productos desde la pestaña Inventario para poder facturar.</p>
                    </div>
                ` : `
                    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(140px, 1fr)); gap:12px">
                        ${productos.map(p => {
                const pv = p.precioVenta || p.precio || 0;
                const stockZero = p.stock !== undefined && p.stock === 0;
                const stockLabel = p.stock !== undefined ? p.stock + ' uds' : '∞';

                return `
                            <div class="product-pos-card ${stockZero ? 'no-stock' : 'animate-in'}" onclick="${stockZero ? '' : `Caja.registrarVenta1Tap(${p.id}, '${p.nombre.replace(/'/g, "\\'")}', ${pv})`}">
                                <div style="display:flex; justify-content:space-between; margin-bottom:12px">
                                    <div style="background:var(--bg-app); border-radius:8px; width:36px; height:36px; display:flex; align-items:center; justify-content:center">
                                        <i data-lucide="${Caja.getCategoryIcon(p.categoria)}" style="width:18px; color:var(--color-primary)"></i>
                                    </div>
                                    <span style="font-size:0.7rem; font-weight:700; color:var(--text-muted); background:var(--bg-app); padding:2px 6px; border-radius:4px; height:fit-content">
                                        ${stockLabel}
                                    </span>
                                </div>
                                
                                <div style="font-weight:600; font-size:0.9rem; line-height:1.2; margin-bottom:8px; color:var(--text-main)">
                                    ${p.nombre}
                                </div>
                                
                                <div class="tabular-data" style="font-weight:800; font-size:1.15rem; color:var(--color-primary)">
                                    $${pv.toLocaleString()}
                                </div>
                            </div>
                            `
            }).join('')}
                    </div>
                `}
`;
        }

        container.innerHTML = html;
        if (window.lucide) window.lucide.createIcons();
    },

    getCategoryIcon(cat) {
        cat = cat || '';
        const lower = cat.toLowerCase();
        if (lower.includes('aseo') || lower.includes('papel')) return 'spray-can';
        if (lower.includes('bebida') || lower.includes('cerveza') || lower.includes('jugo')) return 'cup-soda';
        if (lower.includes('dulce') || lower.includes('galleta') || lower.includes('panela')) return 'candy';
        if (lower.includes('cigarrillo')) return 'flame';
        if (lower.includes('comida') || lower.includes('arroz')) return 'wheat';
        return 'package';
    },

    filterWorkersPOS(query) {
        query = query.toLowerCase();
        const rows = document.querySelectorAll('#pos-worker-list .worker-row-premium');
        rows.forEach(row => {
            const name = row.querySelector('span').textContent.toLowerCase();
            row.style.display = name.includes(query) ? 'flex' : 'none';
        });
    },

    async selectWorkerPOS(id) {
        const today = new Date().toLocaleDateString('en-CA');
        const isLocked = await Ciclos.isDateLocked(today);
        if (isLocked) {
            return App.alert({
                title: '🔒 Período Cerrado',
                message: 'La contabilidad para el día de hoy ya se encuentra cerrada. No es posible iniciar transacciones en la tienda.',
                type: 'error'
            });
        }
        this._selectedObreroId = id;
        this.renderTab();
    },

    clearWorkerPOS() {
        this._selectedObreroId = null;
        this.renderTab();
    },

    toggleModoPOS(val) {
        this._modoContado = (val === 'contado');
        const icon = document.getElementById('icon-modo');
        if (icon) {
            icon.outerHTML = `<i data-lucide="toggle-${this._modoContado ? 'right' : 'left'}" style="width:18px; color:${this._modoContado ? 'var(--color-primary)' : 'var(--text-muted)'}" id="icon-modo"></i>`;
            if (window.lucide) window.lucide.createIcons();
        }
    },

    // LA MAGIA: VENTA 1-TAP
    async registrarVenta1Tap(productoId, productoNombre, precio) {
        if (!this._selectedObreroId) return;

        const fecha = new Date().toLocaleDateString('en-CA');
        const isLocked = await Ciclos.isDateLocked(fecha);
        if (isLocked) {
            return App.alert({
                title: '🔒 Período Cerrado',
                message: 'No es posible registrar consumos en fechas contables que ya fueron cerradas y liquidadas.',
                type: 'error'
            });
        }

        const cicloActivo = await db.getCicloActivo();
        if (!cicloActivo) {
            return App.alert({ title: 'Ciclo inactivo', message: 'No se pueden registrar ventas sin un ciclo contable activo abierto.', type: 'warning' });
        }

        const producto = await db.get('productos', productoId);
        if (!producto) return App.toast('Producto no encontrado', 'error');

        // Validar Stock
        if (producto.stock !== undefined && producto.stock !== null && producto.stock < 1) {
            return App.toast(`⚠️ No hay inventario de ${productoNombre} `, 'warning');
        }

        // Bloqueo interfaz temporalmente
        App.alert({ title: 'Registrando...', message: 'Generando comprobante virtual', type: 'info', icon: '⏳' });

        const fiado = !this._modoContado;
        const valorTotal = precio * 1;

        // Descontar Stock
        if (producto.stock !== undefined && producto.stock !== null) {
            producto.stock -= 1;
            await db.put('productos', producto);
        }

        const cicloId = cicloActivo.id;

        await db.add('ventasCaja', {
            obreroId: this._selectedObreroId,
            productoId,
            fecha,
            cantidad: 1,
            valorTotal,
            fiado,
            fincaId: db.getFincaActiva(),
            cicloId
        });

        // Close Alert
        const activeAlert = document.querySelector('.modal-system-overlay');
        if (activeAlert) activeAlert.remove();

        App.toast(`${productoNombre} asignado($${valorTotal.toLocaleString()}) - ${fiado ? 'Fiado 💳' : 'Efectivo 💵'} `, 'success');

        // Refresh POS to update debt / stock visually
        this.renderTab();
    },

    /* ========================================
       TAB 2: Inventario (Productos)
       ======================================== */
    async renderProductos(container) {
        const productos = await db.getByFinca('productos');

        container.innerHTML = `
            <div class="card-premium" style="margin-bottom:24px; display:flex; flex-direction:column; gap:16px;">
                <div class="header-premium" style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0">
                    <div style="display:flex; align-items:flex-start; gap:12px">
                        <div class="header-icon" style="background:var(--bg-surface-hover); color:var(--text-main); width:40px; height:40px"><i data-lucide="package" style="width:20px; height:20px"></i></div>
                        <div>
                            <h3 style="margin:0; font-size:1.1rem; font-weight:700">Catálogo de Productos</h3>
                            <p class="text-muted" style="margin:4px 0 0 0; font-size:0.8rem">Crear y administrar productos disponibles en el punto de venta</p>
                        </div>
                    </div>
                    <button class="btn-premium primary" style="flex-shrink:0" onclick="Caja.showProductoForm()">
                        <i data-lucide="plus"></i> Nuevo Artículo
                    </button>
                </div>
            </div>

    <div class="grid-2" id="productos-grid" style="gap:16px">
        ${productos.length === 0 ? `
                    <div class="empty-state card-premium text-center" style="grid-column:1/-1; padding:40px">
                        <i data-lucide="building-store" style="width:48px;height:48px;opacity:0.2;margin:0 auto 16px;display:block"></i>
                        <p>Catálogo vacío.</p>
                    </div>
                ` : productos.map(p => {
            const pv = p.precioVenta || p.precio || 0;
            const cc = p.costoCompra || 0;
            const margen = cc > 0 ? Math.round(((pv - cc) / cc) * 100) : null;
            const stockWarn = p.stock !== undefined && p.stock <= 3 && p.stock > 0;
            const stockZero = p.stock !== undefined && p.stock === 0;

            return `
                    <div class="card-premium" style="display:flex; flex-direction:column; padding:0; overflow:hidden; border:1px solid ${stockZero ? 'var(--color-danger)' : stockWarn ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-color)'}">
                        
                        <div style="padding:16px; display:flex; justify-content:space-between; align-items:flex-start">
                            <div style="display:flex; gap:12px; align-items:center">
                                <div style="background:var(--bg-surface-hover); border-radius:12px; width:48px; height:48px; display:flex; align-items:center; justify-content:center">
                                    <i data-lucide="${Caja.getCategoryIcon(p.categoria)}" style="color:var(--color-primary); width:24px; height:24px"></i>
                                </div>
                                <div style="display:flex; flex-direction:column; gap:4px">
                                    <h4 style="margin:0; font-size:1.1rem; font-weight:700; color:var(--text-main); line-height:1.2">${p.nombre}</h4>
                                    <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center">
                                        ${p.codigo ? `<span style="font-size:0.7rem; font-family:monospace; background:rgba(255,255,255,0.05); color:var(--text-secondary); padding:2px 6px; border-radius:4px; font-weight:600">${p.codigo}</span>` : ''}
                                        ${p.categoria ? `<span style="font-size:0.7rem; color:var(--text-muted); font-weight:500">${p.categoria}</span>` : ''}
                                    </div>
                                </div>
                            </div>
                            
                            <div class="btn-group" style="display:flex; gap:4px">
                                <button class="btn-icon-only text-muted" onclick='Caja.showProductoForm(${JSON.stringify(p).replace(/'/g, "&apos;")})' title="Editar" style="width:32px;height:32px">
                                    <i data-lucide="edit-2" style="width:16px;height:16px"></i>
                                </button>
                                <button class="btn-icon-only text-danger" onclick="Caja.deleteProducto(${p.id})" title="Eliminar" style="width:32px;height:32px">
                                    <i data-lucide="trash-2" style="width:16px;height:16px"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div style="background:rgba(0,0,0,0.15); padding:16px; border-top:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center; margin-top:auto">
                            <div style="display:flex; flex-direction:column; gap:2px">
                                <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700; letter-spacing:0.05em">Precio Público</div>
                                <div style="display:flex; align-items:flex-end; gap:8px">
                                    <span class="tabular-data" style="font-size:1.3rem; font-weight:800; color:var(--color-primary); line-height:1">$${pv.toLocaleString()}</span>
                                    ${margen !== null ? `<span style="font-size:0.75rem; color:var(--color-success); font-weight:700; background:rgba(22, 163, 74, 0.1); padding:2px 6px; border-radius:4px">+${margen}% ganancia</span>` : ''}
                                </div>
                            </div>
                            
                            <div style="display:flex; flex-direction:column; gap:2px; text-align:right">
                                <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; font-weight:700; letter-spacing:0.05em">Existencias</div>
                                <div class="tabular-data" style="font-size:1.3rem; font-weight:800; line-height:1; ${stockZero ? 'color:var(--color-danger)' : stockWarn ? 'color:var(--color-warning)' : 'color:var(--text-main)'}">
                                    ${p.stock !== undefined ? p.stock : 'Ilim.'}
                                </div>
                                ${stockZero ? `<div style="font-size:0.7rem; color:var(--color-danger); font-weight:800; text-transform:uppercase; margin-top:2px">Agotado</div>` : ''}
                            </div>
                        </div>

                    </div>
                `}).join('')}
    </div>
`;
        if (window.lucide) window.lucide.createIcons();
    },

    showProductoForm(producto = null) {
        const isEdit = producto !== null;
        const categorias = ['Cigarrillos', 'Dulces y Snacks', 'Bebidas e Hidratación', 'Aseo Personal', 'Útiles/Herramientas', 'Otros'];
        const pv = isEdit ? (producto.precioVenta || producto.precio || '') : '';
        const cc = isEdit ? (producto.costoCompra || '') : '';

        const html = `
            <div class="modal-system-overlay" onclick="Caja.closeModal(event)" style="display:flex;align-items:center;justify-content:center;padding:16px;">
                <div class="card-premium animate-in" onclick="event.stopPropagation()" style="width:100%; max-width:440px; padding:24px;">
                    <div class="header-premium" style="margin-bottom:24px;">
                        <div class="header-icon" style="background:var(--bg-surface-hover); color:var(--text-main)"><i data-lucide="${isEdit ? 'edit' : 'plus'}"></i></div>
                        <div style="flex:1">
                            <h3 style="margin:0; font-size:1.1rem">${isEdit ? 'Editar Artículo' : 'Nuevo Artículo'}</h3>
                            <p class="text-muted" style="font-size:0.85rem; margin:0">Ficha técnica del producto</p>
                        </div>
                        <button type="button" class="btn-icon-only" onclick="Caja.closeModal()" style="border:none; background:transparent"><i data-lucide="x"></i></button>
                    </div>

                    <form onsubmit="Caja.saveProducto(event, ${isEdit ? producto.id : 'null'})">

                <div class="input-group" style="margin-bottom:16px">
                    <label class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:700; margin-bottom:4px; display:block">Descripción comercial</label>
                    <input type="text" class="input-premium" id="pr-nombre" value="${isEdit ? producto.nombre : ''}" required placeholder="Ej. Gaseosa Postobon 400ml">
                </div>

                <div class="grid-2" style="margin-bottom:16px; gap:12px">
                    <div class="input-group" style="margin:0">
                        <label class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:700; margin-bottom:4px; display:block">Categoría</label>
                        <select class="input-premium" id="pr-categoria">
                            <option value="">Clasificación...</option>
                            ${categorias.map(c => `<option value="${c}" ${isEdit && producto.categoria === c ? 'selected' : ''}>${c}</option>`).join('')}
                        </select>
                    </div>
                    <div class="input-group" style="margin:0">
                        <label class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:700; margin-bottom:4px; display:block">Código (Auto)</label>
                        <input type="text" class="input-premium" id="pr-codigo" value="${isEdit ? (producto.codigo || '') : ''}" placeholder="Dejar vacío = AUTO" maxlength="10" style="text-transform:uppercase">
                    </div>
                </div>

                <div style="border-top:1px dashed var(--border-color); margin:20px 0; padding-top:20px">
                    <div class="grid-2" style="gap:12px">
                        <div class="input-group" style="margin:0">
                            <label class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:700; margin-bottom:4px; display:block"><i data-lucide="tag" style="width:12px;height:12px"></i> Precio Público ($)</label>
                            <input type="number" class="input-premium tabular-data" id="pr-precio" value="${pv}" required placeholder="0" min="0" style="color:var(--color-primary); font-weight:700">
                        </div>
                        <div class="input-group" style="margin:0">
                            <label class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:700; margin-bottom:4px; display:block"><i data-lucide="download" style="width:12px;height:12px"></i> Costo Proveedor</label>
                            <input type="number" class="input-premium tabular-data" id="pr-costo" value="${cc}" placeholder="0" min="0" style="background:var(--bg-app)">
                        </div>
                    </div>
                </div>

                <div class="input-group" style="margin-bottom:24px; background:var(--bg-app); padding:16px; border-radius:12px; border:1px solid var(--border-color)">
                    <label class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:700; margin-bottom:8px; display:flex; align-items:center; gap:6px"><i data-lucide="layers" style="width:14px"></i> Inventario Físico (Stock)</label>
                    <input type="number" class="input-premium tabular-data" id="pr-stock" value="${isEdit ? (producto.stock || 0) : ''}" min="0" placeholder="0" style="font-size:1.1rem; font-weight:700">
                        <small class="text-muted" style="display:block; margin-top:8px; font-size:0.75rem">El sistema avisará cuando llegue a 3 unidades o menos.</small>
                </div>

                <div class="btn-group" style="display:flex; gap:12px">
                    <button type="button" class="btn-premium secondary flex-1" onclick="Caja.closeModal()">Cancelar</button>
                    <button type="submit" class="btn-premium flex-1" style="background:var(--color-primary); color:#fff; border:none">${isEdit ? 'Actualizar Ficha' : 'Crear Producto'}</button>
                    </div>
                </form>
            </div>
        </div>
    `;
        document.body.insertAdjacentHTML('beforeend', html);
        if (window.lucide) window.lucide.createIcons();
    },

    async saveProducto(e, id) {
        e.preventDefault();
        const precioVenta = parseFloat(document.getElementById('pr-precio').value) || 0;
        let codigo = document.getElementById('pr-codigo').value.trim().toUpperCase();
        const categoria = document.getElementById('pr-categoria').value;
        const stockStr = document.getElementById('pr-stock').value;

        const data = {
            nombre: document.getElementById('pr-nombre').value.trim(),
            precio: precioVenta,  // Legacy fallback
            precioVenta,
            costoCompra: parseFloat(document.getElementById('pr-costo').value) || 0,
            stock: stockStr === '' ? 0 : parseInt(stockStr),
            categoria,
            fincaId: db.getFincaActiva()
        };

        if (!data.nombre) return App.toast('Debe dar un nombre al artículo', 'error');

        // Auto Code
        if (!codigo) {
            const prefix = (categoria || data.nombre).substring(0, 3).toUpperCase();
            const allProducts = await db.getByFinca('productos');
            const samePrefix = allProducts.filter(p => (p.codigo || '').startsWith(prefix) && p.id !== id);
            const num = String(samePrefix.length + 1).padStart(3, '0');
            codigo = prefix + num;
        }
        data.codigo = codigo;

        if (id) {
            data.id = id;
            await db.put('productos', data);
            App.toast('Catálogo actualizado', 'success');
        } else {
            await db.add('productos', data);
            App.toast('Artículo insertado al inventario', 'success');
        }
        Caja.closeModal();
        Caja.renderTab();
    },

    async deleteProducto(id) {
        App.confirm({
            title: 'Expulsar del Catálogo',
            message: '¿Está seguro de eliminar este producto definitivamente de la maestría?',
            confirmText: 'Sí, Expulsar',
            onConfirm: async () => {
                await db.delete('productos', id);
                App.toast('Expulsado.', 'info');
                Caja.renderTab();
            }
        });
    },

    /* ========================================
       TAB 3: Rastreabilidad Fina (Histórico + Edit manual)
       ======================================== */
    async renderHistorico(container) {
        const today = new Date().toLocaleDateString('en-CA');

        container.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                <p class="text-muted" style="margin:0; font-size:0.85rem">Historial de movimientos facturados</p>
                <input type="date" class="input-premium" id="cj-filter-fecha" value="${today}" onchange="Caja.loadHistoricoData()" style="width:auto; min-height:36px; padding:0 12px; font-weight:600">
            </div>

            <!--KPIs -->
            <div class="grid-2" style="margin-bottom:24px; gap:12px" id="hist-kpi-container">
                <!-- Se llenan por JS -->
            </div>

            <div class="table-wrapper card-premium" style="padding:0; overflow:hidden">
                <table style="width:100%; border-collapse:collapse">
                    <thead style="background:var(--bg-surface-hover); color:var(--text-muted); text-transform:uppercase; font-size:0.65rem; font-weight:700">
                        <tr>
                            <th style="padding:16px; text-align:left; border-bottom:1px solid var(--border-color)">Obrero</th>
                            <th style="padding:16px; text-align:left; border-bottom:1px solid var(--border-color)">Artículo</th>
                            <th style="padding:16px; text-align:right; border-bottom:1px solid var(--border-color)">Total ($)</th>
                            <th style="padding:16px; text-align:center; border-bottom:1px solid var(--border-color)">Modo</th>
                            <th style="padding:16px; text-align:center; border-bottom:1px solid var(--border-color)"></th>
                        </tr>
                    </thead>
                    <tbody id="ventas-body" class="tabular-data"></tbody>
                </table>
            </div>
`;

        Caja.loadHistoricoData();
    },

    async loadHistoricoData() {
        const filterFecha = document.getElementById('cj-filter-fecha')?.value || '';
        let ventas = await db.getByFinca('ventasCaja');
        const obreros = await db.getByFinca('obreros');
        const productos = await db.getByFinca('productos');

        const obMap = Object.fromEntries(obreros.map(o => [o.id, o.nombre]));
        const prMap = Object.fromEntries(productos.map(p => [p.id, p.nombre]));

        if (filterFecha) ventas = ventas.filter(v => v.fecha === filterFecha);
        ventas.sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id);

        const totalFiado = ventas.filter(v => v.fiado).reduce((s, v) => s + (v.valorTotal || 0), 0);
        const totalContado = ventas.filter(v => !v.fiado).reduce((s, v) => s + (v.valorTotal || 0), 0);

        const kpiContainer = document.getElementById('hist-kpi-container');
        if (kpiContainer) {
            kpiContainer.innerHTML = `
                <div class="card-premium" style="padding:16px; background:var(--bg-app)!important; border:1px solid rgba(239, 68, 68, 0.2)">
                    <div class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:700; display:flex; align-items:center; gap:6px"><i data-lucide="book-open" style="width:14px;color:var(--color-danger)"></i> Adeudado a Nómina</div>
                    <div style="font-size:1.5rem; font-weight:800; color:var(--color-danger)">$${totalFiado.toLocaleString()}</div>
                </div>
                <div class="card-premium" style="padding:16px; background:var(--bg-app)!important; border:1px solid rgba(34, 197, 94, 0.2)">
        <div class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:700; display:flex; align-items:center; gap:6px"><i data-lucide="coins" style="width:14px;color:var(--color-success)"></i> Caja Fuerte (Contado)</div>
        <div style="font-size:1.5rem; font-weight:800; color:var(--color-success)">$${totalContado.toLocaleString()}</div>
    </div>
`;
            if (window.lucide) window.lucide.createIcons();
        }

        const tbody = document.getElementById('ventas-body');
        if (tbody) {
            tbody.innerHTML = ventas.length === 0
                ? '<tr><td colspan="5" style="padding:40px; text-align:center; color:var(--text-muted)"><i data-lucide="ghost" style="width:40px;height:40px;opacity:0.2;margin:0 auto 12px;display:block"></i>Libro en blanco para hoy.</td></tr>'
                : ventas.map(v => `
                    <tr style="border-bottom:1px solid var(--border-color); ${v.pagado ? 'opacity:0.5; background:var(--bg-app)' : ''}">
                        <td style="padding:12px 16px;">
                            <div style="font-weight:600; font-size:0.85rem">${obMap[v.obreroId] || 'Eliminado'}</div>
                            <div class="text-muted" style="font-size:0.7rem">${v.fecha}</div>
                        </td>
                        <td style="padding:12px 16px;">
                            <div style="font-size:0.85rem">${prMap[v.productoId] || 'Desconocido'}</div>
                            <div class="text-muted" style="font-size:0.7rem">x${v.cantidad}</div>
                        </td>
                        <td style="padding:12px 16px; text-align:right" class="${v.fiado ? 'text-red' : 'text-green'}">
                            <strong>$${(v.valorTotal || 0).toLocaleString()}</strong>
                        </td>
                        <td style="padding:12px 16px; text-align:center">
                            ${v.pagado ?
                        '<span class="badge" style="background:var(--bg-surface-hover); color:var(--text-muted); border:1px solid var(--border-color); font-size:0.6rem">SALDADO</span>' :
                        v.fiado ?
                            '<span class="badge" style="background:rgba(239, 68, 68, 0.1); color:var(--color-danger); border:1px solid rgba(239, 68, 68, 0.2); font-size:0.6rem"><i data-lucide="book" style="width:8px;height:8px;margin-right:2px"></i>FIADO</span>' :
                            '<span class="badge" style="background:rgba(34, 197, 94, 0.1); color:var(--color-success); border:1px solid rgba(34, 197, 94, 0.2); font-size:0.6rem">EFECTIVO</span>'
                    }
                        </td>
                        <td style="padding:12px 16px; text-align:center">
                            ${!v.pagado ? `
                            <button type="button" class="btn-icon-only text-danger" onclick="Caja.removeVenta(${v.id})" title="Anular Movimiento" style="width:28px; height:28px; border:none; background:transparent; color:var(--color-danger)">
                                <i data-lucide="trash-2" style="width:14px; height:14px"></i>
                            </button>
                            ` : '-'}
                        </td>
                    </tr>
                `).join('');
            if (window.lucide) window.lucide.createIcons();
        }
    },

    async removeVenta(id) {
        const registro = await db.get('ventasCaja', id);
        if (registro && registro.cicloId) {
            const ciclo = await db.get('ciclos', registro.cicloId);
            if (ciclo && !ciclo.activo) {
                return App.alert({ title: 'Bloqueo Contable', message: 'No se pueden revertir ventas de nóminas ya pagadas en la vida real.', type: 'error' });
            }
        }
        if (registro && registro.pagado) {
            return App.toast('Esa deuda ya fue cobrada en nómina. Imposible anular.', 'warning');
        }

        App.confirm({
            title: 'Anular Transferencia',
            message: 'Eliminar esta venta borrará la deuda del trabajador. Si afecta a un producto con stock FÍSICO, la unidad volverá a los estantes.',
            confirmText: 'Anular Acto',
            onConfirm: async () => {
                // Revert stock
                if (registro.productoId) {
                    const prod = await db.get('productos', registro.productoId);
                    if (prod && prod.stock !== undefined && prod.stock !== null) {
                        prod.stock += (registro.cantidad || 1);
                        await db.put('productos', prod);
                    }
                }

                await db.delete('ventasCaja', id);
                App.toast('Factura revertida.', 'info');
                Caja.loadHistoricoData();
            }
        });
    },

    closeModal(e) {
        if (e && e.target !== e.currentTarget) return;
        const modal = document.querySelector('.modal-system-overlay');
        if (modal) modal.remove();
    }
};
