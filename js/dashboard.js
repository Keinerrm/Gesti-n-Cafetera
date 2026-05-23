/* ============================================
   dashboard.js — Panel de Control
   Con alertas inteligentes + selector de finca
   ============================================ */

const Dashboard = {
    async render() {
        const app = document.getElementById('app');
        const fincaId = db.getFincaActiva();
        const fincas = await db.getByFinca('fincas');
        const fincaActual = fincas.find(f => f.id === fincaId) || { nombre: 'Finca' };

        // Fetch all data (filter by finca where applicable)
        const obreros = (await db.getByFinca('obreros')).filter(o => o.estado !== 'inactivo');
        const lotes = await db.getByFinca('lotes');
        const jornales = await db.getByFinca('jornales');
        const pagos = await db.getByFinca('pagos');
        const comidas = await db.getByFinca('comida');
        const ventas = await db.getByFinca('ventasCaja');
        const cascota = await db.getByFinca('cascota');
        const productos = await db.getByFinca('productos');

        const today = new Date().toLocaleDateString('en-CA');

        // Today stats
        const jornalesHoy = jornales.filter(j => j.fecha === today);
        const kilosHoy = jornalesHoy.reduce((s, j) => s + (j.kilosRecolectados || 0), 0);
        const totalKilos = jornales.reduce((s, j) => s + (j.kilosRecolectados || 0), 0);
        const totalGanado = jornales.reduce((s, j) => s + (j.totalDia || 0), 0);
        const totalPagado = pagos.reduce((s, p) => s + (p.netoAPagar || 0), 0);

        // Ciclo activo + stats del ciclo
        const cicloActivo = await db.getCicloActivo();
        let kilosCiclo = 0, comidaCiclo = 0, pagadoCiclo = 0, ventasCiclo = 0;
        let kilosCicloAnterior = 0, cicloAnterior = null;

        if (cicloActivo) {
            const jCiclo = jornales.filter(j => j.cicloId === cicloActivo.id || (!j.cicloId && j.fecha >= cicloActivo.fechaInicio && j.fecha <= cicloActivo.fechaFin));
            kilosCiclo = jCiclo.reduce((s, j) => s + (j.kilosRecolectados || 0), 0);
            comidaCiclo = comidas.filter(c => c.cicloId === cicloActivo.id || (!c.cicloId && c.fecha >= cicloActivo.fechaInicio && c.fecha <= cicloActivo.fechaFin)).reduce((s, c) => s + (c.valor || 0), 0);
            pagadoCiclo = pagos.filter(p => p.cicloId === cicloActivo.id || (!p.cicloId && p.fechaPago >= cicloActivo.fechaInicio && p.fechaPago <= cicloActivo.fechaFin)).reduce((s, p) => s + (p.netoAPagar || 0), 0);
            ventasCiclo = ventas.filter(v => v.cicloId === cicloActivo.id || (!v.cicloId && v.fecha >= cicloActivo.fechaInicio && v.fecha <= cicloActivo.fechaFin)).reduce((s, v) => s + (v.valorTotal || 0), 0);

            // Ciclo anterior para comparación
            const allCiclos = (await db.getByFinca('ciclos')).filter(c => c.fincaId === fincaId && !c.activo)
                .sort((a, b) => b.fechaFin.localeCompare(a.fechaFin));
            if (allCiclos.length > 0) {
                cicloAnterior = allCiclos[0];
                kilosCicloAnterior = cicloAnterior.totalKilos || 0;
            }
        }

        // Week comparison percentage
        let pctCambio = null;
        if (cicloAnterior && kilosCicloAnterior > 0) {
            pctCambio = Math.round(((kilosCiclo - kilosCicloAnterior) / kilosCicloAnterior) * 100);
        }

        const totalComida = comidas.reduce((s, c) => s + (c.valor || 0), 0);
        const totalVentas = ventas.reduce((s, v) => s + (v.valorTotal || 0), 0);
        const totalCascota = cascota.reduce((s, c) => s + (c.kilos || 0), 0);
        const obrerosActivos = obreros.filter(o => o.estado === 'activo').length;

        // Generate alerts
        const alertas = await Dashboard.generarAlertas(jornales, obreros, productos, today);

        // Production by lote (Ciclo Activo)
        const ltMap = Object.fromEntries(lotes.map(l => [l.id, l.nombre]));
        const prodPorLote = {};
        lotes.forEach(l => { prodPorLote[l.id] = 0; });

        const jornalesCiclo = cicloActivo
            ? jornales.filter(j => j.cicloId === cicloActivo.id || (!j.cicloId && j.fecha >= cicloActivo.fechaInicio && j.fecha <= cicloActivo.fechaFin))
            : jornales;

        jornalesCiclo.forEach(j => {
            if (prodPorLote[j.loteId] !== undefined) prodPorLote[j.loteId] += j.kilosRecolectados || 0;
        });

        // Top lotes
        const topLotes = Object.entries(prodPorLote)
            .map(([id, kg]) => ({ nombre: ltMap[id] || '?', kg }))
            .sort((a, b) => b.kg - a.kg)
            .slice(0, 5);

        // Top recolectores (Ciclo Activo)
        const obMap = Object.fromEntries(obreros.map(o => [o.id, o.nombre]));
        const kilosPorObrero = {};
        jornalesCiclo.forEach(j => {
            kilosPorObrero[j.obreroId] = (kilosPorObrero[j.obreroId] || 0) + (j.kilosRecolectados || 0);
        });
        const topRecolectores = Object.entries(kilosPorObrero)
            .map(([id, kg]) => ({ nombre: obMap[id] || '?', kg }))
            .sort((a, b) => b.kg - a.kg)
            .slice(0, 5);

        // Max values for bars
        const maxLote = Math.max(...topLotes.map(l => l.kg), 1);
        const maxRec = Math.max(...topRecolectores.map(r => r.kg), 1);

        // Comida por Lote (Ciclo Activo)
        const comidaPorLote = {};
        lotes.forEach(l => { comidaPorLote[l.id] = 0; });
        const comidasCicloList = cicloActivo
            ? comidas.filter(c => c.cicloId === cicloActivo.id || (!c.cicloId && c.fecha >= cicloActivo.fechaInicio && c.fecha <= cicloActivo.fechaFin))
            : comidas;
        comidasCicloList.forEach(c => {
            if (c.loteId && comidaPorLote[c.loteId] !== undefined) {
                comidaPorLote[c.loteId] += c.valor || 0;
            }
        });
        const topComidaLotes = Object.entries(comidaPorLote)
            .map(([id, valor]) => ({ nombre: ltMap[id] || '?', valor }))
            .filter(l => l.valor > 0)
            .sort((a, b) => b.valor - a.valor);
        const maxComidaLote = Math.max(...topComidaLotes.map(l => l.valor), 1);

        // Week & month data
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekStr = weekAgo.toLocaleDateString('en-CA');
        const kilosSemana = jornales.filter(j => j.fecha >= weekStr).reduce((s, j) => s + (j.kilosRecolectados || 0), 0);
        const monthStart = today.substring(0, 7) + '-01';
        const kilosMes = jornales.filter(j => j.fecha >= monthStart).reduce((s, j) => s + (j.kilosRecolectados || 0), 0);

        app.innerHTML = `
            <div class="animate-in">
                <div class="header-premium" style="margin-bottom:24px">
                    <div class="header-icon" style="background:var(--bg-card-hover); color:var(--text-main)"><i data-lucide="layout-dashboard"></i></div>
                    <div style="flex:1; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px">
                        <div>
                            <h2>Dashboard</h2>
                            <p class="text-muted" style="margin:0; font-size:0.85rem">Panel operativo — ${new Date().toLocaleDateString('es-CO', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                        </div>
                        <div style="display:flex; align-items:center; gap:8px">
                            <i data-lucide="map-pin" style="width:16px; color:var(--text-muted)"></i>
                            <select id="finca-select" class="input-premium" onchange="Dashboard.cambiarFinca(this.value)" style="min-width:180px; min-height:40px; margin:0; padding-left:12px; font-weight:600">
                                ${fincas.map(f => `<option value="${f.id}" ${f.id === fincaId ? 'selected' : ''}>${f.nombre}</option>`).join('')}
                            </select>
                            <button class="btn-icon-only" onclick="Dashboard.gestionarFincas()" title="Gestionar fincas" style="background:var(--bg-surface-hover); border:1px solid var(--border-color); border-radius:10px; width:40px; height:40px">
                                <i data-lucide="settings" style="width:18px; color:var(--text-muted)"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Alertas inteligentes -->
                ${alertas.length > 0 ? `
                    <div id="dashboard-alertas" style="margin-bottom:24px; display:flex; flex-direction:column; gap:8px">
                        ${alertas.map(a => `
                            <div class="card-premium" style="padding:12px 16px; display:flex; align-items:center; gap:12px; border:1px solid ${a.tipo === 'danger' ? 'var(--color-danger)' : a.tipo === 'warning' ? '#f59e0b' : 'var(--color-primary)'}; background:${a.tipo === 'danger' ? 'rgba(239, 68, 68, 0.05)' : a.tipo === 'warning' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(34, 197, 94, 0.05)'}!important">
                                <div style="background:var(--bg-app); border-radius:8px; padding:6px; display:flex; align-items:center">
                                    <i data-lucide="${a.icono}" style="width:18px; color:${a.tipo === 'danger' ? 'var(--color-danger)' : a.tipo === 'warning' ? '#f59e0b' : 'var(--color-primary)'}"></i>
                                </div>
                                <span style="font-size:0.85rem; color:var(--text-main); line-height:1.4">${a.mensajeHtml}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                <!-- Ciclo activo widget -->
                ${cicloActivo ? `
                    <div class="card-premium" onclick="location.hash='ciclos'" style="cursor:pointer; margin-bottom:24px; padding:16px; border:1px solid var(--color-primary); background:linear-gradient(145deg, var(--bg-surface) 0%, rgba(34, 197, 94, 0.03) 100%)!important; display:flex; justify-content:space-between; align-items:center">
                        <div style="display:flex; align-items:center; gap:16px">
                            <div style="background:var(--color-primary); color:#fff; width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(34, 197, 94, 0.3)">
                                <i data-lucide="calendar-clock"></i>
                            </div>
                            <div>
                                <h3 style="margin:0 0 4px 0; font-size:1.1rem; color:var(--text-main)">${cicloActivo.nombre}</h3>
                                <div class="text-muted" style="font-size:0.8rem; display:flex; align-items:center; gap:6px">
                                    <span>${Ciclos.formatFecha(cicloActivo.fechaInicio)} → ${Ciclos.formatFecha(cicloActivo.fechaFin)}</span>
                                    <span style="background:var(--bg-app); padding:2px 8px; border-radius:10px; font-weight:700; color:var(--text-main)">Quedan ${Ciclos.diasRestantes(cicloActivo.fechaFin)} días</span>
                                </div>
                            </div>
                        </div>
                        <button class="btn-premium primary" style="padding:0 16px; height:40px" onclick="event.stopPropagation(); Ciclos.cerrarCiclo()">
                            <i data-lucide="calculator"></i> <span class="hide-mobile">Liquidar</span>
                        </button>
                    </div>
                ` : `
                    <div class="card-premium" style="margin-bottom:24px; padding:24px; text-align:center; border:1px dashed var(--color-danger)">
                        <i data-lucide="calendar-off" style="width:32px; height:32px; color:var(--color-danger); opacity:0.5; margin-bottom:12px"></i>
                        <h3 style="margin:0 0 8px 0">Sistema congelado</h3>
                        <p class="text-muted text-sm mb-2" style="max-width:300px; margin:0 auto 16px;">Para registrar datos financieros necesitas iniciar la semana productiva.</p>
                        <button class="btn-premium" style="background:var(--color-danger); color:#fff; border:none" onclick="location.hash='ciclos'">Abrir Semana</button>
                    </div>
                `}

                <!-- KPIs principales (ciclo activo) -->
                <div class="grid-4" style="gap:12px; margin-bottom:24px">
                    <div class="card-premium" style="padding:16px; display:flex; flex-direction:column; justify-content:space-between">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px">
                            <div class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:700">Recolección<br>Hoy</div>
                            <div style="background:rgba(34, 197, 94, 0.1); color:var(--color-primary); border-radius:8px; padding:6px"><i data-lucide="scale" style="width:16px; height:16px"></i></div>
                        </div>
                        <div class="tabular-data" style="font-size:1.6rem; font-weight:800; color:var(--text-main)">${kilosHoy.toLocaleString()} <span style="font-size:0.9rem; color:var(--text-muted); font-weight:600">kg</span></div>
                    </div>
                    
                    <div class="card-premium" style="padding:16px; display:flex; flex-direction:column; justify-content:space-between">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px">
                            <div class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:700">Acumulado<br>Semana</div>
                            <div style="background:var(--bg-app); color:var(--text-main); border-radius:8px; padding:6px; border:1px solid var(--border-color)"><i data-lucide="boxes" style="width:16px; height:16px"></i></div>
                        </div>
                        <div class="tabular-data" style="font-size:1.6rem; font-weight:800; color:var(--text-main)">${kilosCiclo.toLocaleString()} <span style="font-size:0.9rem; color:var(--text-muted); font-weight:600">kg</span></div>
                    </div>

                    <div class="card-premium" style="padding:16px; display:flex; flex-direction:column; justify-content:space-between; border:1px solid rgba(245, 158, 11, 0.3); background:rgba(245, 158, 11, 0.02)!important">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px">
                            <div class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:#b45309">Deuda<br>Desglosada</div>
                            <div style="background:rgba(245, 158, 11, 0.1); color:#f59e0b; border-radius:8px; padding:6px"><i data-lucide="store" style="width:16px; height:16px"></i></div>
                        </div>
                        <div style="display:flex; gap:12px; flex-wrap:wrap">
                            <div>
                                <div style="font-size:0.65rem; color:var(--text-muted); text-transform:uppercase; font-weight:700">Tienda</div>
                                <div class="tabular-data" style="font-size:1.2rem; font-weight:800; color:var(--text-main)">$${ventasCiclo.toLocaleString()}</div>
                            </div>
                            <div>
                                <div style="font-size:0.65rem; color:var(--text-muted); text-transform:uppercase; font-weight:700">Comedor</div>
                                <div class="tabular-data" style="font-size:1.2rem; font-weight:800; color:var(--text-main)">$${comidaCiclo.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>

                    <div class="card-premium" style="padding:16px; display:flex; flex-direction:column; justify-content:space-between">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px">
                            <div class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:700">Nómina<br>Operativa</div>
                            <div style="background:var(--bg-app); color:var(--text-main); border-radius:8px; padding:6px; border:1px solid var(--border-color)"><i data-lucide="users" style="width:16px; height:16px"></i></div>
                        </div>
                        <div class="tabular-data" style="font-size:1.6rem; font-weight:800; color:var(--color-primary)">${obrerosActivos} <span style="font-size:0.9rem; color:var(--text-muted); font-weight:600">trabj.</span></div>
                    </div>
                </div>

                <!-- Comparativa -->
                <div class="card-premium" style="margin-bottom:24px; padding:0; overflow:hidden">
                    <div style="padding:16px; background:var(--bg-surface-hover); border-bottom:1px solid var(--border-color); display:flex; align-items:center; gap:8px">
                        <i data-lucide="trending-up" style="width:18px; color:var(--text-muted)"></i>
                        <span style="font-weight:700; font-size:0.85rem; text-transform:uppercase">Comparativa de Rendimiento</span>
                    </div>
                    <div style="display:flex; align-items:center; padding:16px; flex-wrap:wrap; gap:24px">
                        <div style="flex:1">
                            <div class="text-muted" style="font-size:0.75rem; text-transform:uppercase; margin-bottom:4px; font-weight:700">${cicloAnterior ? cicloAnterior.nombre : 'Semana Ant.'}</div>
                            <div class="tabular-data" style="font-size:1.3rem; font-weight:800; color:var(--text-main)">${kilosCicloAnterior.toLocaleString()} <span style="font-size:0.8rem; font-weight:600; color:var(--text-muted)">kg</span></div>
                        </div>
                        
                        <div style="display:flex; align-items:center; justify-content:center; flex-direction:column; border-left:1px dashed var(--border-color); border-right:1px dashed var(--border-color); padding:0 24px">
                            <div class="text-muted" style="font-size:0.7rem; text-transform:uppercase; font-weight:700; margin-bottom:4px">Diferencial</div>
                            ${pctCambio !== null ? `
                                <div class="tabular-data badge" style="font-size:1rem; padding:4px 12px; background:${pctCambio >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'}; color:${pctCambio >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}; border:1px solid ${pctCambio >= 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}">
                                    ${pctCambio > 0 ? '+' : ''}${pctCambio}%
                                </div>
                            ` : '<span class="text-muted" style="font-size:0.9rem">—</span>'}
                        </div>
                        
                        <div style="flex:1; text-align:right">
                            <div class="text-muted" style="font-size:0.75rem; text-transform:uppercase; margin-bottom:4px; font-weight:700">${cicloActivo ? cicloActivo.nombre : 'Actual'}</div>
                            <div class="tabular-data" style="font-size:1.3rem; font-weight:800; color:var(--text-main)">${kilosCiclo.toLocaleString()} <span style="font-size:0.8rem; font-weight:600; color:var(--text-muted)">kg</span></div>
                        </div>
                    </div>
                </div>

                <div class="grid-3" style="gap:16px; margin-bottom:24px">
                    <!-- Top Lotes -->
                    <div class="card-premium" style="padding:0; overflow:hidden">
                        <div style="padding:16px; background:var(--bg-surface-hover); border-bottom:1px solid var(--border-color); display:flex; align-items:center; gap:8px">
                            <i data-lucide="map" style="width:18px; color:var(--text-muted)"></i>
                            <span style="font-weight:700; font-size:0.85rem; text-transform:uppercase">Top Lotes Productivos ${cicloActivo ? '<span class="text-muted" style="text-transform:none;font-weight:normal">(Semana)</span>' : ''}</span>
                        </div>
                        <div style="padding:16px">
                            ${topLotes.length === 0 ? '<div style="padding:40px 0; text-align:center; color:var(--text-muted)"><i data-lucide="ghost" style="width:32px; height:32px; opacity:0.3; margin:0 auto 12px; display:block"></i>Sin datos que mostrar</div>' : `
                                <div style="display:flex; flex-direction:column; gap:16px; margin-top:8px">
                                    ${topLotes.map((l, i) => `
                                        <div>
                                            <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:0.85rem">
                                                <span style="font-weight:600; color:var(--text-main)">${i + 1}. ${l.nombre}</span>
                                                <span class="tabular-data" style="font-weight:700; color:var(--text-muted)">${l.kg.toLocaleString()} kg</span>
                                            </div>
                                            <div style="height:6px; background:var(--bg-app); border-radius:10px; overflow:hidden; border:1px solid var(--border-color)">
                                                <div style="height:100%; width:${(l.kg / maxLote) * 100}%; background:var(--color-primary); border-radius:10px"></div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            `}
                        </div>
                    </div>

                    <!-- Top Recolectores -->
                    <div class="card-premium" style="padding:0; overflow:hidden">
                        <div style="padding:16px; background:var(--bg-surface-hover); border-bottom:1px solid var(--border-color); display:flex; align-items:center; gap:8px">
                            <i data-lucide="award" style="width:18px; color:var(--text-muted)"></i>
                            <span style="font-weight:700; font-size:0.85rem; text-transform:uppercase">Mejores Recolectores ${cicloActivo ? '<span class="text-muted" style="text-transform:none;font-weight:normal">(Semana)</span>' : ''}</span>
                        </div>
                        <div style="padding:0">
                            ${topRecolectores.length === 0 ? '<div style="padding:40px 0; text-align:center; color:var(--text-muted)"><i data-lucide="ghost" style="width:32px; height:32px; opacity:0.3; margin:0 auto 12px; display:block"></i>Sin datos que mostrar</div>' : `
                                <div style="display:flex; flex-direction:column">
                                    ${topRecolectores.map((r, i) => {
            const isPodium = i < 3;
            const medals = ['var(--color-primary)', 'var(--text-muted)', '#cd7f32'];
            const bg = isPodium ? `rgba(${i === 0 ? '34, 197, 94' : i === 1 ? '156, 163, 175' : '245, 158, 11'}, 0.1)` : 'var(--bg-app)';
            return `
                                            <div class="worker-row-premium" style="padding:12px 16px; border-bottom:1px solid var(--border-color); display:flex; align-items:center; gap:12px; cursor:default; background:${isPodium ? bg : ''}">
                                                <div class="avatar" style="width:32px; height:32px; border-radius:8px; background:var(--bg-app); border:1px solid var(--border-color); display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.8rem; color:${isPodium ? medals[i] : 'var(--text-muted)'}">
                                                    #${i + 1}
                                                </div>
                                                <div style="flex:1">
                                                    <div style="font-weight:700; font-size:0.95rem; color:var(--text-main)">${r.nombre}</div>
                                                </div>
                                                <div class="tabular-data" style="font-weight:800; font-size:1.05rem; color:var(--text-main)">
                                                    ${r.kg.toLocaleString()} <span style="font-size:0.7rem; font-weight:600; color:var(--text-muted)">kg</span>
                                                </div>
                                            </div>
                                        `
        }).join('')}
                                </div>
                            `}
                        </div>
                    </div>

                    <!-- Comida por Lote -->
                    <div class="card-premium" style="padding:0; overflow:hidden">
                        <div style="padding:16px; background:var(--bg-surface-hover); border-bottom:1px solid var(--border-color); display:flex; align-items:center; gap:8px">
                            <i data-lucide="utensils" style="width:18px; color:var(--text-muted)"></i>
                            <span style="font-weight:700; font-size:0.85rem; text-transform:uppercase">Comida por Lote ${cicloActivo ? '<span class="text-muted" style="text-transform:none;font-weight:normal">(Semana)</span>' : ''}</span>
                        </div>
                        <div style="padding:16px">
                            ${topComidaLotes.length === 0 ? '<div style="padding:40px 0; text-align:center; color:var(--text-muted)"><i data-lucide="ghost" style="width:32px; height:32px; opacity:0.3; margin:0 auto 12px; display:block"></i>Sin deudas registradas</div>' : `
                                <div style="display:flex; flex-direction:column; gap:16px; margin-top:8px">
                                    ${topComidaLotes.map((l, i) => `
                                        <div>
                                            <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:0.85rem">
                                                <span style="font-weight:600; color:var(--text-main)">${i + 1}. ${l.nombre}</span>
                                                <span class="tabular-data" style="font-weight:700; color:var(--color-danger)">$${l.valor.toLocaleString()}</span>
                                            </div>
                                            <div style="height:6px; background:var(--bg-app); border-radius:10px; overflow:hidden; border:1px solid var(--border-color)">
                                                <div style="height:100%; width:${(l.valor / maxComidaLote) * 100}%; background:var(--color-danger); border-radius:10px"></div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            `}
                        </div>
                    </div>
                </div>

                <!-- Recolección últimos 7 días -->
                <div class="card-premium" style="padding:0; overflow:hidden">
                    <div style="padding:16px; background:var(--bg-surface-hover); border-bottom:1px solid var(--border-color); display:flex; align-items:center; justify-content:space-between">
                         <div style="display:flex; align-items:center; gap:8px">
                            <i data-lucide="bar-chart-3" style="width:18px; color:var(--text-muted)"></i>
                            <span style="font-weight:700; font-size:0.85rem; text-transform:uppercase">Curva - Últimos 7 Días</span>
                         </div>
                    </div>
                    <div class="bar-chart" id="chart-7dias" style="padding:24px 16px"></div>
                </div>
            </div>
        `;

        Dashboard.render7DayChart(jornales);
        if (window.lucide) window.lucide.createIcons();
    },

    /* ========================================
       Alertas Inteligentes
       ======================================== */
    async generarAlertas(jornales, obreros, productos, today) {
        const alertas = [];

        // 1) Producción baja: kilosHoy < 60% de kilosAyer
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const ayer = yesterday.toLocaleDateString('en-CA');

        const kilosHoy = jornales.filter(j => j.fecha === today).reduce((s, j) => s + (j.kilosRecolectados || 0), 0);
        const kilosAyer = jornales.filter(j => j.fecha === ayer).reduce((s, j) => s + (j.kilosRecolectados || 0), 0);

        if (kilosAyer > 0 && kilosHoy < kilosAyer * 0.6) {
            alertas.push({
                tipo: 'warning',
                icono: 'trending-down',
                mensajeHtml: `<strong>Producción baja:</strong> ${kilosHoy.toLocaleString()} kg hoy vs ${kilosAyer.toLocaleString()} kg ayer <br><small class="text-muted">(${kilosAyer > 0 ? Math.round((kilosHoy / kilosAyer) * 100) : 0}% respecto al día anterior)</small>`
            });
        }

        // 2) Obrero inactivo: sin jornales en 5 días
        const hace5 = new Date();
        hace5.setDate(hace5.getDate() - 5);
        const hace5Str = hace5.toLocaleDateString('en-CA');

        const obrerosActivos = obreros.filter(o => o.estado === 'activo');
        for (const obrero of obrerosActivos) {
            const tieneReciente = jornales.some(j => j.obreroId === obrero.id && j.fecha >= hace5Str);
            if (!tieneReciente && jornales.some(j => j.obreroId === obrero.id)) {
                alertas.push({
                    tipo: 'info',
                    icono: 'user-minus',
                    mensajeHtml: `<strong>Obrero inactivo:</strong> ${obrero.nombre} <br><small class="text-muted">Lleva más de 5 días sin registrar pesajes.</small>`
                });
            }
        }

        // 3) Stock bajo: producto.stock < 5
        for (const prod of productos) {
            if (prod.stock !== undefined && prod.stock < 5) {
                alertas.push({
                    tipo: 'danger',
                    icono: 'package-minus',
                    mensajeHtml: `<strong>Límite de stock:</strong> ${prod.nombre} <br><small class="text-muted">Quedan ${prod.stock} unidades en el inventario.</small>`
                });
            }
        }

        // 4) Ciclo termina pronto
        const cicloActivo = await db.getCicloActivo();
        if (cicloActivo) {
            const diasRest = Ciclos.diasRestantes(cicloActivo.fechaFin);
            if (diasRest === 0) {
                alertas.push({
                    tipo: 'danger',
                    icono: 'alarm-clock',
                    mensajeHtml: `<strong>¡Corte de quincena/semana!</strong><br><small class="text-muted">Hoy finaliza el ciclo operativo. Cierra la semana para liquidar nómina.</small>`
                });
            } else if (diasRest === 1) {
                alertas.push({
                    tipo: 'warning',
                    icono: 'clock',
                    mensajeHtml: `<strong>Atención al cierre:</strong><br><small class="text-muted">La semana operativa termina mañana.</small>`
                });
            }
        }

        return alertas;
    },

    /* ========================================
       Selector de finca
       ======================================== */
    cambiarFinca(fincaId) {
        db.setFincaActiva(parseInt(fincaId));
        Dashboard.render();
        App.toast('Finca cambiada', 'info');
    },

    async gestionarFincas() {
        const fincas = await db.getByFinca('fincas');
        const fincaId = db.getFincaActiva();

        const html = `
            <div class="modal-system-overlay" onclick="Dashboard.closeModal(event)" style="display:flex;align-items:center;justify-content:center;padding:16px;">
                <div class="card-premium animate-in" onclick="event.stopPropagation()" style="width:100%; max-width:440px; padding:24px;">
                    <div class="header-premium" style="margin-bottom:24px;">
                        <div class="header-icon" style="background:var(--bg-surface-hover); color:var(--text-main)"><i data-lucide="map"></i></div>
                        <div style="flex:1">
                            <h3 style="margin:0; font-size:1.1rem">Gestionar Fincas</h3>
                            <p class="text-muted" style="font-size:0.85rem; margin:0">Administra tus centros de producción</p>
                        </div>
                        <button class="btn-icon-only" onclick="Dashboard.closeModal()" style="border:none; background:transparent"><i data-lucide="x"></i></button>
                    </div>

                    <div id="fincas-list" style="margin-bottom:24px; max-height:200px; overflow-y:auto; padding-right:8px">
                        ${fincas.map(f => `
                            <div class="worker-row-premium" style="padding:12px 16px; border-bottom:1px solid var(--border-color); display:flex; align-items:center; gap:12px; border-left:3px solid ${f.id === fincaId ? 'var(--color-primary)' : 'transparent'}">
                                <div style="flex:1">
                                    <div style="font-weight:700; font-size:0.95rem; color:var(--text-main)">${f.nombre} ${f.id === fincaId ? '<span style="font-size:0.6rem; background:rgba(34,197,94,0.1); color:var(--color-success); border:1px solid rgba(34,197,94,0.2); padding:2px 6px; border-radius:10px; margin-left:6px; vertical-align:middle">ACTIVA</span>' : ''}</div>
                                    <div class="text-muted" style="font-size:0.75rem">${f.ubicacion || 'Sin ubicación'} ${f.areaTotal ? '· ' + f.areaTotal + ' ha' : ''}</div>
                                </div>
                                <div style="display:flex; gap:8px">
                                    <button class="btn-icon-only text-muted" onclick="Dashboard.editarFinca(${f.id})" style="width:32px; height:32px; border:1px solid var(--border-color); border-radius:8px">
                                        <i data-lucide="edit-2" style="width:14px"></i>
                                    </button>
                                    ${fincas.length > 1 ? `
                                        <button class="btn-icon-only text-danger" onclick="Dashboard.eliminarFinca(${f.id})" style="width:32px; height:32px; border:1px solid rgba(239,68,68,0.2); border-radius:8px">
                                            <i data-lucide="trash-2" style="width:14px"></i>
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <form onsubmit="Dashboard.crearFinca(event)" style="background:var(--bg-surface-hover); padding:16px; border-radius:12px; border:1px solid var(--border-color)">
                        <p class="text-muted" style="font-size:0.75rem; text-transform:uppercase; font-weight:700; margin-bottom:12px">Agregar un nuevo predio</p>
                        <div class="input-group" style="margin-bottom:12px">
                            <label class="text-muted" style="font-size:0.75rem; font-weight:600; margin-bottom:4px; display:block">Nombre Finca</label>
                            <input type="text" class="input-premium" id="nf-nombre" required placeholder="Ej: Finca El Porvenir">
                        </div>
                        <div class="grid-2" style="gap:12px; margin-bottom:16px">
                            <div class="input-group" style="margin:0">
                                <label class="text-muted" style="font-size:0.75rem; font-weight:600; margin-bottom:4px; display:block">Ubicación</label>
                                <input type="text" class="input-premium" id="nf-ubicacion" placeholder="Opcional">
                            </div>
                            <div class="input-group" style="margin:0">
                                <label class="text-muted" style="font-size:0.75rem; font-weight:600; margin-bottom:4px; display:block">Ha. Productivas</label>
                                <input type="number" class="input-premium" id="nf-area" step="0.01" min="0" placeholder="0.00">
                            </div>
                        </div>
                        <button type="submit" class="btn-premium primary" style="width:100%"><i data-lucide="plus-circle"></i> Crear Finca</button>
                    </form>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
        if (window.lucide) window.lucide.createIcons();
    },

    async crearFinca(e) {
        e.preventDefault();
        const nombre = document.getElementById('nf-nombre').value.trim();
        if (!nombre) return;

        await db.add('fincas', {
            nombre,
            ubicacion: document.getElementById('nf-ubicacion').value.trim(),
            areaTotal: document.getElementById('nf-area').value.trim(),
            fechaCreacion: new Date().toLocaleDateString('en-CA')
        });

        App.toast('Finca creada', 'success');
        Dashboard.closeModal();
        Dashboard.render();
    },

    async editarFinca(id) {
        const finca = await db.get('fincas', id);
        if (!finca) return;

        Dashboard.closeModal();

        const html = `
            <div class="modal-system-overlay" onclick="Dashboard.closeModal(event)" style="display:flex;align-items:center;justify-content:center;padding:16px;">
                <div class="card-premium animate-in" onclick="event.stopPropagation()" style="width:100%; max-width:440px; padding:24px;">
                    <div class="header-premium" style="margin-bottom:24px;">
                        <div class="header-icon" style="background:var(--bg-surface-hover); color:var(--text-main)"><i data-lucide="edit-3"></i></div>
                        <div style="flex:1">
                            <h3 style="margin:0; font-size:1.1rem">Editar Finca</h3>
                            <p class="text-muted" style="font-size:0.85rem; margin:0">Ajusta los detalles de ${finca.nombre}</p>
                        </div>
                        <button class="btn-icon-only" onclick="Dashboard.closeModal()" style="border:none; background:transparent"><i data-lucide="x"></i></button>
                    </div>
                    <form onsubmit="Dashboard.actualizarFinca(event, ${id})">
                        <div class="input-group" style="margin-bottom:16px">
                            <label class="text-muted" style="font-size:0.75rem; font-weight:600; margin-bottom:4px; display:block">Nombre Finca</label>
                            <input type="text" class="input-premium" id="ef-nombre" value="${finca.nombre}" required>
                        </div>
                        <div class="grid-2" style="gap:12px; margin-bottom:24px">
                            <div class="input-group" style="margin:0">
                                <label class="text-muted" style="font-size:0.75rem; font-weight:600; margin-bottom:4px; display:block">Ubicación</label>
                                <input type="text" class="input-premium" id="ef-ubicacion" value="${finca.ubicacion || ''}">
                            </div>
                            <div class="input-group" style="margin:0">
                                <label class="text-muted" style="font-size:0.75rem; font-weight:600; margin-bottom:4px; display:block">Área total (ha)</label>
                                <input type="number" class="input-premium" id="ef-area" step="0.01" value="${finca.areaTotal || ''}">
                            </div>
                        </div>
                        <div style="display:flex; gap:12px">
                            <button type="button" class="btn-premium secondary flex-1" onclick="Dashboard.closeModal()">Cancelar</button>
                            <button type="submit" class="btn-premium primary flex-1"><i data-lucide="save"></i> Guardar Cambios</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
        if (window.lucide) window.lucide.createIcons();
    },

    async actualizarFinca(e, id) {
        e.preventDefault();
        await db.put('fincas', {
            id,
            nombre: document.getElementById('ef-nombre').value.trim(),
            ubicacion: document.getElementById('ef-ubicacion').value.trim(),
            areaTotal: document.getElementById('ef-area').value.trim(),
            fechaCreacion: (await db.get('fincas', id)).fechaCreacion
        });
        App.toast('Finca actualizada', 'success');
        Dashboard.closeModal();
        Dashboard.render();
    },

    async eliminarFinca(id) {
        const fincaId = db.getFincaActiva();
        if (id === fincaId) return App.toast('No puedes eliminar la finca activa', 'error');
        App.confirm({
            title: 'Desvincular Predio',
            message: '¿Estás seguro de eliminar esta Finca? Los datos asociados se mantendrán en la base histórica pero ya no estarán referenciados.',
            confirmText: 'Sí, Eliminar',
            onConfirm: async () => {
                await db.delete('fincas', id);
                App.toast('Finca eliminada de los registros', 'info');
                Dashboard.closeModal();
                Dashboard.render();
            }
        });
    },

    closeModal(e) {
        if (e && e.target !== e.currentTarget) return;
        const modal = document.querySelector('.modal-system-overlay');
        if (modal) modal.remove();
    },

    /* ========================================
       Gráfico 7 días
       ======================================== */
    render7DayChart(jornales) {
        const container = document.getElementById('chart-7dias');
        if (!container) return;

        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(d.toLocaleDateString('en-CA'));
        }

        const data = days.map(date => {
            const kg = jornales.filter(j => j.fecha === date).reduce((s, j) => s + (j.kilosRecolectados || 0), 0);
            return { date, kg };
        });

        const maxKg = Math.max(...data.map(d => d.kg), 1);

        container.innerHTML = data.map(d => {
            const dayName = new Date(d.date + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'short' });
            return `
                <div class="bar-item">
                    <div class="bar-value">${d.kg > 0 ? d.kg.toLocaleString() : ''}</div>
                    <div class="bar" style="height:${(d.kg / maxKg) * 130}px;${d.kg === 0 ? 'background:var(--bg-card-hover)' : ''}"></div>
                    <div class="bar-label">${dayName}</div>
                </div>
            `;
        }).join('');
    }
};
