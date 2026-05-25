/* ============================================
   obreros.js — Gestión de Obreros
   Modificado con Premium Design System
   ============================================ */

const Obreros = {
    activeTab: 'activos',

    async render() {
        const obrerosAll = await db.getByFinca('obreros');

        // Asign defaults for legacy data inline dynamically
        const obreros = obrerosAll.map(o => {
            if (!o.estado) o.estado = 'activo';
            return o;
        });

        const activos = obreros.filter(o => o.estado === 'activo');
        const inactivos = obreros.filter(o => o.estado === 'inactivo');

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="animate-in">
                <div class="header-premium" style="justify-content: space-between; flex-wrap: wrap;">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <div class="header-icon"><i data-lucide="users"></i></div>
                        <div>
                            <h2>Personal</h2>
                            <p>Gestión de trabajadores de la finca</p>
                            <div style="display:flex;gap:1rem;margin-top:0.25rem;font-size:0.8rem">
                                <span style="color:var(--color-primary)"><strong>${activos.length}</strong> Activos</span>
                                <span style="color:var(--text-muted)"><strong>${inactivos.length}</strong> Inactivos</span>
                            </div>
                        </div>
                    </div>
                    <button class="btn-premium primary" onclick="Obreros.showForm()">
                        <i data-lucide="user-plus"></i>
                        <span class="desktop-only" style="margin-left:4px">Nuevo Obrero</span>
                    </button>
                </div>

                ${this.activeTab !== 'expediente' ? `
                <div class="search-box mb-2" style="position:relative; margin-bottom:16px;">
                    <i data-lucide="search" style="position:absolute; left:16px; top:50%; transform:translateY(-50%); color:var(--text-muted); width:20px; height:20px"></i>
                    <input type="text" class="input-premium" id="search-obreros" placeholder="Buscar por nombre o documento..." oninput="Obreros.filter(this.value)" style="padding-left:48px;">
                </div>
                ` : ''}

                <div class="tabs mb-2" style="display:flex; gap:8px; margin-bottom:24px;">
                    <button class="btn-premium ${this.activeTab === 'activos' ? 'primary' : 'secondary'} flex-1" onclick="Obreros.switchTab('activos')">
                        <i data-lucide="user-check"></i> Activos (${activos.length})
                    </button>
                    <button class="btn-premium ${this.activeTab === 'inactivos' ? 'primary' : 'secondary'} flex-1" onclick="Obreros.switchTab('inactivos')">
                        <i data-lucide="user-minus"></i> Inactivos (${inactivos.length})
                    </button>
                    <button class="btn-premium ${this.activeTab === 'expediente' ? 'primary' : 'secondary'} flex-1" onclick="Obreros.switchTab('expediente')">
                        <i data-lucide="folder-heart"></i> Expediente Único
                    </button>
                </div>

                <div id="obreros-list">
                    ${this.activeTab === 'activos'
                ? (activos.length === 0 ? '<div class="empty-state" style="padding:40px; text-align:center; color:var(--text-muted)"><i data-lucide="users" style="width:48px;height:48px;opacity:0.2;display:block;margin:0 auto 16px"></i>No hay obreros activos.</div>' : activos.map(o => Obreros.renderItem(o)).join(''))
                : this.activeTab === 'inactivos'
                ? (inactivos.length === 0 ? '<div class="empty-state" style="padding:40px; text-align:center; color:var(--text-muted)"><i data-lucide="users" style="width:48px;height:48px;opacity:0.2;display:block;margin:0 auto 16px"></i>No hay obreros inactivos.</div>' : inactivos.map(o => Obreros.renderItem(o)).join(''))
                : ''
            }
                </div>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        if (this.activeTab === 'expediente') {
            await Obreros.renderExpedienteInterface(document.getElementById('obreros-list'));
        }
    },

    switchTab(tab) {
        this.activeTab = tab;
        this.render();
    },

    renderItem(o) {
        const initials = o.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        const isInactive = o.estado === 'inactivo';

        return `
            <div class="worker-row-premium" style="${isInactive ? 'opacity:0.75;' : ''}">
                <div class="worker-info" onclick="Obreros.showDetail(${o.id})" style="cursor:pointer; flex:1;">
                    <div class="worker-avatar" style="${isInactive ? 'background:var(--bg-surface-hover); color:var(--text-muted)' : 'background:rgba(22, 163, 74, 0.1); color:var(--color-primary)'}">${initials}</div>
                    <div class="worker-details">
                        <h3>${o.nombre} <span class="badge ${isInactive ? '' : 'badge-active'}" style="margin-left:8px; font-size:0.65rem; padding:2px 6px; ${isInactive ? 'background:var(--bg-surface-hover); color:var(--text-muted)' : ''}">${o.estado}</span></h3>
                        <span class="text-muted tabular-data" style="font-size:0.8rem">Doc: ${o.documento || 'N/A'} &middot; Tel: ${o.telefono || 'N/A'}</span>
                    </div>
                </div>
                <div class="worker-action" style="gap:8px">
                    <button class="btn-icon-only" onclick="Obreros.showForm(${JSON.stringify(o).replace(/"/g, '&quot;')})" title="Editar" style="border:none;background:transparent;width:36px;height:36px">
                        <i data-lucide="pencil" style="width:18px;height:18px"></i>
                    </button>
                    <button class="btn-icon-only" onclick="Obreros.showHistorial(${o.id})" title="Ver Historial" style="border:none;background:transparent;width:36px;height:36px">
                        <i data-lucide="bar-chart-2" style="width:18px;height:18px"></i>
                    </button>
                    ${!isInactive
                ? `<button class="btn-icon-only" onclick="Obreros.desactivar(${o.id})" title="Desactivar" style="border:none;background:rgba(239, 68, 68, 0.1);color:var(--color-danger);width:36px;height:36px"><i data-lucide="user-minus" style="width:18px;height:18px"></i></button>`
                : `<button class="btn-icon-only" onclick="Obreros.reactivar(${o.id})" title="Reactivar" style="border:none;background:rgba(22, 163, 74, 0.1);color:var(--color-primary);width:36px;height:36px"><i data-lucide="user-check" style="width:18px;height:18px"></i></button>`}
                </div>
            </div>
        `;
    },

    async filter(query) {
        const obrerosAll = await db.getByFinca('obreros');
        const q = query.toLowerCase();

        const obreros = obrerosAll.map(o => {
            if (!o.estado) o.estado = 'activo';
            return o;
        }).filter(o => o.estado === this.activeTab.slice(0, -1)); // 'activos' -> 'activo'

        const filtered = obreros.filter(o =>
            o.nombre.toLowerCase().includes(q) ||
            (o.documento && o.documento.toLowerCase().includes(q))
        );
        document.getElementById('obreros-list').innerHTML = filtered.length === 0
            ? '<div class="empty-state" style="padding:40px; text-align:center; color:var(--text-muted)"><i data-lucide="search-x" style="width:48px;height:48px;opacity:0.2;display:block;margin:0 auto 16px"></i>No se encontraron resultados</div>'
            : filtered.map(o => Obreros.renderItem(o)).join('');

        if (window.lucide) window.lucide.createIcons();
    },

    showForm(obrero = null) {
        const isEdit = obrero !== null;
        const html = `
            <div class="modal-system-overlay" onclick="Obreros.closeModal(event)" style="display:flex;align-items:center;justify-content:center;padding:16px;">
                <div class="card-premium animate-in" onclick="event.stopPropagation()" style="width:100%; max-width:500px; padding:24px; max-height:90vh; overflow-y:auto">
                    <div class="header-premium" style="margin-bottom:24px;">
                        <div class="header-icon"><i data-lucide="${isEdit ? 'user-cog' : 'user-plus'}"></i></div>
                        <div style="flex:1">
                            <h3 style="margin:0; font-size:1.2rem">${isEdit ? 'Editar Obrero' : 'Nuevo Obrero'}</h3>
                        </div>
                        <button class="btn-icon-only" onclick="Obreros.closeModal()" style="border:none; background:transparent"><i data-lucide="x"></i></button>
                    </div>
                    
                    <form onsubmit="Obreros.save(event, ${isEdit ? obrero.id : 'null'})">
                        <div class="input-group" style="margin-bottom:16px">
                            <label class="text-muted" style="font-size:0.8rem;text-transform:uppercase;font-weight:600;display:block;margin-bottom:8px">Nombre completo</label>
                            <input type="text" class="input-premium" id="ob-nombre" value="${isEdit ? obrero.nombre : ''}" required placeholder="Ej: Juan Pérez">
                        </div>
                        <div class="grid-2" style="margin-bottom:16px">
                            <div class="input-group">
                                <label class="text-muted" style="font-size:0.8rem;text-transform:uppercase;font-weight:600;display:block;margin-bottom:8px">Documento</label>
                                <input type="text" class="input-premium tabular-data" id="ob-documento" value="${isEdit ? (obrero.documento || '') : ''}" required maxlength="10" oninput="this.value = this.value.replace(/[^0-9]/g, '')" placeholder="Cédula">
                            </div>
                            <div class="input-group">
                                <label class="text-muted" style="font-size:0.8rem;text-transform:uppercase;font-weight:600;display:block;margin-bottom:8px">Teléfono</label>
                                <input type="tel" class="input-premium tabular-data" id="ob-telefono" value="${isEdit ? (obrero.telefono || '') : ''}" required maxlength="15" oninput="this.value = this.value.replace(/[^0-9+]/g, '')" placeholder="Número celular">
                            </div>
                        </div>
                        <div class="input-group" style="margin-bottom:16px">
                            <label class="text-muted" style="font-size:0.8rem;text-transform:uppercase;font-weight:600;display:block;margin-bottom:8px">Fecha de ingreso</label>
                            <input type="date" class="input-premium" id="ob-fecha" value="${isEdit ? (obrero.fechaIngreso || '') : new Date().toLocaleDateString('en-CA')}">
                        </div>
                        ${isEdit ? `
                            <div class="input-group" style="margin-bottom:24px">
                                <label class="text-muted" style="font-size:0.8rem;text-transform:uppercase;font-weight:600;display:block;margin-bottom:8px">Estado</label>
                                <select class="input-premium" id="ob-estado">
                                    <option value="activo" ${obrero.estado === 'activo' ? 'selected' : ''}>Activo (Trabajando)</option>
                                    <option value="inactivo" ${obrero.estado === 'inactivo' ? 'selected' : ''}>Inactivo (Retirado)</option>
                                </select>
                            </div>
                        ` : '<div style="margin-bottom:24px"></div>'}
                        
                        <div class="btn-group" style="display:flex; gap:12px; margin-top:24px">
                            <button type="button" class="btn-premium secondary flex-1" onclick="Obreros.closeModal()">Cancelar</button>
                            <button type="submit" class="btn-premium primary flex-1">
                                <i data-lucide="check"></i> ${isEdit ? 'Actualizar' : 'Guardar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
        if (window.lucide) window.lucide.createIcons();
    },

    async save(e, id) {
        e.preventDefault();
        const data = {
            nombre: document.getElementById('ob-nombre').value.trim(),
            documento: document.getElementById('ob-documento').value.trim(),
            telefono: document.getElementById('ob-telefono').value.trim(),
            fechaIngreso: document.getElementById('ob-fecha').value,
            estado: id ? document.getElementById('ob-estado')?.value || 'activo' : 'activo'
        };

        if (!data.nombre) return App.toast('Nombre es obligatorio', 'error');
        if (!data.documento) return App.toast('El documento es obligatorio', 'error');
        if (!data.telefono) return App.toast('El teléfono es obligatorio', 'error');

        if (id) {
            data.id = id;
            const currentObj = await db.get('obreros', id);

            if (currentObj.estado === 'activo' && data.estado === 'inactivo') {
                data.fechaRetiro = new Date().toLocaleDateString('en-CA');
            } else if (currentObj.estado === 'inactivo' && data.estado === 'activo') {
                data.fechaRetiro = null;
            } else {
                data.fechaRetiro = currentObj.fechaRetiro || null;
            }

            await db.put('obreros', data);
            App.toast('Obrero actualizado', 'success');
        } else {
            await db.add('obreros', data);
            App.toast('Obrero registrado', 'success');
        }

        Obreros.closeModal();
        Obreros.render();
    },

    async desactivar(id) {
        const obrero = await db.get('obreros', id);
        if (!obrero) return;

        App.confirmDelete({
            title: 'Desactivar Obrero',
            message: `¿Desactivar a <strong>${obrero.nombre}</strong>? No aparecerá en listados de nómina activos, pero mantendrá su historial.`,
            confirmText: 'Desactivar',
            icon: '📉',
            onConfirm: async () => {
                obrero.estado = 'inactivo';
                obrero.fechaRetiro = new Date().toLocaleDateString('en-CA');
                await db.put('obreros', obrero);
                App.toast('Obrero inactivado', 'info');
                Obreros.render();
            }
        });
    },

    async reactivar(id) {
        const obrero = await db.get('obreros', id);
        if (!obrero) return;

        App.confirm({
            title: 'Reactivar Obrero',
            message: `¿Volver a activar a <strong>${obrero.nombre}</strong>?`,
            confirmText: 'Reactivar',
            icon: '✨',
            onConfirm: async () => {
                obrero.estado = 'activo';
                obrero.fechaRetiro = null;
                await db.put('obreros', obrero);
                App.toast('Obrero reactivado', 'success');
                Obreros.render();
            }
        });
    },

    async showDetail(id) {
        const obrero = await db.get('obreros', id);
        if (!obrero) return;

        const cicloActivo = await db.getCicloActivo();
        let precioKilo = 0;
        if (cicloActivo) {
            precioKilo = cicloActivo.precioKilo || cicloActivo.precio_kilo || cicloActivo.tarifaKilo;
        }
        if (!precioKilo) {
            precioKilo = await db.getConfig('tarifaKilo', 500);
        }
        if (!precioKilo || precioKilo <= 0) {
            precioKilo = 1000;
        }

        const jornales = await db.getAllByIndex('jornales', 'obreroId', id);
        const totalKilos = jornales.reduce((s, j) => s + (parseFloat(j.kilosRecolectados) || 0), 0);
        const totalGanado = jornales.reduce((s, j) => {
            const kilosJornal = parseFloat(j.kilosRecolectados) || (parseFloat(j.kilosAM || 0) + parseFloat(j.kilosPM || 0)) || 0;
            let valorJornal = parseFloat(j.totalDia) || 0;
            if (valorJornal <= 0) {
                if (j.tipoPago === 'dia') {
                    valorJornal = parseFloat(j.tarifaDia) || 40000;
                } else {
                    const tarifaK = parseFloat(precioKilo) || 1000;
                    valorJornal = kilosJornal * tarifaK;
                }
            }
            return s + valorJornal;
        }, 0);
        const diasTrabajados = jornales.length;

        const comidas = await db.getAllByIndex('comida', 'obreroId', id);
        const totalComida = comidas.reduce((s, c) => s + (c.valor || 0), 0);

        const ventas = await db.getAllByIndex('ventasCaja', 'obreroId', id);
        const totalCaja = ventas.filter(v => v.fiado).reduce((s, v) => s + (v.valorTotal || 0), 0);

        const isInactive = obrero.estado === 'inactivo';

        const html = `
            <div class="modal-system-overlay" onclick="Obreros.closeModal(event)" style="display:flex;align-items:center;justify-content:center;padding:16px;">
                <div class="card-premium animate-in" onclick="event.stopPropagation()" style="width:100%; max-width:550px; padding:24px; max-height:90vh; overflow-y:auto">
                    
                    <div class="header-premium" style="margin-bottom:16px;">
                        <div class="header-icon" style="${isInactive ? 'background:var(--bg-surface-hover);color:var(--text-muted)' : ''}"><i data-lucide="user"></i></div>
                        <div style="flex:1">
                            <h3 style="margin:0; font-size:1.4rem; line-height:1.2">${obrero.nombre}</h3>
                            <div style="margin-top:4px"><span class="badge ${isInactive ? '' : 'badge-active'}" style="${isInactive ? 'background:var(--bg-surface-hover); color:var(--text-muted)' : ''}">${obrero.estado}</span></div>
                        </div>
                        <button class="btn-icon-only" onclick="Obreros.closeModal()" style="border:none; background:transparent"><i data-lucide="x"></i></button>
                    </div>

                    <div style="background:var(--bg-app); border-radius:var(--border-radius-md); padding:16px; margin-bottom:24px; border:1px solid var(--border-color)">
                        <div class="grid-2 tabular-data" style="gap:12px">
                            <div><span class="text-muted" style="font-size:0.8rem;text-transform:uppercase;font-weight:600">Doc:</span> <br>${obrero.documento || 'N/A'}</div>
                            <div><span class="text-muted" style="font-size:0.8rem;text-transform:uppercase;font-weight:600">Tel:</span> <br>${obrero.telefono || 'N/A'}</div>
                            <div><span class="text-muted" style="font-size:0.8rem;text-transform:uppercase;font-weight:600">Ingreso:</span> <br>${obrero.fechaIngreso || 'N/A'}</div>
                            <div><span class="text-muted" style="font-size:0.8rem;text-transform:uppercase;font-weight:600">Retiro:</span> <br>${obrero.fechaRetiro || '-'}</div>
                        </div>
                    </div>
                    
                    <div class="text-muted" style="font-size:0.85rem; text-transform:uppercase; font-weight:700; margin-bottom:12px">Resumen Global</div>
                    <div class="grid-2 mb-2" style="margin-bottom:24px; gap:8px">
                        <div class="card-premium" style="padding:12px; background:var(--bg-app)!important">
                            <div class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:600; margin-bottom:4px">Días trabajados</div>
                            <div style="font-size:1.2rem; font-weight:700">${diasTrabajados}</div>
                        </div>
                        <div class="card-premium" style="padding:12px; background:var(--bg-app)!important">
                            <div class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:600; margin-bottom:4px">Total kilos</div>
                            <div style="font-size:1.2rem; font-weight:700">${totalKilos.toLocaleString()}</div>
                        </div>
                        <div class="card-premium" style="padding:12px; background:var(--bg-app)!important">
                            <div class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:600; margin-bottom:4px">Ganancias Brutas</div>
                            <div class="tabular-data" style="font-size:1.2rem; font-weight:700; color:var(--color-primary)">$${totalGanado.toLocaleString()}</div>
                        </div>
                        <div class="card-premium" style="padding:12px; background:var(--bg-app)!important">
                            <div class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:600; margin-bottom:4px">Deuda Historica</div>
                            <div class="tabular-data" style="font-size:1.2rem; font-weight:700; color:var(--color-danger)">$${(totalComida + totalCaja).toLocaleString()}</div>
                        </div>
                    </div>
                    
                    <div class="btn-group" style="display:flex; gap:8px;">
                        <button class="btn-premium secondary flex-1" onclick="Obreros.closeModal(); Obreros.showForm(${JSON.stringify(obrero).replace(/"/g, '&quot;')})">
                            <i data-lucide="pencil"></i> Editar
                        </button>
                        <button class="btn-premium flex-1" style="background:var(--color-info);color:#fff" onclick="Obreros.closeModal(); Obreros.showHistorial(${id})">
                            <i data-lucide="bar-chart-2"></i> Historial
                        </button>
                        ${obrero.estado === 'activo'
                ? `<button class="btn-icon-only" style="background:rgba(239, 68, 68, 0.1);color:var(--color-danger);border-color:transparent" onclick="Obreros.closeModal(); Obreros.desactivar(${id})"><i data-lucide="user-minus"></i></button>`
                : `<button class="btn-icon-only" style="background:rgba(22, 163, 74, 0.1);color:var(--color-primary);border-color:transparent" onclick="Obreros.closeModal(); Obreros.reactivar(${id})"><i data-lucide="user-check"></i></button>`}
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
        if (window.lucide) window.lucide.createIcons();
    },

    async showHistorial(id) {
        const obrero = await db.get('obreros', id);
        if (!obrero) return;

        const cicloActivo = await db.getCicloActivo();
        let precioKilo = 0;
        if (cicloActivo) {
            precioKilo = cicloActivo.precioKilo || cicloActivo.precio_kilo || cicloActivo.tarifaKilo;
        }
        if (!precioKilo) {
            precioKilo = await db.getConfig('tarifaKilo', 500);
        }
        if (!precioKilo || precioKilo <= 0) {
            precioKilo = 1000;
        }

        // Fetch all related records
        const jornales = await db.getAllByIndex('jornales', 'obreroId', id);
        const comidas = await db.getAllByIndex('comida', 'obreroId', id);
        const ventas = await db.getAllByIndex('ventasCaja', 'obreroId', id);
        const pagosAll = await db.getAllByIndex('pagos', 'obreroId', id);
        const pagos = pagosAll.filter(p => p.estado !== 'anulado');

        const lotes = await db.getByFinca('lotes');
        const ltMap = Object.fromEntries(lotes.map(l => [l.id, l.nombre]));
        const productos = await db.getByFinca('productos');
        const prMap = Object.fromEntries(productos.map(p => [p.id, p.nombre]));

        // Calculate Totals
        const totalJornales = jornales.reduce((s, j) => s + (j.totalDia || 0), 0);
        const totalComida = comidas.reduce((s, c) => s + (c.valor || 0), 0);
        const ventasFiado = ventas.filter(v => v.fiado);
        const totalTienda = ventasFiado.reduce((s, v) => s + (v.valorTotal || 0), 0);
        const totalPagado = pagos.reduce((s, p) => s + (p.netoAPagar || 0), 0);

        const saldoActual = totalJornales - totalComida - totalTienda - totalPagado;

        // Merge and Map events into a unified timeline array
        let timeline = [];

        jornales.forEach(j => {
            const kilosJornal = parseFloat(j.kilosRecolectados) || (parseFloat(j.kilosAM || 0) + parseFloat(j.kilosPM || 0)) || 0;
            let valorJornal = parseFloat(j.totalDia) || 0;
            if (valorJornal <= 0) {
                if (j.tipoPago === 'dia') {
                    valorJornal = parseFloat(j.tarifaDia) || 40000;
                } else {
                    const tarifaK = parseFloat(precioKilo) || 1000;
                    valorJornal = kilosJornal * tarifaK;
                }
            }
            timeline.push({ fecha: j.fecha, tipo: 'Jornal', detalle: `${ltMap[j.loteId] || 'Lote'} (${kilosJornal}kg)`, valor: valorJornal, styleClass: 'color:var(--color-primary)', isPago: false, obj: j });
        });
        comidas.forEach(c => {
            timeline.push({ fecha: c.fecha, tipo: 'Comida', detalle: c.tipo, valor: -c.valor, styleClass: 'color:var(--color-danger)', isPago: false, obj: c });
        });
        ventasFiado.forEach(v => {
            timeline.push({ fecha: v.fecha, tipo: 'Tienda', detalle: prMap[v.productoId] || v.descripcion || 'Compra', valor: -v.valorTotal, styleClass: 'color:var(--color-danger)', isPago: false, obj: v });
        });
        pagos.forEach(p => {
            timeline.push({ fecha: p.fechaPago, tipo: 'Liquidación', detalle: `(${p.fechaInicio} al ${p.fechaFin})`, valor: -(p.totalGanado - (p.descComida || 0) - (p.descCaja || 0)), displayValor: -p.netoAPagar, styleClass: 'color:var(--text-muted)', isPago: true, obj: p });
        });

        // Sort chronological
        timeline.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

        Obreros._currentPdfData = {
            obrero, totalJornales, totalComida, totalTienda, totalPagado, saldoActual, timeline
        };

        const html = `
            <div class="modal-system-overlay" onclick="Obreros.closeModal(event)" style="display:flex;align-items:center;justify-content:center;padding:16px;">
                <div class="card-premium animate-in" onclick="event.stopPropagation()" style="width:100%; max-width:650px; padding:24px; max-height:95vh; display:flex; flex-direction:column">
                    
                    <div class="header-premium" style="margin-bottom:16px; flex-shrink:0;">
                        <div class="header-icon" style="background:var(--color-info); color:#fff"><i data-lucide="bar-chart-2"></i></div>
                        <div style="flex:1">
                            <h3 style="margin:0; font-size:1.2rem; line-height:1.2">Historial: ${obrero.nombre}</h3>
                            <div style="font-size:0.8rem; color:var(--text-muted); margin-top:2px">Doc: ${obrero.documento || 'N/A'} &middot; Ingreso: ${obrero.fechaIngreso || 'N/A'}</div>
                        </div>
                        <button class="btn-icon-only" onclick="Obreros.closeModal()" style="border:none; background:transparent"><i data-lucide="x"></i></button>
                    </div>

                    <div class="grid-4 tabular-data" style="gap:8px; margin-bottom:16px; flex-shrink:0;">
                        <div class="card-premium" style="padding:10px; background:var(--bg-app)!important">
                            <div class="text-muted" style="font-size:0.7rem; text-transform:uppercase; font-weight:600; margin-bottom:4px">Jornales</div>
                            <div style="font-size:1.1rem; font-weight:700; color:var(--color-primary)">$${totalJornales.toLocaleString()}</div>
                        </div>
                        <div class="card-premium" style="padding:10px; background:var(--bg-app)!important">
                            <div class="text-muted" style="font-size:0.7rem; text-transform:uppercase; font-weight:600; margin-bottom:4px">Gastos</div>
                            <div style="font-size:1.1rem; font-weight:700; color:var(--color-danger)">-$${(totalComida + totalTienda).toLocaleString()}</div>
                        </div>
                        <div class="card-premium" style="padding:10px; background:var(--bg-app)!important">
                            <div class="text-muted" style="font-size:0.7rem; text-transform:uppercase; font-weight:600; margin-bottom:4px">Pagados</div>
                            <div style="font-size:1.1rem; font-weight:700; color:var(--text-muted)">-$${totalPagado.toLocaleString()}</div>
                        </div>
                        <div class="card-premium" style="padding:10px; background:var(--bg-surface-hover)!important; border-color:var(--color-brand)!important">
                            <div class="text-muted" style="font-size:0.7rem; text-transform:uppercase; font-weight:600; margin-bottom:4px">Saldo Final</div>
                            <div style="font-size:1.1rem; font-weight:700; ${saldoActual >= 0 ? 'color:var(--color-primary)' : 'color:var(--color-danger)'}">$${saldoActual.toLocaleString()}</div>
                        </div>
                    </div>

                    <div class="tabs" style="display:flex; gap:8px; margin-bottom:16px; flex-shrink:0;">
                        <button class="btn-premium primary flex-1" id="btn-tab-ob-todo" onclick="Obreros.verTabHistorial('todo')" style="font-size:0.9rem">
                            Línea de Vida
                        </button>
                        <button class="btn-premium secondary flex-1" id="btn-tab-ob-pagos" onclick="Obreros.verTabHistorial('pagos')" style="font-size:0.9rem">
                            Nóminas Pagadas
                        </button>
                    </div>

                    <div id="ob-content-todo" style="flex:1; overflow-y:auto; min-height:200px; margin-bottom:16px; border:1px solid var(--border-color); border-radius:var(--border-radius-md);">
                        <table style="width:100%; border-collapse:collapse;">
                            <thead style="position:sticky; top:0; background:var(--bg-surface-hover); color:var(--text-muted); font-size:0.75rem; text-transform:uppercase; font-weight:700; z-index:10;">
                                <tr>
                                    <th style="padding:12px 16px; text-align:left; border-bottom:1px solid var(--border-color)">Fecha</th>
                                    <th style="padding:12px 16px; text-align:left; border-bottom:1px solid var(--border-color)">Tipo</th>
                                    <th style="padding:12px 16px; text-align:left; border-bottom:1px solid var(--border-color)">Detalle</th>
                                    <th style="padding:12px 16px; text-align:right; border-bottom:1px solid var(--border-color)">Valor ($)</th>
                                </tr>
                            </thead>
                            <tbody class="tabular-data">
                                ${timeline.length === 0 ? '<tr><td colspan="4" style="padding:32px; text-align:center; color:var(--text-muted)"><i data-lucide="archive" style="width:32px;height:32px;opacity:0.3;margin-bottom:8px;display:block;margin-left:auto;margin-right:auto"></i>Sin movimientos registrados</td></tr>' :
                timeline.map(t => `
                                    <tr style="border-bottom:1px solid var(--border-color); ${t.isPago ? 'background:rgba(255,255,255,0.02);' : ''}">
                                        <td style="padding:12px 16px; font-size:0.85rem">${t.fecha}</td>
                                        <td style="padding:12px 16px;"><span class="badge" style="background:var(--bg-card); border:1px solid var(--border-color); color:var(--text-muted); font-size:0.6rem; padding:2px 6px">${t.tipo}</span></td>
                                        <td style="padding:12px 16px; font-size:0.85rem; color:var(--text-muted); ${t.isPago ? 'font-weight:600' : ''}">${t.detalle}</td>
                                        <td style="padding:12px 16px; text-align:right; font-weight:600; ${t.styleClass}">${t.valor > 0 ? '+' : ''}${Math.abs(t.displayValor || t.valor).toLocaleString()}</td>
                                    </tr>
                                `).join('')
            }
                            </tbody>
                        </table>
                    </div>

                    <div id="ob-content-pagos" style="display:none; flex:1; overflow-y:auto; min-height:200px; margin-bottom:16px; border:1px solid var(--border-color); border-radius:var(--border-radius-md);">
                        <table style="width:100%; border-collapse:collapse;">
                            <thead style="position:sticky; top:0; background:var(--bg-surface-hover); color:var(--text-muted); font-size:0.75rem; text-transform:uppercase; font-weight:700; z-index:10;">
                                <tr>
                                    <th style="padding:12px 16px; text-align:left; border-bottom:1px solid var(--border-color)">Recibo</th>
                                    <th style="padding:12px 16px; text-align:left; border-bottom:1px solid var(--border-color)">Período</th>
                                    <th style="padding:12px 16px; text-align:right; border-bottom:1px solid var(--border-color)">Neto Pagado ($)</th>
                                </tr>
                            </thead>
                            <tbody class="tabular-data">
                                ${pagos.length === 0 ? '<tr><td colspan="3" style="padding:32px; text-align:center; color:var(--text-muted)"><i data-lucide="banknote" style="width:32px;height:32px;opacity:0.3;margin-bottom:8px;display:block;margin-left:auto;margin-right:auto"></i>Aún no hay nóminas pagadas</td></tr>' :
                pagos.map(p => `
                                    <tr style="border-bottom:1px solid var(--border-color)">
                                        <td style="padding:12px 16px;"><span class="badge" style="background:var(--bg-app); border:1px solid var(--border-color); color:var(--text-main); font-family:monospace">${p.reciboId || 'OLD'}</span></td>
                                        <td style="padding:12px 16px; font-size:0.85rem; color:var(--text-muted)">${p.fechaInicio || '?'} al ${p.fechaFin || '?'}</td>
                                        <td style="padding:12px 16px; text-align:right; font-weight:700; color:var(--color-primary)">${(p.netoAPagar || 0).toLocaleString()}</td>
                                    </tr>
                                `).join('')
            }
                            </tbody>
                        </table>
                    </div>

                    <div style="flex-shrink:0">
                        <button class="btn-premium secondary" style="width:100%; border:1px solid var(--border-color)" onclick="Obreros.exportarPdfHistorial()">
                            <i data-lucide="file-text"></i> Exportar Historial (PDF)
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
        if (window.lucide) window.lucide.createIcons();
    },

    verTabHistorial(tab) {
        document.getElementById('btn-tab-ob-todo').className = `btn-premium ${tab === 'todo' ? 'primary' : 'secondary'} flex-1`;
        document.getElementById('ob-content-todo').style.display = tab === 'todo' ? 'block' : 'none';

        document.getElementById('btn-tab-ob-pagos').className = `btn-premium ${tab === 'pagos' ? 'primary' : 'secondary'} flex-1`;
        document.getElementById('ob-content-pagos').style.display = tab === 'pagos' ? 'block' : 'none';

        if (window.lucide) window.lucide.createIcons();
    },

    exportarPdfHistorial() {
        if (typeof window.jspdf === 'undefined') {
            return App.toast('jsPDF no está cargado', 'error');
        }

        const d = Obreros._currentPdfData;
        if (!d) return App.toast('Error cargando datos', 'error');

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        function formatMoney(value) {
            return "$" + new Intl.NumberFormat('es-CO').format(Math.abs(value));
        }

        // Colores
        const dark = [30, 22, 18];
        const gray = [120, 120, 120];
        const accent = [139, 90, 43];

        // Header
        doc.setFillColor(dark[0], dark[1], dark[2]);
        doc.rect(0, 0, 210, 35, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.text('CAFECONTROL', 15, 18);
        doc.setFontSize(14);
        doc.text('HISTORIAL DE TRABAJADOR', 15, 26);

        // Info Obrero
        doc.setTextColor(dark[0], dark[1], dark[2]);
        doc.setFontSize(12);
        doc.text(`Nombre: ${d.obrero.nombre}`, 15, 48);

        doc.setFontSize(10);
        doc.setTextColor(gray[0], gray[1], gray[2]);
        doc.text(`Documento: ${d.obrero.documento || 'N/A'}`, 15, 55);
        doc.text(`Teléfono: ${d.obrero.telefono || 'N/A'}`, 15, 60);
        doc.text(`Ingreso: ${d.obrero.fechaIngreso || 'N/A'}`, 15, 65);
        doc.text(`Estado: ${d.obrero.estado.toUpperCase()}`, 15, 70);
        if (d.obrero.fechaRetiro) doc.text(`Retiro: ${d.obrero.fechaRetiro}`, 15, 75);

        // Finanzas Caja (Resumen)
        const summaryY = d.obrero.fechaRetiro ? 82 : 77;
        doc.setDrawColor(accent[0], accent[1], accent[2]);
        doc.setFillColor(250, 245, 240);
        doc.roundedRect(15, summaryY, 180, 50, 3, 3, 'FD');

        doc.setTextColor(dark[0], dark[1], dark[2]);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text('RESUMEN FINANCIERO', 20, summaryY + 8);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Total Jornales: ${formatMoney(d.totalJornales)}`, 20, summaryY + 16);
        doc.text(`Total Comida: -${formatMoney(d.totalComida)}`, 20, summaryY + 23);
        doc.text(`Total Tienda: -${formatMoney(d.totalTienda)}`, 20, summaryY + 30);
        doc.text(`Total Pagos: -${formatMoney(d.totalPagado)}`, 20, summaryY + 37);

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        if (d.saldoActual >= 0) {
            doc.setTextColor(30, 130, 30); // Verde oscuro
        } else {
            doc.setTextColor(200, 30, 30); // Rojo oscuro
        }
        const signSaldo = d.saldoActual < 0 ? '-' : '';
        doc.text(`Saldo Final: ${signSaldo}${formatMoney(d.saldoActual)}`, 20, summaryY + 45);

        // Tabla AutoTable
        const tableBody = d.timeline.map(row => {
            const val = row.displayValor || row.valor;
            const sign = val > 0 ? '+' : (val < 0 ? '-' : '');
            return [
                row.fecha,
                row.tipo,
                row.detalle,
                `${sign}${formatMoney(val)}`
            ];
        });

        doc.autoTable({
            startY: summaryY + 55,
            head: [['Fecha', 'Tipo', 'Detalle', 'Valor']],
            body: tableBody,
            headStyles: { fillColor: dark, textColor: 255 },
            columnStyles: {
                3: { halign: 'right' }
            },
            theme: 'striped',
            styles: { fontSize: 9 }
        });

        // Pie de página
        let finalY = doc.lastAutoTable.finalY + 15;
        if (finalY > 280) {
            doc.addPage();
            finalY = 20;
        }
        doc.setFontSize(8);
        doc.setTextColor(gray[0], gray[1], gray[2]);
        doc.setFont("helvetica", "normal");
        doc.text('Documento generado por CaféControl', 15, finalY);
        doc.text(`Fecha de generación: ${new Date().toLocaleDateString('en-CA')}`, 15, finalY + 5);
        doc.text('Sistema PWA Offline', 15, finalY + 10);

        doc.save(`Historial_${d.obrero.nombre.replace(/\\s+/g, '_')}_${new Date().toLocaleDateString('en-CA')}.pdf`);
    },

    async renderExpedienteInterface(container) {
        if (!container) return;
        container.innerHTML = `
            <div class="card-premium mb-2 animate-in" style="position:relative; margin-bottom:16px;">
                <label class="text-muted" style="font-size:0.8rem;text-transform:uppercase;font-weight:700;display:block;margin-bottom:8px">Buscar Trabajador para su Expediente</label>
                <div style="position:relative;">
                    <i data-lucide="search" style="position:absolute; left:16px; top:50%; transform:translateY(-50%); color:var(--text-muted); width:20px; height:20px"></i>
                    <input type="text" class="input-premium" id="exp-search-worker" placeholder="Escribe el nombre o documento..." oninput="Obreros.buscarObreroExpediente(this.value)" style="padding-left:48px; min-height:48px; font-size:1.05rem;">
                </div>
                
                <!-- Dropdown Flotante Táctil -->
                <div id="exp-search-results" class="card-premium" style="display:none; position:absolute; left:0; right:0; top:100%; z-index:100; max-height:250px; overflow-y:auto; margin-top:6px; padding:0; box-shadow:var(--shadow-lg);"></div>
            </div>

            <div id="exp-details-container">
                <div class="empty-state card-premium" style="padding:48px; text-align:center; color:var(--text-muted);">
                    <i data-lucide="folder-search" style="width:48px;height:48px;opacity:0.2;margin:0 auto 16px;display:block"></i>
                    <h3>Expediente de Personal</h3>
                    <p>Busca y selecciona un obrero para ver su historial, mapa de rendimiento contable y desglose diario.</p>
                </div>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    },

    async buscarObreroExpediente(query) {
        const resultsEl = document.getElementById('exp-search-results');
        if (!resultsEl) return;
        const q = query.trim().toLowerCase();
        if (!q) {
            resultsEl.style.display = 'none';
            return;
        }

        const obreros = await db.getByFinca('obreros');
        const filtered = obreros.filter(o => 
            o.nombre.toLowerCase().includes(q) || 
            (o.documento && o.documento.includes(q))
        );

        if (filtered.length === 0) {
            resultsEl.innerHTML = `
                <div style="padding:16px; text-align:center; color:var(--text-muted); font-size:0.9rem;">
                    No se encontraron resultados para "${query}"
                </div>
            `;
        } else {
            resultsEl.innerHTML = filtered.map(o => `
                <div class="worker-row-premium" onclick="Obreros.seleccionarObreroExpediente(${o.id})" 
                     style="padding:14px 16px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); transition:background 0.2s; background:var(--bg-card);"
                     onmouseover="this.style.background='var(--bg-surface-hover)'" onmouseout="this.style.background='var(--bg-card)'">
                    <div style="display:flex; align-items:center; gap:12px">
                        <div style="background:rgba(34, 197, 94, 0.1); width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:var(--color-primary); font-weight:700; font-size:0.85rem">
                            ${o.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <strong style="font-size:0.95rem; color:var(--text-main); display:block">${o.nombre}</strong>
                            <small class="text-muted" style="font-size:0.75rem">Doc: ${o.documento || 'N/A'}</small>
                        </div>
                    </div>
                    <span class="badge ${o.estado === 'activo' ? 'badge-active' : ''}" style="font-size:0.65rem">${o.estado}</span>
                </div>
            `).join('');
        }
        resultsEl.style.display = 'block';
    },

    async seleccionarObreroExpediente(obreroId) {
        const resultsEl = document.getElementById('exp-search-results');
        if (resultsEl) resultsEl.style.display = 'none';

        const inputSearch = document.getElementById('exp-search-worker');
        
        const obrero = await db.get('obreros', obreroId);
        if (!obrero) return;
        if (inputSearch) inputSearch.value = obrero.nombre;

        const now = new Date();
        Obreros._expActiveWorker = obrero;
        Obreros._expActiveYear = now.getFullYear();
        Obreros._expActiveMonth = now.getMonth();

        await Obreros.renderExpedienteDetalles();
    },

    async renderExpedienteDetalles() {
        const container = document.getElementById('exp-details-container');
        if (!container || !Obreros._expActiveWorker) return;

        const o = Obreros._expActiveWorker;
        const year = Obreros._expActiveYear;
        const month = Obreros._expActiveMonth;

        const jornalesAll = await db.getAllByIndex('jornales', 'obreroId', o.id);
        const comidasAll = await db.getAllByIndex('comida', 'obreroId', o.id);
        const ventasAll = await db.getAllByIndex('ventasCaja', 'obreroId', o.id);
        const pagosAll = await db.getAllByIndex('pagos', 'obreroId', o.id);

        const cicloActivo = await db.getCicloActivo();
        let precioKilo = 0;
        if (cicloActivo) {
            precioKilo = cicloActivo.precioKilo || cicloActivo.precio_kilo || cicloActivo.tarifaKilo;
        }
        if (!precioKilo) {
            precioKilo = await db.getConfig('tarifaKilo', 500);
        }
        if (!precioKilo || precioKilo <= 0) {
            precioKilo = 1000;
        }

        const totalKilos = jornalesAll.reduce((s, j) => s + (parseFloat(j.kilosRecolectados) || 0), 0);
        const totalGanado = jornalesAll.reduce((s, j) => {
            const kilosJornal = parseFloat(j.kilosRecolectados) || (parseFloat(j.kilosAM || 0) + parseFloat(j.kilosPM || 0)) || 0;
            let valorJornal = parseFloat(j.totalDia) || 0;
            if (valorJornal <= 0) {
                if (j.tipoPago === 'dia') {
                    valorJornal = parseFloat(j.tarifaDia) || 40000;
                } else {
                    const tarifaK = parseFloat(precioKilo) || 1000;
                    valorJornal = kilosJornal * tarifaK;
                }
            }
            return s + valorJornal;
        }, 0);
        const totalComidasVal = comidasAll.reduce((s, c) => s + (parseFloat(c.valor) || 0), 0);
        const totalCajaVal = ventasAll.filter(v => v.fiado).reduce((s, v) => s + (parseFloat(v.valorTotal) || 0), 0);
        const totalPagadoVal = pagosAll.filter(p => p.estado !== 'anulado').reduce((s, p) => s + (parseFloat(p.netoAPagar) || 0), 0);
        const saldoCuentas = totalGanado - totalComidasVal - totalCajaVal - totalPagadoVal;

        const monthStr = String(month + 1).padStart(2, '0');
        const prefix = `${year}-${monthStr}`;

        const monthJornales = jornalesAll.filter(j => j.fecha.startsWith(prefix));
        const monthComidas = comidasAll.filter(c => c.fecha.startsWith(prefix));
        const monthKilos = monthJornales.reduce((s, j) => s + (parseFloat(j.kilosRecolectados) || 0), 0);
        const monthGanado = monthJornales.reduce((s, j) => {
            const kilosJornal = parseFloat(j.kilosRecolectados) || 0;
            const totalDiaVal = parseFloat(j.totalDia) || 0;
            const tarifaDiaVal = parseFloat(j.tarifaDia) || 40000;
            const valorJornal = totalDiaVal || (j.tipoPago === 'dia' ? tarifaDiaVal : kilosJornal * precioKilo);
            return s + valorJornal;
        }, 0);

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        let firstDayIndex = new Date(year, month, 1).getDay(); 
        firstDayIndex = (firstDayIndex - 1 + 7) % 7;

        const monthsNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

        let calendarHtml = '';
        
        for (let i = 0; i < firstDayIndex; i++) {
            calendarHtml += `<div style="aspect-ratio:1.1; background:transparent; border-radius:12px; border:1px solid transparent;"></div>`;
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayStr = String(day).padStart(2, '0');
            const fechaStr = `${prefix}-${dayStr}`;

            const dayJornales = monthJornales.filter(j => j.fecha === fechaStr);
            const dayComidas = monthComidas.filter(c => c.fecha === fechaStr);

            const kilos = dayJornales.reduce((s, j) => s + (j.kilosRecolectados || 0), 0);
            const hasFood = dayComidas.length > 0;
            const hasJornal = dayJornales.length > 0;

            let bgColor = 'var(--bg-card)';
            let textColor = 'var(--text-muted)';
            let borderStyle = '1px solid var(--border-color)';
            let textInline = '';

            if (kilos > 100) {
                bgColor = '#15803d'; 
                textColor = '#ffffff';
                borderStyle = 'none';
                textInline = `<div style="font-size:0.75rem; font-weight:800; margin-top:4px;">${kilos.toLocaleString()} kg</div>`;
            } else if (kilos > 0) {
                bgColor = 'rgba(34, 197, 94, 0.15)';
                textColor = 'var(--color-primary)';
                borderStyle = 'none';
                textInline = `<div style="font-size:0.75rem; font-weight:700; margin-top:4px;">${kilos.toLocaleString()} kg</div>`;
            } else if (kilos === 0 && (hasFood || hasJornal)) {
                bgColor = '#fef3c7'; 
                textColor = '#b45309'; 
                borderStyle = '1px solid #d97706'; 
                textInline = `<div style="font-size:0.6rem; font-weight:800; margin-top:4px; text-transform:uppercase; letter-spacing:0.5px; display:flex; align-items:center; gap:2px; justify-content:center; color:#b45309;"><i data-lucide="alert-triangle" style="width:10px;height:10px;"></i>Alerta</div>`;
            } else {
                textColor = 'var(--text-secondary)';
            }

            calendarHtml += `
                <div class="calendar-day-cell clickable animate-in" onclick="Obreros.verDetalleDia(${o.id}, '${fechaStr}')"
                     style="aspect-ratio:1.1; background:${bgColor}; color:${textColor}; border:${borderStyle}; border-radius:12px; display:flex; flex-direction:column; justify-content:center; align-items:center; cursor:pointer; padding:6px; transition:transform 0.15s, box-shadow 0.15s; position:relative; box-shadow:var(--shadow-sm);">
                    <span style="font-size:0.9rem; font-weight:700; ${kilos > 100 ? 'color:#fff;' : ''}">${day}</span>
                    ${textInline}
                </div>
            `;
        }

        container.innerHTML = `
            <div class="animate-in">
                <!-- Info personal y financiera -->
                <div class="card-premium" style="margin-bottom:20px; display:flex; flex-wrap:wrap; gap:16px; align-items:center; background:linear-gradient(135deg, var(--bg-surface) 0%, rgba(22, 163, 74, 0.03) 100%);">
                    <div style="display:flex; align-items:center; gap:16px; flex:2; min-width:250px;">
                        <div style="background:rgba(22,163,74,0.1); color:var(--color-primary); font-weight:800; width:56px; height:56px; border-radius:16px; display:flex; align-items:center; justify-content:center; font-size:1.5rem">
                            ${o.nombre.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}
                        </div>
                        <div>
                            <h3 style="margin:0 0 4px; font-size:1.3rem; font-weight:800; color:var(--text-main)">${o.nombre}</h3>
                            <div style="display:flex; gap:12px; flex-wrap:wrap; font-size:0.8rem; color:var(--text-muted);">
                                <span><strong>Cédula:</strong> ${o.documento || 'N/A'}</span>
                                <span><strong>Tel:</strong> ${o.telefono || 'N/A'}</span>
                                <span><strong>Ingreso:</strong> ${o.fechaIngreso || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- KPI Rápido -->
                    <div style="flex:1; min-width:150px; background:var(--bg-app); border:1px solid var(--border-color); border-radius:12px; padding:12px; text-align:right">
                        <div class="text-muted" style="font-size:0.7rem; text-transform:uppercase; font-weight:700">Saldo Contable</div>
                        <div class="tabular-data" style="font-size:1.25rem; font-weight:800; ${saldoCuentas >= 0 ? 'color:var(--color-primary)' : 'color:var(--color-danger)'}">
                            $${saldoCuentas.toLocaleString()}
                        </div>
                    </div>
                </div>

                <!-- Almanaque de Rendimiento -->
                <div class="card-premium mb-2">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px">
                        <div style="display:flex; align-items:center; gap:8px">
                            <div style="background:rgba(234, 88, 12, 0.1); color:var(--color-warning); width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center">
                                <i data-lucide="calendar" style="width:16px;height:16px;"></i>
                            </div>
                            <h3 style="margin:0; font-size:1.15rem; font-weight:700">Almanaque de Rendimiento</h3>
                        </div>
                        
                        <!-- Navegador de Mes -->
                        <div style="display:flex; gap:6px; align-items:center">
                            <button class="btn-premium secondary" onclick="Obreros.cambiarMesExpediente(-1)" style="padding:0 8px; height:36px; min-width:36px;"><i data-lucide="chevron-left"></i></button>
                            <span style="font-weight:700; font-size:1rem; min-width:120px; text-align:center">${monthsNames[month]} ${year}</span>
                            <button class="btn-premium secondary" onclick="Obreros.cambiarMesExpediente(1)" style="padding:0 8px; height:36px; min-width:36px;"><i data-lucide="chevron-right"></i></button>
                        </div>
                    </div>

                    <!-- Stats Rápidos de Mes -->
                    <div class="grid-2 mb-2" style="margin-bottom:20px; gap:8px;">
                        <div class="card-premium" style="padding:10px; background:var(--bg-app)!important; display:flex; justify-content:space-between; align-items:center">
                            <span class="text-muted" style="font-size:0.8rem; font-weight:600">Producción en el Mes</span>
                            <span class="tabular-data" style="font-weight:800; font-size:1.1rem; color:var(--color-primary)">${monthKilos.toLocaleString()} kg</span>
                        </div>
                        <div class="card-premium" style="padding:10px; background:var(--bg-app)!important; display:flex; justify-content:space-between; align-items:center">
                            <span class="text-muted" style="font-size:0.8rem; font-weight:600">Dinero Devengado</span>
                            <span class="tabular-data" style="font-weight:800; font-size:1.1rem; color:var(--text-main)">$${monthGanado.toLocaleString()}</span>
                        </div>
                    </div>

                    <!-- Nomenclatura del Mapa de Calor -->
                    <div style="display:flex; flex-wrap:wrap; gap:12px; font-size:0.75rem; color:var(--text-secondary); margin-bottom:16px; padding:8px; background:var(--bg-app); border-radius:8px">
                        <span style="font-weight:600; color:var(--text-main)">Mapa de calor:</span>
                        <div style="display:flex; align-items:center; gap:4px"><span style="width:12px; height:12px; border-radius:3px; background:#15803d; display:inline-block"></span> Alta Recolección (>100kg)</div>
                        <div style="display:flex; align-items:center; gap:4px"><span style="width:12px; height:12px; border-radius:3px; background:rgba(34, 197, 94, 0.15); border:1px solid var(--color-primary); display:inline-block"></span> Normal (>0kg)</div>
                        <div style="display:flex; align-items:center; gap:4px"><span style="width:12px; height:12px; border-radius:3px; background:#fef3c7; border:1px solid #d97706; display:inline-block"></span> Alerta (Comida/Asist. sin Kilos)</div>
                    </div>

                    <!-- Calendario Grid -->
                    <div style="display:grid; grid-template-columns:repeat(7, 1fr); gap:6px;">
                        <!-- Cabecera de Días -->
                        ${['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => `
                            <div style="text-align:center; font-weight:700; font-size:0.8rem; color:var(--text-muted); padding:8px 0">${d}</div>
                        `).join('')}
                        
                        <!-- Celdas de Días -->
                        ${calendarHtml}
                    </div>
                </div>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    },

    async cambiarMesExpediente(dir) {
        let month = Obreros._expActiveMonth + dir;
        let year = Obreros._expActiveYear;
        if (month < 0) {
            month = 11;
            year -= 1;
        } else if (month > 11) {
            month = 0;
            year += 1;
        }
        Obreros._expActiveMonth = month;
        Obreros._expActiveYear = year;
        await Obreros.renderExpedienteDetalles();
    },

    async verDetalleDia(obreroId, fechaStr) {
        const obrero = await db.get('obreros', obreroId);
        if (!obrero) return;

        const cicloActivo = await db.getCicloActivo();
        let precioKilo = 0;
        if (cicloActivo) {
            precioKilo = cicloActivo.precioKilo || cicloActivo.precio_kilo || cicloActivo.tarifaKilo;
        }
        if (!precioKilo) {
            precioKilo = await db.getConfig('tarifaKilo', 500);
        }
        if (!precioKilo || precioKilo <= 0) {
            precioKilo = 1000;
        }

        const allJornales = await db.getAllByIndex('jornales', 'obreroId', obreroId);
        const allComidas = await db.getAllByIndex('comida', 'obreroId', obreroId);
        const allVentas = await db.getAllByIndex('ventasCaja', 'obreroId', obreroId);

        const dayJornales = allJornales.filter(j => j.fecha === fechaStr);
        const dayComidas = allComidas.filter(c => c.fecha === fechaStr);
        const dayVentas = allVentas.filter(v => v.fecha === fechaStr);

        const totalKilos = dayJornales.reduce((s, j) => s + (parseFloat(j.kilosRecolectados) || 0), 0);
        const totalGanado = dayJornales.reduce((s, j) => {
            const kilosJornal = parseFloat(j.kilosRecolectados) || (parseFloat(j.kilosAM || 0) + parseFloat(j.kilosPM || 0)) || 0;
            let valorJornal = parseFloat(j.totalDia) || 0;
            if (valorJornal <= 0) {
                if (j.tipoPago === 'dia') {
                    valorJornal = parseFloat(j.tarifaDia) || 40000;
                } else {
                    const tarifaK = parseFloat(precioKilo) || 1000;
                    valorJornal = kilosJornal * tarifaK;
                }
            }
            return s + valorJornal;
        }, 0);
        const totalDeducciones = dayComidas.reduce((s, c) => s + (parseFloat(c.valor) || 0), 0) + dayVentas.filter(v => v.fiado).reduce((s, v) => s + (parseFloat(v.valorTotal) || 0), 0);

        const lotes = await db.getByFinca('lotes');
        const ltMap = Object.fromEntries(lotes.map(l => [l.id, l.nombre]));
        const productos = await db.getByFinca('productos');
        const prMap = Object.fromEntries(productos.map(p => [p.id, p.nombre]));

        const formattedFecha = Ciclos.formatFecha(fechaStr);

        const html = `
            <div class="modal-system-overlay" onclick="Obreros.closeModal(event)" style="display:flex;align-items:center;justify-content:center;padding:16px;z-index:9999">
                <div class="card-premium animate-in" onclick="event.stopPropagation()" style="width:100%; max-width:440px; padding:24px;">
                    <div class="header-premium" style="margin-bottom:16px;">
                        <div class="header-icon" style="background:rgba(234, 88, 12, 0.1); color:var(--color-warning)"><i data-lucide="info"></i></div>
                        <div style="flex:1">
                            <h3 style="margin:0; font-size:1.15rem; font-weight:800">Detalle del Día</h3>
                            <p class="text-muted" style="font-size:0.85rem; margin:0">${obrero.nombre} &middot; ${formattedFecha}</p>
                        </div>
                        <button type="button" class="btn-icon-only" onclick="Obreros.closeModal()" style="border:none; background:transparent"><i data-lucide="x"></i></button>
                    </div>

                    <!-- Resumen del día -->
                    <div class="grid-3 mb-2 tabular-data" style="margin-bottom:20px; gap:6px">
                        <div class="card-premium" style="padding:8px; background:var(--bg-app)!important; text-align:center">
                            <div class="text-muted" style="font-size:0.65rem; text-transform:uppercase; font-weight:700">Kilos</div>
                            <div style="font-weight:800; font-size:1.1rem; color:var(--color-primary)">${totalKilos} kg</div>
                        </div>
                        <div class="card-premium" style="padding:8px; background:var(--bg-app)!important; text-align:center">
                            <div class="text-muted" style="font-size:0.65rem; text-transform:uppercase; font-weight:700">Ganado</div>
                            <div style="font-weight:800; font-size:1.1rem; color:var(--color-primary)">$${totalGanado.toLocaleString()}</div>
                        </div>
                        <div class="card-premium" style="padding:8px; background:var(--bg-app)!important; text-align:center">
                            <div class="text-muted" style="font-size:0.65rem; text-transform:uppercase; font-weight:700">Deduc.</div>
                            <div style="font-weight:800; font-size:1.1rem; color:var(--color-danger)">-$${totalDeducciones.toLocaleString()}</div>
                        </div>
                    </div>

                    <!-- Desglose Pesajes -->
                    <div style="margin-bottom:16px">
                        <h4 style="margin:0 0 8px; font-size:0.85rem; text-transform:uppercase; font-weight:700; color:var(--text-main); display:flex; align-items:center; gap:6px"><i data-lucide="scale" style="width:14px; color:var(--color-primary)"></i> Recolección (Pesajes)</h4>
                        ${dayJornales.length === 0 ? `<p class="text-muted" style="font-size:0.8rem; margin:0; padding-left:20px;">No registra recolección.</p>` : `
                            <div style="display:flex; flex-direction:column; gap:6px; padding-left:20px;">
                                ${dayJornales.map(j => {
                                    const kilosJornal = parseFloat(j.kilosRecolectados) || 0;
                                    const totalDiaVal = parseFloat(j.totalDia) || 0;
                                    const tarifaDiaVal = parseFloat(j.tarifaDia) || 40000;
                                    const valorJornal = totalDiaVal || (j.tipoPago === 'dia' ? tarifaDiaVal : kilosJornal * precioKilo);
                                    return `
                                        <div style="display:flex; justify-content:space-between; font-size:0.85rem; border-bottom:1px dashed var(--border-color); padding-bottom:4px;">
                                            <span class="text-muted">${ltMap[j.loteId] || 'Lote'} (AM: ${j.kilosAM || 0}kg / PM: ${j.kilosPM || 0}kg)</span>
                                            <strong style="color:var(--text-main);">${kilosJornal} kg ($${valorJornal.toLocaleString()})</strong>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        `}
                    </div>

                    <!-- Desglose Comidas -->
                    <div style="margin-bottom:16px">
                        <h4 style="margin:0 0 8px; font-size:0.85rem; text-transform:uppercase; font-weight:700; color:var(--text-main); display:flex; align-items:center; gap:6px"><i data-lucide="utensils-crossed" style="width:14px; color:var(--color-danger)"></i> Alimentación (Comedor)</h4>
                        ${dayComidas.length === 0 ? `<p class="text-muted" style="font-size:0.8rem; margin:0; padding-left:20px;">No registra consumos.</p>` : `
                            <div style="display:flex; flex-direction:column; gap:6px; padding-left:20px;">
                                ${dayComidas.map(c => `
                                    <div style="display:flex; justify-content:space-between; font-size:0.85rem; border-bottom:1px dashed var(--border-color); padding-bottom:4px;">
                                        <span class="text-muted" style="text-transform:capitalize;">${c.tipo} ${c.loteId ? `(${ltMap[c.loteId] || 'Lote'})` : ''}</span>
                                        <strong style="color:var(--color-danger); font-weight:700;">-$${(c.valor || 0).toLocaleString()}</strong>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>

                    <!-- Desglose Vales Tienda -->
                    <div style="margin-bottom:20px">
                        <h4 style="margin:0 0 8px; font-size:0.85rem; text-transform:uppercase; font-weight:700; color:var(--text-main); display:flex; align-items:center; gap:6px"><i data-lucide="shopping-cart" style="width:14px; color:var(--color-danger)"></i> Cuentas de Tienda</h4>
                        ${dayVentas.length === 0 ? `<p class="text-muted" style="font-size:0.8rem; margin:0; padding-left:20px;">No registra compras.</p>` : `
                            <div style="display:flex; flex-direction:column; gap:6px; padding-left:20px;">
                                ${dayVentas.map(v => `
                                    <div style="display:flex; justify-content:space-between; font-size:0.85rem; border-bottom:1px dashed var(--border-color); padding-bottom:4px;">
                                        <span class="text-muted">${prMap[v.productoId] || v.descripcion || 'Compra'} (x${v.cantidad})</span>
                                        <strong style="color:${v.fiado ? 'var(--color-danger)' : 'var(--color-success)'}; font-weight:700;">${v.fiado ? '-' : ''}$${(v.valorTotal || 0).toLocaleString()} <small style="font-size:0.6rem; font-weight:800;">${v.fiado ? 'FIADO' : 'EFEC.'}</small></strong>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>

                    <button type="button" class="btn-premium secondary w-100" onclick="Obreros.closeModal()">Cerrar</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
        if (window.lucide) window.lucide.createIcons();
    },

    closeModal(e) {
        if (e && e.target !== e.currentTarget) return;
        const modal = document.querySelector('.modal-system-overlay');
        if (modal) modal.remove();
    }
};
