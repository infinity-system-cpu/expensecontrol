// tasks.js - GESTIÓN DE TAREAS CORREGIDA
class TasksManager {
    constructor() {
        this.tareas = [];
        this.init();
    }

    async init() {
        await this.cargarTareas();
        this.setupEventListeners();
        this.renderTareas();
    }

    setupEventListeners() {
        // Modal de tareas
        const btnNueva = document.getElementById('btn-nueva-tarea');
        if (btnNueva) {
            btnNueva.addEventListener('click', () => {
                this.mostrarModalTarea();
            });
        }
        // Formulario de tarea
        const form = document.getElementById('tarea-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.guardarTarea();
            });
        }
        // Cerrar modal
        document.querySelectorAll('#modal-tarea .close, #modal-tarea .cancel').forEach(btn => {
            btn.addEventListener('click', () => {
                this.cerrarModalTarea();
            });
        });
        // Filtros
        const filtroEstado = document.getElementById('filtro-estado');
        if (filtroEstado) {
            filtroEstado.addEventListener('change', (e) => {
                this.filtroEstado = e.target.value;
                this.renderTareas();
            });
        }
        // Botón limpiar filtros
        const btnLimpiarFiltros = document.getElementById('btn-limpiar-filtros-tareas');
        if (btnLimpiarFiltros) {
            btnLimpiarFiltros.addEventListener('click', () => {
                this.limpiarFiltros();
            });
        }
    }

    async cargarTareas() {
        const userId = window.authManager.getUserId();
        if (!userId) {
            console.log('No hay usuario autenticado');
            return;
        }

        try {
            // CORRECCIÓN: Usar firebaseDb.collection(userId).doc('tareas')
            const docRef = firebaseDb.collection(userId).doc('tareas');
            const doc = await docRef.get();
            
            if (doc.exists) {
                const data = doc.data();
                this.tareas = data.items || [];
                console.log('Tareas cargadas:', this.tareas);
            } else {
                this.tareas = [];
                console.log('No existe documento de tareas');
            }
        } catch (error) {
            console.error('Error cargando tareas:', error);
            this.tareas = [];
        }
    }

    async guardarTarea() {
        const userId = window.authManager.getUserId();
        if (!userId) {
            this.mostrarMensajeError('Usuario no autenticado');
            return;
        }

        // Obtener valores
        const descripcion = document.getElementById('tarea-descripcion').value.trim();
        const estado = document.getElementById('tarea-estado').value;
        const fechaInicio = document.getElementById('tarea-fecha-inicio').value;
        const fechaFin = document.getElementById('tarea-fecha-fin').value;
        const costoInput = document.getElementById('tarea-costo').value;
        const notas = document.getElementById('tarea-notas').value.trim();
        
        // Validaciones
        if (!descripcion) {
            this.mostrarMensajeError('La descripción es obligatoria');
            return;
        }
        if (!fechaInicio) {
            this.mostrarMensajeError('La fecha de inicio es obligatoria');
            return;
        }
        
        let costo = null;
        if (costoInput) {
            costo = parseFloat(costoInput);
            if (isNaN(costo) || costo < 0) {
                this.mostrarMensajeError('El costo debe ser un número mayor o igual a 0');
                return;
            }
        }

        const nuevaTarea = {
            id: Date.now().toString(),
            descripcion: descripcion,
            estado: estado,
            fechaInicio: new Date(fechaInicio),
            fechaFin: fechaFin ? new Date(fechaFin) : null,
            costo: costo,
            notas: notas,
            createdAt: new Date()
        };

        try {
            // CORRECCIÓN: Actualizar el documento tareas
            const docRef = firebaseDb.collection(userId).doc('tareas');
            const doc = await docRef.get();
            
            let tareasActuales = [];
            if (doc.exists) {
                tareasActuales = doc.data().items || [];
            }

            const form = document.getElementById('tarea-form');
            const editingId = form.dataset.editingId;
            
            if (editingId) {
                // Editar tarea existente
                tareasActuales = tareasActuales.map(tarea => 
                    tarea.id === editingId ? { ...tarea, ...nuevaTarea } : tarea
                );
            } else {
                // Agregar nueva tarea
                tareasActuales.push(nuevaTarea);
            }

            await docRef.set({ items: tareasActuales }, { merge: true });

            this.cerrarModalTarea();
            this.mostrarMensajeExito(editingId ? 'Tarea actualizada' : 'Tarea creada');
            
            await this.cargarTareas();
            this.renderTareas();
            
        } catch (error) {
            console.error('Error guardando tarea:', error);
            this.mostrarMensajeError('Error al guardar tarea');
        }
    }

    mostrarModalTarea(tareaExistente = null) {
        const modal = document.getElementById('modal-tarea');
        const form = document.getElementById('tarea-form');
        const title = document.getElementById('modal-tarea-title');
        
        if (!modal) return;
        
        if (tareaExistente) {
            title.textContent = 'Editar Tarea';
            this.llenarFormularioTarea(tareaExistente);
        } else {
            title.textContent = 'Nueva Tarea';
            if (form) form.reset();
            this.establecerValoresPorDefectoTarea();
        }
        modal.style.display = 'block';
    }

    llenarFormularioTarea(tarea) {
        document.getElementById('tarea-descripcion').value = tarea.descripcion || '';
        document.getElementById('tarea-estado').value = tarea.estado || 'pendiente';
        document.getElementById('tarea-costo').value = tarea.costo || '';
        document.getElementById('tarea-notas').value = tarea.notas || '';
        
        if (tarea.fechaInicio) {
            const fechaInicio = tarea.fechaInicio.toDate ? tarea.fechaInicio.toDate() : new Date(tarea.fechaInicio);
            document.getElementById('tarea-fecha-inicio').value = fechaInicio.toISOString().split('T')[0];
        }
        
        if (tarea.fechaFin) {
            const fechaFin = tarea.fechaFin.toDate ? tarea.fechaFin.toDate() : new Date(tarea.fechaFin);
            document.getElementById('tarea-fecha-fin').value = fechaFin.toISOString().split('T')[0];
        }
        
        const form = document.getElementById('tarea-form');
        if (form) {
            form.dataset.editingId = tarea.id;
        }
    }

    establecerValoresPorDefectoTarea() {
        const fechaInicio = document.getElementById('tarea-fecha-inicio');
        if (fechaInicio) {
            fechaInicio.value = new Date().toISOString().split('T')[0];
        }
        
        const estado = document.getElementById('tarea-estado');
        if (estado) {
            estado.value = 'pendiente';
        }
        
        const form = document.getElementById('tarea-form');
        if (form) {
            delete form.dataset.editingId;
        }
    }

    cerrarModalTarea() {
        const modal = document.getElementById('modal-tarea');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    renderTareas() {
        const container = document.getElementById('tareas-container');
        if (!container) return;
        
        let tareasFiltradas = this.tareas;
        
        // Aplicar filtro de estado
        if (this.filtroEstado && this.filtroEstado !== 'todas') {
            tareasFiltradas = tareasFiltradas.filter(tarea => tarea.estado === this.filtroEstado);
        }
        
        container.innerHTML = '';
        
        if (tareasFiltradas.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>📝 No hay tareas</h3>
                    <p>${(!this.filtroEstado || this.filtroEstado === 'todas') ? 'Comienza creando tu primera tarea.' : 'No hay tareas con el estado seleccionado.'}</p>
                    ${(!this.filtroEstado || this.filtroEstado === 'todas') ? `
                        <button class="btn-primary" onclick="tasksManager.mostrarModalTarea()">
                            + Crear Primera Tarea
                        </button>
                    ` : ''}
                </div>
            `;
            return;
        }
        
        // Ordenar tareas por fecha de creación (más reciente primero)
        const tareasOrdenadas = [...tareasFiltradas].sort((a, b) => {
            const fechaA = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const fechaB = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return fechaB - fechaA;
        });
        
        tareasOrdenadas.forEach(tarea => {
            const card = this.crearTarjetaTarea(tarea);
            container.appendChild(card);
        });
    }

    crearTarjetaTarea(tarea) {
        const card = document.createElement('div');
        card.className = 'task-card';
        
        // Determinar clase CSS según estado
        let estadoClase = '';
        let estadoTexto = '';
        let estadoColor = '';
        
        switch (tarea.estado) {
            case 'pendiente':
                estadoClase = 'estado-pendiente';
                estadoTexto = '⏳ Pendiente';
                estadoColor = '#FF9800';
                break;
            case 'en-progreso':
                estadoClase = 'estado-en-progreso';
                estadoTexto = '🚧 En progreso';
                estadoColor = '#2196F3';
                break;
            case 'completada':
                estadoClase = 'estado-completada';
                estadoTexto = '✅ Completada';
                estadoColor = '#4CAF50';
                break;
            case 'cancelada':
                estadoClase = 'estado-cancelada';
                estadoTexto = '❌ Cancelada';
                estadoColor = '#f44336';
                break;
        }
        
        card.classList.add(estadoClase);
        
        // Verificar si está vencida
        const hoy = new Date();
        const fechaFin = tarea.fechaFin ? (tarea.fechaFin.toDate ? tarea.fechaFin.toDate() : new Date(tarea.fechaFin)) : null;
        const estaVencida = fechaFin && fechaFin < hoy && tarea.estado !== 'completada' && tarea.estado !== 'cancelada';
        
        card.innerHTML = `
            <div class="task-header">
                <h4>${tarea.descripcion}</h4>
                <span class="task-status" style="color: ${estadoColor}">${estadoTexto}</span>
            </div>
            <div class="task-dates">
                <div class="date-item">
                    <span class="label">Inicio:</span>
                    <span class="value">${this.formatearFecha(tarea.fechaInicio)}</span>
                </div>
                ${tarea.fechaFin ? `
                    <div class="date-item ${estaVencida ? 'vencida' : ''}">
                        <span class="label">${estaVencida ? '⚠️ Vencida:' : 'Fin:'}</span>
                        <span class="value">${this.formatearFecha(tarea.fechaFin)}</span>
                    </div>
                ` : ''}
            </div>
            ${tarea.costo !== null ? `
                <div class="task-costo">
                    <span class="label">Costo estimado:</span>
                    <span class="value">$${tarea.costo.toFixed(2)}</span>
                </div>
            ` : ''}
            ${tarea.notas ? `
                <div class="task-notas">
                    <p>${tarea.notas}</p>
                </div>
            ` : ''}
            <div class="task-actions">
                <button class="btn-outline" onclick="tasksManager.editarTarea('${tarea.id}')">
                    ✏️ Editar
                </button>
                <button class="btn-danger" onclick="tasksManager.eliminarTarea('${tarea.id}')">
                    🗑️ Eliminar
                </button>
                ${tarea.estado !== 'completada' ? `
                    <button class="btn-success" onclick="tasksManager.marcarCompletada('${tarea.id}')">
                        ✅ Completar
                    </button>
                ` : ''}
            </div>
        `;
        return card;
    }

    editarTarea(id) {
        const tarea = this.tareas.find(t => t.id === id);
        if (tarea) {
            this.mostrarModalTarea(tarea);
        }
    }

    async eliminarTarea(id) {
        if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
            const userId = window.authManager.getUserId();
            if (!userId) {
                this.mostrarMensajeError('Usuario no autenticado');
                return;
            }

            try {
                // CORRECCIÓN: Actualizar el documento sin la tarea eliminada
                const docRef = firebaseDb.collection(userId).doc('tareas');
                const tareasActualizadas = this.tareas.filter(t => t.id !== id);
                
                await docRef.set({ items: tareasActualizadas }, { merge: true });

                this.tareas = tareasActualizadas;
                this.renderTareas();
                this.mostrarMensajeExito('Tarea eliminada correctamente');
            } catch (error) {
                console.error('Error eliminando tarea:', error);
                this.mostrarMensajeError('Error al eliminar tarea');
            }
        }
    }

    async marcarCompletada(id) {
        const userId = window.authManager.getUserId();
        if (!userId) {
            this.mostrarMensajeError('Usuario no autenticado');
            return;
        }

        try {
            // CORRECCIÓN: Actualizar el estado de la tarea en el documento
            const docRef = firebaseDb.collection(userId).doc('tareas');
            const tareasActualizadas = this.tareas.map(tarea => {
                if (tarea.id === id) {
                    return { 
                        ...tarea, 
                        estado: 'completada',
                        updatedAt: new Date()
                    };
                }
                return tarea;
            });
            
            await docRef.set({ items: tareasActualizadas }, { merge: true });

            this.tareas = tareasActualizadas;
            this.renderTareas();
            this.mostrarMensajeExito('Tarea marcada como completada');
        } catch (error) {
            console.error('Error marcando tarea como completada:', error);
            this.mostrarMensajeError('Error al marcar tarea como completada');
        }
    }

    limpiarFiltros() {
        this.filtroEstado = 'todas';
        const filtroSelect = document.getElementById('filtro-estado');
        if (filtroSelect) {
            filtroSelect.value = 'todas';
        }
        this.renderTareas();
    }

    formatearFecha(fechaObj) {
        if (!fechaObj) return '';
        const fecha = fechaObj.toDate ? fechaObj.toDate() : new Date(fechaObj);
        return fecha.toLocaleDateString('es-ES');
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
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }

    // Métodos para estadísticas
    obtenerEstadisticasTareas() {
        const total = this.tareas.length;
        const completadas = this.tareas.filter(t => t.estado === 'completada').length;
        const pendientes = this.tareas.filter(t => t.estado === 'pendiente').length;
        const enProgreso = this.tareas.filter(t => t.estado === 'en-progreso').length;
        const canceladas = this.tareas.filter(t => t.estado === 'cancelada').length;
        const tareasConCosto = this.tareas.filter(t => t.costo !== null);
        const costoTotal = tareasConCosto.reduce((sum, t) => sum + t.costo, 0);
        
        return {
            total,
            completadas,
            pendientes,
            enProgreso,
            canceladas,
            tareasConCosto: tareasConCosto.length,
            costoTotal
        };
    }
}