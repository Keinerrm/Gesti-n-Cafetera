/* ============================================
   asistencia.js — Módulo de Asistencia Avanzado
   ============================================ */

const Asistencia = {
    currentTab: 'calendario', // 'calendario' | 'masivo'

    // Estado Calendario
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    selectedObrero: null,
    activeBrush: 'completa',
    pendingChanges: {},
    originalRecords: [],

    // Estado Masivo
    masivoFecha: new Date().toLocaleDateString('en-CA'),
    masivoObreros: [],
    masivoAsistencias: {}, // Mapa de asistencias por obreroId hoy

    async render() {
        const overlay = document.getElementById('auditoria-drawer-overlay');
        const drawer = document.getElementById('auditoria-drawer');
        if (overlay) overlay.remove();
        if (drawer) drawer.remove();

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="animate-in">
                <div class="header-premium" style="margin-bottom:0">
                    <div class="header-icon" style="background:var(--bg-card-hover); color:var(--text-main)"><i data-lucide="calendar"></i></div>
                    <div style="flex:1">
                        <h2>Asistencia</h2>
                        <p class="text-muted" style="margin:0; font-size:0.85rem">Control de asistencia y registro de nómina</p>
                    </div>
                    <div style="display:flex; gap:12px; align-items:center;">
                        <button id="btn-auditoria-obrero" class="btn-premium secondary" onclick="Asistencia.alternarVistaAuditoria()" style="height:40px">
                            🔍 Resolver Reclamo Obrero
                        </button>
                        <div id="as-header-actions" style="display:flex;gap:12px">
                            <!-- Acciones dinámicas por tab -->
                        </div>
                    </div>
                </div>

                <div id="asistencia-planilla-masiva">
                    <div class="tabs" style="margin-bottom:24px; display:flex; gap:12px; margin-top:24px">
                        <button class="btn-premium ${this.currentTab === 'calendario' ? 'primary' : 'secondary'} flex-1" onclick="Asistencia.changeTab('calendario')">
                            <i data-lucide="calendar-days"></i> Calendario Mensual
                        </button>
                        <button class="btn-premium ${this.currentTab === 'masivo' ? 'primary' : 'secondary'} flex-1" onclick="Asistencia.changeTab('masivo')">
                            <i data-lucide="zap"></i> Registro Masivo Diario
                        </button>
                    </div>

                    <div id="as-tab-content"></div>
                </div>

                <div id="asistencia-auditoria-individual" style="display: none; margin-top:24px" class="animate-in">
                    <div class="card-glass" style="margin-bottom:24px; position:relative; overflow:hidden; padding:20px">
                        <div style="position:absolute; top:-50px; left:-50px; width:150px; height:150px; background:var(--color-primary); border-radius:50%; filter:blur(60px); opacity:0.15; z-index:-1"></div>
                        <div style="display:flex; align-items:center; gap:16px">
                            <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0">
                                <i data-lucide="user-search" style="color:var(--text-main); width:24px; height:24px"></i>
                            </div>
                            <div style="flex:1">
                                <label class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:700; letter-spacing:0.05em; margin-bottom:6px; display:block">Seleccionar Obrero para Auditoría de Reclamos</label>
                                <select class="input-premium" id="select-auditoria-obrero" onchange="Asistencia.cargarAlmanaqueObreroEspecifico(this.value)" style="background:rgba(0,0,0,0.2) !important; border:1px solid rgba(255,255,255,0.1) !important; color:var(--text-main); font-weight:600; font-size:1.05rem; padding:14px 16px;">
                                    <option value="">Seleccione un obrero...</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div id="contenedor-almanaque-dinamico"></div>
                </div>
            </div>
            <style>
                .active-brush { transform: scale(1.05); filter: brightness(1.2); box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important; border-color:currentColor !important; }
                .calendar-cell { position: relative; cursor: pointer; transition: all 0.15s ease; border-radius: 8px; font-weight:600; }
                .calendar-cell.dirty::after {
                    content: ''; position: absolute; top: 4px; right: 4px; width: 8px; height: 8px; 
                    background: var(--color-primary); border-radius: 50%; box-shadow: 0 0 6px var(--color-primary);
                }
                .calendar-cell:active { transform: scale(0.95); }
                .calendar-cell.descanso { background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3); }
                
                /* Masivo specific */
                .masivo-list { display:flex; flex-direction:column; gap:8px; max-height: 55vh; overflow-y:auto; padding-right:8px; }
                .masivo-item { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:var(--bg-surface); border:1px solid var(--border-color); border-radius:12px; cursor:pointer; transition:border-color 0.2s, background 0.2s; }
                .masivo-item:hover { border-color:var(--color-primary); background:var(--bg-surface-hover); }
                .check-group { display:flex; align-items:center; gap:16px; }
                .masivo-checkbox { width:1.4rem; height:1.4rem; accent-color:var(--color-primary); cursor:pointer; }
                .badge-estado { font-size: 0.75rem; padding: 4px 10px; border-radius: 12px; font-weight:700; display:inline-flex; align-items:center; gap:4px; }
                .badge-estado.completa { background: rgba(34, 197, 94, 0.1); color: var(--color-success); border:1px solid rgba(34, 197, 94, 0.2); }
                .badge-estado.media { background: rgba(245, 158, 11, 0.1); color: #f59e0b; border:1px solid rgba(245, 158, 11, 0.2); }
                .badge-estado.inasistencia { background: rgba(239, 68, 68, 0.1); color: var(--color-danger); border:1px solid rgba(239, 68, 68, 0.2); }
                .badge-estado.descanso { background: rgba(59, 130, 246, 0.1); color: #3b82f6; border:1px solid rgba(59, 130, 246, 0.2); }
                .badge-estado.domingo { background: var(--bg-app); color: var(--text-muted); border:1px solid var(--border-color); }

                /* Premium Almanaque Heatmap Grid responsivo */
                .almanaque-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 6px;
                    margin-top: 16px;
                }
                .almanaque-dia {
                    aspect-ratio: 1;
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    padding: 8px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    -webkit-tap-highlight-color: transparent;
                    position: relative;
                }
                .almanaque-dia:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-sm);
                }
                .almanaque-dia:active {
                    transform: scale(0.95);
                }
                .almanaque-dia-num {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    font-weight: 600;
                    align-self: flex-start;
                }
                .almanaque-dia-info {
                    font-size: 0.85rem;
                    font-weight: 800;
                    align-self: flex-end;
                }
                /* Heatmap colors using project HSL / custom themes */
                .calor-alto {
                    background: #15803d !important;
                    color: #ffffff !important;
                    border-color: #166534 !important;
                }
                .calor-alto .almanaque-dia-num {
                    color: rgba(255,255,255,0.7) !important;
                }
                .calor-medio {
                    background: #22c55e !important;
                    color: #ffffff !important;
                    border-color: #15803d !important;
                }
                .calor-medio .almanaque-dia-num {
                    color: rgba(255,255,255,0.7) !important;
                }
                .calor-bajo {
                    background: #bbf7d0 !important;
                    color: #166534 !important;
                    border-color: #86efac !important;
                }
                .calor-bajo .almanaque-dia-num {
                    color: #166534 !important;
                }
                .calor-alerta {
                    background: hsl(35, 100%, 90%) !important;
                    color: #b45309 !important;
                    border: 2px solid #f97316 !important;
                }
                .calor-alerta .almanaque-dia-num {
                    color: #b45309 !important;
                }
                .calor-vacio {
                    opacity: 0.4;
                    background: var(--bg-card);
                }
                
                /* Bottom Sheet Drawer for mobile touch claim solving */
                .ui-drawer-bottom {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: var(--bg-surface);
                    border-top: 1px solid var(--border-color);
                    border-top-left-radius: 20px;
                    border-top-right-radius: 20px;
                    box-shadow: 0 -10px 30px rgba(0,0,0,0.3);
                    z-index: 1000;
                    padding: 24px;
                    transform: translateY(100%);
                    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .ui-drawer-bottom.open {
                    transform: translateY(0);
                }
                .ui-drawer-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.5);
                    z-index: 999;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity 0.3s ease;
                }
                .ui-drawer-overlay.open {
                    opacity: 1;
                    pointer-events: auto;
                }
            </style>
        `;

        this.renderTabContent();

        // Ensure the top header icons are rendered!
        if (window.lucide) window.lucide.createIcons();
    },

    changeTab(tab) {
        if (this.currentTab === 'calendario' && Object.keys(this.pendingChanges).length > 0) {
            App.confirmDelete({
                title: 'Cambios sin guardar',
                message: 'Tienes cambios en el calendario sin guardar. ¿Descartarlos?',
                confirmText: 'Descartar',
                icon: '⚠️',
                onConfirm: () => {
                    this.pendingChanges = {};
                    this.currentTab = tab;
                    this.render();
                }
            });
            return;
        }
        this.currentTab = tab;
        this.render();
    },

    async renderTabContent() {
        const content = document.getElementById('as-tab-content');
        const headerActions = document.getElementById('as-header-actions');
        content.innerHTML = '<div class="text-center" style="padding:2rem"><div class="spinner"></div> Cargando...</div>';

        if (this.currentTab === 'calendario') {
            await this.renderCalendarioView(content, headerActions);
        } else {
            await this.renderMasivoView(content, headerActions);
        }
    },

    // ============================================
    // VISTA: CALENDARIO (Individual)
    // ============================================

    async renderCalendarioView(content, headerActions) {
        const obreros = (await db.getByFinca('obreros')).filter(o => o.estado === 'activo');

        headerActions.innerHTML = `
            <button class="btn-premium secondary" onclick="Asistencia.exportarPDF()" id="as-btn-pdf" style="display:none; height:40px"><i data-lucide="printer" style="width:16px"></i> Exportar PDF</button>
            <button class="btn-premium primary" onclick="Asistencia.guardarCambios()" id="as-btn-guardar" style="display:none; height:40px"><i data-lucide="save" style="width:16px"></i> Guardar Cambios</button>
        `;

        content.innerHTML = `
            <div class="card-glass" style="margin-bottom:24px; position:relative; overflow:hidden">
                <!-- Decorative background elements for glassmorphism -->
                <div style="position:absolute; top:-50px; left:-50px; width:150px; height:150px; background:var(--color-primary); border-radius:50%; filter:blur(60px); opacity:0.15; z-index:-1"></div>
                
                <div style="display:flex; align-items:center; gap:16px">
                    <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0">
                        <i data-lucide="users" style="color:var(--text-main); width:24px; height:24px"></i>
                    </div>
                    <div style="flex:1">
                        <label class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:700; letter-spacing:0.05em; margin-bottom:6px; display:block">Seleccionar Trabajador</label>
                        <select class="input-premium" id="as-obrero" onchange="Asistencia.changeObrero(this.value)" style="background:rgba(0,0,0,0.2) !important; border:1px solid rgba(255,255,255,0.1) !important; color:var(--text-main); font-weight:600; font-size:1.05rem">
                            <option value="">Seleccione a quién auditar...</option>
                            ${obreros.map(o => `<option value="${o.id}" ${this.selectedObrero == o.id ? 'selected' : ''}>${o.nombre}</option>`).join('')}
                        </select>
                    </div>
                </div>
            </div>

            <div id="as-resumen" class="grid-4" style="gap:12px; margin-bottom:24px; display:none"></div>

            <div class="card-premium" id="as-calendar-card" style="display:none; padding:24px">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px">
                    <button class="btn-icon-only text-muted" onclick="Asistencia.prevMonth()" style="background:var(--bg-app); border:1px solid var(--border-color)"><i data-lucide="chevron-left" style="width:20px"></i></button>
                    <h3 id="as-month-label" style="margin:0; font-size:1.2rem; min-width:160px; text-align:center"></h3>
                    <button class="btn-icon-only text-muted" onclick="Asistencia.nextMonth()" style="background:var(--bg-app); border:1px solid var(--border-color)"><i data-lucide="chevron-right" style="width:20px"></i></button>
                </div>

                <div style="text-align:center;font-size:0.85rem;color:var(--text-muted);margin-bottom:12px; font-weight:600">Herramienta de Registro (Pincel):</div>
                <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:center; margin-bottom:24px">
                    <button class="badge-estado chip ${this.activeBrush === 'completa' ? 'active-brush' : ''} completa" style="cursor:pointer; font-size:0.85rem; padding:6px 12px" onclick="Asistencia.setBrush('completa')">● Completa</button>
                    <button class="badge-estado chip ${this.activeBrush === 'media' ? 'active-brush' : ''} media" style="cursor:pointer; font-size:0.85rem; padding:6px 12px" onclick="Asistencia.setBrush('media')">● Media</button>
                    <button class="badge-estado chip ${this.activeBrush === 'inasistencia' ? 'active-brush' : ''} inasistencia" style="cursor:pointer; font-size:0.85rem; padding:6px 12px" onclick="Asistencia.setBrush('inasistencia')">● Falta</button>
                    <button class="badge-estado chip ${this.activeBrush === 'descanso' ? 'active-brush' : ''} descanso" style="cursor:pointer; font-size:0.85rem; padding:6px 12px" onclick="Asistencia.setBrush('descanso')">● Descanso</button>
                    <button class="badge-estado chip ${this.activeBrush === 'domingo' ? 'active-brush' : ''} domingo" style="cursor:pointer; font-size:0.85rem; padding:6px 12px" onclick="Asistencia.setBrush('domingo')">● Domingo</button>
                    <button class="badge-estado chip ${this.activeBrush === '' ? 'active-brush' : ''}" style="cursor:pointer; font-size:0.85rem; padding:6px 12px; background:var(--bg-surface-hover); color:var(--text-muted); border:1px dashed var(--border-color)" onclick="Asistencia.setBrush('')">⚪ Borrar</button>
                </div>

                <div id="as-calendar" class="calendar-grid"></div>
            </div>

            <div id="as-empty-state" class="card-glass" style="margin-top:24px; text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:300px; position:relative; overflow:hidden">
                <div style="position:absolute; bottom:-50px; right:-50px; width:200px; height:200px; background:var(--color-primary); border-radius:50%; filter:blur(80px); opacity:0.1; z-index:-1"></div>
                
                <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); width:80px; height:80px; border-radius:24px; display:flex; align-items:center; justify-content:center; margin-bottom:24px; backdrop-filter:blur(4px)">
                    <i data-lucide="user-search" style="width:40px; height:40px; color:var(--text-muted); opacity:0.7"></i>
                </div>
                <h3 style="margin:0 0 12px 0; font-size:1.5rem; font-weight:700; color:var(--text-main)">Panel de Control de Asistencia</h3>
                <p class="text-muted" style="max-width:380px; margin:0 auto; font-size:1rem; line-height:1.5">Elige un obrero en el selector superior para cargar su calendario mensual y comenzar a operar.</p>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();

        if (this.selectedObrero) {
            this.loadMonthData();
        }
    },

    setBrush(tipo) {
        Asistencia.activeBrush = tipo;
        // Refrescar solo visualmente los botones de pincel
        document.querySelectorAll('.chip').forEach(btn => {
            btn.classList.remove('active-brush');
            if (btn.textContent.toLowerCase().includes(tipo === '' ? 'borrar' : tipo.replace('inasistencia', 'falta'))) {
                btn.classList.add('active-brush');
            }
        });
    },

    getMonthLabel() {
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return `${months[Asistencia.currentMonth]} ${Asistencia.currentYear}`;
    },

    changeObrero(val) {
        Asistencia.selectedObrero = val ? parseInt(val) : null;
        Asistencia.pendingChanges = {}; // Clear buffer on switch
        if (Asistencia.selectedObrero) {
            Asistencia.loadMonthData();
        } else {
            document.getElementById('as-calendar-card').style.display = 'none';
            document.getElementById('as-resumen').style.display = 'none';
            document.getElementById('as-btn-guardar').style.display = 'none';
            document.getElementById('as-btn-pdf').style.display = 'none';
            document.getElementById('as-empty-state').style.display = 'flex';
        }
    },

    async loadMonthData() {
        document.getElementById('as-empty-state').style.display = 'none';
        document.getElementById('as-calendar-card').style.display = 'block';
        document.getElementById('as-resumen').style.display = 'block';
        document.getElementById('as-btn-guardar').style.display = 'inline-flex';
        document.getElementById('as-btn-pdf').style.display = 'inline-flex';

        const y = Asistencia.currentYear;
        const m = Asistencia.currentMonth;

        const all = await db.getAllByIndex('asistencia', 'obreroId', Asistencia.selectedObrero);
        Asistencia.originalRecords = all.filter(a => {
            const d = new Date(a.fecha + 'T12:00:00');
            return d.getMonth() === m && d.getFullYear() === y;
        });

        Asistencia.renderCalendar();
    },

    prevMonth() {
        Asistencia.checkPendingAndNavigate(() => {
            Asistencia.currentMonth--;
            if (Asistencia.currentMonth < 0) { Asistencia.currentMonth = 11; Asistencia.currentYear--; }
            document.getElementById('as-month-label').textContent = Asistencia.getMonthLabel();
            Asistencia.loadMonthData();
        });
    },

    nextMonth() {
        Asistencia.checkPendingAndNavigate(() => {
            Asistencia.currentMonth++;
            if (Asistencia.currentMonth > 11) { Asistencia.currentMonth = 0; Asistencia.currentYear++; }
            document.getElementById('as-month-label').textContent = Asistencia.getMonthLabel();
            Asistencia.loadMonthData();
        });
    },

    checkPendingAndNavigate(callback) {
        if (Object.keys(Asistencia.pendingChanges).length > 0) {
            App.confirmDelete({
                title: 'Cambios sin guardar',
                message: 'Tienes cambios pendientes en este mes que no se han guardado. ¿Descartarlos y cambiar de mes?',
                confirmText: 'Descartar',
                icon: '⚠️',
                onConfirm: () => {
                    Asistencia.pendingChanges = {};
                    callback();
                }
            });
        } else {
            callback();
        }
    },

    renderCalendar() {
        const cal = document.getElementById('as-calendar');
        if (!cal) return;

        const y = Asistencia.currentYear;
        const m = Asistencia.currentMonth;
        const firstDay = new Date(y, m, 1).getDay(); // 0=Sun
        const daysInMonth = new Date(y, m + 1, 0).getDate();
        const today = new Date();

        // Map DB records
        const recordMap = {};
        const autoMap = {}; // Guardar flag auto
        Asistencia.originalRecords.forEach(r => {
            recordMap[r.fecha] = r.tipo;
            if (r.auto) autoMap[r.fecha] = true;
        });

        // Merge Pending Changes into View Map
        const viewMap = { ...recordMap, ...Asistencia.pendingChanges };

        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        let html = dayNames.map(d => `<div class="calendar-header-cell">${d}</div>`).join('');

        // Empty cells before first day
        for (let i = 0; i < firstDay; i++) {
            html += '<div class="calendar-cell empty"></div>';
        }

        // Day cells
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = today.getDate() === day && today.getMonth() === m && today.getFullYear() === y;
            const isSunday = new Date(y, m, day).getDay() === 0;

            const state = viewMap[dateStr] || '';
            const isDirty = Asistencia.pendingChanges.hasOwnProperty(dateStr);
            const isAuto = autoMap[dateStr] && !isDirty; // Si se ensucia manual, pierde el rayo visualmente

            // Visual logic classes:
            // if state is empty but is sunday -> default grey domingo bg (handled by css .domingo)
            let cellClass = state;
            if (state === '' && isSunday) cellClass = 'domingo';

            // Agrega el rayo ⚡ si fue auto-generado
            const badgeIcon = isAuto ? `<span style="position:absolute; bottom:2px; right:4px; font-size:0.7rem; filter:drop-shadow(0 1px 1px rgba(0,0,0,0.5))">⚡</span>` : '';

            html += `
                <div class="calendar-cell ${cellClass} ${isToday ? 'today' : ''} ${isDirty ? 'dirty' : ''}"
                     style="position:relative;"
                     onclick="Asistencia.paintDay('${dateStr}')"
                     title="${state || (isSunday ? 'Domingo' : 'Sin registro')}">
                    <span>${day}</span>
                    ${badgeIcon}
                </div>
            `;
        }

        cal.innerHTML = html;

        // Render Summary
        Asistencia.renderResumen(viewMap);
    },

    paintDay(dateStr) {
        // Enlaza el estado actual de activeBrush al buffer de dia
        const currentState = Asistencia.pendingChanges[dateStr] !== undefined
            ? Asistencia.pendingChanges[dateStr]
            : (Asistencia.originalRecords.find(r => r.fecha === dateStr)?.tipo || '');

        if (currentState === Asistencia.activeBrush) {
            // Elimina del buffer si pintamos encima con el mismo brush (toggle effect to original)
            // o lo deja en el buffer pero vacante.
            Asistencia.pendingChanges[dateStr] = '';
        } else {
            Asistencia.pendingChanges[dateStr] = Asistencia.activeBrush;
        }

        Asistencia.renderCalendar();
    },

    renderResumen(viewMap) {
        const el = document.getElementById('as-resumen');
        if (!el) return;

        let completas = 0, medias = 0, inasistencias = 0, descansos = 0, domingos = 0;

        Object.values(viewMap).forEach(tipo => {
            if (tipo === 'completa') completas++;
            else if (tipo === 'media') medias++;
            else if (tipo === 'inasistencia') inasistencias++;
            else if (tipo === 'descanso') descansos++;
            else if (tipo === 'domingo') domingos++;
        });

        // Add auto-domingos that have no explict record to the count for visual consistency
        const y = Asistencia.currentYear;
        const m = Asistencia.currentMonth;
        const daysInMonth = new Date(y, m + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSunday = new Date(y, m, day).getDay() === 0;
            if (isSunday && (!viewMap[dateStr] || viewMap[dateStr] === '')) {
                domingos++;
            }
        }

        const btnState = Object.keys(Asistencia.pendingChanges).length > 0;
        document.getElementById('as-btn-guardar').disabled = !btnState;
        if (btnState) {
            document.getElementById('as-btn-guardar').classList.add('pulse');
        } else {
            document.getElementById('as-btn-guardar').classList.remove('pulse');
        }

        el.innerHTML = `
            <div class="card-premium" style="padding:16px; display:flex; flex-direction:column; justify-content:space-between">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px">
                    <div class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:700">Completas</div>
                    <div style="color:var(--color-success)"><i data-lucide="check-circle-2" style="width:16px"></i></div>
                </div>
                <div class="tabular-data" style="font-size:1.4rem; font-weight:800; color:var(--color-success)">${completas}</div>
            </div>
            <div class="card-premium" style="padding:16px; display:flex; flex-direction:column; justify-content:space-between">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px">
                    <div class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:700">Medias</div>
                    <div style="color:#f59e0b"><i data-lucide="clock-4" style="width:16px"></i></div>
                </div>
                <div class="tabular-data" style="font-size:1.4rem; font-weight:800; color:#f59e0b">${medias}</div>
            </div>
            <div class="card-premium" style="padding:16px; display:flex; flex-direction:column; justify-content:space-between">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px">
                    <div class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:700">Faltas</div>
                    <div style="color:var(--color-danger)"><i data-lucide="x-circle" style="width:16px"></i></div>
                </div>
                <div class="tabular-data" style="font-size:1.4rem; font-weight:800; color:var(--color-danger)">${inasistencias}</div>
            </div>
            <div class="card-premium" style="padding:16px; display:flex; flex-direction:column; justify-content:space-between">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px">
                    <div class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:700">Desc/Dom</div>
                    <div style="color:#3b82f6"><i data-lucide="coffee" style="width:16px"></i></div>
                </div>
                <div class="tabular-data" style="font-size:1.4rem; font-weight:800; color:#3b82f6">${descansos + domingos}</div>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    },

    async guardarCambios() {
        if (Object.keys(Asistencia.pendingChanges).length === 0) return;

        const btn = document.getElementById('as-btn-guardar');
        btn.textContent = 'Guardando...';
        btn.disabled = true;

        const obreroId = Asistencia.selectedObrero;
        // Batch promises array
        let ops = [];

        // Validar primero si hay alguna fecha bloqueada por cierre de ciclo
        for (const dateStr of Object.keys(Asistencia.pendingChanges)) {
            const lockedCycle = await Ciclos.isDateLocked(dateStr);
            if (lockedCycle) {
                btn.textContent = '💾 Guardar Cambios';
                btn.disabled = false;
                return App.alert({
                    title: '🔒 Semana cerrada',
                    message: `<div style="margin-bottom:0.75rem"><strong>Semana:</strong> ${lockedCycle.nombre} (${Ciclos.formatFecha(lockedCycle.fechaInicio || lockedCycle.fechainicio)} – ${Ciclos.formatFecha(lockedCycle.fechaFin || lockedCycle.fechafin)})</div>La fecha ${dateStr} pertenece a una nómina liquidada.<br>No se pueden modificar registros históricos.`,
                    type: 'error'
                });
            }
        }

        for (const [dateStr, newTipo] of Object.entries(Asistencia.pendingChanges)) {
            const existingRecord = Asistencia.originalRecords.find(r => r.fecha === dateStr);

            if (existingRecord) {
                if (newTipo === '') {
                    // Borrar
                    ops.push(db.delete('asistencia', existingRecord.id));
                } else if (newTipo !== existingRecord.tipo) {
                    // Actualizar (Forzar manual)
                    existingRecord.tipo = newTipo;
                    existingRecord.auto = false;
                    ops.push(db.put('asistencia', existingRecord));
                }
            } else {
                if (newTipo !== '') {
                    // Crear nuevo manual
                    ops.push(db.add('asistencia', { obreroId, fecha: dateStr, tipo: newTipo, auto: false }));
                }
            }
        }

        await Promise.all(ops);

        Asistencia.pendingChanges = {};
        App.toast('Asistencia guardada correctamente', 'success');

        btn.innerHTML = '💾 Guardar Cambios';
        await Asistencia.loadMonthData(); // Reload clean state
    },

    async exportarPDF() {
        if (typeof window.jspdf === 'undefined') {
            return App.toast('jsPDF no está cargado', 'error');
        }

        if (Object.keys(Asistencia.pendingChanges).length > 0) {
            return App.toast('Guarda los cambios antes de exportar', 'warning');
        }

        const obrero = await db.get('obreros', Asistencia.selectedObrero);
        if (!obrero) return;

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const dark = [30, 22, 18];
        const gray = [120, 120, 120];

        // Header
        doc.setFillColor(dark[0], dark[1], dark[2]);
        doc.rect(0, 0, 210, 35, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.text('CAFECONTROL', 15, 18);
        doc.setFontSize(14);
        doc.text('REPORTE DE ASISTENCIA', 15, 26);

        // Info
        doc.setTextColor(dark[0], dark[1], dark[2]);
        doc.setFontSize(14);
        doc.text(`Trabajador: ${obrero.nombre}`, 15, 50);
        doc.setFontSize(11);
        doc.setTextColor(gray[0], gray[1], gray[2]);
        doc.text(`Periodo: ${Asistencia.getMonthLabel()}`, 15, 57);
        doc.text(`Documento: ${obrero.documento || 'N/A'}`, 15, 63);

        doc.save(`Asistencia_Mensual_${obrero.nombre.replace(/\s+/g, '_')}_${Asistencia.getMonthLabel().replace(/\s+/g, '_')}.pdf`);
    },

    // ============================================
    // VISTA: MASIVO (Por Día)
    // ============================================

    async renderMasivoView(content, headerActions) {
        headerActions.innerHTML = '';

        // Fetch all active obreros
        const obreros = (await db.getByFinca('obreros')).filter(o => o.estado === 'activo');
        this.masivoObreros = obreros.sort((a, b) => a.nombre.localeCompare(b.nombre));

        // Format nice date specifically protected against UTC offset bugs
        const [year, month, day] = this.masivoFecha.split('-');
        const dateObj = new Date(year, month - 1, day);
        const niceDate = dateObj.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        content.innerHTML = `
            <div class="card-premium animate-in" style="margin-bottom:24px">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; flex-wrap:wrap; gap:16px">
                    <div>
                        <h3 style="margin:0 0 4px 0; color:var(--text-main); font-size:1.2rem; display:flex; align-items:center; gap:8px"><i data-lucide="calendar-check" style="width:20px; color:var(--color-primary)"></i> <span style="text-transform:capitalize">${niceDate}</span></h3>
                        <p style="margin:0;color:var(--text-muted);font-size:0.85rem">Inyección masiva de estado para la jornada</p>
                    </div>
                    <div>
                        <input type="date" value="${this.masivoFecha}" onchange="Asistencia.changeMasivoFecha(this.value)" class="input-premium" style="width:auto; height:40px">
                    </div>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; background:var(--bg-app); border:1px solid var(--border-color); border-radius:12px; margin-bottom:20px; flex-wrap:wrap; gap:12px">
                    <div style="display:flex; gap:8px; flex-wrap:wrap">
                        <button class="btn-premium secondary" style="height:32px; padding:0 12px; font-size:0.8rem" onclick="Asistencia.toggleMasivoAll(true)"><i data-lucide="check-square" style="width:14px"></i> Todos</button>
                        <button class="btn-premium secondary" style="height:32px; padding:0 12px; font-size:0.8rem" onclick="Asistencia.toggleMasivoInvert()"><i data-lucide="refresh-cw" style="width:14px"></i> Invertir</button>
                        <button class="btn-premium secondary" style="height:32px; padding:0 12px; font-size:0.8rem" onclick="Asistencia.toggleMasivoAll(false)"><i data-lucide="square" style="width:14px"></i> Ninguno</button>
                    </div>
                    <div style="font-size:0.9rem; color:var(--text-muted)">
                        <span id="masivo-count" style="font-weight:800; font-size:1.2rem; color:var(--text-main)">0</span> / ${obreros.length}
                    </div>
                </div>

                <div class="masivo-list" id="masivo-list-container">
                    <!-- Checkboxes de obreros cargados dinamicamente -->
                </div>
            </div>

            <!-- Panel Flotante Fijo Footer para Guardado MASIVO -->
            <div class="card-premium animate-up" style="padding:20px; position:sticky; bottom:16px; border:1px solid var(--color-primary); box-shadow:0 -8px 32px rgba(0,0,0,0.4); z-index:100">
                <div style="text-align:center; margin-bottom:12px; font-weight:700; font-size:0.85rem; text-transform:uppercase; color:var(--text-muted)">Aplicar estado a seleccionados:</div>
                <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:center">
                    <button class="btn-premium primary" style="background:var(--color-success); border-color:var(--color-success); color:#fff; flex:1; min-width:140px; justify-content:flex-start" onclick="Asistencia.guardarMasivo('completa')"><i data-lucide="check-circle" style="width:18px"></i> Completa</button>
                    <button class="btn-premium primary" style="background:#f59e0b; border-color:#f59e0b; color:#fff; flex:1; min-width:140px; justify-content:flex-start" onclick="Asistencia.guardarMasivo('media')"><i data-lucide="clock" style="width:18px"></i> Media jornada</button>
                    <button class="btn-premium primary" style="background:var(--color-danger); border-color:var(--color-danger); color:#fff; flex:1; min-width:140px; justify-content:flex-start" onclick="Asistencia.guardarMasivo('inasistencia')"><i data-lucide="x-circle" style="width:18px"></i> Falta</button>
                    <button class="btn-premium secondary" style="flex:1; min-width:140px; justify-content:flex-start" onclick="Asistencia.guardarMasivo('descanso')"><i data-lucide="coffee" style="width:18px"></i> Descanso</button>
                    <button class="btn-premium secondary" style="flex:1; min-width:140px; justify-content:flex-start" onclick="Asistencia.guardarMasivo('domingo')"><i data-lucide="calendar" style="width:18px"></i> Domingo</button>
                    <button class="btn-premium secondary" style="flex:1; min-width:140px; justify-content:flex-start" onclick="Asistencia.guardarMasivo('')"><i data-lucide="trash-2" style="width:18px"></i> Borrar</button>
                </div>
            </div>
        `;

        await this.loadMasivoData();
        if (window.lucide) window.lucide.createIcons();
    },

    async loadMasivoData() {
        // Cargar todos los registros del día seleccionado usando Index compuesto "fecha"
        const recordsHoy = await db.getAllByIndex('asistencia', 'fecha', this.masivoFecha);

        // Crear diccionario ObreroId -> Registro (O(1) lookups)
        const mapaHoy = {};
        recordsHoy.forEach(r => {
            mapaHoy[r.obreroId] = r;
        });

        this.masivoAsistencias = mapaHoy;

        const container = document.getElementById('masivo-list-container');
        let html = '';

        this.masivoObreros.forEach(o => {
            const hasRecord = mapaHoy[o.id];

            let statusBadge = '';
            if (hasRecord) {
                let badgeClass = hasRecord.tipo;
                let text = hasRecord.tipo;
                if (text === 'inasistencia') text = 'falta';
                statusBadge = `<span class="badge-estado ${badgeClass}">${text.charAt(0).toUpperCase() + text.slice(1)} ${hasRecord.auto ? '⚡' : ''}</span>`;
            } else {
                statusBadge = `<span class="badge-estado" style="background:transparent;color:var(--text-muted);border:1px dashed var(--border)">Sin registro</span>`;
            }

            // Iniciar por defecto todos checkeados para agilizar ingresos (como pidió el user)
            // Solo los checkeo si NO tienen registro, o si lo tienen pero no forzar.
            // Para masivo, todos selectos `checked` es mejor.
            html += `
                <div class="masivo-item" onclick="Asistencia.toggleMasivoCheck(${o.id})">
                    <div class="check-group">
                        <input type="checkbox" class="masivo-checkbox" id="chk-ob-${o.id}" value="${o.id}" checked onclick="event.stopPropagation(); Asistencia.updateMasivoCount()">
                        <div style="background:var(--bg-surface-hover); width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.9rem; color:var(--color-primary)">${o.nombre.charAt(0)}</div>
                        <span style="font-weight:700;font-size:1.05rem; color:var(--text-main)">${o.nombre}</span>
                    </div>
                    <div>
                        ${statusBadge}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
        this.updateMasivoCount();
    },

    changeMasivoFecha(val) {
        if (!val) return;
        this.masivoFecha = val;
        this.renderTabContent();
    },

    toggleMasivoCheck(id) {
        const chk = document.getElementById(`chk-ob-${id}`);
        if (chk) {
            chk.checked = !chk.checked;
            this.updateMasivoCount();
        }
    },

    toggleMasivoAll(state) {
        document.querySelectorAll('.masivo-checkbox').forEach(chk => {
            chk.checked = state;
        });
        this.updateMasivoCount();
    },

    toggleMasivoInvert() {
        document.querySelectorAll('.masivo-checkbox').forEach(chk => {
            chk.checked = !chk.checked;
        });
        this.updateMasivoCount();
    },

    updateMasivoCount() {
        const count = document.querySelectorAll('.masivo-checkbox:checked').length;
        const el = document.getElementById('masivo-count');
        if (el) {
            el.textContent = count;
            el.style.color = count > 0 ? 'var(--green)' : 'var(--text-muted)';
            el.style.fontWeight = count > 0 ? 'bold' : 'normal';
        }
    },

    async guardarMasivo(estadoSeleccionado) {
        const lockedCycle = await Ciclos.isDateLocked(this.masivoFecha);
        if (lockedCycle) {
            return App.alert({
                title: '🔒 Semana cerrada',
                message: `<div style="margin-bottom:0.75rem"><strong>Semana:</strong> ${lockedCycle.nombre} (${Ciclos.formatFecha(lockedCycle.fechaInicio || lockedCycle.fechainicio)} – ${Ciclos.formatFecha(lockedCycle.fechaFin || lockedCycle.fechafin)})</div>La nómina de esta semana ya fue liquidada.<br>No se pueden modificar registros históricos.`,
                type: 'error'
            });
        }

        const checkboxes = document.querySelectorAll('.masivo-checkbox:checked');
        const selectedIds = Array.from(checkboxes).map(c => parseInt(c.value));

        if (selectedIds.length === 0) {
            return App.toast('Debes seleccionar al menos un trabajador', 'warning');
        }

        const msgList = estadoSeleccionado === 'inasistencia' ? 'falta(s)' : estadoSeleccionado + '(s)';

        App.confirmDelete({
            title: 'Confirmación Masiva',
            message: `Vas a registrar el estado "${msgList.toUpperCase()}" a ${selectedIds.length} obreros para el día ${this.masivoFecha}.<br><br>Los registros previos de este día para estos trabajadores serán sobreescritos.`,
            confirmText: 'Sí, registrar',
            icon: '⚡',
            onConfirm: async () => {
                const ops = [];

                selectedIds.forEach(id => {
                    const existingRecord = this.masivoAsistencias[id];

                    if (existingRecord) {
                        if (existingRecord.tipo !== estadoSeleccionado) {
                            existingRecord.tipo = estadoSeleccionado;
                            existingRecord.auto = false;
                            ops.push(db.put('asistencia', existingRecord));
                        }
                    } else {
                        ops.push(db.add('asistencia', {
                            obreroId: id,
                            fecha: this.masivoFecha,
                            tipo: estadoSeleccionado,
                            auto: false
                        }));
                    }
                });

                if (ops.length > 0) {
                    await Promise.all(ops);
                    App.toast(`Se actualizaron ${ops.length} registros exitosamente`, 'success');
                } else {
                    App.toast('No hubo cambios necesarios en la selección', 'info');
                }

                await this.loadMasivoData();
            }
        });
    },

    // ============================================
    // TRIGGERS INTERNOS (Para Módulo Jornales)
    // ============================================

    /**
     * Sincroniza en batch asistencias de Jornales Rapidos
     * @param {Array} entries [{obreroId, fecha, kilosTotal}, ...]
     */
    async syncAutoAsistenciaBatch(entries) {
        let recordsHoy = null;
        let lastFecha = null;
        let mapaHoy = {};
        const ops = [];

        for (const e of entries) {
            // Optimización: Cargar la BD de asistencia por fecha solo si la fecha cambia
            if (e.fecha !== lastFecha) {
                recordsHoy = await db.getAllByIndex('asistencia', 'fecha', e.fecha);
                mapaHoy = {};
                recordsHoy.forEach(r => mapaHoy[r.obreroId] = r);
                lastFecha = e.fecha;
            }

            const attendance = mapaHoy[e.obreroId];

            if (e.kilosTotal > 0) {
                // Generar Completa Automática
                if (!attendance) {
                    // No hay, crear nueva auto
                    ops.push(db.add('asistencia', { obreroId: e.obreroId, fecha: e.fecha, tipo: 'completa', auto: true }));
                    mapaHoy[e.obreroId] = { fake: true }; // Cache manual anti-duplicados lote
                } else {
                    // Ya existe. Solo pisar si es Falta y NO es manual explícito.
                    if (attendance.tipo === 'inasistencia' && attendance.auto !== false) {
                        attendance.tipo = 'completa';
                        attendance.auto = true;
                        ops.push(db.put('asistencia', attendance));
                    }
                }
            } else if (e.action === 'delete') {
                // En modo batch raras veces es delete, pero se soporta.
                if (attendance && attendance.auto === true) {
                    ops.push(db.delete('asistencia', attendance.id));
                }
            }
        }

        if (ops.length > 0) await Promise.all(ops);
    },

    alternarVistaAuditoria() {
        const masiva = document.getElementById('asistencia-planilla-masiva');
        const auditoria = document.getElementById('asistencia-auditoria-individual');
        const btn = document.getElementById('btn-auditoria-obrero');
        
        if (auditoria.style.display === 'none') {
            masiva.style.display = 'none';
            auditoria.style.display = 'block';
            btn.innerHTML = '⬅ Volver a Planilla General';
            btn.className = 'btn-premium danger'; // color de advertencia/rojo
            this.poblarSelectorObrerosAuditoria();
        } else {
            masiva.style.display = 'block';
            auditoria.style.display = 'none';
            btn.innerHTML = '🔍 Resolver Reclamo Obrero';
            btn.className = 'btn-premium secondary';
            
            // Clean up
            const select = document.getElementById('select-auditoria-obrero');
            if (select) select.value = '';
            const container = document.getElementById('contenedor-almanaque-dinamico');
            if (container) container.innerHTML = '';
            this.cerrarDrawer();
        }
        if (window.lucide) window.lucide.createIcons();
    },

    async poblarSelectorObrerosAuditoria() {
        const select = document.getElementById('select-auditoria-obrero');
        if (!select) return;

        // Evita duplicar si ya tiene más que la opción por defecto
        if (select.options.length > 1) return;

        const obreros = (await db.getByFinca('obreros')).filter(o => o.estado === 'activo');
        
        obreros.forEach(o => {
            const cedulaStr = o.cedula ? String(o.cedula) : '';
            const ultimosCuatro = cedulaStr.length >= 4 ? cedulaStr.slice(-4) : cedulaStr.padStart(4, '0');
            const option = document.createElement('option');
            option.value = o.id;
            option.textContent = `${o.nombre} (${ultimosCuatro})`;
            select.appendChild(option);
        });
    },

    async cargarAlmanaqueObreroEspecifico(obreroId) {
        const container = document.getElementById('contenedor-almanaque-dinamico');
        if (!container) return;

        if (!obreroId) {
            container.innerHTML = '';
            return;
        }

        const y = Asistencia.currentYear;
        const m = Asistencia.currentMonth;
        const daysInMonth = new Date(y, m + 1, 0).getDate();
        const fechaInicio = `${y}-${String(m + 1).padStart(2, '0')}-01`;
        const fechaFin = `${y}-${String(m + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

        container.innerHTML = '<div class="text-center" style="padding:2rem"><div class="spinner"></div> Procesando auditoría...</div>';

        try {
            // Consulta paralela hacia IndexedDB/Supabase
            const [jornales, comidas, asistencias, lotes] = await Promise.all([
                db.getJornalesByObreroAndRange(parseInt(obreroId), fechaInicio, fechaFin),
                db.getComidaByObreroAndRange(parseInt(obreroId), fechaInicio, fechaFin),
                db.getAllByIndex('asistencia', 'obreroId', parseInt(obreroId)),
                db.getByFinca('lotes')
            ]);

            const ltMap = Object.fromEntries(lotes.map(l => [l.id, l.nombre]));

            const asistenciasMes = asistencias.filter(a => {
                const d = new Date(a.fecha + 'T12:00:00');
                return d.getMonth() === m && d.getFullYear() === y;
            });

            // Map data by day
            Asistencia._auditoriaHistorial = {};
            
            for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                
                const dayJornales = jornales.filter(j => j.fecha === dateStr);
                const dayComidas = comidas.filter(c => c.fecha === dateStr);
                const dayAsistencia = asistenciasMes.find(a => a.fecha === dateStr);

                const kilosTotal = dayJornales.reduce((s, j) => s + (j.kilosRecolectados || 0), 0);
                const hasFood = dayComidas.length > 0;
                const hasAttendance = dayAsistencia !== undefined;
                
                let calorClass = 'calor-vacio';
                if (kilosTotal >= 80) {
                    calorClass = 'calor-alto';
                } else if (kilosTotal >= 40) {
                    calorClass = 'calor-medio';
                } else if (kilosTotal > 0) {
                    calorClass = 'calor-bajo';
                } else if (kilosTotal === 0 && (hasAttendance || hasFood)) {
                    calorClass = 'calor-alerta'; // Alerta Ámbar: asistencia o comida pero 0 kilos
                }

                Asistencia._auditoriaHistorial[dateStr] = {
                    dateStr,
                    day,
                    kilosTotal,
                    jornales: dayJornales,
                    comidas: dayComidas,
                    asistencia: dayAsistencia,
                    hasFood,
                    hasAttendance,
                    calorClass,
                    ltMap
                };
            }

            // Draw almanaque grilla
            const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            let htmlGrid = dayNames.map(d => `<div class="calendar-header-cell" style="font-weight:700">${d}</div>`).join('');

            const firstDayIndex = new Date(y, m, 1).getDay(); // 0=Sunday
            
            // Empty leading cells
            for (let i = 0; i < firstDayIndex; i++) {
                htmlGrid += '<div class="calendar-cell empty"></div>';
            }

            // Draw active cells
            for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const data = Asistencia._auditoriaHistorial[dateStr];
                
                let infoContent = '';
                if (data.kilosTotal > 0) {
                    infoContent = `${data.kilosTotal} kg`;
                } else if (data.calorClass === 'calor-alerta') {
                    infoContent = '⚠️ 0 kg';
                }

                htmlGrid += `
                    <div class="almanaque-dia ${data.calorClass}" onclick="Asistencia.mostrarDesgloseDetallado('${dateStr}')">
                        <span class="almanaque-dia-num">${day}</span>
                        <span class="almanaque-dia-info">${infoContent}</span>
                    </div>
                `;
            }

            // Legend layout
            const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            
            container.innerHTML = `
                <div class="card-premium animate-in" style="padding:24px; margin-bottom:24px">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid var(--border-color); padding-bottom:12px">
                        <h4 style="margin:0; font-size:1.1rem; display:flex; align-items:center; gap:8px">
                            <i data-lucide="bar-chart-3" style="color:var(--color-primary)"></i> Almanaque de Rendimiento: ${months[m]} ${y}
                        </h4>
                    </div>

                    <!-- Grilla del Calendario -->
                    <div class="almanaque-grid">
                        ${htmlGrid}
                    </div>

                    <!-- Leyenda del Mapa de Calor -->
                    <div style="margin-top:24px; display:flex; gap:16px; flex-wrap:wrap; justify-content:center; padding:12px; background:var(--bg-app); border-radius:10px; border:1px solid var(--border-color)">
                        <div style="display:flex; align-items:center; gap:6px; font-size:0.8rem">
                            <span style="width:16px; height:16px; border-radius:4px; display:inline-block; background:#15803d"></span>
                            <span>Excelente (≥ 80 kg)</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:6px; font-size:0.8rem">
                            <span style="width:16px; height:16px; border-radius:4px; display:inline-block; background:#22c55e"></span>
                            <span>Estándar (≥ 40 kg)</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:6px; font-size:0.8rem">
                            <span style="width:16px; height:16px; border-radius:4px; display:inline-block; background:#bbf7d0"></span>
                            <span>Bajo (< 40 kg)</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:6px; font-size:0.8rem">
                            <span style="width:16px; height:16px; border-radius:4px; display:inline-block; background:hsl(35, 100%, 90%); border:1px solid #f97316"></span>
                            <span>Alerta (Asistencia/Comida sin peso)</span>
                        </div>
                    </div>
                </div>
            `;

            if (window.lucide) window.lucide.createIcons();

        } catch (e) {
            console.error('Error cargando auditoría:', e);
            container.innerHTML = `<div class="card-premium danger text-center" style="padding:20px">Error al procesar el expediente del obrero.</div>`;
        }
    },

    mostrarDesgloseDetallado(fecha) {
        const data = Asistencia._auditoriaHistorial[fecha];
        if (!data) return;

        // Ensure drawer elements exist in DOM
        let overlay = document.getElementById('auditoria-drawer-overlay');
        let drawer = document.getElementById('auditoria-drawer');

        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'auditoria-drawer-overlay';
            overlay.className = 'ui-drawer-overlay';
            overlay.onclick = () => Asistencia.cerrarDrawer();
            document.body.appendChild(overlay);
        }

        if (!drawer) {
            drawer = document.createElement('div');
            drawer.id = 'auditoria-drawer';
            drawer.className = 'ui-drawer-bottom';
            document.body.appendChild(drawer);
        }

        // Format date beautifully
        const [year, month, day] = fecha.split('-');
        const dateObj = new Date(year, month - 1, day);
        const formatTitle = dateObj.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        // Build list of weights (pesadas)
        let pesadasHtml = '<p class="text-muted" style="font-size:0.9rem">No registra pesajes de café este día.</p>';
        if (data.jornales.length > 0) {
            pesadasHtml = data.jornales.map((j, idx) => `
                <div style="background:var(--bg-app); border:1px solid var(--border-color); padding:12px; border-radius:8px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center">
                    <div>
                        <strong style="color:var(--text-main)">Registro #${idx + 1}</strong>
                        <div class="text-muted" style="font-size:0.75rem">Lote: ${data.ltMap[j.loteId] || 'Lote Eliminado'} | Tipo: ${j.tipoPago === 'kilo' ? 'Por Kilo' : 'Por Día'}</div>
                    </div>
                    <div style="text-align:right">
                        <span style="font-size:1.1rem; font-weight:800; color:var(--color-primary)">${j.kilosRecolectados} kg</span>
                        <div style="font-size:0.75rem; color:var(--text-muted)">AM: ${j.kilosAM || 0} kg | PM: ${j.kilosPM || 0} kg</div>
                    </div>
                </div>
            `).join('');
        }

        // Build foods detailed view
        let comidasHtml = '<span style="font-size:0.85rem; font-weight:600; color:var(--text-muted)">No consumió servicio de comedor.</span>';
        if (data.comidas.length > 0) {
            comidasHtml = data.comidas.map(c => `
                <span class="badge-estado media" style="font-size:0.85rem; padding:6px 12px; display:inline-flex; align-items:center; gap:4px">
                    <i data-lucide="utensils" style="width:14px; height:14px"></i>
                    ${c.tipo} ($${c.valor.toLocaleString()})
                </span>
            `).join('');
        }

        // Attendance state
        let asistenciaHtml = '';
        if (data.asistencia) {
            let badgeClass = data.asistencia.tipo;
            let text = data.asistencia.tipo;
            if (text === 'inasistencia') text = 'falta';
            asistenciaHtml = `<span class="badge-estado ${badgeClass}" style="font-size:0.9rem; padding:6px 14px">${text.toUpperCase()} ${data.asistencia.auto ? '⚡' : ''}</span>`;
        } else {
            asistenciaHtml = `<span class="badge-estado" style="background:var(--bg-app); border:1px dashed var(--border-color); color:var(--text-muted); font-size:0.9rem; padding:6px 14px">SIN REGISTRO</span>`;
        }

        // Inject content
        drawer.innerHTML = `
            <div style="width:40px; height:4px; background:var(--border-color); border-radius:2px; margin: 0 auto 16px; cursor:pointer" onclick="Asistencia.cerrarDrawer()"></div>
            
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; border-bottom:1px solid var(--border-color); padding-bottom:12px">
                <div>
                    <h3 style="margin:0; font-size:1.2rem; font-weight:800; color:var(--text-main); text-transform:capitalize">${formatTitle}</h3>
                    <p class="text-muted" style="margin:2px 0 0; font-size:0.85rem">Auditoría y Resolución de Reclamos en Finca</p>
                </div>
                <button onclick="Asistencia.cerrarDrawer()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.5rem; cursor:pointer; line-height:1">&times;</button>
            </div>

            <div style="display:flex; flex-direction:column; gap:20px; margin-bottom:24px; max-height: 45vh; overflow-y: auto;">
                
                <!-- Kilos y Asistencia Row -->
                <div style="display:flex; justify-content:space-between; align-items:center; gap:16px; flex-wrap:wrap">
                    <div>
                        <span class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:700; display:block; margin-bottom:4px">Kilos Totales del Día</span>
                        <span style="font-size:2rem; font-weight:900; color:${data.kilosTotal > 0 ? 'var(--color-primary)' : 'var(--text-muted)'}">${data.kilosTotal.toLocaleString()} kg</span>
                    </div>
                    <div>
                        <span class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:700; display:block; margin-bottom:6px; text-align:right">Estado de Asistencia</span>
                        <div style="text-align:right">${asistenciaHtml}</div>
                    </div>
                </div>

                <!-- Pesadas Detalle -->
                <div>
                    <h5 style="margin:0 0 10px; font-size:0.85rem; text-transform:uppercase; font-weight:700; color:var(--text-muted); display:flex; align-items:center; gap:6px">
                        <i data-lucide="scale" style="width:16px; height:16px"></i> Pesadas Registradas
                    </h5>
                    ${pesadasHtml}
                </div>

                <!-- Comidas Detalle -->
                <div>
                    <h5 style="margin:0 0 10px; font-size:0.85rem; text-transform:uppercase; font-weight:700; color:var(--text-muted); display:flex; align-items:center; gap:6px">
                        <i data-lucide="utensils" style="width:16px; height:16px"></i> Alimentación / Comedor
                    </h5>
                    <div style="display:flex; gap:8px; flex-wrap:wrap">
                        ${comidasHtml}
                    </div>
                </div>

                <!-- Alertas de Conflicto -->
                ${data.calorClass === 'calor-alerta' ? `
                    <div style="background:rgba(217, 119, 6, 0.1); border:1px solid #d97706; border-radius:10px; padding:16px; display:flex; gap:12px; align-items:flex-start">
                        <i data-lucide="alert-triangle" style="color:#d97706; flex-shrink:0; width:20px; height:20px"></i>
                        <div>
                            <strong style="color:#b45309; font-size:0.9rem; display:block; margin-bottom:2px">⚠️ Conflicto de Registro Detectado</strong>
                            <p style="margin:0; font-size:0.8rem; color:#b45309; line-height:1.4">El obrero tiene asistencia o comida registrada este día, pero <strong>no pesó ningún kilo de café</strong>. Confirme de inmediato con el recolector si se trató de un día de descanso pagado, media jornada no productiva, o un error de pesaje en el recibidor.</p>
                        </div>
                    </div>
                ` : ''}
            </div>

            <!-- Drawer Close Button -->
            <button class="btn-premium primary" style="width:100%; padding:14px; font-size:1rem; font-weight:700; border-radius:12px" onclick="Asistencia.cerrarDrawer()">
                Confirmar y Cerrar Auditoría
            </button>
        `;

        if (window.lucide) window.lucide.createIcons();

        // Trigger open transitions
        setTimeout(() => {
            overlay.classList.add('open');
            drawer.classList.add('open');
        }, 10);
    },

    cerrarDrawer() {
        const overlay = document.getElementById('auditoria-drawer-overlay');
        const drawer = document.getElementById('auditoria-drawer');
        if (overlay) {
            overlay.classList.remove('open');
            setTimeout(() => overlay.remove(), 300);
        }
        if (drawer) {
            drawer.classList.remove('open');
            setTimeout(() => drawer.remove(), 300);
        }
    },

    async syncAutoAsistencia(obreroId, fecha, kilosTotal, isDelete = false) {
        const recordsHoy = await db.getAllByIndex('asistencia', 'fecha', fecha);
        const attendance = recordsHoy.find(a => a.obreroId === obreroId);

        if (isDelete || kilosTotal <= 0) {
            if (attendance && attendance.auto === true) {
                await db.delete('asistencia', attendance.id);
            }
        } else {
            // kilos > 0
            if (!attendance) {
                await db.add('asistencia', { obreroId, fecha, tipo: 'completa', auto: true });
            } else if (attendance.tipo === 'inasistencia' && attendance.auto !== false) {
                attendance.tipo = 'completa';
                attendance.auto = true;
                await db.put('asistencia', attendance);
            }
        }
    }

};
