/* ============================================
   app.js — SPA Router & Initialization
   CaféControl
   ============================================ */

const App = {
    currentView: 'dashboard',

    async init() {
        // Request persistent storage to protect against OS cache clearing
        if (navigator.storage && navigator.storage.persist) {
            try {
                const persisted = await navigator.storage.persist();
                if (persisted) {
                    console.log("Storage persistente activado");
                } else {
                    console.warn("No se pudo activar storage persistente");
                }
            } catch (err) {
                console.error("Error pidiendo persistencia:", err);
            }
        }

        // Registrar SW
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js')
                    .then(reg => console.log('Service Worker registrado'))
                    .catch(err => console.error('Error SW:', err));
            });
        }

        // Manejo de Instalación PWA
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            App.deferredPrompt = e;
            App.showInstallBanner();
        });

        // Init DB with error handling for file:// protocol
        try {
            await db.init();
            await db.initDefaults();
        } catch (err) {
            console.warn('IndexedDB init warning:', err);
        }

        // Init theme system
        if (typeof ThemeManager !== 'undefined') {
            ThemeManager.init();
            App._renderThemeSwitchers();
        }

        // Check auth (con soporte a navegadores que bloquean variables locales)
        let isAuth = false;
        try {
            isAuth = sessionStorage.getItem('cafecontrol_auth');
        } catch (err) {
            console.warn('Storage bloqueado por política del navegador', err);
            isAuth = false;
        }

        if (isAuth) {
            App.showApp();
        } else {
            // Analizar si estamos en un navegador hostil (ej. Edge con file://)
            try {
                localStorage.getItem('test');
            } catch (err) {
                const loginDesc = document.querySelector('.login-subtitle');
                if (loginDesc) {
                    loginDesc.innerHTML = `<span style="color:var(--red);font-weight:bold;">⚠️ Tu navegador bloquea la Base de Datos. Pásate a Chrome o descárgala en tu celular.</span>`;
                }
            }
        }

        // Login form
        const loginForm = document.getElementById('login-form');
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const pass = document.getElementById('login-password').value;

            let storedPass = '1234';
            try {
                if (db.db) {
                    storedPass = await db.getConfig('password', '1234');
                }
            } catch (err) {
                console.warn('Could not read password from DB, using default');
            }

            if (String(pass) === String(storedPass)) {
                try {
                    sessionStorage.setItem('cafecontrol_auth', 'true');
                } catch (e) {
                    console.warn('No se pudo guardar la sesión por políticas de navegador.');
                }
                document.getElementById('login-error').classList.add('hidden');
                App.showApp();
                const hash = location.hash.replace('#', '') || 'dashboard';

                // Forzar explícitamente el hash en la URL para que aparezca /#dashboard
                if (window.location.hash !== '#' + hash) {
                    window.location.hash = hash;
                }

                App.navigate(hash);
            } else {
                document.getElementById('login-error').classList.remove('hidden');
            }
            return false;
        });

        // Hash routing
        window.addEventListener('hashchange', () => {
            const hash = location.hash.replace('#', '') || 'dashboard';
            if (hash === 'mas') return; // More menu handled separately
            App.navigate(hash);
        });

        // More menu (mobile)
        document.getElementById('btn-mas')?.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('more-menu').classList.remove('hidden');
        });

        document.getElementById('close-more')?.addEventListener('click', () => {
            document.getElementById('more-menu').classList.add('hidden');
        });

        document.querySelector('.more-menu-overlay')?.addEventListener('click', () => {
            document.getElementById('more-menu').classList.add('hidden');
        });

        // More menu item clicks
        document.querySelectorAll('.more-menu-item').forEach(item => {
            item.addEventListener('click', () => {
                document.getElementById('more-menu').classList.add('hidden');
            });
        });

        // Sidebar nav clicks
        document.querySelectorAll('.nav-item[data-view]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.dataset.view;
                location.hash = view;
            });
        });

        // Bottom nav clicks
        document.querySelectorAll('.bottom-nav-item[data-view]').forEach(item => {
            item.addEventListener('click', (e) => {
                const view = item.dataset.view;
                if (view === 'mas') return; // handled above
                e.preventDefault();
                location.hash = view;
            });
        });

        // Initial route
        const initialHash = location.hash.replace('#', '') || 'dashboard';
        if (initialHash !== 'mas') {
            // Asegurar que la barra de direcciones refleje la ruta si entró por raíz '/'
            if (!window.location.hash || window.location.hash === '#') {
                window.location.hash = initialHash;
            } else {
                App.navigate(initialHash);
            }
        }
    },

    showInstallBanner() {
        // Solo mostramos el banner de instalación si estamos en login screen y hay prompt deferido
        const alertCont = document.getElementById('toast-container');
        const alertHtml = `
            <div class="card-glass toast-install animate-up" style="display:flex; flex-direction:column; gap:16px; justify-content:center; text-align:center; padding:24px; position:relative; overflow:hidden; margin-bottom:12px; pointer-events:auto">
                <div style="position:absolute; top:-30px; left:-30px; width:100px; height:100px; background:var(--color-primary); border-radius:50%; filter:blur(40px); opacity:0.15; z-index:-1"></div>
                <div style="display:flex; justify-content:center">
                    <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); width:56px; height:56px; border-radius:16px; display:flex; align-items:center; justify-content:center">
                        <i data-lucide="smartphone" style="color:var(--text-main); width:28px; height:28px"></i>
                    </div>
                </div>
                <div>
                    <strong style="font-size:1.2rem; display:block; margin-bottom:6px; color:var(--text-main); font-weight:800">CaféControl PWA</strong>
                    <span style="font-size:0.9rem; color:var(--text-muted); line-height:1.4">Instala la aplicación para acceso rápido, pantalla completa y modo offline.</span>
                </div>
                <div style="display:flex; flex-direction:column; gap:8px; margin-top:8px">
                    <button id="btn-instalar-app" class="btn-premium primary" style="width:100%; justify-content:center">Instalar Ahora</button>
                    <button onclick="this.closest('.toast-install').remove()" class="btn-premium secondary" style="width:100%; justify-content:center; border:1px solid rgba(255,255,255,0.05)">Quizás más tarde</button>
                </div>
            </div>
        `;
        alertCont.insertAdjacentHTML('beforeend', alertHtml);
        if (window.lucide) window.lucide.createIcons();

        document.getElementById('btn-instalar-app').addEventListener('click', async (e) => {
            e.target.parentElement.remove();
            if (App.deferredPrompt) {
                App.deferredPrompt.prompt();
                const { outcome } = await App.deferredPrompt.userChoice;
                console.log(`Instalacion: ${outcome}`);
                App.deferredPrompt = null;
            }
        });
    },

    showApp() {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        App._renderThemeSwitchers();
    },

    _renderThemeSwitchers() {
        if (typeof ThemeManager === 'undefined') return;
        const sb = document.getElementById('theme-switcher-sidebar');
        const mb = document.getElementById('theme-switcher-mobile');
        if (sb) sb.innerHTML = ThemeManager.renderSwitcher('sidebar');
        if (mb) mb.innerHTML = ThemeManager.renderSwitcher('mobile');
    },

    async navigate(view) {
        App.currentView = view;

        // Update active states
        document.querySelectorAll('.nav-item').forEach(n => {
            n.classList.toggle('active', n.dataset.view === view);
        });

        document.querySelectorAll('.bottom-nav-item').forEach(n => {
            n.classList.toggle('active', n.dataset.view === view);
        });

        // Render view
        const views = {
            dashboard: Dashboard,
            obreros: Obreros,
            lotes: Lotes,
            jornales: Jornales,
            asistencia: Asistencia,
            comida: Comida,
            caja: Caja,
            cascota: Cascota,
            conversion: Conversion,
            transporte: Transporte,
            ciclos: Ciclos,
            historial: Historial,
            pagos: Pagos,
            reportes: Reportes,
            config: Config
        };

        const module = views[view];
        if (module && typeof module.render === 'function') {
            await module.render();
            if (window.lucide) window.lucide.createIcons();
        } else {
            document.getElementById('app').innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <p>Módulo no encontrado</p>
                </div>
            `;
        }

        // Scroll to top
        window.scrollTo(0, 0);
    },

    // Toast notification
    toast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const icons = { success: '✅', error: '❌', info: 'ℹ️' };
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(50px)';
            toast.style.transition = '0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    /* ========================================
       Sistema de Modales Personalizados
       Reemplaza confirm(), alert() nativos
       ======================================== */

    // Internal: close any system modal with animation
    _closeSystemModal(overlay) {
        if (!overlay) overlay = document.querySelector('.modal-system-overlay');
        if (!overlay) return;
        overlay.classList.add('closing');
        setTimeout(() => overlay.remove(), 200);
    },

    /**
     * App.confirm — Modal de confirmación simple
     * Reemplaza confirm() nativo para acciones no-destructivas
     * @param {object} opts - { title, message, onConfirm, onCancel, confirmText, cancelText, icon }
     */
    confirm({ title = '¿Estás seguro?', message = '', onConfirm, onCancel, confirmText = 'Confirmar', cancelText = 'Cancelar', icon = '❓' } = {}) {
        // Remove any existing system modal
        document.querySelector('.modal-system-overlay')?.remove();

        const overlay = document.createElement('div');
        overlay.className = 'modal-system-overlay';
        overlay.innerHTML = `
            <div class="modal-system modal-type-confirm">
                <div class="modal-system-icon">${icon}</div>
                <div class="modal-system-title">${title}</div>
                <div class="modal-system-message">${message}</div>
                <div class="modal-system-buttons">
                    <button class="btn btn-modal-cancel" id="modal-sys-cancel">${cancelText}</button>
                    <button class="btn btn-modal-confirm" id="modal-sys-confirm">✅ ${confirmText}</button>
                </div>
            </div>
        `;

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                App._closeSystemModal(overlay);
                if (onCancel) onCancel();
            }
        });

        document.body.appendChild(overlay);

        // Button events
        document.getElementById('modal-sys-cancel').addEventListener('click', () => {
            App._closeSystemModal(overlay);
            if (onCancel) onCancel();
        });

        document.getElementById('modal-sys-confirm').addEventListener('click', () => {
            App._closeSystemModal(overlay);
            if (onConfirm) onConfirm();
        });

        // Keyboard: Escape = cancel, Enter = confirm
        const onKey = (e) => {
            if (e.key === 'Escape') {
                App._closeSystemModal(overlay);
                if (onCancel) onCancel();
                document.removeEventListener('keydown', onKey);
            } else if (e.key === 'Enter') {
                App._closeSystemModal(overlay);
                if (onConfirm) onConfirm();
                document.removeEventListener('keydown', onKey);
            }
        };
        document.addEventListener('keydown', onKey);

        // Clean up key listener when modal is removed
        const observer = new MutationObserver(() => {
            if (!document.contains(overlay)) {
                document.removeEventListener('keydown', onKey);
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true });
    },

    /**
     * App.confirmDelete — Modal con código de seguridad de 4 dígitos
     * Para eliminaciones y acciones destructivas
     * @param {object} opts - { title, message, onConfirm, confirmText, icon }
     */
    confirmDelete({ title = 'Eliminar registro', message = 'Esta acción no se puede deshacer.', onConfirm, confirmText = 'Eliminar', icon = '🗑️' } = {}) {
        // Remove any existing system modal
        document.querySelector('.modal-system-overlay')?.remove();

        const code = String(Math.floor(1000 + Math.random() * 9000));

        const overlay = document.createElement('div');
        overlay.className = 'modal-system-overlay';
        overlay.innerHTML = `
            <div class="modal-system modal-type-danger">
                <div class="modal-system-icon">${icon}</div>
                <div class="modal-system-title">${title}</div>
                <div class="modal-system-message">${message}</div>
                <div class="modal-code-section">
                    <div class="modal-code-label">Escribe este código para confirmar</div>
                    <div class="modal-code-display">${code}</div>
                    <input type="text" class="modal-code-input" id="modal-sys-code" 
                           maxlength="4" inputmode="numeric" pattern="[0-9]*"
                           placeholder="····" autocomplete="off">
                </div>
                <div class="modal-system-buttons">
                    <button class="btn btn-modal-cancel" id="modal-sys-cancel">Cancelar</button>
                    <button class="btn btn-modal-danger" id="modal-sys-delete" disabled>🔒 ${confirmText}</button>
                </div>
            </div>
        `;

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) App._closeSystemModal(overlay);
        });

        document.body.appendChild(overlay);

        const input = document.getElementById('modal-sys-code');
        const deleteBtn = document.getElementById('modal-sys-delete');

        // Focus input automatically
        setTimeout(() => input.focus(), 100);

        // Validate code on input
        input.addEventListener('input', () => {
            const val = input.value.trim();
            if (val === code) {
                input.classList.remove('code-error');
                input.classList.add('code-match');
                deleteBtn.disabled = false;
                deleteBtn.innerHTML = `🗑️ ${confirmText}`;
            } else {
                input.classList.remove('code-match');
                deleteBtn.disabled = true;
                deleteBtn.innerHTML = `🔒 ${confirmText}`;
                // Shake on 4th wrong character
                if (val.length === 4 && val !== code) {
                    input.classList.add('code-error');
                    setTimeout(() => input.classList.remove('code-error'), 400);
                }
            }
        });

        // Prevent non-numeric input
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !deleteBtn.disabled) {
                App._closeSystemModal(overlay);
                if (onConfirm) onConfirm();
                return;
            }
            if (e.key === 'Escape') {
                App._closeSystemModal(overlay);
                return;
            }
            // Allow: backspace, delete, tab, arrows, numbers
            const allowed = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
            if (!allowed.includes(e.key) && (e.key < '0' || e.key > '9')) {
                e.preventDefault();
            }
        });

        // Button events
        document.getElementById('modal-sys-cancel').addEventListener('click', () => {
            App._closeSystemModal(overlay);
        });

        deleteBtn.addEventListener('click', () => {
            if (deleteBtn.disabled) return;
            App._closeSystemModal(overlay);
            if (onConfirm) onConfirm();
        });
    },

    /**
     * App.confirmWithCode — Modal de Desafío de Empresa 
     * Retorna una Promesa que resuelve en `true` si es exitoso o `false` si no.
     */
    confirmationActive: false,
    confirmWithCode({ action = 'Modificar Configuración', details = '', timeoutSeconds = 30 } = {}) {
        if (App.confirmationActive) return Promise.resolve(false);
        App.confirmationActive = true;

        return new Promise((resolve) => {
            document.querySelector('.modal-system-overlay')?.remove();

            // 5 digits for enterprise security
            const code = String(Math.floor(10000 + Math.random() * 90000));
            let timeLeft = timeoutSeconds;
            let timerInterval;

            const overlay = document.createElement('div');
            overlay.className = 'modal-system-overlay';

            let detailsHtml = '';
            if (details) {
                detailsHtml = `
                    <div style="text-align:left; background:var(--bg-secondary); padding:0.75rem; border-radius:6px; margin:0.75rem 0; font-size:0.9rem; border-left:3px solid var(--accent); color:var(--text)">
                        <strong style="display:block;margin-bottom:4px;color:var(--text-muted)">Vas a modificar:</strong>
                        ${details}
                    </div>
                `;
            }

            overlay.innerHTML = `
                <div class="modal-system">
                    <div class="modal-system-icon">⚠️</div>
                    <div class="modal-system-title">Confirmación Requerida</div>
                    <div class="modal-system-message">Estás a punto de alterar variables sensibles de nómina y costos empresariales.</div>
                    
                    ${detailsHtml}

                    <div class="modal-code-section" style="border-top:1px dashed var(--border); padding-top:1rem; margin-top:1rem;">
                        <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.5rem">Digita este código antes de <span id="sys-timer" style="color:var(--red);font-weight:bold">${timeLeft}</span>s.</div>
                        <div class="modal-code-display" style="letter-spacing:4px; font-size:1.8rem;">${code}</div>
                        <input type="text" class="modal-code-input" id="modal-chal-code" 
                               maxlength="5" inputmode="numeric" pattern="[0-9]*"
                               placeholder="·····" autocomplete="off" style="letter-spacing:2px; font-size:1.5rem">
                    </div>
                    <div class="modal-system-buttons">
                        <button class="btn btn-modal-cancel" id="modal-chal-cancel">Cancelar</button>
                        <button class="btn btn-primary" id="modal-chal-confirm" disabled style="background:var(--accent); color:var(--bg-main)">🔒 Confirmar ${action}</button>
                    </div>
                </div>
            `;

            const cancelAndResolve = (result) => {
                clearInterval(timerInterval);
                App._closeSystemModal(overlay);
                App.confirmationActive = false;
                resolve(result);
            };

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) cancelAndResolve(false);
            });

            document.body.appendChild(overlay);

            const timerDisplay = document.getElementById('sys-timer');
            const input = document.getElementById('modal-chal-code');
            const confirmBtn = document.getElementById('modal-chal-confirm');

            // Timer Tick
            timerInterval = setInterval(() => {
                timeLeft--;
                timerDisplay.textContent = timeLeft;
                if (timeLeft <= 0) {
                    App.toast('Código expirado. Genera uno nuevo.', 'error');
                    cancelAndResolve(false);
                }
            }, 1000);

            setTimeout(() => input.focus(), 100);

            // Validation logic
            input.addEventListener('input', () => {
                const val = input.value.trim();
                if (val === code) {
                    input.classList.remove('code-error');
                    input.classList.add('code-match');
                    confirmBtn.disabled = false;
                    confirmBtn.innerHTML = `✅ Confirmar ${action}`;
                } else {
                    input.classList.remove('code-match');
                    confirmBtn.disabled = true;
                    confirmBtn.innerHTML = `🔒 Confirmar ${action}`;

                    if (val.length === 5 && val !== code) {
                        input.classList.add('code-error');
                        setTimeout(() => input.classList.remove('code-error'), 400);
                    }
                }
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !confirmBtn.disabled) {
                    cancelAndResolve(true);
                }
                if (e.key === 'Escape') cancelAndResolve(false);
            });

            document.getElementById('modal-chal-cancel').addEventListener('click', () => cancelAndResolve(false));
            confirmBtn.addEventListener('click', () => {
                if (!confirmBtn.disabled) cancelAndResolve(true);
            });
        });
    },

    /**
     * App.alert — Modal de alerta informativa
     * Reemplaza alert() nativo
     * @param {object} opts - { title, message, type, icon, buttonText }
     */
    alert({ title = 'Aviso', message = '', type = 'info', icon, buttonText = 'Entendido' } = {}) {
        // Remove any existing system modal
        document.querySelector('.modal-system-overlay')?.remove();

        const defaultIcons = { info: 'ℹ️', success: '✅', warning: '⚠️', danger: '❌', error: '❌' };
        const usedIcon = icon || defaultIcons[type] || 'ℹ️';
        const modalType = type === 'error' ? 'danger' : type;

        const overlay = document.createElement('div');
        overlay.className = 'modal-system-overlay';
        overlay.innerHTML = `
            <div class="modal-system modal-type-${modalType}">
                <div class="modal-system-icon">${usedIcon}</div>
                <div class="modal-system-title">${title}</div>
                <div class="modal-system-message">${message}</div>
                <div class="modal-system-buttons" style="justify-content:center">
                    <button class="btn btn-modal-single" id="modal-sys-ok">${buttonText}</button>
                </div>
            </div>
        `;

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) App._closeSystemModal(overlay);
        });

        document.body.appendChild(overlay);

        document.getElementById('modal-sys-ok').addEventListener('click', () => {
            App._closeSystemModal(overlay);
        });

        // Keyboard: Escape or Enter = close
        const onKey = (e) => {
            if (e.key === 'Escape' || e.key === 'Enter') {
                App._closeSystemModal(overlay);
                document.removeEventListener('keydown', onKey);
            }
        };
        document.addEventListener('keydown', onKey);

        const observer = new MutationObserver(() => {
            if (!document.contains(overlay)) {
                document.removeEventListener('keydown', onKey);
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true });
    },

    /* ==============================================================
       Métodos de Limpieza Segura (Invocados Post-Liquidación de Ciclo)
       ============================================================== */

    resetDashboard() {
        // Encerar montos visuales (El dashboard recargará desde la DB que ya está vacía bajo ese Ciclo Nuevo)
        const elementIds = [
            'dash-total-kilos',
            'dash-total-pagos',
            'dash-semana-activa',
            'dash-top-recolectores',
            'dash-total-lotes'
        ];

        elementIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '...';
        });
    },

    clearForms() {
        // Vaciar todos los formularios activos excepto los inputs hidden y checkboxes por defecto
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input:not([type="hidden"]), select, textarea');
            inputs.forEach(input => {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    // Solo resetear a false si no tienen clase de exclusión estática
                    if (!input.classList.contains('keep-state')) input.checked = false;
                } else {
                    input.value = '';
                }
            });
        });
    },

    refreshUI() {
        // Barrido general (Emula estar en App nueva)
        App.resetDashboard();
        App.clearForms();

        // Re-renderizar módulos principales
        if (typeof Dashboard !== 'undefined' && Dashboard.render) Dashboard.render();
        if (typeof Jornales !== 'undefined' && document.getElementById('jornales-form')) Jornales.render(); // si está activo
        if (typeof Obreros !== 'undefined' && document.getElementById('obreros-list')) Obreros.render();
    }
};

// Start the app
document.addEventListener('DOMContentLoaded', () => App.init());

