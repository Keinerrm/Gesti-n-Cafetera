/* ============================================
   transporte.js — Registro de Transporte/Fletes
   ============================================ */

const Transporte = {
    async render() {
        const lotes = await db.getByFinca('lotes');
        const activeLotes = lotes.filter(l => l.estado !== 'inactivo');
        const today = new Date().toLocaleDateString('en-CA');
        const app = document.getElementById('app');

        app.innerHTML = `
            <div class="animate-in">
                <div class="header-premium" style="margin-bottom:24px">
                    <div class="header-icon" style="background:rgba(37, 99, 235, 0.1); color:var(--text-main)"><i data-lucide="truck"></i></div>
                    <div>
                        <h2>Transporte y Fletes</h2>
                        <p>Registro de movimientos de remesas</p>
                    </div>
                </div>
                
                <div class="card-premium mb-2">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:16px; font-weight:700; color:var(--text-main); font-size:1.1rem">
                        <i data-lucide="plus-circle" style="color:var(--color-primary)"></i> Registrar Viaje
                    </div>
                    <form onsubmit="Transporte.save(event)">
                        <div class="grid-3" style="margin-bottom:16px">
                            <div class="input-group">
                                <label>Fecha</label>
                                <input type="date" id="tr-fecha" value="${today}" max="${today}" required style="font-family:var(--font-mono)">
                            </div>
                            <div class="input-group">
                                <label>Lote Origen <span class="text-danger">*</span></label>
                                <select id="tr-lote" required>
                                    <option value="" disabled selected>Seleccionar...</option>
                                    ${activeLotes.map(l => `<option value="${l.id}">${l.nombre}</option>`).join('')}
                                </select>
                            </div>
                            <div class="input-group">
                                <label>Transportista <span class="text-danger">*</span></label>
                                <input type="text" id="tr-nombre" placeholder="Nombre conductor/vehículo" required>
                            </div>
                        </div>

                        <div class="grid-2 mt-1" style="gap:16px; margin-bottom:16px">
                            <div style="background:var(--bg-app); border:1px solid var(--border-color); border-radius:8px; padding:16px">
                                <p style="margin:0 0 12px 0; font-weight:600; font-size:0.95rem; color:var(--text-main); display:flex; align-items:center; gap:6px"><i data-lucide="droplet" style="color:var(--color-primary); width:18px;height:18px"></i> Café Mojado</p>
                                <div class="grid-2" style="gap:12px">
                                    <div class="input-group">
                                        <label>Cant. Latas</label>
                                        <input type="number" id="tr-latas-mojado" step="0.01" min="0" placeholder="0" oninput="Transporte.calcTotal()" class="tabular-data">
                                    </div>
                                    <div class="input-group">
                                        <label>Precio und ($)</label>
                                        <input type="number" id="tr-precio-mojado" step="0.01" min="0" placeholder="0" oninput="Transporte.calcTotal()" class="tabular-data">
                                    </div>
                                </div>
                            </div>
                            <div style="background:var(--bg-app); border:1px solid var(--border-color); border-radius:8px; padding:16px">
                                <p style="margin:0 0 12px 0; font-weight:600; font-size:0.95rem; color:var(--text-main); display:flex; align-items:center; gap:6px"><i data-lucide="leaf" style="color:var(--color-warning); width:18px;height:18px"></i> Cascota (Seco)</p>
                                <div class="grid-2" style="gap:12px">
                                    <div class="input-group">
                                        <label>Cant. Bultos/Latas</label>
                                        <input type="number" id="tr-latas-cascota" step="0.01" min="0" placeholder="0" oninput="Transporte.calcTotal()" class="tabular-data">
                                    </div>
                                    <div class="input-group">
                                        <label>Precio und ($)</label>
                                        <input type="number" id="tr-precio-cascota" step="0.01" min="0" placeholder="0" oninput="Transporte.calcTotal()" class="tabular-data">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="grid-2 mt-1" style="gap:16px; margin-bottom:16px">
                            <div class="input-group">
                                <label>Observaciones</label>
                                <input type="text" id="tr-notas" placeholder="Ej. Placa del carro, tipo de pesaje">
                            </div>
                            <div class="input-group">
                                <label>Total Estimado a Pagar</label>
                                <input type="text" id="tr-total" readonly class="tabular-data" style="font-weight:700;font-size:1.2rem;color:var(--color-primary)!important;background:var(--bg-surface-hover); border-color:var(--color-primary)">
                            </div>
                        </div>

                        <button type="submit" class="btn-premium primary w-100" id="btn-save-transporte" style="justify-content:center">
                            <i data-lucide="save"></i> Registrar Costo Flete
                        </button>
                    </form>
                </div>

                <div class="header-premium" style="margin-top:24px; margin-bottom:16px;">
                    <div class="header-icon" style="background:var(--bg-surface-hover); color:var(--text-main)"><i data-lucide="history"></i></div>
                    <div>
                        <h3 style="margin:0; font-size:1.1rem">Historial de Viajes</h3>
                    </div>
                </div>
                
                <div class="card-premium table-wrapper" style="padding:0; overflow:hidden">
                    <table style="width:100%; border-collapse:collapse">
                        <thead style="background:var(--bg-surface-hover); color:var(--text-muted); text-transform:uppercase; font-size:0.75rem; font-weight:700">
                            <tr>
                                <th style="padding:16px; text-align:left; border-bottom:1px solid var(--border-color)">Fecha</th>
                                <th style="padding:16px; text-align:left; border-bottom:1px solid var(--border-color)">Lote (Origen)</th>
                                <th style="padding:16px; text-align:left; border-bottom:1px solid var(--border-color)">Transportista</th>
                                <th style="padding:16px; text-align:right; border-bottom:1px solid var(--border-color)">Carga Moj.</th>
                                <th style="padding:16px; text-align:right; border-bottom:1px solid var(--border-color)">Carga Casc.</th>
                                <th style="padding:16px; text-align:right; border-bottom:1px solid var(--border-color)">Costo Total</th>
                                <th style="padding:16px; text-align:center; border-bottom:1px solid var(--border-color)"></th>
                            </tr>
                        </thead>
                        <tbody id="tr-body" class="tabular-data"></tbody>
                    </table>
                </div>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        Transporte.loadHistory();
    },

    calcTotal() {
        const mojadas = parseFloat(document.getElementById('tr-latas-mojado').value) || 0;
        const pm = parseFloat(document.getElementById('tr-precio-mojado').value) || 0;
        const cascotas = parseFloat(document.getElementById('tr-latas-cascota').value) || 0;
        const pc = parseFloat(document.getElementById('tr-precio-cascota').value) || 0;

        const total = (mojadas * pm) + (cascotas * pc);
        document.getElementById('tr-total').value = '$' + total.toLocaleString();
    },

    async save(e) {
        e.preventDefault();

        const cicloActivo = await db.getCicloActivo();
        if (!cicloActivo) {
            return App.alert({ title: 'Ciclo inactivo', message: '⚠️ No hay un ciclo activo. Debes abrir un ciclo antes de registrar viajes o fletes.', type: 'warning' });
        }

        const fecha = document.getElementById('tr-fecha').value;
        const loteId = parseInt(document.getElementById('tr-lote').value);
        const transportista = document.getElementById('tr-nombre').value.trim();
        const latasMojado = parseFloat(document.getElementById('tr-latas-mojado').value) || 0;
        const precioLataMojado = parseFloat(document.getElementById('tr-precio-mojado').value) || 0;
        const latasCascota = parseFloat(document.getElementById('tr-latas-cascota').value) || 0;
        const precioLataCascota = parseFloat(document.getElementById('tr-precio-cascota').value) || 0;
        const notas = document.getElementById('tr-notas').value.trim();

        if (latasMojado === 0 && latasCascota === 0) {
            return App.toast('⚠️ Debes registrar al menos una cantidad de latas (mojado o cascota)', 'warning');
        }

        const total = (latasMojado * precioLataMojado) + (latasCascota * precioLataCascota);

        if (total <= 0) return App.toast('⚠️ El total a pagar debe ser mayor a 0', 'warning');
        if (!loteId || isNaN(loteId)) return App.toast('Debes seleccionar un lote', 'error');

        const btnSave = document.getElementById('btn-save-transporte');
        if (btnSave) { btnSave.disabled = true; btnSave.innerHTML = '⏳ Guardando...'; }

        await db.add('transportes', {
            fecha, loteId, transportista,
            latasMojado, precioLataMojado,
            latasCascota, precioLataCascota,
            total, notas,
            fincaId: db.getFincaActiva(),
            cicloId: cicloActivo.id,
            createdAt: new Date().toISOString()
        });

        App.toast('Transporte registrado', 'success');
        document.getElementById('tr-latas-mojado').value = '';
        document.getElementById('tr-latas-cascota').value = '';
        document.getElementById('tr-notas').value = '';
        Transporte.calcTotal();
        Transporte.loadHistory();
        if (btnSave) { btnSave.disabled = false; btnSave.innerHTML = 'Registrar Transporte'; }
    },

    async loadHistory() {
        let ts = await db.getByFinca('transportes');
        ts.sort((a, b) => b.fecha.localeCompare(a.fecha));
        const lotes = await db.getByFinca('lotes');
        const loteMap = Object.fromEntries(lotes.map(l => [l.id, l.nombre]));

        const tbody = document.getElementById('tr-body');
        if (tbody) {
            tbody.innerHTML = ts.length === 0
                ? '<tr><td colspan="7" class="text-center text-muted" style="padding:32px 16px"><i data-lucide="ghost" style="width:32px;height:32px;opacity:0.2;margin-bottom:8px"></i><br>Sin registros de transporte</td></tr>'
                : ts.map(t => `
                    <tr style="border-bottom:1px solid var(--border-color)">
                        <td style="padding:12px 16px; color:var(--text-muted); font-size:0.85rem">${t.fecha}</td>
                        <td style="padding:12px 16px; font-weight:600">${loteMap[t.loteId] || '—'}</td>
                        <td style="padding:12px 16px">${t.transportista}</td>
                        <td style="padding:12px 16px; text-align:right">
                            ${(t.latasMojado || 0) > 0 ? `<strong>${t.latasMojado}</strong> <span class="text-muted" style="font-size:0.75rem">($${(t.precioLataMojado || 0).toLocaleString()})</span>` : '—'}
                        </td>
                        <td style="padding:12px 16px; text-align:right">
                            ${(t.latasCascota || 0) > 0 ? `<strong>${t.latasCascota}</strong> <span class="text-muted" style="font-size:0.75rem">($${(t.precioLataCascota || 0).toLocaleString()})</span>` : '—'}
                        </td>
                        <td style="padding:12px 16px; text-align:right; color:var(--text-main); font-weight:700">$${(t.total || 0).toLocaleString()}</td>
                        <td style="padding:12px 16px; text-align:center">
                            <button class="btn-icon" style="color:var(--color-danger); padding:4px;" onclick="Transporte.remove(${t.id})" title="Eliminar"><i data-lucide="trash-2" style="width:16px;height:16px"></i></button>
                        </td>
                    </tr>
                `).join('');
            if (window.lucide) window.lucide.createIcons();
        }
    },

    async remove(id) {
        // Bloqueo ciclo cerrado
        const registro = await db.get('transportes', id);
        if (registro && registro.cicloId) {
            const ciclo = await db.get('ciclos', registro.cicloId);
            if (ciclo && !ciclo.activo) {
                return App.alert({ title: 'Ciclo cerrado', message: '⚠️ No puedes eliminar un registro de un ciclo cerrado/liquidado.', type: 'error' });
            }
        }

        App.confirmDelete({
            title: 'Eliminar Transporte',
            message: '¿Eliminar este registro de transporte?',
            onConfirm: async () => {
                await db.delete('transportes', id);
                App.toast('Registro eliminado', 'info');
                Transporte.loadHistory();
            }
        });
    }
};
