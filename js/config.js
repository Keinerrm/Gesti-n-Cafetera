/* ============================================
   config.js — Configuración del Sistema
   ============================================ */

const Config = {
    async render() {
        const tarifaKilo = await db.getConfig('tarifaKilo', 500);
        const tarifaDia = await db.getConfig('tarifaDia', 40000);
        const tarifaDomingo = await db.getConfig('tarifaDomingo', 60000);
        const factorConversion = await db.getConfig('factorConversion', 0.5);
        const kilosPorLata = await db.getConfig('kilosPorLata', 12.5);
        const precioCarga = await db.getConfig('precioCarga', 2000000);
        const precioDesayuno = await db.getConfig('precioDesayuno', 3000);
        const precioAlmuerzo = await db.getConfig('precioAlmuerzo', 5000);
        const precioCena = await db.getConfig('precioCena', 3000);
        const diaCorte = await db.getConfig('diaCorte', 1);

        const fincas = await db.getByFinca('fincas');
        const fincaActivaId = db.getFincaActiva();

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="animate-in">
                <div class="header-premium">
                    <div class="header-icon" style="background:rgba(22, 163, 74, 0.1); color:var(--color-primary)"><i data-lucide="settings"></i></div>
                    <div>
                        <h2>Configuración</h2>
                        <p>Ajustes globales, tarifas y administración del sistema</p>
                    </div>
                </div>

                <!-- Apariencia / Theme -->
                <div class="card-premium mb-2" id="cfg-theme-card">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px; font-weight:700; color:var(--text-main); font-size:1.1rem">
                        <i data-lucide="palette" style="color:var(--accent)"></i> Apariencia
                    </div>
                    <p class="text-muted mb-2" style="font-size:0.85rem">Elige el tema visual del sistema. Se aplicará de inmediato y se recordará en este dispositivo.</p>
                    <div class="cfg-theme-grid">
                        ${Config._renderThemeCards()}
                    </div>
                </div>

                <!-- Gestor Multi-Finca -->
                <div class="card-premium mb-2" style="border: 2px solid var(--color-brand) !important">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px; font-weight:700; color:var(--text-main); font-size:1.1rem">
                        <i data-lucide="tractor" style="color:var(--color-brand)"></i> Finca Activa
                    </div>
                    <p class="text-muted mb-2" style="font-size:0.85rem">Cambia de finca para aislar contabilidades, lotes y trabajadores.</p>
                    
                    <div class="input-group mb-2">
                        <select id="cfg-finca-activa" class="input-premium" onchange="Config.changeFinca(this.value)">
                            ${fincas.map(f => `<option value="${f.id}" ${f.id === fincaActivaId ? 'selected' : ''}>${f.nombre} ${f.id === fincaActivaId ? '(Activa)' : ''}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div style="display:flex; gap:12px">
                        <button class="btn-premium secondary flex-1" style="justify-content:center" onclick="Config.promptNuevaFinca()">
                            <i data-lucide="plus"></i> Agg. Finca
                        </button>
                        ${fincaActivaId !== 1 ? `
                        <button class="btn-premium flex-1" style="background:var(--color-danger); color:#fff; border:none; justify-content:center" onclick="Config.eliminarFincaActiva()">
                            <i data-lucide="trash-2"></i> Eliminar
                        </button>` : ''}
                    </div>
                </div>

                <!-- Tarifas -->
                <div class="card-premium mb-2">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:16px; font-weight:700; color:var(--text-main); font-size:1.1rem">
                        <i data-lucide="coins" style="color:var(--color-warning)"></i> Tarifas de Trabajo
                    </div>
                    <form onsubmit="Config.saveTarifas(event)">
                        <div class="grid-3">
                            <div class="input-group">
                                <label>Por Kilo ($)</label>
                                <input type="number" id="cfg-tkilo" class="input-premium tabular-data" value="${tarifaKilo}" min="0" required>
                            </div>
                            <div class="input-group">
                                <label>Por Día ($)</label>
                                <input type="number" id="cfg-tdia" class="input-premium tabular-data" value="${tarifaDia}" min="0" required>
                            </div>
                            <div class="input-group">
                                <label>Domingo ($)</label>
                                <input type="number" id="cfg-tdom" class="input-premium tabular-data" value="${tarifaDomingo}" min="0" required>
                            </div>
                        </div>
                        <button type="submit" class="btn-premium primary mt-2 w-100" style="justify-content:center">
                            <i data-lucide="save"></i> Guardar Tarifas
                        </button>
                    </form>
                </div>

                <!-- Comida -->
                <div class="card-premium mb-2">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:16px; font-weight:700; color:var(--text-main); font-size:1.1rem">
                        <i data-lucide="utensils" style="color:#FCA5A5"></i> Precios de Comida
                    </div>
                    <form onsubmit="Config.saveComida(event)">
                        <div class="grid-3">
                            <div class="input-group">
                                <label>Desayuno ($)</label>
                                <input type="number" id="cfg-desayuno" class="input-premium tabular-data" value="${precioDesayuno}" min="0" required>
                            </div>
                            <div class="input-group">
                                <label>Almuerzo ($)</label>
                                <input type="number" id="cfg-almuerzo" class="input-premium tabular-data" value="${precioAlmuerzo}" min="0" required>
                            </div>
                            <div class="input-group">
                                <label>Cena ($)</label>
                                <input type="number" id="cfg-cena" class="input-premium tabular-data" value="${precioCena}" min="0" required>
                            </div>
                        </div>
                        <button type="submit" class="btn-premium primary mt-2 w-100" style="justify-content:center">
                            <i data-lucide="save"></i> Guardar Precios de Comida
                        </button>
                    </form>
                </div>

                <!-- Conversión y Mercado -->
                <div class="card-premium mb-2">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:16px; font-weight:700; color:var(--text-main); font-size:1.1rem">
                        <i data-lucide="bar-chart-2" style="color:var(--color-info)"></i> Productividad y Mercado
                    </div>
                    <form onsubmit="Config.saveConversion(event)">
                        <div class="grid-3" style="margin-bottom:12px">
                            <div class="input-group">
                                <label>Kg x Lata</label>
                                <input type="number" id="cfg-lata" class="input-premium tabular-data" value="${kilosPorLata}" step="0.1" min="1" required>
                            </div>
                            <div class="input-group">
                                <label>Factor (R/M)</label>
                                <input type="number" id="cfg-factor" class="input-premium tabular-data" value="${factorConversion}" step="0.01" min="0.01" max="1" required>
                            </div>
                        </div>
                        <div class="input-group" style="margin-bottom:12px">
                            <label>Precio de la Carga ($)</label>
                            <input type="number" id="cfg-carga" class="input-premium tabular-data" value="${precioCarga}" step="50000" min="0" required>
                            <small class="text-muted mt-1" style="display:block">Referencia: 125 kg Pergamino</small>
                        </div>
                        <button type="submit" class="btn-premium primary w-100" style="justify-content:center">
                            <i data-lucide="save"></i> Guardar Productividad
                        </button>
                    </form>
                </div>

                <!-- Contraseña -->
                <div class="card-premium mb-2">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:16px; font-weight:700; color:var(--text-main); font-size:1.1rem">
                        <i data-lucide="lock" style="color:var(--text-muted)"></i> Contraseña de Acceso
                    </div>
                    <form onsubmit="Config.savePassword(event)">
                        <div class="grid-2">
                            <div class="input-group">
                                <label>Nueva contraseña</label>
                                <input type="password" id="cfg-pass" class="input-premium" placeholder="****" required>
                            </div>
                            <div class="input-group">
                                <label>Confirmar</label>
                                <input type="password" id="cfg-pass2" class="input-premium" placeholder="****" required>
                            </div>
                        </div>
                        <button type="submit" class="btn-premium primary mt-2 w-100" style="justify-content:center">
                            <i data-lucide="shield-check"></i> Actualizar Contraseña
                        </button>
                    </form>
                </div>

                <!-- Ciclos -->
                <div class="card-premium mb-2">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:16px; font-weight:700; color:var(--text-main); font-size:1.1rem">
                        <i data-lucide="calendar" style="color:var(--color-primary)"></i> Ciclos Semanales
                    </div>
                    <form onsubmit="Config.saveCiclos(event)">
                        <div class="input-group">
                            <label>Día de inicio de semana</label>
                            <select id="cfg-diacorte" class="input-premium">
                                <option value="0" ${diaCorte === 0 ? 'selected' : ''}>Domingo</option>
                                <option value="1" ${diaCorte === 1 ? 'selected' : ''}>Lunes</option>
                                <option value="2" ${diaCorte === 2 ? 'selected' : ''}>Martes</option>
                                <option value="3" ${diaCorte === 3 ? 'selected' : ''}>Miércoles</option>
                                <option value="4" ${diaCorte === 4 ? 'selected' : ''}>Jueves</option>
                                <option value="5" ${diaCorte === 5 ? 'selected' : ''}>Viernes</option>
                                <option value="6" ${diaCorte === 6 ? 'selected' : ''}>Sábado</option>
                            </select>
                            <small class="text-muted mt-1" style="display:block">Este día empieza cada nueva semana de trabajo.</small>
                        </div>
                        <button type="submit" class="btn-premium primary w-100 mt-2" style="justify-content:center">
                            <i data-lucide="save"></i> Guardar Día de Corte
                        </button>
                    </form>
                </div>

                <!-- Backup / Restore -->
                <div class="card-premium mb-2" style="border-top:4px solid var(--color-primary) !important">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px; font-weight:700; color:var(--text-main); font-size:1.1rem">
                        <i data-lucide="database" style="color:var(--color-primary)"></i> Respaldo y Base de Datos
                    </div>
                    <p class="text-muted mb-2" style="font-size:0.85rem">Exportar tus datos regularmente previene pérdidas en caso de daño en el dispositivo.</p>
                    
                    <div class="grid-2 mb-2" style="gap:12px">
                        <button class="btn-premium primary" style="justify-content:center" onclick="Config.backup()">
                            <i data-lucide="download"></i> JSON
                        </button>
                        <button class="btn-premium secondary" style="justify-content:center" onclick="document.getElementById('cfg-restore-input').click()">
                            <i data-lucide="upload"></i> JSON
                        </button>
                    </div>

                    <div style="padding-top:16px; margin-top:16px; border-top:1px dashed var(--border-color)">
                        <div style="font-size:0.95rem; margin-bottom:12px; font-weight:600">📊 Exportar Datos a Excel</div>
                        <button class="btn-premium w-100" style="background:#107c41; color:#fff; border:none; justify-content:center" onclick="Config.exportarCSV()">
                            <i data-lucide="table"></i> Descargar Analíticas (CSV)
                        </button>
                    </div>

                    <input type="file" id="cfg-restore-input" accept=".json" style="display:none" onchange="Config.restore(event)">
                </div>

                <!-- Auditoría -->
                <div class="card-premium mb-2">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px; font-weight:700; color:var(--text-main); font-size:1.1rem">
                        <i data-lucide="clipboard-list" style="color:var(--text-muted)"></i> Auditoría de Cambios
                    </div>
                    <p class="text-muted mb-2" style="font-size:0.82rem">Revisa los cambios críticos de variables realizados en este dispositivo.</p>
                    <button class="btn-premium secondary w-100" style="justify-content:center" onclick="Config.toggleAudit()">
                        <i data-lucide="eye"></i> Mostrar Historial
                    </button>
                    <div id="cfg-audit-panel" style="display:none; margin-top:16px; border-top:1px solid var(--border-color); padding-top:16px; max-height: 400px; overflow-y:auto">
                        <!-- Audit Logs List -->
                    </div>
                </div>

                <!-- Cerrar sesión -->
                <div class="card-premium" style="text-align:center; padding:16px">
                    <button class="btn-premium" style="background:transparent; color:var(--color-danger); border:1px solid var(--border-color); width:100%; justify-content:center" onclick="Config.logout()">
                        <i data-lucide="log-out"></i> Cerrar Sesión Segura
                    </button>
                </div>
            </div>
            <style>
                .audit-item { background: var(--bg-app); padding: 12px; border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); margin-bottom: 8px; font-size: 0.85rem; }
                .audit-head { display:flex; justify-content:space-between; color: var(--text-muted); margin-bottom: 4px; font-size: 0.75rem; text-transform:uppercase; letter-spacing:0.5px}
                .audit-body { display:flex; align-items:center; gap: 8px; color: var(--text-main); font-weight:600;}
                .audit-icon { font-size: 1.2rem; }
            </style>
        `;

        if (window.lucide) window.lucide.createIcons();
    },

    async changeFinca(idStr) {
        const id = parseInt(idStr);
        db.setFincaActiva(id);
        App.toast('Cambiando de finca...', 'info');
        await db.initCicloDefault(); // Si no tiene ciclo, crea uno
        setTimeout(() => {
            location.reload(); // Recarga agresiva para limpiar memoria ram y asegurar aislamiento total
        }, 800);
    },

    async promptNuevaFinca() {
        const nombre = prompt('Ingresa el nombre de la nueva Finca:');
        if (!nombre || nombre.trim() === '') return;

        const ok = await App.confirmWithCode({ action: 'Nueva Finca', details: `Se aislará una base de datos lógica para: ${nombre}` });
        if (ok) {
            const nuevaFincaId = await db.add('fincas', {
                nombre: nombre.trim(),
                fechaCreacion: new Date().toLocaleDateString('en-CA')
            });
            await this.logAudit('Creación de Finca', 'N/A', nombre.trim());
            App.toast(`Finca ${nombre} creada`, 'success');
            await this.changeFinca(nuevaFincaId);
        }
    },

    async eliminarFincaActiva() {
        const id = db.getFincaActiva();
        if (id === 1) return App.toast('No puedes eliminar la Finca Principal (ID 1)', 'error');

        const finca = (await db.getByFinca('fincas')).find(f => f.id === id);

        App.confirmDelete({
            title: `Eliminar ${finca.nombre}`,
            message: `<strong>Peligro:</strong> Borrarás también todos los jornales, lotes y pagos que pertenezcan EXCLUSIVAMENTE a esta finca. ¿Proceder?`,
            icon: '⚠️',
            confirmText: 'Sí, Eliminar Todo',
            onConfirm: async () => {
                const ok2 = await App.confirmWithCode({ action: 'Eliminar Finca', details: 'Acción destructiva en cascada' });
                if (ok2) {
                    await db.delete('fincas', id);
                    db.setFincaActiva(1); // Devolver a la Principal por seguridad
                    App.toast('Finca y su dependencia eliminados', 'success');
                    setTimeout(() => location.reload(), 1000);
                }
            }
        });
    },

    async toggleAudit() {
        const panel = document.getElementById('cfg-audit-panel');
        if (panel.style.display === 'none') {
            panel.style.display = 'block';
            panel.innerHTML = '<div class="text-center spinner"></div> Cargando...';

            let logs = await db.getConfig('auditoria_logs', []);
            if (!Array.isArray(logs)) logs = [];

            if (logs.length === 0) {
                panel.innerHTML = '<p class="text-muted text-center" style="padding:1rem">No hay registros de auditoría aún.</p>';
                return;
            }

            // Descending order (newest first)
            logs.sort((a, b) => b.timestamp - a.timestamp);

            let html = '';
            logs.forEach(log => {
                let icon = '⚙️';
                if (log.campo.toLowerCase().includes('tarifa')) icon = '💰';
                if (log.campo.toLowerCase().includes('cena') || log.campo.toLowerCase().includes('desayuno') || log.campo.toLowerCase().includes('almuerzo')) icon = '🍽️';
                if (log.campo.toLowerCase().includes('contraseña')) icon = '🔐';
                if (log.campo.toLowerCase().includes('corte') || log.campo.toLowerCase().includes('semana')) icon = '📅';

                const dateStr = new Date(log.timestamp).toLocaleString();

                html += `
                    <div class="audit-item">
                        <div class="audit-head">
                            <span>${dateStr}</span>
                            <span>${log.usuario}</span>
                        </div>
                        <div class="audit-body">
                            <span class="audit-icon">${icon}</span>
                            <div style="flex:1">
                                <strong style="display:block; color:var(--text)">${log.campo}</strong>
                                <span style="color:var(--text-muted)">${log.valor_anterior} → ${log.valor_nuevo}</span>
                            </div>
                        </div>
                    </div>
                `;
            });

            panel.innerHTML = html;
        } else {
            panel.style.display = 'none';
        }
    },

    async logAudit(campo, oldVal, newVal) {
        let logs = await db.getConfig('auditoria_logs', []);
        if (!Array.isArray(logs)) logs = [];

        const ahora = Date.now();
        const dias90 = 90 * 24 * 60 * 60 * 1000;

        // Cleanup: remove older than 90 days
        logs = logs.filter(log => (ahora - log.timestamp) < dias90);

        logs.push({
            timestamp: ahora,
            usuario: 'Administrador',
            campo,
            valor_anterior: oldVal,
            valor_nuevo: newVal
        });

        // Hard limit of 50 to prevent unbounded growth despite time filter
        if (logs.length > 50) logs.shift();

        await db.setConfig('auditoria_logs', logs);
    },

    async saveTarifas(e) {
        e.preventDefault();
        const oldTkilo = await db.getConfig('tarifaKilo', 500);
        const oldTdia = await db.getConfig('tarifaDia', 40000);
        const oldTdom = await db.getConfig('tarifaDomingo', 60000);

        const nTkilo = parseFloat(document.getElementById('cfg-tkilo').value);
        const nTdia = parseFloat(document.getElementById('cfg-tdia').value);
        const nTdom = parseFloat(document.getElementById('cfg-tdom').value);

        let details = '';
        if (oldTkilo !== nTkilo) details += `Tarifa por Kilo: ${oldTkilo} → ${nTkilo}<br>`;
        if (oldTdia !== nTdia) details += `Tarifa por Día: ${oldTdia} → ${nTdia}<br>`;
        if (oldTdom !== nTdom) details += `Tarifa Domingo: ${oldTdom} → ${nTdom}<br>`;

        if (!details) return App.toast('No hay cambios en las tarifas', 'info');

        const ok = await App.confirmWithCode({ action: 'Tarifas', details });
        if (ok) {
            await db.setConfig('tarifaKilo', nTkilo);
            await db.setConfig('tarifaDia', nTdia);
            await db.setConfig('tarifaDomingo', nTdom);

            if (oldTkilo !== nTkilo) await this.logAudit('Tarifa Kilo', oldTkilo, nTkilo);
            if (oldTdia !== nTdia) await this.logAudit('Tarifa Día', oldTdia, nTdia);
            if (oldTdom !== nTdom) await this.logAudit('Tarifa Domingo', oldTdom, nTdom);

            App.toast('Tarifas actualizadas', 'success');
        }
    },

    async saveComida(e) {
        e.preventDefault();
        const oldDes = await db.getConfig('precioDesayuno', 3000);
        const oldAlm = await db.getConfig('precioAlmuerzo', 5000);
        const oldCena = await db.getConfig('precioCena', 3000);

        const nDes = parseFloat(document.getElementById('cfg-desayuno').value);
        const nAlm = parseFloat(document.getElementById('cfg-almuerzo').value);
        const nCena = parseFloat(document.getElementById('cfg-cena').value);

        let details = '';
        if (oldDes !== nDes) details += `Desayuno: ${oldDes} → ${nDes}<br>`;
        if (oldAlm !== nAlm) details += `Almuerzo: ${oldAlm} → ${nAlm}<br>`;
        if (oldCena !== nCena) details += `Cena: ${oldCena} → ${nCena}<br>`;

        if (!details) return App.toast('No hay cambios en precios', 'info');

        const ok = await App.confirmWithCode({ action: 'Precios de Comida', details });
        if (ok) {
            await db.setConfig('precioDesayuno', nDes);
            await db.setConfig('precioAlmuerzo', nAlm);
            await db.setConfig('precioCena', nCena);

            if (oldDes !== nDes) await this.logAudit('Desayuno', oldDes, nDes);
            if (oldAlm !== nAlm) await this.logAudit('Almuerzo', oldAlm, nAlm);
            if (oldCena !== nCena) await this.logAudit('Cena', oldCena, nCena);

            App.toast('Precios de comida actualizados', 'success');
        }
    },

    async saveConversion(e) {
        e.preventDefault();
        const oldLata = await db.getConfig('kilosPorLata', 12.5);
        const oldFact = await db.getConfig('factorConversion', 0.5);
        const oldCarga = await db.getConfig('precioCarga', 2000000);

        const nLata = parseFloat(document.getElementById('cfg-lata').value);
        const nFact = parseFloat(document.getElementById('cfg-factor').value);
        const nCarga = parseFloat(document.getElementById('cfg-carga').value);

        let details = '';
        if (oldLata !== nLata) details += `Kilos x Lata: ${oldLata} → ${nLata}<br>`;
        if (oldFact !== nFact) details += `Factor rojo/mojado: ${oldFact} → ${nFact}<br>`;
        if (oldCarga !== nCarga) details += `Precio Carga: ${oldCarga} → ${nCarga}<br>`;

        if (!details) return App.toast('No hay cambios en conversión', 'info');

        const ok = await App.confirmWithCode({ action: 'Mercado', details });
        if (ok) {
            await db.setConfig('factorConversion', nFact);
            await db.setConfig('kilosPorLata', nLata);
            await db.setConfig('precioCarga', nCarga);

            if (oldLata !== nLata) await this.logAudit('Kilos x Lata', oldLata, nLata);
            if (oldFact !== nFact) await this.logAudit('Factor Conversión', oldFact, nFact);
            if (oldCarga !== nCarga) await this.logAudit('Precio Carga', oldCarga, nCarga);

            App.toast('Ajustes de mercado actualizados', 'success');
        }
    },

    async saveCiclos(e) {
        e.preventDefault();
        const oldDia = await db.getConfig('diaCorte', 1);
        const nDia = parseInt(document.getElementById('cfg-diacorte').value);

        const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

        if (oldDia === nDia) return App.toast('No hay cambios en el día de corte', 'info');

        const details = `Día de inicio semanal: ${diasSemana[oldDia]} → ${diasSemana[nDia]}`;

        const ok = await App.confirmWithCode({ action: 'Semana', details });
        if (ok) {
            await db.setConfig('diaCorte', nDia);
            await this.logAudit('Día Corte', diasSemana[oldDia], diasSemana[nDia]);
            App.toast('Día de corte actualizado', 'success');
        }
    },

    async savePassword(e) {
        e.preventDefault();
        const pass = document.getElementById('cfg-pass').value;
        const pass2 = document.getElementById('cfg-pass2').value;
        if (pass !== pass2) return App.toast('Las contraseñas no coinciden', 'error');
        if (pass.length < 4) return App.toast('Mínimo 4 caracteres', 'error');

        const ok = await App.confirmWithCode({ action: 'Contraseña', details: 'Modificación crítica: Acceso al sistema ERP.' });
        if (ok) {
            await db.setConfig('password', pass);
            await this.logAudit('Contraseña Global', '***', '***');
            App.toast('Contraseña actualizada', 'success');
            document.getElementById('cfg-pass').value = '';
            document.getElementById('cfg-pass2').value = '';
        }
    },

    async backup() {
        const data = await db.exportAll();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cafecontrol_backup_${new Date().toLocaleDateString('en-CA')}.json`;
        a.click();
        URL.revokeObjectURL(url);
        App.toast('Respaldo descargado', 'success');
    },

    async restore(e) {
        const file = e.target.files[0];
        if (!file) return;

        App.confirmDelete({
            title: 'Restaurar respaldo',
            message: '⚠️ Esto reemplazará <strong>TODOS</strong> los datos actuales con el respaldo seleccionado. Esta acción no se puede deshacer.',
            icon: '⚠️',
            confirmText: 'Restaurar',
            onConfirm: () => {
                const reader = new FileReader();
                reader.onload = async (ev) => {
                    try {
                        const data = JSON.parse(ev.target.result);
                        await db.importAll(data);
                        App.toast('Datos restaurados exitosamente', 'success');

                        App.alert({
                            title: 'Restauración Completada',
                            message: 'La base de datos ha sido sobreescrita. La plataforma se reiniciará.',
                            type: 'success',
                            buttonText: 'Continuar'
                        });
                        setTimeout(() => location.reload(), 2000);
                    } catch (err) {
                        App.toast('Error al restaurar: ' + err.message, 'error');
                    }
                };
                reader.readAsText(file);
            }
        });
    },

    async exportarCSV() {
        try {
            App.toast('Preparando exportación...', 'info');

            const jornales = await db.getByFinca('jornales');
            const pagos = await db.getByFinca('pagos');
            const obreros = await db.getByFinca('obreros');
            const lotes = await db.getByFinca('lotes');
            const ciclos = await db.getByFinca('ciclos');

            if (jornales.length === 0 && pagos.length === 0) {
                return App.alert({ title: 'Sin Datos', message: 'No hay datos de producción o pagos registrados en esta finca.', type: 'info' });
            }

            const obMap = Object.fromEntries(obreros.map(o => [o.id, o.nombre]));
            const ltMap = Object.fromEntries(lotes.map(l => [l.id, l.nombre]));
            const ciMap = Object.fromEntries(ciclos.map(c => [c.id, c.nombre]));

            // CSV Header (Using semicolons for better Excel compatibility in ES locale)
            let csv = "Tipo_Registro;Fecha;Obrero;Lote;Semana;Kilos_Recolectados;Dias_Laborados;Desc_Comida;Desc_Tienda;Pagado_Dinero;Estado\n";

            // Add Jornales
            jornales.forEach(j => {
                const oNombre = obMap[j.obreroId] || 'Desconocido';
                const lNombre = ltMap[j.loteId] || 'Desconocido';
                const sNombre = ciMap[j.cicloId] || 'S/N';
                csv += `Jornal;${j.fecha};"${oNombre}";"${lNombre}";"${sNombre}";${j.kilosRecolectados || 0};1;0;0;${j.totalDia || 0};Registrado\n`;
            });

            // Add Pagos (Liquidaciones)
            pagos.forEach(p => {
                const oNombre = obMap[p.obreroId] || 'Desconocido';
                const sNombre = ciMap[p.cicloId] || 'S/N';
                csv += `Liquidacion;${p.fechaPago};"${oNombre}";"General";"${sNombre}";0;0;${p.descComida || 0};${p.descCaja || 0};${p.netoAPagar || 0};${p.estado}\n`;
            });

            // BOM for standard Excel UTF-8
            const bom = "\\uFEFF";
            const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cafecontrol_produccion_${new Date().toLocaleDateString('en-CA')}.csv`;
            a.click();
            URL.revokeObjectURL(url);

            App.toast('Dataset CSV exportado exitosamente', 'success');
        } catch (e) {
            console.error(e);
            App.alert({ title: 'Error', message: 'Fallo la generación del archivo CSV.', type: 'error' });
        }
    },

    /* --- Theme card rendering for Configuración --- */
    _renderThemeCards() {
        const current = typeof ThemeManager !== 'undefined' ? ThemeManager.getTheme() : 'cafe';
        const themes = [
            {
                id: 'cafe',
                name: 'Café Glass',
                desc: 'Glassmorphism cálido con tonos de café',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>`,
                swatches: ['#0f0d0a', '#c8956c', '#16A34A', '#e0b892', '#221e19']
            },
            {
                id: 'light',
                name: 'Light',
                desc: 'Minimalista y limpio estilo Notion',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
                swatches: ['#FAFAF8', '#8B6914', '#16A34A', '#1A1A1A', '#FFFFFF']
            },
            {
                id: 'dark',
                name: 'Dark',
                desc: 'Oscuro elegante estilo Linear/Vercel',
                icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
                swatches: ['#0A0A0C', '#5EAA6F', '#4ade80', '#EAEAEA', '#1A1A1F']
            }
        ];

        return themes.map(t => {
            const isActive = t.id === current;
            return `
                <button class="cfg-theme-option ${isActive ? 'active' : ''}" 
                        onclick="Config.selectTheme('${t.id}')" 
                        aria-pressed="${isActive}" 
                        title="${t.name}">
                    <div class="cfg-theme-preview">
                        <div class="cfg-theme-swatches">
                            ${t.swatches.map(c => `<span class="cfg-swatch" style="background:${c}"></span>`).join('')}
                        </div>
                    </div>
                    <div class="cfg-theme-info">
                        <div class="cfg-theme-name">
                            ${t.icon}
                            <span>${t.name}</span>
                        </div>
                        <div class="cfg-theme-desc">${t.desc}</div>
                    </div>
                    ${isActive ? '<div class="cfg-theme-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="20 6 9 17 4 12"/></svg></div>' : ''}
                </button>
            `;
        }).join('');
    },

    selectTheme(themeId) {
        if (typeof ThemeManager !== 'undefined') {
            ThemeManager.setTheme(themeId);
        }
        // Update the theme cards UI without full re-render
        const grid = document.querySelector('.cfg-theme-grid');
        if (grid) {
            grid.innerHTML = Config._renderThemeCards();
        }
    },

    logout() {
        sessionStorage.removeItem('cafecontrol_auth');
        document.getElementById('main-app').classList.add('hidden');
        document.getElementById('login-screen').classList.remove('hidden');
    }
};
