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

        let htmlRows = '';

        for (const o of obreros) {
            const jornales = await db.getJornalesByObreroAndRange(o.id, cicloActivo.fechaInicio, cicloActivo.fechaFin);
            const totalGanado = jornales.reduce((s, j) => s + (j.totalDia || 0), 0);

            const comidas = await db.getComidaByObreroAndRange(o.id, cicloActivo.fechaInicio, cicloActivo.fechaFin);
            const totalComida = comidas.reduce((s, c) => s + (c.valor || 0), 0);

            const ventasFiadoPendiente = todasVentas.filter(v => v.obreroId === o.id && v.fiado && !v.pagado);
            const totalTienda = ventasFiadoPendiente.reduce((s, v) => s + (v.valorTotal || 0), 0);

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

        const cicloActivo = await db.getCicloActivo();
        if (!cicloActivo) {
            return App.alert({ title: 'Ciclo inactivo', message: 'No hay un ciclo activo. Debes abrir un ciclo para gestionar pagos.', type: 'warning' });
        }

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

        const totalGanado = jornales.reduce((s, j) => s + (j.totalDia || 0), 0);
        const totalKilos = jornales.reduce((s, j) => s + (j.kilosRecolectados || 0), 0);
        const descComida = comidas.reduce((s, c) => s + (c.valor || 0), 0);
        const descCajaPeriodo = ventas.reduce((s, v) => s + (v.valorTotal || 0), 0);
        const deudaTotalFiado = ventasFiadoPendiente.reduce((s, v) => s + (v.valorTotal || 0), 0);

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
            cicloId: cicloActivo.id
        };

        Pagos._renderResultado(true);
        if (btnCalc) { btnCalc.disabled = false; btnCalc.innerHTML = '<i data-lucide="search"></i> Consultar y Liquidar'; if (window.lucide) window.lucide.createIcons(); }
    },

    _renderResultado(descontarFiado) {
        const d = Pagos._liquidacion;
        if (!d) return;

        const descCaja = descontarFiado ? d.deudaTotalFiado : d.descCajaPeriodo;
        const netoAPagar = d.totalGanado - d.descComida - descCaja;
        const totalDescuentos = d.descComida + descCaja;

        const container = document.getElementById('pg-resultado');
        container.innerHTML = `
            <div class="card-premium mb-2 animate-in tabular-data">
                <div class="header-premium" style="margin-bottom:16px;">
                    <div class="header-icon" style="background:var(--bg-surface-hover)"><i data-lucide="file-check-2"></i></div>
                    <div>
                        <h3 style="margin:0; font-size:1.1rem">Detalle de Liquidación</h3>
                        <p class="text-muted" style="font-size:0.85rem; margin:0">${d.obrero.nombre} &middot; ${d.fechaInicio} al ${d.fechaFin}</p>
                    </div>
                </div>

                <div class="grid-3 mb-2" style="margin-bottom:24px; gap:8px">
                    <div class="card-premium" style="padding:12px; background:var(--bg-app)!important">
                        <div class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:600; margin-bottom:4px">Ganado</div>
                        <div style="font-size:1.3rem; font-weight:700; color:var(--color-primary)">$${d.totalGanado.toLocaleString()}</div>
                    </div>
                    <div class="card-premium" style="padding:12px; background:var(--bg-app)!important">
                        <div class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:600; margin-bottom:4px">Descuentos</div>
                        <div style="font-size:1.3rem; font-weight:700; color:var(--color-danger)">$${totalDescuentos.toLocaleString()}</div>
                    </div>
                    <div class="card-premium" style="padding:12px; background:var(--bg-surface-hover)!important; border-color:var(--color-primary)!important">
                        <div class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:600; margin-bottom:4px">Neto a Sugerido</div>
                        <div style="font-size:1.3rem; font-weight:800; color:${netoAPagar >= 0 ? 'var(--text-main)' : 'var(--color-danger)'}">$${netoAPagar.toLocaleString()}</div>
                    </div>
                </div>

                <!-- Detalle -->
                <p class="text-muted" style="font-size:0.85rem; text-transform:uppercase; font-weight:700; margin-bottom:12px">
                    <i data-lucide="sun" style="width:14px; height:14px; display:inline-block; vertical-align:middle; margin-right:4px"></i> 
                    Jornales Registrados (${d.jornales.length} días · ${d.totalKilos.toLocaleString()} kg)
                </p>
                <div class="table-wrapper card-premium" style="padding:0; overflow:hidden; margin-bottom:24px">
                    <table style="width:100%; border-collapse:collapse">
                        <thead style="background:var(--bg-surface-hover); color:var(--text-muted); text-transform:uppercase; font-size:0.7rem; font-weight:700">
                            <tr>
                                <th style="padding:12px 16px; text-align:left; border-bottom:1px solid var(--border-color)">Fecha / Lote</th>
                                <th style="padding:12px 16px; text-align:right; border-bottom:1px solid var(--border-color)">Kilos</th>
                                <th style="padding:12px 16px; text-align:right; border-bottom:1px solid var(--border-color)">Valor Día ($)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${d.jornales.length === 0 ? '<tr><td colspan="3" style="padding:24px; text-align:center; color:var(--text-muted)">Sin jornales en este período</td></tr>' :
                d.jornales.map(j => `
                                <tr style="border-bottom:1px solid var(--border-color)">
                                    <td style="padding:12px 16px;">
                                        <div>${j.fecha}</div>
                                        <div class="text-muted" style="font-size:0.75rem">${d.ltMap[j.loteId] || '?'} </div>
                                    </td>
                                    <td style="padding:12px 16px; text-align:right"><strong>${(j.kilosRecolectados || 0).toLocaleString()}</strong> kg</td>
                                    <td style="padding:12px 16px; text-align:right; font-weight:600; color:var(--color-primary)">$${(j.totalDia || 0).toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                ${d.descComida > 0 ? `
                    <p class="text-muted" style="font-size:0.85rem; text-transform:uppercase; font-weight:700; margin-bottom:12px; color:var(--color-danger)">
                        <i data-lucide="utensils" style="width:14px; height:14px; display:inline-block; vertical-align:middle; margin-right:4px"></i> 
                        Alimentación ($${d.descComida.toLocaleString()})
                    </p>
                    <div class="table-wrapper card-premium" style="padding:0; overflow:hidden; margin-bottom:24px">
                        <table style="width:100%; border-collapse:collapse">
                            <tbody>
                                ${d.comidas.map(c => `
                                    <tr style="border-bottom:1px solid var(--border-color)">
                                        <td style="padding:12px 16px;">${c.fecha} <br><span class="text-muted" style="font-size:0.75rem">${c.tipo}</span></td>
                                        <td style="padding:12px 16px; text-align:right; color:var(--color-danger)">-$${(c.valor || 0).toLocaleString()}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : ''}

                <!-- Fiado -->
                <div class="card-premium" style="background:var(--bg-app)!important; padding:16px; margin-bottom:24px; border:1px solid ${descontarFiado && d.deudaTotalFiado > 0 ? 'var(--color-danger)' : 'var(--border-color)'}; transition:all 0.2s">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <p style="font-weight:700; margin:0; display:flex; align-items:center; gap:8px"><i data-lucide="shopping-cart"></i> Deudas de Tienda</p>
                            <p class="text-muted" style="font-size:0.8rem; margin:4px 0 0">
                                ${d.deudaTotalFiado > 0 ? `${d.ventasFiadoPendiente.length} artículos comprados a crédito` : 'No registra compras pendientes'}
                            </p>
                        </div>
                        <div style="font-size:1.4rem; font-weight:800; color:var(--color-danger)">$${d.deudaTotalFiado.toLocaleString()}</div>
                    </div>

                    ${d.deudaTotalFiado > 0 ? `
                        <label style="display:flex; align-items:center; gap:12px; cursor:pointer; padding:16px; background:var(--bg-surface); border-radius:var(--border-radius-sm); margin-top:16px; border:1px solid var(--border-color)">
                            <input type="checkbox" id="pg-descontar-fiado" ${descontarFiado ? 'checked' : ''}
                                onchange="Pagos._renderResultado(this.checked)"
                                style="width:20px; height:20px; accent-color:var(--color-primary); cursor:pointer">
                            <div>
                                <span style="font-weight:600; display:block">Descontar saldo adeudado del pago final</span>
                                <small class="text-muted" style="font-size:0.8rem">Se restarán $${d.deudaTotalFiado.toLocaleString()} de manera automática</small>
                            </div>
                        </label>
                    ` : ''}
                </div>

                <!-- Liquidación Summary -->
                <div class="card-premium" style="background:var(--bg-surface-hover)!important; padding:20px; border-radius:var(--border-radius-md); margin-bottom:24px; border:1px solid var(--border-color)">
                    <p style="font-weight:700; margin:0 0 16px; display:flex; align-items:center; gap:8px"><i data-lucide="file-check"></i> Cierre Contable Provisional</p>
                    
                    <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.05)">
                        <span class="text-muted">Haberes ganados</span>
                        <span style="font-weight:600; color:var(--color-primary)">+$${d.totalGanado.toLocaleString()}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.05)">
                        <span class="text-muted">Descuento comedor</span>
                        <span style="color:var(--color-danger)">-$${d.descComida.toLocaleString()}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.05)">
                        <span class="text-muted">Tienda/Préstamos  ${descontarFiado ? '<i data-lucide="check" style="width:14px;height:14px;color:var(--color-primary);vertical-align:middle;display:inline-block;margin-left:4px"></i>' : ''}</span>
                        <span style="color:var(--color-danger)">-$${descCaja.toLocaleString()}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; padding:16px 0 0; font-size:1.3rem; font-weight:800">
                        <span>NETO A DEPOSITAR</span>
                        <span style="color:${netoAPagar >= 0 ? 'var(--text-main)' : 'var(--color-danger)'}">$${netoAPagar.toLocaleString()}</span>
                    </div>
                </div>

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

                ${!d.pagosSolapados || d.pagosSolapados.length === 0 ? `
                <div class="input-group" style="margin-bottom:24px">
                    <label class="text-muted" style="font-size:0.8rem;text-transform:uppercase;font-weight:600;display:block;margin-bottom:8px">Modalidad de Desembolso</label>
                    <select class="input-premium" id="pg-metodo-pago">
                        <option value="efectivo">Efectivo 💵</option>
                        <option value="transferencia">Bancos / Transferencia 🏦</option>
                    </select>
                </div>
                ` : ''}

                <div class="btn-group" style="display:flex; gap:12px;">
                    <button class="btn-premium secondary flex-1" onclick="Pagos.generarRecibo(${descontarFiado})">
                        <i data-lucide="receipt"></i> Previsualizar Recibo
                    </button>
                    <button class="btn-premium flex-1" style="background:var(--color-primary); color:#fff; border:none" onclick="Pagos.confirmarPago(${descontarFiado})"
                        ${d.pagosSolapados && d.pagosSolapados.length > 0 ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}>
                        ${d.pagosSolapados && d.pagosSolapados.length > 0 ? '<i data-lucide="lock"></i> Pagado' : '<i data-lucide="check-circle"></i> Confirmar Pago'}
                    </button>
                </div>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    },

    async confirmarPago(descontarFiado) {
        const d = Pagos._liquidacion;
        if (!d) return;

        const descCaja = descontarFiado ? d.deudaTotalFiado : d.descCajaPeriodo;
        const netoAPagar = d.totalGanado - d.descComida - descCaja;

        if (netoAPagar < 0) {
            return App.alert({
                title: 'Operación Inválida',
                message: 'No se puede registrar un comprobante de pago con valor neto negativo.',
                type: 'error'
            });
        }

        const metodoPago = document.getElementById('pg-metodo-pago')?.value || 'efectivo';

        // Custom Modal Confirm to use design system
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
                    descComida: d.descComida,
                    descCaja,
                    netoAPagar,
                    estado: 'pagado',
                    metodoPago,
                    fiadoDescontado: descontarFiado,
                    createdAt: Date.now(),
                    fechaPago: new Date().toLocaleDateString('en-CA'),
                    fincaId: db.getFincaActiva(),
                    cicloId: d.cicloId || null
                });

                if (descontarFiado && d.ventasFiadoPendiente.length > 0) {
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
            ventasFiadoPendiente: []
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
                        <td style="padding:12px 16px; text-align:right" class="${p.estado === 'anulado' ? 'text-muted' : ''}"><span style="color:var(--color-danger)">$${((p.descComida || 0) + (p.descCaja || 0)).toLocaleString()}</span></td>
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
