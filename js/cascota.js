/* ============================================
   cascota.js — Control de Cascota
   ============================================ */

const Cascota = {
    async render() {
        const lotes = await db.getByFinca('lotes');
        const today = new Date().toLocaleDateString('en-CA');

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="animate-in">
                <div class="header-premium" style="margin-bottom:24px">
                    <div class="header-icon" style="background:rgba(234, 179, 8, 0.1); color:var(--color-warning)"><i data-lucide="leaf"></i></div>
                    <div>
                        <h2>Control de Cascota</h2>
                        <p>Registro y seguimiento de pasilla y subproductos</p>
                    </div>
                </div>

                <div class="card-premium mb-2">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:16px; font-weight:700; color:var(--text-main); font-size:1.1rem">
                        <i data-lucide="plus-circle" style="color:var(--color-primary)"></i> Registrar Cascota
                    </div>
                    <form onsubmit="Cascota.save(event)">
                        <div class="grid-2" style="gap:16px; margin-bottom:16px">
                            <div class="input-group">
                                <label>Fecha de Registro</label>
                                <input type="date" id="cs-fecha" value="${today}" required style="font-family:var(--font-mono)">
                            </div>
                            <div class="input-group">
                                <label>Lote de Origen <span class="text-danger">*</span></label>
                                <select id="cs-lote" required>
                                    <option value="" disabled selected>Seleccionar lote...</option>
                                    ${lotes.map(l => `<option value="${l.id}">${l.nombre}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        <div class="input-group" style="margin-bottom:24px">
                            <label style="display:flex; align-items:center; gap:6px; color:var(--color-warning)"><i data-lucide="weight" style="width:16px;height:16px"></i> Peso en Kilos (Kg)</label>
                            <input type="number" id="cs-kilos" step="0.1" min="0" required placeholder="0.0" class="tabular-data" style="font-size:1.2rem; font-weight:700">
                        </div>
                        <button type="submit" class="btn-premium primary w-100" style="justify-content:center">
                            <i data-lucide="save"></i> Guardar Registro de Cascota
                        </button>
                    </form>
                </div>

                <div class="header-premium" style="margin-top:24px; margin-bottom:16px;">
                    <div class="header-icon" style="background:var(--bg-surface-hover); color:var(--text-main)"><i data-lucide="bar-chart-2"></i></div>
                    <div>
                        <h3 style="margin:0; font-size:1.1rem">Acumulado por Lote</h3>
                    </div>
                </div>

                <!-- Resumen por lote -->
                <div id="cascota-por-lote" class="grid-2 mb-2" style="gap:16px"></div>

                <div class="header-premium" style="margin-top:24px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; align-items:center; gap:12px">
                        <div class="header-icon" style="background:var(--bg-surface-hover); color:var(--text-main); width:32px; height:32px"><i data-lucide="list" style="width:16px; height:16px"></i></div>
                        <h3 style="margin:0; font-size:1.1rem">Historial de Registros</h3>
                    </div>
                    <div style="max-width:200px">
                        <select id="cs-filter-lote" onchange="Cascota.loadHistory()" style="background:var(--bg-surface); border-color:var(--border-color); font-size:0.85rem">
                            <option value="">Filtro: Todos los lotes</option>
                            ${lotes.map(l => `<option value="${l.id}">${l.nombre}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div class="card-premium table-wrapper" style="padding:0; overflow:hidden">
                    <table style="width:100%; border-collapse:collapse">
                        <thead style="background:var(--bg-surface-hover); color:var(--text-muted); text-transform:uppercase; font-size:0.75rem; font-weight:700">
                            <tr>
                                <th style="padding:16px; text-align:left; border-bottom:1px solid var(--border-color)">Fecha</th>
                                <th style="padding:16px; text-align:left; border-bottom:1px solid var(--border-color)">Lote (Origen)</th>
                                <th style="padding:16px; text-align:right; border-bottom:1px solid var(--border-color)">Peso Registrado</th>
                                <th style="padding:16px; text-align:center; border-bottom:1px solid var(--border-color)"></th>
                            </tr>
                        </thead>
                        <tbody id="cascota-body" class="tabular-data"></tbody>
                    </table>
                </div>
            </div>
        `;

        Cascota.loadResumenPorLote();
        Cascota.loadHistory();
    },

    async save(e) {
        e.preventDefault();
        const loteId = parseInt(document.getElementById('cs-lote').value);
        const fecha = document.getElementById('cs-fecha').value;
        const kilos = parseFloat(document.getElementById('cs-kilos').value) || 0;

        if (!loteId) return App.toast('Selecciona un lote', 'error');
        if (kilos <= 0) return App.toast('Ingresa una cantidad válida', 'error');

        await db.add('cascota', { loteId, fecha, kilos, fincaId: db.getFincaActiva() });
        App.toast('Cascota registrada', 'success');
        document.getElementById('cs-kilos').value = '';
        Cascota.loadResumenPorLote();
        Cascota.loadHistory();
    },

    async loadResumenPorLote() {
        const lotes = await db.getByFinca('lotes');
        const cascota = await db.getByFinca('cascota');
        const container = document.getElementById('cascota-por-lote');
        if (!container) return;

        if (lotes.length === 0) {
            container.innerHTML = '';
            return;
        }

        const porLote = {};
        lotes.forEach(l => { porLote[l.id] = { nombre: l.nombre, total: 0 }; });
        cascota.forEach(c => {
            if (porLote[c.loteId]) porLote[c.loteId].total += c.kilos || 0;
        });

        container.innerHTML = Object.entries(porLote).map(([id, data]) => `
            <div class="stat-card" style="background:var(--bg-app)!important; border:1px solid var(--border-color)!important; flex-direction:row; align-items:center; justify-content:space-between">
                <div style="display:flex; flex-direction:column; gap:4px">
                    <div class="stat-label" style="font-size:0.85rem">${data.nombre}</div>
                    <div class="stat-value tabular-data" style="color:var(--color-warning); font-size:1.3rem">${data.total.toLocaleString()} kg</div>
                </div>
                <div class="stat-icon warn" style="background:rgba(234, 179, 8, 0.1); color:var(--color-warning); margin:0"><i data-lucide="leaf"></i></div>
            </div>
        `).join('');
        if (window.lucide) window.lucide.createIcons();
    },

    async loadHistory() {
        const filterLote = document.getElementById('cs-filter-lote')?.value || '';
        let cascota = await db.getByFinca('cascota');
        const lotes = await db.getByFinca('lotes');
        const ltMap = Object.fromEntries(lotes.map(l => [l.id, l.nombre]));

        if (filterLote) cascota = cascota.filter(c => c.loteId === parseInt(filterLote));
        cascota.sort((a, b) => b.fecha.localeCompare(a.fecha));

        const tbody = document.getElementById('cascota-body');
        if (tbody) {
            tbody.innerHTML = cascota.length === 0
                ? '<tr><td colspan="4" class="text-center text-muted" style="padding:32px 16px"><i data-lucide="ghost" style="width:32px;height:32px;opacity:0.2;margin-bottom:8px"></i><br>Sin registros de cascota</td></tr>'
                : cascota.map(c => `
                    <tr style="border-bottom:1px solid var(--border-color)">
                        <td style="padding:12px 16px; color:var(--text-muted); font-size:0.85rem">${c.fecha}</td>
                        <td style="padding:12px 16px; font-weight:600">${ltMap[c.loteId] || '?'}</td>
                        <td style="padding:12px 16px; text-align:right; font-weight:700; color:var(--color-warning)">${(c.kilos || 0).toLocaleString()} kg</td>
                        <td style="padding:12px 16px; text-align:center">
                            <button class="btn-icon" style="color:var(--color-danger); padding:4px;" onclick="Cascota.remove(${c.id})" title="Eliminar"><i data-lucide="trash-2" style="width:16px;height:16px"></i></button>
                        </td>
                    </tr>
                `).join('');
            if (window.lucide) window.lucide.createIcons();
        }
    },

    async remove(id) {
        App.confirmDelete({
            title: 'Eliminar registro de cascota',
            message: '¿Eliminar este registro? Esta acción no se puede deshacer.',
            onConfirm: async () => {
                await db.delete('cascota', id);
                App.toast('Registro eliminado', 'info');
                Cascota.loadResumenPorLote();
                Cascota.loadHistory();
            }
        });
    }
};
