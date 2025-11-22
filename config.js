// config.js - VERSIÓN COMPLETAMENTE CORREGIDA
class ConfigManager {
    constructor() {
        this.categorias = [];
        this.tarjetas = [];
        this.usuarios = [];
        this.init();
    }

    async init() {
        console.log('⚙️ Inicializando ConfigManager...');
        
        // Cargar datos
        await this.cargarCategorias();
        await this.cargarTarjetas();
        this.cargarUsuarios();
        
        // Configurar interfaz
        this.setupEventListeners();
        this.setupTabNavigation();
        
        // Renderizar
        this.renderCategorias();
        this.renderTarjetas();
        this.renderUsuarios();
        this.actualizarEstadisticas();
        
        console.log('✅ ConfigManager inicializado correctamente');
    }

    setupEventListeners() {
        console.log('🔧 Configurando event listeners...');
        
        // Usar arrow functions para mantener el contexto de 'this'
        const btnNuevaCategoria = document.getElementById('btn-nueva-categoria');
        if (btnNuevaCategoria) {
            btnNuevaCategoria.addEventListener('click', () => {
                this.mostrarModalCategoria();
            });
        }

        const categoriaForm = document.getElementById('categoria-form');
        if (categoriaForm) {
            categoriaForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.guardarCategoria();
            });
        }

        const btnNuevaTarjeta = document.getElementById('btn-nueva-tarjeta');
        if (btnNuevaTarjeta) {
            btnNuevaTarjeta.addEventListener('click', () => {
                this.mostrarModalTarjeta();
            });
        }

        const tarjetaForm = document.getElementById('tarjeta-form');
        if (tarjetaForm) {
            tarjetaForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.guardarTarjeta();
            });
        }

        const btnNuevoUsuario = document.getElementById('btn-nuevo-usuario');
        if (btnNuevoUsuario) {
            btnNuevoUsuario.addEventListener('click', () => {
                this.mostrarModalUsuario();
            });
        }

        const usuarioForm = document.getElementById('usuario-form');
        if (usuarioForm) {
            usuarioForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.guardarUsuario();
            });
        }

        // Cerrar modales
        document.querySelectorAll('.modal .close, .modal .cancel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }

    setupTabNavigation() {
        console.log('📑 Configurando navegación de tabs...');
        
        const tabButtons = document.querySelectorAll('.tab-button');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = button.getAttribute('data-tab');
                this.activateTab(tabId);
            });
        });
        
        // Activar primera pestaña por defecto
        this.activateTab('categorias');
    }

    activateTab(tabId) {
        console.log('🔍 Activando tab:', tabId);
        
        // Desactivar todos los tabs
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Activar tab seleccionado
        const activeButton = document.querySelector(`[data-tab="${tabId}"]`);
        const activeContent = document.getElementById(`tab-${tabId}`);
        
        if (activeButton && activeContent) {
            activeButton.classList.add('active');
            activeContent.classList.add('active');
        }
        
        this.actualizarEstadisticas();
    }

    // CATEGORÍAS
    async cargarCategorias() {
        const userId = window.authManager?.getUserId();
        if (!userId) {
            console.log('❌ No hay usuario autenticado');
            this.categorias = [];
            return;
        }

        try {
            console.log('📥 Cargando categorías para usuario:', userId);
            
            const docRef = firebaseDb.collection(userId).doc('categorias');
            const doc = await docRef.get();
            
            if (doc.exists) {
                const data = doc.data();
                this.categorias = data.items || [];
                console.log('✅ Categorías cargadas:', this.categorias);
            } else {
                this.categorias = [];
                console.log('📭 No existe documento de categorías');
            }
        } catch (error) {
            console.error('❌ Error cargando categorías:', error);
            this.categorias = [];
        }
    }

    renderCategorias() {
        console.log('🎨 Renderizando categorías...');
        const container = document.getElementById('lista-categorias');
        
        if (!container) {
            console.log('❌ No se encontró el contenedor lista-categorias');
            return;
        }

        console.log('📋 Categorías a renderizar:', this.categorias);

        // Filtrar categorías activas (o todas si no hay propiedad activa)
        const categoriasActivas = this.categorias.filter(cat => cat.activa !== false);
        
        container.innerHTML = '';

        if (categoriasActivas.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📁</div>
                    <h3>No hay categorías configuradas</h3>
                    <p>Crea tu primera categoría para organizar mejor tus gastos.</p>
                    <button class="btn-primary" id="btn-primera-categoria">
                        + Crear Primera Categoría
                    </button>
                </div>
            `;
            
            // Event listener para el botón de primera categoría
            document.getElementById('btn-primera-categoria')?.addEventListener('click', () => {
                this.mostrarModalCategoria();
            });
            
            return;
        }

        // Renderizar cada categoría
        categoriasActivas.forEach(categoria => {
            const card = this.crearTarjetaCategoria(categoria);
            container.appendChild(card);
        });

        // Agregar event listeners después de renderizar
        this.setupCategoriasEventListeners();
        
        console.log('✅ Categorías renderizadas correctamente');
    }

    crearTarjetaCategoria(categoria) {
        const card = document.createElement('div');
        card.className = 'config-card';
        
        // Usar valores por defecto si no existen
        const color = categoria.color || '#4361ee';
        const icono = categoria.icono || '📁';
        const incluirResumen = categoria.incluirResumen !== false; // true por defecto
        const mostrarGraficos = categoria.mostrarGraficos !== false; // true por defecto
        
        card.innerHTML = `
            <div class="config-card-header">
                <div class="config-icon" style="background: ${color}20; color: ${color}">
                    <span class="icon">${icono}</span>
                </div>
                <div class="config-info">
                    <h4>${categoria.nombre}</h4>
                    <div class="config-badges">
                        <span class="badge ${incluirResumen ? 'badge-success' : 'badge-secondary'}">
                            ${incluirResumen ? '📊 Resumen' : '📊 Sin resumen'}
                        </span>
                        <span class="badge ${mostrarGraficos ? 'badge-success' : 'badge-secondary'}">
                            ${mostrarGraficos ? '📈 Gráficos' : '📈 Sin gráficos'}
                        </span>
                    </div>
                </div>
            </div>
            <div class="config-actions">
                <button class="btn-icon editar-categoria" data-id="${categoria.id}" title="Editar">
                    ✏️
                </button>
                <button class="btn-icon btn-danger eliminar-categoria" data-id="${categoria.id}" title="Eliminar">
                    🗑️
                </button>
            </div>
        `;
        
        return card;
    }

    setupCategoriasEventListeners() {
        console.log('🔧 Configurando event listeners para categorías...');
        
        // Event listeners para botones de editar
        document.querySelectorAll('.editar-categoria').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const categoriaId = e.target.closest('.editar-categoria').getAttribute('data-id');
                console.log('✏️ Editando categoría:', categoriaId);
                this.editarCategoria(categoriaId);
            });
        });
        
        // Event listeners para botones de eliminar
        document.querySelectorAll('.eliminar-categoria').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const categoriaId = e.target.closest('.eliminar-categoria').getAttribute('data-id');
                console.log('🗑️ Eliminando categoría:', categoriaId);
                this.eliminarCategoria(categoriaId);
            });
        });
    }

    async guardarCategoria() {
        const userId = window.authManager?.getUserId();
        if (!userId) {
            this.mostrarMensajeError('Usuario no autenticado');
            return;
        }

        const nombre = document.getElementById('categoria-nombre').value.trim();
        if (!nombre) {
            this.mostrarMensajeError('El nombre de la categoría es obligatorio');
            return;
        }

        try {
            const nuevaCategoria = {
                id: Date.now().toString(),
                nombre,
                color: document.getElementById('categoria-color').value,
                icono: document.getElementById('categoria-icono').value || '📁',
                activa: document.getElementById('categoria-activa').checked,
                incluirResumen: document.getElementById('categoria-incluir-resumen').checked,
                mostrarGraficos: document.getElementById('categoria-mostrar-graficos').checked,
                fechaCreacion: new Date()
            };

            console.log('💾 Guardando categoría:', nuevaCategoria);

            // Actualizar Firebase
            const docRef = firebaseDb.collection(userId).doc('categorias');
            const doc = await docRef.get();
            
            let categoriasActuales = [];
            if (doc.exists) {
                categoriasActuales = doc.data().items || [];
            }

            const form = document.getElementById('categoria-form');
            const editingId = form?.dataset.editingId;
            
            if (editingId) {
                categoriasActuales = categoriasActuales.map(cat => 
                    cat.id === editingId ? { ...cat, ...nuevaCategoria } : cat
                );
            } else {
                categoriasActuales.push(nuevaCategoria);
            }

            await docRef.set({ items: categoriasActuales }, { merge: true });

            // Recargar y renderizar
            await this.cargarCategorias();
            this.renderCategorias();
            
            this.cerrarModalCategoria();
            this.mostrarMensajeExito(editingId ? 'Categoría actualizada' : 'Categoría creada');

            // CORRECCIÓN: Actualizar dashboard y otras partes de la aplicación
            this.actualizarAplicacionCompleta();
            
        } catch (error) {
            console.error('❌ Error guardando categoría:', error);
            this.mostrarMensajeError('Error al guardar categoría');
        }
    }

    // MÉTODO CORREGIDO PARA SINCRONIZAR CATEGORÍAS
    actualizarAplicacionCompleta() {
        console.log('🔄 Actualizando aplicación completa...');
    
        // 1. Actualizar dashboard si existe
        if (window.dashboard && typeof window.dashboard.loadDashboardData === 'function') {
            console.log('📊 Actualizando dashboard...');
            window.dashboard.loadDashboardData();
        }
    
        // 2. CORRECCIÓN: Sincronizar categorías con gastosApp
        if (window.gastosApp) {
            console.log('💰 Sincronizando categorías con gastosApp...');
            
            // Pasar las categorías actualizadas a gastosApp
            if (typeof window.gastosApp.actualizarCategorias === 'function') {
                window.gastosApp.actualizarCategorias(this.categorias);
            }
            
            // Forzar actualización de selects
            if (typeof window.gastosApp.actualizarSelectsCategorias === 'function') {
                window.gastosApp.actualizarSelectsCategorias();
            }
        }
    
        // 3. Actualizar estadísticas en config manager
        this.actualizarEstadisticas();
        
        console.log('✅ Aplicación actualizada completamente');
    }

    // NUEVO MÉTODO PARA OBTENER CATEGORÍAS ACTIVAS
    obtenerCategoriasActivas() {
        return this.categorias.filter(cat => cat.activa !== false);
    }

    mostrarModalCategoria(categoriaExistente = null) {
        const modal = document.getElementById('modal-categoria');
        const form = document.getElementById('categoria-form');
        const title = document.getElementById('modal-categoria-title');
        
        if (!modal) return;
        
        if (categoriaExistente) {
            title.textContent = 'Editar Categoría';
            this.llenarFormularioCategoria(categoriaExistente);
        } else {
            title.textContent = 'Nueva Categoría';
            if (form) form.reset();
            this.establecerValoresPorDefectoCategoria();
        }
        modal.style.display = 'block';
    }

    llenarFormularioCategoria(categoria) {
        document.getElementById('categoria-nombre').value = categoria.nombre || '';
        document.getElementById('categoria-color').value = categoria.color || '#4361ee';
        document.getElementById('categoria-icono').value = categoria.icono || '🍕';
        document.getElementById('categoria-activa').checked = categoria.activa !== false;
        document.getElementById('categoria-incluir-resumen').checked = categoria.incluirResumen !== false;
        document.getElementById('categoria-mostrar-graficos').checked = categoria.mostrarGraficos !== false;
        
        const form = document.getElementById('categoria-form');
        if (form) {
            form.dataset.editingId = categoria.id;
        }
    }

    establecerValoresPorDefectoCategoria() {
        const colores = ['#4361ee', '#3a0ca3', '#7209b7', '#f72585', '#4cc9f0', '#4895ef'];
        const colorAleatorio = colores[Math.floor(Math.random() * colores.length)];
        document.getElementById('categoria-color').value = colorAleatorio;
        
        const form = document.getElementById('categoria-form');
        if (form) {
            delete form.dataset.editingId;
        }
    }

    editarCategoria(id) {
        console.log('✏️ Editando categoría con ID:', id);
        const categoria = this.categorias.find(c => c.id === id);
        if (categoria) {
            console.log('📝 Categoría encontrada:', categoria);
            this.mostrarModalCategoria(categoria);
        } else {
            console.error('❌ Categoría no encontrada con ID:', id);
            this.mostrarMensajeError('Categoría no encontrada');
        }
    }

    async eliminarCategoria(id) {
        console.log('🗑️ Intentando eliminar categoría con ID:', id);
        const categoria = this.categorias.find(c => c.id === id);
        if (!categoria) {
            console.error('❌ Categoría no encontrada con ID:', id);
            return;
        }
        
        if (!confirm(`¿Estás seguro de que quieres eliminar la categoría "${categoria.nombre}"?`)) {
            return;
        }

        try {
            const userId = window.authManager?.getUserId();
            if (!userId) {
                this.mostrarMensajeError('Usuario no autenticado');
                return;
            }

            const docRef = firebaseDb.collection(userId).doc('categorias');
            const categoriasActualizadas = this.categorias.filter(c => c.id !== id);
            
            await docRef.set({ items: categoriasActualizadas }, { merge: true });

            this.categorias = categoriasActualizadas;
            this.renderCategorias();
            this.mostrarMensajeExito('Categoría eliminada correctamente');
            
            // Actualizar aplicación completa después de eliminar
            this.actualizarAplicacionCompleta();
        } catch (error) {
            console.error('Error eliminando categoría:', error);
            this.mostrarMensajeError('Error al eliminar categoría');
        }
    }

    // TARJETAS
    async cargarTarjetas() {
        const userId = window.authManager?.getUserId();
        if (!userId) {
            console.log('❌ No hay usuario autenticado para cargar tarjetas');
            this.tarjetas = [];
            return;
        }

        try {
            console.log('📥 Cargando tarjetas para usuario:', userId);
            
            const docRef = firebaseDb.collection(userId).doc('tarjetas');
            const doc = await docRef.get();
            
            if (doc.exists) {
                const data = doc.data();
                this.tarjetas = data.items || [];
                console.log('✅ Tarjetas cargadas:', this.tarjetas.length);
            } else {
                this.tarjetas = [];
                console.log('📭 No existe documento de tarjetas');
            }
        } catch (error) {
            console.error('❌ Error cargando tarjetas:', error);
            this.tarjetas = [];
        }
    }

    renderTarjetas() {
        const container = document.getElementById('lista-tarjetas');
        if (!container) return;
        
        const tarjetasActivas = this.tarjetas.filter(t => t.activa !== false);
        container.innerHTML = '';
        
        if (tarjetasActivas.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">💳</div>
                    <h3>No hay tarjetas configuradas</h3>
                    <p>Agrega tus tarjetas de crédito y débito para mejor control.</p>
                    <button class="btn-primary" id="btn-primera-tarjeta">
                        + Agregar Primera Tarjeta
                    </button>
                </div>
            `;
            
            document.getElementById('btn-primera-tarjeta')?.addEventListener('click', () => {
                this.mostrarModalTarjeta();
            });
            
            return;
        }
        
        tarjetasActivas.forEach(tarjeta => {
            const card = this.crearTarjetaTarjeta(tarjeta);
            container.appendChild(card);
        });
    }

    crearTarjetaTarjeta(tarjeta) {
        const tipoIcono = tarjeta.tipo === 'credito' ? '💳' : '🏦';
        const tipoColor = tarjeta.tipo === 'credito' ? '#2196F3' : '#4CAF50';
        const tipoTexto = tarjeta.tipo === 'credito' ? 'Crédito' : 'Débito';
        const card = document.createElement('div');
        card.className = 'config-card';
        card.innerHTML = `
            <div class="config-card-header">
                <div class="config-icon" style="background: ${tipoColor}20; color: ${tipoColor}">
                    <span class="icon">${tipoIcono}</span>
                </div>
                <div class="config-info">
                    <h4>${tarjeta.nombre}</h4>
                    <div class="config-badges">
                        <span class="badge" style="background: ${tipoColor}20; color: ${tipoColor}">
                            ${tipoTexto}
                        </span>
                        <span class="badge ${tarjeta.activa ? 'badge-success' : 'badge-secondary'}">
                            ${tarjeta.activa ? '✅ Activa' : '❌ Inactiva'}
                        </span>
                    </div>
                </div>
            </div>
            <div class="config-actions">
                <button class="btn-icon editar-tarjeta" data-id="${tarjeta.id}" title="Editar">
                    ✏️
                </button>
                <button class="btn-icon btn-danger eliminar-tarjeta" data-id="${tarjeta.id}" title="Eliminar">
                    🗑️
                </button>
            </div>
        `;
        return card;
    }

    async guardarTarjeta() {
        const userId = window.authManager?.getUserId();
        if (!userId) {
            this.mostrarMensajeError('Usuario no autenticado');
            return;
        }

        const nombre = document.getElementById('tarjeta-nombre').value.trim();
        if (!nombre) {
            this.mostrarMensajeError('El nombre de la tarjeta es obligatorio');
            return;
        }

        try {
            const nuevaTarjeta = {
                id: Date.now().toString(),
                nombre,
                tipo: document.getElementById('tarjeta-tipo').value,
                activa: document.getElementById('tarjeta-activa').checked,
                fechaCreacion: new Date()
            };

            const docRef = firebaseDb.collection(userId).doc('tarjetas');
            const doc = await docRef.get();
            
            let tarjetasActuales = [];
            if (doc.exists) {
                tarjetasActuales = doc.data().items || [];
            }

            const form = document.getElementById('tarjeta-form');
            const editingId = form?.dataset.editingId;
            
            if (editingId) {
                tarjetasActuales = tarjetasActuales.map(tarj => 
                    tarj.id === editingId ? { ...tarj, ...nuevaTarjeta } : tarj
                );
            } else {
                tarjetasActuales.push(nuevaTarjeta);
            }

            await docRef.set({ items: tarjetasActuales }, { merge: true });

            await this.cargarTarjetas();
            this.renderTarjetas();
            this.cerrarModalTarjeta();
            this.mostrarMensajeExito(editingId ? 'Tarjeta actualizada' : 'Tarjeta creada');
            
        } catch (error) {
            console.error('❌ Error guardando tarjeta:', error);
            this.mostrarMensajeError('Error al guardar tarjeta');
        }
    }

    mostrarModalTarjeta(tarjetaExistente = null) {
        const modal = document.getElementById('modal-tarjeta');
        const form = document.getElementById('tarjeta-form');
        const title = document.getElementById('modal-tarjeta-title');
        
        if (!modal) return;
        
        if (tarjetaExistente) {
            title.textContent = 'Editar Tarjeta';
            this.llenarFormularioTarjeta(tarjetaExistente);
        } else {
            title.textContent = 'Nueva Tarjeta';
            if (form) form.reset();
        }
        modal.style.display = 'block';
    }

    llenarFormularioTarjeta(tarjeta) {
        document.getElementById('tarjeta-nombre').value = tarjeta.nombre || '';
        document.getElementById('tarjeta-tipo').value = tarjeta.tipo || 'credito';
        document.getElementById('tarjeta-activa').checked = tarjeta.activa !== false;
        
        const form = document.getElementById('tarjeta-form');
        if (form) {
            form.dataset.editingId = tarjeta.id;
        }
    }

    // USUARIOS
    cargarUsuarios() {
        const usuariosGuardados = localStorage.getItem('usuarios');
        if (usuariosGuardados) {
            this.usuarios = JSON.parse(usuariosGuardados);
        } else {
            this.usuarios = [
                { id: 1, nombre: 'default', activo: true, fechaCreacion: new Date().toISOString() }
            ];
            this.guardarUsuarios();
        }
    }

    guardarUsuarios() {
        localStorage.setItem('usuarios', JSON.stringify(this.usuarios));
    }

    renderUsuarios() {
        const container = document.getElementById('lista-usuarios');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.usuarios.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👥</div>
                    <h3>No hay usuarios configurados</h3>
                    <p>Agrega usuarios para separar la gestión de gastos.</p>
                    <button class="btn-primary" id="btn-primer-usuario">
                        + Agregar Usuario
                    </button>
                </div>
            `;
            
            document.getElementById('btn-primer-usuario')?.addEventListener('click', () => {
                this.mostrarModalUsuario();
            });
            
            return;
        }
        
        this.usuarios.forEach(usuario => {
            const card = this.crearTarjetaUsuario(usuario);
            container.appendChild(card);
        });
    }

    crearTarjetaUsuario(usuario) {
        const esUsuarioActual = usuario.nombre === (window.gastosApp ? window.gastosApp.usuarioActual : 'default');
        const card = document.createElement('div');
        card.className = 'config-card';
        card.innerHTML = `
            <div class="config-card-header">
                <div class="config-icon" style="background: ${usuario.activo ? '#4CAF5020' : '#F4433620'}; color: ${usuario.activo ? '#4CAF50' : '#F44336'}">
                    <span class="icon">👤</span>
                </div>
                <div class="config-info">
                    <h4>${usuario.nombre} ${esUsuarioActual ? '<span class="usuario-actual">(Actual)</span>' : ''}</h4>
                    <div class="config-badges">
                        <span class="badge ${usuario.activo ? 'badge-success' : 'badge-secondary'}">
                            ${usuario.activo ? '✅ Activo' : '❌ Inactivo'}
                        </span>
                        ${esUsuarioActual ? '<span class="badge badge-primary">🎯 En uso</span>' : ''}
                    </div>
                </div>
            </div>
            <div class="config-actions">
                ${!esUsuarioActual ? `
                    <button class="btn-icon cambiar-usuario" data-nombre="${usuario.nombre}" title="Usar este usuario">
                        🎯
                    </button>
                ` : ''}
                <button class="btn-icon editar-usuario" data-id="${usuario.id}" title="Editar">
                    ✏️
                </button>
                ${usuario.nombre !== 'default' ? `
                    <button class="btn-icon btn-danger eliminar-usuario" data-id="${usuario.id}" title="Eliminar">
                        🗑️
                    </button>
                ` : ''}
            </div>
        `;
        return card;
    }

    mostrarModalUsuario(usuarioExistente = null) {
        const modal = document.getElementById('modal-usuario');
        const form = document.getElementById('usuario-form');
        const title = document.getElementById('modal-usuario-title');
        
        if (!modal) return;
        
        if (usuarioExistente) {
            title.textContent = 'Editar Usuario';
            this.llenarFormularioUsuario(usuarioExistente);
        } else {
            title.textContent = 'Nuevo Usuario';
            if (form) form.reset();
        }
        modal.style.display = 'block';
    }

    llenarFormularioUsuario(usuario) {
        document.getElementById('usuario-nombre').value = usuario.nombre || '';
        document.getElementById('usuario-activo').checked = usuario.activo !== false;
        
        const form = document.getElementById('usuario-form');
        if (form) {
            form.dataset.editingId = usuario.id;
        }
    }

    guardarUsuario() {
        const form = document.getElementById('usuario-form');
        if (!form) return;
        
        const nombre = document.getElementById('usuario-nombre').value.trim();
        const activo = document.getElementById('usuario-activo').checked;
        
        if (!nombre) {
            this.mostrarMensajeError('El nombre del usuario es obligatorio');
            return;
        }
        
        if (nombre === 'default') {
            this.mostrarMensajeError('No se puede usar "default" como nombre de usuario');
            return;
        }

        const usuario = {
            id: Date.now(),
            nombre: nombre,
            activo: activo,
            fechaCreacion: new Date().toISOString()
        };

        const existingId = form.dataset.editingId;
        
        if (existingId) {
            const existingIndex = this.usuarios.findIndex(u => u.id === parseInt(existingId));
            if (existingIndex !== -1) {
                usuario.id = this.usuarios[existingIndex].id;
                usuario.fechaCreacion = this.usuarios[existingIndex].fechaCreacion;
                this.usuarios[existingIndex] = usuario;
            }
        } else {
            if (this.usuarios.some(u => u.nombre.toLowerCase() === nombre.toLowerCase())) {
                this.mostrarMensajeError('Ya existe un usuario con ese nombre');
                return;
            }
            this.usuarios.push(usuario);
        }

        this.guardarUsuarios();
        this.renderUsuarios();
        this.cerrarModalUsuario();
        this.mostrarMensajeExito('Usuario guardado correctamente');
    }

    // MÉTODOS DE MENSAJES
    mostrarMensajeExito(mensaje) {
        this.mostrarToast(mensaje, 'success');
    }

    mostrarMensajeError(mensaje) {
        this.mostrarToast(mensaje, 'error');
    }

    mostrarToast(mensaje, tipo = 'info') {
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

    cerrarModalCategoria() {
        this.cerrarModal('modal-categoria');
    }

    cerrarModalTarjeta() {
        this.cerrarModal('modal-tarjeta');
    }

    cerrarModalUsuario() {
        this.cerrarModal('modal-usuario');
    }

    cerrarModal(modalId) {
        const modal = document.getElementById(modalId);
        const form = document.getElementById(modalId.replace('modal-', '') + '-form');
        
        if (modal) modal.style.display = 'none';
        if (form) {
            form.reset();
            delete form.dataset.editingId;
        }
    }

    actualizarEstadisticas() {
        const statsContainer = document.getElementById('config-stats');
        if (!statsContainer) return;
        
        const stats = {
            categorias: this.categorias.filter(c => c.activa !== false).length,
            tarjetas: this.tarjetas.filter(t => t.activa !== false).length,
            usuarios: this.usuarios.length
        };
        
        statsContainer.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">📁</div>
                    <div class="stat-info">
                        <span class="stat-number">${stats.categorias}</span>
                        <span class="stat-label">Categorías Activas</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">💳</div>
                    <div class="stat-info">
                        <span class="stat-number">${stats.tarjetas}</span>
                        <span class="stat-label">Tarjetas Activas</span>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">👥</div>
                    <div class="stat-info">
                        <span class="stat-number">${stats.usuarios}</span>
                        <span class="stat-label">Usuarios</span>
                    </div>
                </div>
            </div>
        `;
    }
}

// Hacer disponible globalmente
window.ConfigManager = ConfigManager;