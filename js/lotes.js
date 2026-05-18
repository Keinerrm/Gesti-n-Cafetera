/* ============================================
   lotes.js — Gestión de Lotes
   Con producción por hectárea + multi-finca
   ============================================ */

const Lotes = {
    async render() {
        const fincaId = db.getFincaActiva();
        const lotes = await db.getByFinca('lotes');
        const app = document.getElementById('app');

        // Calculate production for each lot
        const lotesConProduccion = await Promise.all(lotes.map(async l => {
            const kilos = await db.getTotalKilosByLote(l.id);
            const cascota = await db.getTotalCascotaByLote(l.id);
            const areaNum = parseFloat(l.area) || 0;
            const kgHa = areaNum > 0 ? Math.round(kilos / areaNum) : null;
            return { ...l, totalKilos: kilos, totalCascota: cascota, areaNum, kgHa };
        }));

        // Totals
        const totalKilos = lotesConProduccion.reduce((s, l) => s + l.totalKilos, 0);
        const totalArea = lotesConProduccion.reduce((s, l) => s + l.areaNum, 0);
        const avgKgHa = totalArea > 0 ? Math.round(totalKilos / totalArea) : 0;

        app.innerHTML = `
            <div class="animate-in">
                <div class="header-premium" style="margin-bottom:24px">
                    <div class="header-icon" style="background:var(--bg-card-hover); color:var(--text-main)"><i data-lucide="map"></i></div>
                    <div style="flex:1; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px">
                        <div>
                            <h2>Lotes y Parcelas</h2>
                            <p class="text-muted" style="margin:0; font-size:0.85rem">Gestión de áreas productivas de la finca</p>
                        </div>
                        <button class="btn-premium primary" onclick="Lotes.showForm()" style="height:40px">
                            <i data-lucide="plus-circle" style="width:18px"></i> <span class="hide-mobile">Nuevo Lote</span>
                        </button>
                    </div>
                </div>

                <!-- Resumen -->
                <div class="grid-4" style="gap:12px; margin-bottom:24px">
                    <div class="card-premium" style="padding:16px; display:flex; flex-direction:column; justify-content:space-between">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px">
                            <div class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:700">Cant. Lotes</div>
                            <div style="background:var(--bg-app); color:var(--text-main); border-radius:8px; padding:6px; border:1px solid var(--border-color)"><i data-lucide="layers" style="width:16px; height:16px"></i></div>
                        </div>
                        <div class="tabular-data" style="font-size:1.6rem; font-weight:800; color:var(--text-main)">${lotesConProduccion.length}</div>
                    </div>

                    <div class="card-premium" style="padding:16px; display:flex; flex-direction:column; justify-content:space-between">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px">
                            <div class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:700">Área Total</div>
                            <div style="background:rgba(245, 158, 11, 0.1); color:#f59e0b; border-radius:8px; padding:6px"><i data-lucide="maximize" style="width:16px; height:16px"></i></div>
                        </div>
                        <div class="tabular-data" style="font-size:1.6rem; font-weight:800; color:var(--color-primary)">${totalArea.toLocaleString()} <span style="font-size:0.9rem; color:var(--text-muted); font-weight:600">ha</span></div>
                    </div>

                    <div class="card-premium" style="padding:16px; display:flex; flex-direction:column; justify-content:space-between">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px">
                            <div class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:700">Prod. Total</div>
                            <div style="background:rgba(34, 197, 94, 0.1); color:var(--color-primary); border-radius:8px; padding:6px"><i data-lucide="sprout" style="width:16px; height:16px"></i></div>
                        </div>
                        <div class="tabular-data" style="font-size:1.6rem; font-weight:800; color:var(--text-main)">${totalKilos.toLocaleString()} <span style="font-size:0.9rem; color:var(--text-muted); font-weight:600">kg</span></div>
                    </div>

                    <div class="card-premium" style="padding:16px; display:flex; flex-direction:column; justify-content:space-between">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px">
                            <div class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:700">Promedio</div>
                            <div style="background:var(--bg-app); color:var(--text-main); border-radius:8px; padding:6px; border:1px solid var(--border-color)"><i data-lucide="bar-chart-2" style="width:16px; height:16px"></i></div>
                        </div>
                        <div class="tabular-data" style="font-size:1.6rem; font-weight:800; color:var(--text-main)">${avgKgHa.toLocaleString()} <span style="font-size:0.9rem; color:var(--text-muted); font-weight:600">kg/ha</span></div>
                    </div>
                </div>

                <div id="lotes-grid" class="grid-2" style="gap:16px">
                    ${lotesConProduccion.length === 0 ? `
                        <div class="card-premium" style="grid-column:1/-1; padding:40px 20px; text-align:center; border:1px dashed var(--border-color); display:flex; flex-direction:column; align-items:center; justify-content:center">
                            <div style="background:var(--bg-surface-hover); width:64px; height:64px; border-radius:16px; display:flex; align-items:center; justify-content:center; margin-bottom:16px">
                                <i data-lucide="map" style="width:32px; height:32px; color:var(--text-muted)"></i>
                            </div>
                            <h3 style="margin:0 0 8px 0">No hay lotes registrados</h3>
                            <p class="text-muted" style="max-width:300px; margin:0 auto 24px; font-size:0.9rem">Agrega el primer lote de café para comenzar a registrar rendimientos.</p>
                            <button class="btn-premium primary" onclick="Lotes.showForm()"><i data-lucide="plus"></i> Crear Lote</button>
                        </div>
                    ` : lotesConProduccion.map(l => `
                        <div class="card-premium lote-card" style="cursor:pointer; padding:20px; transition:transform 0.2s, box-shadow 0.2s; border-left:4px solid var(--color-primary)" onclick="Lotes.showDetail(${l.id})">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px">
                                <div>
                                    <h3 style="margin:0 0 4px 0; font-size:1.1rem; color:var(--text-main); display:flex; align-items:center; gap:8px">${l.nombre} ${l.variedad ? `<span class="badge" style="font-size:0.65rem; background:var(--bg-surface-hover); color:var(--text-muted); padding:4px 8px">${l.variedad}</span>` : ''}</h3>
                                </div>
                                <button class="btn-icon-only text-danger" onclick="event.stopPropagation(); Lotes.confirmDelete(${l.id})" style="border:none; background:transparent; width:32px; height:32px; margin-top:-4px; margin-right:-4px" title="Eliminar lote">
                                    <i data-lucide="trash-2" style="width:16px; opacity:0.7"></i>
                                </button>
                            </div>
                            
                            <div class="grid-3" style="gap:12px; margin-bottom:16px; background:var(--bg-app); padding:12px; border-radius:10px; border:1px solid var(--border-color)">
                                <div>
                                    <div class="text-muted" style="font-size:0.65rem; text-transform:uppercase; font-weight:700; margin-bottom:2px">Producción</div>
                                    <div class="tabular-data" style="font-weight:800; color:var(--color-success); font-size:1rem">${l.totalKilos.toLocaleString()} <span style="font-size:0.75rem; font-weight:600">kg</span></div>
                                </div>
                                <div>
                                    <div class="text-muted" style="font-size:0.65rem; text-transform:uppercase; font-weight:700; margin-bottom:2px">Área</div>
                                    <div class="tabular-data" style="font-weight:800; color:var(--text-main); font-size:1rem">${l.areaNum > 0 ? l.areaNum + ' <span style="font-size:0.75rem; font-weight:600; color:var(--text-muted)">ha</span>' : '—'}</div>
                                </div>
                                <div>
                                    <div class="text-muted" style="font-size:0.65rem; text-transform:uppercase; font-weight:700; margin-bottom:2px">Rend. Kg/ha</div>
                                    <div class="tabular-data" style="font-weight:800; color:var(--color-primary); font-size:1rem">${l.kgHa !== null ? l.kgHa.toLocaleString() : '—'}</div>
                                </div>
                            </div>
                            
                            <div class="grid-2" style="gap:12px">
                                <div style="display:flex; align-items:center; gap:8px">
                                    <div style="background:rgba(245, 158, 11, 0.1); width:28px; height:28px; border-radius:6px; display:flex; align-items:center; justify-content:center"><i data-lucide="leaf" style="width:14px; color:#f59e0b"></i></div>
                                    <div>
                                        <div class="text-muted" style="font-size:0.65rem; text-transform:uppercase; font-weight:700">Cascota</div>
                                        <div class="tabular-data" style="font-weight:700; color:var(--text-main); font-size:0.9rem">${l.totalCascota.toLocaleString()} kg</div>
                                    </div>
                                </div>
                                <div style="display:flex; align-items:center; gap:8px">
                                    <div style="background:var(--bg-surface-hover); width:28px; height:28px; border-radius:6px; display:flex; align-items:center; justify-content:center"><i data-lucide="refresh-cw" style="width:14px; color:var(--text-muted)"></i></div>
                                    <div>
                                        <div class="text-muted" style="font-size:0.65rem; text-transform:uppercase; font-weight:700">Factor</div>
                                        <div class="tabular-data" style="font-weight:700; color:var(--text-main); font-size:0.9rem">${l.factorRendimiento || 'N/A'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    },

    showForm(lote = null) {
        const isEdit = lote !== null;
        const html = `
            <div class="modal-system-overlay" onclick="Lotes.closeModal(event)" style="display:flex;align-items:center;justify-content:center;padding:16px;">
                <div class="card-premium animate-in" onclick="event.stopPropagation()" style="width:100%; max-width:500px; padding:24px;">
                    <div class="header-premium" style="margin-bottom:24px;">
                        <div class="header-icon" style="background:var(--bg-surface-hover); color:var(--text-main)"><i data-lucide="${isEdit ? 'edit-2' : 'plus'}"></i></div>
                        <div style="flex:1">
                            <h3 style="margin:0; font-size:1.1rem">${isEdit ? 'Modificar' : 'Nuevo'} Lote</h3>
                            <p class="text-muted" style="font-size:0.85rem; margin:0">Datos del predio cafetero</p>
                        </div>
                        <button class="btn-icon-only text-muted" onclick="Lotes.closeModal()" style="border:none; background:transparent"><i data-lucide="x"></i></button>
                    </div>
                    
                    <form onsubmit="Lotes.save(event, ${isEdit ? lote.id : 'null'})">
                        <div class="input-group" style="margin-bottom:16px">
                            <label class="text-muted" style="font-size:0.75rem; font-weight:600; margin-bottom:4px; display:block">Nombre del lote <span style="color:var(--color-danger)">*</span></label>
                            <input type="text" class="input-premium" id="lt-nombre" value="${isEdit ? lote.nombre : ''}" required placeholder="Ej: Lote 1 - El Mirador">
                        </div>
                        
                        <div class="grid-2" style="gap:16px; margin-bottom:16px">
                            <div class="input-group" style="margin:0">
                                <label class="text-muted" style="font-size:0.75rem; font-weight:600; margin-bottom:4px; display:block">Área (hectáreas)</label>
                                <input type="number" class="input-premium tabular-data" id="lt-area" step="0.01" min="0" value="${isEdit ? (parseFloat(lote.area) || '') : ''}" placeholder="0.00">
                            </div>
                            <div class="input-group" style="margin:0">
                                <label class="text-muted" style="font-size:0.75rem; font-weight:600; margin-bottom:4px; display:block">Variedad sembrada</label>
                                <input type="text" class="input-premium" id="lt-variedad" value="${isEdit ? (lote.variedad || '') : ''}" placeholder="Ej: Caturra, Castillo">
                            </div>
                        </div>
                        
                        <div class="input-group" style="margin-bottom:16px">
                            <label class="text-muted" style="font-size:0.75rem; font-weight:600; margin-bottom:4px; display:block">Factor Rendimiento (rojo → mojado) <span class="text-muted" style="font-weight:normal">(Opcional)</span></label>
                            <input type="number" class="input-premium tabular-data" id="lt-factor" step="0.01" min="0.01" max="1" value="${isEdit ? (lote.factorRendimiento || '') : ''}" placeholder="Ej: 0.18">
                        </div>
                        
                        <div class="input-group" style="margin-bottom:24px">
                            <label class="text-muted" style="font-size:0.75rem; font-weight:600; margin-bottom:4px; display:block">Descripción o notas adicionales</label>
                            <textarea id="lt-desc" class="input-premium" rows="2" placeholder="Información opcional...">${isEdit ? (lote.descripcion || '') : ''}</textarea>
                        </div>
                        
                        <div style="display:flex; gap:12px">
                            <button type="button" class="btn-premium secondary flex-1" onclick="Lotes.closeModal()">Cancelar</button>
                            <button type="submit" class="btn-premium primary flex-1"><i data-lucide="save"></i> ${isEdit ? 'Actualizar' : 'Guardar Lote'}</button>
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
        const fincaId = db.getFincaActiva();
        const data = {
            nombre: document.getElementById('lt-nombre').value.trim(),
            area: parseFloat(document.getElementById('lt-area').value) || 0,
            variedad: document.getElementById('lt-variedad').value.trim(),
            factorRendimiento: parseFloat(document.getElementById('lt-factor').value) || null,
            descripcion: document.getElementById('lt-desc').value.trim(),
            fincaId
        };
        if (!data.nombre) return App.toast('Nombre es obligatorio', 'error');

        if (id) {
            data.id = id;
            await db.put('lotes', data);
            App.toast('Lote actualizado', 'success');
        } else {
            await db.add('lotes', data);
            App.toast('Lote registrado', 'success');
        }
        Lotes.closeModal();
        Lotes.render();
    },

    async showDetail(id) {
        const lote = await db.get('lotes', id);
        if (!lote) return;
        Lotes.showForm(lote);
    },

    async confirmDelete(id) {
        App.confirmDelete({
            title: 'Eliminar Lote',
            message: '¿Estás seguro de que deseas eliminar este lote? Los registros de producción histórica asociados de semanas pasadas se mantendrán.',
            icon: 'map',
            confirmText: 'Sí, Eliminar Lote',
            onConfirm: async () => {
                await db.delete('lotes', id);
                App.toast('Lote retirado del catálogo', 'info');
                Lotes.render();
            }
        });
    },

    closeModal(e) {
        if (e && e.target !== e.currentTarget) return;
        const modal = document.querySelector('.modal-system-overlay');
        if (modal) modal.remove();
    }
};
