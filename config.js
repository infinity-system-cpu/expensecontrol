// config.js - VERSIÓN CORREGIDA CON EVENT LISTENERS PARA TARJETAS
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
        await this.cargarUsuarios();
        
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
        
        // Botón nueva categoría
        const btnNuevaCategoria = document.getElementById('btn-nueva-categoria');
        if (btnNuevaCategoria) {
            btnNuevaCategoria.addEventListener('click', () => {
                this.mostrarModalCategoria();
            });
        }

        // Formulario categoría
        const categoriaForm = document.getElementById('categoria-form');
        if (categoriaForm) {
            categoriaForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.guardarCategoria();
            });
        }

        // Botón nueva tarjeta
        const btnNuevaTarjeta = document.getElementById('btn-nueva-tarjeta');
        if (btnNuevaTarjeta) {
            btnNuevaTarjeta.addEventListener('click', () => {
                this.mostrarModalTarjeta();
            });
        }

        // Formulario tarjeta
        const tarjetaForm = document.getElementById('tarjeta-form');
        if (tarjetaForm) {
            tarjetaForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.guardarTarjeta();
            });
        }

        // Botón nuevo usuario
        const btnNuevoUsuario = document.getElementById('btn-nuevo-usuario');
        if (btnNuevoUsuario) {
            btnNuevoUsuario.addEventListener('click', () => {
                this.mostrarModalUsuario();
            });
        }

        // Formulario usuario
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

    // CATEGORÍAS (se mantienen igual)
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
                    <button class="btn btn-primary" id="btn-primera-categoria">
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
        const incluirResumen = categoria.incluirResumen !== false;
        const mostrarGraficos = categoria.mostrarGraficos !== false;
        
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
        document.body.classList.add('modal-open');
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

    // TARJETAS - CORREGIDO CON EVENT LISTENERS
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
                console.log('✅ Tarjetas cargadas:', this.tarjetas);
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
        console.log('🎨 Renderizando tarjetas...');
        const container = document.getElementById('lista-tarjetas');
        if (!container) {
            console.log('❌ No se encontró el contenedor lista-tarjetas');
            return;
        }
        
        const tarjetasActivas = this.tarjetas.filter(t => t.activa !== false);
        container.innerHTML = '';
        
        if (tarjetasActivas.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">💳</div>
                    <h3>No hay tarjetas configuradas</h3>
                    <p>Agrega tus tarjetas de crédito y débito para mejor control.</p>
                    <button class="btn btn-primary" id="btn-primera-tarjeta">
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

        // 🔥 CORRECCIÓN: Agregar event listeners para tarjetas
        this.setupTarjetasEventListeners();
        
        console.log('✅ Tarjetas renderizadas correctamente');
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

    // 🔥 NUEVO MÉTODO: Configurar event listeners para tarjetas
    setupTarjetasEventListeners() {
        console.log('🔧 Configurando event listeners para tarjetas...');
        
        // Event listeners para botones de editar tarjetas
        document.querySelectorAll('.editar-tarjeta').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tarjetaId = e.target.closest('.editar-tarjeta').getAttribute('data-id');
                console.log('✏️ Editando tarjeta:', tarjetaId);
                this.editarTarjeta(tarjetaId);
            });
        });
        
        // Event listeners para botones de eliminar tarjetas
        document.querySelectorAll('.eliminar-tarjeta').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tarjetaId = e.target.closest('.eliminar-tarjeta').getAttribute('data-id');
                console.log('🗑️ Eliminando tarjeta:', tarjetaId);
                this.eliminarTarjeta(tarjetaId);
            });
        });
    }

    // 🔥 NUEVO MÉTODO: Editar tarjeta
    editarTarjeta(id) {
        console.log('✏️ Editando tarjeta con ID:', id);
        const tarjeta = this.tarjetas.find(t => t.id === id);
        if (tarjeta) {
            console.log('📝 Tarjeta encontrada:', tarjeta);
            this.mostrarModalTarjeta(tarjeta);
        } else {
            console.error('❌ Tarjeta no encontrada con ID:', id);
            this.mostrarMensajeError('Tarjeta no encontrada');
        }
    }

    // 🔥 NUEVO MÉTODO: Eliminar tarjeta
    async eliminarTarjeta(id) {
        console.log('🗑️ Intentando eliminar tarjeta con ID:', id);
        const tarjeta = this.tarjetas.find(t => t.id === id);
        if (!tarjeta) {
            console.error('❌ Tarjeta no encontrada con ID:', id);
            return;
        }
        
        if (!confirm(`¿Estás seguro de que quieres eliminar la tarjeta "${tarjeta.nombre}"?`)) {
            return;
        }

        try {
            const userId = window.authManager?.getUserId();
            if (!userId) {
                this.mostrarMensajeError('Usuario no autenticado');
                return;
            }

            const docRef = firebaseDb.collection(userId).doc('tarjetas');
            const tarjetasActualizadas = this.tarjetas.filter(t => t.id !== id);
            
            await docRef.set({ items: tarjetasActualizadas }, { merge: true });

            this.tarjetas = tarjetasActualizadas;
            this.renderTarjetas();
            this.mostrarMensajeExito('Tarjeta eliminada correctamente');
            
        } catch (error) {
            console.error('Error eliminando tarjeta:', error);
            this.mostrarMensajeError('Error al eliminar tarjeta');
        }
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

            console.log('💾 Guardando tarjeta:', nuevaTarjeta);

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

    // 🔥 USUARIOS - COMPLETAMENTE ACTUALIZADO
    async cargarUsuarios() {
    console.log('📥 Cargando usuarios desde Firebase...');
    
    try {
        // Reiniciar arrays
        this.usuarios = [];
        this.personas = [];
        
        const users = ['user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7', 'user8', 'user9', 'user10'];
        
        for (const userId of users) {
            try {
                const docRef = firebaseDb.collection(userId).doc('usuario');
                const doc = await docRef.get();
                
                if (doc.exists) {
                    const userData = doc.data();
                    const userInfo = {
                        id: userId,
                        usuario: userData.usuario || userId,
                        nombre: userData.nombre || 'Usuario ' + userId,
                        tipo: userData.tipo || 'usuario', // 🔥 Asegurar valor por defecto
                        password: userData.password || '',
                        activo: userData.activo !== false,
                        fechaCreacion: userData.fechaCreacion || new Date()
                    };
                    
                    console.log(`📋 ${userId}: ${userInfo.nombre} (tipo: ${userInfo.tipo})`);
                    
                    // 🔥 CORRECCIÓN: Clasificar correctamente según el tipo
                    if (userInfo.tipo === 'persona') {
                        this.personas.push(userInfo);
                        console.log(`✅ Agregado a personas: ${userInfo.nombre}`);
                    } else {
                        this.usuarios.push(userInfo);
                        console.log(`✅ Agregado a usuarios: ${userInfo.nombre}`);
                    }
                }
            } catch (error) {
                console.log(`⚠️ No se pudo cargar usuario ${userId}:`, error.message);
            }
        }
        
        console.log('✅ Usuarios cargados:', this.usuarios.length);
        console.log('✅ Personas cargadas:', this.personas.length);
        console.log('📋 Lista completa de usuarios:', this.usuarios.map(u => `${u.nombre} (${u.tipo})`));
        console.log('📋 Lista completa de personas:', this.personas.map(p => `${p.nombre} (${p.tipo})`));
        
    } catch (error) {
        console.error('❌ Error cargando usuarios:', error);
        this.usuarios = [];
        this.personas = [];
    }
}

    renderUsuarios() {
    console.log('🎨 Renderizando usuarios...');
    const container = document.getElementById('lista-usuarios');
    if (!container) {
        console.log('❌ No se encontró el contenedor lista-usuarios');
        return;
    }
    
    container.innerHTML = '';
    
    // 🔥 CORRECCIÓN: Combinar usuarios y personas para mostrar
    const todosLosUsuarios = [...this.usuarios, ...this.personas];
    
    if (todosLosUsuarios.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👥</div>
                <h3>No hay usuarios configurados</h3>
                <p>No se encontraron usuarios en la base de datos.</p>
                <button class="btn btn-primary" id="btn-primer-usuario">
                    + Agregar Usuario
                </button>
            </div>
        `;
        
        document.getElementById('btn-primer-usuario')?.addEventListener('click', () => {
            this.mostrarModalUsuario();
        });
        
        return;
    }
    
    // 🔥 CORRECCIÓN: Ordenar por nombre
    todosLosUsuarios.sort((a, b) => a.nombre.localeCompare(b.nombre));
    
    todosLosUsuarios.forEach(usuario => {
        const card = this.crearTarjetaUsuario(usuario);
        container.appendChild(card);
    });

    // Configurar event listeners para usuarios
    this.setupUsuariosEventListeners();
    
    console.log('✅ Usuarios renderizados correctamente:', todosLosUsuarios.length);
}

    crearTarjetaUsuario(usuario) {
    const currentUserId = window.authManager?.getUserId();
    const esUsuarioActual = usuario.id === currentUserId;
    const esPersona = usuario.tipo === 'persona';
    
    const card = document.createElement('div');
    card.className = 'config-card';
    card.innerHTML = `
        <div class="config-card-header">
            <div class="config-icon" style="background: ${usuario.activo ? '#4CAF5020' : '#F4433620'}; color: ${usuario.activo ? '#4CAF50' : '#F44336'}">
                <span class="icon">${esPersona ? '👤' : '👥'}</span>
            </div>
            <div class="config-info">
                <h4>${usuario.nombre} ${esUsuarioActual ? '<span class="usuario-actual">(Actual)</span>' : ''}</h4>
                <div class="config-badges">
                    <span class="badge ${usuario.activo ? 'badge-success' : 'badge-secondary'}">
                        ${usuario.activo ? '✅ Activo' : '❌ Inactivo'}
                    </span>
                    <span class="badge ${esPersona ? 'badge-info' : 'badge-primary'}">
                        ${esPersona ? '👤 Persona' : '👥 Usuario'}
                    </span>
                    ${!esPersona ? `
                        <span class="badge badge-primary">
                            ${usuario.usuario}
                        </span>
                    ` : ''}
                    ${esUsuarioActual ? '<span class="badge badge-primary">🎯 En uso</span>' : ''}
                </div>
            </div>
        </div>
        <div class="config-actions">
            ${!esUsuarioActual ? `
                <button class="btn-icon cambiar-usuario" data-id="${usuario.id}" title="Usar este usuario">
                    🎯
                </button>
            ` : ''}
            <button class="btn-icon editar-usuario" data-id="${usuario.id}" title="Editar">
                ✏️
            </button>
            <button class="btn-icon btn-danger eliminar-usuario" data-id="${usuario.id}" title="Eliminar">
                🗑️
            </button>
        </div>
    `;
    return card;
}

    setupUsuariosEventListeners() {
        console.log('🔧 Configurando event listeners para usuarios...');
        
        // Event listeners para botones de cambiar usuario
        document.querySelectorAll('.cambiar-usuario').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const usuarioId = e.target.closest('.cambiar-usuario').getAttribute('data-id');
                console.log('🎯 Cambiando a usuario:', usuarioId);
                this.cambiarUsuario(usuarioId);
            });
        });
        
        // Event listeners para botones de editar usuarios
        document.querySelectorAll('.editar-usuario').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const usuarioId = e.target.closest('.editar-usuario').getAttribute('data-id');
                console.log('✏️ Editando usuario:', usuarioId);
                this.editarUsuario(usuarioId);
            });
        });
        
        // Event listeners para botones de eliminar usuarios
        document.querySelectorAll('.eliminar-usuario').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const usuarioId = e.target.closest('.eliminar-usuario').getAttribute('data-id');
                console.log('🗑️ Eliminando usuario:', usuarioId);
                this.eliminarUsuario(usuarioId);
            });
        });
    }

    cambiarUsuario(usuarioId) {
        const usuario = this.usuarios.find(u => u.id === usuarioId);
        if (!usuario) {
            this.mostrarMensajeError('Usuario no encontrado');
            return;
        }
        
        if (confirm(`¿Estás seguro de que quieres cambiar al usuario "${usuario.nombre}"?`)) {
            // Actualizar la sesión
            const userSession = {
                id: usuario.id,
                nombre: usuario.nombre,
                usuario: usuario.usuario
            };
            
            localStorage.setItem('userSession', JSON.stringify(userSession));
            this.mostrarMensajeExito(`Sesión cambiada a ${usuario.nombre}`);
            
            // Recargar la aplicación
            setTimeout(() => {
                location.reload();
            }, 1500);
        }
    }

    editarUsuario(id) {
        console.log('✏️ Editando usuario con ID:', id);
        const usuario = this.usuarios.find(u => u.id === id);
        if (usuario) {
            console.log('📝 Usuario encontrado:', usuario);
            this.mostrarModalUsuario(usuario);
        } else {
            console.error('❌ Usuario no encontrado con ID:', id);
            this.mostrarMensajeError('Usuario no encontrado');
        }
    }

    async eliminarUsuario(id) {
        console.log('🗑️ Intentando eliminar usuario con ID:', id);
        const usuario = this.usuarios.find(u => u.id === id);
        if (!usuario) {
            console.error('❌ Usuario no encontrado con ID:', id);
            return;
        }
        
        if (!confirm(`¿Estás seguro de que quieres eliminar el usuario "${usuario.nombre}"?\n\n⚠️ Esta acción eliminará todos los datos del usuario.`)) {
            return;
        }

        try {
            // Eliminar todos los documentos del usuario en Firebase
            const collections = ['gastos', 'categorias', 'tarjetas', 'presupuestos', 'tareas', 'usuario'];
            
            for (const collection of collections) {
                try {
                    const docRef = firebaseDb.collection(id).doc(collection);
                    await docRef.delete();
                    console.log(`✅ Eliminada colección ${collection} del usuario ${id}`);
                } catch (error) {
                    console.log(`⚠️ No se pudo eliminar ${collection} del usuario ${id}:`, error.message);
                }
            }

            // Actualizar la lista local
            this.usuarios = this.usuarios.filter(u => u.id !== id);
            this.renderUsuarios();
            this.mostrarMensajeExito('Usuario eliminado correctamente');
            
        } catch (error) {
            console.error('Error eliminando usuario:', error);
            this.mostrarMensajeError('Error al eliminar usuario');
        }
    }

    async guardarUsuario() {
    const form = document.getElementById('usuario-form');
    if (!form) return;
    
    const usuarioId = document.getElementById('usuario-id').value;
    const nombre = document.getElementById('usuario-nombre').value.trim();
    const usuario = document.getElementById('usuario-usuario').value.trim();
    const password = document.getElementById('usuario-password').value;
    const activo = document.getElementById('usuario-activo').checked;
    const tipoUsuario = document.getElementById('tipo-usuario').value; // 🔥 NUEVO

    if (!nombre) {
        this.mostrarMensajeError('El nombre es obligatorio');
        return;
    }

    // 🔥 NUEVA VALIDACIÓN: Para usuarios, el nombre de usuario es obligatorio
    if (tipoUsuario === 'usuario' && !usuario) {
        this.mostrarMensajeError('El nombre de usuario es obligatorio para usuarios');
        return;
    }

    // 🔥 CORRECCIÓN: Para nuevos usuarios, la contraseña es obligatoria solo para tipo "usuario"
    if (!usuarioId && tipoUsuario === 'usuario' && !password) {
        this.mostrarMensajeError('La contraseña es obligatoria para nuevos usuarios');
        return;
    }

    try {
        const userData = {
            nombre: nombre,
            tipo: tipoUsuario, // 🔥 NUEVO - ESTE ES EL CAMPO QUE FALTABA
            activo: activo,
            fechaCreacion: new Date()
        };

        // 🔥 CORRECCIÓN: Solo agregar usuario y password si es tipo "usuario"
        if (tipoUsuario === 'usuario') {
            userData.usuario = usuario;
            if (password) {
                userData.password = password;
            }
        }

        // 🔥 CORRECCIÓN MEJORADA: Generar ID único para nuevo usuario/persona
        let finalUserId;
        if (usuarioId) {
            // Editar usuario existente
            finalUserId = usuarioId;
        } else {
            // Crear nuevo usuario/persona - buscar el primer userX disponible
            const users = ['user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7', 'user8', 'user9', 'user10'];
            let usuarioEncontrado = null;
            
            // Verificar si el usuario ya existe y buscar espacio disponible
            for (const userId of users) {
                try {
                    const docRef = firebaseDb.collection(userId).doc('usuario');
                    const doc = await docRef.get();
                    
                    if (doc.exists) {
                        const existingUser = doc.data();
                        // Solo verificar duplicado si es usuario (no para personas)
                        if (tipoUsuario === 'usuario' && existingUser.usuario === usuario) {
                            this.mostrarMensajeError('El nombre de usuario ya existe');
                            return;
                        }
                        // Si existe pero tiene datos diferentes, continuar buscando
                        console.log(`Usuario ${userId} ya existe, continuando búsqueda...`);
                    } else {
                        // Este userX está disponible
                        usuarioEncontrado = userId;
                        console.log(`✅ Espacio disponible encontrado: ${userId}`);
                        break;
                    }
                } catch (error) {
                    console.log(`Error verificando usuario ${userId}:`, error);
                    // En caso de error, asumir que está disponible
                    usuarioEncontrado = userId;
                    break;
                }
            }
            
            if (!usuarioEncontrado) {
                this.mostrarMensajeError('No hay espacios disponibles para nuevos usuarios. Máximo 10 usuarios/personas permitidos.');
                return;
            }
            
            finalUserId = usuarioEncontrado;
        }

        console.log(`💾 Guardando ${tipoUsuario} en: ${finalUserId}`, userData);
        const docRef = firebaseDb.collection(finalUserId).doc('usuario');
        await docRef.set(userData, { merge: true });

        // Recargar usuarios
        await this.cargarUsuarios();
        this.renderUsuarios();
        this.cerrarModalUsuario();
        this.mostrarMensajeExito(usuarioId ? `${tipoUsuario === 'usuario' ? 'Usuario' : 'Persona'} actualizado` : `${tipoUsuario === 'usuario' ? 'Usuario' : 'Persona'} creado exitosamente (${finalUserId})`);
        
    } catch (error) {
        console.error('❌ Error guardando usuario:', error);
        this.mostrarMensajeError('Error al guardar usuario: ' + error.message);
    }
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
        // 🔥 CORRECCIÓN: Inicializar campos según tipo por defecto
        setTimeout(() => {
            this.actualizarCamposPorTipoUsuario();
        }, 100);
    }
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
}

    llenarFormularioUsuario(usuario) {
    document.getElementById('usuario-id').value = usuario.id || '';
    document.getElementById('usuario-nombre').value = usuario.nombre || '';
    document.getElementById('tipo-usuario').value = usuario.tipo || 'usuario'; // 🔥 NUEVO
    
    // 🔥 CORRECCIÓN: Solo llenar usuario y password si es tipo "usuario"
    if (usuario.tipo === 'usuario') {
        document.getElementById('usuario-usuario').value = usuario.usuario || '';
        document.getElementById('usuario-password').value = ''; // No mostrar contraseña existente por seguridad
    } else {
        document.getElementById('usuario-usuario').value = '';
        document.getElementById('usuario-password').value = '';
    }
    
    document.getElementById('usuario-activo').checked = usuario.activo !== false;
    
    const form = document.getElementById('usuario-form');
    if (form) {
        form.dataset.editingId = usuario.id;
    }
    
    // 🔥 NUEVO: Actualizar campos según tipo
    this.actualizarCamposPorTipoUsuario();
}

    // 🔥 MEJORADO: Actualizar campos según tipo de usuario
// 🔥 MEJORADO: Actualizar campos según tipo de usuario
actualizarCamposPorTipoUsuario() {
    const tipoUsuario = document.getElementById('tipo-usuario').value;
    const camposUsuario = document.getElementById('campos-usuario');
    const usuarioInput = document.getElementById('usuario-usuario');
    const passwordInput = document.getElementById('usuario-password');
    const usuarioLabel = document.querySelector('label[for="usuario-usuario"]');
    const passwordLabel = document.querySelector('label[for="usuario-password"]');
    
    console.log('🔄 Cambiando tipo de usuario a:', tipoUsuario);
    
    if (tipoUsuario === 'usuario') {
        camposUsuario.style.display = 'block';
        usuarioInput.required = true;
        passwordInput.required = true;
        
        // Mostrar placeholders y labels apropiados
        if (usuarioLabel) usuarioLabel.style.display = 'block';
        if (passwordLabel) passwordLabel.style.display = 'block';
        
        usuarioInput.placeholder = "Nombre de usuario para login";
        passwordInput.placeholder = "Contraseña para login";
        
    } else {
        // 🔥 CORRECCIÓN: Ocultar completamente los campos para personas
        camposUsuario.style.display = 'none';
        usuarioInput.required = false;
        passwordInput.required = false;
        
        // Ocultar labels también
        if (usuarioLabel) usuarioLabel.style.display = 'none';
        if (passwordLabel) passwordLabel.style.display = 'none';
        
        // Limpiar campos cuando no son necesarios
        usuarioInput.value = '';
        passwordInput.value = '';
    }
    
    // Forzar reflow para asegurar que los cambios se apliquen
    setTimeout(() => {
        camposUsuario.style.visibility = tipoUsuario === 'usuario' ? 'visible' : 'hidden';
    }, 10);
}

    cerrarModalUsuario() {
        const modal = document.getElementById('modal-usuario');
        const form = document.getElementById('usuario-form');
        
        if (modal) modal.style.display = 'none';
        if (form) {
            form.reset();
            delete form.dataset.editingId;
        }
        document.body.classList.remove('modal-open');
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
        document.body.appendChild(notification);
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }

    cerrarModalCategoria() {
        const modal = document.getElementById('modal-categoria');
        const form = document.getElementById('categoria-form');
        
        if (modal) modal.style.display = 'none';
        if (form) {
            form.reset();
            delete form.dataset.editingId;
        }
        document.body.classList.remove('modal-open');
    }

    cerrarModalTarjeta() {
        const modal = document.getElementById('modal-tarjeta');
        const form = document.getElementById('tarjeta-form');
        
        if (modal) modal.style.display = 'none';
        if (form) {
            form.reset();
            delete form.dataset.editingId;
        }
        document.body.classList.remove('modal-open');
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