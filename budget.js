// budget.js - ACTUALIZADO CON NUEVO DISEÑO
class BudgetManager {
    constructor() {
        this.presupuestos = [];
        this.presupuestoHabilitado = true;
        this.gastos = [];
        this.init();
    }
    
    async init() {
        await this.cargarPresupuestos();
        await this.cargarGastos();
        this.cargarConfigPresupuesto();
        this.setupEventListeners();
        this.renderPresupuestos();
    }
    
    setupEventListeners() {
        const btnNuevo = document.getElementById('btn-nuevo-presupuesto');
        if (btnNuevo) {
            btnNuevo.addEventListener('click', () => {
                this.mostrarModalPresupuesto();
            });
        }
        
        const form = document.getElementById('presupuesto-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.guardarPresupuesto();
            });
        }
        
        document.querySelectorAll('#modal-presupuesto .close, #modal-presupuesto .cancel').forEach(btn => {
            btn.addEventListener('click', () => {
                this.cerrarModalPresupuesto();
            });
        });
        
        const togglePresupuesto = document.getElementById('toggle-presupuesto');
        if (togglePresupuesto) {
            togglePresupuesto.addEventListener('change', (e) => {
                this.presupuestoHabilitado = e.target.checked;
                this.guardarConfigPresupuesto();
                this.renderPresupuestos();
                this.mostrarMensajeExito(`Presupuesto ${this.presupuestoHabilitado ? 'habilitado' : 'deshabilitado'}`);
                if (window.dashboard) {
                    window.dashboard.loadDashboardData();
                }
            });
        }
    }

    // ✅ NUEVO: Cargar gastos desde Firebase
    async cargarGastos() {
        const userId = window.authManager?.getUserId();
        if (!userId) return;
        try {
            const docRef = firebaseDb.collection(userId).doc('gastos');
            const doc = await docRef.get();
            this.gastos = doc.exists ? doc.data().items || [] : [];
        } catch (error) {
            console.error('Error cargando gastos en BudgetManager:', error);
            this.gastos = [];
        }
    }

    async cargarPresupuestos() {
        const userId = window.authManager?.getUserId();
        if (!userId) return;
        try {
            const docRef = firebaseDb.collection(userId).doc('presupuestos');
            const doc = await docRef.get();
            this.presupuestos = doc.exists ? doc.data().items || [] : [];
        } catch (error) {
            console.error('Error cargando presupuestos:', error);
            this.presupuestos = [];
        }
    }

    cargarConfigPresupuesto() {
        const userId = window.authManager?.getUserId() || 'default';
        const key = `presupuestoConfig_${userId}`;
        const config = JSON.parse(localStorage.getItem(key) || '{}');
        this.presupuestoHabilitado = config.habilitado !== undefined ? config.habilitado : true;
        const toggle = document.getElementById('toggle-presupuesto');
        if (toggle) toggle.checked = this.presupuestoHabilitado;
    }

    guardarConfigPresupuesto() {
        const userId = window.authManager?.getUserId() || 'default';
        const key = `presupuestoConfig_${userId}`;
        localStorage.setItem(key, JSON.stringify({ habilitado: this.presupuestoHabilitado }));
    }

    // ✅ CORREGIDO: obtener gastos reales del mes/año
    obtenerGastosDelMes(mes, anio) {
        return this.gastos.filter(gasto => {
            const fecha = gasto.fecha?.toDate ? gasto.fecha.toDate() : new Date(gasto.fecha);
            return (fecha.getMonth() + 1) === mes && fecha.getFullYear() === anio;
        });
    }

    mostrarModalPresupuesto(presupuestoExistente = null) {
        const modal = document.getElementById('modal-presupuesto');
        const form = document.getElementById('presupuesto-form');
        const title = document.getElementById('modal-presupuesto-title');
        if (!modal) return;
        if (presupuestoExistente) {
            title.textContent = 'Editar Presupuesto';
            this.llenarFormularioPresupuesto(presupuestoExistente);
        } else {
            title.textContent = 'Nuevo Presupuesto';
            if (form) form.reset();
            this.establecerValoresPorDefecto();
        }
        this.populateMonthYearSelects();
        modal.style.display = 'block';
    }

    llenarFormularioPresupuesto(presupuesto) {
        document.getElementById('presupuesto-mes').value = presupuesto.mes || '';
        document.getElementById('presupuesto-anio').value = presupuesto.anio || '';
        document.getElementById('presupuesto-monto').value = presupuesto.monto || '';
        const alertas = presupuesto.alertas || {};
        document.getElementById('alerta-80').checked = alertas.al80 || false;
        document.getElementById('alerta-100').checked = alertas.al100 || false;
        document.getElementById('alerta-110').checked = alertas.al110 || false;
    }

    establecerValoresPorDefecto() {
        const now = new Date();
        const mesSelect = document.getElementById('presupuesto-mes');
        const anioSelect = document.getElementById('presupuesto-anio');
        if (mesSelect) mesSelect.value = now.getMonth() + 1;
        if (anioSelect) anioSelect.value = now.getFullYear();
    }

    populateMonthYearSelects() {
        const mesSelect = document.getElementById('presupuesto-mes');
        const anioSelect = document.getElementById('presupuesto-anio');
        if (!mesSelect || !anioSelect) return;
        mesSelect.innerHTML = '';
        anioSelect.innerHTML = '';
        const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        meses.forEach((mes, i) => {
            const opt = document.createElement('option');
            opt.value = i + 1;
            opt.textContent = mes;
            mesSelect.appendChild(opt);
        });
        const currentYear = new Date().getFullYear();
        for (let y = 2020; y <= currentYear + 5; y++) {
            const opt = document.createElement('option');
            opt.value = y;
            opt.textContent = y;
            anioSelect.appendChild(opt);
        }
    }

    async guardarPresupuesto() {
        const mes = parseInt(document.getElementById('presupuesto-mes').value);
        const anio = parseInt(document.getElementById('presupuesto-anio').value);
        const montoInput = document.getElementById('presupuesto-monto').value;
        if (!mes || !anio) return this.mostrarMensajeError('Mes y año son obligatorios');
        const monto = parseFloat(montoInput);
        if (isNaN(monto) || monto <= 0) return this.mostrarMensajeError('Monto debe ser > 0');
        const alertas = {
            al80: document.getElementById('alerta-80').checked,
            al100: document.getElementById('alerta-100').checked,
            al110: document.getElementById('alerta-110').checked
        };
        const nuevoPresupuesto = {
            id: Date.now().toString(),
            mes,
            anio,
            monto,
            alertas,
            createdAt: new Date()
        };
        const userId = window.authManager?.getUserId();
        if (!userId) return this.mostrarMensajeError('Usuario no autenticado');
        try {
            const docRef = firebaseDb.collection(userId).doc('presupuestos');
            const doc = await docRef.get();
            let items = doc.exists ? doc.data().items || [] : [];
            const idx = items.findIndex(p => p.mes === mes && p.anio === anio);
            if (idx !== -1) {
                items[idx] = { ...items[idx], ...nuevoPresupuesto };
            } else {
                items.push(nuevoPresupuesto);
            }
            await docRef.set({ items }, { merge: true });
            this.cerrarModalPresupuesto();
            this.mostrarMensajeExito('Presupuesto guardado');
            await this.cargarPresupuestos();
            await this.cargarGastos(); // ✅ Recargar gastos para actualizar vistas
            this.renderPresupuestos();
            if (window.dashboard) window.dashboard.loadDashboardData();
        } catch (error) {
            console.error('Error guardando presupuesto:', error);
            this.mostrarMensajeError('Error al guardar presupuesto');
        }
    }

    cerrarModalPresupuesto() {
        const modal = document.getElementById('modal-presupuesto');
        if (modal) modal.style.display = 'none';
    }

    renderPresupuestos() {
        const container = document.getElementById('budgets-container');
        if (!container) return;

        // Actualizar gastado real del mes actual
        const hoy = new Date();
        const gastadoActual = this.obtenerGastosDelMes(hoy.getMonth() + 1, hoy.getFullYear())
            .reduce((sum, g) => sum + (g.monto || 0), 0);
        document.getElementById('presupuesto-gastado').textContent = `$${gastadoActual.toFixed(2)}`;

        container.innerHTML = '';
        
        if (this.presupuestos.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📊</div>
                    <h3>No hay presupuestos configurados</h3>
                    <p>Configura uno para controlar tus gastos mensuales.</p>
                    <button class="btn btn-primary" onclick="budgetManager.mostrarModalPresupuesto()">+ Crear Presupuesto</button>
                </div>
            `;
            return;
        }

        const sorted = [...this.presupuestos].sort((a, b) => new Date(b.anio, b.mes) - new Date(a.anio, a.mes));
        sorted.forEach(p => container.appendChild(this.crearTarjetaPresupuesto(p)));
    }

    crearTarjetaPresupuesto(presupuesto) {
        const card = document.createElement('div');
        card.className = 'budget-card';

        // Calcular gasto real del mes del presupuesto
        const gastosMes = this.obtenerGastosDelMes(presupuesto.mes, presupuesto.anio);
        const totalGastado = gastosMes.reduce((sum, g) => sum + (g.monto || 0), 0);

        let estadoTexto = 'Dentro del límite';
        let estadoColor = '#4CAF50';
        let porcentajeUso = 0;

        if (this.presupuestoHabilitado && presupuesto.monto > 0) {
            porcentajeUso = (totalGastado / presupuesto.monto) * 100;
            if (porcentajeUso >= 100) {
                estadoTexto = 'Excedido';
                estadoColor = '#f44336';
            } else if (porcentajeUso >= 80) {
                estadoTexto = 'Cerca del límite';
                estadoColor = '#FF9800';
            }
        } else {
            estadoTexto = 'Deshabilitado';
            estadoColor = '#999';
        }

        card.innerHTML = `
            <div class="budget-header">
                <h3 class="budget-title">${this.obtenerNombreMes(presupuesto.mes)} ${presupuesto.anio}</h3>
                <span class="budget-status" style="background: ${estadoColor}20; color: ${estadoColor}; border: 1px solid ${estadoColor}40">
                    ${estadoTexto}
                </span>
            </div>
            
            <div class="budget-numbers">
                <div class="budget-item">
                    <span class="label">Presupuesto:</span>
                    <span class="value">$${presupuesto.monto.toFixed(2)}</span>
                </div>
                <div class="budget-item">
                    <span class="label">Gastado:</span>
                    <span class="value">$${totalGastado.toFixed(2)}</span>
                </div>
                <div class="budget-item">
                    <span class="label">Disponible:</span>
                    <span class="value" style="color: ${presupuesto.monto - totalGastado >= 0 ? '#4CAF50' : '#f44336'}">
                        $${(presupuesto.monto - totalGastado).toFixed(2)}
                    </span>
                </div>
            </div>
            
            ${this.presupuestoHabilitado ? `
                <div class="budget-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(porcentajeUso, 100)}%; background: ${estadoColor}"></div>
                    </div>
                    <span class="progress-text">${porcentajeUso.toFixed(1)}%</span>
                </div>
            ` : ''}
            
            <div class="budget-actions">
                <button class="btn btn-outline" onclick="budgetManager.editarPresupuesto('${presupuesto.id}')">
                    <span class="btn-icon">✏️</span> Editar
                </button>
                <button class="btn btn-danger" onclick="budgetManager.eliminarPresupuesto('${presupuesto.id}')">
                    <span class="btn-icon">🗑️</span> Eliminar
                </button>
            </div>
        `;
        
        return card;
    }

    obtenerNombreMes(mes) {
        const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        return meses[mes - 1];
    }

    editarPresupuesto(id) {
        const p = this.presupuestos.find(x => x.id === id);
        if (p) this.mostrarModalPresupuesto(p);
    }

    async eliminarPresupuesto(id) {
        if (!confirm('¿Eliminar presupuesto?')) return;
        const userId = window.authManager?.getUserId();
        if (!userId) return this.mostrarMensajeError('Usuario no autenticado');
        try {
            const docRef = firebaseDb.collection(userId).doc('presupuestos');
            const nuevos = this.presupuestos.filter(p => p.id !== id);
            await docRef.set({ items: nuevos }, { merge: true });
            this.presupuestos = nuevos;
            this.renderPresupuestos();
            this.mostrarMensajeExito('Presupuesto eliminado');
            if (window.dashboard) window.dashboard.loadDashboardData();
        } catch (error) {
            console.error('Error eliminando presupuesto:', error);
            this.mostrarMensajeError('Error al eliminar');
        }
    }

    mostrarMensajeExito(msg) { this.mostrarNotificacion(msg, 'success'); }
    mostrarMensajeError(msg) { this.mostrarNotificacion(msg, 'error'); }
    mostrarNotificacion(msg, tipo = 'info') {
        const notif = document.createElement('div');
        notif.className = `notification ${tipo}`;
        notif.innerHTML = `<span>${tipo === 'success' ? '✅' : tipo === 'error' ? '❌' : 'ℹ️'} ${msg}</span>`;
        notif.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 1000;
            background: ${tipo === 'success' ? '#4CAF50' : tipo === 'error' ? '#f44336' : '#2196F3'};
            color: white; padding: 1rem 1.5rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 3000);
    }

    estaHabilitado() { return this.presupuestoHabilitado; }
}
window.BudgetManager = BudgetManager;