// pwa.js - Funcionalidades PWA Mejoradas
class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.init();
    }
    
    init() {
        console.log('Inicializando PWA Manager...');
        this.registerServiceWorker();
        this.setupInstallPrompt();
        this.setupOfflineDetection();
        this.setupBackgroundSync();
        this.addToHomeScreen();
        this.setupTouchGestures();
    }
    
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('Service Worker registrado:', registration);
                    
                    // Verificar actualizaciones
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                this.showUpdateNotification();
                            }
                        });
                    });
                })
                .catch(error => {
                    console.log('Error registrando Service Worker:', error);
                });
            
            // Escuchar mensajes del Service Worker
            navigator.serviceWorker.addEventListener('message', event => {
                if (event.data.type === 'CACHE_UPDATED') {
                    this.showNotification('Aplicación actualizada', 'info');
                }
            });
        }
    }
    
    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });
        
        window.addEventListener('appinstalled', () => {
            console.log('Aplicación instalada');
            this.deferredPrompt = null;
            this.hideInstallButton();
            
            // Enviar evento de análisis
            if (typeof gtag !== 'undefined') {
                gtag('event', 'install', {
                    'event_category': 'PWA',
                    'event_label': 'Instalación exitosa'
                });
            }
        });
    }
    
    showInstallButton() {
        // Crear botón de instalación si no existe
        if (!document.getElementById('install-button')) {
            const installButton = document.createElement('button');
            installButton.id = 'install-button';
            installButton.className = 'btn btn-primary';
            installButton.innerHTML = '📱 Instalar App';
            installButton.style.position = 'fixed';
            installButton.style.bottom = '20px';
            installButton.style.right = '20px';
            installButton.style.zIndex = '9999';
            installButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
            
            installButton.addEventListener('click', () => this.installApp());
            
            document.body.appendChild(installButton);
            
            // Ocultar después de 10 segundos
            setTimeout(() => {
                this.hideInstallButton();
            }, 10000);
        }
    }
    
    hideInstallButton() {
        const button = document.getElementById('install-button');
        if (button) {
            button.remove();
        }
    }
    
    async installApp() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            console.log(`Resultado de instalación: ${outcome}`);
            this.deferredPrompt = null;
        }
    }
    
    setupOfflineDetection() {
        // Detectar cambios en conexión
        window.addEventListener('online', () => {
            this.showNotification('Conexión restablecida', 'success');
            this.syncOfflineData();
        });
        
        window.addEventListener('offline', () => {
            this.showNotification('Modo offline activado', 'warning');
        });
        
        // Mostrar estado inicial
        if (!navigator.onLine) {
            this.showOfflineIndicator();
        }
    }
    
    showOfflineIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'offline-indicator';
        indicator.className = 'offline-indicator';
        indicator.innerHTML = '⚠️ Sin conexión';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: var(--warning);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.8rem;
            z-index: 9999;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(indicator);
    }
    
    setupBackgroundSync() {
        if ('sync' in registration) {
            // Registrar sincronización periódica
            navigator.serviceWorker.ready.then(registration => {
                registration.periodicSync.register('sync-data', {
                    minInterval: 24 * 60 * 60 * 1000 // 24 horas
                }).then(() => {
                    console.log('Sincronización periódica registrada');
                });
            });
        }
    }
    
    async syncOfflineData() {
        // Aquí iría la lógica para sincronizar datos guardados localmente
        console.log('Sincronizando datos offline...');
        
        // Remover indicador offline
        const indicator = document.getElementById('offline-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    addToHomeScreen() {
        // Detectar si es iOS y mostrar instrucciones
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        
        if (isIOS && !isStandalone) {
            this.showIOSInstallInstructions();
        }
    }
    
    showIOSInstallInstructions() {
        const modalHTML = `
            <div class="modal" id="ios-install-modal">
                <div class="modal-content" style="max-width: 400px;">
                    <div class="modal-header">
                        <h3>📱 Instalar en iOS</h3>
                        <span class="close">&times;</span>
                    </div>
                    <div class="modal-form">
                        <div style="text-align: center; padding: 1rem;">
                            <div style="font-size: 3rem; margin-bottom: 1rem;">⬆️</div>
                            <p><strong>Para instalar esta app:</strong></p>
                            <ol style="text-align: left; margin: 1rem 0; padding-left: 1.5rem;">
                                <li>Toca el botón Compartir <span style="color: var(--primary);">⎋</span></li>
                                <li>Selecciona "Agregar a Inicio"</li>
                                <li>Toca "Agregar"</li>
                            </ol>
                            <small style="color: var(--text-light);">
                                Disponible como aplicación nativa desde la pantalla de inicio
                            </small>
                        </div>
                        <div class="form-actions">
                            <button class="btn btn-primary close">Entendido</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Solo mostrar una vez por sesión
        if (!sessionStorage.getItem('ios-install-shown')) {
            setTimeout(() => {
                document.body.insertAdjacentHTML('beforeend', modalHTML);
                const modal = document.getElementById('ios-install-modal');
                modal.style.display = 'block';
                
                modal.querySelectorAll('.close').forEach(btn => {
                    btn.addEventListener('click', () => {
                        modal.style.display = 'none';
                        modal.remove();
                        sessionStorage.setItem('ios-install-shown', 'true');
                    });
                });
            }, 3000);
        }
    }
    
    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.className = 'notification info';
        notification.innerHTML = `
            <span>🔄 Nueva versión disponible</span>
            <button class="btn btn-sm btn-outline" style="margin-left: 1rem;" onclick="location.reload()">
                Actualizar
            </button>
        `;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            background: var(--info);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            justify-content: space-between;
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 10000);
    }
    
    setupTouchGestures() {
        // Swipe para navegación lateral
        let startX, startY;
        const threshold = 100;
        
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });
        
        document.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;
            
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            
            const diffX = startX - endX;
            const diffY = startY - endY;
            
            // Solo considerar swipes horizontales
            if (Math.abs(diffX) > Math.abs(diffY)) {
                // Umbral mínimo para considerar swipe
                if (Math.abs(diffX) > threshold) {
                    if (diffX > 0) {
                        // Swipe izquierda
                        this.handleSwipeLeft();
                    } else {
                        // Swipe derecha
                        this.handleSwipeRight();
                    }
                }
            }
            
            startX = null;
            startY = null;
        }, { passive: true });
    }
    
    handleSwipeLeft() {
        // Navegar a la siguiente sección
        const sections = ['dashboard', 'gastos', 'configuracion', 'presupuestos', 'tareas', 'graficos'];
        const currentSection = document.querySelector('.content-section[style*="display: block"]')?.id;
        
        if (currentSection) {
            const currentIndex = sections.indexOf(currentSection);
            if (currentIndex < sections.length - 1) {
                window.gastosApp?.mostrarSeccion(sections[currentIndex + 1]);
            }
        }
    }
    
    handleSwipeRight() {
        // Navegar a la sección anterior
        const sections = ['dashboard', 'gastos', 'configuracion', 'presupuestos', 'tareas', 'graficos'];
        const currentSection = document.querySelector('.content-section[style*="display: block"]')?.id;
        
        if (currentSection) {
            const currentIndex = sections.indexOf(currentSection);
            if (currentIndex > 0) {
                window.gastosApp?.mostrarSeccion(sections[currentIndex - 1]);
            }
        }
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `<span>${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'} ${message}</span>`;
        document.body.appendChild(notification);
        
        setTimeout(() => { 
            if (notification.parentElement) notification.remove(); 
        }, 4000);
    }
}

// Inicializar PWA Manager
document.addEventListener('DOMContentLoaded', () => {
    window.pwaManager = new PWAManager();
});