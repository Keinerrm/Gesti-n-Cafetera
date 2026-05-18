/* ============================================
   comida.js — Consumo de Comida
   Refactorizado: Premium Design System & Mass Entry Táctil
   ============================================ */

const Comida = {
    activeTab: 'rapido',
    DRAFT_KEY: 'comidaDraft',
    _state: {}, // Para manejar visualmente la matriz táctil

    async render() {
        const obreros = (await db.getByFinca('obreros')).filter(o => o.estado === 'activo');
        const today = new Date().toLocaleDateString('en-CA');

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="animate-in">
                <div class="header-premium" style="margin-bottom:24px">
                    <div class="header-icon" style="background:rgba(239, 68, 68, 0.1); color:var(--color-danger)"><i data-lucide="utensils-crossed"></i></div>
                    <div>
                        <h2>Alimentación</h2>
                        <p>Registro de consumos en comedor</p>
                    </div>
                </div>

                <div class="tabs" style="margin-bottom:24px; display:flex; gap:8px">
                    <button class="btn-premium ${this.activeTab === 'rapido' ? 'primary' : 'secondary'} flex-1" onclick="Comida.switchTab('rapido')">
                        <i data-lucide="zap"></i> Planilla Rápida
                    </button>
                    <button class="btn-premium ${this.activeTab === 'individual' ? 'primary' : 'secondary'} flex-1" onclick="Comida.switchTab('individual')">
                        <i class="icon" data-lucide="user"></i> Individual
                    </button>
                </div>

                <div id="cm-tab-content" style="margin-bottom:32px"></div>

                <div class="header-premium" style="margin-bottom:16px">
                    <div class="header-icon" style="background:var(--bg-surface-hover); color:var(--text-main)"><i data-lucide="history"></i></div>
                    <div>
                        <h3 style="margin:0;font-size:1.1rem">Historial de Consumos</h3>
                    </div>
                </div>

                <div class="filter-bar card-premium" style="padding:12px; margin-bottom:16px; display:flex; gap:12px; background:var(--bg-surface)">
                    <div class="input-group" style="flex:1; margin:0">
                        <label class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:700; margin-bottom:4px; display:block">Fecha</label>
                        <input type="date" class="input-premium" id="cm-filter-fecha" value="${today}" onchange="Comida.loadHistory()" style="min-height:40px">
                    </div>
                    <div class="input-group" style="flex:1; margin:0">
                        <label class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:700; margin-bottom:4px; display:block">Trabajador</label>
                        <select class="input-premium" id="cm-filter-obrero" onchange="Comida.loadHistory()" style="min-height:40px">
                            <option value="">Todos los trabajadores...</option>
                            ${obreros.map(o => `<option value="${o.id}">${o.nombre}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div id="comida-resumen-hist" class="kpi-row" style="margin-bottom:16px"></div>

                <div class="table-wrapper card-premium" style="padding:0; overflow:hidden">
                    <table style="width:100%; border-collapse:collapse">
                        <thead style="background:var(--bg-surface-hover); color:var(--text-muted); text-transform:uppercase; font-size:0.75rem; font-weight:700">
                            <tr>
                                <th style="padding:16px; text-align:left; border-bottom:1px solid var(--border-color)">Fecha</th>
                                <th style="padding:16px; text-align:left; border-bottom:1px solid var(--border-color)">Obrero</th>
                                <th style="padding:16px; text-align:left; border-bottom:1px solid var(--border-color)">Tipo</th>
                                <th style="padding:16px; text-align:right; border-bottom:1px solid var(--border-color)">Valor ($)</th>
                                <th style="padding:16px; text-align:center; border-bottom:1px solid var(--border-color)"></th>
                            </tr>
                        </thead>
                        <tbody id="comida-body" class="tabular-data"></tbody>
                    </table>
                </div>
            </div>
            <style>
                .btn-meal { width: 44px; height: 44px; border-radius: 12px; border: 1px solid var(--border-color); background: var(--bg-surface-hover); color: var(--text-muted); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
                .btn-meal:active { transform: scale(0.95); }
                .btn-meal svg { width: 20px; height: 20px; }
                
                .btn-meal.active-d { background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.3); color: var(--color-danger); box-shadow: 0 0 10px rgba(239, 68, 68, 0.1); }
                .btn-meal.active-a { background: rgba(245, 158, 11, 0.15); border-color: rgba(245, 158, 11, 0.3); color: #f59e0b; box-shadow: 0 0 10px rgba(245, 158, 11, 0.1); }
                .btn-meal.active-c { background: rgba(59, 130, 246, 0.15); border-color: rgba(59, 130, 246, 0.3); color: #3b82f6; box-shadow: 0 0 10px rgba(59, 130, 246, 0.1); }
                
                .meal-row.has-selection { background: var(--bg-surface-hover); border-left: 3px solid var(--color-danger); }
            </style>
        `;

        Comida.renderTab();
        Comida.loadHistory();
        if (window.lucide) window.lucide.createIcons();
    },

    switchTab(tab) {
        Comida.activeTab = tab;
        this.render();
    },

    async renderTab() {
        const container = document.getElementById('cm-tab-content');
        if (!container) return;

        container.innerHTML = `<div style="padding:40px; text-align:center"><i data-lucide="loader-2" class="spin" style="width:32px;height:32px;color:var(--color-primary)"></i></div>`;
        if (window.lucide) window.lucide.createIcons();

        if (Comida.activeTab === 'rapido') {
            await Comida.renderRegistroRapido(container);
        } else {
            await Comida.renderIndividual(container);
        }
    },

    /* ========================================
       TAB: Matriz Táctil (Registro Rápido)
       ======================================== */
    async renderRegistroRapido(container) {
        const obreros = (await db.getByFinca('obreros')).filter(o => o.estado === 'activo');
        const today = new Date().toLocaleDateString('en-CA');
        let precioDesayuno = 3000, precioAlmuerzo = 5000, precioCena = 3000;
        try {
            precioDesayuno = await db.getConfig('precioDesayuno', 3000);
            precioAlmuerzo = await db.getConfig('precioAlmuerzo', 5000);
            precioCena = await db.getConfig('precioCena', 3000);
        } catch (e) { }

        // Inicializar estado limpo si no hay draft restaurándose
        if (Object.keys(Comida._state).length === 0) {
            obreros.forEach(o => {
                Comida._state[o.id] = { d: false, a: false, c: false };
            });
        }

        container.innerHTML = `
            <div class="card-premium mb-2 animate-in tabular-data">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:16px">
                    <div class="input-group" style="margin:0; min-width:200px">
                        <label class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:700; margin-bottom:4px; display:block">Día Operativo</label>
                        <input type="date" class="input-premium" id="cr-fecha" value="${today}" max="${today}" style="min-height:44px; font-weight:600" onchange="Comida.actualizarContadores()">
                    </div>
                    
                    <!-- Quick Actions -->
                     <div style="display:flex; gap:8px; flex-wrap:wrap">
                        <button class="btn-premium secondary" onclick="Comida.marcarTodos('d')" title="Desayuno para todos" style="padding:0 12px">
                            <i data-lucide="coffee" style="color:var(--color-danger)"></i> <span class="hide-mobile">Todos</span>
                        </button>
                        <button class="btn-premium secondary" onclick="Comida.marcarTodos('a')" title="Almuerzo para todos" style="padding:0 12px">
                            <i data-lucide="soup" style="color:#f59e0b"></i> <span class="hide-mobile">Todos</span>
                        </button>
                        <button class="btn-premium secondary" onclick="Comida.marcarTodos('c')" title="Cena para todos" style="padding:0 12px">
                            <i data-lucide="moon" style="color:#3b82f6"></i> <span class="hide-mobile">Todos</span>
                        </button>
                        <button class="btn-premium secondary" onclick="Comida.marcarTodos('ALL')" title="Completa para todos" style="padding:0 12px; border-color:var(--color-primary)">
                            <i data-lucide="check-square" style="color:var(--color-primary)"></i> <span class="hide-mobile">Día Completo</span>
                        </button>
                    </div>
                </div>

                <!-- Live KPIs -->
                <div class="grid-4" style="gap:12px; margin-bottom:24px">
                    <div class="card-premium" style="background:var(--bg-app)!important; padding:16px; text-align:center; border:1px solid rgba(239, 68, 68, 0.2)">
                        <i data-lucide="coffee" style="color:var(--color-danger); margin-bottom:8px"></i>
                        <div style="font-size:1.5rem; font-weight:800; color:var(--text-main)" id="cr-count-d">0</div>
                        <div class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:600">Desayunos</div>
                    </div>
                    <div class="card-premium" style="background:var(--bg-app)!important; padding:16px; text-align:center; border:1px solid rgba(245, 158, 11, 0.2)">
                        <i data-lucide="soup" style="color:#f59e0b; margin-bottom:8px"></i>
                        <div style="font-size:1.5rem; font-weight:800; color:var(--text-main)" id="cr-count-a">0</div>
                        <div class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:600">Almuerzos</div>
                    </div>
                    <div class="card-premium" style="background:var(--bg-app)!important; padding:16px; text-align:center; border:1px solid rgba(59, 130, 246, 0.2)">
                        <i data-lucide="moon" style="color:#3b82f6; margin-bottom:8px"></i>
                        <div style="font-size:1.5rem; font-weight:800; color:var(--text-main)" id="cr-count-c">0</div>
                        <div class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:600">Cenas</div>
                    </div>
                    <div class="card-premium" style="background:var(--bg-surface-hover)!important; padding:16px; text-align:center; border:1px solid var(--color-danger)">
                        <i data-lucide="receipt" style="color:var(--color-danger); margin-bottom:8px"></i>
                        <div style="font-size:1.4rem; font-weight:800; color:var(--color-danger)" id="cr-total-valor">$0</div>
                        <div class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:600">Costo Descontable</div>
                    </div>
                </div>

                <!-- Matriz Táctil -->
                <p class="text-muted" style="font-size:0.85rem; margin-bottom:12px; display:flex; align-items:center; gap:8px">
                    <i data-lucide="info" style="width:16px;height:16px"></i> Toca el nombre del trabajador para seleccionar las 3 comidas simultáneamente.
                </p>

                <div class="card-premium" style="padding:0; overflow:hidden; border:1px solid var(--border-color); margin-bottom:24px">
                    <div style="display:flex; padding:12px 16px; background:var(--bg-surface-hover); border-bottom:1px solid var(--border-color); font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--text-muted)">
                        <div style="flex:1">Trabajador</div>
                        <div style="display:flex; gap:12px; align-items:center; width:160px; justify-content:center">
                            <span style="width:44px; text-align:center">Des.</span>
                            <span style="width:44px; text-align:center">Alm.</span>
                            <span style="width:44px; text-align:center">Cen.</span>
                        </div>
                    </div>
                    
                    <div id="matriz-comidas" style="max-height: 55vh; overflow-y: auto;">
                        ${obreros.map(o => `
                            <div class="meal-row worker-row-premium" id="row-${o.id}" style="padding:10px 16px; border-bottom:1px solid var(--border-color); display:flex; align-items:center; border-left:3px solid transparent">
                                <div style="flex:1; display:flex; align-items:center; gap:12px; cursor:pointer" onclick="Comida.toggleWorkerAll(${o.id})">
                                    <div class="avatar" style="width:36px; height:36px; border-radius:10px; background:rgba(34, 197, 94, 0.1); color:var(--color-primary); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.9rem">
                                        ${o.nombre.charAt(0)}
                                    </div>
                                    <span style="font-weight:600; font-size:0.95rem; color:var(--text-main)">${o.nombre}</span>
                                </div>
                                <div style="display:flex; gap:12px; align-items:center; width:160px; justify-content:center">
                                    <button class="btn-meal" id="btn-d-${o.id}" onclick="Comida.toggleMeal(${o.id}, 'd')" title="Desayuno"><i data-lucide="coffee"></i></button>
                                    <button class="btn-meal" id="btn-a-${o.id}" onclick="Comida.toggleMeal(${o.id}, 'a')" title="Almuerzo"><i data-lucide="soup"></i></button>
                                    <button class="btn-meal" id="btn-c-${o.id}" onclick="Comida.toggleMeal(${o.id}, 'c')" title="Cena"><i data-lucide="moon"></i></button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div id="cr-draft-notice" style="display:none; color:var(--color-primary); font-size:0.85rem; text-align:center; margin-bottom:16px; font-weight:600; animation: fade-in 0.3s forwards">
                    <i data-lucide="check-circle" style="width:14px; height:14px; display:inline-block; vertical-align:middle; margin-right:4px"></i> Estado temporal guardado
                </div>

                <div style="display:flex; gap:12px">
                    <button class="btn-premium secondary" onclick="Comida.limpiarRapido()" style="width:120px">
                        <i data-lucide="trash-2"></i> Limpiar
                    </button>
                    <button class="btn-premium flex-1" id="btn-save-comida-r" onclick="Comida.guardarComidas()" style="background:var(--color-danger); color:#fff; border:none; border-radius:12px; height:56px; font-size:1.1rem; box-shadow:0 4px 15px rgba(239, 68, 68, 0.3)">
                        <i data-lucide="save"></i> Registrar Comidas
                    </button>
                </div>
            </div>
        `;

        // Restaurar estado si existía
        Comida.restaurarDraft();
        if (window.lucide) window.lucide.createIcons();
    },

    /* --- Matriz Lógica --- */

    toggleMeal(obreroId, type) {
        if (!Comida._state[obreroId]) Comida._state[obreroId] = { d: false, a: false, c: false };
        Comida._state[obreroId][type] = !Comida._state[obreroId][type];
        Comida.renderRowState(obreroId);
        Comida.actualizarContadores();
        Comida.guardarDraft();
    },

    toggleWorkerAll(obreroId) {
        if (!Comida._state[obreroId]) Comida._state[obreroId] = { d: false, a: false, c: false };
        const s = Comida._state[obreroId];
        // Si todos están activos, apagar todos. Sino, prender todos.
        const allOn = s.d && s.a && s.c;
        const target = !allOn;
        s.d = target; s.a = target; s.c = target;
        Comida.renderRowState(obreroId);
        Comida.actualizarContadores();
        Comida.guardarDraft();
    },

    marcarTodos(type) {
        Object.keys(Comida._state).forEach(id => {
            if (type === 'ALL') {
                Comida._state[id].d = true;
                Comida._state[id].a = true;
                Comida._state[id].c = true;
            } else {
                Comida._state[id][type] = true;
            }
            Comida.renderRowState(id);
        });
        Comida.actualizarContadores();
        Comida.guardarDraft();
    },

    renderRowState(obreroId) {
        const s = Comida._state[obreroId];
        if (!s) return;

        const btnD = document.getElementById(`btn-d-${obreroId}`);
        const btnA = document.getElementById(`btn-a-${obreroId}`);
        const btnC = document.getElementById(`btn-c-${obreroId}`);
        const row = document.getElementById(`row-${obreroId}`);

        if (!btnD) return; // UI no renderizada

        if (s.d) btnD.classList.add('active-d'); else btnD.classList.remove('active-d');
        if (s.a) btnA.classList.add('active-a'); else btnA.classList.remove('active-a');
        if (s.c) btnC.classList.add('active-c'); else btnC.classList.remove('active-c');

        if (s.d || s.a || s.c) {
            row.classList.add('has-selection');
        } else {
            row.classList.remove('has-selection');
        }
    },

    async actualizarContadores() {
        let countD = 0, countA = 0, countC = 0;

        Object.values(Comida._state).forEach(s => {
            if (s.d) countD++;
            if (s.a) countA++;
            if (s.c) countC++;
        });

        const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
        el('cr-count-d', countD);
        el('cr-count-a', countA);
        el('cr-count-c', countC);

        // Update total value UI and Button text dynamically
        const precioD = await db.getConfig('precioDesayuno', 3000);
        const precioA = await db.getConfig('precioAlmuerzo', 5000);
        const precioC = await db.getConfig('precioCena', 3000);
        const total = (countD * precioD) + (countA * precioA) + (countC * precioC);

        el('cr-total-valor', '$' + total.toLocaleString());

        const saveBtn = document.getElementById('btn-save-comida-r');
        if (saveBtn) {
            const sumQty = countD + countA + countC;
            if (sumQty > 0) {
                saveBtn.innerHTML = `<i data-lucide="save"></i> Registrar ${sumQty} Consumos ($${total.toLocaleString()})`;
            } else {
                saveBtn.innerHTML = `<i data-lucide="save"></i> Registrar Comidas`;
            }
            if (window.lucide) window.lucide.createIcons();
        }
    },

    /* --- Save / Clear --- */

    async guardarComidas() {
        const cicloActivo = await db.getCicloActivo();
        if (!cicloActivo) {
            return App.alert({ title: 'Ciclo inactivo', message: 'No hay un ciclo activo en Configuración. Debes activar uno para afectar la contabilidad de la semana.', type: 'warning' });
        }

        const fecha = document.getElementById('cr-fecha').value;
        if (!fecha) return App.toast('Selecciona una fecha', 'error');

        const lockedCycle = await Ciclos.isDateLocked(fecha);
        if (lockedCycle) {
            return App.alert({
                title: 'Bloqueo Histórico',
                message: `La nómina de la semana del ${Ciclos.formatFecha(lockedCycle.fechaInicio)} ya fue liquidada y pagada. No se permiten modificaciones post-cierre para no descuadrar la contabilidad.`,
                type: 'error'
            });
        }

        const btnSave = document.getElementById('btn-save-comida-r');
        if (btnSave) { btnSave.disabled = true; btnSave.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Guardando...'; if (window.lucide) window.lucide.createIcons(); }

        const precioD = await db.getConfig('precioDesayuno', 3000);
        const precioA = await db.getConfig('precioAlmuerzo', 5000);
        const precioC = await db.getConfig('precioCena', 3000);

        let total = 0;
        let omitidos = 0;
        const cicloId = cicloActivo.id;
        const batchAsistencia = [];

        for (const [obreroIdStr, s] of Object.entries(Comida._state)) {
            const obreroId = parseInt(obreroIdStr);
            if (s.d || s.a || s.c) {
                const duplicado = await db.existeComidaHoy(obreroId, fecha);
                if (duplicado) {
                    omitidos++;
                    continue; // Skip if already eaten today (prevent double billing)
                }

                if (s.d) { await db.add('comida', { obreroId, fecha, tipo: 'desayuno', valor: precioD, cicloId }); total++; }
                if (s.a) { await db.add('comida', { obreroId, fecha, tipo: 'almuerzo', valor: precioA, cicloId }); total++; }
                if (s.c) { await db.add('comida', { obreroId, fecha, tipo: 'cena', valor: precioC, cicloId }); total++; }

                batchAsistencia.push({ obreroId, fecha, kilosTotal: 1 }); // Send minimal payload to mark assist
            }
        }

        if (typeof Asistencia !== 'undefined' && batchAsistencia.length > 0) {
            await Asistencia.syncAutoAsistenciaBatch(batchAsistencia);
        }

        if (total === 0 && omitidos === 0) {
            if (btnSave) { btnSave.disabled = false; Comida.actualizarContadores(); }
            return App.toast('No hay comidas marcadas en la matriz táctil.', 'error');
        }

        if (total > 0) {
            try { localStorage.removeItem(Comida.DRAFT_KEY); } catch (e) { }
            Comida.limpiarRapido();
            Comida.loadHistory();
        }

        if (omitidos > 0 && total === 0) {
            App.alert({ title: 'Posible Duplicado', message: 'Todos los trabajadores seleccionados ya tienen un registro de comida (Des/Alm/Cen) para la fecha seleccionada.', type: 'warning' });
        } else if (omitidos > 0) {
            App.toast(`Registrado con éxito. Se omitieron algunos porque ya comieron hoy.`, 'success');
        } else {
            App.toast(`${total} consumos grabados en la contabilidad.`, 'success');
        }

        if (btnSave) { btnSave.disabled = false; Comida.actualizarContadores(); }
    },

    limpiarRapido() {
        Object.keys(Comida._state).forEach(id => {
            Comida._state[id] = { d: false, a: false, c: false };
            Comida.renderRowState(id);
        });
        Comida.actualizarContadores();
        try { localStorage.removeItem(Comida.DRAFT_KEY); } catch (e) { }
        const notice = document.getElementById('cr-draft-notice');
        if (notice) notice.style.display = 'none';

        const fechaEl = document.getElementById('cr-fecha');
        if (fechaEl) fechaEl.value = new Date().toLocaleDateString('en-CA');
    },

    /* --- Draft autosave (localStorage) --- */

    guardarDraft() {
        const fecha = document.getElementById('cr-fecha')?.value || '';
        const draft = { fecha, state: Comida._state };

        try { localStorage.setItem(Comida.DRAFT_KEY, JSON.stringify(draft)); } catch (e) { }

        // Muestra el toast chiquito de draft
        const notice = document.getElementById('cr-draft-notice');
        if (notice) {
            notice.style.display = 'block';
            clearTimeout(Comida._draftTimeout);
            Comida._draftTimeout = setTimeout(() => { notice.style.display = 'none'; }, 2000);
        }
    },

    restaurarDraft() {
        let raw = null;
        try { raw = localStorage.getItem(Comida.DRAFT_KEY); } catch (e) { }
        if (!raw) return;

        try {
            const draft = JSON.parse(raw);
            const hasData = Object.values(draft.state || {}).some(s => s.d || s.a || s.c);
            if (!hasData) return;

            App.confirm({
                title: 'Borrador Encontrado',
                message: 'Detectamos una planilla de comedores que no fue guardada. ¿Deseas recuperarla al punto donde estabas?',
                confirmText: 'Recuperar',
                cancelText: 'Descartar',
                onConfirm: () => {
                    if (draft.fecha) {
                        const fe = document.getElementById('cr-fecha');
                        if (fe) fe.value = draft.fecha;
                    }
                    Comida._state = draft.state || {};
                    Object.keys(Comida._state).forEach(id => Comida.renderRowState(id));
                    Comida.actualizarContadores();
                    App.toast('Planilla restaurada', 'info');
                },
                onCancel: () => {
                    try { localStorage.removeItem(Comida.DRAFT_KEY); } catch (e) { }
                }
            });
        } catch (e) {
            try { localStorage.removeItem(Comida.DRAFT_KEY); } catch (err) { }
        }
    },

    /* ========================================
       TAB: Registro Individual
       ======================================== */
    async renderIndividual(container) {
        const obreros = (await db.getByFinca('obreros')).filter(o => o.estado === 'activo');
        const today = new Date().toLocaleDateString('en-CA');
        const precioDesayuno = await db.getConfig('precioDesayuno', 3000);
        const precioAlmuerzo = await db.getConfig('precioAlmuerzo', 5000);
        const precioCena = await db.getConfig('precioCena', 3000);
        const precioCompleta = precioDesayuno + precioAlmuerzo + precioCena;

        container.innerHTML = `
            <div class="card-premium mb-2 animate-in">
                <div class="header-premium" style="margin-bottom:24px;">
                    <div class="header-icon"><i data-lucide="user-plus"></i></div>
                    <div>
                        <h3 style="margin:0; font-size:1.1rem">Particular a Trabajador</h3>
                        <p class="text-muted" style="font-size:0.85rem; margin:0">Registra valores customizados de alimentación</p>
                    </div>
                </div>
                
                <form onsubmit="Comida.save(event)">
                    <div class="grid-2" style="margin-bottom:24px">
                        <div class="input-group" style="margin:0">
                            <label class="text-muted" style="font-size:0.75rem;text-transform:uppercase;font-weight:700;margin-bottom:8px;display:block">Fecha</label>
                            <input type="date" class="input-premium" id="cm-fecha" value="${today}" max="${today}" required>
                        </div>
                        <div class="input-group" style="margin:0">
                            <label class="text-muted" style="font-size:0.75rem;text-transform:uppercase;font-weight:700;margin-bottom:8px;display:block">Trabajador</label>
                            <select class="input-premium" id="cm-obrero" required>
                                <option value="">Selecciona trabajador...</option>
                                ${obreros.map(o => `<option value="${o.id}">${o.nombre}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <p class="text-muted" style="font-size:0.85rem; text-transform:uppercase; font-weight:700; margin-bottom:12px">Turno / Servicio</p>
                    <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:24px">
                        <button type="button" class="btn-premium secondary active-tab-sim" data-tipo="desayuno" data-valor="${precioDesayuno}" onclick="Comida.selectTipo(this)" style="flex:1; min-width:140px">
                            <i data-lucide="coffee"></i> Desayuno <br><small class="text-muted" style="font-weight:400">$${precioDesayuno.toLocaleString()}</small>
                        </button>
                        <button type="button" class="btn-premium secondary" data-tipo="almuerzo" data-valor="${precioAlmuerzo}" onclick="Comida.selectTipo(this)" style="flex:1; min-width:140px">
                            <i data-lucide="soup"></i> Almuerzo <br><small class="text-muted" style="font-weight:400">$${precioAlmuerzo.toLocaleString()}</small>
                        </button>
                        <button type="button" class="btn-premium secondary" data-tipo="cena" data-valor="${precioCena}" onclick="Comida.selectTipo(this)" style="flex:1; min-width:140px">
                            <i data-lucide="moon"></i> Cena <br><small class="text-muted" style="font-weight:400">$${precioCena.toLocaleString()}</small>
                        </button>
                        <button type="button" class="btn-premium secondary" data-tipo="completa" data-valor="${precioCompleta}" onclick="Comida.selectTipo(this)" style="flex:2; min-width:140px; border:1px solid var(--color-primary)">
                            <i data-lucide="utensils" style="color:var(--color-primary)"></i> Día Completo <br><small class="text-muted" style="font-weight:400">$${precioCompleta.toLocaleString()}</small>
                        </button>
                    </div>

                    <input type="hidden" id="cm-tipo" value="desayuno">
                    <input type="hidden" id="cm-valor" value="${precioDesayuno}">

                    <div class="input-group" style="padding:16px; background:var(--bg-surface-hover); border-radius:12px; margin-bottom:24px">
                        <label class="text-muted" style="font-size:0.8rem; font-weight:600; margin-bottom:8px; display:block">Modificador de Precio Manual (Opcional)</label>
                        <input type="number" class="input-premium" id="cm-valor-custom" placeholder="Dejar vacío para tarifa base" min="0" step="0.01" style="background:var(--bg-app)">
                    </div>

                    <button type="submit" class="btn-premium primary" style="width:100%" id="btn-save-comida-ind">
                        <i data-lucide="plus-circle"></i> Anexar Consumo al Trabajador
                    </button>
                </form>
            </div>
            <style>
                .active-tab-sim { background:var(--bg-card-hover)!important; border-color:var(--color-primary)!important; color:var(--color-primary)!important; box-shadow:0 0 0 1px var(--color-primary); }
                .active-tab-sim .text-muted { color:var(--color-primary)!important; opacity:0.8; }
            </style>
        `;
        if (window.lucide) window.lucide.createIcons();
    },

    selectTipo(btn) {
        document.querySelectorAll('[data-tipo]').forEach(b => b.classList.remove('active-tab-sim'));
        btn.classList.add('active-tab-sim');
        document.getElementById('cm-tipo').value = btn.dataset.tipo;
        document.getElementById('cm-valor').value = btn.dataset.valor;
    },

    async save(e) {
        e.preventDefault();

        const cicloActivo = await db.getCicloActivo();
        if (!cicloActivo) {
            return App.alert({ title: 'Ciclo inactivo', message: 'Debes tener un ciclo activo configurado.', type: 'warning' });
        }

        const obreroId = parseInt(document.getElementById('cm-obrero').value);
        const fecha = document.getElementById('cm-fecha').value;

        const lockedCycle = await Ciclos.isDateLocked(fecha);
        if (lockedCycle) {
            return App.alert({ title: 'Semana Cerrada', message: 'No se permiten registros retroactivos a semanas ya pagadas.', type: 'error' });
        }

        const tipo = document.getElementById('cm-tipo').value;
        const customVal = document.getElementById('cm-valor-custom').value;

        if (!obreroId) return App.toast('Selecciona un obrero', 'error');

        const btnSave = document.getElementById('btn-save-comida-ind');
        if (btnSave) { btnSave.disabled = true; btnSave.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Procesando...'; if (window.lucide) window.lucide.createIcons(); }

        const duplicado = await db.existeComidaHoy(obreroId, fecha);
        if (duplicado) {
            if (btnSave) { btnSave.disabled = false; btnSave.innerHTML = '<i data-lucide="plus-circle"></i> Anexar Consumo'; if (window.lucide) window.lucide.createIcons(); }
            return App.alert({
                title: 'Alerta de Duplicidad',
                message: 'Evitamos guardar porque este trabajador ya registra servicios de alimentación para ese día particular.',
                type: 'warning'
            });
        }

        const cicloId = cicloActivo.id;

        if (tipo === 'completa') {
            let precioD = 3000, precioA = 5000, precioC = 3000;
            try {
                precioD = await db.getConfig('precioDesayuno', 3000);
                precioA = await db.getConfig('precioAlmuerzo', 5000);
                precioC = await db.getConfig('precioCena', 3000);
            } catch (e) { }

            await db.add('comida', { obreroId, fecha, tipo: 'desayuno', valor: precioD, cicloId });
            await db.add('comida', { obreroId, fecha, tipo: 'almuerzo', valor: precioA, cicloId });
            await db.add('comida', { obreroId, fecha, tipo: 'cena', valor: precioC, cicloId });
            App.toast('Servicio completo agregado a la cuenta del trabajador', 'success');
        } else {
            const valor = customVal ? parseFloat(customVal) : parseFloat(document.getElementById('cm-valor').value);
            await db.add('comida', { obreroId, fecha, tipo, valor, cicloId });
            App.toast(`Cobro de ${tipo} efectuado`, 'success');
        }

        if (typeof Asistencia !== 'undefined') {
            await Asistencia.syncAutoAsistencia(obreroId, fecha, 1, false);
        }

        document.getElementById('cm-valor-custom').value = '';
        Comida.loadHistory();
        if (btnSave) { btnSave.disabled = false; btnSave.innerHTML = '<i data-lucide="plus-circle"></i> Anexar Consumo al Trabajador'; if (window.lucide) window.lucide.createIcons(); }
    },

    /* ========================================
       Historial Unificado
       ======================================== */
    async loadHistory() {
        const filterFecha = document.getElementById('cm-filter-fecha')?.value || '';
        const filterObrero = document.getElementById('cm-filter-obrero')?.value || '';

        let comidas = await db.getByFinca('comida');
        const obreros = (await db.getByFinca('obreros')).filter(o => o.estado !== 'inactivo');
        const obMap = Object.fromEntries(obreros.map(o => [o.id, o.nombre]));

        if (filterFecha) comidas = comidas.filter(c => c.fecha === filterFecha);
        if (filterObrero) comidas = comidas.filter(c => c.obreroId === parseInt(filterObrero));
        comidas.sort((a, b) => b.fecha.localeCompare(a.fecha));

        const total = comidas.reduce((s, c) => s + (c.valor || 0), 0);
        const countD = comidas.filter(c => c.tipo === 'desayuno').length;
        const countA = comidas.filter(c => c.tipo === 'almuerzo').length;
        const countC = comidas.filter(c => c.tipo === 'cena').length;

        const resEl = document.getElementById('comida-resumen-hist');
        if (resEl) {
            resEl.innerHTML = `
                <div class="card-premium" style="flex:1; padding:12px; background:var(--bg-app)!important; display:flex; gap:12px; align-items:center">
                    <div style="background:rgba(239, 68, 68, 0.1); color:var(--color-danger); border-radius:10px; padding:12px"><i data-lucide="bar-chart"></i></div>
                    <div>
                        <div class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:700">Cant. Platos</div>
                        <div style="font-size:1.2rem; font-weight:800; color:var(--text-main)">${comidas.length}</div>
                    </div>
                </div>
                <div class="card-premium" style="flex:1; padding:12px; background:var(--bg-app)!important; display:flex; align-items:center; gap:12px">
                    <div style="font-size:1.2rem; color:var(--text-muted); display:flex; flex-direction:column; gap:4px">
                        <div style="display:flex; align-items:center; gap:8px"><i data-lucide="coffee" style="width:14px; color:var(--color-danger)"></i> <span style="font-size:0.9rem">${countD}</span></div>
                        <div style="display:flex; align-items:center; gap:8px"><i data-lucide="soup" style="width:14px; color:#f59e0b"></i> <span style="font-size:0.9rem">${countA}</span></div>
                        <div style="display:flex; align-items:center; gap:8px"><i data-lucide="moon" style="width:14px; color:#3b82f6"></i> <span style="font-size:0.9rem">${countC}</span></div>
                    </div>
                </div>
                <div class="card-premium" style="flex:2; padding:12px; background:var(--bg-surface-hover)!important; display:flex; gap:12px; align-items:center; border:1px solid var(--border-color)">
                     <div style="background:rgba(239, 68, 68, 0.1); color:var(--color-danger); border-radius:10px; padding:12px"><i data-lucide="receipt"></i></div>
                     <div>
                        <div class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:700">Flujo Descontable</div>
                        <div style="font-size:1.4rem; font-weight:800; color:var(--color-danger)">$${total.toLocaleString()}</div>
                     </div>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
        }

        const tbody = document.getElementById('comida-body');
        if (tbody) {
            tbody.innerHTML = comidas.length === 0
                ? '<tr><td colspan="5" style="padding:40px; text-align:center; color:var(--text-muted)"><i data-lucide="ghost" style="width:40px;height:40px;opacity:0.2;margin:0 auto 12px;display:block"></i>Sin reportes contables para este filtro.</td></tr>'
                : comidas.slice(0, 50).map(c => `
                    <tr style="border-bottom:1px solid var(--border-color)">
                        <td style="padding:12px 16px; font-size:0.85rem">${c.fecha}</td>
                        <td style="padding:12px 16px; font-weight:600">${obMap[c.obreroId] || 'Eliminado'}</td>
                        <td style="padding:12px 16px; font-size:0.85rem; text-transform:capitalize">
                            ${Comida.tipoNode(c.tipo)} ${c.tipo}
                        </td>
                        <td style="padding:12px 16px; text-align:right" class="text-red"><strong>$${(c.valor || 0).toLocaleString()}</strong></td>
                        <td style="padding:12px 16px; text-align:center">
                            <button class="btn-icon-only text-red" style="width:32px; height:32px; border:none; background:transparent" onclick="Comida.remove(${c.id})" title="Dar de baja">
                                <i data-lucide="trash-2" style="width:16px; height:16px"></i>
                            </button>
                        </td>
                    </tr>
                `).join('');
            if (window.lucide) window.lucide.createIcons();
        }
    },

    tipoNode(tipo) {
        if (tipo === 'desayuno') return '<i data-lucide="coffee" style="width:14px; height:14px; display:inline-block; vertical-align:middle; color:var(--color-danger)"></i>';
        if (tipo === 'almuerzo') return '<i data-lucide="soup" style="width:14px; height:14px; display:inline-block; vertical-align:middle; color:#f59e0b"></i>';
        if (tipo === 'cena') return '<i data-lucide="moon" style="width:14px; height:14px; display:inline-block; vertical-align:middle; color:#3b82f6"></i>';
        return '';
    },

    async remove(id) {
        const registro = await db.get('comida', id);
        if (registro && registro.cicloId) {
            const ciclo = await db.get('ciclos', registro.cicloId);
            if (ciclo && !ciclo.activo) {
                return App.alert({ title: 'Bloqueo Histórico', message: 'La semana de este cobro contable ya fue cerrada.', type: 'error' });
            }
        }

        App.confirmDelete({
            title: 'Borrar Consumo',
            message: 'Eliminar este cobro de alimentación retirará la deuda del saldo del trabajador. Útil si se marcó por error.',
            onConfirm: async () => {
                await db.delete('comida', id);
                App.toast('Consumo borrado del libro', 'info');
                Comida.loadHistory();
            }
        });
    }
};
