/* ============================================
   historial.js — Módulo de Nóminas Cerradas
   CaféControl
   ============================================ */

const Historial = {
    async render() {
        const container = document.getElementById('app');
        if (!container) return;

        const cycleStats = await db.getByFinca('cycle_stats');
        // Ordenar del más reciente al más antiguo
        cycleStats.sort((a, b) => b.id - a.id);

        let sumarioHtml = `
            <div class="animate-in">
                <div class="header-premium" style="margin-bottom:24px">
                    <div class="header-icon" style="background:var(--bg-card-hover); color:var(--text-main)"><i data-lucide="history"></i></div>
                    <div style="flex:1">
                        <h2>Historial de Nóminas</h2>
                        <p class="text-muted" style="margin:0; font-size:0.85rem">Auditoría contable y productiva de semanas liquidadas</p>
                    </div>
                </div>
                
                ${cycleStats.length > 0 ? `
                <div class="card-premium" style="padding:0; overflow:hidden">
                    <div style="padding:16px; background:var(--bg-surface-hover); border-bottom:1px solid var(--border-color); display:flex; align-items:center; gap:8px">
                        <i data-lucide="book-check" style="width:18px; color:var(--text-muted)"></i>
                        <span style="font-weight:700; font-size:0.85rem; text-transform:uppercase">Libro Mayor (Consolidado Semanal)</span>
                    </div>
                    <div style="overflow-x:auto">
                        <table style="width:100%; border-collapse:collapse; min-width:700px">
                            <thead>
                                <tr style="background:var(--bg-app); border-bottom:1px solid var(--border-color); text-align:left">
                                    <th style="padding:16px; font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700">Semana</th>
                                    <th style="padding:16px; font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700">Periodo</th>
                                    <th style="padding:16px; font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700">Volumen Recolectado</th>
                                    <th style="padding:16px; font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700; text-align:right">Costo Operativo</th>
                                    <th style="padding:16px; font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700; text-align:center">Nómina</th>
                                    <th style="padding:16px; font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700; text-align:center">Auditoría</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${cycleStats.map(s => `
                                    <tr style="border-bottom:1px solid var(--border-color); transition:background 0.2s" class="hover-bg-surface">
                                        <td style="padding:16px">
                                            <div style="font-weight:700; color:var(--text-main); font-size:0.95rem; display:flex; align-items:center; gap:8px">
                                                <div style="width:8px; height:8px; border-radius:50%; background:var(--color-primary)"></div>
                                                ${s.week_name}
                                            </div>
                                        </td>
                                        <td style="padding:16px; color:var(--text-muted); font-size:0.85rem">
                                            <div style="display:flex; align-items:center; gap:6px"><i data-lucide="calendar" style="width:14px"></i> ${Ciclos.formatFecha(s.start_date)} - ${Ciclos.formatFecha(s.end_date)}</div>
                                        </td>
                                        <td style="padding:16px">
                                            <div class="tabular-data" style="font-weight:700; color:var(--color-success)">${(s.total_kilos || 0).toLocaleString()} <span style="font-size:0.75rem; font-weight:600">kg</span></div>
                                        </td>
                                        <td style="padding:16px; text-align:right">
                                            <div class="tabular-data" style="font-weight:800; color:var(--text-main)">$${(s.total_payroll || 0).toLocaleString()}</div>
                                        </td>
                                        <td style="padding:16px; text-align:center">
                                            <div style="display:inline-flex; align-items:center; gap:6px; background:var(--bg-app); padding:4px 10px; border-radius:12px; font-size:0.8rem; font-weight:600; border:1px solid var(--border-color)">
                                                <i data-lucide="users" style="width:14px; opacity:0.7"></i> ${s.workers_count || 0}
                                            </div>
                                        </td>
                                        <td style="padding:16px; text-align:center">
                                            <button class="btn-premium secondary" style="padding:4px 12px; height:auto; min-height:32px; font-size:0.8rem" onclick="Historial.verDetalle(${s.cycle_id}, '${s.week_name}')">
                                                <i data-lucide="search" style="width:14px"></i> Detalle
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                ` : `
                <div class="card-premium" style="padding:40px 20px; text-align:center; border:1px dashed var(--border-color); display:flex; flex-direction:column; align-items:center; justify-content:center">
                    <div style="background:var(--bg-surface-hover); width:64px; height:64px; border-radius:16px; display:flex; align-items:center; justify-content:center; margin-bottom:16px">
                        <i data-lucide="folder-open" style="width:32px; height:32px; color:var(--text-muted)"></i>
                    </div>
                    <h3 style="margin:0 0 8px 0">Historial vacío</h3>
                    <p class="text-muted" style="max-width:300px; margin:0 auto; font-size:0.9rem">No existen periodos liquidados o semanas cerradas en el registro contable de esta finca.</p>
                </div>
                `}
                
                <div id="historial-detalle-cont"></div>
            </div>
        `;

        container.innerHTML = sumarioHtml;
        if (window.lucide) window.lucide.createIcons();
    },

    async verDetalle(cicloId, weekName) {
        // En base a la ID del ciclo, retroceder y buscar las transacciones exactas que ocurrieron
        const ciclo = await db.get('ciclos', cicloId);

        // Si el ciclo no existiera (hard-delete anómalo), igual extraemos las estadísticas estáticas
        const statsBase = (await db.getByFinca('cycle_stats')).find(s => s.cycle_id === cicloId);

        let targetInicio = ciclo ? ciclo.fechaInicio : (statsBase ? statsBase.start_date : null);
        let targetFin = ciclo ? ciclo.fechaFin : (statsBase ? statsBase.end_date : null);

        if (!targetInicio || !targetFin) return App.toast('No se encontraron registros de este ciclo.', 'error');

        // Leer DB (Sólo de esta Finca)
        const obreros = await db.getByFinca('obreros');
        const jornales = (await db.getByFinca('jornales')).filter(j => j.cicloId === cicloId || (j.fecha >= targetInicio && j.fecha <= targetFin));
        const pagos = (await db.getByFinca('pagos')).filter(p => p.cicloId === cicloId || (p.fechaPago >= targetInicio && p.fechaPago <= targetFin));
        const comidas = (await db.getByFinca('comida')).filter(c => c.cicloId === cicloId || (c.fecha >= targetInicio && c.fecha <= targetFin));
        const ventasCaja = (await db.getByFinca('ventasCaja')).filter(v => v.cicloId === cicloId || (v.fecha >= targetInicio && v.fecha <= targetFin));

        // Construir la tabla final desglosando Obreros Involucrados
        // Solo consideraremos obreros que existan en Pagos o Jornales de esa época.
        const obrerosInvolucrados = new Set([
            ...jornales.map(j => j.obreroId),
            ...pagos.map(p => p.obreroId),
            ...comidas.map(c => c.obreroId),
            ...ventasCaja.map(v => v.obreroId)
        ]);

        const resumenObreros = Array.from(obrerosInvolucrados).map(id => {
            const obInfo = obreros.find(o => o.id === id) || { nombre: 'Obrero Eliminado (' + id + ')' };
            const misJornales = jornales.filter(j => j.obreroId === id);
            const misPagos = pagos.filter(p => p.obreroId === id);

            // Kilos acumulados
            const kilos = misJornales.reduce((acc, j) => acc + (j.kilosRecolectados || 0), 0);

            // Si hay un pago formal, usamos sus métricas, sino calculamos la sumatoria cruda al vuelo
            let bruto = 0, descuentos = 0, neto = 0;

            if (misPagos.length > 0) {
                // Sumar todos los pagos si hubieran más de 1
                bruto = misPagos.reduce((acc, p) => acc + (p.totalGanado || 0), 0);
                descuentos = misPagos.reduce((acc, p) => acc + ((p.descComida || 0) + (p.descCaja || 0)), 0);
                neto = misPagos.reduce((acc, p) => acc + (p.netoAPagar || 0), 0);
            } else {
                bruto = misJornales.reduce((acc, j) => acc + (j.totalDia || 0), 0);
                const descComidas = comidas.filter(c => c.obreroId === id).reduce((acc, c) => acc + (c.valor || 0), 0);
                const descCantina = ventasCaja.filter(v => v.obreroId === id && v.fiado).reduce((acc, v) => acc + (v.valorTotal || 0), 0);
                descuentos = descComidas + descCantina;
                neto = bruto - descuentos;
            }

            return { nombre: obInfo.nombre, kilos, bruto, descuentos, neto };
        });

        // Sort by Neto desc
        resumenObreros.sort((a, b) => b.neto - a.neto);

        const htmlDetalle = `
            <div class="card-premium animate-in" style="margin-top:24px; padding:0; overflow:hidden; border:1px solid var(--color-primary); box-shadow:0 8px 32px rgba(34, 197, 94, 0.1)">
                <div style="padding:16px 20px; background:linear-gradient(90deg, var(--bg-surface-hover) 0%, rgba(34, 197, 94, 0.05) 100%); border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center">
                    <div style="display:flex; align-items:center; gap:12px">
                        <div style="background:var(--color-primary); color:#fff; width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center">
                            <i data-lucide="file-text" style="width:18px"></i>
                        </div>
                        <div>
                            <h3 style="margin:0; font-size:1.1rem; color:var(--text-main)">Desglose Contable: ${weekName}</h3>
                            <div class="text-muted" style="font-size:0.8rem">Auditoría a nivel de trabajador</div>
                        </div>
                    </div>
                    <button class="btn-icon-only text-muted" onclick="document.getElementById('historial-detalle-cont').innerHTML=''" style="border:none; background:transparent" title="Cerrar detalle"><i data-lucide="x"></i></button>
                </div>
                
                <div style="overflow-x:auto">
                    <table style="width:100%; border-collapse:collapse; min-width:600px">
                        <thead>
                            <tr style="background:var(--bg-app); border-bottom:1px solid var(--border-color); text-align:left">
                                <th style="padding:12px 20px; font-size:0.7rem; text-transform:uppercase; color:var(--text-muted); font-weight:700">Trabajador</th>
                                <th style="padding:12px 20px; font-size:0.7rem; text-transform:uppercase; color:var(--text-muted); font-weight:700">Kilos</th>
                                <th style="padding:12px 20px; font-size:0.7rem; text-transform:uppercase; color:var(--text-muted); font-weight:700">Pago Bruto</th>
                                <th style="padding:12px 20px; font-size:0.7rem; text-transform:uppercase; color:var(--color-danger); font-weight:700">Descuentos</th>
                                <th style="padding:12px 20px; font-size:0.7rem; text-transform:uppercase; color:var(--color-primary); font-weight:700; text-align:right">Pago Neto</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${resumenObreros.length > 0 ? resumenObreros.map(o => `
                                <tr style="border-bottom:1px solid var(--border-color); transition:background 0.2s" class="hover-bg-surface">
                                    <td style="padding:12px 20px; font-weight:600; color:var(--text-main); font-size:0.9rem">${o.nombre}</td>
                                    <td style="padding:12px 20px">
                                        <div class="tabular-data" style="color:var(--text-muted); font-weight:600">${o.kilos.toLocaleString()} <span style="font-size:0.7rem">kg</span></div>
                                    </td>
                                    <td style="padding:12px 20px">
                                        <div class="tabular-data" style="color:var(--text-main); font-weight:600">$${o.bruto.toLocaleString()}</div>
                                    </td>
                                    <td style="padding:12px 20px">
                                        <div class="tabular-data" style="color:var(--color-danger); font-weight:600">-$${o.descuentos.toLocaleString()}</div>
                                    </td>
                                    <td style="padding:12px 20px; text-align:right">
                                        <div class="tabular-data" style="color:var(--text-main); font-weight:800; font-size:1.05rem">$${o.neto.toLocaleString()}</div>
                                    </td>
                                </tr>
                            `).join('') : `<tr><td colspan="5" style="padding:32px; text-align:center; color:var(--text-muted)"><i data-lucide="ghost" style="width:24px; height:24px; opacity:0.3; margin-bottom:8px"></i><br>Sin movimientos registrados</td></tr>`}
                        </tbody>
                    </table>
                </div>
                
                ${resumenObreros.length > 0 ? `
                <div style="padding:16px 20px; background:var(--bg-surface); border-top:1px solid var(--border-color); display:flex; justify-content:flex-end">
                    <button class="btn-premium primary" onclick="PDF.generarRecibosCiclo(${cicloId})"><i data-lucide="printer"></i> Imprimir Recibos PDF</button>
                </div>
                ` : ''}
            </div>
        `;

        let detCont = document.getElementById('historial-detalle-cont');
        if (!detCont) return; // Ya existe en la plantilla base

        detCont.innerHTML = htmlDetalle;
        if (window.lucide) window.lucide.createIcons();
        detCont.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

window.Historial = Historial;
