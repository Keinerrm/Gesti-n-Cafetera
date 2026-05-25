/* ============================================
   jornales.js — Jornales y Producción
   Mañana / Tarde + Registro Rápido Masivo
   Rediseñado con Premium Design System
   ============================================ */

const Jornales = {
    activeTab: 'individual',

    async render() {
        const obreros = (await db.getByFinca('obreros')).filter(o => o.estado === 'activo');
        const lotes = await db.getByFinca('lotes');
        const today = new Date().toLocaleDateString('en-CA');
        const tarifaKilo = await db.getConfig('tarifaKilo', 500);
        const tarifaDia = await db.getConfig('tarifaDia', 40000);
        const cicloActivo = await db.getCicloActivo();

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="animate-in">
                <div class="header-premium" style="margin-bottom:24px;">
                    <div style="display:flex; align-items:center; gap:16px">
                        <div class="header-icon" style="background:var(--color-primary); color:#fff; width:48px; height:48px; flex-shrink:0"><i data-lucide="scale" style="width:24px; height:24px"></i></div>
                        <div style="flex:1">
                            <h2 style="margin:0; font-size:1.3rem; font-weight:800; color:var(--text-main)">Jornales y Producción</h2>
                            <p style="margin:4px 0 0 0; font-size:0.85rem; color:var(--text-muted); font-weight:500">Registro diario de recolección y métricas productivas</p>
                        </div>
                    </div>
                </div>

                <div class="tabs" style="margin-bottom: 24px; display:flex; gap:8px">
                    <button class="btn-premium ${Jornales.activeTab === 'rapido' ? 'primary' : 'secondary'} flex-1" onclick="Jornales.switchTab('rapido')">
                        <i data-lucide="zap"></i> Registro Rápido
                    </button>
                    <button class="btn-premium ${Jornales.activeTab === 'individual' ? 'primary' : 'secondary'} flex-1" onclick="Jornales.switchTab('individual')">
                        <i data-lucide="user-check"></i> Individual
                    </button>
                </div>

                <div id="jn-tab-content"></div>

                <!-- Filter & History (always visible) -->
                <div class="header-premium" style="margin-top:40px; margin-bottom:16px;">
                    <div style="display:flex; align-items:center; gap:16px">
                        <div class="header-icon" style="background:var(--bg-card-hover); color:var(--text-main); width:40px; height:40px; flex-shrink:0"><i data-lucide="history" style="width:20px; height:20px"></i></div>
                        <div style="flex:1">
                            <h3 style="margin:0;font-size:1.1rem; font-weight:700">Historial de Jornales</h3>
                            <p style="margin:2px 0 0 0; font-size:0.85rem; color:var(--text-muted); font-weight:500">Auditoría de recolecciones recientes</p>
                        </div>
                    </div>
                </div>
                
                <div class="card-premium" style="padding:16px; margin-bottom:24px; background:var(--bg-surface)">
                    <div class="grid-3" style="gap:12px">
                        <div>
                            <label class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:700; display:block; margin-bottom:6px">Fecha</label>
                            <input type="date" class="input-premium" id="jn-filter-fecha" value="${today}" onchange="Jornales.loadHistory()">
                        </div>
                        <div>
                            <label class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:700; display:block; margin-bottom:6px">Trabajador</label>
                            <select class="input-premium" id="jn-filter-obrero" onchange="Jornales.loadHistory()">
                                <option value="">Todos los obreros</option>
                                ${obreros.map(o => `<option value="${o.id}">${o.nombre}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:700; display:block; margin-bottom:6px">Lote Productivo</label>
                            <select class="input-premium" id="jn-filter-lote" onchange="Jornales.loadHistory()">
                                <option value="">Todos los lotes</option>
                                ${lotes.map(l => `<option value="${l.id}">${l.nombre}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                </div>

                <div id="jornales-resumen" class="grid-3" style="gap:12px; margin-bottom:24px"></div>

                <div class="card-premium" style="padding:0; overflow:hidden;">
                    <div style="overflow-x:auto">
                        <table style="width:100%; border-collapse:collapse; min-width:800px">
                            <thead>
                                <tr style="background:var(--bg-app); border-bottom:1px solid var(--border-color); text-align:left">
                                    <th style="padding:16px; font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700">Fecha</th>
                                    <th style="padding:16px; font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700">Trabajador</th>
                                    <th style="padding:16px; font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700">Lote</th>
                                    <th style="padding:16px; font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700; text-align:center">AM / PM</th>
                                    <th style="padding:16px; font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700; text-align:right">Total kg</th>
                                    <th style="padding:16px; font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700; text-align:center">Tipo</th>
                                    <th style="padding:16px; font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700; text-align:right">Valor</th>
                                    <th style="padding:16px; font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700; text-align:center"></th>
                                </tr>
                            </thead>
                            <tbody id="jornales-body" class="tabular-data"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        Jornales.renderTab();
        Jornales.loadHistory();
    },

    switchTab(tab) {
        Jornales.activeTab = tab;
        Jornales.render(); // Para re-renderizado completo con colores actualizados
    },

    async renderTab() {
        const container = document.getElementById('jn-tab-content');
        if (!container) return;

        if (Jornales.activeTab === 'rapido') {
            await Jornales.renderRegistroRapido(container);
        } else {
            await Jornales.renderIndividual(container);
        }
    },

    /* ========================================
       TAB: Registro Rápido Masivo
       ======================================== */
    async renderRegistroRapido(container) {
        const obreros = (await db.getByFinca('obreros')).filter(o => o.estado === 'activo');
        const lotes = await db.getByFinca('lotes');
        const today = new Date().toLocaleDateString('en-CA');

        let tarifaKilo = 500, tarifaDia = 40000;
        try {
            tarifaKilo = await db.getConfig('tarifaKilo', 500);
            tarifaDia = await db.getConfig('tarifaDia', 40000);
        } catch (e) { console.warn('Usando tarifas locales por fallback'); }

        container.innerHTML = `
            <div class="card-premium mb-2 animate-in" style="margin-bottom:16px">
                <div class="header-premium mb-2" style="margin-bottom:24px">
                    <div class="header-icon"><i data-lucide="zap"></i></div>
                    <div>
                        <h3 style="margin:0;font-size:1.1rem">Registro Rápido — ${obreros.length} obreros activos</h3>
                    </div>
                </div>

                <div class="grid-3 mb-2" style="margin-bottom:24px">
                    <div class="input-group">
                        <label class="text-muted" style="font-size:0.8rem;text-transform:uppercase;font-weight:600;display:block;margin-bottom:8px">Fecha</label>
                        <input type="date" class="input-premium" id="rr-fecha" value="${today}" max="${today}" onchange="Jornales.validarFechaRapido(this.value); Jornales.loadHistory();">
                    </div>
                    <div class="input-group">
                        <label class="text-muted" style="font-size:0.8rem;text-transform:uppercase;font-weight:600;display:block;margin-bottom:8px">Lote</label>
                        <select class="input-premium" id="rr-lote">
                            ${lotes.map(l => `<option value="${l.id}">${l.nombre}</option>`).join('')}
                        </select>
                    </div>
                    <div class="input-group">
                        <label class="text-muted" style="font-size:0.8rem;text-transform:uppercase;font-weight:600;display:block;margin-bottom:8px">Tipo de pago</label>
                        <select class="input-premium" id="rr-tipo" onchange="Jornales.actualizarTotalesRapido()">
                            <option value="kilo">Por kilo ($${tarifaKilo.toLocaleString()}/kg)</option>
                            <option value="dia">Por día ($${tarifaDia.toLocaleString()})</option>
                        </select>
                    </div>
                </div>

                <div class="worker-list" style="padding-right:8px; margin-bottom:16px; display:flex; flex-direction:column; gap:8px">
                    ${obreros.map((o, i) => `
                        <div class="card-premium rr-row" data-obrero-id="${o.id}" style="padding:12px 16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; transition:background 0.2s">
                            <div style="display:flex; align-items:center; gap:12px; min-width:180px">
                                <div style="background:var(--bg-surface-hover); width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:1.1rem; color:var(--color-primary)">
                                    ${o.nombre.charAt(0)}
                                </div>
                                <div>
                                    <h3 style="margin:0 0 2px 0; font-size:1.05rem; font-weight:600">${o.nombre}</h3>
                                    <div class="text-muted" style="font-size:0.8rem">Acumulado: <span class="rr-total-text tabular-data" style="font-weight:700; color:var(--text-muted)">—</span></div>
                                </div>
                            </div>
                            <div style="display:flex; align-items:center; gap:8px; flex:1; justify-content:flex-end">
                                <div style="position:relative">
                                    <span class="text-muted" style="position:absolute; top:-16px; left:8px; font-size:0.65rem; font-weight:700">AM (kg)</span>
                                    <input type="number" class="input-premium rr-am tabular-data" placeholder="0" 
                                           tabindex="${i * 2 + 1}" oninput="Jornales.calcRowTotal(this)" onfocus="this.select()"
                                           style="width:80px; height:48px; border-radius:12px; text-align:center; font-size:1.1rem; font-weight:700; padding:4px">
                                </div>
                                <span class="text-muted" style="opacity:0.3">+</span>
                                <div style="position:relative">
                                    <span class="text-muted" style="position:absolute; top:-16px; left:8px; font-size:0.65rem; font-weight:700">PM (kg)</span>
                                    <input type="number" class="input-premium rr-pm tabular-data" placeholder="0" 
                                           tabindex="${i * 2 + 2}" oninput="Jornales.calcRowTotal(this)" onfocus="this.select()"
                                           style="width:80px; height:48px; border-radius:12px; text-align:center; font-size:1.1rem; font-weight:700; padding:4px">
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="card-premium" style="background:var(--bg-app)!important; display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                    <div>
                        <span class="text-muted" style="font-size:0.85rem">Totales de recolección hoy:</span>
                        <div style="font-weight:700; color:var(--color-primary); font-size:1.2rem">
                            <span id="rr-total-general">0</span> <span style="font-size:0.9rem">kg</span>
                        </div>
                    </div>
                    <div>
                        <div id="rr-preview" style="font-size:0.85rem;color:var(--text-muted);text-align:right"></div>
                    </div>
                </div>

                <div class="btn-group" style="display:flex; gap:12px">
                    <button class="btn-premium primary flex-1" id="btn-save-rapido" onclick="Jornales.guardarRapido()">
                        <i data-lucide="check"></i> Guardar Jornales
                    </button>
                    <button class="btn-premium secondary" onclick="Jornales.limpiarRapido()">
                        <i data-lucide="trash-2"></i> Limpiar
                    </button>
                </div>
            </div>
        `;

        // Crear iconografía nueva
        if (window.lucide) window.lucide.createIcons();

        // Focus first AM field
        setTimeout(() => {
            const firstInput = container.querySelector('.rr-am');
            if (firstInput) firstInput.focus();
        }, 100);
        setTimeout(() => {
            Jornales.validarFechaRapido(today);
        }, 150);
    },

    calcRowTotal(input) {
        const row = input.closest('.rr-row');
        const am = parseFloat(row.querySelector('.rr-am').value) || 0;
        const pm = parseFloat(row.querySelector('.rr-pm').value) || 0;
        const total = am + pm;

        const cell = row.querySelector('.rr-total-text');
        if (cell) {
            cell.textContent = total > 0 ? total.toLocaleString() + ' kg' : '—';
            cell.style.color = total > 0 ? 'var(--color-primary)' : 'var(--text-muted)';
        }

        // Highlight row if has data
        row.style.background = total > 0 ? 'var(--bg-surface-hover)' : 'var(--bg-surface)';

        Jornales.actualizarTotalesRapido();
    },

    async actualizarTotalesRapido() {
        const rows = document.querySelectorAll('.rr-row');
        let totalAM = 0, totalPM = 0, count = 0;

        rows.forEach(row => {
            const am = parseFloat(row.querySelector('.rr-am').value) || 0;
            const pm = parseFloat(row.querySelector('.rr-pm').value) || 0;
            totalAM += am;
            totalPM += pm;
            if (am > 0 || pm > 0) count++;
        });

        const totalGen = totalAM + totalPM;
        const genEl = document.getElementById('rr-total-general');
        if (genEl) genEl.textContent = totalGen.toLocaleString();

        // Preview
        const tipo = document.getElementById('rr-tipo')?.value || 'kilo';
        let tarifaKilo = 500, tarifaDia = 40000;
        try {
            tarifaKilo = await db.getConfig('tarifaKilo', 500);
            tarifaDia = await db.getConfig('tarifaDia', 40000);
        } catch (e) { }
        const totalPagar = tipo === 'kilo' ? totalGen * tarifaKilo : count * tarifaDia;

        const preview = document.getElementById('rr-preview');
        if (preview) {
            preview.innerHTML = count > 0
                ? `<span class="tabular-data"><i data-lucide="users" style="width:14px;height:14px;vertical-align:middle;margin-right:4px"></i> <strong>${count}</strong> act. &middot; <strong style="color:var(--color-primary)">$${totalPagar.toLocaleString()}</strong> nómina</span>`
                : '';
            if (window.lucide) window.lucide.createIcons();
        }
    },

    async guardarRapido() {
        const cicloActivo = await db.getCicloActivo();
        if (!cicloActivo) {
            return App.alert({ title: 'Ciclo inactivo', message: 'No hay un ciclo activo. Debes abrir un ciclo antes de guardar jornales.', type: 'warning' });
        }

        const loteId = parseInt(document.getElementById('rr-lote').value);
        if (isNaN(loteId)) {
            return App.alert({ title: 'Sin Lotes', message: 'Ocurrió un problema: No hay lotes registrados.', type: 'warning' });
        }

        const fecha = document.getElementById('rr-fecha').value;
        const lockedCycle = await Ciclos.isDateLocked(fecha);
        if (lockedCycle) {
            return App.alert({
                title: 'Semana cerrada',
                message: `<div style="margin-bottom:0.75rem"><strong>Semana:</strong> ${lockedCycle.nombre} (${Ciclos.formatFecha(lockedCycle.fechaInicio || lockedCycle.fechainicio)} – ${Ciclos.formatFecha(lockedCycle.fechaFin || lockedCycle.fechafin)})</div>La nómina de esta semana ya fue liquidada.<br>No se pueden modificar registros históricos.`,
                type: 'error'
            });
        }

        const tipo = document.getElementById('rr-tipo').value;
        const tarifaKilo = await db.getConfig('tarifaKilo', 500);
        const tarifaDia = await db.getConfig('tarifaDia', 40000);
        const cicloId = cicloActivo.id;

        const btnSave = document.getElementById('btn-save-rapido');
        if (btnSave) { btnSave.disabled = true; btnSave.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Guardando...'; if (window.lucide) window.lucide.createIcons(); }

        const rows = document.querySelectorAll('.rr-row');
        let saved = 0;
        let totalKg = 0;
        const fincaId = db.getFincaActiva();
        let skipped = 0;

        const batchEntries = [];

        for (const row of rows) {
            const obreroId = parseInt(row.dataset.obreroId);
            const am = parseFloat(row.querySelector('.rr-am').value) || 0;
            const pm = parseFloat(row.querySelector('.rr-pm').value) || 0;
            const kilosTotal = am + pm;

            if (kilosTotal > 0 || (tipo === 'dia' && (am > 0 || pm > 0))) {
                const duplicado = await db.existeJornal(obreroId, fecha, loteId, fincaId);
                if (duplicado) {
                    skipped++;
                    continue;
                }

                const totalDia = tipo === 'kilo' ? kilosTotal * tarifaKilo : tarifaDia;

                await db.add('jornales', {
                    obreroId, loteId, fecha,
                    kilosAM: am, kilosPM: pm,
                    kilosRecolectados: kilosTotal,
                    tipoPago: tipo,
                    tarifaDia: tipo === 'dia' ? tarifaDia : tarifaKilo,
                    totalDia,
                    fincaId,
                    cicloId
                });
                saved++;
                totalKg += kilosTotal;

                batchEntries.push({ obreroId, fecha, kilosTotal });
            }
        }

        if (typeof Asistencia !== 'undefined' && batchEntries.length > 0) {
            await Asistencia.syncAutoAsistenciaBatch(batchEntries);
        }

        if (saved === 0 && skipped === 0) {
            if (btnSave) { btnSave.disabled = false; btnSave.innerHTML = '<i data-lucide="check"></i> Guardar Jornales'; if (window.lucide) window.lucide.createIcons(); }
            return App.toast('No hay datos válidos para guardar', 'error');
        }

        if (saved === 0 && skipped > 0) {
            if (btnSave) { btnSave.disabled = false; btnSave.innerHTML = '<i data-lucide="check"></i> Guardar Jornales'; if (window.lucide) window.lucide.createIcons(); }
            return App.alert({
                title: 'Todos duplicados',
                message: `Los <strong>${skipped}</strong> jornales ya estaban registrados para esta fecha y lote.`,
                type: 'warning'
            });
        }

        const msg = skipped > 0
            ? `${saved} guardados — ${skipped} omitidos (dupl.) — ${totalKg.toLocaleString()} kg`
            : `${saved} guardados — ${totalKg.toLocaleString()} kg`;
        App.toast(msg, 'success');
        Jornales.limpiarRapido();
        Jornales.loadHistory();
        if (btnSave) { btnSave.disabled = false; btnSave.innerHTML = '<i data-lucide="check"></i> Guardar Jornales'; if (window.lucide) window.lucide.createIcons(); }
    },

    limpiarRapido() {
        document.querySelectorAll('.rr-am, .rr-pm').forEach(input => { input.value = ''; });
        document.querySelectorAll('.rr-total-text').forEach(cell => {
            cell.textContent = '—';
            cell.style.color = 'var(--text-muted)';
        });
        document.querySelectorAll('.rr-row').forEach(row => { row.style.background = 'var(--bg-surface)'; });
        Jornales.actualizarTotalesRapido();
    },

    /* ========================================
       TAB: Registro Individual
       ======================================== */
    async renderIndividual(container) {
        const obreros = (await db.getByFinca('obreros')).filter(o => o.estado === 'activo');
        const lotes = await db.getByFinca('lotes');
        const today = new Date().toLocaleDateString('en-CA');

        let tarifaKilo = 500, tarifaDia = 40000;
        try {
            tarifaKilo = await db.getConfig('tarifaKilo', 500);
            tarifaDia = await db.getConfig('tarifaDia', 40000);
        } catch (e) { console.warn('Usando tarifas locales por fallback'); }

        container.innerHTML = `
            <div class="card-premium mb-2 animate-in">
                <div class="header-premium mb-2" style="margin-bottom:24px">
                    <div class="header-icon"><i data-lucide="user-check"></i></div>
                    <div>
                        <h3 style="margin:0;font-size:1.1rem">Registro Individual</h3>
                    </div>
                </div>
                <form onsubmit="Jornales.save(event)">
                    <div class="grid-2" style="margin-bottom:16px">
                        <div class="input-group">
                            <label class="text-muted" style="font-size:0.8rem;text-transform:uppercase;font-weight:600;display:block;margin-bottom:8px">Fecha</label>
                            <input type="date" class="input-premium" id="jn-fecha" value="${today}" max="${today}" onchange="Jornales.validarFechaIndividual(this.value)" required>
                        </div>
                        <div class="input-group">
                            <label class="text-muted" style="font-size:0.8rem;text-transform:uppercase;font-weight:600;display:block;margin-bottom:8px">Tipo de pago</label>
                            <select class="input-premium" id="jn-tipo" onchange="Jornales.calcTotal()">
                                <option value="kilo">Por kilo ($${tarifaKilo.toLocaleString()}/kg)</option>
                                <option value="dia">Por día ($${tarifaDia.toLocaleString()})</option>
                            </select>
                        </div>
                    </div>
                    <div class="grid-2" style="margin-bottom:24px">
                        <div class="input-group">
                            <label class="text-muted" style="font-size:0.8rem;text-transform:uppercase;font-weight:600;display:block;margin-bottom:8px">Obrero</label>
                            <select class="input-premium" id="jn-obrero" required>
                                <option value="">Seleccionar...</option>
                                ${obreros.map(o => `<option value="${o.id}">${o.nombre}</option>`).join('')}
                            </select>
                        </div>
                        <div class="input-group">
                            <label class="text-muted" style="font-size:0.8rem;text-transform:uppercase;font-weight:600;display:block;margin-bottom:8px">Lote</label>
                            <select class="input-premium" id="jn-lote" required>
                                <option value="">Seleccionar...</option>
                                ${lotes.map(l => `<option value="${l.id}">${l.nombre}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <p class="text-muted" style="font-size:0.85rem;text-transform:uppercase;font-weight:700;margin-bottom:12px">Recolección por jornada</p>
                    <div class="card-premium" style="background:var(--bg-app)!important; box-shadow:none; margin-bottom:24px">
                        <div class="grid-2" style="margin-bottom:16px">
                            <div class="input-group">
                                <label class="text-muted" style="font-size:0.8rem;font-weight:600;display:block;margin-bottom:8px">Latas AM <span style="opacity:0.5">(Opc.)</span></label>
                                <input type="number" class="input-premium" id="jn-latas-am" step="0.5" min="0" placeholder="0" oninput="Jornales.convertLatas('am')">
                            </div>
                            <div class="input-group">
                                <label class="text-muted" style="font-size:0.8rem;font-weight:600;display:block;margin-bottom:8px">Latas PM <span style="opacity:0.5">(Opc.)</span></label>
                                <input type="number" class="input-premium" id="jn-latas-pm" step="0.5" min="0" placeholder="0" oninput="Jornales.convertLatas('pm')">
                            </div>
                        </div>
                        <div class="grid-3">
                            <div class="input-group">
                                <label class="text-muted" style="font-size:0.8rem;font-weight:600;display:block;margin-bottom:8px">Kilos AM</label>
                                <input type="tel" class="input-premium tabular-data" id="jn-kilos-am" step="0.01" min="0" placeholder="0" oninput="Jornales.calcTotal()" onfocus="this.select()">
                            </div>
                            <div class="input-group">
                                <label class="text-muted" style="font-size:0.8rem;font-weight:600;display:block;margin-bottom:8px">Kilos PM</label>
                                <input type="tel" class="input-premium tabular-data" id="jn-kilos-pm" step="0.01" min="0" placeholder="0" oninput="Jornales.calcTotal()" onfocus="this.select()">
                            </div>
                            <div class="input-group">
                                <label class="text-muted" style="font-size:0.8rem;font-weight:600;display:block;margin-bottom:8px">Total kilos</label>
                                <input type="text" class="input-premium tabular-data" id="jn-kilos-total" readonly style="font-weight:700;color:var(--color-primary);background:var(--bg-surface-hover)!important">
                            </div>
                        </div>
                    </div>

                    <div style="margin-bottom:24px">
                        <div class="input-group">
                            <label class="text-muted" style="font-size:0.8rem;text-transform:uppercase;font-weight:600;display:block;margin-bottom:8px">Total a pagar al obrero</label>
                            <input type="text" class="input-premium tabular-data" id="jn-total" readonly style="font-weight:700;font-size:1.1rem;color:var(--color-primary);background:var(--bg-surface-hover)!important">
                        </div>
                    </div>

                    <button type="submit" class="btn-premium primary" style="width:100%" id="btn-save-individual">
                        <i data-lucide="check-circle"></i> Registrar Jornal
                    </button>
                </form>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();
        Jornales.calcTotal();
        setTimeout(() => {
            Jornales.validarFechaIndividual(today);
        }, 150);
    },

    async convertLatas(jornada) {
        const kilosPorLata = await db.getConfig('kilosPorLata', 12.5);
        if (jornada === 'am') {
            const latas = parseFloat(document.getElementById('jn-latas-am').value) || 0;
            if (latas > 0) document.getElementById('jn-kilos-am').value = (latas * kilosPorLata).toFixed(1);
        } else {
            const latas = parseFloat(document.getElementById('jn-latas-pm').value) || 0;
            if (latas > 0) document.getElementById('jn-kilos-pm').value = (latas * kilosPorLata).toFixed(1);
        }
        await this.calcTotal();
    },

    async calcTotal() {
        const tipo = document.getElementById('jn-tipo')?.value;
        const kilosAM = parseFloat(document.getElementById('jn-kilos-am')?.value) || 0;
        const kilosPM = parseFloat(document.getElementById('jn-kilos-pm')?.value) || 0;
        const kilosTotal = kilosAM + kilosPM;

        const totalEl = document.getElementById('jn-kilos-total');
        if (totalEl) totalEl.value = kilosTotal.toLocaleString() + ' kg';

        let tarifaKilo = 500, tarifaDia = 40000;
        try {
            tarifaKilo = await db.getConfig('tarifaKilo', 500);
            tarifaDia = await db.getConfig('tarifaDia', 40000);
        } catch (e) { }

        let total = tipo === 'kilo' ? kilosTotal * tarifaKilo : tarifaDia;
        const el = document.getElementById('jn-total');
        if (el) el.value = '$' + total.toLocaleString();
    },

    async validarFechaRapido(fecha) {
        const isLocked = await Ciclos.isDateLocked(fecha);
        const btn = document.getElementById('btn-save-rapido');
        if (isLocked) {
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i data-lucide="lock"></i> Período Cerrado';
                if (window.lucide) window.lucide.createIcons();
            }
            App.toast('🔒 Período Cerrado: No es posible realizar modificaciones en este ciclo contable.', 'warning');
            document.querySelectorAll('.rr-am, .rr-pm').forEach(input => { input.disabled = true; });
        } else {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i data-lucide="check"></i> Guardar Jornales';
                if (window.lucide) window.lucide.createIcons();
            }
            document.querySelectorAll('.rr-am, .rr-pm').forEach(input => { input.disabled = false; });
        }
    },

    async validarFechaIndividual(fecha) {
        const isLocked = await Ciclos.isDateLocked(fecha);
        const btn = document.getElementById('btn-save-individual');
        const inputs = ['jn-tipo', 'jn-obrero', 'jn-lote', 'jn-latas-am', 'jn-latas-pm', 'jn-kilos-am', 'jn-kilos-pm'];
        if (isLocked) {
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i data-lucide="lock"></i> Período Cerrado';
                if (window.lucide) window.lucide.createIcons();
            }
            App.toast('🔒 Período Cerrado: No es posible realizar modificaciones en este ciclo contable.', 'warning');
            inputs.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.disabled = true;
            });
        } else {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i data-lucide="check-circle"></i> Registrar Jornal';
                if (window.lucide) window.lucide.createIcons();
            }
            inputs.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.disabled = false;
            });
        }
    },

    async save(e) {
        e.preventDefault();

        const cicloActivo = await db.getCicloActivo();
        if (!cicloActivo) {
            return App.alert({ title: 'Ciclo inactivo', message: 'No hay un ciclo activo. Debes abrir un ciclo antes de guardar jornales.', type: 'warning' });
        }

        const obreroId = parseInt(document.getElementById('jn-obrero').value);
        const loteId = parseInt(document.getElementById('jn-lote').value);
        const fecha = document.getElementById('jn-fecha').value;

        const lockedCycle = await Ciclos.isDateLocked(fecha);
        if (lockedCycle) {
            return App.alert({
                title: 'Semana cerrada',
                message: `<div style="margin-bottom:0.75rem"><strong>Semana:</strong> ${lockedCycle.nombre} (${Ciclos.formatFecha(lockedCycle.fechaInicio || lockedCycle.fechainicio)} – ${Ciclos.formatFecha(lockedCycle.fechaFin || lockedCycle.fechafin)})</div>La nómina de esta semana ya fue liquidada.<br>No se pueden modificar registros históricos.`,
                type: 'error'
            });
        }

        const kilosAM = parseFloat(document.getElementById('jn-kilos-am').value) || 0;
        const kilosPM = parseFloat(document.getElementById('jn-kilos-pm').value) || 0;
        const kilosTotal = kilosAM + kilosPM;
        const tipo = document.getElementById('jn-tipo').value;

        if (!obreroId || !loteId) return App.toast('Selecciona obrero y lote', 'error');

        if (tipo === 'kilo' && kilosTotal <= 0) {
            return App.alert({ title: 'Atención', message: 'Registra una cantidad superior a cero kilos.', type: 'warning' });
        }

        const btnSave = document.getElementById('btn-save-individual');
        if (btnSave) { btnSave.disabled = true; btnSave.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Guardando...'; if (window.lucide) window.lucide.createIcons(); }

        const fincaId = db.getFincaActiva();
        const duplicado = await db.existeJornal(obreroId, fecha, loteId, fincaId);
        if (duplicado) {
            if (btnSave) { btnSave.disabled = false; btnSave.innerHTML = '<i data-lucide="check-circle"></i> Registrar Jornal'; if (window.lucide) window.lucide.createIcons(); }
            return App.alert({
                title: 'Jornal duplicado',
                message: 'Este obrero ya tiene un jornal registrado para esta <strong>fecha y lote</strong>. No se puede duplicar.',
                type: 'warning'
            });
        }

        const tarifaKilo = await db.getConfig('tarifaKilo', 500);
        const tarifaDia = await db.getConfig('tarifaDia', 40000);
        const totalDia = tipo === 'kilo' ? kilosTotal * tarifaKilo : tarifaDia;

        await db.add('jornales', {
            obreroId, loteId, fecha,
            kilosAM, kilosPM,
            kilosRecolectados: kilosTotal,
            tipoPago: tipo,
            tarifaDia: tipo === 'dia' ? tarifaDia : tarifaKilo,
            totalDia,
            fincaId: db.getFincaActiva(),
            cicloId: cicloActivo.id
        });

        if (typeof Asistencia !== 'undefined') {
            await Asistencia.syncAutoAsistencia(obreroId, fecha, kilosTotal, false);
        }

        App.toast('Jornal registrado', 'success');
        document.getElementById('jn-latas-am').value = '';
        document.getElementById('jn-latas-pm').value = '';
        document.getElementById('jn-kilos-am').value = '';
        document.getElementById('jn-kilos-pm').value = '';
        Jornales.calcTotal();
        Jornales.loadHistory();
        if (btnSave) { btnSave.disabled = false; btnSave.innerHTML = '<i data-lucide="check-circle"></i> Registrar Jornal'; if (window.lucide) window.lucide.createIcons(); }
    },

    /* ========================================
       History (shared)
       ======================================== */
    async loadHistory() {
        const filterFecha = document.getElementById('jn-filter-fecha')?.value || '';
        const filterObrero = document.getElementById('jn-filter-obrero')?.value || '';
        const filterLote = document.getElementById('jn-filter-lote')?.value || '';

        let jornales = await db.getByFinca('jornales');
        const obreros = (await db.getByFinca('obreros')).filter(o => o.estado !== 'inactivo');
        const lotes = await db.getByFinca('lotes');

        const obMap = Object.fromEntries(obreros.map(o => [o.id, o.nombre]));
        const ltMap = Object.fromEntries(lotes.map(l => [l.id, l.nombre]));

        if (filterFecha) jornales = jornales.filter(j => j.fecha === filterFecha);
        if (filterObrero) jornales = jornales.filter(j => j.obreroId === parseInt(filterObrero));
        if (filterLote) jornales = jornales.filter(j => j.loteId === parseInt(filterLote));

        jornales.sort((a, b) => b.fecha.localeCompare(a.fecha));

        // Summary
        const totalKilos = jornales.reduce((s, j) => s + (j.kilosRecolectados || 0), 0);
        const totalAM = jornales.reduce((s, j) => s + (j.kilosAM || 0), 0);
        const totalPM = jornales.reduce((s, j) => s + (j.kilosPM || 0), 0);
        const totalPagar = jornales.reduce((s, j) => s + (j.totalDia || 0), 0);

        const resEl = document.getElementById('jornales-resumen');
        if (resEl) {
            resEl.innerHTML = `
                <div class="card-premium" style="padding:16px; display:flex; flex-direction:column; justify-content:space-between">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px">
                        <div class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:700">Registros</div>
                        <div style="background:var(--bg-app); color:var(--text-main); border-radius:8px; padding:6px; border:1px solid var(--border-color)"><i data-lucide="file-check-2" style="width:16px; height:16px"></i></div>
                    </div>
                    <div class="tabular-data" style="font-size:1.6rem; font-weight:800; color:var(--text-main)">${jornales.length}</div>
                </div>

                <div class="card-premium" style="padding:16px; display:flex; flex-direction:column; justify-content:space-between">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px">
                        <div class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:700">Total Kilos</div>
                        <div style="background:rgba(34, 197, 94, 0.1); color:var(--color-success); border-radius:8px; padding:6px"><i data-lucide="scale" style="width:16px; height:16px"></i></div>
                    </div>
                    <div class="tabular-data" style="font-size:1.6rem; font-weight:800; color:var(--color-success)">${totalKilos.toLocaleString()} <span style="font-size:0.9rem; color:var(--text-muted); font-weight:600">kg</span></div>
                </div>

                <div class="card-premium" style="padding:16px; display:flex; flex-direction:column; justify-content:space-between">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px">
                        <div class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:700">Nómina Diaria</div>
                        <div style="background:rgba(245, 158, 11, 0.1); color:var(--color-primary); border-radius:8px; padding:6px"><i data-lucide="coins" style="width:16px; height:16px"></i></div>
                    </div>
                    <div class="tabular-data" style="font-size:1.6rem; font-weight:800; color:var(--text-main)">$${totalPagar.toLocaleString()}</div>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
        }

        const tbody = document.getElementById('jornales-body');
        if (tbody) {
            tbody.innerHTML = jornales.length === 0
                ? '<tr><td colspan="8" class="text-center text-muted" style="padding:60px 20px"><i data-lucide="file-x" style="width:48px;height:48px;opacity:0.2;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto"></i>No se encontraron jornales registrados bajo estos filtros.</td></tr>'
                : jornales.map(j => `
                    <tr style="border-bottom: 1px solid var(--border-color); transition: background 0.2s" class="hover-bg-surface">
                        <td style="padding:16px 20px">
                            <div style="display:flex; align-items:center; gap:8px">
                                <i data-lucide="calendar" style="width:14px; opacity:0.5; color:var(--text-muted)"></i>
                                <span style="font-weight:600; font-size:0.9rem">${Ciclos.formatFecha(j.fecha)}</span>
                            </div>
                        </td>
                        <td style="padding:16px">
                            <div style="font-weight:700; color:var(--text-main)">${obMap[j.obreroId] || '?'}</div>
                        </td>
                        <td style="padding:16px">
                            <div style="background:var(--bg-surface-hover); display:inline-flex; align-items:center; padding:4px 8px; border-radius:6px; font-size:0.8rem; font-weight:600; color:var(--text-muted)"><i data-lucide="map-pin" style="width:12px; margin-right:4px"></i> ${ltMap[j.loteId] || '?'}</div>
                        </td>
                        <td style="padding:16px; text-align:center">
                            <div class="text-muted" style="font-size:0.85rem">${(j.kilosAM || 0).toLocaleString()} <span style="opacity:0.5; margin:0 4px">|</span> ${(j.kilosPM || 0).toLocaleString()}</div>
                        </td>
                        <td style="padding:16px; text-align:right">
                            <div class="tabular-data" style="font-weight:800; color:var(--color-success); font-size:1rem">${(j.kilosRecolectados || 0).toLocaleString()} <span style="font-size:0.75rem">kg</span></div>
                        </td>
                        <td style="padding:16px; text-align:center">
                            <span class="badge" style="font-size:0.7rem; padding:4px 8px; border-radius:12px; ${j.tipoPago === 'kilo' ? 'background:rgba(34, 197, 94, 0.1); color:var(--color-success)' : 'background:rgba(245, 158, 11, 0.1); color:#f59e0b'}">
                                ${j.tipoPago === 'kilo' ? 'Por Kilo' : 'Por Día'}
                            </span>
                        </td>
                        <td style="padding:16px; text-align:right">
                            <div class="tabular-data" style="font-weight:800; color:var(--text-main); font-size:1rem">$${(j.totalDia || 0).toLocaleString()}</div>
                        </td>
                        <td style="padding:16px; text-align:center">
                            <button class="btn-icon-only" style="color:var(--color-danger); border:none; background:transparent; width:32px; height:32px; transition:all 0.2s" onmouseover="this.style.background='rgba(239, 68, 68, 0.1)'" onmouseout="this.style.background='transparent'" onclick="Jornales.remove(${j.id})" title="Eliminar registro">
                                <i data-lucide="trash-2" style="width:16px; opacity:0.8"></i>
                            </button>
                        </td>
                    </tr>
                `).join('');
            if (window.lucide) window.lucide.createIcons();
        }
    },

    async remove(id) {
        const registro = await db.get('jornales', id);
        if (registro && registro.cicloId) {
            const ciclo = await db.get('ciclos', registro.cicloId);
            if (ciclo && !ciclo.activo) {
                return App.alert({ title: 'Semana cerrada', message: 'La nómina de esta semana ya fue liquidada.<br>No se pueden modificar registros históricos.', type: 'error' });
            }
        }

        App.confirmDelete({
            title: 'Eliminar jornal',
            message: '¿Estás seguro de eliminar este registro?',
            onConfirm: async () => {
                const trObreroId = registro.obreroId;
                const trFecha = registro.fecha;
                const trKilos = registro.kilosRecolectados;

                await db.delete('jornales', id);

                if (typeof Asistencia !== 'undefined') {
                    await Asistencia.syncAutoAsistencia(trObreroId, trFecha, trKilos, true);
                }

                App.toast('Registro eliminado', 'success');
                Jornales.render();
            }
        });
    }
};
