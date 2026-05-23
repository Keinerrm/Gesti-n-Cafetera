/* ============================================
   pdf.js — Generación de Recibos PDF
   Usa datos de pagos guardados (no recalcula)
   ============================================ */

const PDF = {

    // --- Generar recibo individual ---

    async generarReciboObrero(pagoId) {
        const pago = await db.get('pagos', pagoId);
        if (!pago) return App.toast('Pago no encontrado', 'error');

        const obrero = await db.get('obreros', pago.obreroId);
        const fincaId = pago.fincaId || db.getFincaActiva();
        const finca = await db.get('fincas', fincaId);
        const fincaNombre = finca ? finca.nombre : 'Finca';

        // Get ciclo info
        let cicloNombre = '';
        let periodoStr = '';
        if (pago.cicloId) {
            const ciclo = await db.get('ciclos', pago.cicloId);
            if (ciclo) {
                cicloNombre = ciclo.nombre;
                periodoStr = `${Ciclos.formatFecha(ciclo.fechaInicio || ciclo.fechainicio)} → ${Ciclos.formatFecha(ciclo.fechaFin || ciclo.fechafin)}`;
            }
        }
        if (!cicloNombre) {
            cicloNombre = `${pago.fechaInicio || ''} — ${pago.fechaFin || ''}`;
            periodoStr = cicloNombre;
        }

        const data = {
            fincaNombre,
            cicloNombre,
            periodoStr,
            obreroNombre: obrero ? obrero.nombre : 'Obrero',
            totalGanado: pago.totalGanado || 0,
            descComida: pago.descComida || 0,
            descCaja: pago.descCaja || 0,
            netoAPagar: pago.netoAPagar || 0,
            fechaPago: pago.fechaPago || new Date().toLocaleDateString('en-CA')
        };

        // Get kilos detail from jornales if available
        if (pago.fechaInicio && pago.fechaFin) {
            const jornales = (await db.getByFinca('jornales')).filter(j =>
                j.obreroId === pago.obreroId &&
                j.fecha >= pago.fechaInicio && j.fecha <= pago.fechaFin
            );
            data.kilos = jornales.reduce((s, j) => s + (j.kilosRecolectados || 0), 0);
            data.dias = jornales.length;
        }

        const doc = PDF._crearReciboPagina(data);
        doc.save(`Recibo_${data.obreroNombre.replace(/\s+/g, '_')}_${data.fechaPago}.pdf`);
        App.toast('📄 Recibo descargado', 'success');
    },

    // --- Generar todos los recibos de un ciclo ---

    async generarRecibosCiclo(cicloId) {
        const ciclo = await db.get('ciclos', cicloId);
        if (!ciclo) return App.toast('Ciclo no encontrado', 'error');

        const fincaId = ciclo.fincaId || db.getFincaActiva();
        const finca = await db.get('fincas', fincaId);
        const fincaNombre = finca ? finca.nombre : 'Finca';
        const periodoStr = `${Ciclos.formatFecha(ciclo.fechaInicio || ciclo.fechainicio)} → ${Ciclos.formatFecha(ciclo.fechaFin || ciclo.fechafin)}`;

        // Get all pagos for this ciclo
        const todosPagos = await db.getByFinca('pagos');
        const pagosCiclo = todosPagos.filter(p => p.cicloId === cicloId);

        if (pagosCiclo.length === 0) {
            return App.toast('No hay pagos para este ciclo', 'error');
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        let firstPage = true;

        for (const pago of pagosCiclo) {
            if (!firstPage) doc.addPage();
            firstPage = false;

            const obrero = await db.get('obreros', pago.obreroId);

            const jornales = (await db.getByFinca('jornales')).filter(j =>
                j.obreroId === pago.obreroId &&
                j.fecha >= (ciclo.fechaInicio || ciclo.fechainicio) && j.fecha <= (ciclo.fechaFin || ciclo.fechafin)
            );

            const data = {
                fincaNombre,
                cicloNombre: ciclo.nombre,
                periodoStr,
                obreroNombre: obrero ? obrero.nombre : 'Obrero',
                totalGanado: pago.totalGanado || 0,
                descComida: pago.descComida || 0,
                descCaja: pago.descCaja || 0,
                netoAPagar: pago.netoAPagar || 0,
                fechaPago: pago.fechaPago || '',
                kilos: jornales.reduce((s, j) => s + (j.kilosRecolectados || 0), 0),
                dias: jornales.length
            };

            PDF._renderPagina(doc, data);
        }

        doc.save(`Recibos_${ciclo.nombre.replace(/\s+/g, '_')}_${ciclo.fechaInicio || ciclo.fechainicio}.pdf`);
        App.toast(`📄 ${pagosCiclo.length} recibos generados`, 'success');
    },

    // --- Create single-page PDF ---

    _crearReciboPagina(data) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        PDF._renderPagina(doc, data);
        return doc;
    },

    // --- Render one page into a jsPDF doc ---

    _renderPagina(doc, d) {
        const w = doc.internal.pageSize.getWidth();
        const centerX = w / 2;
        let y = 20;

        // === HEADER: Finca name ===
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(d.fincaNombre.toUpperCase(), centerX, y, { align: 'center' });

        y += 8;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Liquidación de Recolección', centerX, y, { align: 'center' });

        // === Ciclo info ===
        y += 10;
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(d.cicloNombre, centerX, y, { align: 'center' });

        y += 6;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(d.periodoStr, centerX, y, { align: 'center' });

        // === Separator ===
        y += 8;
        doc.setDrawColor(180, 150, 100);
        doc.setLineWidth(0.5);
        doc.line(20, y, w - 20, y);

        // === Obrero ===
        y += 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('OBRERO', 20, y);

        y += 7;
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(d.obreroNombre, 20, y);

        // === Separator ===
        y += 10;
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        doc.line(20, y, w - 20, y);

        // === Producción ===
        y += 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 100, 100);
        doc.text('PRODUCCIÓN', 20, y);

        y += 8;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);

        if (d.kilos !== undefined) {
            doc.text(`Kilos recolectados:`, 20, y);
            doc.text(`${d.kilos.toLocaleString()} kg`, w - 20, y, { align: 'right' });
            y += 7;
        }

        if (d.dias !== undefined) {
            doc.text(`Días trabajados:`, 20, y);
            doc.text(`${d.dias}`, w - 20, y, { align: 'right' });
            y += 7;
        }

        // Subtotal
        y += 3;
        doc.setFont('helvetica', 'bold');
        doc.text('Subtotal ganado:', 20, y);
        doc.text(`$${d.totalGanado.toLocaleString()}`, w - 20, y, { align: 'right' });

        // === Separator ===
        y += 10;
        doc.setDrawColor(220, 220, 220);
        doc.line(20, y, w - 20, y);

        // === Descuentos ===
        y += 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 100, 100);
        doc.text('DESCUENTOS', 20, y);

        y += 8;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);

        // Comida
        doc.text('Comida:', 20, y);
        doc.setTextColor(180, 50, 50);
        doc.text(`- $${d.descComida.toLocaleString()}`, w - 20, y, { align: 'right' });

        y += 7;
        doc.setTextColor(0, 0, 0);
        doc.text('Tienda / Fiado:', 20, y);
        doc.setTextColor(180, 50, 50);
        doc.text(`- $${d.descCaja.toLocaleString()}`, w - 20, y, { align: 'right' });

        // Total descuentos
        y += 8;
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(10);
        const totalDesc = d.descComida + d.descCaja;
        doc.text(`Total descuentos: - $${totalDesc.toLocaleString()}`, w - 20, y, { align: 'right' });

        // === Big separator ===
        y += 10;
        doc.setDrawColor(140, 110, 70);
        doc.setLineWidth(1);
        doc.line(20, y, w - 20, y);

        // === TOTAL A PAGAR ===
        y += 12;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 100, 100);
        doc.text('TOTAL A PAGAR', centerX, y, { align: 'center' });

        y += 12;
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40, 100, 40);
        doc.text(`$${d.netoAPagar.toLocaleString()}`, centerX, y, { align: 'center' });

        // Fecha de pago
        y += 12;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        if (d.fechaPago) {
            const fp = new Date(d.fechaPago + 'T12:00:00');
            const fechaFormateada = fp.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
            doc.text(`Fecha de pago: ${fechaFormateada}`, centerX, y, { align: 'center' });
        }

        // === Separator ===
        y += 12;
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        doc.line(20, y, w - 20, y);

        // === Firmas ===
        y += 25;
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);

        // Firma administrador
        doc.line(25, y, 90, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.text('Administrador', 57, y, { align: 'center' });

        // Firma trabajador
        const y2 = y - 5;
        doc.line(w - 90, y2, w - 25, y2);
        doc.text('Trabajador', w - 57, y, { align: 'center' });

        // === Footer ===
        const pageH = doc.internal.pageSize.getHeight();
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text('CaféControl — Sistema de Gestión Cafetera', centerX, pageH - 10, { align: 'center' });
    }
};
