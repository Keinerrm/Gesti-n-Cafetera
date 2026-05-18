/* ============================================
   theme.js — Theme Manager
   CaféControl — Premium Theme System
   ============================================ */

const ThemeManager = {
    STORAGE_KEY: 'cafecontrol_theme',
    VALID_THEMES: ['cafe', 'light', 'dark'],
    DEFAULT_THEME: 'cafe',
    _transitioning: false,

    /**
     * Initialize theme system.
     * Priority: localStorage > prefers-color-scheme > default (cafe)
     */
    init() {
        const saved = this._getSaved();
        const theme = saved || this._detectSystemPreference();
        this._applyTheme(theme, false); // No transition on first load

        // Listen for OS theme changes (only if user hasn't manually chosen)
        this._watchSystemPreference();
    },

    /**
     * Switch to a specific theme with smooth transition
     */
    setTheme(theme) {
        if (!this.VALID_THEMES.includes(theme)) return;
        if (theme === this.getTheme()) return;

        this._applyTheme(theme, true);
        this._save(theme);

        // Update meta theme-color for mobile browsers / PWA
        this._updateMetaThemeColor();
    },

    /**
     * Get the currently active theme
     */
    getTheme() {
        return document.documentElement.getAttribute('data-theme') || this.DEFAULT_THEME;
    },

    /**
     * Cycle through themes: cafe → light → dark → cafe
     */
    cycleTheme() {
        const current = this.getTheme();
        const idx = this.VALID_THEMES.indexOf(current);
        const next = this.VALID_THEMES[(idx + 1) % this.VALID_THEMES.length];
        this.setTheme(next);
    },

    /**
     * Render the theme switcher HTML (for sidebar and mobile)
     */
    renderSwitcher(location = 'sidebar') {
        const current = this.getTheme();
        const cls = location === 'sidebar' ? 'theme-switcher-sidebar' : 'theme-switcher-mobile';

        return `
            <div class="theme-switcher ${cls}" role="radiogroup" aria-label="Seleccionar tema">
                <button class="theme-btn ${current === 'cafe' ? 'active' : ''}" 
                        onclick="ThemeManager.setTheme('cafe')" 
                        role="radio" aria-checked="${current === 'cafe'}" 
                        title="Tema Café Glass">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/>
                    </svg>
                    Café
                </button>
                <button class="theme-btn ${current === 'light' ? 'active' : ''}" 
                        onclick="ThemeManager.setTheme('light')" 
                        role="radio" aria-checked="${current === 'light'}" 
                        title="Tema Claro Premium">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
                    </svg>
                    Light
                </button>
                <button class="theme-btn ${current === 'dark' ? 'active' : ''}" 
                        onclick="ThemeManager.setTheme('dark')" 
                        role="radio" aria-checked="${current === 'dark'}" 
                        title="Tema Oscuro Premium">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
                    </svg>
                    Dark
                </button>
            </div>
        `;
    },

    /**
     * Update all theme switcher buttons in DOM to reflect current state
     */
    _updateSwitcherUI() {
        const current = this.getTheme();
        document.querySelectorAll('.theme-btn').forEach(btn => {
            const btnTheme = btn.getAttribute('onclick')?.match(/'(\w+)'/)?.[1];
            if (btnTheme) {
                btn.classList.toggle('active', btnTheme === current);
                btn.setAttribute('aria-checked', btnTheme === current);
            }
        });
    },

    // --- Private methods ---

    _applyTheme(theme, animate) {
        const html = document.documentElement;

        if (animate && !this._transitioning) {
            this._transitioning = true;
            html.classList.add('theme-transitioning');
            setTimeout(() => {
                html.classList.remove('theme-transitioning');
                this._transitioning = false;
            }, 400);
        }

        html.setAttribute('data-theme', theme);
        this._updateSwitcherUI();
    },

    _getSaved() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved && this.VALID_THEMES.includes(saved)) return saved;
        } catch (e) { /* localStorage blocked */ }
        return null;
    },

    _save(theme) {
        try {
            localStorage.setItem(this.STORAGE_KEY, theme);
        } catch (e) { /* localStorage blocked */ }
    },

    _detectSystemPreference() {
        if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
        return this.DEFAULT_THEME;
    },

    _watchSystemPreference() {
        const mql = window.matchMedia('(prefers-color-scheme: dark)');
        mql.addEventListener('change', (e) => {
            // Only auto-switch if user hasn't manually set a theme
            if (!this._getSaved()) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    },

    _updateMetaThemeColor() {
        const color = getComputedStyle(document.documentElement)
            .getPropertyValue('--meta-theme-color').trim();
        if (color) {
            let meta = document.querySelector('meta[name="theme-color"]');
            if (meta) meta.setAttribute('content', color);
        }
    }
};

// ============================================
// EARLY INIT — Prevent flash of wrong theme
// Apply theme BEFORE DOMContentLoaded
// ============================================
(function () {
    const STORAGE_KEY = 'cafecontrol_theme';
    const VALID = ['cafe', 'light', 'dark'];
    let theme;
    try {
        theme = localStorage.getItem(STORAGE_KEY);
    } catch (e) { }

    if (!theme || !VALID.includes(theme)) {
        if (window.matchMedia('(prefers-color-scheme: light)').matches) theme = 'light';
        else if (window.matchMedia('(prefers-color-scheme: dark)').matches) theme = 'dark';
        else theme = 'cafe';
    }

    document.documentElement.setAttribute('data-theme', theme);
})();
