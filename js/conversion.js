/* ============================================
   conversion.js — Conversión Café Rojo → Mojado
   ============================================ */

const Conversion = {
    async render() {
        const factor = await db.getConfig('factorConversion', 0.5);
        const lotes = await db.getByFinca('lotes');
        const today = new Date().toLocaleDateString('en-CA');

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="animate-in">
                <div class="header-premium" style="margin-bottom:24px">
                    <div class="header-icon" style="background:rgba(234, 88, 12, 0.1); color:var(--color-warning)"><i data-lucide="refresh-cw"></i></div>
                    <div>
                        <h2>Conversión de Café</h2>
                        <p>Simulador y registro de Cereza (Rojo) a Pergamino (Mojado)</p>
                    </div>
                </div>

                <div class="card-premium mb-2">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:16px; font-weight:700; color:var(--text-main); font-size:1.1rem">
                        <i data-lucide="scale" style="color:var(--color-primary)"></i> Calculadora de Conversión
                    </div>
                    <form onsubmit="Conversion.save(event)">
                        <div class="grid-2" style="margin-bottom:16px; gap:16px">
                            <div class="input-group">
                                <label>Fecha</label>
                                <input type="date" id="cv-fecha" value="${today}" required style="font-family:var(--font-mono)">
                            </div>
                            <div class="input-group">
                                <label>Lote de Origen <span class="text-muted">(Opcional)</span></label>
                                <select id="cv-lote" onchange="Conversion.onLoteChange()">
                                    <option value="">Promedio Global (Factor: ${factor})</option>
                                    ${lotes.map(l => `<option value="${l.id}">${l.nombre}${l.factorRendimiento ? ` (Rend.: ${l.factorRendimiento})` : ''}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        
                        <div style="background:var(--bg-app); border:1px solid var(--border-color); border-radius:8px; padding:20px; margin-bottom:16px; display:flex; gap:20px; align-items:center; flex-wrap:wrap">
                            <div class="input-group" style="flex:1; min-width:200px; margin:0">
                                <label style="display:flex; align-items:center; gap:6px; color:var(--color-danger)"><i data-lucide="cherry" style="width:16px;height:16px"></i> Kilos Cereza (Rojo)</label>
                                <input type="number" id="cv-rojo" step="0.1" min="0" required placeholder="0.0" oninput="Conversion.calcular()" class="tabular-data" style="font-size:1.2rem; font-weight:700">
                            </div>

                            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; color:var(--text-muted); opacity:0.5; font-size:0.8rem">
                                <i data-lucide="arrow-right" style="margin-bottom:4px"></i>
                                x <span id="cv-factor-display">${factor}</span>
                            </div>

                            <div class="input-group" style="flex:1; min-width:200px; margin:0">
                                <label style="display:flex; align-items:center; gap:6px; color:var(--color-primary)"><i data-lucide="droplet" style="width:16px;height:16px"></i> Kilos Pergamino (Mojado)</label>
                                <input type="text" id="cv-mojado" readonly class="tabular-data" style="font-weight:700; color:var(--color-primary)!important; font-size:1.2rem; background:var(--bg-surface-hover); border-color:var(--color-primary)">
                            </div>
                        </div>

                        <div class="input-group" style="margin-bottom:24px; padding-bottom:24px; border-bottom:1px dashed var(--border-color)">
                            <label style="display:flex; justify-content:space-between">
                                Factor de Rendimiento (Masa)
                                <small class="text-muted" style="font-weight:normal">Ej: 0.50 = 50%</small>
                            </label>
                            <input type="number" id="cv-factor" value="${factor}" step="0.01" min="0.01" max="1" oninput="Conversion.syncFactorDisplay(); Conversion.calcular()" class="tabular-data">
                        </div>
                        <button type="submit" class="btn-premium primary w-100" style="justify-content:center">
                            <i data-lucide="save"></i> Registrar Conversión en Historial
                        </button>
                    </form>
                </div>

                <div id="conversion-resumen" class="grid-3 mb-2" style="gap:16px"></div>

                <div class="header-premium" style="margin-top:24px; margin-bottom:16px;">
                    <div class="header-icon" style="background:var(--bg-surface-hover); color:var(--text-main)"><i data-lucide="history"></i></div>
                    <div>
                        <h3 style="margin:0; font-size:1.1rem">Historial de Rendimientos</h3>
                    </div>
                </div>

                <div class="card-premium table-wrapper" style="padding:0; overflow:hidden">
                    <table style="width:100%; border-collapse:collapse">
                        <thead style="background:var(--bg-surface-hover); color:var(--text-muted); text-transform:uppercase; font-size:0.75rem; font-weight:700">
                            <tr>
                                <th style="padding:16px; text-align:left; border-bottom:1px solid var(--border-color)">Fecha</th>
                                <th style="padding:16px; text-align:left; border-bottom:1px solid var(--border-color)">Origen</th>
                                <th style="padding:16px; text-align:right; border-bottom:1px solid var(--border-color)">Peso Rojo</th>
                                <th style="padding:16px; text-align:center; border-bottom:1px solid var(--border-color)">Factor</th>
                                <th style="padding:16px; text-align:right; border-bottom:1px solid var(--border-color)">Peso Mojado</th>
                                <th style="padding:16px; text-align:center; border-bottom:1px solid var(--border-color)"></th>
                            </tr>
                        </thead>
                        <tbody id="conversion-body" class="tabular-data"></tbody>
                    </table>
                </div>
            </div >
    `;

        Conversion.calcular();
        Conversion.loadHistory();
    },

    async calcular() {
        const rojo = parseFloat(document.getElementById('cv-rojo')?.value) || 0;
        const factor = parseFloat(document.getElementById('cv-factor')?.value) || 0.5;
        const mojado = rojo * factor;
        const el = document.getElementById('cv-mojado');
        if (el) el.value = mojado.toFixed(1) + ' kg';
    },

    syncFactorDisplay() {
        const factor = document.getElementById('cv-factor')?.value;
        const display = document.getElementById('cv-factor-display');
        if (display && factor) display.innerText = factor;
    },

    async onLoteChange() {
        const loteId = document.getElementById('cv-lote')?.value;
        if (!loteId) {
            const factor = await db.getConfig('factorConversion', 0.5);
            document.getElementById('cv-factor').value = factor;
        } else {
            const lote = await db.get('lotes', parseInt(loteId));
            if (lote && lote.factorRendimiento) {
                document.getElementById('cv-factor').value = lote.factorRendimiento;
            } else {
                const factor = await db.getConfig('factorConversion', 0.5);
                document.getElementById('cv-factor').value = factor;
            }
        }
        Conversion.calcular();
    },

    async save(e) {
        e.preventDefault();
        const fecha = document.getElementById('cv-fecha').value;
        const loteId = document.getElementById('cv-lote').value ? parseInt(document.getElementById('cv-lote').value) : null;
        const kilosRojo = parseFloat(document.getElementById('cv-rojo').value) || 0;
        const factor = parseFloat(document.getElementById('cv-factor').value) || 0.5;
        const kilosMojado = kilosRojo * factor;

        if (kilosRojo <= 0) return App.toast('Ingresa los kilos de café rojo', 'error');

        await db.add('conversion', { fecha, loteId, kilosRojo, factor, kilosMojado, fincaId: db.getFincaActiva() });

        // Save factor for future use if no lot specific factor
        if (!loteId) await db.setConfig('factorConversion', factor);

        App.toast('Conversión registrada', 'success');
        document.getElementById('cv-rojo').value = '';
        Conversion.calcular();
        Conversion.loadHistory();
    },

    async loadHistory() {
        let conversiones = await db.getByFinca('conversion');
        let lotes = await db.getByFinca('lotes');
        let loteMap = Object.fromEntries(lotes.map(l => [l.id, l.nombre]));

        conversiones.sort((a, b) => b.fecha.localeCompare(a.fecha));

        const totalRojo = conversiones.reduce((s, c) => s + (c.kilosRojo || 0), 0);
        const totalMojado = conversiones.reduce((s, c) => s + (c.kilosMojado || 0), 0);

        const resEl = document.getElementById('conversion-resumen');
        if (resEl) {
            resEl.innerHTML = `
                <div class="stat-card" style="background:var(--bg-app)!important; border:1px solid var(--border-color)!important">
                    <div class="stat-icon warn" style="background:rgba(239, 68, 68, 0.1); color:var(--color-danger)"><i data-lucide="cherry"></i></div>
                    <div class="stat-value tabular-data" style="color:var(--color-danger)">${totalRojo.toLocaleString()} kg</div>
                    <div class="stat-label">Total Cereza Histórico</div>
                </div>
                <div class="stat-card" style="background:var(--bg-app)!important; border:1px solid var(--border-color)!important">
                    <div class="stat-icon info" style="background:rgba(37, 99, 235, 0.1); color:var(--color-primary)"><i data-lucide="droplet"></i></div>
                    <div class="stat-value tabular-data" style="color:var(--color-primary)">${totalMojado.toLocaleString()} kg</div>
                    <div class="stat-label">Total Pergamino Histórico</div>
                </div>
                <div class="stat-card" style="background:var(--bg-app)!important; border:1px solid var(--border-color)!important">
                    <div class="stat-icon" style="background:var(--bg-surface-hover); color:var(--text-main)"><i data-lucide="history"></i></div>
                    <div class="stat-value tabular-data">${conversiones.length}</div>
                    <div class="stat-label">Registros Guardados</div>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
        }

        const tbody = document.getElementById('conversion-body');
        if (tbody) {
            tbody.innerHTML = conversiones.length === 0
                ? '<tr><td colspan="6" class="text-center text-muted" style="padding:32px 16px"><i data-lucide="ghost" style="width:32px;height:32px;opacity:0.2;margin-bottom:8px"></i><br>Sin registros de conversión</td></tr>'
                : conversiones.map(c => `
                    <tr style="border-bottom:1px solid var(--border-color)">
                        <td style="padding:12px 16px; color:var(--text-muted); font-size:0.85rem">${c.fecha}</td>
                        <td style="padding:12px 16px; font-weight:600">${c.loteId ? loteMap[c.loteId] || '—' : 'Global Finca'}</td>
                        <td style="padding:12px 16px; text-align:right">${(c.kilosRojo || 0).toLocaleString()} kg</td>
                        <td style="padding:12px 16px; text-align:center; color:var(--text-muted)">x ${c.factor}</td>
                        <td style="padding:12px 16px; text-align:right; font-weight:700; color:var(--color-primary)">${(c.kilosMojado || 0).toLocaleString()} kg</td>
                        <td style="padding:12px 16px; text-align:center">
                            <button class="btn-icon" style="color:var(--color-danger); padding:4px;" onclick="Conversion.remove(${c.id})" title="Eliminar"><i data-lucide="trash-2" style="width:16px;height:16px"></i></button>
                        </td>
                    </tr>
                `).join('');
            if (window.lucide) window.lucide.createIcons();
        }
    },

    async remove(id) {
        App.confirmDelete({
            title: 'Eliminar conversión',
            message: '¿Eliminar este registro de conversión? Esta acción no se puede deshacer.',
            onConfirm: async () => {
                await db.delete('conversion', id);
                App.toast('Registro eliminado', 'info');
                Conversion.loadHistory();
            }
        });
    }
};
