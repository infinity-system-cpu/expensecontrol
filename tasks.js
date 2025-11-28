// tasks.js - ACTUALIZADO CON NUEVO DISEÑO
class TasksManager {
    constructor() {
        this.tareas = [];
        this.filtroEstado = 'todas';
        this.init();
    }
    
    async init() {
        await this.cargarTareas();
        this.setupEventListeners();
        this.renderTareas();
    }
    
    setupEventListeners() {
        const btnNueva = document.getElementById('btn-nueva-tarea');
        if (btnNueva) btnNueva.addEventListener('click', () => this.mostrarModalTarea());
        
        const form = document.getElementById('tarea-form');
        if (form) form.addEventListener('submit', (e) => { e.preventDefault(); this.guardarTarea(); });
        
        document.querySelectorAll('#modal-tarea .close, .cancel').forEach(btn => {
            btn.addEventListener('click', () => this.cerrarModalTarea());
        });
        
        const filtro = document.getElementById('filtro-estado');
        if (filtro) {
            filtro.addEventListener('change', (e) => {
                this.filtroEstado = e.target.value;
                this.renderTareas();
            });
        }
        
        const limpiar = document.getElementById('btn-limpiar-filtros-tareas');
        if (limpiar) limpiar.addEventListener('click', () => {
            this.filtroEstado = 'todas';
            if (filtro) filtro.value = 'todas';
            this.renderTareas();
        });
    }

    async cargarTareas() {
        const userId = window.authManager?.getUserId();
        if (!userId) return;
        try {
            const doc = await firebaseDb.collection(userId).doc('tareas').get();
            this.tareas = doc.exists ? doc.data().items || [] : [];
        } catch (error) {
            console.error('Error cargando tareas:', error);
            this.tareas = [];
        }
    }
    async guardarTarea() {
        const userId = window.authManager?.getUserId();
        if (!userId) return this.mostrarMensajeError('Usuario no autenticado');
        const desc = document.getElementById('tarea-descripcion').value.trim();
        const estado = document.getElementById('tarea-estado').value;
        if (!estadosPermitidos.includes(estado)) {
            this.mostrarMensajeError('Estado de tarea no válido');
            return;
        }
        const fechaInicio = document.getElementById('tarea-fecha-inicio').value;
        if (!desc || !fechaInicio) return this.mostrarMensajeError('Descripción y fecha de inicio obligatorios');
        const fechaFin = document.getElementById('tarea-fecha-fin').value;
        const costo = parseFloat(document.getElementById('tarea-costo').value) || null;
        const notas = document.getElementById('tarea-notas').value.trim();
        if (costo !== null && (isNaN(costo) || costo < 0)) return this.mostrarMensajeError('Costo inválido');
        const nuevaTarea = {
            id: Date.now().toString(),
            descripcion: desc,
            estado,
            fechaInicio: new Date(fechaInicio),
            fechaFin: fechaFin ? new Date(fechaFin) : null,
            costo,
            notas,
            createdAt: new Date()
        };
        try {
            const docRef = firebaseDb.collection(userId).doc('tareas');
            const doc = await docRef.get();
            let items = doc.exists ? doc.data().items || [] : [];
            const form = document.getElementById('tarea-form');
            const editingId = form.dataset.editingId;
            if (editingId) {
                items = items.map(t => t.id === editingId ? { ...t, ...nuevaTarea } : t);
            } else {
                items.push(nuevaTarea);
            }
            await docRef.set({ items }, { merge: true });
            this.cerrarModalTarea();
            this.mostrarMensajeExito(editingId ? 'Tarea actualizada' : 'Tarea creada');
            await this.cargarTareas();
            this.renderTareas();
        } catch (error) {
            console.error('Error guardando tarea:', error);
            this.mostrarMensajeError('Error al guardar tarea');
        }
    }
    mostrarModalTarea(tarea = null) {
        const modal = document.getElementById('modal-tarea');
        const form = document.getElementById('tarea-form');
        const title = document.getElementById('modal-tarea-title');
        if (!modal) return;
        if (tarea) {
            title.textContent = 'Editar Tarea';
            this.llenarFormularioTarea(tarea);
        } else {
            title.textContent = 'Nueva Tarea';
            if (form) form.reset();
            this.establecerValoresPorDefecto();
        }
        modal.style.display = 'block';
    }
    llenarFormularioTarea(t) {
        document.getElementById('tarea-descripcion').value = t.descripcion || '';
        document.getElementById('tarea-estado').value = t.estado || 'pendiente';
        document.getElementById('tarea-costo').value = t.costo || '';
        document.getElementById('tarea-notas').value = t.notas || '';
        const setFecha = (id, val) => {
            if (val) {
                const f = val.toDate ? val.toDate() : new Date(val);
                document.getElementById(id).value = f.toISOString().split('T')[0];
            }
        };
        setFecha('tarea-fecha-inicio', t.fechaInicio);
        setFecha('tarea-fecha-fin', t.fechaFin);
        const form = document.getElementById('tarea-form');
        if (form) form.dataset.editingId = t.id;
    }
    establecerValoresPorDefecto() {
        document.getElementById('tarea-fecha-inicio').value = new Date().toISOString().split('T')[0];
        document.getElementById('tarea-estado').value = 'pendiente';
        const form = document.getElementById('tarea-form');
        if (form) delete form.dataset.editingId;
    }
    cerrarModalTarea() {
        const modal = document.getElementById('modal-tarea');
        if (modal) modal.style.display = 'none';
    }
    renderTareas() {
        const container = document.getElementById('tareas-container');
        if (!container) return;
        
        let filtradas = this.tareas;
        if (this.filtroEstado !== 'todas') {
            filtradas = filtradas.filter(t => t.estado === this.filtroEstado);
        }
        
        container.innerHTML = '';
        
        if (filtradas.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <h3>No hay tareas</h3>
                    <p>${this.filtroEstado === 'todas' ? 'Crea tu primera tarea para comenzar.' : 'No hay tareas con ese estado.'}</p>
                    ${this.filtroEstado === 'todas' ? `<button class="btn btn-primary" onclick="tasksManager.mostrarModalTarea()">+ Nueva Tarea</button>` : ''}
                </div>
            `;
            return;
        }
        
        const ordenadas = [...filtradas].sort((a, b) => {
            const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return bDate - aDate;
        });
        
        ordenadas.forEach(t => container.appendChild(this.crearTarjetaTarea(t)));
    }

    crearTarjetaTarea(tarea) {
        const card = document.createElement('div');
        card.className = 'task-card';
        
        const estados = {
            pendiente: { texto: '⏳ Pendiente', color: '#FF9800' },
            'en-progreso': { texto: '🚧 En progreso', color: '#2196F3' },
            completada: { texto: '✅ Completada', color: '#4CAF50' },
            cancelada: { texto: '❌ Cancelada', color: '#f44336' }
        };
        
        const estado = estados[tarea.estado] || { texto: tarea.estado, color: '#666' };
        const hoy = new Date();
        const fechaFin = tarea.fechaFin ? (tarea.fechaFin.toDate ? tarea.fechaFin.toDate() : new Date(tarea.fechaFin)) : null;
        const vencida = fechaFin && fechaFin < hoy && !['completada', 'cancelada'].includes(tarea.estado);
        
        const formatear = (f) => {
            if (!f) return '';
            const d = f.toDate ? f.toDate() : new Date(f);
            return d.toLocaleDateString('es-ES');
        };

        card.innerHTML = `
            <div class="task-header">
                <h4 class="task-title">${tarea.descripcion}</h4>
                <span class="task-status" style="background: ${estado.color}20; color: ${estado.color}; border: 1px solid ${estado.color}40">
                    ${estado.texto}
                </span>
            </div>
            
            <div class="task-details">
                <div class="task-detail">
                    <span class="label">Fecha Inicio:</span>
                    <span class="value">${formatear(tarea.fechaInicio)}</span>
                </div>
                
                ${fechaFin ? `
                <div class="task-detail">
                    <span class="label">${vencida ? '⚠️ Fecha Fin:' : 'Fecha Fin:'}</span>
                    <span class="value" style="color: ${vencida ? '#f44336' : 'var(--text)'}">
                        ${formatear(fechaFin)}
                    </span>
                </div>
                ` : ''}
                
                ${tarea.costo !== null ? `
                <div class="task-detail">
                    <span class="label">Costo Estimado:</span>
                    <span class="value">$${tarea.costo.toFixed(2)}</span>
                </div>
                ` : ''}
            </div>
            
            ${tarea.notas ? `
            <div class="task-notes">
                <span class="label">Notas:</span>
                <p>${tarea.notas}</p>
            </div>
            ` : ''}
            
            <div class="task-actions">
                <button class="btn btn-outline" onclick="tasksManager.editarTarea('${tarea.id}')">
                    <span class="btn-icon">✏️</span> Editar
                </button>
                <button class="btn btn-danger" onclick="tasksManager.eliminarTarea('${tarea.id}')">
                    <span class="btn-icon">🗑️</span> Eliminar
                </button>
                ${tarea.estado !== 'completada' ? `
                <button class="btn btn-success" onclick="tasksManager.marcarCompletada('${tarea.id}')">
                    <span class="btn-icon">✅</span> Completar
                </button>
                ` : ''}
            </div>
        `;
        
        return card;
    }
    editarTarea(id) { const t = this.tareas.find(x => x.id === id); if (t) this.mostrarModalTarea(t); }
    async eliminarTarea(id) {
        if (!confirm('¿Eliminar tarea?')) return;
        const userId = window.authManager?.getUserId();
        if (!userId) return this.mostrarMensajeError('Usuario no autenticado');
        try {
            const items = this.tareas.filter(t => t.id !== id);
            await firebaseDb.collection(userId).doc('tareas').set({ items }, { merge: true });
            this.tareas = items;
            this.renderTareas();
            this.mostrarMensajeExito('Tarea eliminada');
        } catch (error) {
            console.error('Error eliminando tarea:', error);
            this.mostrarMensajeError('Error al eliminar');
        }
    }
    async marcarCompletada(id) {
        const userId = window.authManager?.getUserId();
        if (!userId) return this.mostrarMensajeError('Usuario no autenticado');
        try {
            const items = this.tareas.map(t => t.id === id ? { ...t, estado: 'completada', updatedAt: new Date() } : t);
            await firebaseDb.collection(userId).doc('tareas').set({ items }, { merge: true });
            this.tareas = items;
            this.renderTareas();
            this.mostrarMensajeExito('Tarea completada');
        } catch (error) {
            console.error('Error marcando completada:', error);
            this.mostrarMensajeError('Error al completar');
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
    obtenerTareasPendientes() {
        return this.tareas.filter(t => t.estado === 'pendiente');
    }
}
window.TasksManager = TasksManager;