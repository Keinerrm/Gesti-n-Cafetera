/* ============================================
   reportes.js — Reportes y Exportación
   CSV + PDF con jsPDF + Multi-finca
   ============================================ */

const Reportes = {
    activeTab: 'graficas',
    _chartInstances: [],

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="animate-in">
                <div class="header-premium" style="margin-bottom:24px">
                    <div class="header-icon" style="background:rgba(37, 99, 235, 0.1); color:var(--text-main)"><i data-lucide="pie-chart"></i></div>
                    <div>
                        <h2>Reportes Analíticos</h2>
                        <p>Gráficas, informes y exportación en PDF/CSV</p>
                    </div>
                </div>

                <div class="tabs" style="margin-bottom:24px; display:flex; gap:8px; overflow-x:auto;">
                    <button class="btn-premium ${this.activeTab === 'graficas' ? 'primary' : 'secondary'} flex-1" onclick="Reportes.switchTab('graficas')">
                        <i data-lucide="bar-chart-2"></i> Dashboard
                    </button>
                    <button class="btn-premium ${this.activeTab === 'obrero' ? 'primary' : 'secondary'} flex-1" onclick="Reportes.switchTab('obrero')">
                        <i data-lucide="users"></i> Obreros
                    </button>
                    <button class="btn-premium ${this.activeTab === 'lote' ? 'primary' : 'secondary'} flex-1" onclick="Reportes.switchTab('lote')">
                        <i data-lucide="map"></i> Lotes
                    </button>
                    <button class="btn-premium ${this.activeTab === 'finca' ? 'primary' : 'secondary'} flex-1" onclick="Reportes.switchTab('finca')">
                        <i data-lucide="clipboard-list"></i> General
                    </button>
                </div>

                <div id="reportes-content"></div>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        Reportes.renderTab();
    },

    switchTab(tab) {
        this.activeTab = tab;
        this.render(); // Re-render to update tab styles correctly
    },

    async renderTab() {
        const container = document.getElementById('reportes-content');
        if (!container) return;

        // Cleanup previous charts
        this._chartInstances.forEach(c => c.destroy());
        this._chartInstances = [];

        if (this.activeTab === 'graficas') await this.reporteGraficas(container);
        else if (this.activeTab === 'obrero') await this.reporteObrero(container);
        else if (this.activeTab === 'lote') await this.reporteLote(container);
        else await this.reporteFinca(container);
    },

    async reporteGraficas(container) {
        container.innerHTML = `
            <div class="grid-2 mb-2" style="gap:16px;">
                <div class="card-premium animate-in" style="animation-delay:0.05s">
                    <h3 style="font-size:1rem; margin:0 0 16px; color:var(--text-main); display:flex; align-items:center; gap:6px"><i data-lucide="trending-up" style="color:var(--color-primary)"></i> Producción por Semana</h3>
                    <div style="position:relative; height:250px; width:100%">
                        <canvas id="chart-kilos-semana"></canvas>
                    </div>
                </div>
                <div class="card-premium animate-in" style="animation-delay:0.1s">
                    <h3 style="font-size:1rem; margin:0 0 16px; color:var(--text-main); display:flex; align-items:center; gap:6px"><i data-lucide="pie-chart" style="color:var(--color-warning)"></i> Kg por Lote Historico</h3>
                    <div style="position:relative; height:250px; width:100%">
                        <canvas id="chart-kilos-lote"></canvas>
                    </div>
                </div>
                <div class="card-premium animate-in" style="animation-delay:0.15s">
                    <h3 style="font-size:1rem; margin:0 0 16px; color:var(--text-main); display:flex; align-items:center; gap:6px"><i data-lucide="badge-dollar-sign" style="color:var(--color-danger)"></i> Costo Nómina por Semana</h3>
                    <div style="position:relative; height:250px; width:100%">
                        <canvas id="chart-nomina-semana"></canvas>
                    </div>
                </div>
                <div class="card-premium animate-in" style="animation-delay:0.2s">
                    <h3 style="font-size:1rem; margin:0 0 16px; color:var(--text-main); display:flex; align-items:center; gap:6px"><i data-lucide="award" style="color:var(--color-primary)"></i> Top 10 Mejores Recolectores</h3>
                    <div style="position:relative; height:250px; width:100%">
                        <canvas id="chart-top-recolectores"></canvas>
                    </div>
                </div>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        setTimeout(() => this.initCharts(), 50);
    },

    async initCharts() {
        if (typeof Chart === 'undefined') {
            App.toast('Generando motor de gráficas...', 'info');
            return;
        }

        const jornales = await db.getByFinca('jornales');
        const pagos = await db.getByFinca('pagos');
        const lotes = await db.getByFinca('lotes');
        const obreros = await db.getByFinca('obreros');
        const ciclos = await db.getByFinca('ciclos');

        if (jornales.length === 0 && pagos.length === 0) {
            document.querySelectorAll('canvas').forEach(c => {
                const parent = c.parentElement;
                parent.innerHTML = '<div style="height:100%; display:flex; align-items:center; justify-content:center; color:var(--text-muted); font-size:0.9rem">Sin datos suficientes</div>';
            });
            return;
        }

        const ciclosMap = Object.fromEntries(ciclos.map(c => [c.id, c.nombre]));
        const lotesMap = Object.fromEntries(lotes.map(l => [l.id, l.nombre]));
        const obrerosMap = Object.fromEntries(obreros.map(o => [o.id, o.nombre]));

        Chart.defaults.color = '#888';
        Chart.defaults.font.family = 'inherit';

        // 1. Kilos por Semana
        const kilosWeek = {};
        jornales.forEach(j => {
            const sem = ciclosMap[j.cicloId] || 'Sin Ciclo';
            kilosWeek[sem] = (kilosWeek[sem] || 0) + (j.kilosRecolectados || 0);
        });

        const ctxKs = document.getElementById('chart-kilos-semana');
        if (ctxKs) {
            this._chartInstances.push(new Chart(ctxKs, {
                type: 'bar',
                data: {
                    labels: Object.keys(kilosWeek),
                    datasets: [{
                        label: 'Kilos',
                        data: Object.values(kilosWeek),
                        backgroundColor: 'rgba(22, 163, 74, 0.6)',
                        borderRadius: 4
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
            }));
        }

        // 2. Kilos por Lote
        const kilosLote = {};
        jornales.forEach(j => {
            const loteName = lotesMap[j.loteId] || 'Otros';
            kilosLote[loteName] = (kilosLote[loteName] || 0) + (j.kilosRecolectados || 0);
        });
        const ctxKl = document.getElementById('chart-kilos-lote');
        if (ctxKl) {
            this._chartInstances.push(new Chart(ctxKl, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(kilosLote),
                    datasets: [{
                        data: Object.values(kilosLote),
                        backgroundColor: ['#16a34a', '#2563eb', '#ea580c', '#ca8a04', '#9333ea', '#db2777'],
                        borderWidth: 0
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'right' } } }
            }));
        }

        // 3. Nómina por semana
        const nominaWeek = {};
        pagos.filter(p => p.estado !== 'anulado').forEach(p => {
            const sem = ciclosMap[p.cicloId] || 'Sin Ciclo';
            nominaWeek[sem] = (nominaWeek[sem] || 0) + (p.netoAPagar || 0);
        });
        const ctxNs = document.getElementById('chart-nomina-semana');
        if (ctxNs) {
            this._chartInstances.push(new Chart(ctxNs, {
                type: 'line',
                data: {
                    labels: Object.keys(nominaWeek),
                    datasets: [{
                        label: 'Pagado ($)',
                        data: Object.values(nominaWeek),
                        borderColor: '#ea580c',
                        backgroundColor: 'rgba(234, 88, 12, 0.1)',
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
            }));
        }

        // 4. Top recolectores
        const recolectores = {};
        jornales.forEach(j => {
            const ob = obrerosMap[j.obreroId] || 'Desconocido';
            recolectores[ob] = (recolectores[ob] || 0) + (j.kilosRecolectados || 0);
        });
        const topObreros = Object.entries(recolectores).sort((a, b) => b[1] - a[1]).slice(0, 10);
        const ctxTr = document.getElementById('chart-top-recolectores');
        if (ctxTr) {
            this._chartInstances.push(new Chart(ctxTr, {
                type: 'bar',
                data: {
                    labels: topObreros.map(o => o[0]),
                    datasets: [{
                        label: 'Kilos Totales',
                        data: topObreros.map(o => o[1]),
                        backgroundColor: 'rgba(37, 99, 235, 0.6)',
                        borderRadius: 4
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } }
                }
            }));
        }
    },

    async reporteObrero(container) {
        const obreros = (await db.getByFinca('obreros')).filter(o => o.estado !== 'inactivo');
        const jornales = await db.getByFinca('jornales');
        const comidas = await db.getByFinca('comida');
        const ventas = await db.getByFinca('ventasCaja');
        const pagos = await db.getByFinca('pagos');

        const data = obreros.map(o => {
            const jn = jornales.filter(j => j.obreroId === o.id);
            const cm = comidas.filter(c => c.obreroId === o.id);
            // Ignorar ventas cobradas que fueron revertidas (pagada = false cuando en realidad se cobro, o fiado desactivado por error humano despues)
            const vt = ventas.filter(v => v.obreroId === o.id && v.fiado);
            // Solo sumar pagos finalizados correctamente (ignorar anulados)
            const pg = pagos.filter(p => p.obreroId === o.id && p.estado !== 'anulado');

            return {
                nombre: o.nombre,
                estado: o.estado,
                dias: jn.length,
                kilos: jn.reduce((s, j) => s + (j.kilosRecolectados || 0), 0),
                ganado: jn.reduce((s, j) => s + (j.totalDia || 0), 0),
                descComida: cm.reduce((s, c) => s + (c.valor || 0), 0),
                descCaja: vt.reduce((s, v) => s + (v.valorTotal || 0), 0),
                pagado: pg.reduce((s, p) => s + (p.netoAPagar || 0), 0)
            };
        });

        container.innerHTML = `
            <div class="header-premium" style="margin-top:24px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:12px">
                    <div class="header-icon" style="background:var(--bg-surface-hover); color:var(--text-main); width:32px; height:32px"><i data-lucide="users" style="width:16px; height:16px"></i></div>
                    <h3 style="margin:0; font-size:1.1rem">Rendimiento por Obrero (${data.length})</h3>
                </div>
                <div style="display:flex; gap:8px">
                    <button class="btn-premium secondary" style="min-height:36px!important; padding:0 12px!important" onclick="Reportes.exportCSV('obreros')">
                        <i data-lucide="download" style="width:16px; height:16px"></i> CSV
                    </button>
                    <button class="btn-premium primary" style="min-height:36px!important; padding:0 12px!important" onclick="Reportes.exportPDF('obreros')">
                        <i data-lucide="file-text" style="width:16px; height:16px"></i> PDF
                    </button>
                </div>
            </div>

            <div class="card-premium table-wrapper" style="padding:0; overflow:hidden">
                <table style="width:100%; border-collapse:collapse">
                    <thead style="background:var(--bg-surface-hover); color:var(--text-muted); text-transform:uppercase; font-size:0.75rem; font-weight:700">
                        <tr>
                            <th style="padding:16px; text-align:left; border-bottom:1px solid var(--border-color)">Obrero</th>
                            <th style="padding:16px; text-align:center; border-bottom:1px solid var(--border-color)">Estd</th>
                            <th style="padding:16px; text-align:center; border-bottom:1px solid var(--border-color)">Días</th>
                            <th style="padding:16px; text-align:right; border-bottom:1px solid var(--border-color)">Kilos</th>
                            <th style="padding:16px; text-align:right; border-bottom:1px solid var(--border-color)">Ganado ($)</th>
                            <th style="padding:16px; text-align:right; border-bottom:1px solid var(--border-color)">Comida ($)</th>
                            <th style="padding:16px; text-align:right; border-bottom:1px solid var(--border-color)">Caja ($)</th>
                            <th style="padding:16px; text-align:right; border-bottom:1px solid var(--border-color)">Pagado ($)</th>
                        </tr>
                    </thead>
                    <tbody class="tabular-data">
                        ${data.map(d => `
                            <tr style="border-bottom:1px solid var(--border-color)">
                                <td style="padding:12px 16px; font-weight:600; color:var(--text-main)">${d.nombre}</td>
                                <td style="padding:12px 16px; text-align:center"><span class="badge ${d.estado === 'activo' ? 'badge-active' : 'badge-inactive'}">${d.estado}</span></td>
                                <td style="padding:12px 16px; text-align:center">${d.dias}</td>
                                <td style="padding:12px 16px; text-align:right">${d.kilos.toLocaleString()}</td>
                                <td style="padding:12px 16px; text-align:right; color:var(--color-primary)">${d.ganado.toLocaleString()}</td>
                                <td style="padding:12px 16px; text-align:right; color:var(--color-danger)">${d.descComida.toLocaleString()}</td>
                                <td style="padding:12px 16px; text-align:right; color:var(--color-danger)">${d.descCaja.toLocaleString()}</td>
                                <td style="padding:12px 16px; text-align:right; font-weight:700; color:var(--text-main)">${d.pagado.toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    },

    async reporteLote(container) {
        const lotes = await db.getByFinca('lotes');
        const jornales = await db.getByFinca('jornales');
        const transportes = await db.getByFinca('transportes');
        const factorGlobal = await db.getConfig('factorConversion', 0.5);
        const precioCarga = await db.getConfig('precioCarga', 2000000);

        let totalGananciaGlobal = 0;

        const data = lotes.map(l => {
            const jn = jornales.filter(j => j.loteId === l.id);
            const kilosRojos = jn.reduce((s, j) => s + (j.kilosRecolectados || 0), 0);
            const gastoJornales = jn.reduce((s, j) => s + (j.totalDia || 0), 0);

            // GASTO DE TRANSPORTE HÍBRIDO (Viejo + Nuevo)
            const gastoTransporteAntiguo = jn.reduce((s, j) => s + (parseFloat(j.transporte) || 0), 0);
            const trLote = transportes.filter(t => t.loteId === l.id);
            const gastoTransporteNuevo = trLote.reduce((s, t) => s + (t.total || 0), 0);
            const gastoTransporteTotal = gastoTransporteAntiguo + gastoTransporteNuevo;

            const gastos = gastoJornales + gastoTransporteTotal;

            const factor = l.factorRendimiento || factorGlobal;
            const pergamino = kilosRojos * factor;
            const ingreso = (pergamino / 125) * precioCarga;
            const ganancia = ingreso - gastos;

            totalGananciaGlobal += ganancia;

            return {
                nombre: l.nombre,
                area: parseFloat(l.area) > 0 ? l.area : '—',
                kilosRojos,
                gastos,
                ingreso,
                ganancia
            };
        });

        container.innerHTML = `
            <div class="header-premium" style="margin-top:24px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:12px">
                    <div class="header-icon" style="background:var(--bg-surface-hover); color:var(--text-main); width:32px; height:32px"><i data-lucide="map" style="width:16px; height:16px"></i></div>
                    <h3 style="margin:0; font-size:1.1rem">Rendimiento por Lote (${data.length})</h3>
                </div>
                <div style="display:flex; gap:8px">
                    <button class="btn-premium secondary" style="min-height:36px!important; padding:0 12px!important" onclick="Reportes.exportCSV('lotes')">
                        <i data-lucide="download" style="width:16px; height:16px"></i> CSV
                    </button>
                    <button class="btn-premium primary" style="min-height:36px!important; padding:0 12px!important" onclick="Reportes.exportPDF('lotes')">
                        <i data-lucide="file-text" style="width:16px; height:16px"></i> PDF
                    </button>
                </div>
            </div>

            <div class="card-premium mb-2" style="display:flex; justify-content:space-between; align-items:center; padding:16px; background:var(--bg-surface-hover)!important">
                <div style="display:flex; align-items:center; gap:8px; color:var(--text-muted); font-weight:600">
                    <i data-lucide="trending-up" style="width:20px; height:20px"></i> Ganancia Neta Global
                </div>
                <div class="tabular-data" style="font-size:1.4rem; font-weight:800; color:${totalGananciaGlobal >= 0 ? 'var(--color-primary)' : 'var(--color-danger)'}">
                    $${Math.round(totalGananciaGlobal).toLocaleString()}
                </div>
            </div>

            <div class="card-premium table-wrapper" style="padding:0; overflow:hidden">
                <table style="width:100%; border-collapse:collapse">
                    <thead style="background:var(--bg-surface-hover); color:var(--text-muted); text-transform:uppercase; font-size:0.75rem; font-weight:700">
                        <tr>
                            <th style="padding:16px; text-align:left; border-bottom:1px solid var(--border-color)">Lote / Sector</th>
                            <th style="padding:16px; text-align:center; border-bottom:1px solid var(--border-color)">Área (ha)</th>
                            <th style="padding:16px; text-align:right; border-bottom:1px solid var(--border-color)">Cereza (kg)</th>
                            <th style="padding:16px; text-align:right; border-bottom:1px solid var(--border-color)">Gastos ($)</th>
                            <th style="padding:16px; text-align:right; border-bottom:1px solid var(--border-color)">Ingreso Est ($)</th>
                            <th style="padding:16px; text-align:right; border-bottom:1px solid var(--border-color)">Neta ($)</th>
                        </tr>
                    </thead>
                    <tbody class="tabular-data">
                        ${data.map(d => `
                            <tr style="border-bottom:1px solid var(--border-color)">
                                <td style="padding:12px 16px; font-weight:600; color:var(--text-main)">${d.nombre}</td>
                                <td style="padding:12px 16px; text-align:center">${d.area}</td>
                                <td style="padding:12px 16px; text-align:right">${d.kilosRojos.toLocaleString()}</td>
                                <td style="padding:12px 16px; text-align:right; color:var(--color-danger)">$${Math.round(d.gastos).toLocaleString()}</td>
                                <td style="padding:12px 16px; text-align:right; color:var(--color-primary)">$${Math.round(d.ingreso).toLocaleString()}</td>
                                <td style="padding:12px 16px; text-align:right; font-weight:700; color:${d.ganancia >= 0 ? 'var(--color-primary)' : 'var(--color-danger)'}">
                                    $${Math.round(d.ganancia).toLocaleString()}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    },

    async reporteFinca(container) {
        const obreros = (await db.getByFinca('obreros')).filter(o => o.estado !== 'inactivo');
        const lotes = await db.getByFinca('lotes');
        const jornales = await db.getByFinca('jornales');
        const comidas = await db.getByFinca('comida');
        const ventas = await db.getByFinca('ventasCaja');
        const pagos = await db.getByFinca('pagos');
        const cascota = await db.getByFinca('cascota');
        const conversion = await db.getByFinca('conversion');

        const totalKilos = jornales.reduce((s, j) => s + (j.kilosRecolectados || 0), 0);
        const totalJornales = jornales.reduce((s, j) => s + (j.totalDia || 0), 0);
        const totalComida = comidas.reduce((s, c) => s + (c.valor || 0), 0);
        const totalVentas = ventas.reduce((s, v) => s + (v.valorTotal || 0), 0);

        // Sumatoria del total pagado ignorando fuertemente los recibos anulados
        const pagosValidos = pagos.filter(p => p.estado !== 'anulado');
        const totalPagado = pagosValidos.reduce((s, p) => s + (p.netoAPagar || 0), 0);

        const totalCascota = cascota.reduce((s, c) => s + (c.kilos || 0), 0);
        const totalRojo = conversion.reduce((s, c) => s + (c.kilosRojo || 0), 0);
        const totalMojado = conversion.reduce((s, c) => s + (c.kilosMojado || 0), 0);

        container.innerHTML = `
            <div class="header-premium" style="margin-top:24px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:12px">
                    <div class="header-icon" style="background:var(--bg-surface-hover); color:var(--text-main); width:32px; height:32px"><i data-lucide="clipboard-list" style="width:16px; height:16px"></i></div>
                    <h3 style="margin:0; font-size:1.1rem">Reporte General Consolidado</h3>
                </div>
                <div style="display:flex; gap:8px">
                    <button class="btn-premium secondary" style="min-height:36px!important; padding:0 12px!important" onclick="Reportes.exportCSV('finca')">
                        <i data-lucide="download" style="width:16px; height:16px"></i> CSV
                    </button>
                    <button class="btn-premium primary" style="min-height:36px!important; padding:0 12px!important" onclick="Reportes.exportPDF('finca')">
                        <i data-lucide="file-text" style="width:16px; height:16px"></i> PDF
                    </button>
                    <button class="btn-premium secondary" style="min-height:36px!important; padding:0 12px!important" onclick="window.print()">
                        <i data-lucide="printer" style="width:16px; height:16px"></i>
                    </button>
                </div>
            </div>

            <div class="grid-3 mb-2" style="gap:12px">
                <div class="stat-card" style="background:var(--bg-surface)!important; border:1px solid var(--border-color)!important; padding:16px; border-radius:var(--border-radius-md)">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start">
                        <div style="display:flex; flex-direction:column; gap:4px">
                            <div class="stat-label" style="font-size:0.85rem; color:var(--text-muted); text-transform:uppercase; font-weight:600">Obreros (${obreros.filter(o => o.estado === 'activo').length} act)</div>
                            <div class="stat-value tabular-data" style="font-size:1.8rem; font-weight:700; color:var(--text-main)">${obreros.length}</div>
                        </div>
                        <div class="stat-icon" style="background:rgba(234, 179, 8, 0.1); color:var(--color-warning); width:36px; height:36px; border-radius:8px; display:flex; align-items:center; justify-content:center; margin:0"><i data-lucide="hard-hat" style="width:18px; height:18px"></i></div>
                    </div>
                </div>
                <div class="stat-card" style="background:var(--bg-surface)!important; border:1px solid var(--border-color)!important; padding:16px; border-radius:var(--border-radius-md)">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start">
                        <div style="display:flex; flex-direction:column; gap:4px">
                            <div class="stat-label" style="font-size:0.85rem; color:var(--text-muted); text-transform:uppercase; font-weight:600">Lotes Totales</div>
                            <div class="stat-value tabular-data" style="font-size:1.8rem; font-weight:700; color:var(--text-main)">${lotes.length}</div>
                        </div>
                        <div class="stat-icon" style="background:rgba(180, 83, 9, 0.1); color:var(--color-brand); width:36px; height:36px; border-radius:8px; display:flex; align-items:center; justify-content:center; margin:0"><i data-lucide="map" style="width:18px; height:18px"></i></div>
                    </div>
                </div>
                <div class="stat-card" style="background:var(--bg-surface)!important; border:1px solid var(--border-color)!important; padding:16px; border-radius:var(--border-radius-md)">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start">
                        <div style="display:flex; flex-direction:column; gap:4px">
                            <div class="stat-label" style="font-size:0.85rem; color:var(--text-muted); text-transform:uppercase; font-weight:600">Jornales Registrados</div>
                            <div class="stat-value tabular-data" style="font-size:1.8rem; font-weight:700; color:var(--text-main)">${jornales.length}</div>
                        </div>
                        <div class="stat-icon" style="background:rgba(59, 130, 246, 0.1); color:var(--color-info); width:36px; height:36px; border-radius:8px; display:flex; align-items:center; justify-content:center; margin:0"><i data-lucide="list-checks" style="width:18px; height:18px"></i></div>
                    </div>
                </div>
            </div>

            <div class="header-premium" style="margin-top:32px; margin-bottom:16px;">
                <div class="header-icon" style="background:rgba(234, 179, 8, 0.1); color:var(--color-warning); width:32px; height:32px"><i data-lucide="leaf" style="width:16px; height:16px"></i></div>
                <div><h3 style="margin:0; font-size:1.1rem">Indicadores de Producción</h3></div>
            </div>

            <div class="grid-2 mb-2" style="gap:12px">
                <div class="card-premium" style="display:flex; justify-content:space-between; align-items:center; padding:16px">
                    <span style="color:var(--text-muted); font-weight:600; font-size:0.9rem">Café Recolectado</span>
                    <span class="tabular-data" style="font-size:1.2rem; font-weight:700; color:var(--text-main)">${totalKilos.toLocaleString()} kg</span>
                </div>
                <div class="card-premium" style="display:flex; justify-content:space-between; align-items:center; padding:16px">
                    <span style="color:var(--text-muted); font-weight:600; font-size:0.9rem">Cereza para Proceso</span>
                    <span class="tabular-data" style="font-size:1.2rem; font-weight:700; color:var(--color-danger)">${totalRojo.toLocaleString()} kg</span>
                </div>
                <div class="card-premium" style="display:flex; justify-content:space-between; align-items:center; padding:16px">
                    <span style="color:var(--text-muted); font-weight:600; font-size:0.9rem">Pergamino Seco Est</span>
                    <span class="tabular-data" style="font-size:1.2rem; font-weight:700; color:var(--color-primary)">${totalMojado.toLocaleString()} kg</span>
                </div>
                <div class="card-premium" style="display:flex; justify-content:space-between; align-items:center; padding:16px">
                    <span style="color:var(--text-muted); font-weight:600; font-size:0.9rem">Residuos Cascota</span>
                    <span class="tabular-data" style="font-size:1.2rem; font-weight:700; color:var(--color-warning)">${totalCascota.toLocaleString()} kg</span>
                </div>
            </div>

            <div class="header-premium" style="margin-top:32px; margin-bottom:16px;">
                <div class="header-icon" style="background:rgba(16, 185, 129, 0.1); color:var(--color-primary); width:32px; height:32px"><i data-lucide="circle-dollar-sign" style="width:16px; height:16px"></i></div>
                <div><h3 style="margin:0; font-size:1.1rem">Resumen Financiero y Gastos</h3></div>
            </div>

            <div class="grid-2 mb-2" style="gap:12px">
                <div class="card-premium" style="display:flex; justify-content:space-between; align-items:center; padding:16px">
                    <span style="color:var(--text-muted); font-weight:600; font-size:0.9rem">Tot. Jornales Generados</span>
                    <span class="tabular-data" style="font-size:1.2rem; font-weight:700; color:var(--color-primary)">$${Math.round(totalJornales).toLocaleString()}</span>
                </div>
                <div class="card-premium" style="display:flex; justify-content:space-between; align-items:center; padding:16px">
                    <span style="color:var(--text-muted); font-weight:600; font-size:0.9rem">Consumo de Comida</span>
                    <span class="tabular-data" style="font-size:1.2rem; font-weight:700; color:var(--color-danger)">$${Math.round(totalComida).toLocaleString()}</span>
                </div>
                <div class="card-premium" style="display:flex; justify-content:space-between; align-items:center; padding:16px">
                    <span style="color:var(--text-muted); font-weight:600; font-size:0.9rem">Compras en Tienda (Cr)</span>
                    <span class="tabular-data" style="font-size:1.2rem; font-weight:700; color:var(--color-warning)">$${Math.round(totalVentas).toLocaleString()}</span>
                </div>
                <div class="card-premium" style="display:flex; justify-content:space-between; align-items:center; padding:16px; border:1px solid var(--color-primary)!important; background:rgba(22, 163, 74, 0.05)!important">
                    <span style="color:var(--text-main); font-weight:700; font-size:1rem">Liquidez Neta Pagada</span>
                    <span class="tabular-data" style="font-size:1.4rem; font-weight:800; color:var(--color-primary)">$${Math.round(totalPagado).toLocaleString()}</span>
                </div>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    },

    /* ========================================
       Exportar CSV
       ======================================== */
    async exportCSV(type) {
        let csv = '';
        let filename = '';

        if (type === 'obreros') {
            const obreros = (await db.getByFinca('obreros')).filter(o => o.estado !== 'inactivo');
            const jornales = await db.getByFinca('jornales');
            const comidas = await db.getByFinca('comida');
            const ventas = await db.getByFinca('ventasCaja');

            csv = 'Nombre,Estado,Días,Kilos,Ganado,Desc.Comida,Desc.Caja\n';
            obreros.forEach(o => {
                const jn = jornales.filter(j => j.obreroId === o.id);
                const cm = comidas.filter(c => c.obreroId === o.id);
                const vt = ventas.filter(v => v.obreroId === o.id && v.fiado);
                csv += `"${o.nombre}",${o.estado},${jn.length},${jn.reduce((s, j) => s + (j.kilosRecolectados || 0), 0)},${jn.reduce((s, j) => s + (j.totalDia || 0), 0)},${cm.reduce((s, c) => s + (c.valor || 0), 0)},${vt.reduce((s, v) => s + (v.valorTotal || 0), 0)}\n`;
            });
            filename = 'reporte_obreros.csv';
        } else if (type === 'lotes') {
            const lotes = await db.getByFinca('lotes');
            const jornales = await db.getByFinca('jornales');
            const factorGlobal = await db.getConfig('factorConversion', 0.5);
            const precioCarga = await db.getConfig('precioCarga', 2000000);

            csv = 'Lote,Area(ha),Kilos Rojos,Ingreso Est.,Gastos,Ganancia Neta\n';
            lotes.forEach(l => {
                const jn = jornales.filter(j => j.loteId === l.id);
                const kilosRojos = jn.reduce((s, j) => s + (j.kilosRecolectados || 0), 0);
                const gastoJornales = jn.reduce((s, j) => s + (j.totalDia || 0), 0);
                const gastoTransporte = jn.reduce((s, j) => s + (parseFloat(j.transporte) || 0), 0);
                const gastos = gastoJornales + gastoTransporte;

                const factor = l.factorRendimiento || factorGlobal;
                const pergamino = kilosRojos * factor;
                const ingreso = (pergamino / 125) * precioCarga;
                const ganancia = ingreso - gastos;
                const areaNum = parseFloat(l.area) > 0 ? l.area : '';

                csv += `"${l.nombre}",${areaNum},${kilosRojos},${Math.round(ingreso)},${Math.round(gastos)},${Math.round(ganancia)}\n`;
            });
            filename = 'reporte_lotes.csv';
        } else {
            const jornales = await db.getByFinca('jornales');
            csv = 'Fecha,ObreroId,LoteId,Kilos,TipoPago,Total\n';
            jornales.forEach(j => {
                csv += `${j.fecha},${j.obreroId},${j.loteId},${j.kilosRecolectados || 0},${j.tipoPago},${j.totalDia || 0}\n`;
            });
            filename = 'reporte_finca.csv';
        }

        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        App.toast('CSV descargado', 'success');
    },

    /* ========================================
       Exportar PDF con jsPDF
       ======================================== */
    async exportPDF(type) {
        if (typeof window.jspdf === 'undefined') {
            return App.toast('jsPDF no está disponible', 'error');
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const hoy = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
        const fincaId = db.getFincaActiva();
        const fincas = await db.getByFinca('fincas');
        const finca = fincas.find(f => f.id === fincaId);
        const fincaNombre = finca ? finca.nombre : 'CafeControl';

        // Colors
        const brown = [139, 90, 43];
        const dark = [30, 22, 18];
        const gray = [120, 120, 120];

        // Header
        doc.setFillColor(...dark);
        doc.rect(0, 0, 210, 35, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.text('Reporte CafeControl', 15, 18);
        doc.setFontSize(10);
        doc.text(fincaNombre, 15, 26);
        doc.setFontSize(8);
        doc.text(`Generado: ${hoy}`, 145, 26);

        let y = 45;

        // --- Resumen general ---
        const jornales = await db.getByFinca('jornales');
        const comidas = await db.getByFinca('comida');
        const ventas = await db.getByFinca('ventasCaja');
        const pagosAll = await db.getByFinca('pagos');

        const totalKilos = jornales.reduce((s, j) => s + (j.kilosRecolectados || 0), 0);
        const totalPagado = pagosAll.filter(p => p.estado !== 'anulado').reduce((s, p) => s + (p.netoAPagar || 0), 0);
        const totalComida = comidas.reduce((s, c) => s + (c.valor || 0), 0);
        const totalVentas = ventas.reduce((s, v) => s + (v.valorTotal || 0), 0);

        doc.setTextColor(...brown);
        doc.setFontSize(12);
        doc.text('Resumen General', 15, y);
        y += 8;

        doc.setTextColor(...dark);
        doc.setFontSize(9);
        const resumen = [
            ['Total kilos recolectados', totalKilos.toLocaleString() + ' kg'],
            ['Total pagado', '$' + totalPagado.toLocaleString()],
            ['Gasto comida', '$' + totalComida.toLocaleString()],
            ['Ventas tienda', '$' + totalVentas.toLocaleString()]
        ];

        resumen.forEach(([label, value]) => {
            doc.setTextColor(...gray);
            doc.text(label, 20, y);
            doc.setTextColor(...dark);
            doc.text(value, 100, y);
            y += 6;
        });

        y += 8;

        // --- Table based on type ---
        if (type === 'obreros') {
            y = Reportes._pdfTable(doc, y, 'Reporte por Obrero',
                ['Obrero', 'Estado', 'Días', 'Kilos', 'Ganado', 'Desc.Comida', 'Desc.Caja'],
                await Reportes._getObrerosData(), brown, dark);
        } else if (type === 'lotes') {
            y = Reportes._pdfTable(doc, y, 'Rentabilidad por Lote',
                ['Lote', 'Área', 'Rojo(kg)', 'Ingreso', 'Gastos', 'Ganancia'],
                await Reportes._getLotesData(), brown, dark);
        } else {
            y = Reportes._pdfTable(doc, y, 'Jornales Detallados',
                ['Fecha', 'ObreroId', 'LoteId', 'Kilos', 'Tipo', 'Total'],
                await Reportes._getFincaData(), brown, dark);
        }

        // Footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(7);
            doc.setTextColor(...gray);
            doc.text(`CafeControl - ${fincaNombre} | Página ${i}/${pageCount}`, 15, 287);
        }

        const fecha = new Date().toLocaleDateString('en-CA');
        doc.save(`reporte-cafecontrol-${fecha}.pdf`);
        App.toast('PDF descargado', 'success');
    },

    _pdfTable(doc, y, title, headers, rows, brown, dark) {
        doc.setTextColor(...brown);
        doc.setFontSize(12);
        doc.text(title, 15, y);
        y += 8;

        // Column widths
        const colW = Math.min(25, (180 / headers.length));
        const startX = 15;

        // Header row
        doc.setFillColor(...brown);
        doc.rect(startX, y - 5, 180, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        headers.forEach((h, i) => {
            doc.text(h, startX + (i * colW) + 2, y);
        });
        y += 6;

        // Data rows
        doc.setFontSize(7);
        rows.forEach((row, idx) => {
            if (y > 275) {
                doc.addPage();
                y = 20;
            }

            if (idx % 2 === 0) {
                doc.setFillColor(245, 240, 235);
                doc.rect(startX, y - 4, 180, 6, 'F');
            }

            doc.setTextColor(...dark);
            row.forEach((cell, i) => {
                const text = String(cell).substring(0, 20);
                doc.text(text, startX + (i * colW) + 2, y);
            });
            y += 6;
        });

        // Border
        doc.setDrawColor(...brown);
        doc.setLineWidth(0.3);
        doc.rect(startX, y - (rows.length * 6) - 10, 180, (rows.length + 1) * 6 + 4);

        return y + 5;
    },

    async _getObrerosData() {
        const obreros = (await db.getByFinca('obreros')).filter(o => o.estado !== 'inactivo');
        const jornales = await db.getByFinca('jornales');
        const comidas = await db.getByFinca('comida');
        const pag = await db.getByFinca('pagos');

        return obreros.map(o => {
            const jn = jornales.filter(j => j.obreroId === o.id);
            const cm = comidas.filter(c => c.obreroId === o.id);
            const vt = ventas.filter(v => v.obreroId === o.id && v.fiado);
            const pg = pag.filter(p => p.obreroId === o.id && p.estado !== 'anulado');

            return [
                o.nombre, o.estado, jn.length,
                jn.reduce((s, j) => s + (j.kilosRecolectados || 0), 0).toLocaleString(),
                '$' + jn.reduce((s, j) => s + (j.totalDia || 0), 0).toLocaleString(),
                '$' + cm.reduce((s, c) => s + (c.valor || 0), 0).toLocaleString(),
                '$' + vt.reduce((s, v) => s + (v.valorTotal || 0), 0).toLocaleString()
            ];
        });
    },

    async _getLotesData() {
        const lotes = await db.getByFinca('lotes');
        const jornales = await db.getByFinca('jornales');
        const transportes = await db.getByFinca('transportes');
        const factorGlobal = await db.getConfig('factorConversion', 0.5);
        const precioCarga = await db.getConfig('precioCarga', 2000000);

        return lotes.map(l => {
            const jn = jornales.filter(j => j.loteId === l.id);
            const kilosRojos = jn.reduce((s, j) => s + (j.kilosRecolectados || 0), 0);
            const gastoJornales = jn.reduce((s, j) => s + (j.totalDia || 0), 0);

            const gastoTransporteAntiguo = jn.reduce((s, j) => s + (parseFloat(j.transporte) || 0), 0);
            const trLote = transportes.filter(t => t.loteId === l.id);
            const gastoTransporteNuevo = trLote.reduce((s, t) => s + (t.total || 0), 0);
            const gastoTransporteTotal = gastoTransporteAntiguo + gastoTransporteNuevo;

            const gastos = gastoJornales + gastoTransporteTotal;

            const factor = l.factorRendimiento || factorGlobal;
            const pergamino = kilosRojos * factor;
            const ingreso = (pergamino / 125) * precioCarga;
            const ganancia = ingreso - gastos;

            return [
                l.nombre,
                parseFloat(l.area) > 0 ? l.area.toString() : '—',
                kilosRojos.toLocaleString(),
                '$' + Math.round(ingreso).toLocaleString(),
                '$' + Math.round(gastos).toLocaleString(),
                '$' + Math.round(ganancia).toLocaleString()
            ];
        });
    },

    async _getFincaData() {
        const jornales = await db.getByFinca('jornales');
        return jornales.slice(0, 100).map(j => [
            j.fecha, j.obreroId, j.loteId,
            (j.kilosRecolectados || 0).toLocaleString(),
            j.tipoPago, '$' + (j.totalDia || 0).toLocaleString()
        ]);
    }
};
