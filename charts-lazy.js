// charts-lazy.js - Lazy Loading para Gráficas
class LazyChartsManager {
    constructor() {
        this.observer = null;
        this.init();
    }
    
    init() {
        console.log('Inicializando Lazy Charts Manager...');
        this.setupIntersectionObserver();
        this.setupChartsLazyLoading();
    }
    
    setupIntersectionObserver() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const chartContainer = entry.target;
                        this.loadChart(chartContainer);
                        this.observer.unobserve(chartContainer);
                    }
                });
            }, {
                rootMargin: '50px', // Cargar antes de que sean visibles
                threshold: 0.1
            });
        }
    }
    
    setupChartsLazyLoading() {
        // Marcar todos los contenedores de gráficas para lazy loading
        document.querySelectorAll('.chart-container').forEach(container => {
            // Agregar placeholder
            const placeholder = this.createPlaceholder();
            container.innerHTML = '';
            container.appendChild(placeholder);
            
            // Observar si es visible
            if (this.observer) {
                this.observer.observe(container);
            } else {
                // Fallback: cargar todas las gráficas
                setTimeout(() => this.loadChart(container), 100);
            }
        });
    }
    
    createPlaceholder() {
        const placeholder = document.createElement('div');
        placeholder.className = 'chart-placeholder';
        placeholder.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            background: var(--bg-secondary);
            border-radius: var(--radius-sm);
            color: var(--text-light);
        `;
        placeholder.innerHTML = `
            <div class="loading-spinner" style="
                width: 40px;
                height: 40px;
                border: 3px solid var(--border);
                border-top: 3px solid var(--primary);
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 1rem;
            "></div>
            <p style="font-size: 0.9rem;">Cargando gráfica...</p>
        `;
        return placeholder;
    }
    
    async loadChart(container) {
        // Remover placeholder
        const placeholder = container.querySelector('.chart-placeholder');
        if (placeholder) {
            placeholder.remove();
        }
        
        // Agregar clase de animación de entrada
        container.classList.add('lazy-load');
        
        // Determinar qué gráfica cargar basado en el ID del contenedor
        const chartId = container.id;
        
        try {
            // Pequeña demora para animación suave
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Llamar al manager de gráficas correspondiente
            if (window.chartsManager && typeof window.chartsManager.loadAllCharts === 'function') {
                // Usar el método existente para cargar datos
                await window.chartsManager.loadAllCharts();
            }
            
            // Mostrar gráfica con animación
            setTimeout(() => {
                container.classList.add('visible');
            }, 100);
            
        } catch (error) {
            console.error('Error cargando gráfica:', error);
            this.showErrorState(container);
        }
    }
    
    showErrorState(container) {
        container.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-light); text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
                <p style="font-size: 0.9rem;">Error cargando gráfica</p>
                <button class="btn btn-outline btn-sm" onclick="window.lazyChartsManager.retryLoadChart(this)">
                    Reintentar
                </button>
            </div>
        `;
    }
    
    retryLoadChart(button) {
        const container = button.closest('.chart-container');
        if (container) {
            this.loadChart(container);
        }
    }
    
    // Método para recargar gráficas cuando cambian los datos
    refreshCharts() {
        document.querySelectorAll('.chart-container').forEach(container => {
            if (this.isElementInViewport(container)) {
                this.loadChart(container);
            }
        });
    }
    
    isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.lazyChartsManager = new LazyChartsManager();
    
    // Observar cambios en la sección activa
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const section = mutation.target;
                if (section.style.display === 'block') {
                    // Recargar gráficas visibles en la nueva sección
                    setTimeout(() => {
                        window.lazyChartsManager?.refreshCharts();
                    }, 500);
                }
            }
        });
    });
    
    // Observar todas las secciones de contenido
    document.querySelectorAll('.content-section').forEach(section => {
        observer.observe(section, { attributes: true });
    });
});

// Agregar animación CSS para el spinner
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .lazy-load {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.5s ease, transform 0.5s ease;
    }
    
    .lazy-load.visible {
        opacity: 1;
        transform: translateY(0);
    }
`;
document.head.appendChild(style);