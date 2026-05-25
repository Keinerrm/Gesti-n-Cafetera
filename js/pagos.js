/* ============================================
   pagos.js — Gestión de Pagos / Liquidación
   Refactorizado con Premium Design System
   ============================================ */

const Pagos = {
    currentTab: 'semanal',
    _liquidacion: null,
    _nominaGlobal: null,

    async render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="animate-in">
                <div class="header-premium" style="margin-bottom:24px">
                    <div class="header-icon" style="background:rgba(22, 163, 74, 0.1); color:var(--color-primary)"><i data-lucide="banknote"></i></div>
                    <div>
                        <h2>Pagos y Liquidación</h2>
                        <p>Cierre de nómina y pagos individuales</p>
                    </div>
                </div>

                <div class="tabs" style="margin-bottom:24px; display:flex; gap:8px">
                    <button class="btn-premium ${this.currentTab === 'semanal' ? 'primary' : 'secondary'} flex-1" onclick="Pagos.changeTab('semanal')">
                        <i data-lucide="zap"></i> Nómina Semanal (Lote)
                    </button>
                    <button class="btn-premium ${this.currentTab === 'individual' ? 'primary' : 'secondary'} flex-1" onclick="Pagos.changeTab('individual')">
                        <i data-lucide="user"></i> Liquidación Individual
                    </button>
                </div>

                <div id="pg-tab-content" style="margin-bottom:32px"></div>

                <div class="header-premium" style="margin-bottom:16px">
                    <div class="header-icon" style="background:var(--bg-surface-hover); color:var(--text-main)"><i data-lucide="history"></i></div>
                    <div>
                        <h3 style="margin:0;font-size:1.1rem">Historial de Pagos Emitidos</h3>
                    </div>
                </div>
                
                <div class="table-wrapper card-premium" style="padding:0; overflow:hidden;">
                    <table style="width:100%; border-collapse:collapse">
                        <thead style="background:var(--bg-surface-hover); color:var(--text-muted); text-transform:uppercase; font-size:0.75rem; font-weight:700">
                            <tr>
                                <th style="padding:16px; text-align:left; border-bottom:1px solid var(--border-color)">Recibo</th>
                                <th style="padding:16px; text-align:left; border-bottom:1px solid var(--border-color)">Fecha</th>
                                <th style="padding:16px; text-align:left; border-bottom:1px solid var(--border-color)">Obrero</th>
                                <th style="padding:16px; text-align:left; border-bottom:1px solid var(--border-color)">Período</th>
                                <th style="padding:16px; text-align:right; border-bottom:1px solid var(--border-color)">Ganado ($)</th>
                                <th style="padding:16px; text-align:right; border-bottom:1px solid var(--border-color)">Desc. ($)</th>
                                <th style="padding:16px; text-align:right; border-bottom:1px solid var(--border-color)">Neto ($)</th>
                                <th style="padding:16px; text-align:center; border-bottom:1px solid var(--border-color)">Estado</th>
                                <th style="padding:16px; text-align:center; border-bottom:1px solid var(--border-color)"></th>
                            </tr>
                        </thead>
                        <tbody id="pagos-body" class="tabular-data"></tbody>
                    </table>
                </div>
            </div>
            <style>
                .nomina-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr; gap: 0.5rem; padding: 12px 16px; border-bottom: 1px solid var(--border-color); align-items: center; }
                .nomina-header { font-weight: 700; background: var(--bg-surface-hover); font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); border-bottom: none!important; }
            </style>
        `;

        // Render tab content and history
        this.renderTabContent();
        Pagos.loadHistorial();
        if (window.lucide) window.lucide.createIcons();
    },

    changeTab(tab) {
        this.currentTab = tab;
        this.render();
    },

    async renderTabContent() {
        const content = document.getElementById('pg-tab-content');
        content.innerHTML = `<div style="padding:40px; text-align:center"><i data-lucide="loader-2" class="spin" style="width:32px;height:32px;color:var(--color-primary)"></i></div>`;
        if (window.lucide) window.lucide.createIcons();

        if (this.currentTab === 'semanal') {
            await this.renderSemanalView(content);
        } else {
            await this.renderIndividualView(content);
        }
    },

    // ============================================
    // VISTA: LOTE SEMANAL (Súper Liquidador)
    // ============================================
    async renderSemanalView(content) {
        const cicloActivo = await db.getCicloActivo();

        if (!cicloActivo) {
            content.innerHTML = `
                <div class="empty-state card-premium" style="padding:40px; text-align:center; background:var(--bg-surface)">
                    <i data-lucide="calendar-x" style="width:48px;height:48px;opacity:0.2;margin:0 auto 16px;display:block;color:var(--color-warning)"></i>
                    <h3 style="margin-bottom:8px">No hay un ciclo activo</h3>
                    <p class="text-muted" style="font-size:0.9rem">Abre una semana desde la pestaña de Configuración o Ciclos antes de intentar liquidar una nómina masiva.</p>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        content.innerHTML = `
            <div class="card-premium mb-2 animate-in" style="margin-bottom:16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
                <div>
                    <h3 style="margin:0; color:var(--text-main); font-size:1.1rem; display:flex; align-items:center; gap:8px">
                        <i data-lucide="calendar-check" style="color:var(--color-primary); width:20px; height:20px"></i> 
                        Nómina: ${cicloActivo.nombre}
                    </h3>
                    <p class="text-muted tabular-data" style="margin:4px 0 0; font-size:0.85rem">
                        Período: ${cicloActivo.fechaInicio} al ${cicloActivo.fechaFin}
                    </p>
                </div>
                <div>
                    <button class="btn-premium primary" onclick="Pagos.buildNominaSemanal()" id="btn-build-nomina">
                        <i data-lucide="calculator"></i> Calcular Consolidado
                    </button>
                </div>
            </div>
            
            <div id="pg-nomina-resultado">
                <div class="empty-state card-premium" style="padding:40px; text-align:center; color:var(--text-muted); border-style:dashed">
                    <i data-lucide="bar-chart-3" style="width:48px;height:48px;opacity:0.2;margin:0 auto 16px;display:block"></i>
                    <p>Presiona "Calcular Consolidado" para procesar y agrupar la nómina actual.</p>
                </div>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    },

    async buildNominaSemanal() {
        const btn = document.getElementById('btn-build-nomina');
        if (btn) { btn.disabled = true; btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Calculando...'; if (window.lucide) window.lucide.createIcons(); }

        const cicloActivo = await db.getCicloActivo();
        if (!cicloActivo) return;

        // Derive precioKilo from config (ciclos table doesn't store it directly)
        let precioKilo = await db.getConfig('tarifaKilo', 500);
        if (!precioKilo || precioKilo <= 0) precioKilo = 500;

        // Limpieza de estados
        this._nominaGlobal = {
            resumen: [],
            consolidado: { totalGanado: 0, totalComida: 0, totalTienda: 0, totalNeto: 0, obrerosValidos: 0 },
            cicloId: cicloActivo.id,
            fechaInicio: cicloActivo.fechaInicio,
            fechaFin: cicloActivo.fechaFin
        };

        const obreros = (await db.getByFinca('obreros')).filter(o => o.estado === 'activo');
        const todasVentas = await db.getByFinca('ventasCaja');
        const lotes = await db.getByFinca('lotes');
        const ltMap = Object.fromEntries(lotes.map(l => [l.id, l.nombre]));
        const globalComidaPorLote = {};
        lotes.forEach(l => { globalComidaPorLote[l.id] = 0; });

        let htmlRows = '';

        for (const o of obreros) {
            const jornales = await db.getJornalesByObreroAndRange(o.id, cicloActivo.fechaInicio, cicloActivo.fechaFin);
            const totalGanado = jornales.reduce((s, j) => {
                const kilosJornal = parseFloat(j.kilosRecolectados) || (parseFloat(j.kilosAM || 0) + parseFloat(j.kilosPM || 0)) || 0;
                let valorJornal = parseFloat(j.totalDia) || 0;
                if (valorJornal <= 0) {
                    if (j.tipoPago === 'dia') {
                        valorJornal = parseFloat(j.tarifaDia) || 40000;
                    } else {
                        const tarifaK = parseFloat(precioKilo) || 1000;
                        valorJornal = kilosJornal * tarifaK;
                    }
                }
                return s + valorJornal;
            }, 0);

            const comidas = await db.getComidaByObreroAndRange(o.id, cicloActivo.fechaInicio, cicloActivo.fechaFin);
            const totalComida = comidas.reduce((s, c) => s + (parseFloat(c.valor) || 0), 0);

            comidas.forEach(c => {
                if (c.loteId && globalComidaPorLote[c.loteId] !== undefined) {
                    globalComidaPorLote[c.loteId] += parseFloat(c.valor) || 0;
                }
            });

            const ventasFiadoPendiente = todasVentas.filter(v => v.obreroId === o.id && v.fiado && !v.pagado);
            const totalTienda = ventasFiadoPendiente.reduce((s, v) => s + (parseFloat(v.valorTotal) || 0), 0);

            const totalNeto = totalGanado - totalComida - totalTienda;

            // Filtro Anti-Ruido
            if (totalGanado === 0 && totalComida === 0 && totalTienda === 0) continue;

            this._nominaGlobal.resumen.push({
                obreroId: o.id,
                obreroNombre: o.nombre,
                jornales, comidas, ventasFiadoPendiente,
                totalGanado, totalComida, totalTienda, totalNeto
            });

            this._nominaGlobal.consolidado.totalGanado += totalGanado;
            this._nominaGlobal.consolidado.totalComida += totalComida;
            this._nominaGlobal.consolidado.totalTienda += totalTienda;
            this._nominaGlobal.consolidado.totalNeto += totalNeto;
            this._nominaGlobal.consolidado.obrerosValidos++;

            htmlRows += `
                <div class="nomina-row tabular-data" style="transition:background 0.2s; ${totalNeto < 0 ? 'background: rgba(239, 68, 68, 0.05)' : ''}" onmouseover="this.style.background='var(--bg-surface-hover)'" onmouseout="this.style.background='${totalNeto < 0 ? 'rgba(239, 68, 68, 0.05)' : 'transparent'}'">
                    <div style="font-weight:600; font-family:var(--font-family)">${o.nombre}</div>
                    <div style="color:var(--color-primary); font-weight:600">$${totalGanado.toLocaleString()}</div>
                    <div style="color:var(--color-danger)">-$${totalComida.toLocaleString()}</div>
                    <div style="color:var(--color-danger)">-$${totalTienda.toLocaleString()}</div>
                    <div style="font-weight:700; font-size:1.05rem; color:${totalNeto >= 0 ? 'var(--text-main)' : 'var(--color-danger)'}; display:flex; justify-content:flex-end">
                        $${totalNeto.toLocaleString()}
                    </div>
                </div>
            `;
        }

        const c = this._nominaGlobal.consolidado;
        const resEl = document.getElementById('pg-nomina-resultado');

        if (c.obrerosValidos === 0) {
            resEl.innerHTML = `
                <div class="card-premium text-center text-muted" style="padding:32px">
                    <i data-lucide="ghost" style="width:32px; height:32px; opacity:0.3; margin-bottom:12px"></i><br>
                    No hay movimientos financieros ni jornales procesables en esta semana.
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
        } else {
            const comidaLoteDistribucion = Object.entries(globalComidaPorLote)
                .map(([id, val]) => ({ nombre: ltMap[id] || '?', val }))
                .filter(item => item.val > 0)
                .sort((a, b) => b.val - a.val);

            let htmlComidaPorLote = '';
            if (comidaLoteDistribucion.length > 0) {
                htmlComidaPorLote = `
                    <div class="card-premium mb-2 animate-in" style="margin-bottom:24px; background:linear-gradient(145deg, var(--bg-surface) 0%, rgba(239, 68, 68, 0.02) 100%)!important; border:1px solid rgba(239, 68, 68, 0.2)">
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px">
                            <i data-lucide="utensils-crossed" style="color:var(--color-danger); width:18px; height:18px"></i>
                            <h4 style="margin:0; font-size:0.9rem; text-transform:uppercase; font-weight:700; color:var(--text-main)">Distribución de Comida por Lote (Gasto/Deuda)</h4>
                        </div>
                        <div style="display:flex; flex-wrap:wrap; gap:16px">
                            ${comidaLoteDistribucion.map(item => `
                                <div style="flex:1; min-width:150px; background:var(--bg-app); border:1px solid var(--border-color); padding:10px 14px; border-radius:10px; display:flex; justify-content:space-between; align-items:center">
                                    <span style="font-weight:600; font-size:0.85rem; color:var(--text-muted)">${item.nombre}</span>
                                    <span class="tabular-data" style="font-weight:800; font-size:1rem; color:var(--color-danger)">$${item.val.toLocaleString()}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            resEl.innerHTML = `
                <!-- Cabecera Totales Globales -->
                <div class="grid-4 mb-2 animate-in tabular-data" style="margin-bottom:24px; gap:8px">
                    <div class="card-premium" style="background:var(--bg-app)!important; padding:12px">
                        <div class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:600; margin-bottom:4px"><i data-lucide="coins" style="width:12px; height:12px; display:inline-block; vertical-align:middle; margin-right:4px"></i> Pn. Total Ganado</div>
                        <div style="font-size:1.2rem; font-weight:700; color:var(--color-primary)">+$${c.totalGanado.toLocaleString()}</div>
                    </div>
                    <div class="card-premium" style="background:var(--bg-app)!important; padding:12px">
                        <div class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:600; margin-bottom:4px"><i data-lucide="utensils" style="width:12px; height:12px; display:inline-block; vertical-align:middle; margin-right:4px"></i> Desc. Comedor</div>
                        <div style="font-size:1.2rem; font-weight:700; color:var(--color-danger)">-$${c.totalComida.toLocaleString()}</div>
                    </div>
                    <div class="card-premium" style="background:var(--bg-app)!important; padding:12px">
                        <div class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:600; margin-bottom:4px"><i data-lucide="shopping-basket" style="width:12px; height:12px; display:inline-block; vertical-align:middle; margin-right:4px"></i> Desc. Fiados (Tienda)</div>
                        <div style="font-size:1.2rem; font-weight:700; color:var(--color-danger)">-$${c.totalTienda.toLocaleString()}</div>
                    </div>
                    <div class="card-premium" style="background:var(--bg-surface-hover)!important; padding:12px; border-color:var(--color-primary)!important">
                        <div class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:600; margin-bottom:4px">💰 DESEMBOLSO NETO</div>
                        <div style="font-size:1.3rem; font-weight:800; color:var(--text-main)">$${c.totalNeto.toLocaleString()}</div>
                    </div>
                </div>

                ${htmlComidaPorLote}

                <!-- Tabla de Obreros -->
                <div class="card-premium animate-in" style="padding:0; overflow:hidden; margin-bottom:24px">
                    <div class="nomina-row nomina-header">
                        <div>Obrero (${c.obrerosValidos})</div>
                        <div>+ Ganado</div>
                        <div>- Comida</div>
                        <div>- Tienda</div>
                        <div style="text-align:right">= Neto a Pagar</div>
                    </div>
                    <div style="max-height: 50vh; overflow-y: auto;">
                        ${htmlRows}
                    </div>
                </div>

                <div style="display:flex; gap:12px;">
                    <button class="btn-premium secondary flex-1" onclick="Pagos.exportarNominaPDF()">
                        <i data-lucide="file-text"></i> Imprimir Planilla (PDF)
                    </button>
                    <button class="btn-premium flex-1" style="background:var(--color-brand); color:#fff; border:none" onclick="Pagos.guardarNominaBatch()" ${c.totalNeto <= 0 ? 'disabled' : ''}>
                        <i data-lucide="save"></i> Procesar Cierre y Pagar
                    </button>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
        }

        if (btn) { btn.disabled = false; btn.innerHTML = '<i data-lucide="calculator"></i> Calcular Consolidado'; if (window.lucide) window.lucide.createIcons(); }
    },

    async guardarNominaBatch() {
        if (!this._nominaGlobal || this._nominaGlobal.resumen.length === 0) return;

        const c = this._nominaGlobal.consolidado;
        if (c.totalNeto <= 0) return App.toast('⚠️ El consolidado neto es $0', 'error');

        // Candado de 5 dígitos

        try {
            const ok = await App.confirmWithCode({
                action: 'Cierre de Nómina',
                details: `
                    - Trabajadores a liquidar: <strong>${c.obrerosValidos}</strong><br>
                    - Dinero a desembolsar: <strong style="color:var(--color-primary)">$${c.totalNeto.toLocaleString()}</strong><br>
                    <em>Se generarán comprobantes automáticos y se saldarán las deudas.</em>
                `,
                timeoutSeconds: 45
            });

            if (!ok) return;

            App.alert({ title: 'Procesando...', message: 'Asentando registros en la base de datos local.', type: 'info', icon: '⏳', buttonText: 'Esperar' });

            const fincaId = db.getFincaActiva();
            const fechaPago = new Date().toLocaleDateString('en-CA');
            const opsConfigPagos = [];
            const opsActualizarFiados = [];

            const allPagos = await db.getByFinca('pagos');
            let nextId = allPagos.length + 1;
            const currentYear = new Date().getFullYear();

            for (const r of this._nominaGlobal.resumen) {
                const reciboId = `PAY-${currentYear}-${String(nextId++).padStart(4, '0')}`;

                const pagoData = {
                    reciboId,
                    obreroId: r.obreroId,
                    fechaInicio: this._nominaGlobal.fechaInicio,
                    fechaFin: this._nominaGlobal.fechaFin,
                    totalGanado: r.totalGanado,
                    descComida: r.totalComida,
                    descCaja: r.totalTienda,
                    netoAPagar: r.totalNeto,
                    estado: 'pagado',
                    metodoPago: 'efectivo',
                    fiadoDescontado: r.totalTienda > 0,
                    createdAt: Date.now(),
                    fechaPago: fechaPago,
                    fincaId: fincaId,
                    cicloId: this._nominaGlobal.cicloId,
                    nominaLote: true
                };
                opsConfigPagos.push(db.add('pagos', pagoData));

                // Cancelar Vales / Fiados de tienda de este obrero
                if (r.totalTienda > 0 && r.ventasFiadoPendiente.length > 0) {
                    for (const v of r.ventasFiadoPendiente) {
                        v.pagado = true;
                        v.fechaPago = fechaPago;
                        opsActualizarFiados.push(db.put('ventasCaja', v));
                    }
                }
            }

            await Promise.all([...opsConfigPagos, ...opsActualizarFiados]);

            // Try to force close the alert using internal method since closeAlert doesn't exist
            const activeAlert = document.querySelector('.modal-system-overlay');
            if (activeAlert) App._closeSystemModal(activeAlert);

            App.toast(`Nómina cerrada para ${c.obrerosValidos} trabajadores.`, 'success');

            this._nominaGlobal = null;
            document.getElementById('pg-nomina-resultado').innerHTML = '';
            this.loadHistorial();

        } catch (e) {
            console.error(e);
            App.alert({ title: 'Error Crítico', message: 'Fallo al asentar la nómina en disco.', type: 'error' });
        }
    },

    exportarNominaPDF() {
        if (!this._nominaGlobal || this._nominaGlobal.resumen.length === 0) return App.toast('No hay datos para exportar', 'error');

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const c = this._nominaGlobal.consolidado;

            // Membrete
            doc.setFontSize(18);
            doc.text('CaféControl - Planilla de Nómina', 14, 20);

            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`Período Activo: ${this._nominaGlobal.fechaInicio} al ${this._nominaGlobal.fechaFin}`, 14, 28);
            doc.text(`Total Trabajadores Liquidados: ${c.obrerosValidos}`, 14, 34);
            doc.text(`Total Desembolso (Neto): $${c.totalNeto.toLocaleString()}`, 14, 40);

            // Columnas auto-table
            const tableColumn = ["Obrero", "Ganado", "Desc. Comida", "Desc. Tienda", "Neto a Pagar", "Firma Recibido"];
            const tableRows = [];

            this._nominaGlobal.resumen.forEach(r => {
                const rowData = [
                    r.obreroNombre,
                    `$${r.totalGanado.toLocaleString()}`,
                    `-$${r.totalComida.toLocaleString()}`,
                    `-$${r.totalTienda.toLocaleString()}`,
                    `$${r.totalNeto.toLocaleString()}`,
                    "" // Espacio para firma manual
                ];
                tableRows.push(rowData);
            });

            // Agrega row de totalidad
            tableRows.push([
                { content: 'TOTALES', styles: { fontStyle: 'bold' } },
                { content: `$${c.totalGanado.toLocaleString()}`, styles: { fontStyle: 'bold', textColor: [22, 163, 74] } },
                { content: `-$${c.totalComida.toLocaleString()}`, styles: { fontStyle: 'bold', textColor: [239, 68, 68] } },
                { content: `-$${c.totalTienda.toLocaleString()}`, styles: { fontStyle: 'bold', textColor: [239, 68, 68] } },
                { content: `$${c.totalNeto.toLocaleString()}`, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
                ""
            ]);

            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 48,
                theme: 'grid',
                headStyles: { fillColor: [31, 41, 55], textColor: [255, 255, 255] },
                styles: { fontSize: 9 },
                columnStyles: {
                    1: { halign: 'right' },
                    2: { halign: 'right', textColor: [239, 68, 68] },
                    3: { halign: 'right', textColor: [239, 68, 68] },
                    4: { halign: 'right', fontStyle: 'bold' },
                    5: { cellWidth: 35 } // Ancho extra para la firma
                }
            });

            doc.save(`Nomina_Semanal_${this._nominaGlobal.fechaFin}.pdf`);
            App.toast('PDF Exportado Correctamente', 'success');
        } catch (e) {
            console.error('Error generando PDF:', e);
            App.alert({ title: 'Error de Exportación', message: 'No se pudo generar la planilla PDF.', type: 'error' });
        }
    },


    // ============================================
    // VISTA: INDIVIDUAL
    // ============================================
    async renderIndividualView(content) {
        const obreros = (await db.getByFinca('obreros')).filter(o => o.estado === 'activo');
        const hoy = new Date();
        const hace15 = new Date(hoy);
        hace15.setDate(hace15.getDate() - 15);

        content.innerHTML = `
            <div class="card-premium mb-2 animate-in" style="margin-bottom:24px">
                <div class="header-premium" style="margin-bottom:16px;">
                    <div class="header-icon"><i data-lucide="calculator"></i></div>
                    <div>
                        <h3 style="margin:0; font-size:1.1rem">Generar Liquidación Individual</h3>
                    </div>
                </div>
                
                <form onsubmit="Pagos.calcular(event)">
                    <div class="input-group" style="margin-bottom:16px">
                        <label class="text-muted" style="font-size:0.8rem;text-transform:uppercase;font-weight:600;display:block;margin-bottom:8px">Obrero</label>
                        <select class="input-premium" id="pg-obrero" required>
                            <option value="">Seleccionar trabajador...</option>
                            ${obreros.map(o => `<option value="${o.id}">${o.nombre}</option>`).join('')}
                        </select>
                    </div>
                    <div class="grid-2" style="margin-bottom:24px">
                        <div class="input-group">
                            <label class="text-muted" style="font-size:0.8rem;text-transform:uppercase;font-weight:600;display:block;margin-bottom:8px">Fecha de inicio</label>
                            <input type="date" class="input-premium" id="pg-inicio" value="${hace15.toLocaleDateString('en-CA')}" max="${hoy.toLocaleDateString('en-CA')}" required>
                        </div>
                        <div class="input-group">
                            <label class="text-muted" style="font-size:0.8rem;text-transform:uppercase;font-weight:600;display:block;margin-bottom:8px">Fecha de corte</label>
                            <input type="date" class="input-premium" id="pg-fin" value="${hoy.toLocaleDateString('en-CA')}" max="${hoy.toLocaleDateString('en-CA')}" required>
                        </div>
                    </div>
                    <button type="submit" class="btn-premium primary" style="width:100%" id="btn-calc-pago">
                        <i data-lucide="search"></i> Consultar y Liquidar
                    </button>
                </form>
            </div>

            <div id="pg-resultado"></div>
        `;
        if (window.lucide) window.lucide.createIcons();
    },

    async calcular(e) {
        e.preventDefault();

        const obreroId = parseInt(document.getElementById('pg-obrero').value);
        const fechaInicio = document.getElementById('pg-inicio').value;
        const fechaFin = document.getElementById('pg-fin').value;

        if (!obreroId) return App.toast('Selecciona un obrero', 'error');

        if (fechaInicio > fechaFin) {
            return App.toast('La fecha de inicio no puede ser mayor a la fecha de fin', 'error');
        }

        const btnCalc = document.getElementById('btn-calc-pago');
        if (btnCalc) { btnCalc.disabled = true; btnCalc.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Calculando...'; if (window.lucide) window.lucide.createIcons(); }

        // Verificar pagos solapados
        let pagosSolapados = await db.getPagosSolapados(obreroId, fechaInicio, fechaFin);
        pagosSolapados = pagosSolapados.filter(p => p.estado !== 'anulado');

        const obrero = await db.get('obreros', obreroId);
        const jornales = await db.getJornalesByObreroAndRange(obreroId, fechaInicio, fechaFin);
        const comidas = await db.getComidaByObreroAndRange(obreroId, fechaInicio, fechaFin);
        const ventas = await db.getVentasByObreroAndRange(obreroId, fechaInicio, fechaFin);

        // All pending shop debt
        const todasVentas = await db.getAllByIndex('ventasCaja', 'obreroId', obreroId);
        const ventasFiadoPendiente = todasVentas.filter(v => v.fiado && !v.pagado);

        // Determine the ciclo that actually covers this date range (may be historical/inactive)
        const cicloDelPeriodo = await db.getCicloByDateRange(fechaInicio, fechaFin);
        const cicloActivo = await db.getCicloActivo();
        const cicloRef = cicloDelPeriodo || cicloActivo;
        const cicloIdParaPago = cicloRef ? cicloRef.id : 1;

        // Derive precioKilo: first from config, then fallback
        let precioKilo = await db.getConfig('tarifaKilo', 500);
        if (!precioKilo || precioKilo <= 0) precioKilo = 500;

        const totalGanado = jornales.reduce((s, j) => {
            const kilosJornal = parseFloat(j.kilosRecolectados) || (parseFloat(j.kilosAM || 0) + parseFloat(j.kilosPM || 0)) || 0;
            // Use stored totalDia first (most accurate = totaldia en DB), then recalculate
            let valorJornal = parseFloat(j.totalDia) || 0;
            if (valorJornal <= 0) {
                const tarifaGuardada = parseFloat(j.tarifaDia) || 0;
                if (j.tipoPago === 'dia') {
                    valorJornal = tarifaGuardada || 40000;
                } else {
                    // tarifaDia in kilo-type jornals stores the rate per kilo
                    valorJornal = kilosJornal * (tarifaGuardada || parseFloat(precioKilo) || 500);
                }
            }
            return s + valorJornal;
        }, 0);
        const totalKilos = jornales.reduce((s, j) => s + (parseFloat(j.kilosRecolectados) || 0), 0);
        const descComida = comidas.reduce((s, c) => s + (parseFloat(c.valor) || 0), 0);
        const descCajaPeriodo = ventas.reduce((s, v) => s + (parseFloat(v.valorTotal) || 0), 0);
        const deudaTotalFiado = ventasFiadoPendiente.reduce((s, v) => s + (parseFloat(v.valorTotal) || 0), 0);

        const lotes = await db.getByFinca('lotes');
        const ltMap = Object.fromEntries(lotes.map(l => [l.id, l.nombre]));
        const productos = await db.getByFinca('productos');
        const prMap = Object.fromEntries(productos.map(p => [p.id, p.nombre]));

        Pagos._liquidacion = {
            obreroId, obrero, fechaInicio, fechaFin,
            jornales, comidas, ventas, ventasFiadoPendiente,
            totalGanado, totalKilos, descComida, descCajaPeriodo,
            deudaTotalFiado, ltMap, prMap,
            pagosSolapados,
            cicloId: cicloIdParaPago,
            precioKilo,
            // wizard properties
            wizardStep: 1,
            descComidaActive: descComida > 0,
            descTiendaActive: deudaTotalFiado > 0,
            descTransporteActive: false,
            descTransporteValor: 0
        };

        Pagos._renderResultado();
        if (btnCalc) { btnCalc.disabled = false; btnCalc.innerHTML = '<i data-lucide="search"></i> Consultar y Liquidar'; if (window.lucide) window.lucide.createIcons(); }
    },

    _renderResultado() {
        const d = Pagos._liquidacion;
        if (!d) return;

        const descComida = d.descComidaActive ? d.descComida : 0;
        const descCaja = d.descTiendaActive ? d.deudaTotalFiado : 0;
        const descTransporte = d.descTransporteActive ? d.descTransporteValor : 0;
        const netoAPagar = d.totalGanado - descComida - descCaja - descTransporte;
        const totalDescuentos = descComida + descCaja + descTransporte;

        const container = document.getElementById('pg-resultado');
        if (!container) return;

        // Progress bar calculation for harvest target (120 kg)
        const targetKilos = 120;
        const harvestPct = Math.min(Math.round((d.totalKilos / targetKilos) * 100), 100);

        let stepHtml = '';

        if (d.wizardStep === 1) {
            // STEP 1: RENDIMIENTO BRUTO
            stepHtml = `
                <div class="animate-in">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                        <h4 style="margin:0; font-size:1.1rem; display:flex; align-items:center; gap:8px">
                            <i data-lucide="award" style="color:var(--color-primary)"></i> Paso 1: Rendimiento de Cosecha & Ganado Bruto
                        </h4>
                    </div>

                    <!-- Meta / Progress Bar -->
                    <div style="background:var(--bg-app); border:1px solid var(--border-color); border-radius:12px; padding:16px; margin-bottom:24px;">
                        <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:8px">
                            <span style="color:var(--text-muted)">Progreso de Cosecha Semanal: <strong>${d.totalKilos.toLocaleString()} kg</strong></span>
                            <span style="font-weight:700; color:var(--color-primary)">${harvestPct}% de la Meta (${targetKilos} kg)</span>
                        </div>
                        <div style="height:12px; background:var(--bg-surface-hover); border-radius:6px; overflow:hidden; border:1px solid var(--border-color)">
                            <div style="width:${harvestPct}%; height:100%; background:linear-gradient(90deg, var(--color-primary) 0%, #22c55e 100%); border-radius:6px; transition:width 0.4s ease-out"></div>
                        </div>
                        <p class="text-muted" style="margin:8px 0 0; font-size:0.8rem">
                            ${d.totalKilos >= targetKilos 
                                ? '🎉 ¡Extraordinario! Ha superado la meta promedio recomendada.' 
                                : `Faltan ${(targetKilos - d.totalKilos).toLocaleString()} kg para alcanzar la meta del ciclo.`}
                        </p>
                    </div>

                    <!-- Gross Earnings Display Card -->
                    <div class="card-premium" style="background:linear-gradient(135deg, rgba(22, 163, 74, 0.04) 0%, rgba(34, 197, 94, 0.01) 100%)!important; border:1px solid rgba(22, 163, 74, 0.15); padding:24px; text-align:center; margin-bottom:24px; border-radius:16px">
                        <span class="text-muted" style="font-size:0.8rem; text-transform:uppercase; font-weight:700; letter-spacing:0.05em">Ganancia Bruta Acumulada</span>
                        <h2 style="font-size:3rem; font-weight:900; color:var(--color-primary); margin:8px 0">$${d.totalGanado.toLocaleString()}</h2>
                        <p style="margin:0; font-size:0.9rem; color:var(--text-muted)">
                            Monto bruto calculado sobre <strong>${d.totalKilos.toLocaleString()} kg</strong> de café recolectados en <strong>${d.jornales.length} días</strong>.
                        </p>
                    </div>

                    <!-- Detailed Jornales Table -->
                    <p class="text-muted" style="font-size:0.85rem; text-transform:uppercase; font-weight:700; margin-bottom:12px; display:flex; align-items:center; gap:6px">
                        <i data-lucide="calendar-days" style="width:14px; height:14px"></i> 
                        Desglose Diario de Cosecha
                    </p>
                    <div class="table-wrapper card-premium" style="padding:0; overflow:hidden; margin-bottom:24px; max-height: 250px; overflow-y: auto;">
                        <table style="width:100%; border-collapse:collapse">
                            <thead style="background:var(--bg-surface-hover); color:var(--text-muted); text-transform:uppercase; font-size:0.7rem; font-weight:700">
                                <tr>
                                    <th style="padding:10px 16px; text-align:left; border-bottom:1px solid var(--border-color)">Fecha / Lote</th>
                                    <th style="padding:10px 16px; text-align:right; border-bottom:1px solid var(--border-color)">Kilos</th>
                                    <th style="padding:10px 16px; text-align:right; border-bottom:1px solid var(--border-color)">Bruto ($)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${d.jornales.length === 0 ? '<tr><td colspan="3" style="padding:24px; text-align:center; color:var(--text-muted)">Sin jornales en este período</td></tr>' :
                                d.jornales.map(j => {
                                    const kilosJornal = parseFloat(j.kilosRecolectados) || (parseFloat(j.kilosAM || 0) + parseFloat(j.kilosPM || 0)) || 0;
                                    let valorJornal = parseFloat(j.totalDia) || 0;
                                    if (valorJornal <= 0) {
                                        if (j.tipoPago === 'dia') {
                                            valorJornal = parseFloat(j.tarifaDia) || 40000;
                                        } else {
                                            const tarifaK = parseFloat(d.precioKilo) || 1000;
                                            valorJornal = kilosJornal * tarifaK;
                                        }
                                    }
                                    return `
                                        <tr style="border-bottom:1px solid var(--border-color)">
                                            <td style="padding:10px 16px;">
                                                <div style="font-weight:600">${j.fecha}</div>
                                                <div class="text-muted" style="font-size:0.75rem">${d.ltMap[j.loteId] || 'Lote Eliminado'}</div>
                                            </td>
                                            <td style="padding:10px 16px; text-align:right"><strong>${kilosJornal.toLocaleString()}</strong> kg</td>
                                            <td style="padding:10px 16px; text-align:right; font-weight:600; color:var(--color-primary)">$${valorJornal.toLocaleString()}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>

                    <!-- Step Controls -->
                    <div style="display:flex; justify-content:flex-end; margin-top:24px">
                        <button class="btn-premium primary" style="padding:12px 24px" onclick="Pagos.changeWizardStep(2)">
                            Siguiente: Deducciones Claras <i data-lucide="arrow-right"></i>
                        </button>
                    </div>
                </div>
            `;
        } else if (d.wizardStep === 2) {
            // STEP 2: DEDUCCIONES CLARAS
            stepHtml = `
                <div class="animate-in">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                        <h4 style="margin:0; font-size:1.1rem; display:flex; align-items:center; gap:8px">
                            <i data-lucide="sliders" style="color:var(--color-primary)"></i> Paso 2: Exoneraciones & Ajuste de Descuentos
                        </h4>
                    </div>

                    <!-- Live Summary Header -->
                    <div style="background:var(--bg-app); border:1px solid var(--border-color); border-radius:12px; padding:16px; margin-bottom:24px; display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <span style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700">Neto Sugerido Reactivo</span>
                            <h3 id="live-neto-sugerido" style="margin:4px 0 0; font-size:1.7rem; font-weight:800; color: ${netoAPagar >= 0 ? 'var(--color-primary)' : 'var(--color-danger)'}">$${netoAPagar.toLocaleString()}</h3>
                        </div>
                        <div style="text-align:right">
                            <span style="font-size:0.75rem; color:var(--text-muted); display:block">Bruto: +$${d.totalGanado.toLocaleString()}</span>
                            <span id="live-descuentos-total" style="font-size:0.75rem; color:var(--color-danger); display:block">Descuentos: -$${totalDescuentos.toLocaleString()}</span>
                        </div>
                    </div>

                    <!-- Deducciones Grid / Container -->
                    <div style="display:flex; flex-direction:column; gap:16px; margin-bottom:24px">
                        
                        <!-- 1. Comida Card -->
                        <div class="card-premium deduccion-card ${d.descComidaActive ? 'active' : 'inactive'}" style="padding:16px; border-radius:12px">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start">
                                <div style="display:flex; gap:12px; align-items:center">
                                    <div style="width:36px; height:36px; border-radius:50%; background:rgba(239, 68, 68, 0.1); color:var(--color-danger); display:flex; align-items:center; justify-content:center"><i data-lucide="utensils" style="width:18px;height:18px"></i></div>
                                    <div>
                                        <h5 style="margin:0; font-size:0.95rem; font-weight:700">Alimentación / Comedor</h5>
                                        <p class="text-muted" style="margin:2px 0 0; font-size:0.8rem">Acumulado en cocina por comida del obrero</p>
                                    </div>
                                </div>
                                <div style="display:flex; align-items:center; gap:12px">
                                    <span style="font-size:1.15rem; font-weight:800; color:var(--color-danger)">-$${d.descComida.toLocaleString()}</span>
                                    <label class="switch-premium">
                                        <input type="checkbox" ${d.descComidaActive ? 'checked' : ''} onchange="Pagos.toggleDeduccion('comida', this.checked)">
                                        <span class="slider-premium"></span>
                                    </label>
                                </div>
                            </div>
                            ${d.descComidaActive && d.comidas.length > 0 ? `
                                <div style="margin-top:12px; border-top:1px solid var(--border-color); padding-top:12px; max-height:120px; overflow-y:auto;">
                                    <table style="width:100%; font-size:0.8rem">
                                        <tbody>
                                            ${d.comidas.map(c => `
                                                <tr>
                                                    <td style="padding:4px 0; color:var(--text-muted)">${c.fecha} &middot; ${c.tipo}</td>
                                                    <td style="padding:4px 0; text-align:right; font-weight:600; color:var(--color-danger)">-$${(c.valor || 0).toLocaleString()}</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            ` : ''}
                        </div>

                        <!-- 2. Tienda Card -->
                        <div class="card-premium deduccion-card ${d.descTiendaActive ? 'active' : 'inactive'}" style="padding:16px; border-radius:12px">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start">
                                <div style="display:flex; gap:12px; align-items:center">
                                    <div style="width:36px; height:36px; border-radius:50%; background:rgba(239, 68, 68, 0.1); color:var(--color-danger); display:flex; align-items:center; justify-content:center"><i data-lucide="shopping-basket" style="width:18px;height:18px"></i></div>
                                    <div>
                                        <h5 style="margin:0; font-size:0.95rem; font-weight:700">Fiados de Tienda (Créditos)</h5>
                                        <p class="text-muted" style="margin:2px 0 0; font-size:0.8rem">Compras y anticipos del almacén de la finca</p>
                                    </div>
                                </div>
                                <div style="display:flex; align-items:center; gap:12px">
                                    <span style="font-size:1.15rem; font-weight:800; color:var(--color-danger)">-$${d.deudaTotalFiado.toLocaleString()}</span>
                                    <label class="switch-premium">
                                        <input type="checkbox" ${d.descTiendaActive ? 'checked' : ''} onchange="Pagos.toggleDeduccion('tienda', this.checked)">
                                        <span class="slider-premium"></span>
                                    </label>
                                </div>
                            </div>
                            ${d.descTiendaActive && d.ventasFiadoPendiente.length > 0 ? `
                                <div style="margin-top:12px; border-top:1px solid var(--border-color); padding-top:12px; max-height:120px; overflow-y:auto;">
                                    <table style="width:100%; font-size:0.8rem">
                                        <tbody>
                                            ${d.ventasFiadoPendiente.map(v => `
                                                <tr>
                                                    <td style="padding:4px 0; color:var(--text-muted)">${v.fecha || 'N/A'} &middot; Venta #${v.id}</td>
                                                    <td style="padding:4px 0; text-align:right; font-weight:600; color:var(--color-danger)">-$${(v.valorTotal || 0).toLocaleString()}</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            ` : ''}
                        </div>

                        <!-- 3. Transporte Card -->
                        <div class="card-premium deduccion-card ${d.descTransporteActive ? 'active' : 'inactive'}" style="padding:16px; border-radius:12px">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start">
                                <div style="display:flex; gap:12px; align-items:center">
                                    <div style="width:36px; height:36px; border-radius:50%; background:rgba(239, 68, 68, 0.1); color:var(--color-danger); display:flex; align-items:center; justify-content:center"><i data-lucide="truck" style="width:18px;height:18px"></i></div>
                                    <div>
                                        <h5 style="margin:0; font-size:0.95rem; font-weight:700">Flete de Transporte</h5>
                                        <p class="text-muted" style="margin:2px 0 0; font-size:0.8rem">Deducción extraordinaria por fletes/viajes</p>
                                    </div>
                                </div>
                                <div style="display:flex; align-items:center; gap:12px">
                                    <span style="font-size:1.15rem; font-weight:800; color:var(--color-danger)">-$${d.descTransporteValor.toLocaleString()}</span>
                                    <label class="switch-premium">
                                        <input type="checkbox" ${d.descTransporteActive ? 'checked' : ''} onchange="Pagos.toggleDeduccion('transporte', this.checked)">
                                        <span class="slider-premium"></span>
                                    </label>
                                </div>
                            </div>
                            
                            <div style="margin-top:12px; display: ${d.descTransporteActive ? 'block' : 'none'}; border-top:1px solid var(--border-color); padding-top:12px;">
                                <label style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--text-muted); display:block; margin-bottom:6px">Ingrese el valor del flete ($)</label>
                                <input type="number" class="input-premium" style="padding:8px 12px; width:100%" placeholder="0" value="${d.descTransporteValor || ''}" oninput="Pagos.updateFleteValor(this.value)">
                            </div>
                        </div>
                    </div>

                    <!-- Step Controls -->
                    <div style="display:flex; justify-content:space-between; margin-top:24px; gap:12px">
                        <button class="btn-premium secondary flex-1" onclick="Pagos.changeWizardStep(1)">
                            <i data-lucide="arrow-left"></i> Atrás: Rendimiento
                        </button>
                        <button class="btn-premium primary flex-1" onclick="Pagos.changeWizardStep(3)">
                            Siguiente: Finalizar Pago <i data-lucide="arrow-right"></i>
                        </button>
                    </div>
                </div>
            `;
        } else if (d.wizardStep === 3) {
            // STEP 3: NETO REAL & DESPACHO
            stepHtml = `
                <div class="animate-in">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                        <h4 style="margin:0; font-size:1.1rem; display:flex; align-items:center; gap:8px">
                            <i data-lucide="check-square" style="color:var(--color-primary)"></i> Paso 3: Cierre de Liquidación & Desembolso
                        </h4>
                    </div>

                    <!-- Grand Neto Real Display -->
                    <div class="card-premium" style="background:var(--bg-surface-hover)!important; border-radius:16px; border:2px solid ${netoAPagar >= 0 ? 'var(--color-primary)' : 'var(--color-danger)'}; padding:32px; text-align:center; margin-bottom:24px">
                        <span style="font-size:0.8rem; text-transform:uppercase; font-weight:700; color:var(--text-muted); letter-spacing:0.05em">NETO TOTAL LIQUIDADO</span>
                        <h1 style="font-size:3.5rem; font-weight:900; color:${netoAPagar >= 0 ? 'var(--color-primary)' : 'var(--color-danger)'}; margin:12px 0">$${netoAPagar.toLocaleString()}</h1>
                        <p style="margin:0 0 20px; font-size:0.9rem; color:var(--text-muted)">
                            Resumen final del desembolso a favor de <strong>${d.obrero.nombre}</strong>.
                        </p>

                        <!-- Modalidad Selector in step 3 -->
                        <div style="max-width:300px; margin: 0 auto; text-align:left">
                            <label class="text-muted" style="font-size:0.75rem;text-transform:uppercase;font-weight:600;display:block;margin-bottom:6px">Modalidad de Desembolso</label>
                            <select class="input-premium" id="pg-metodo-pago" style="padding:8px 12px; width:100%">
                                <option value="efectivo">Efectivo 💵</option>
                                <option value="transferencia">Bancos / Transferencia 🏦</option>
                            </select>
                        </div>
                    </div>

                    <!-- Final Breakdown Invoice Card -->
                    <div class="card-premium" style="background:var(--bg-app)!important; padding:16px; margin-bottom:24px; border:1px solid var(--border-color); border-radius:12px">
                        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border-color)">
                            <span class="text-muted">Total Cosecha Bruta (+):</span>
                            <span style="font-weight:700; color:var(--color-primary)">+$${d.totalGanado.toLocaleString()}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border-color); opacity: ${d.descComidaActive ? '1' : '0.4'}">
                            <span class="text-muted">Alimentación / Comedor (-):</span>
                            <span style="font-weight:600; color:var(--color-danger)">-${d.descComidaActive ? `$${d.descComida.toLocaleString()}` : '$0 (Exonerado)'}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border-color); opacity: ${d.descTiendaActive ? '1' : '0.4'}">
                            <span class="text-muted">Fiados de Tienda (-):</span>
                            <span style="font-weight:600; color:var(--color-danger)">-${d.descTiendaActive ? `$${d.deudaTotalFiado.toLocaleString()}` : '$0 (Exonerado)'}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border-color); opacity: ${d.descTransporteActive ? '1' : '0.4'}">
                            <span class="text-muted">Flete de Transporte (-):</span>
                            <span style="font-weight:600; color:var(--color-danger)">-${d.descTransporteActive ? `$${d.descTransporteValor.toLocaleString()}` : '$0'}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; padding:12px 0 0; font-size:1.25rem; font-weight:900">
                            <span>NETO REAL FINAL:</span>
                            <span>$${netoAPagar.toLocaleString()}</span>
                        </div>
                    </div>

                    <!-- Date Overlap Check warnings (if d.pagosSolapados has items) -->
                    ${d.pagosSolapados && d.pagosSolapados.length > 0 ? `
                        <div class="card-premium" style="background:rgba(239, 68, 68, 0.1)!important; border:1px solid var(--color-danger)!important; padding:16px; margin-bottom:24px">
                            <p style="font-weight:700; color:var(--color-danger); margin:0 0 8px; display:flex; align-items:center; gap:8px"><i data-lucide="alert-triangle"></i> Cruce de Fechas Detectado</p>
                            <p class="text-muted" style="font-size:0.85rem; margin:0 0 12px">Este trabajador ya tiene pagos asentados que cruzan estas mismas fechas.</p>
                            ${d.pagosSolapados.map(p => `
                                <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid rgba(239,68,68,0.2); font-size:0.85rem">
                                    <span><i data-lucide="calendar" style="width:12px;height:12px;vertical-align:-1px;margin-right:4px"></i> ${p.fechaInicio} al ${p.fechaFin}</span>
                                    <span style="font-weight:700; color:var(--text-main)">$${(p.netoAPagar || 0).toLocaleString()}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}

                    <!-- Action Dispatches Buttons Group -->
                    <div style="display:flex; flex-wrap:wrap; gap:12px;">
                        <button class="btn-premium secondary flex-1" style="min-width:140px" onclick="Pagos.changeWizardStep(2)">
                            <i data-lucide="arrow-left"></i> Deducciones
                        </button>
                        
                        <button class="btn-premium secondary flex-1" style="min-width:140px" onclick="Pagos.imprimirReciboPDFWizard()">
                            <i data-lucide="printer"></i> Recibo (PDF)
                        </button>
                        
                        <button class="btn-premium flex-1" style="min-width:140px; background:#25D366; color:#fff; border:none" onclick="Pagos.compartirWhatsAppWizard()">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px; display:inline-block; vertical-align:middle"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                            WhatsApp
                        </button>

                        <button class="btn-premium flex-1" style="min-width:180px; background:var(--color-primary); color:#fff; border:none" onclick="Pagos.confirmarPagoWizard()"
                            ${d.pagosSolapados && d.pagosSolapados.length > 0 ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}>
                            ${d.pagosSolapados && d.pagosSolapados.length > 0 ? '<i data-lucide="lock"></i> Solapado' : '<i data-lucide="check-circle"></i> Asentar Pago'}
                        </button>
                    </div>
                </div>
            `;
        }

        container.innerHTML = `
            <!-- Switch CSS styles -->
            <style>
                .switch-premium {
                    position: relative;
                    display: inline-block;
                    width: 46px;
                    height: 24px;
                }
                .switch-premium input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .slider-premium {
                    position: absolute;
                    cursor: pointer;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background-color: var(--border-color);
                    transition: .3s;
                    border-radius: 24px;
                }
                .slider-premium:before {
                    position: absolute;
                    content: "";
                    height: 18px;
                    width: 18px;
                    left: 3px;
                    bottom: 3px;
                    background-color: #fff;
                    transition: .3s;
                    border-radius: 50%;
                }
                .switch-premium input:checked + .slider-premium {
                    background-color: var(--color-primary);
                }
                .switch-premium input:checked + .slider-premium:before {
                    transform: translateX(22px);
                }
                .deduccion-card {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    border: 1px solid var(--border-color);
                }
                .deduccion-card.active {
                    border-color: var(--color-danger);
                    background: rgba(239, 68, 68, 0.02);
                    box-shadow: var(--shadow-sm);
                }
                .deduccion-card.inactive {
                    opacity: 0.6;
                    background: var(--bg-app);
                    border-color: var(--border-color);
                }
            </style>

            <div class="card-premium mb-2 animate-in tabular-data" style="padding:24px;">
                <!-- Main Header with Obrero Name -->
                <div class="header-premium" style="margin-bottom:20px; border-bottom: 1px solid var(--border-color); padding-bottom: 16px">
                    <div class="header-icon" style="background:rgba(22, 163, 74, 0.1); color:var(--color-primary)"><i data-lucide="user-check"></i></div>
                    <div>
                        <h3 style="margin:0; font-size:1.2rem; font-weight:800">${d.obrero.nombre}</h3>
                        <p class="text-muted" style="font-size:0.85rem; margin:2px 0 0">
                            Cédula: <strong>${d.obrero.cedula || 'N/A'}</strong> &middot; Liquidando del <strong>${d.fechaInicio}</strong> al <strong>${d.fechaFin}</strong>
                        </p>
                    </div>
                </div>

                <!-- Step Progress Bar Indicator -->
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:24px; padding:12px 16px; background:var(--bg-surface-hover); border-radius:30px; border:1px solid var(--border-color);">
                    <div style="display:flex; align-items:center; gap:8px; opacity: ${d.wizardStep === 1 ? '1' : '0.5'}; font-weight: ${d.wizardStep === 1 ? '700' : '400'}; color: ${d.wizardStep === 1 ? 'var(--color-primary)' : 'var(--text-muted)'}">
                        <span style="display:inline-flex; align-items:center; justify-content:center; width:26px; height:26px; border-radius:50%; background:${d.wizardStep === 1 ? 'var(--color-primary)' : 'var(--border-color)'}; color:${d.wizardStep === 1 ? '#fff' : 'var(--text-muted)'}; font-size:0.8rem; font-weight:700">1</span>
                        <span style="font-size:0.8rem;">Rendimiento</span>
                    </div>
                    <div style="flex:1; height:2px; background:var(--border-color); margin:0 8px; min-width:10px"></div>
                    
                    <div style="display:flex; align-items:center; gap:8px; opacity: ${d.wizardStep === 2 ? '1' : '0.5'}; font-weight: ${d.wizardStep === 2 ? '700' : '400'}; color: ${d.wizardStep === 2 ? 'var(--color-primary)' : 'var(--text-muted)'}">
                        <span style="display:inline-flex; align-items:center; justify-content:center; width:26px; height:26px; border-radius:50%; background:${d.wizardStep === 2 ? 'var(--color-primary)' : 'var(--border-color)'}; color:${d.wizardStep === 2 ? '#fff' : 'var(--text-muted)'}; font-size:0.8rem; font-weight:700">2</span>
                        <span style="font-size:0.8rem">Deducciones</span>
                    </div>
                    <div style="flex:1; height:2px; background:var(--border-color); margin:0 8px; min-width:10px"></div>
                    
                    <div style="display:flex; align-items:center; gap:8px; opacity: ${d.wizardStep === 3 ? '1' : '0.5'}; font-weight: ${d.wizardStep === 3 ? '700' : '400'}; color: ${d.wizardStep === 3 ? 'var(--color-primary)' : 'var(--text-muted)'}">
                        <span style="display:inline-flex; align-items:center; justify-content:center; width:26px; height:26px; border-radius:50%; background:${d.wizardStep === 3 ? 'var(--color-primary)' : 'var(--border-color)'}; color:${d.wizardStep === 3 ? '#fff' : 'var(--text-muted)'}; font-size:0.8rem; font-weight:700">3</span>
                        <span style="font-size:0.8rem">Neto Real</span>
                    </div>
                </div>

                <!-- Dynamic Step Content -->
                ${stepHtml}
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();
    },

    changeWizardStep(step) {
        const d = Pagos._liquidacion;
        if (!d) return;

        if (step === 3) {
            if (d.descTransporteActive && (isNaN(d.descTransporteValor) || d.descTransporteValor < 0)) {
                return App.toast('Por favor ingrese un valor de flete válido', 'error');
            }
        }

        d.wizardStep = step;
        Pagos._renderResultado();
    },

    toggleDeduccion(type, active) {
        const d = Pagos._liquidacion;
        if (!d) return;

        if (type === 'comida') {
            d.descComidaActive = active;
        } else if (type === 'tienda') {
            d.descTiendaActive = active;
        } else if (type === 'transporte') {
            d.descTransporteActive = active;
            if (!active) d.descTransporteValor = 0;
        }

        Pagos._renderResultado();
    },

    updateFleteValor(val) {
        const d = Pagos._liquidacion;
        if (!d) return;

        const value = parseFloat(val);
        d.descTransporteValor = isNaN(value) ? 0 : value;

        // Reactive live summary calculation
        const descComida = d.descComidaActive ? d.descComida : 0;
        const descCaja = d.descTiendaActive ? d.deudaTotalFiado : 0;
        const descTransporte = d.descTransporteActive ? d.descTransporteValor : 0;
        const netoAPagar = d.totalGanado - descComida - descCaja - descTransporte;
        const totalDescuentos = descComida + descCaja + descTransporte;

        const netoEl = document.getElementById('live-neto-sugerido');
        const descEl = document.getElementById('live-descuentos-total');
        if (netoEl) {
            netoEl.innerText = `$${netoAPagar.toLocaleString()}`;
            netoEl.style.color = netoAPagar >= 0 ? 'var(--color-primary)' : 'var(--color-danger)';
        }
        if (descEl) {
            descEl.innerText = `Descuentos: -$${totalDescuentos.toLocaleString()}`;
        }
    },

    async confirmarPagoWizard() {
        const d = Pagos._liquidacion;
        if (!d) return;

        const descComida = d.descComidaActive ? d.descComida : 0;
        const descCaja = d.descTiendaActive ? d.deudaTotalFiado : 0;
        const descTransporte = d.descTransporteActive ? d.descTransporteValor : 0;
        const netoAPagar = d.totalGanado - descComida - descCaja - descTransporte;

        if (netoAPagar < 0) {
            return App.alert({
                title: 'Operación Inválida',
                message: 'No se puede registrar un comprobante de pago con valor neto negativo.',
                type: 'error'
            });
        }

        const metodoPago = document.getElementById('pg-metodo-pago')?.value || 'efectivo';

        App.confirm({
            title: 'Emitir Comprobante',
            message: `Vas a registrar un pago definitivo en cuenta por <strong style="color:var(--color-primary)">$${netoAPagar.toLocaleString()}</strong> usando modalidad de <strong>${metodoPago}</strong>.`,
            confirmText: 'Aceptar y Guardar',
            onConfirm: async () => {
                const allPagos = await db.getByFinca('pagos');
                const nextId = allPagos.length + 1;
                const reciboId = `PAY-${new Date().getFullYear()}-${String(nextId).padStart(4, '0')}`;

                await db.add('pagos', {
                    reciboId,
                    obreroId: d.obreroId,
                    fechaInicio: d.fechaInicio,
                    fechaFin: d.fechaFin,
                    totalGanado: d.totalGanado,
                    descComida,
                    descCaja,
                    descTransporte,
                    netoAPagar,
                    estado: 'pagado',
                    metodoPago,
                    fiadoDescontado: d.descTiendaActive,
                    createdAt: Date.now(),
                    fechaPago: new Date().toLocaleDateString('en-CA'),
                    fincaId: db.getFincaActiva(),
                    cicloId: d.cicloId || null
                });

                if (d.descTiendaActive && d.ventasFiadoPendiente.length > 0) {
                    for (const v of d.ventasFiadoPendiente) {
                        v.pagado = true;
                        v.fechaPago = new Date().toLocaleDateString('en-CA');
                        await db.put('ventasCaja', v);
                    }
                }

                App.toast('Liquidación completada. Recibo ' + reciboId + ' guardado.', 'success');
                Pagos._liquidacion = null;
                document.getElementById('pg-resultado').innerHTML = '';
                Pagos.loadHistorial();
            }
        });
    },

    imprimirReciboPDFWizard() {
        const d = Pagos._liquidacion;
        if (!d) return;

        const descComida = d.descComidaActive ? d.descComida : 0;
        const descCaja = d.descTiendaActive ? d.deudaTotalFiado : 0;
        const descTransporte = d.descTransporteActive ? d.descTransporteValor : 0;
        const neto = d.totalGanado - descComida - descCaja - descTransporte;

        const html = `
            <div class="modal-system-overlay print-receipt-modal" onclick="Pagos.closeModal(event)" style="display:flex;align-items:center;justify-content:center;padding:16px;">
                <div class="card-premium animate-in tabular-data printable-ticket" onclick="event.stopPropagation()" style="width:100%; max-width:420px; padding:24px; background:var(--bg-surface)">
                    
                    <div class="header-premium no-print" style="margin-bottom:24px;">
                        <div class="header-icon" style="background:var(--bg-app); color:var(--text-main)"><i data-lucide="receipt"></i></div>
                        <div style="flex:1">
                            <h3 style="margin:0; font-size:1.1rem">Recibo de Liquidación</h3>
                            <div style="font-family:monospace; color:var(--text-muted); font-size:0.8rem; margin-top:4px">COMPROBANTE DE PAGO</div>
                        </div>
                        <button class="btn-icon-only" onclick="Pagos.closeModal()" style="border:none; background:transparent"><i data-lucide="x"></i></button>
                    </div>
                    
                    <div class="print-content" style="background:var(--bg-app); border:1px solid var(--border-color); border-radius:var(--border-radius-md); padding:20px; margin-bottom:24px">
                        <div style="text-align:center; margin-bottom:16px; border-bottom:1px dashed var(--border-color); padding-bottom:16px">
                            <h2 style="margin:0 0 4px; color:var(--text-main); font-size:1.5rem; font-weight:800">CaféControl</h2>
                            <p class="text-muted" style="margin:0; font-size:0.85rem; text-transform:uppercase; letter-spacing:0.05em">Recibo de Pago Obrero</p>
                        </div>
                        
                        <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.9rem">
                            <span class="text-muted">Obrero:</span>
                            <span style="font-weight:700; color:var(--text-main)">${d.obrero.nombre}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.9rem">
                            <span class="text-muted">Cédula:</span>
                            <span>${d.obrero.cedula || 'N/A'}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.9rem">
                            <span class="text-muted">Período:</span>
                            <span>${d.fechaInicio} al ${d.fechaFin}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:16px; font-size:0.9rem">
                            <span class="text-muted">Total Cosechado:</span>
                            <span style="font-weight:600">${d.totalKilos.toLocaleString()} kg</span>
                        </div>
                        
                        <div style="border-top:1px dashed var(--border-color); padding-top:16px; margin-bottom:16px">
                            <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.9rem">
                                <span class="text-muted">Ingresos Brutos (+):</span>
                                <span style="font-weight:600; color:var(--color-primary)">$${d.totalGanado.toLocaleString()}</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.9rem; opacity: ${d.descComidaActive ? '1' : '0.5'}">
                                <span class="text-muted">Desc. Alimentación (-):</span>
                                <span style="color:var(--color-danger)">-${d.descComidaActive ? `$${d.descComida.toLocaleString()}` : '$0'}</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.9rem; opacity: ${d.descTiendaActive ? '1' : '0.5'}">
                                <span class="text-muted">Desc. Tienda/Caja (-):</span>
                                <span style="color:var(--color-danger)">-${d.descTiendaActive ? `$${d.deudaTotalFiado.toLocaleString()}` : '$0'}</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.9rem; opacity: ${d.descTransporteActive ? '1' : '0.5'}">
                                <span class="text-muted">Desc. Flete (-):</span>
                                <span style="color:var(--color-danger)">-${d.descTransporteActive ? `$${d.descTransporteValor.toLocaleString()}` : '$0'}</span>
                            </div>
                        </div>
                        
                        <div style="border-top:2px solid var(--border-color); padding-top:12px">
                            <div style="display:flex; justify-content:space-between; align-items:center">
                                <span style="font-weight:800; font-size:1.1rem; color:var(--text-main)">NETO A DEPOSITAR</span>
                                <span style="font-weight:900; font-size:1.4rem; color:var(--color-primary)">$${neto.toLocaleString()}</span>
                            </div>
                        </div>

                        <div style="margin-top:32px; border-top:1px solid var(--border-color); padding-top:16px; text-align:center">
                            <div style="height:48px; border-bottom:1px solid var(--border-color); width:200px; margin: 0 auto"></div>
                            <p style="font-size:0.75rem; color:var(--text-muted); margin:4px 0 0">Firma del Obrero</p>
                        </div>
                        
                        <p class="text-muted" style="text-align:center; font-size:0.75rem; margin:24px 0 0">Generado por CaféControl &middot; ${new Date().toLocaleDateString('en-CA')}</p>
                    </div>

                    <div class="btn-group no-print" style="display:flex; gap:12px;">
                        <button class="btn-premium secondary flex-1" onclick="window.print()">
                            <i data-lucide="printer"></i> Imprimir
                        </button>
                        <button class="btn-premium flex-1" style="background:var(--color-primary); color:#fff; border:none" onclick="Pagos.closeModal()">
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
            
            <style>
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .printable-ticket, .printable-ticket * {
                        visibility: visible;
                    }
                    .printable-ticket {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100% !important;
                        max-width: 100% !important;
                        border: none !important;
                        background: white !important;
                        color: black !important;
                        box-shadow: none !important;
                        padding: 0 !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-content {
                        border: none !important;
                        background: transparent !important;
                        padding: 0 !important;
                    }
                }
            </style>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
        if (window.lucide) window.lucide.createIcons();
    },

    compartirWhatsAppWizard() {
        const d = Pagos._liquidacion;
        if (!d) return;

        const descComida = d.descComidaActive ? d.descComida : 0;
        const descCaja = d.descTiendaActive ? d.deudaTotalFiado : 0;
        const descTransporte = d.descTransporteActive ? d.descTransporteValor : 0;
        const neto = d.totalGanado - descComida - descCaja - descTransporte;

        const msg = encodeURIComponent(
            `📄 *RECIBO DE NÓMINA | CaféControl* 🌾\n\n` +
            `👤 *Trabajador:* ${d.obrero.nombre}\n` +
            `🗓️ *Período:* ${d.fechaInicio} al ${d.fechaFin}\n` +
            `⚖️ *Total Cosechado:* ${d.totalKilos.toLocaleString()} kg\n\n` +
            `===========================\n` +
            `➕ *Ganancia Bruta:* $${d.totalGanado.toLocaleString()}\n` +
            `➖ *Descuento Comedor:* -${d.descComidaActive ? `$${d.descComida.toLocaleString()}` : '$0 (Exonerado)'}\n` +
            `➖ *Descuento Tienda:* -${d.descTiendaActive ? `$${d.deudaTotalFiado.toLocaleString()}` : '$0 (Exonerado)'}\n` +
            `➖ *Descuento Flete:* -${d.descTransporteActive ? `$${d.descTransporteValor.toLocaleString()}` : '$0'}\n` +
            `===========================\n\n` +
            `💰 *NETO A RECIBIR: $${neto.toLocaleString()}* 💵\n\n` +
            `*CaféControl* - Finca Familiar ☕`
        );
        window.open(`https://wa.me/?text=${msg}`, '_blank');
    },

    generarRecibo(descontarFiado) {
        const d = Pagos._liquidacion;
        if (!d) return;

        const descCaja = descontarFiado ? d.deudaTotalFiado : d.descCajaPeriodo;
        const neto = d.totalGanado - d.descComida - descCaja;

        const html = `
            <div class="modal-system-overlay" onclick="Pagos.closeModal(event)" style="display:flex;align-items:center;justify-content:center;padding:16px;">
                <div class="card-premium animate-in tabular-data" onclick="event.stopPropagation()" style="width:100%; max-width:420px; padding:24px;">
                    
                    <div class="header-premium" style="margin-bottom:24px;">
                        <div class="header-icon" style="background:var(--bg-app); color:var(--text-main)"><i data-lucide="receipt"></i></div>
                        <div style="flex:1">
                            <h3 style="margin:0; font-size:1.1rem">Comprobante</h3>
                            <div style="font-family:monospace; color:var(--text-muted); font-size:0.8rem; margin-top:4px">${d.reciboId || 'POR EMITIR'}</div>
                        </div>
                        <button class="btn-icon-only" onclick="Pagos.closeModal()" style="border:none; background:transparent"><i data-lucide="x"></i></button>
                    </div>
                    
                    <div style="background:var(--bg-app); border:1px solid var(--border-color); border-radius:var(--border-radius-md); padding:16px; margin-bottom:24px">
                        <div style="text-align:center; margin-bottom:16px; border-bottom:1px dashed var(--border-color); padding-bottom:16px">
                            <h2 style="margin:0 0 8px; color:var(--text-main); font-size:1.4rem">CaféControl</h2>
                            <p class="text-muted" style="margin:0; font-size:0.85rem">Control de Nómina</p>
                        </div>
                        
                        <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.9rem">
                            <span class="text-muted">Trabajador:</span>
                            <span style="font-weight:600">${d.obrero.nombre}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.9rem">
                            <span class="text-muted">Rango:</span>
                            <span>${d.fechaInicio} &rarr; ${d.fechaFin}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:16px; font-size:0.9rem">
                            <span class="text-muted">Carga recolectada:</span>
                            <span>${d.totalKilos.toLocaleString()} kg</span>
                        </div>
                        
                        <div style="border-top:1px dashed var(--border-color); padding-top:16px; margin-bottom:16px">
                            <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.9rem">
                                <span class="text-muted">Bruto ganado:</span>
                                <span style="font-weight:600; color:var(--color-primary)">$${d.totalGanado.toLocaleString()}</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.9rem">
                                <span class="text-muted">Comedor:</span>
                                <span style="color:var(--color-danger)">-$${d.descComida.toLocaleString()}</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.9rem">
                                <span class="text-muted">Adelantos/Tienda:</span>
                                <span style="color:var(--color-danger)">-$${descCaja.toLocaleString()}</span>
                            </div>
                        </div>
                        
                        <div style="border-top:2px solid var(--border-color); padding-top:12px">
                            <div style="display:flex; justify-content:space-between; align-items:center">
                                <span style="font-weight:700; font-size:1rem; color:var(--text-main)">TOTAL EMITIDO</span>
                                <span style="font-weight:800; font-size:1.2rem; color:var(--text-main)">$${neto.toLocaleString()}</span>
                            </div>
                        </div>
                        
                        <p class="text-muted" style="text-align:center; font-size:0.75rem; margin:16px 0 0">Doc emitido: ${new Date().toLocaleDateString('en-CA')}</p>
                    </div>

                    <div class="btn-group" style="display:flex; gap:12px;">
                        <button class="btn-premium secondary flex-1" onclick="window.print()">
                            <i data-lucide="printer"></i> Imprimir
                        </button>
                        <button class="btn-premium flex-1" style="background:#25D366; color:#fff; border:none" onclick="Pagos.compartirWhatsApp(${descontarFiado})">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> Enviar por Chat
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
        if (window.lucide) window.lucide.createIcons();
    },

    compartirWhatsApp(descontarFiado) {
        const d = Pagos._liquidacion;
        if (!d) return;

        const descCaja = descontarFiado ? d.deudaTotalFiado : d.descCajaPeriodo;
        const neto = d.totalGanado - d.descComida - descCaja;

        const msg = encodeURIComponent(
            `📄 *Recibo de Nómina | ${d.reciboId || 'NUEVO'}*\n` +
            `👤 Trabajador: ${d.obrero.nombre}\n` +
            `🗓️ Período: ${d.fechaInicio} al ${d.fechaFin}\n` +
            `⚖️ Kilos Recolectados: ${d.totalKilos.toLocaleString()} kg\n\n` +
            `=================\n` +
            `➕ Bruto Ganado: $${d.totalGanado.toLocaleString()}\n` +
            `➖ Desc. Alimentación: -$${d.descComida.toLocaleString()}\n` +
            `➖ Desc. Préstamos: -$${descCaja.toLocaleString()}\n` +
            `=================\n\n` +
            `💰 *NETO DEPOSITADO: $${neto.toLocaleString()}*`
        );
        window.open(`https://wa.me/?text=${msg}`, '_blank');
    },

    async imprimirHistorial(pagoId) {
        const pago = await db.get('pagos', pagoId);
        if (!pago) return;

        const obrero = await db.get('obreros', pago.obreroId);

        // Mock 
        Pagos._liquidacion = {
            reciboId: pago.reciboId || 'PAY-OLD',
            obrero: obrero || { nombre: 'Desconocido' },
            fechaInicio: pago.fechaInicio,
            fechaFin: pago.fechaFin,
            totalKilos: 0,
            totalGanado: pago.totalGanado,
            descComida: pago.descComida,
            descCajaPeriodo: pago.descCaja,
            deudaTotalFiado: pago.descCaja,
            ventasFiadoPendiente: [],
            // wizard compatibility
            descComidaActive: pago.descComida > 0,
            descTiendaActive: pago.descCaja > 0,
            descTransporteActive: false,
            descTransporteValor: 0
        };

        Pagos.generarRecibo(true);
    },

    async loadHistorial() {
        let pagos = await db.getByFinca('pagos');
        const obreros = (await db.getByFinca('obreros')).filter(o => o.estado !== 'inactivo');
        const obMap = Object.fromEntries(obreros.map(o => [o.id, o.nombre]));
        pagos.sort((a, b) => (b.fechaPago || '').localeCompare(a.fechaPago || ''));

        const tbody = document.getElementById('pagos-body');
        if (tbody) {
            tbody.innerHTML = pagos.length === 0
                ? '<tr><td colspan="9" style="padding:40px; text-align:center; color:var(--text-muted)"><i data-lucide="inbox" style="width:40px;height:40px;opacity:0.2;margin:0 auto 12px;display:block"></i>No se han emitido pagos históricos en este cultivo.</td></tr>'
                : pagos.map(p => `
                    <tr style="border-bottom:1px solid var(--border-color); ${p.estado === 'anulado' ? 'opacity:0.5; background:var(--bg-app)' : ''}">
                        <td style="padding:12px 16px;"><span class="badge" style="background:var(--bg-app); border:1px solid var(--border-color); color:var(--text-main); font-family:monospace">${p.reciboId || 'PAY-OLD'}</span></td>
                        <td style="padding:12px 16px; font-size:0.85rem">${p.fechaPago}</td>
                        <td style="padding:12px 16px; font-weight:600">${obMap[p.obreroId] || '?'}</td>
                        <td style="padding:12px 16px; font-size:0.85rem; color:var(--text-muted)">${p.fechaInicio} &rarr; ${p.fechaFin}</td>
                        <td style="padding:12px 16px; text-align:right" class="${p.estado === 'anulado' ? 'text-muted' : ''}"><span style="color:var(--color-primary)">$${(p.totalGanado || 0).toLocaleString()}</span></td>
                        <td style="padding:12px 16px; text-align:right" class="${p.estado === 'anulado' ? 'text-muted' : ''}"><span style="color:var(--color-danger)">$${((p.descComida || 0) + (p.descCaja || 0) + (p.descTransporte || 0)).toLocaleString()}</span></td>
                        <td style="padding:12px 16px; text-align:right; font-weight:700; font-size:1.05rem; text-decoration:${p.estado === 'anulado' ? 'line-through' : 'none'}; color:${p.estado === 'anulado' ? 'var(--text-muted)' : 'var(--text-main)'}">$${(p.netoAPagar || 0).toLocaleString()}</td>
                        <td style="padding:12px 16px; text-align:center">
                            ${p.estado === 'anulado'
                        ? '<span class="badge" style="background:var(--bg-surface-hover); color:var(--text-muted); border:1px solid var(--border-color)">Anulado</span>'
                        : '<span class="badge" style="background:rgba(22, 163, 74, 0.1); color:var(--color-primary); border:1px solid rgba(22, 163, 74, 0.2)">Pagado</span>'}
                        </td>
                        <td style="padding:12px 16px; text-align:center">
                            ${p.estado !== 'anulado'
                        ? `<div style="display:flex; justify-content:center; gap:8px">
                             <button class="btn-icon-only" style="width:32px; height:32px; border:none; background:transparent" onclick="Pagos.imprimirHistorial(${p.id})" title="Imprimir Recibo"><i data-lucide="printer" style="width:16px; height:16px"></i></button>
                             <button class="btn-icon-only" style="width:32px; height:32px; border:none; background:rgba(239,68,68,0.1); color:var(--color-danger)" onclick="Pagos.anularPago(${p.id})" title="Anular Pago"><i data-lucide="x-circle" style="width:16px; height:16px"></i></button>
                           </div>`
                        : `<span style="font-size:0.75rem; color:var(--text-muted)">-</span>`}
                        </td>
                    </tr>
                `).join('');
            if (window.lucide) window.lucide.createIcons();
        }
    },

    async anularPago(id) {
        const pago = await db.get('pagos', id);
        if (!pago) return;
        if (pago.estado === 'anulado') return App.toast('Mecanismo de seguridad: Este pago ya está anulado', 'warning');

        App.confirm({
            title: 'Anular Documento Contable',
            message: 'Al anular este comprobante, el dinero regresará al saldo virtual del empleado y todas las deudas de tienda asociadas volverán a quedar pendientes por cobro. ¿Proceder?',
            icon: '🔄',
            confirmText: 'Sí, Anular',
            onConfirm: async () => {
                pago.estado = 'anulado';
                pago.anuladoEn = Date.now();
                await db.put('pagos', pago);

                if (pago.fiadoDescontado) {
                    const ventas = await db.getAllByIndex('ventasCaja', 'obreroId', pago.obreroId);
                    const ventasAfectadas = ventas.filter(v =>
                        v.fiado && v.pagado === true && v.fechaPago === pago.fechaPago
                    );

                    for (const v of ventasAfectadas) {
                        v.pagado = false;
                        delete v.fechaPago;
                        await db.put('ventasCaja', v);
                    }
                }

                App.toast('Documento contable revertido con éxito.', 'success');
                Pagos.loadHistorial();
            }
        });
    },

    closeModal(e) {
        if (e && e.target !== e.currentTarget) return;
        const modal = document.querySelector('.modal-system-overlay');
        if (modal) modal.remove();
    }
};
