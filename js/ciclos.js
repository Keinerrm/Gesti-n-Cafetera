/* ============================================
   ciclos.js — Períodos Semanales
   Lunes → Domingo (configurable)
   ============================================ */

const Ciclos = {

    // --- Utility functions (used by db.js too) ---

    calcularInicioSemana(fecha, diaInicio = 1) {
        // diaInicio: 0=domingo, 1=lunes, 2=martes...6=sabado
        const d = new Date(fecha);
        const dia = d.getDay(); // 0=dom, 1=lun...6=sab
        const diff = (dia - diaInicio + 7) % 7;
        d.setDate(d.getDate() - diff);
        d.setHours(0, 0, 0, 0);
        return d;
    },

    getNumeroSemana(fecha) {
        const d = new Date(fecha);
        const start = new Date(d.getFullYear(), 0, 1);
        const diff = d - start;
        return Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
    },

    formatFecha(fechaStr) {
        const d = new Date(fechaStr + 'T12:00:00');
        return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
    },

    diasRestantes(fechaFin) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fin = new Date(fechaFin + 'T23:59:59');
        const diff = Math.ceil((fin - hoy) / 86400000);
        return Math.max(0, diff);
    },

    // --- Main render ---

    async render() {
        const app = document.getElementById('app');
        const fincaId = db.getFincaActiva();
        const cicloActivo = await db.getCicloActivo();
        const allCiclos = (await db.getByFinca('ciclos'))
            .filter(c => c.fincaId === fincaId)
            .sort((a, b) => b.fechaInicio.localeCompare(a.fechaInicio));

        const cerrados = allCiclos.filter(c => !c.activo);
        const diaCorte = await db.getConfig('diaCorte', 1);
        const diasNombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

        // Stats del ciclo activo
        let statsActivo = { kilos: 0, jornales: 0, comida: 0, ventas: 0, pagado: 0 };
        if (cicloActivo) {
            statsActivo = await Ciclos.getStatsCiclo(cicloActivo);
        }

        app.innerHTML = `
            <div class="animate-in">
                <div class="header-premium" style="margin-bottom:24px">
                    <div class="header-icon" style="background:rgba(234, 88, 12, 0.1); color:var(--color-warning)"><i data-lucide="calendar"></i></div>
                    <div>
                        <h2>Ciclos Semanales</h2>
                        <p>Inicia: ${diasNombres[diaCorte]} / Finaliza: ${diasNombres[(diaCorte + 6) % 7]}</p>
                    </div>
                </div>

                ${cicloActivo ? `
                    <!-- Ciclo activo -->
                    <div class="card-premium mb-2" style="border: 2px solid var(--color-primary)">
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; margin-bottom:16px">
                            <div>
                                <span class="badge" style="background:var(--color-primary); color:#fff; border-radius:12px; font-weight:700; font-size:0.7rem; padding:4px 8px; letter-spacing:1px">SEMANA ACTIVA</span>
                                <h3 style="margin:8px 0 0; color:var(--text-main); font-size:1.3rem">${cicloActivo.nombre}</h3>
                                <p class="text-muted tabular-data" style="margin:4px 0 0; font-size:0.9rem">
                                    <i data-lucide="clock" style="width:14px;height:14px;vertical-align:-2px"></i> 
                                    ${Ciclos.formatFecha(cicloActivo.fechaInicio)} → ${Ciclos.formatFecha(cicloActivo.fechaFin)}
                                    &nbsp;·&nbsp;
                                    <strong style="color:var(--text-main)">${Ciclos.diasRestantes(cicloActivo.fechaFin)}</strong> días restantes
                                </p>
                            </div>
                            <button class="btn-premium primary" style="background:var(--color-danger); border:none; color:#fff" onclick="Ciclos.cerrarCiclo()">
                                <i data-lucide="lock"></i> Cerrar Semana
                            </button>
                        </div>

                        <div class="grid-4 mt-2">
                            <div class="stat-card" style="background:var(--bg-app)!important; border:1px solid var(--border-color)!important">
                                <div class="stat-label">Producción</div>
                                <div class="stat-value tabular-data" style="color:var(--color-primary)">${statsActivo.kilos.toLocaleString()} kg</div>
                            </div>
                            <div class="stat-card" style="background:var(--bg-app)!important; border:1px solid var(--border-color)!important">
                                <div class="stat-label">Jornales</div>
                                <div class="stat-value tabular-data">${statsActivo.jornales}</div>
                            </div>
                            <div class="stat-card" style="background:var(--bg-app)!important; border:1px solid var(--border-color)!important">
                                <div class="stat-label">Gastos Comida</div>
                                <div class="stat-value tabular-data" style="color:var(--color-danger)">$${statsActivo.comida.toLocaleString()}</div>
                            </div>
                            <div class="stat-card" style="background:var(--bg-app)!important; border:1px solid var(--border-color)!important">
                                <div class="stat-label">Liq. Estimada</div>
                                <div class="stat-value tabular-data" style="color:var(--text-main)">$${(statsActivo.pagado || (statsActivo.kilos * await db.getConfig('tarifaKilo', 500))).toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                ` : `
                    <div class="empty-state card-premium">
                        <i data-lucide="calendar-x" style="width:48px;height:48px;opacity:0.2;margin:0 auto 16px;display:block"></i>
                        <h3>No hay ciclo activo</h3>
                        <p class="text-muted mb-2">Presiona abajo para aperturar la semana laborable.</p>
                        <button class="btn-premium primary" onclick="Ciclos.crearNuevoCiclo()"><i data-lucide="plus"></i> Crear Semana</button>
                    </div>
                `}

                <!-- Historial -->
                ${cerrados.length > 0 ? `
                    <div class="header-premium" style="margin-top:24px; margin-bottom:16px;">
                        <div class="header-icon" style="background:var(--bg-surface-hover); color:var(--text-main)"><i data-lucide="archive"></i></div>
                        <div>
                            <h3 style="margin:0; font-size:1.1rem">Historial de Cierres</h3>
                        </div>
                    </div>
                    <div class="card-premium table-wrapper" style="padding:0; overflow:hidden">
                        <table style="width:100%; border-collapse:collapse">
                            <thead style="background:var(--bg-surface-hover); color:var(--text-muted); text-transform:uppercase; font-size:0.75rem; font-weight:700">
                                <tr>
                                    <th style="padding:16px; text-align:left; border-bottom:1px solid var(--border-color)">Semana</th>
                                    <th style="padding:16px; text-align:left; border-bottom:1px solid var(--border-color)">Período</th>
                                    <th style="padding:16px; text-align:right; border-bottom:1px solid var(--border-color)">Kilos</th>
                                    <th style="padding:16px; text-align:right; border-bottom:1px solid var(--border-color)">Pagado</th>
                                    <th style="padding:16px; text-align:center; border-bottom:1px solid var(--border-color)"></th>
                                </tr>
                            </thead>
                            <tbody class="tabular-data">
                                ${cerrados.map(c => `
                                    <tr style="border-bottom:1px solid var(--border-color)">
                                        <td style="padding:12px 16px"><strong>${c.nombre}</strong></td>
                                        <td style="padding:12px 16px; color:var(--text-muted)">${Ciclos.formatFecha(c.fechaInicio)} → ${Ciclos.formatFecha(c.fechaFin)}</td>
                                        <td style="padding:12px 16px; text-align:right; color:var(--color-primary); font-weight:600">${(c.totalKilos || 0).toLocaleString()} kg</td>
                                        <td style="padding:12px 16px; text-align:right; font-weight:700">$${(c.totalPagado || 0).toLocaleString()}</td>
                                        <td style="padding:12px 16px; text-align:center">
                                            <button class="btn-icon" style="padding:4px; font-size:0.8rem; border-radius:4px" onclick="Ciclos.verDetalle(${c.id})"><i data-lucide="eye"></i></button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : `
                    <div class="text-center text-muted" style="margin-top:32px; opacity:0.5">
                        <i data-lucide="inbox" style="width:32px;height:32px;margin-bottom:8px"></i><br>
                        No hay semanas cerradas en el historial.
                    </div>
                `}
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    },

    // --- Seguridad: Bloqueo de Fechas (Semana Hermética) ---

    async isDateLocked(dateStr) {
        if (!dateStr) return false;
        const fincaId = db.getFincaActiva();
        const ciclos = await db.getByFinca('ciclos');

        // Verifica si la fecha cae en un ciclo de esta finca que ya esté cerrado (!activo)
        const closedCiclo = ciclos.find(c =>
            c.fincaId === fincaId && !c.activo && dateStr >= c.fechaInicio && dateStr <= c.fechaFin
        );
        return closedCiclo || false;
    },

    // --- Get stats for a ciclo ---

    async getStatsCiclo(ciclo) {
        const allJornales = await db.getByFinca('jornales');
        const allComida = await db.getByFinca('comida');
        const allVentas = await db.getByFinca('ventasCaja');
        const allPagos = await db.getByFinca('pagos');

        // Filter by date range of the ciclo
        const jornales = allJornales.filter(j =>
            j.fecha >= ciclo.fechaInicio && j.fecha <= ciclo.fechaFin
        );
        const comidas = allComida.filter(c =>
            c.fecha >= ciclo.fechaInicio && c.fecha <= ciclo.fechaFin
        );
        const ventas = allVentas.filter(v =>
            v.fecha >= ciclo.fechaInicio && v.fecha <= ciclo.fechaFin
        );
        const pagos = allPagos.filter(p =>
            p.fechaPago >= ciclo.fechaInicio && p.fechaPago <= ciclo.fechaFin
        );

        return {
            kilos: jornales.reduce((s, j) => s + (j.kilosRecolectados || 0), 0),
            jornales: jornales.length,
            comida: comidas.reduce((s, c) => s + (c.valor || 0), 0),
            ventas: ventas.reduce((s, v) => s + (v.valorTotal || 0), 0),
            pagado: pagos.reduce((s, p) => s + (p.netoAPagar || 0), 0)
        };
    },

    // --- Cerrar ciclo — modal con resumen y liquidación ---

    async cerrarCiclo() {
        const ciclo = await db.getCicloActivo();
        if (!ciclo) return App.toast('No hay ciclo activo', 'error');

        // Get all data for the cycle
        const obreros = (await db.getByFinca('obreros')).filter(o => o.estado === 'activo');
        const jornales = (await db.getByFinca('jornales')).filter(j =>
            j.fecha >= ciclo.fechaInicio && j.fecha <= ciclo.fechaFin
        );
        const comidas = (await db.getByFinca('comida')).filter(c =>
            c.fecha >= ciclo.fechaInicio && c.fecha <= ciclo.fechaFin
        );
        const ventasFiado = (await db.getByFinca('ventasCaja')).filter(v =>
            v.fecha >= ciclo.fechaInicio && v.fecha <= ciclo.fechaFin && v.fiado && !v.pagado
        );

        const tarifaKilo = await db.getConfig('tarifaKilo', 500);
        const tarifaDia = await db.getConfig('tarifaDia', 40000);

        // Calculate per-obrero summary
        const resumen = obreros.map(o => {
            const jOb = jornales.filter(j => j.obreroId === o.id);
            const kilos = jOb.reduce((s, j) => s + (j.kilosRecolectados || 0), 0);
            const ganado = jOb.reduce((s, j) => s + (j.totalDia || 0), 0);
            const comida = comidas.filter(c => c.obreroId === o.id).reduce((s, c) => s + (c.valor || 0), 0);
            const fiado = ventasFiado.filter(v => v.obreroId === o.id).reduce((s, v) => s + (v.valorTotal || 0), 0);
            const neto = ganado - comida - fiado;
            return { ...o, kilos, ganado, comida, fiado, neto, dias: jOb.length };
        }).filter(o => o.dias > 0 || o.comida > 0 || o.fiado > 0);

        const totalKilos = resumen.reduce((s, o) => s + o.kilos, 0);
        const totalGanado = resumen.reduce((s, o) => s + o.ganado, 0);
        const totalComida = resumen.reduce((s, o) => s + o.comida, 0);
        const totalFiado = resumen.reduce((s, o) => s + o.fiado, 0);
        const totalNeto = resumen.reduce((s, o) => s + o.neto, 0);

        const html = `
            <div class="modal-system-overlay" onclick="Ciclos.closeModal(event)">
                <div class="modal-system" style="max-width:800px; padding:24px" onclick="event.stopPropagation()">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                        <h3 style="margin:0; font-size:1.3rem; display:flex; align-items:center; gap:8px"><i data-lucide="lock" style="color:var(--color-danger)"></i> Cerrar ${ciclo.nombre}</h3>
                        <button class="btn-icon" onclick="Ciclos.closeModal()"><i data-lucide="x"></i></button>
                    </div>

                    <p class="text-muted mb-2 tabular-data">
                        ${Ciclos.formatFecha(ciclo.fechaInicio)} → ${Ciclos.formatFecha(ciclo.fechaFin)}
                    </p>

                    <!-- Resumen general -->
                    <div class="grid-4 mb-2 tabular-data" style="gap:12px">
                        <div class="stat-card" style="background:var(--bg-app)!important; padding:12px">
                            <div class="stat-label">Producción Neta</div>
                            <div class="stat-value text-primary" style="font-size:1.2rem">${totalKilos.toLocaleString()} kg</div>
                        </div>
                        <div class="stat-card" style="background:var(--bg-app)!important; padding:12px">
                            <div class="stat-label">Restar Desayuno/Alm.</div>
                            <div class="stat-value text-danger" style="font-size:1.2rem">-$${totalComida.toLocaleString()}</div>
                        </div>
                        <div class="stat-card" style="background:var(--bg-app)!important; padding:12px">
                            <div class="stat-label">Restar Cuentas de Tienda</div>
                            <div class="stat-value text-danger" style="font-size:1.2rem">-$${totalFiado.toLocaleString()}</div>
                        </div>
                        <div class="stat-card" style="background:var(--bg-surface-hover)!important; padding:12px; border:1px solid var(--color-primary)">
                            <div class="stat-label">Deuda Operativa Total</div>
                            <div class="stat-value text-main" style="font-size:1.3rem">$${totalNeto.toLocaleString()}</div>
                        </div>
                    </div>

                    <!-- Detalle por obrero -->
                    ${resumen.length > 0 ? `
                        <p style="font-weight:700; margin:16px 0 8px"><i data-lucide="users" style="width:16px;height:16px;vertical-align:-3px;margin-right:4px"></i> Desglose Obrero a Obrero</p>
                        <div class="table-wrapper card-premium" style="max-height:280px; overflow-y:auto; padding:0">
                            <table style="width:100%; border-collapse:collapse">
                                <thead style="background:var(--bg-app); position:sticky; top:0">
                                    <tr style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase">
                                        <th style="padding:12px; text-align:left; border-bottom:1px solid var(--border-color)">Obrero</th>
                                        <th style="padding:12px; text-align:center; border-bottom:1px solid var(--border-color)">Días</th>
                                        <th style="padding:12px; text-align:right; border-bottom:1px solid var(--border-color)">Kilos</th>
                                        <th style="padding:12px; text-align:right; border-bottom:1px solid var(--border-color)">+ Ganado</th>
                                        <th style="padding:12px; text-align:right; border-bottom:1px solid var(--border-color)">- Comida</th>
                                        <th style="padding:12px; text-align:right; border-bottom:1px solid var(--border-color)">- Tienda</th>
                                        <th style="padding:12px; text-align:right; border-bottom:1px solid var(--border-color)">= Neto a Pagar</th>
                                    </tr>
                                </thead>
                                <tbody class="tabular-data">
                                    ${resumen.map(o => `
                                        <tr style="border-bottom:1px solid var(--border-color); ${o.neto < 0 ? 'background:rgba(239,68,68,0.05)' : ''}">
                                            <td style="padding:10px 12px"><strong>${o.nombre}</strong></td>
                                            <td style="padding:10px 12px; text-align:center">${o.dias}</td>
                                            <td style="padding:10px 12px; text-align:right">${o.kilos.toLocaleString()}</td>
                                            <td style="padding:10px 12px; text-align:right">$${o.ganado.toLocaleString()}</td>
                                            <td style="padding:10px 12px; text-align:right; color:var(--color-danger)">-$${o.comida.toLocaleString()}</td>
                                            <td style="padding:10px 12px; text-align:right; color:var(--color-danger)">-$${o.fiado.toLocaleString()}</td>
                                            <td style="padding:10px 12px; text-align:right; font-weight:700; color:${o.neto >= 0 ? 'var(--text-main)' : 'var(--color-danger)'}">$${o.neto.toLocaleString()}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : '<div class="text-center text-muted" style="padding:32px 0"><i data-lucide="ghost" style="width:32px;height:32px;opacity:0.2;margin-bottom:8px"></i><br>Sin actividad registrada en la semana para liquidar.</div>'}

                    <div style="display:flex; gap:12px; margin-top:24px">
                        <button class="btn-premium primary flex-1" style="background:var(--color-danger); border:none; color:#fff" onclick="Ciclos.cerrarYLiquidar()">
                            <i data-lucide="check-square"></i> Confirmar Clausura y Liquidar Todo
                        </button>
                        <button class="btn-premium secondary flex-1" onclick="Ciclos._ejecutarCierre(false)">
                            <i data-lucide="archive"></i> Solo Clausurar Semana sin Pagar
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
        if (window.lucide) window.lucide.createIcons();
    },

    async cerrarYLiquidar() {
        await Ciclos._ejecutarCierre(true);
    },

    async _ejecutarCierre(liquidar) {
        Ciclos.closeModal();
        const ciclo = await db.getCicloActivo();
        if (!ciclo) return;

        const fincaId = db.getFincaActiva();

        if (liquidar) {
            // Auto-liquidar cada obrero
            const obreros = (await db.getByFinca('obreros')).filter(o => o.estado === 'activo');
            const jornales = (await db.getByFinca('jornales')).filter(j =>
                j.fecha >= ciclo.fechaInicio && j.fecha <= ciclo.fechaFin
            );
            const comidas = (await db.getByFinca('comida')).filter(c =>
                c.fecha >= ciclo.fechaInicio && c.fecha <= ciclo.fechaFin
            );
            const ventasFiado = (await db.getByFinca('ventasCaja')).filter(v =>
                v.fecha >= ciclo.fechaInicio && v.fecha <= ciclo.fechaFin && v.fiado && !v.pagado
            );

            let pagosCreados = 0;

            for (const obrero of obreros) {
                const jOb = jornales.filter(j => j.obreroId === obrero.id);
                if (jOb.length === 0) continue;

                const ganado = jOb.reduce((s, j) => s + (j.totalDia || 0), 0);
                const comida = comidas.filter(c => c.obreroId === obrero.id).reduce((s, c) => s + (c.valor || 0), 0);
                const fiado = ventasFiado.filter(v => v.obreroId === obrero.id).reduce((s, v) => s + (v.valorTotal || 0), 0);
                const neto = ganado - comida - fiado;

                // Create pago
                await db.add('pagos', {
                    obreroId: obrero.id,
                    fechaInicio: ciclo.fechaInicio,
                    fechaFin: ciclo.fechaFin,
                    totalGanado: ganado,
                    descComida: comida,
                    descCaja: fiado,
                    netoAPagar: neto,
                    fiadoDescontado: true,
                    fechaPago: new Date().toLocaleDateString('en-CA'),
                    fincaId,
                    cicloId: ciclo.id
                });
                pagosCreados++;

                // Mark fiado as paid
                const ventasObrero = ventasFiado.filter(v => v.obreroId === obrero.id);
                for (const v of ventasObrero) {
                    v.pagado = true;
                    v.fechaPago = new Date().toLocaleDateString('en-CA');
                    await db.put('ventasCaja', v);
                }
            }

            App.toast(`✅ ${pagosCreados} liquidaciones generadas`, 'success');
        }

        // Calculate final stats
        const stats = await Ciclos.getStatsCiclo(ciclo);

        // Obtener Total de Trabajadores en nómina real
        const workersInvolved = (await db.getByFinca('pagos')).filter(p => p.cicloId === ciclo.id).length || 0;

        // Close current cycle
        ciclo.activo = false;
        ciclo.totalKilos = stats.kilos;
        ciclo.totalPagado = liquidar ? stats.pagado + stats.kilos : stats.pagado; // recalc if liquidated
        ciclo.totalComida = stats.comida;
        ciclo.totalVentas = stats.ventas;
        ciclo.totalJornales = stats.jornales;
        await db.put('ciclos', ciclo);

        // Guardar Copia en Historial de Estadísticas del Ciclo
        await db.add('cycle_stats', {
            cycle_id: ciclo.id,
            week_name: ciclo.nombre,
            start_date: ciclo.fechaInicio,
            end_date: ciclo.fechaFin,
            total_kilos: stats.kilos,
            total_payroll: ciclo.totalPagado,
            total_meals: stats.comida,
            total_store_debts: stats.ventas,
            workers_count: workersInvolved,
            created_at: new Date().toISOString()
        });

        // Recalculate pagos total after liquidation
        if (liquidar) {
            const pagosActualizados = (await db.getByFinca('pagos')).filter(p =>
                p.fechaPago >= ciclo.fechaInicio && p.fechaPago <= ciclo.fechaFin
            );
            ciclo.totalPagado = pagosActualizados.reduce((s, p) => s + (p.netoAPagar || 0), 0);
            await db.put('ciclos', ciclo);
        }

        // Create new cycle
        await Ciclos.crearNuevoCiclo();

        // Store cicloId for PDF (before re-render)
        const closedCicloId = ciclo.id;

        App.toast(`"${ciclo.nombre}" cerrada — ${stats.kilos.toLocaleString()} kg`, 'success');

        // Ejecutar flush Seguro del DOM
        App.refreshUI();

        // Show success modal with PDF download option (only if liquidated)
        if (liquidar) {
            const html = `
                <div class="modal-overlay" onclick="Ciclos.closeModal(event)">
                    <div class="modal" onclick="event.stopPropagation()">
                        <div class="modal-header">
                            <h3>✅ Liquidación completada</h3>
                            <button class="btn-icon" onclick="Ciclos.closeModal()">&times;</button>
                        </div>
                        <p class="text-muted mb-2">${ciclo.nombre} cerrada exitosamente</p>
                        <div class="stat-card mb-2" style="text-align:center">
                            <div class="stat-label">Total pagado</div>
                            <div class="stat-value text-green" style="font-size:1.5rem">$${ciclo.totalPagado.toLocaleString()}</div>
                        </div>
                        <button class="btn btn-primary btn-block mb-1" onclick="PDF.generarRecibosCiclo(${closedCicloId}); Ciclos.closeModal()">
                            📄 Descargar Todos los Recibos (PDF)
                        </button>
                        <button class="btn btn-secondary btn-block" onclick="Ciclos.closeModal(); Ciclos.render()">
                            Continuar
                        </button>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', html);
        }
    },

    async crearNuevoCiclo() {
        const diaCorte = await db.getConfig('diaCorte', 1);
        const fincaId = db.getFincaActiva();

        // Find the next cycle start
        const hoy = new Date();
        const inicio = Ciclos.calcularInicioSemana(hoy, diaCorte);

        // If today is not the start day, start from next occurrence
        if (inicio < hoy) {
            const todayDay = hoy.getDay();
            if (todayDay !== diaCorte) {
                inicio.setDate(inicio.getDate() + 7);
            }
        }

        // Check: if we just closed a cycle, start the new one from day after the closed one
        const allCiclos = (await db.getByFinca('ciclos')).filter(c => c.fincaId === fincaId && !c.activo);
        if (allCiclos.length > 0) {
            allCiclos.sort((a, b) => b.fechaFin.localeCompare(a.fechaFin));
            const lastClosed = allCiclos[0];
            const nextDay = new Date(lastClosed.fechaFin + 'T12:00:00');
            nextDay.setDate(nextDay.getDate() + 1);

            // Use next day as start if it's after our calculated start
            if (nextDay > inicio) {
                inicio.setTime(nextDay.getTime());
            }
        }

        const fin = new Date(inicio);
        fin.setDate(fin.getDate() + 6);

        const numSemana = Ciclos.getNumeroSemana(inicio);

        await db.add('ciclos', {
            fincaId,
            nombre: `Semana ${numSemana} `,
            fechaInicio: inicio.toLocaleDateString('en-CA'),
            fechaFin: fin.toLocaleDateString('en-CA'),
            activo: true,
            totalKilos: 0,
            totalPagado: 0
        });
    },

    // --- Ver detalle de ciclo cerrado ---

    async verDetalle(id) {
        const ciclo = await db.get('ciclos', id);
        if (!ciclo) return;

        const stats = await Ciclos.getStatsCiclo(ciclo);

        const html = `
                <div class="modal-system-overlay" onclick="Ciclos.closeModal(event)">
                    <div class="modal-system" onclick="event.stopPropagation()">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                            <h3 style="margin:0; display:flex; align-items:center; gap:8px"><i data-lucide="archive"></i> ${ciclo.nombre}</h3>
                            <button class="btn-icon" onclick="Ciclos.closeModal()"><i data-lucide="x"></i></button>
                        </div>

                        <p class="text-muted mb-2 tabular-data">
                            ${Ciclos.formatFecha(ciclo.fechaInicio)} → ${Ciclos.formatFecha(ciclo.fechaFin)}
                        </p>

                        <div class="grid-2 mb-2 tabular-data">
                            <div class="stat-card" style="background:var(--bg-app)!important; border:1px solid var(--border-color)">
                                <div class="stat-label">Café recolectado</div>
                                <div class="stat-value text-primary">${stats.kilos.toLocaleString()} kg</div>
                            </div>
                            <div class="stat-card" style="background:var(--bg-app)!important; border:1px solid var(--border-color)">
                                <div class="stat-label">Nómica/Jornales</div>
                                <div class="stat-value">${stats.jornales}</div>
                            </div>
                            <div class="stat-card" style="background:var(--bg-app)!important; border:1px solid var(--border-color)">
                                <div class="stat-label">Consumo Comedor</div>
                                <div class="stat-value text-danger">$${stats.comida.toLocaleString()}</div>
                            </div>
                            <div class="stat-card" style="background:var(--bg-app)!important; border:1px solid var(--border-color)">
                                <div class="stat-label">Ventas Tienda</div>
                                <div class="stat-value text-green">$${stats.ventas.toLocaleString()}</div>
                            </div>
                        </div>

                        <div class="stat-card" style="text-align:center; background:var(--bg-surface-hover)!important; border:1px solid var(--color-primary)">
                            <div class="stat-label">Efectivo Desembolsado (Pago Neto)</div>
                            <div class="stat-value tabular-data" style="font-size:1.5rem; color:var(--text-main)">$${stats.pagado.toLocaleString()}</div>
                        </div>

                        <button class="btn-premium secondary w-100 mt-2" onclick="Ciclos.closeModal()">Cerrar</button>
                    </div>
                </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
        if (window.lucide) window.lucide.createIcons();
    },

    closeModal(e) {
        if (e && e.target !== e.currentTarget) return;
        document.querySelectorAll('.modal-overlay, .modal-system-overlay').forEach(m => m.remove());
    }
};
