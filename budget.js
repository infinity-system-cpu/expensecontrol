// budget.js - GESTIÓN DE PRESUPUESTOS CORREGIDA
class BudgetManager {
    constructor() {
        this.presupuestos = [];
        this.presupuestoHabilitado = true;
        this.init();
    }

    async init() {
        await this.cargarPresupuestos();
        this.cargarConfigPresupuesto();
        this.setupEventListeners();
        this.renderPresupuestos();
    }

    setupEventListeners() {
        // Modal de presupuestos
        const btnNuevo = document.getElementById('btn-nuevo-presupuesto');
        if (btnNuevo) {
            btnNuevo.addEventListener('click', () => {
                this.mostrarModalPresupuesto();
            });
        }
        // Formulario de presupuesto
        const form = document.getElementById('presupuesto-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.guardarPresupuesto();
            });
        }
        // Cerrar modal
        document.querySelectorAll('#modal-presupuesto .close, #modal-presupuesto .cancel').forEach(btn => {
            btn.addEventListener('click', () => {
                this.cerrarModalPresupuesto();
            });
        });
        // Toggle presupuesto habilitado
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

    async cargarPresupuestos() {
        const userId = window.authManager.getUserId();
        if (!userId) {
            console.log('No hay usuario autenticado');
            return;
        }

        try {
            // CORRECCIÓN: Usar firebaseDb.collection(userId).doc('presupuestos')
            const docRef = firebaseDb.collection(userId).doc('presupuestos');
            const doc = await docRef.get();
            
            if (doc.exists) {
                const data = doc.data();
                this.presupuestos = data.items || [];
                console.log('Presupuestos cargados:', this.presupuestos);
            } else {
                this.presupuestos = [];
                console.log('No existe documento de presupuestos');
            }
        } catch (error) {
            console.error('Error cargando presupuestos:', error);
            this.presupuestos = [];
        }
    }

    cargarConfigPresupuesto() {
        const usuarioActual = window.authManager ? window.authManager.getUserId() : 'default';
        const key = `presupuestoConfig_${usuarioActual}`;
        const config = JSON.parse(localStorage.getItem(key) || '{}');
        this.presupuestoHabilitado = config.habilitado !== undefined ? config.habilitado : true;
        
        const toggle = document.getElementById('toggle-presupuesto');
        if (toggle) {
            toggle.checked = this.presupuestoHabilitado;
        }
    }

    guardarConfigPresupuesto() {
        const usuarioActual = window.authManager ? window.authManager.getUserId() : 'default';
        const key = `presupuestoConfig_${usuarioActual}`;
        localStorage.setItem(key, JSON.stringify({
            habilitado: this.presupuestoHabilitado
        }));
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
        
        if (presupuesto.alertas) {
            document.getElementById('alerta-80').checked = presupuesto.alertas.al80 || false;
            document.getElementById('alerta-100').checked = presupuesto.alertas.al100 || false;
            document.getElementById('alerta-110').checked = presupuesto.alertas.al110 || false;
        }
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
        
        // Limpiar selects
        mesSelect.innerHTML = '';
        anioSelect.innerHTML = '';
        
        // Poblar meses
        const meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        
        meses.forEach((mes, index) => {
            const option = document.createElement('option');
            option.value = index + 1;
            option.textContent = mes;
            mesSelect.appendChild(option);
        });
        
        // Poblar años (desde 2020 hasta 5 años en el futuro)
        const currentYear = new Date().getFullYear();
        for (let year = 2020; year <= currentYear + 5; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            anioSelect.appendChild(option);
        }
    }

    async guardarPresupuesto() {
        const form = document.getElementById('presupuesto-form');
        if (!form) return;
        
        // Obtener valores
        const mes = parseInt(document.getElementById('presupuesto-mes').value);
        const anio = parseInt(document.getElementById('presupuesto-anio').value);
        const montoInput = document.getElementById('presupuesto-monto').value;
        
        // Validaciones
        if (!mes || !anio) {
            this.mostrarMensajeError('Mes y año son obligatorios');
            return;
        }
        
        const monto = parseFloat(montoInput);
        if (isNaN(monto) || monto <= 0) {
            this.mostrarMensajeError('El monto debe ser un número mayor a 0');
            return;
        }
        
        const alertas = {
            al80: document.getElementById('alerta-80').checked,
            al100: document.getElementById('alerta-100').checked,
            al110: document.getElementById('alerta-110').checked
        };

        const nuevoPresupuesto = {
            id: Date.now().toString(),
            mes: mes,
            anio: anio,
            monto: monto,
            alertas: alertas,
            createdAt: new Date()
        };

        const userId = window.authManager.getUserId();
        if (!userId) {
            this.mostrarMensajeError('Usuario no autenticado');
            return;
        }

        try {
            // CORRECCIÓN: Actualizar el documento presupuestos
            const docRef = firebaseDb.collection(userId).doc('presupuestos');
            const doc = await docRef.get();
            
            let presupuestosActuales = [];
            if (doc.exists) {
                presupuestosActuales = doc.data().items || [];
            }

            // Verificar si ya existe un presupuesto para este mes/año
            const existingIndex = presupuestosActuales.findIndex(p => 
                p.mes === mes && p.anio === anio
            );

            if (existingIndex !== -1) {
                // Actualizar presupuesto existente
                presupuestosActuales[existingIndex] = { 
                    ...presupuestosActuales[existingIndex], 
                    ...nuevoPresupuesto 
                };
            } else {
                // Agregar nuevo presupuesto
                presupuestosActuales.push(nuevoPresupuesto);
            }

            await docRef.set({ items: presupuestosActuales }, { merge: true });

            this.cerrarModalPresupuesto();
            this.mostrarMensajeExito('Presupuesto guardado correctamente');
            
            await this.cargarPresupuestos();
            this.renderPresupuestos();
            
            if (window.dashboard) {
                window.dashboard.loadDashboardData();
            }
        } catch (error) {
            console.error('Error guardando presupuesto:', error);
            this.mostrarMensajeError('Error al guardar presupuesto: ' + error.message);
        }
    }

    cerrarModalPresupuesto() {
        const modal = document.getElementById('modal-presupuesto');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    renderPresupuestos() {
        const container = document.getElementById('budgets-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        // Mostrar estado del presupuesto
        const estadoPresupuesto = document.createElement('div');
        estadoPresupuesto.className = 'budget-status-toggle';
        //estadoPresupuesto.innerHTML = `
            //<div class="toggle-container">
                //<label class="toggle-label">
                    //<span>Presupuesto Habilitado:</span>
                    //<input type="checkbox" id="toggle-presupuesto" ${this.presupuestoHabilitado ? 'checked' : ''}>
                    //<span class="toggle-slider"></span>
                //</label>
                //<span class="toggle-help">${this.presupuestoHabilitado ? 'Las alertas y cálculos de presupuesto están activos' : 'Solo se mostrarán los gastos sin cálculos de presupuesto'}</span>
            //</div>
        //`;
        container.appendChild(estadoPresupuesto);

        if (this.presupuestos.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.innerHTML = `
                <h3>📊 No hay presupuestos configurados</h3>
                <p>Comienza creando tu primer presupuesto para llevar un mejor control de tus gastos.</p>
                <button class="btn-primary" onclick="budgetManager.mostrarModalPresupuesto()">
                    + Crear Primer Presupuesto
                </button>
            `;
            container.appendChild(emptyState);
            return;
        }

        // Ordenar presupuestos por fecha (más reciente primero)
        const presupuestosOrdenados = [...this.presupuestos].sort((a, b) => {
            const dateA = new Date(a.anio, a.mes - 1);
            const dateB = new Date(b.anio, b.mes - 1);
            return dateB - dateA;
        });

        presupuestosOrdenados.forEach(presupuesto => {
            const card = this.crearTarjetaPresupuesto(presupuesto);
            container.appendChild(card);
        });
    }

    crearTarjetaPresupuesto(presupuesto) {
        const card = document.createElement('div');
        card.className = 'budget-card';
        
        // Obtener gastos del mes (esto debería venir del dashboard)
        const gastosMes = this.obtenerGastosDelMes(presupuesto.mes, presupuesto.anio);
        const totalGastado = gastosMes.reduce((sum, gasto) => sum + (gasto.monto || 0), 0);
        
        let estado = 'normal';
        let estadoTexto = 'Dentro del presupuesto';
        let estadoColor = '#4CAF50';
        let porcentajeUso = 0;

        if (this.presupuestoHabilitado && presupuesto.monto > 0) {
            porcentajeUso = (totalGastado / presupuesto.monto) * 100;
            if (porcentajeUso >= 100) {
                estado = 'over-budget';
                estadoTexto = 'Presupuesto excedido';
                estadoColor = '#f44336';
            } else if (porcentajeUso >= 80) {
                estado = 'near-budget';
                estadoTexto = 'Cerca del límite';
                estadoColor = '#FF9800';
            }
        } else {
            estadoTexto = 'Presupuesto deshabilitado';
            estadoColor = '#666';
        }

        card.classList.add(estado);

        const alertasActivas = this.verificarAlertas(presupuesto, totalGastado);

        card.innerHTML = `
            <div class="budget-header">
                <h3>${this.obtenerNombreMes(presupuesto.mes)} ${presupuesto.anio}</h3>
                <span class="budget-status" style="color: ${estadoColor}">${estadoTexto}</span>
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
                    <span class="value" style="color: ${!this.presupuestoHabilitado ? '#666' : presupuesto.monto - totalGastado >= 0 ? '#4CAF50' : '#f44336'}">
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
            ${alertasActivas.length > 0 ? `
                <div class="budget-alerts">
                    <strong>Alertas activas:</strong>
                    <ul>
                        ${alertasActivas.map(alerta => `<li>${alerta}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            <div class="budget-actions">
                <button class="btn-outline" onclick="budgetManager.editarPresupuesto('${presupuesto.id}')">
                    ✏️ Editar
                </button>
                <button class="btn-danger" onclick="budgetManager.eliminarPresupuesto('${presupuesto.id}')">
                    🗑️ Eliminar
                </button>
            </div>
        `;
        return card;
    }

    obtenerGastosDelMes(mes, anio) {
        // Esto es temporal - en una implementación real debería obtener los gastos de Firebase
        // Por ahora retorna un array vacío
        return [];
    }

    verificarAlertas(presupuesto, totalGastado) {
        if (!this.presupuestoHabilitado) return [];
        
        const alertas = [];
        const porcentajeUso = presupuesto.monto > 0 ? (totalGastado / presupuesto.monto) * 100 : 0;
        
        if (presupuesto.alertas) {
            if (presupuesto.alertas.al80 && porcentajeUso >= 80) {
                alertas.push(`Has alcanzado el ${porcentajeUso.toFixed(1)}% del presupuesto`);
            }
            if (presupuesto.alertas.al100 && porcentajeUso >= 100) {
                alertas.push(`¡Has excedido el presupuesto en ${(porcentajeUso - 100).toFixed(1)}%!`);
            }
            if (presupuesto.alertas.al110 && porcentajeUso >= 110) {
                alertas.push(`ALERTA: Has superado el presupuesto en más del 10%`);
            }
        }
        return alertas;
    }

    obtenerNombreMes(mes) {
        const meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        return meses[mes - 1];
    }

    editarPresupuesto(id) {
        const presupuesto = this.presupuestos.find(p => p.id === id);
        if (presupuesto) {
            this.mostrarModalPresupuesto(presupuesto);
        }
    }

    async eliminarPresupuesto(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este presupuesto?')) {
            const userId = window.authManager.getUserId();
            if (!userId) {
                this.mostrarMensajeError('Usuario no autenticado');
                return;
            }

            try {
                // CORRECCIÓN: Actualizar el documento sin el presupuesto eliminado
                const docRef = firebaseDb.collection(userId).doc('presupuestos');
                const presupuestosActualizados = this.presupuestos.filter(p => p.id !== id);
                
                await docRef.set({ items: presupuestosActualizados }, { merge: true });

                this.presupuestos = presupuestosActualizados;
                this.renderPresupuestos();
                this.mostrarMensajeExito('Presupuesto eliminado correctamente');
                
                if (window.dashboard) {
                    window.dashboard.loadDashboardData();
                }
            } catch (error) {
                console.error('Error eliminando presupuesto:', error);
                this.mostrarMensajeError('Error al eliminar presupuesto');
            }
        }
    }

    mostrarMensajeExito(mensaje) {
        this.mostrarNotificacion(mensaje, 'success');
    }

    mostrarMensajeError(mensaje) {
        this.mostrarNotificacion(mensaje, 'error');
    }

    mostrarNotificacion(mensaje, tipo = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${tipo}`;
        notification.innerHTML = `
            <span>${tipo === 'success' ? '✅' : tipo === 'error' ? '❌' : 'ℹ️'} ${mensaje}</span>
        `;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${tipo === 'success' ? '#4CAF50' : tipo === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Método para verificar si el presupuesto está habilitado
    estaHabilitado() {
        return this.presupuestoHabilitado;
    }

    // Método para obtener resumen presupuestario
    obtenerResumenPresupuestario(mes, anio) {
        if (!this.presupuestoHabilitado) return null;
        
        const presupuesto = this.presupuestos.find(p => p.mes === mes && p.anio === anio);
        if (!presupuesto) return null;
        
        const gastosMes = this.obtenerGastosDelMes(mes, anio);
        const totalGastado = gastosMes.reduce((sum, gasto) => sum + gasto.monto, 0);
        const porcentajeUso = (totalGastado / presupuesto.monto) * 100;
        
        return {
            presupuesto: presupuesto.monto,
            gastado: totalGastado,
            disponible: presupuesto.monto - totalGastado,
            porcentajeUso: porcentajeUso,
            estado: porcentajeUso >= 100 ? 'excedido' : porcentajeUso >= 80 ? 'cerca' : 'normal'
        };
    }
}