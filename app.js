// app.js - VERSIÓN COMPLETAMENTE CORREGIDA
class GastosApp {
    constructor() {
        this.gastos = [];
        this.categorias = [];
        this.tarjetas = [];
        this.gastosFiltrados = [];
    }

    async init() {
        console.log('GastosApp inicializada');
        await this.cargarDatos();
        this.setupEventListeners();
        this.mostrarSeccion('dashboard');
    }

    setupEventListeners() {
        console.log('🔧 Configurando event listeners...');
        
        // Navegación
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.getAttribute('data-section');
                this.mostrarSeccion(section);
            });
        });

        // Modal de gastos
        const btnNuevoGasto = document.getElementById('btn-nuevo-gasto');
        if (btnNuevoGasto) {
            btnNuevoGasto.addEventListener('click', () => {
                this.mostrarModalGasto();
            });
        }

        const gastoForm = document.getElementById('gasto-form');
        if (gastoForm) {
            gastoForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.guardarGasto();
            });
        }

        // Botón Nueva Tarea
        const btnNuevaTarea = document.getElementById('btn-nueva-tarea');
        if (btnNuevaTarea) {
            btnNuevaTarea.addEventListener('click', () => {
                this.mostrarModalTarea();
            });
        }

        // Formulario de Tarea
        const tareaForm = document.getElementById('tarea-form');
        if (tareaForm) {
            tareaForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.guardarTarea();
            });
        }

        // Cerrar modales
        document.querySelectorAll('.close, .cancel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });

        // Filtros de gastos
        const btnAplicarFiltros = document.getElementById('btn-aplicar-filtros');
        if (btnAplicarFiltros) {
            btnAplicarFiltros.addEventListener('click', () => {
                this.aplicarFiltros();
            });
        }

        const btnLimpiarFiltros = document.getElementById('btn-limpiar-filtros');
        if (btnLimpiarFiltros) {
            btnLimpiarFiltros.addEventListener('click', () => {
                this.limpiarFiltros();
            });
        }

        // Clic fuera del modal para cerrar
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });

        console.log('✅ Event listeners configurados');
    }

    mostrarSeccion(seccionId) {
        console.log('📁 Mostrando sección:', seccionId);
        
        // Ocultar todas las secciones
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'none';
        });
        
        // Remover active de todos los links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Mostrar sección seleccionada
        const seccion = document.getElementById(seccionId);
        if (seccion) {
            seccion.style.display = 'block';
        }
        
        // Activar link correspondiente
        const link = document.querySelector(`[data-section="${seccionId}"]`);
        if (link) {
            link.classList.add('active');
        }
        
        // Actualizar módulos específicos
        this.actualizarModulo(seccionId);
    }

    actualizarModulo(seccionId) {
        console.log('🔄 Actualizando módulo:', seccionId);
        switch (seccionId) {
            case 'dashboard':
                if (window.dashboard && typeof window.dashboard.loadDashboardData === 'function') {
                    window.dashboard.loadDashboardData();
                } else {
                    console.log('⚠️ Dashboard no está disponible o no tiene loadDashboardData');
                    if (typeof Dashboard !== 'undefined' && document.getElementById('dashboard')) {
                        console.log('🔄 Inicializando Dashboard...');
                        window.dashboard = new Dashboard();
                        if (typeof window.dashboard.loadDashboardData === 'function') {
                            window.dashboard.loadDashboardData();
                        }
                    }
                }
                break;
            case 'gastos':
                this.actualizarInterfazGastos();
                break;
            case 'configuracion':
                if (window.configManager && typeof window.configManager.renderCategorias === 'function') {
                    window.configManager.renderCategorias();
                    window.configManager.renderTarjetas();
                }
                break;
            case 'tareas':
                if (window.tasksManager && typeof window.tasksManager.renderTareas === 'function') {
                    window.tasksManager.renderTareas();
                }
                break;
            case 'presupuestos':
                if (window.budgetManager && typeof window.budgetManager.renderPresupuestos === 'function') {
                    window.budgetManager.renderPresupuestos();
                }
                break;
        }
    }

    // MÉTODOS CORREGIDOS PARA SINCRONIZAR CATEGORÍAS
    actualizarCategorias(nuevasCategorias) {
        console.log('🔄 Actualizando categorías en gastosApp:', nuevasCategorias);
        this.categorias = nuevasCategorias;
        this.actualizarSelectsCategorias();
    }

    actualizarSelectsCategorias() {
        console.log('🎯 Actualizando selects de categorías...');
    
        // Actualizar select en modal de gastos
        const selectModal = document.getElementById('categoria');
        if (selectModal) {
            this.poblarSelectCategorias(selectModal);
        }
    
        // Actualizar select en filtros
        const selectFiltro = document.getElementById('filter-category');
        if (selectFiltro) {
            this.poblarSelectFiltroCategorias(selectFiltro);
        }
    }

    poblarSelectCategorias(selectElement) {
        if (!selectElement) return;
        
        // Guardar valor seleccionado actual
        const valorActual = selectElement.value;
        
        // Limpiar opciones existentes
        selectElement.innerHTML = '<option value="">Selecciona una categoría</option>';
        
        // Agregar categorías
        if (this.categorias && this.categorias.length > 0) {
            this.categorias.forEach(cat => {
                if (cat.activa !== false) {
                    const option = document.createElement('option');
                    option.value = cat.nombre;
                    option.textContent = `${cat.icono || '📦'} ${cat.nombre}`;
                    selectElement.appendChild(option);
                }
            });
            
            // Restaurar valor seleccionado si existe
            if (valorActual && selectElement.querySelector(`option[value="${valorActual}"]`)) {
                selectElement.value = valorActual;
            }
        } else {
            console.log('⚠️ No hay categorías para mostrar en el select');
        }
        
        console.log(`✅ Select de categorías actualizado: ${selectElement.options.length} opciones`);
    }

    poblarSelectFiltroCategorias(selectElement) {
        if (!selectElement) return;
        
        // Guardar valor seleccionado actual
        const valorActual = selectElement.value;
        
        // Limpiar opciones existentes (mantener solo "Todas")
        if (selectElement.options.length > 0) {
            while (selectElement.options.length > 1) {
                selectElement.remove(1);
            }
        } else {
            selectElement.innerHTML = '<option value="todas">Todas las categorías</option>';
        }
        
        // Agregar categorías
        if (this.categorias && this.categorias.length > 0) {
            this.categorias.forEach(cat => {
                if (cat.activa !== false) {
                    const option = document.createElement('option');
                    option.value = cat.nombre;
                    option.textContent = `${cat.icono || '📦'} ${cat.nombre}`;
                    selectElement.appendChild(option);
                }
            });
            
            // Restaurar valor seleccionado si existe
            if (valorActual && selectElement.querySelector(`option[value="${valorActual}"]`)) {
                selectElement.value = valorActual;
            }
        }
        
        console.log(`✅ Select de filtro categorías actualizado: ${selectElement.options.length} opciones`);
    }

    async cargarDatos() {
        const userId = window.authManager?.getUserId();
        if (!userId) {
            console.log('❌ No hay usuario autenticado');
            this.gastos = [];
            this.categorias = [];
            this.tarjetas = [];
            return;
        }

        try {
            console.log('📥 Cargando datos para usuario:', userId);
            
            // Cargar gastos
            await this.cargarGastos(userId);
            
            // Cargar categorías
            await this.cargarCategorias(userId);
            
            // Cargar tarjetas
            await this.cargarTarjetas(userId);
            
            console.log('✅ Datos cargados:', {
                gastos: this.gastos.length,
                categorias: this.categorias.length,
                tarjetas: this.tarjetas.length
            });
        } catch (error) {
            console.error('❌ Error cargando datos:', error);
            this.gastos = [];
            this.categorias = [];
            this.tarjetas = [];
        }
    }

    async cargarGastos(userId) {
        try {
            const docRef = firebaseDb.collection(userId).doc('gastos');
            const doc = await docRef.get();
            
            if (doc.exists) {
                const data = doc.data();
                this.gastos = data.items || [];
                console.log('Gastos cargados:', this.gastos.length);
            } else {
                this.gastos = [];
                console.log('No existe documento de gastos');
            }
        } catch (error) {
            console.error('Error cargando gastos:', error);
            this.gastos = [];
        }
    }

    async cargarCategorias(userId) {
        if (!userId) {
            console.log('❌ userId vacío en cargarCategorias');
            this.categorias = [];
            return;
        }

        try {
            console.log('📥 Cargando categorías en app.js para:', userId);
        
            const docRef = firebaseDb.collection(userId).doc('categorias');
            const doc = await docRef.get();
        
            if (doc.exists) {
                const data = doc.data();
                this.categorias = data.items || [];
                console.log('✅ Categorías cargadas en app.js:', this.categorias.length);
            
                // Actualizar selects automáticamente
                this.actualizarSelectsCategorias();
            } else {
                this.categorias = [];
                console.log('📭 No existe documento de categorías en app.js');
            }
        } catch (error) {
            console.error('❌ Error cargando categorías en app.js:', error);
            this.categorias = [];
        }
    }

    async cargarTarjetas(userId) {
        try {
            const docRef = firebaseDb.collection(userId).doc('tarjetas');
            const doc = await docRef.get();
            
            if (doc.exists) {
                const data = doc.data();
                this.tarjetas = data.items || [];
                console.log('Tarjetas cargadas:', this.tarjetas.length);
            } else {
                this.tarjetas = [];
                console.log('No existe documento de tarjetas');
            }
        } catch (error) {
            console.error('Error cargando tarjetas:', error);
            this.tarjetas = [];
        }
    }

    actualizarInterfazGastos() {
        console.log('🎨 Actualizando interfaz de gastos...');
        this.mostrarGastos();
        this.actualizarResumenGastos();
        this.poblarFiltros();
    }

    mostrarGastos() {
        console.log('📋 Mostrando gastos...');
        
        if (!this.gastosFiltrados) {
            this.gastosFiltrados = this.gastos || [];
        }

        const tbody = document.getElementById('gastos-body');
        const countElement = document.getElementById('gastos-count');
        
        if (!tbody) {
            console.log('❌ No se encontró el elemento gastos-body');
            return;
        }

        // Limpiar tabla
        tbody.innerHTML = '';

        if (!this.gastosFiltrados || !Array.isArray(this.gastosFiltrados) || this.gastosFiltrados.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: #666; padding: 2rem;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">💰</div>
                        <p>No hay gastos registrados</p>
                        <small>Comienza agregando tu primer gasto</small>
                    </td>
                </tr>
            `;
            
            if (countElement) {
                countElement.textContent = '0';
            }
            return;
        }

        // Actualizar contador
        if (countElement) {
            countElement.textContent = this.gastosFiltrados.length.toString();
        }

        // Ordenar por fecha (más reciente primero)
        const gastosOrdenados = [...this.gastosFiltrados].sort((a, b) => {
            const fechaA = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha);
            const fechaB = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha);
            return fechaB - fechaA;
        });

        // Renderizar gastos
        gastosOrdenados.forEach(gasto => {
            const tr = document.createElement('tr');
            const fechaGasto = gasto.fecha?.toDate ? gasto.fecha.toDate() : new Date(gasto.fecha);
            const fechaFormateada = fechaGasto.toLocaleDateString('es-ES');
            
            tr.innerHTML = `
                <td>${fechaFormateada}</td>
                <td>${gasto.descripcion || 'Sin descripción'}</td>
                <td>
                    <span class="gasto-categoria">
                        ${this.obtenerIconoCategoria(gasto.categoria)} ${gasto.categoria || 'Sin categoría'}
                    </span>
                </td>
                <td>
                    <span class="gasto-metodo metodo-${gasto.metodoPago}">
                        ${this.obtenerNombreMetodoPago(gasto.metodoPago)}
                    </span>
                </td>
                <td>${gasto.tarjeta ? `
                    <span class="gasto-tarjeta">
                        ${gasto.metodoPago === 'credito' ? '💳' : '🏦'} ${gasto.tarjeta}
                    </span>
                ` : '-'}</td>
                <td class="monto">$${(gasto.monto || 0).toFixed(2)}</td>
                <td class="acciones">
                    <button class="btn-icon" onclick="gastosApp.editarGasto('${gasto.id}')" title="Editar">
                        ✏️
                    </button>
                    <button class="btn-icon btn-danger" onclick="gastosApp.eliminarGasto('${gasto.id}')" title="Eliminar">
                        🗑️
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        console.log(`✅ Mostrados ${gastosOrdenados.length} gastos`);
    }

    obtenerIconoCategoria(nombreCategoria) {
        if (!nombreCategoria) return '📦';
        const categoria = this.categorias.find(cat => cat.nombre === nombreCategoria);
        return categoria?.icono || '📦';
    }

    obtenerNombreMetodoPago(metodo) {
        const nombres = {
            'efectivo': '💵 Efectivo',
            'debito': '🏦 Débito',
            'credito': '💳 Crédito'
        };
        return nombres[metodo] || metodo || '💳 Método no especificado';
    }

    actualizarResumenGastos() {
        const total = this.gastos.reduce((sum, gasto) => sum + (gasto.monto || 0), 0);
        const totalElement = document.getElementById('total-gastado');
        if (totalElement) {
            totalElement.textContent = `$${total.toFixed(2)}`;
        }
    }

    aplicarFiltros() {
        console.log('🔍 Aplicando filtros...');
        
        const mes = document.getElementById('filter-month')?.value || 'all';
        const anio = document.getElementById('filter-year')?.value || 'all';
        const categoria = document.getElementById('filter-category')?.value || 'all';
        const metodoPago = document.getElementById('filter-payment')?.value || 'all';

        this.gastosFiltrados = (this.gastos || []).filter(gasto => {
            const fechaGasto = gasto.fecha?.toDate ? gasto.fecha.toDate() : new Date(gasto.fecha);
            
            const cumpleMes = mes === 'all' || (fechaGasto.getMonth() + 1) === parseInt(mes);
            const cumpleAnio = anio === 'all' || fechaGasto.getFullYear() === parseInt(anio);
            const cumpleCategoria = categoria === 'all' || gasto.categoria === categoria;
            const cumpleMetodo = metodoPago === 'all' || gasto.metodoPago === metodoPago;

            return cumpleMes && cumpleAnio && cumpleCategoria && cumpleMetodo;
        });

        this.mostrarGastos();
    }

    limpiarFiltros() {
        console.log('🧹 Limpiando filtros...');
        
        const monthSelect = document.getElementById('filter-month');
        const yearSelect = document.getElementById('filter-year');
        const categorySelect = document.getElementById('filter-category');
        const paymentSelect = document.getElementById('filter-payment');

        if (monthSelect) monthSelect.value = 'all';
        if (yearSelect) yearSelect.value = 'all';
        if (categorySelect) categorySelect.value = 'all';
        if (paymentSelect) paymentSelect.value = 'all';

        // Mostrar todos los gastos
        this.gastosFiltrados = this.gastos || [];
        this.mostrarGastos();
    }

    poblarFiltros() {
        this.poblarFiltroMeses();
        this.poblarFiltroAnios();
        this.poblarFiltroCategorias();
        this.poblarFiltroMetodosPago();
    }

    poblarFiltroMeses() {
        const select = document.getElementById('filter-month');
        if (!select) return;
        
        select.innerHTML = '<option value="all">Todos los meses</option>';
        const meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        
        meses.forEach((mes, index) => {
            const option = document.createElement('option');
            option.value = index + 1;
            option.textContent = mes;
            select.appendChild(option);
        });
    }

    poblarFiltroAnios() {
        const select = document.getElementById('filter-year');
        if (!select) return;
        
        select.innerHTML = '<option value="all">Todos los años</option>';
        const currentYear = new Date().getFullYear();
        
        for (let year = currentYear - 2; year <= currentYear + 1; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            select.appendChild(option);
        }
    }

    poblarFiltroCategorias() {
        const select = document.getElementById('filter-category');
        if (!select) return;
        
        select.innerHTML = '<option value="all">Todas las categorías</option>';
        
        // Obtener categorías únicas de los gastos
        const categoriasUnicas = [...new Set(this.gastos.map(g => g.categoria).filter(Boolean))];
        
        categoriasUnicas.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria;
            option.textContent = categoria;
            select.appendChild(option);
        });
    }

    poblarFiltroMetodosPago() {
        const select = document.getElementById('filter-payment');
        if (!select) return;
        
        select.innerHTML = `
            <option value="all">Todos los métodos</option>
            <option value="efectivo">💵 Efectivo</option>
            <option value="debito">🏦 Débito</option>
            <option value="credito">💳 Crédito</option>
        `;
    }

    // MODAL Y GESTIÓN DE GASTOS
    mostrarModalGasto(gastoExistente = null) {
        console.log('📝 Abriendo modal de gasto...');
        const modal = document.getElementById('modal-gasto');
        const form = document.getElementById('gasto-form');
        const title = document.getElementById('modal-gasto-title');
        
        if (!modal) {
            console.log('❌ Modal de gasto no encontrado');
            return;
        }

        if (gastoExistente) {
            title.textContent = 'Editar Gasto';
            this.llenarFormularioGasto(gastoExistente);
        } else {
            title.textContent = 'Nuevo Gasto';
            if (form) form.reset();
            this.establecerValoresPorDefectoGasto();
        }

        // Poblar selects
        this.poblarSelectCategorias();
        this.poblarSelectTarjetas();
        
        modal.style.display = 'block';
    }

    poblarSelectTarjetas() {
        const select = document.getElementById('tarjeta-gasto');
        if (!select) return;
        
        select.innerHTML = '<option value="">Seleccionar tarjeta (opcional)</option>';
        
        this.tarjetas.forEach(tarjeta => {
            const option = document.createElement('option');
            option.value = tarjeta.nombre;
            const icono = tarjeta.tipo === 'credito' ? '💳' : '🏦';
            option.textContent = `${icono} ${tarjeta.nombre}`;
            select.appendChild(option);
        });
    }

    llenarFormularioGasto(gasto) {
        document.getElementById('descripcion').value = gasto.descripcion || '';
        document.getElementById('monto').value = gasto.monto || '';
        
        if (gasto.fecha) {
            const fecha = gasto.fecha.toDate ? gasto.fecha.toDate() : new Date(gasto.fecha);
            document.getElementById('fecha').value = fecha.toISOString().split('T')[0];
        }
        
        document.getElementById('categoria').value = gasto.categoria || '';
        document.getElementById('metodo-pago').value = gasto.metodoPago || 'efectivo';
        document.getElementById('tarjeta-gasto').value = gasto.tarjeta || '';
        
        const form = document.getElementById('gasto-form');
        if (form) {
            form.dataset.editingId = gasto.id;
        }
    }

    establecerValoresPorDefectoGasto() {
        document.getElementById('fecha').value = new Date().toISOString().split('T')[0];
        document.getElementById('metodo-pago').value = 'efectivo';
        
        const form = document.getElementById('gasto-form');
        if (form) {
            delete form.dataset.editingId;
        }
    }

    async guardarGasto() {
        const userId = window.authManager?.getUserId();
        if (!userId) {
            this.mostrarMensaje('Usuario no autenticado', 'error');
            return;
        }

        // Obtener valores del formulario
        const descripcion = document.getElementById('descripcion').value.trim();
        const montoInput = document.getElementById('monto').value;
        const fecha = document.getElementById('fecha').value;
        const categoria = document.getElementById('categoria').value;
        const metodoPago = document.getElementById('metodo-pago').value;
        const tarjeta = document.getElementById('tarjeta-gasto').value;

        // Validaciones
        if (!descripcion) {
            this.mostrarMensaje('La descripción es obligatoria', 'error');
            return;
        }

        const monto = parseFloat(montoInput);
        if (isNaN(monto) || monto <= 0) {
            this.mostrarMensaje('El monto debe ser un número mayor a 0', 'error');
            return;
        }

        if (!fecha) {
            this.mostrarMensaje('La fecha es obligatoria', 'error');
            return;
        }

        if (!categoria) {
            this.mostrarMensaje('La categoría es obligatoria', 'error');
            return;
        }

        const nuevoGasto = {
            id: Date.now().toString(),
            descripcion,
            monto,
            fecha: new Date(fecha),
            categoria,
            metodoPago,
            tarjeta: tarjeta || null,
            createdAt: new Date()
        };

        try {
            const docRef = firebaseDb.collection(userId).doc('gastos');
            const doc = await docRef.get();
            
            let gastosActuales = [];
            if (doc.exists) {
                gastosActuales = doc.data().items || [];
            }

            const form = document.getElementById('gasto-form');
            const editingId = form.dataset.editingId;
            
            if (editingId) {
                gastosActuales = gastosActuales.map(gasto => 
                    gasto.id === editingId ? { ...gasto, ...nuevoGasto } : gasto
                );
            } else {
                gastosActuales.push(nuevoGasto);
            }

            await docRef.set({ items: gastosActuales }, { merge: true });

            this.cerrarModalGasto();
            this.mostrarMensaje(editingId ? 'Gasto actualizado' : 'Gasto creado', 'success');
            
            await this.cargarGastos(userId);
            this.actualizarInterfazGastos();
            
            // Actualizar dashboard si existe
            if (window.dashboard) {
                window.dashboard.loadDashboardData();
            }
            
        } catch (error) {
            console.error('Error guardando gasto:', error);
            this.mostrarMensaje('Error al guardar gasto', 'error');
        }
    }

    cerrarModalGasto() {
        const modal = document.getElementById('modal-gasto');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    editarGasto(id) {
        const gasto = this.gastos.find(g => g.id === id);
        if (gasto) {
            this.mostrarModalGasto(gasto);
        }
    }

    async eliminarGasto(id) {
        if (!confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
            return;
        }

        const userId = window.authManager?.getUserId();
        if (!userId) {
            this.mostrarMensaje('Usuario no autenticado', 'error');
            return;
        }

        try {
            const docRef = firebaseDb.collection(userId).doc('gastos');
            const gastosActualizados = this.gastos.filter(g => g.id !== id);
            
            await docRef.set({ items: gastosActualizados }, { merge: true });

            this.gastos = gastosActualizados;
            this.actualizarInterfazGastos();
            this.mostrarMensaje('Gasto eliminado correctamente', 'success');
            
            // Actualizar dashboard si existe
            if (window.dashboard) {
                window.dashboard.loadDashboardData();
            }
            
        } catch (error) {
            console.error('Error eliminando gasto:', error);
            this.mostrarMensaje('Error al eliminar gasto', 'error');
        }
    }

    // MÉTODOS PARA NOTIFICACIONES
    mostrarMensaje(mensaje, tipo = 'info') {
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
        }, 4000);
    }
}

// Inicializar la aplicación
window.gastosApp = new GastosApp();