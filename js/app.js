/* ============================================
   app.js — SPA Router & Initialization
   CaféControl
   ============================================ */

const App = {
    currentView: 'dashboard',

    roleViews: {
        super_admin: [
            'dashboard', 'jornales', 'asistencia', 'comida', 'obreros', 'lotes', 
            'ciclos', 'transporte', 'conversion', 'cascota', 'caja', 'pagos', 
            'historial', 'reportes', 'config'
        ],
        admin: [
            'dashboard', 'jornales', 'asistencia', 'comida', 'obreros', 'lotes', 
            'ciclos', 'conversion', 'cascota', 'config'
        ],
        tienda: [
            'dashboard', 'caja'
        ],
        transporte: [
            'dashboard', 'transporte'
        ],
        cuenta: [
            'dashboard', 'pagos', 'historial', 'reportes'
        ],
        obrero: [
            'mi-rendimiento'
        ]
    },

    applyRoleAccess(role) {
        const allowedViews = this.roleViews[role] || this.roleViews['tienda'];

        // Obrero: ocultar sidebar y bottom-nav completamente
        const isObrero = role === 'obrero';
        const sidebar = document.getElementById('sidebar');
        const bottomNav = document.getElementById('bottom-nav');
        const moreMenu = document.getElementById('more-menu');
        const mainContent = document.querySelector('.main-content');

        if (isObrero) {
            if (sidebar) sidebar.style.display = 'none';
            if (bottomNav) bottomNav.style.display = 'none';
            if (moreMenu) moreMenu.style.display = 'none';
            // Expandir el contenido a pantalla completa
            if (mainContent) mainContent.style.marginLeft = '0';
            return; // No necesitamos filtrar nav items para obrero
        }

        // Restaurar navegación para roles no-obrero
        if (sidebar) sidebar.style.display = '';
        if (bottomNav) bottomNav.style.display = '';
        if (moreMenu) moreMenu.style.display = '';
        if (mainContent) mainContent.style.marginLeft = '';

        // Sidebar items (Desktop)
        document.querySelectorAll('#sidebar .nav-item[data-view]').forEach(item => {
            const view = item.dataset.view;
            const allowed = allowedViews.includes(view);
            item.classList.toggle('hidden', !allowed);
            item.style.display = allowed ? '' : 'none';
        });

        // Sidebar sections mapping
        const sectionsMapping = {
            'OPERACIÓN': ['dashboard', 'jornales', 'asistencia', 'comida'],
            'GESTIÓN': ['obreros', 'lotes', 'ciclos'],
            'PRODUCCIÓN': ['transporte', 'conversion', 'cascota'],
            'FINANZAS': ['caja', 'pagos', 'historial'],
            'ANÁLISIS': ['reportes'],
            'SISTEMA': ['config']
        };

        document.querySelectorAll('#sidebar .nav-section').forEach(sectionEl => {
            const sectionText = sectionEl.textContent.trim();
            const sectionViews = sectionsMapping[sectionText];
            if (sectionViews) {
                const hasVisibleItem = sectionViews.some(v => allowedViews.includes(v));
                sectionEl.classList.toggle('hidden', !hasVisibleItem);
                sectionEl.style.display = hasVisibleItem ? '' : 'none';
            }
        });

        // Bottom nav (Mobile)
        const masViews = ['obreros', 'lotes', 'asistencia', 'comida', 'cascota', 'transporte', 'conversion', 'ciclos', 'historial', 'reportes', 'config'];
        const hasMasViews = masViews.some(v => allowedViews.includes(v));
        
        const btnMas = document.getElementById('btn-mas');
        if (btnMas) {
            btnMas.classList.toggle('hidden', !hasMasViews);
            btnMas.style.display = hasMasViews ? '' : 'none';
        }

        document.querySelectorAll('#bottom-nav .bottom-nav-item[data-view]').forEach(item => {
            const view = item.dataset.view;
            if (view === 'mas') return;
            const allowed = allowedViews.includes(view);
            item.classList.toggle('hidden', !allowed);
            item.style.display = allowed ? '' : 'none';
        });

        // More menu items (Mobile)
        document.querySelectorAll('#more-menu .more-menu-item[data-view]').forEach(item => {
            const view = item.dataset.view;
            const allowed = allowedViews.includes(view);
            item.classList.toggle('hidden', !allowed);
            item.style.display = allowed ? '' : 'none';
        });
    },

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

        // Desregistrar Service Workers antiguos (PWA) para forzar la actualización a la nube
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for(let registration of registrations) {
                    registration.unregister();
                    console.log('ServiceWorker antiguo eliminado');
                }
            });
        }

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
            isAuth = sessionStorage.getItem('cafecontrol_auth') === 'true';
        } catch (err) {
            console.warn('Storage bloqueado por política del navegador', err);
            isAuth = false;
        }

        if (isAuth) {
            let user = null;
            try {
                user = JSON.parse(sessionStorage.getItem('cafecontrol_user'));
            } catch (e) {}

            if (user && user.rol) {
                App.applyRoleAccess(user.rol);
            }
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

        // Toggle password visibility in Login
        const loginToggleBtn = document.getElementById('toggle-login-password');
        const loginPassInput = document.getElementById('login-password');
        if (loginToggleBtn && loginPassInput) {
            loginToggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const isPassword = loginPassInput.type === 'password';
                loginPassInput.type = isPassword ? 'text' : 'password';
                loginToggleBtn.innerHTML = isPassword 
                    ? `<i data-lucide="eye-off" style="width: 20px; height: 20px;"></i>` 
                    : `<i data-lucide="eye" style="width: 20px; height: 20px;"></i>`;
                if (window.lucide) window.lucide.createIcons();
            });
        }

        // Login form
        const loginForm = document.getElementById('login-form');
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const identifier = document.getElementById('login-username').value.trim();
            const pass = document.getElementById('login-password').value;

            // Trigger spinner animation
            const btnSubmit = document.getElementById('btn-login-submit');
            const btnText = document.getElementById('btn-login-text');
            const btnSpinner = document.getElementById('btn-login-spinner');
            const btnIcon = document.getElementById('btn-login-icon');

            if (btnSubmit) {
                btnSubmit.disabled = true;
                btnSubmit.style.opacity = '0.8';
            }
            if (btnText) btnText.textContent = 'Autenticando...';
            if (btnSpinner) btnSpinner.classList.remove('hidden');
            if (btnIcon) btnIcon.classList.add('hidden');

            const restoreBtn = () => {
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.style.opacity = '';
                }
                if (btnText) btnText.textContent = 'Ingresar al Sistema';
                if (btnSpinner) btnSpinner.classList.add('hidden');
                if (btnIcon) btnIcon.classList.remove('hidden');
            };

            try {
                // Consultar usuario en la base de datos
                const user = await db.getUsuarioByLogin(identifier);
                if (user) {
                    // Validar contraseña mediante hash SHA-256
                    const enteredHash = await db.sha256(pass);
                    if (enteredHash === user.password_hash) {
                        try {
                            sessionStorage.setItem('cafecontrol_auth', 'true');
                            sessionStorage.setItem('cafecontrol_user', JSON.stringify(user));
                        } catch (err) {
                            console.warn('No se pudo guardar la sesión por políticas de navegador.');
                        }
                        
                        document.getElementById('login-error').classList.add('hidden');
                        App.applyRoleAccess(user.rol);
                        App.showApp();
                        
                        const allowedViews = App.roleViews[user.rol] || ['dashboard'];
                        // Obrero siempre va a mi-rendimiento
                        const defaultView = user.rol === 'obrero' ? 'mi-rendimiento' : 'dashboard';
                        let hash = location.hash.replace('#', '') || defaultView;
                        if (!allowedViews.includes(hash)) {
                            hash = defaultView;
                        }

                        // Forzar explícitamente el hash en la URL
                        if (window.location.hash !== '#' + hash) {
                            window.location.hash = hash;
                        }

                        App.navigate(hash);
                        restoreBtn();
                        return false;
                    }
                }
                
                // Mostrar error de credenciales
                restoreBtn();
                document.getElementById('login-error').classList.remove('hidden');
            } catch (err) {
                console.error("Error durante el inicio de sesión:", err);
                restoreBtn();
                App.toast("Error al conectar con la base de datos.", "error");
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
        // Obsoleto: PWA desactivada
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
        // Enforce role routing guard
        let activeUser = null;
        try {
            activeUser = JSON.parse(sessionStorage.getItem('cafecontrol_user'));
        } catch (e) {}

        const role = activeUser ? activeUser.rol : null;
        const allowedViews = App.roleViews[role] || ['dashboard'];
        const defaultView = role === 'obrero' ? 'mi-rendimiento' : 'dashboard';

        if (sessionStorage.getItem('cafecontrol_auth') === 'true' && !allowedViews.includes(view)) {
            App.toast('Acceso restringido para tu rol.', 'error');
            location.hash = defaultView;
            return;
        }

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
            config: Config,
            'mi-rendimiento': MiRendimiento
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
        if (!container) return;
        const icons = { 
            success: 'check-circle', 
            error: 'alert-octagon', 
            info: 'info',
            warning: 'alert-triangle'
        };
        const iconName = icons[type] || 'info';
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i data-lucide="${iconName}" style="width: 18px; height: 18px; flex-shrink: 0;"></i><span>${message}</span>`;
        container.appendChild(toast);

        if (window.lucide) {
            window.lucide.createIcons();
        }

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-15px) scale(0.95)';
            toast.style.transition = 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
            setTimeout(() => toast.remove(), 350);
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

