// theme.js - Gestor de temas para la aplicación
class ThemeManager {
    constructor() {
        this.currentTheme = 'dark'; // 'dark', 'light', o 'system'
        this.systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.init();
    }
    
    init() {
        console.log('Inicializando Gestor de Temas...');
        this.loadThemeSettings();
        this.setupEventListeners();
        this.setupSystemThemeListener();
        this.applyTheme();
    }
    
    loadThemeSettings() {
        // Intentar cargar la configuración del tema desde localStorage
        const savedTheme = localStorage.getItem('app-theme');
        const savedSystemTheme = localStorage.getItem('use-system-theme');
        
        if (savedTheme) {
            this.currentTheme = savedTheme;
        }
        
        // Configurar los toggles según la configuración guardada
        const darkModeToggle = document.getElementById('toggle-dark-mode');
        const systemThemeToggle = document.getElementById('toggle-system-theme');
        
        if (darkModeToggle) {
            // Si el tema es claro, el toggle debe estar desactivado (ya que es "modo oscuro")
            darkModeToggle.checked = this.currentTheme === 'dark';
        }
        
        if (systemThemeToggle) {
            systemThemeToggle.checked = savedSystemTheme === 'true';
            
            // Si el sistema está habilitado, deshabilitar el toggle de modo oscuro
            if (savedSystemTheme === 'true') {
                this.disableDarkModeToggle(true);
            }
        }
    }
    
    setupEventListeners() {
        const darkModeToggle = document.getElementById('toggle-dark-mode');
        const systemThemeToggle = document.getElementById('toggle-system-theme');
        
        if (darkModeToggle) {
            darkModeToggle.addEventListener('change', (e) => {
                if (systemThemeToggle && systemThemeToggle.checked) {
                    // Si el sistema está activado, desactivarlo primero
                    systemThemeToggle.checked = false;
                    this.onSystemThemeToggleChange(false);
                }
                
                this.currentTheme = e.target.checked ? 'dark' : 'light';
                this.saveThemeSettings();
                this.applyTheme();
                this.showThemeNotification();
            });
        }
        
        if (systemThemeToggle) {
            systemThemeToggle.addEventListener('change', (e) => {
                this.onSystemThemeToggleChange(e.target.checked);
            });
        }
    }
    
    setupSystemThemeListener() {
        // Escuchar cambios en la preferencia del sistema
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            this.systemPrefersDark = e.matches;
            
            // Solo aplicar si el modo sistema está activado
            const systemThemeToggle = document.getElementById('toggle-system-theme');
            if (systemThemeToggle && systemThemeToggle.checked) {
                this.applyTheme();
                this.showThemeNotification();
            }
        });
    }
    
    onSystemThemeToggleChange(enabled) {
        const darkModeToggle = document.getElementById('toggle-dark-mode');
        
        if (enabled) {
            // Activar modo sistema
            this.disableDarkModeToggle(true);
            this.currentTheme = 'system';
            localStorage.setItem('use-system-theme', 'true');
            
            // Aplicar el tema según la preferencia del sistema
            this.applyTheme();
        } else {
            // Desactivar modo sistema
            this.disableDarkModeToggle(false);
            localStorage.setItem('use-system-theme', 'false');
            
            // Mantener el tema actual (dark/light)
            this.applyTheme();
        }
        
        this.showThemeNotification();
    }
    
    disableDarkModeToggle(disabled) {
        const darkModeToggle = document.getElementById('toggle-dark-mode');
        const toggleLabel = darkModeToggle?.closest('.toggle-label');
        
        if (darkModeToggle) {
            darkModeToggle.disabled = disabled;
        }
        
        if (toggleLabel) {
            if (disabled) {
                toggleLabel.style.opacity = '0.6';
                toggleLabel.style.cursor = 'not-allowed';
            } else {
                toggleLabel.style.opacity = '1';
                toggleLabel.style.cursor = 'pointer';
            }
        }
    }
    
    applyTheme() {
        const body = document.body;
        
        // Determinar qué tema aplicar
        let themeToApply = this.currentTheme;
        
        if (this.currentTheme === 'system') {
            themeToApply = this.systemPrefersDark ? 'dark' : 'light';
        }
        
        // Aplicar la clase correspondiente
        if (themeToApply === 'light') {
            body.classList.add('light-mode');
            console.log('Modo claro activado');
        } else {
            body.classList.remove('light-mode');
            console.log('Modo oscuro activado');
        }
        
        // Actualizar iconos de feather
        setTimeout(() => {
            if (typeof feather !== 'undefined') {
                feather.replace();
            }
        }, 100);
        
        // Actualizar gráficos si es necesario
        this.updateCharts();
    }
    
    updateCharts() {
        // Si hay gráficos activos, podrían necesitar actualizarse
        if (window.dashboard && typeof window.dashboard.updateCharts === 'function') {
            setTimeout(() => {
                window.dashboard.loadDashboardData();
            }, 300);
        }
    }
    
    saveThemeSettings() {
        localStorage.setItem('app-theme', this.currentTheme);
    }
    
    showThemeNotification() {
        let message = '';
        const systemThemeToggle = document.getElementById('toggle-system-theme');
        
        if (systemThemeToggle && systemThemeToggle.checked) {
            const themeName = this.systemPrefersDark ? 'oscuro' : 'claro';
            message = `Modo sistema activado (${themeName})`;
        } else {
            const themeName = this.currentTheme === 'dark' ? 'oscuro' : 'claro';
            message = `Modo ${themeName} activado`;
        }
        
        // Mostrar notificación
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.innerHTML = `<span>🎨 ${message}</span>`;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 2000);
    }
    
    // Métodos públicos para control externo
    setDarkMode(enabled) {
        const darkModeToggle = document.getElementById('toggle-dark-mode');
        const systemThemeToggle = document.getElementById('toggle-system-theme');
        
        if (systemThemeToggle && systemThemeToggle.checked) {
            systemThemeToggle.checked = false;
            this.onSystemThemeToggleChange(false);
        }
        
        if (darkModeToggle) {
            darkModeToggle.checked = enabled;
            this.currentTheme = enabled ? 'dark' : 'light';
            this.saveThemeSettings();
            this.applyTheme();
            this.showThemeNotification();
        }
    }
    
    setSystemTheme(enabled) {
        const systemThemeToggle = document.getElementById('toggle-system-theme');
        if (systemThemeToggle) {
            systemThemeToggle.checked = enabled;
            this.onSystemThemeToggleChange(enabled);
        }
    }
    
    // Obtener el tema actual
    getCurrentTheme() {
        return this.currentTheme;
    }
    
    // Verificar si es modo oscuro
    isDarkMode() {
        if (this.currentTheme === 'system') {
            return this.systemPrefersDark;
        }
        return this.currentTheme === 'dark';
    }
    
    // Alternar entre claro y oscuro
    toggleTheme() {
        const darkModeToggle = document.getElementById('toggle-dark-mode');
        const systemThemeToggle = document.getElementById('toggle-system-theme');
        
        if (systemThemeToggle && systemThemeToggle.checked) {
            // Si está en modo sistema, desactivarlo y cambiar a oscuro
            systemThemeToggle.checked = false;
            this.onSystemThemeToggleChange(false);
            this.setDarkMode(true);
        } else {
            // Alternar normalmente
            const newState = !this.isDarkMode();
            this.setDarkMode(newState);
        }
    }
}

// Hacer disponible globalmente
window.ThemeManager = ThemeManager;