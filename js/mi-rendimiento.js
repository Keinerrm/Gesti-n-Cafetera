/* ============================================
   mi-rendimiento.js — Portal del Obrero
   Vista exclusiva para rol 'obrero'
   Premium Design System · Mobile-First
   ============================================ */

const MiRendimiento = {

    /**
     * Obtiene el registro del obrero vinculado al usuario logueado
     * La vinculación es: usuarios.cedula === obreros.documento
     */
    async _getObreroVinculado() {
        let user = null;
        try {
            user = JSON.parse(sessionStorage.getItem('cafecontrol_user'));
        } catch (e) {}

        if (!user || !user.cedula) return null;

        const obreros = await db.getByFinca('obreros');
        return obreros.find(o => o.documento === user.cedula) || null;
    },

    async render() {
        const app = document.getElementById('app');

        // Mostrar loader mientras carga
        app.innerHTML = `
            <div class="animate-in" style="display:flex; align-items:center; justify-content:center; min-height:60vh">
                <div style="text-align:center">
                    <i data-lucide="loader-2" class="spin" style="width:40px; height:40px; color:var(--color-primary)"></i>
                    <p class="text-muted" style="margin-top:16px; font-weight:600">Cargando tu rendimiento...</p>
                </div>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();

        const obrero = await this._getObreroVinculado();

        if (!obrero) {
            app.innerHTML = `
                <div class="animate-in" style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:70vh; text-align:center; padding:24px">
                    <div style="background:rgba(239, 68, 68, 0.1); border-radius:20px; padding:24px; margin-bottom:24px">
                        <i data-lucide="user-x" style="width:56px; height:56px; color:var(--color-danger)"></i>
                    </div>
                    <h2 style="margin:0 0 8px 0; color:var(--text-main); font-size:1.4rem">Perfil No Vinculado</h2>
                    <p class="text-muted" style="max-width:360px; line-height:1.6; margin-bottom:32px">
                        Tu cuenta de usuario no está vinculada a ningún trabajador registrado en el sistema.
                        Contacta al administrador para que asocie tu cédula con tu perfil de obrero.
                    </p>
                    <button class="btn-premium" style="background:var(--color-danger); color:#fff; border:none; padding:12px 32px; border-radius:12px; font-weight:700; cursor:pointer" onclick="MiRendimiento.cerrarSesion()">
                        <i data-lucide="log-out" style="width:18px; height:18px"></i> Cerrar Sesión
                    </button>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        // Obtener datos del ciclo activo
        const cicloActivo = await db.getCicloActivo();
        const lotes = await db.getByFinca('lotes');
        const ltMap = Object.fromEntries(lotes.map(l => [l.id, l.nombre]));

        // Jornales del obrero
        const todosJornales = await db.getAllByIndex('jornales', 'obreroId', obrero.id);
        const todasComidas = await db.getAllByIndex('comida', 'obreroId', obrero.id);
        const todasVentas = await db.getAllByIndex('ventasCaja', 'obreroId', obrero.id);
        const todosPagos = (await db.getAllByIndex('pagos', 'obreroId', obrero.id)).filter(p => p.estado !== 'anulado');

        // Filtrar por ciclo activo
        let jornalesCiclo = [], comidasCiclo = [], ventasCiclo = [];
        let fechaInicio = '', fechaFin = '', nombreCiclo = 'Sin ciclo activo';

        if (cicloActivo) {
            fechaInicio = cicloActivo.fechaInicio;
            fechaFin = cicloActivo.fechaFin;
            nombreCiclo = cicloActivo.nombre;

            jornalesCiclo = todosJornales.filter(j =>
                j.cicloId === cicloActivo.id || (!j.cicloId && j.fecha >= fechaInicio && j.fecha <= fechaFin)
            );
            comidasCiclo = todasComidas.filter(c =>
                c.cicloId === cicloActivo.id || (!c.cicloId && c.fecha >= fechaInicio && c.fecha <= fechaFin)
            );
            ventasCiclo = todasVentas.filter(v =>
                v.fiado && (v.cicloId === cicloActivo.id || (!v.cicloId && v.fecha >= fechaInicio && v.fecha <= fechaFin))
            );
        }

        // Obtener el precio por kilo de forma robusta
        let precioKilo = 0;
        if (cicloActivo) {
            precioKilo = cicloActivo.precioKilo || cicloActivo.precio_kilo || cicloActivo.tarifaKilo;
        }
        if (!precioKilo) {
            precioKilo = await db.getConfig('tarifaKilo', 500);
        }
        if (!precioKilo || precioKilo <= 0) {
            precioKilo = 1000; // Valor por defecto
        }

        // KPIs
        const kilosSemana = jornalesCiclo.reduce((s, j) => s + (j.kilosRecolectados || 0), 0);
        const gananciasBrutas = kilosSemana * precioKilo;
        const descuentoComida = comidasCiclo.reduce((s, c) => s + (c.valor || 0), 0);
        const descuentoTienda = ventasCiclo.reduce((s, v) => s + (v.valorTotal || 0), 0);
        const estimadoNeto = gananciasBrutas - descuentoComida - descuentoTienda;
        const diasTrabajados = new Set(jornalesCiclo.map(j => j.fecha)).size;

        // Conversión a arrobas (1 arroba = 12.5 kg de café cereza aproximado)
        const arrobas = (kilosSemana / 12.5).toFixed(1);

        // Pago del ciclo activo: verificar si hay un pago registrado
        const pagoCiclo = cicloActivo
            ? todosPagos.find(p => p.cicloId === cicloActivo.id || (p.fechaInicio === fechaInicio && p.fechaFin === fechaFin))
            : null;
        const estadoPago = pagoCiclo ? 'liquidado' : 'pendiente';

        // Historial diario de la semana (agrupar por fecha)
        const historialPorDia = {};
        jornalesCiclo.forEach(j => {
            if (!historialPorDia[j.fecha]) {
                historialPorDia[j.fecha] = { kilos: 0, valor: 0, lotes: new Set() };
            }
            historialPorDia[j.fecha].kilos += j.kilosRecolectados || 0;
            
            // Recalcular valor del jornal si j.totalDia es cero para evitar discrepancias visuales
            const kilosJornal = j.kilosRecolectados || 0;
            const valorJornal = j.totalDia || (j.tipoPago === 'dia' ? (j.tarifaDia || 40000) : kilosJornal * precioKilo);
            historialPorDia[j.fecha].valor += valorJornal;
            
            if (j.loteId && ltMap[j.loteId]) historialPorDia[j.fecha].lotes.add(ltMap[j.loteId]);
        });

        // Ordenar días
        const diasOrdenados = Object.entries(historialPorDia)
            .sort((a, b) => a[0].localeCompare(b[0]));

        // Nombres de días en español
        const nombreDia = (fechaStr) => {
            const d = new Date(fechaStr + 'T12:00:00');
            return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' });
        };

        // Obtener nombre del usuario
        let userName = obrero.nombre;

        // Barra de progreso visual (meta semanal estimada: 500kg)
        const metaSemanal = 500;
        const pctMeta = Math.min((kilosSemana / metaSemanal) * 100, 100);

        // Saludo según la hora
        const hora = new Date().getHours();
        const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

        // Obtener el tema actual para pre-seleccionar la pestaña activa
        const currentTheme = typeof ThemeManager !== 'undefined' ? ThemeManager.getTheme() : 'cafe';

        app.innerHTML = `
            <style>
                .obrero-portal-container {
                    width: 100%;
                    max-width: 1000px;
                    margin: 0 auto;
                    padding: 0 16px 40px;
                }
                .obrero-grid-layout {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 20px;
                    margin-top: 10px;
                }
                @media (min-width: 768px) {
                    .obrero-grid-layout {
                        grid-template-columns: 1.1fr 0.9fr;
                        align-items: start;
                    }
                }
                .obrero-theme-option:hover {
                    background: var(--bg-surface-hover) !important;
                }
            </style>

            <div class="animate-in obrero-portal-container">

                <!-- Header con saludo, apariencia y logout -->
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; padding:20px 0 0">
                    <div style="display:flex; align-items:center; gap:14px">
                        <div style="width:52px; height:52px; border-radius:16px; background:linear-gradient(135deg, var(--color-primary) 0%, rgba(34,197,94,0.7) 100%); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:1.3rem; box-shadow:0 4px 16px rgba(34,197,94,0.3)">
                            ${userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div class="text-muted" style="font-size:0.8rem; font-weight:600">${saludo}</div>
                            <div style="font-size:1.2rem; font-weight:800; color:var(--text-main); line-height:1.2">${userName.split(' ')[0]}</div>
                        </div>
                    </div>
                    
                    <div style="display:flex; align-items:center; gap:10px; position:relative;">
                        <!-- Botón de Apariencia (Dropdown Trigger) -->
                        <div style="position:relative;">
                            <button onclick="MiRendimiento.toggleThemeDropdown(event)" style="background:rgba(200, 149, 108, 0.1); border:1px solid rgba(200, 149, 108, 0.2); border-radius:12px; padding:10px; cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--accent); transition:all 0.2s" title="Cambiar Apariencia">
                                <i data-lucide="palette" style="width:16px; height:16px"></i>
                            </button>
                            
                            <!-- Dropdown Flotante con Selector Estilo Pastilla Horizontal -->
                            <div id="obrero-theme-dropdown" class="card-premium hidden" style="position:absolute; right:0; top:calc(100% + 8px); width:310px; z-index:999; padding:12px; box-shadow: 0 10px 30px rgba(0,0,0,0.35); border:1px solid var(--border-color) !important; border-radius: 20px !important;">
                                <div style="font-size:0.75rem; font-weight:700; color:var(--text-muted); margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px; padding-left:4px">Tema Visual</div>
                                <div class="theme-switcher theme-switcher-mobile" style="width: 100%; display: flex; background: var(--bg-app); border: 1px solid var(--border-color); padding: 4px; border-radius: 9999px;">
                                    <button class="theme-btn ${currentTheme === 'cafe' ? 'active' : ''}" 
                                            onclick="MiRendimiento.selectTheme(event, 'cafe')" 
                                            style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 12px; border: none; background: none; color: var(--text-main); font-weight: 600; font-size: 0.8rem; cursor: pointer; border-radius: 9999px; transition: all 0.2s;"
                                            title="Tema Café Glass">
                                        <i data-lucide="coffee" style="width: 14px; height: 14px;"></i>
                                        Café
                                    </button>
                                    <button class="theme-btn ${currentTheme === 'light' ? 'active' : ''}" 
                                            onclick="MiRendimiento.selectTheme(event, 'light')" 
                                            style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 12px; border: none; background: none; color: var(--text-main); font-weight: 600; font-size: 0.8rem; cursor: pointer; border-radius: 9999px; transition: all 0.2s;"
                                            title="Tema Claro Premium">
                                        <i data-lucide="sun" style="width: 14px; height: 14px;"></i>
                                        Light
                                    </button>
                                    <button class="theme-btn ${currentTheme === 'dark' ? 'active' : ''}" 
                                            onclick="MiRendimiento.selectTheme(event, 'dark')" 
                                            style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 12px; border: none; background: none; color: var(--text-main); font-weight: 600; font-size: 0.8rem; cursor: pointer; border-radius: 9999px; transition: all 0.2s;"
                                            title="Tema Oscuro Premium">
                                        <i data-lucide="moon" style="width: 14px; height: 14px;"></i>
                                        Dark
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Botón de Salir -->
                        <button onclick="MiRendimiento.cerrarSesion()" style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.2); border-radius:12px; padding:10px 16px; cursor:pointer; display:flex; align-items:center; gap:6px; color:var(--color-danger); font-weight:700; font-size:0.85rem; transition:all 0.2s">
                            <i data-lucide="log-out" style="width:16px; height:16px"></i>
                            <span class="hide-mobile">Salir</span>
                        </button>
                    </div>
                </div>

                <!-- Ciclo activo badge -->
                <div class="card-premium" style="padding:12px 16px; margin-bottom:20px; display:flex; align-items:center; gap:12px; border:1px solid var(--color-primary); background:linear-gradient(135deg, var(--bg-surface) 0%, rgba(34,197,94,0.03) 100%)!important">
                    <div style="background:var(--color-primary); color:#fff; width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 3px 10px rgba(34,197,94,0.3)">
                        <i data-lucide="calendar-clock" style="width:18px; height:18px"></i>
                    </div>
                    <div style="flex:1">
                        <div style="font-weight:700; font-size:0.95rem; color:var(--text-main)">${nombreCiclo}</div>
                        <div class="text-muted" style="font-size:0.75rem">${cicloActivo ? this._formatFecha(fechaInicio) + ' → ' + this._formatFecha(fechaFin) : 'No hay semana productiva activa'}</div>
                    </div>
                    <div style="padding:4px 12px; border-radius:20px; font-size:0.7rem; font-weight:800; text-transform:uppercase; letter-spacing:0.05em; ${estadoPago === 'liquidado' ? 'background:rgba(34,197,94,0.15); color:var(--color-primary); border:1px solid rgba(34,197,94,0.3)' : 'background:rgba(245,158,11,0.15); color:#f59e0b; border:1px solid rgba(245,158,11,0.3)'}">
                        ${estadoPago === 'liquidado' ? 'Liquidado' : 'Pendiente'}
                    </div>
                </div>

                <div class="obrero-grid-layout">
                    <!-- COLUMNA IZQUIERDA: KPIs Principales y Desglose -->
                    <div>
                        <!-- KPIs principales -->
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px">
                            <div class="card-premium" style="padding:20px; text-align:center; border:1px solid rgba(34,197,94,0.15)">
                                <div style="background:rgba(34,197,94,0.1); border-radius:12px; width:44px; height:44px; display:flex; align-items:center; justify-content:center; margin:0 auto 12px">
                                    <i data-lucide="scale" style="width:22px; height:22px; color:var(--color-primary)"></i>
                                </div>
                                <div class="tabular-data" style="font-size:1.8rem; font-weight:900; color:var(--text-main); line-height:1">${kilosSemana.toLocaleString()}</div>
                                <div class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:700; margin-top:4px">Kilos Semana</div>
                                <div class="text-muted" style="font-size:0.7rem; margin-top:2px">${arrobas} arrobas</div>
                            </div>

                            <div class="card-premium" style="padding:20px; text-align:center; border:1px solid rgba(34,197,94,0.15)">
                                <div style="background:rgba(34,197,94,0.1); border-radius:12px; width:44px; height:44px; display:flex; align-items:center; justify-content:center; margin:0 auto 12px">
                                    <i data-lucide="banknote" style="width:22px; height:22px; color:var(--color-primary)"></i>
                                </div>
                                <div class="tabular-data" style="font-size:1.8rem; font-weight:900; color:var(--color-primary); line-height:1">$${gananciasBrutas.toLocaleString()}</div>
                                <div class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:700; margin-top:4px">Ganancia Bruta</div>
                                <div class="text-muted" style="font-size:0.7rem; margin-top:2px">${diasTrabajados} días trabajados</div>
                            </div>
                        </div>

                        <!-- Desglose financiero -->
                        <div class="card-premium" style="padding:16px; margin-bottom:20px; border:1px solid var(--border-color)">
                            <div style="display:flex; align-items:center; gap:8px; margin-bottom:16px">
                                <i data-lucide="receipt" style="width:18px; height:18px; color:var(--text-muted)"></i>
                                <span style="font-weight:700; font-size:0.85rem; text-transform:uppercase; color:var(--text-muted)">Desglose Semanal</span>
                            </div>

                            <div style="display:flex; flex-direction:column; gap:12px">
                                <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:var(--bg-app); border-radius:10px">
                                    <div style="display:flex; align-items:center; gap:8px">
                                        <i data-lucide="trending-up" style="width:16px; height:16px; color:var(--color-primary)"></i>
                                        <span style="font-size:0.9rem; font-weight:600; color:var(--text-main)">Producción</span>
                                    </div>
                                    <span class="tabular-data" style="font-weight:800; color:var(--color-primary)">+$${gananciasBrutas.toLocaleString()}</span>
                                </div>

                                <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:var(--bg-app); border-radius:10px">
                                    <div style="display:flex; align-items:center; gap:8px">
                                        <i data-lucide="utensils" style="width:16px; height:16px; color:var(--color-danger)"></i>
                                        <span style="font-size:0.9rem; font-weight:600; color:var(--text-main)">Comida</span>
                                    </div>
                                    <span class="tabular-data" style="font-weight:800; color:var(--color-danger)">-$${descuentoComida.toLocaleString()}</span>
                                </div>

                                <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:var(--bg-app); border-radius:10px">
                                    <div style="display:flex; align-items:center; gap:8px">
                                        <i data-lucide="shopping-cart" style="width:16px; height:16px; color:#f59e0b"></i>
                                        <span style="font-size:0.9rem; font-weight:600; color:var(--text-main)">Tienda</span>
                                    </div>
                                    <span class="tabular-data" style="font-weight:800; color:#f59e0b">-$${descuentoTienda.toLocaleString()}</span>
                                </div>

                                <div style="border-top:2px dashed var(--border-color); padding-top:12px; display:flex; justify-content:space-between; align-items:center">
                                    <span style="font-weight:800; font-size:1rem; color:var(--text-main)">Estimado Neto</span>
                                    <span class="tabular-data" style="font-size:1.3rem; font-weight:900; ${estimadoNeto >= 0 ? 'color:var(--color-primary)' : 'color:var(--color-danger)'}">$${estimadoNeto.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- COLUMNA DERECHA: Meta, Detalle Diario y Liquidación -->
                    <div>
                        <!-- Barra de progreso de meta -->
                        <div class="card-premium" style="padding:16px; margin-bottom:20px">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px">
                                <div style="display:flex; align-items:center; gap:8px">
                                    <i data-lucide="target" style="width:16px; height:16px; color:var(--text-muted)"></i>
                                    <span style="font-weight:700; font-size:0.85rem; text-transform:uppercase; color:var(--text-muted)">Meta Semanal</span>
                                </div>
                                <span class="tabular-data" style="font-weight:700; font-size:0.85rem; color:var(--text-main)">${kilosSemana}/${metaSemanal} kg</span>
                            </div>
                            <div style="height:10px; background:var(--bg-app); border-radius:10px; overflow:hidden; border:1px solid var(--border-color)">
                                <div style="height:100%; width:${pctMeta}%; background:linear-gradient(90deg, var(--color-primary), rgba(34,197,94,0.7)); border-radius:10px; transition:width 0.8s cubic-bezier(0.4,0,0.2,1)"></div>
                            </div>
                            <div class="text-muted" style="font-size:0.75rem; margin-top:6px; text-align:center">${pctMeta >= 100 ? 'Meta alcanzada — ¡Excelente trabajo!' : `${Math.round(pctMeta)}% completado`}</div>
                        </div>

                        <!-- Historial diario -->
                        <div class="card-premium" style="padding:0; overflow:hidden; margin-bottom:20px">
                            <div style="padding:16px; background:var(--bg-surface-hover); border-bottom:1px solid var(--border-color); display:flex; align-items:center; gap:8px">
                                <i data-lucide="calendar-days" style="width:18px; height:18px; color:var(--text-muted)"></i>
                                <span style="font-weight:700; font-size:0.85rem; text-transform:uppercase">Detalle Diario</span>
                            </div>

                            ${diasOrdenados.length === 0 ? `
                                <div style="padding:40px 20px; text-align:center; color:var(--text-muted)">
                                    <i data-lucide="inbox" style="width:40px; height:40px; opacity:0.2; display:block; margin:0 auto 12px"></i>
                                    <p style="font-weight:600">Sin registros esta semana</p>
                                    <p style="font-size:0.8rem">Los jornales aparecerán aquí cuando el administrador los registre.</p>
                                </div>
                            ` : `
                                <div style="display:flex; flex-direction:column">
                                    ${diasOrdenados.map(([fecha, data], i) => {
                                        const maxKilosDia = Math.max(...diasOrdenados.map(([, d]) => d.kilos), 1);
                                        const pctDia = (data.kilos / maxKilosDia) * 100;
                                        const lotesStr = [...data.lotes].join(', ');
                                        return `
                                            <div style="padding:14px 16px; border-bottom:1px solid var(--border-color); display:flex; align-items:center; gap:14px; ${i % 2 === 0 ? '' : 'background:var(--bg-app)'}">
                                                <div style="min-width:90px">
                                                    <div style="font-weight:700; font-size:0.85rem; color:var(--text-main); text-transform:capitalize">${nombreDia(fecha).split(',')[0]}</div>
                                                    <div class="text-muted" style="font-size:0.7rem">${this._formatFecha(fecha)}</div>
                                                </div>
                                                <div style="flex:1">
                                                    <div style="display:flex; justify-content:space-between; margin-bottom:4px">
                                                        <span class="tabular-data" style="font-weight:700; font-size:0.9rem; color:var(--text-main)">${data.kilos.toLocaleString()} kg</span>
                                                        <span class="tabular-data" style="font-weight:700; font-size:0.9rem; color:var(--color-primary)">$${data.valor.toLocaleString()}</span>
                                                    </div>
                                                    <div style="height:5px; background:var(--bg-surface-hover); border-radius:5px; overflow:hidden">
                                                        <div style="height:100%; width:${pctDia}%; background:var(--color-primary); border-radius:5px"></div>
                                                    </div>
                                                    ${lotesStr ? `<div class="text-muted" style="font-size:0.7rem; margin-top:3px"><i data-lucide="map-pin" style="width:10px;height:10px;display:inline-block;vertical-align:middle"></i> ${lotesStr}</div>` : ''}
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            `}
                        </div>

                        ${pagoCiclo ? `
                            <!-- Detalle de liquidación -->
                            <div class="card-premium" style="padding:16px; border:1px solid var(--color-primary); background:linear-gradient(135deg, var(--bg-surface) 0%, rgba(34,197,94,0.05) 100%)!important">
                                <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px">
                                    <div style="background:var(--color-primary); color:#fff; width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center">
                                        <i data-lucide="check-circle" style="width:20px; height:20px"></i>
                                    </div>
                                    <div>
                                        <div style="font-weight:700; color:var(--text-main); font-size:0.95rem">Semana Liquidada</div>
                                        <div class="text-muted" style="font-size:0.75rem">Pago procesado por la administración</div>
                                    </div>
                                </div>
                                <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:var(--bg-app); border-radius:10px">
                                    <span style="font-weight:700; color:var(--text-main)">Neto Pagado</span>
                                    <span class="tabular-data" style="font-size:1.3rem; font-weight:900; color:var(--color-primary)">$${(pagoCiclo.netoAPagar || 0).toLocaleString()}</span>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Footer -->
                <div style="text-align:center; margin-top:32px; padding:16px">
                    <div style="display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:8px">
                        <i data-lucide="coffee" style="width:16px; height:16px; color:var(--text-muted); opacity:0.5"></i>
                        <span class="text-muted" style="font-size:0.75rem; font-weight:600">CaféControl</span>
                    </div>
                    <p class="text-muted" style="font-size:0.7rem; opacity:0.6">Portal del Trabajador · Temporada 2026</p>
                </div>
            </div>
        `;
        
        // Registrar detector de clicks externos para cerrar el dropdown de apariencia
        document.removeEventListener('click', MiRendimiento._closeDropdownOutside);
        document.addEventListener('click', MiRendimiento._closeDropdownOutside);

        if (window.lucide) window.lucide.createIcons();
    },

    /** Formatea fecha YYYY-MM-DD a formato legible */
    _formatFecha(fechaStr) {
        if (!fechaStr) return '';
        const d = new Date(fechaStr + 'T12:00:00');
        return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
    },

    /** Cerrar sesión y volver al login */
    cerrarSesion() {
        if (typeof App !== 'undefined' && typeof App.confirm === 'function') {
            App.confirm({
                title: '¿Cerrar sesión?',
                message: 'Vas a salir de tu cuenta de CaféControl.',
                confirmText: 'Salir',
                cancelText: 'Cancelar',
                icon: '👋',
                onConfirm: () => {
                    try {
                        sessionStorage.removeItem('cafecontrol_auth');
                        sessionStorage.removeItem('cafecontrol_user');
                    } catch (e) {}
                    location.reload();
                }
            });
        } else {
            try {
                sessionStorage.removeItem('cafecontrol_auth');
                sessionStorage.removeItem('cafecontrol_user');
            } catch (e) {}
            location.reload();
        }
    },

    toggleThemeDropdown(e) {
        e.stopPropagation();
        const dd = document.getElementById('obrero-theme-dropdown');
        if (dd) {
            dd.classList.toggle('hidden');
        }
    },

    selectTheme(e, themeId) {
        e.stopPropagation();
        if (typeof ThemeManager !== 'undefined') {
            ThemeManager.setTheme(themeId);
        }
        const dd = document.getElementById('obrero-theme-dropdown');
        if (dd) {
            dd.classList.add('hidden');
        }
    },

    _closeDropdownOutside(e) {
        const dd = document.getElementById('obrero-theme-dropdown');
        if (dd && !dd.classList.contains('hidden')) {
            const trigger = dd.previousElementSibling;
            if (!dd.contains(e.target) && !trigger.contains(e.target)) {
                dd.classList.add('hidden');
            }
        }
    }
};
