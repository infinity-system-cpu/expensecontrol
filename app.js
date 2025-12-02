// app.js - VERSIÓN ACTUALIZADA CON MEJORAS
class GastosApp {
    constructor() {
        this.gastos = [];
        this.categorias = [];
        this.tarjetas = [];
        this.usuarios = []; 
        this.personas = [];
        this.gastosFiltrados = [];
    }
    
    async init() {
        console.log('GastosApp inicializada');
        await this.cargarDatos();
        this.setupEventListeners();
        this.mostrarSeccion('dashboard');
        
        // Mostrar datos automáticamente al cargar
        this.actualizarInterfazGastos();
        //this.mostrarDebugDatos();
    }
    
    setupEventListeners() {
        console.log('🔧 Configurando event listeners...');
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.getAttribute('data-section');
                this.mostrarSeccion(section);
            });
        });
        
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
        
        const btnNuevaTarea = document.getElementById('btn-nueva-tarea');
        if (btnNuevaTarea) {
            btnNuevaTarea.addEventListener('click', () => {
                this.mostrarModalTarea();
            });
        }
        
        const tareaForm = document.getElementById('tarea-form');
        if (tareaForm) {
            tareaForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.guardarTarea();
            });
        }
        
        document.querySelectorAll('.close, .cancel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        });
        
        // Configurar filtros automáticos
        const filterSelects = ['filter-month', 'filter-year', 'filter-day', 'filter-category', 'filter-payment', 'filter-usuario'];
        filterSelects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                select.addEventListener('change', () => {
                    this.aplicarFiltros();
                });
            }
        });
        
        const btnAplicarFiltros = document.getElementById('btn-aplicar-filtros');
        if (btnAplicarFiltros) {
            btnAplicarFiltros.style.display = 'none'; // Ocultar botón aplicar
        }
        
        const btnLimpiarFiltros = document.getElementById('btn-limpiar-filtros');
        if (btnLimpiarFiltros) {
            btnLimpiarFiltros.addEventListener('click', () => {
                this.limpiarFiltros();
            });
        }
        
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });

        // 🔥 NUEVO: Controlar campos según tipo de gasto
        const tipoGastoSelect = document.getElementById('tipo-gasto');
        if (tipoGastoSelect) {
            tipoGastoSelect.addEventListener('change', () => {
                this.actualizarCamposPorTipoGasto();
            });
        }
        
        // 🔥 NUEVO: Controlar pago a meses
        const pagoMesesSelect = document.getElementById('pago-meses');
        if (pagoMesesSelect) {
            pagoMesesSelect.addEventListener('change', () => {
                this.actualizarCamposPagoMeses();
            });
        }
        
        // 🔥 NUEVO: Controlar campo de tarjeta según método de pago
        const metodoPagoSelect = document.getElementById('metodo-pago');
        const tarjetaSelect = document.getElementById('tarjeta-gasto');
    
        if (metodoPagoSelect && tarjetaSelect) {
            metodoPagoSelect.addEventListener('change', () => {
                this.actualizarEstadoCampoTarjeta();
            });
        
            // Ejecutar al cargar para establecer estado inicial
            this.actualizarEstadoCampoTarjeta();
        }
    
        console.log('✅ Event listeners configurados');

        const montoMensualInput = document.getElementById('monto-mensual');
        const totalMesesSelect = document.getElementById('total-meses');
        const descripcionInput = document.getElementById('descripcion');
    
        if (montoMensualInput) {
            montoMensualInput.addEventListener('input', () => {
                this.calcularMontoTotal();
            });
        }
    
        if (totalMesesSelect) {
            totalMesesSelect.addEventListener('change', () => {
                this.calcularMontoTotal();
            });
        }
    
        if (descripcionInput) {
            descripcionInput.addEventListener('blur', () => {
                const descripcion = descripcionInput.value.trim();
                if (descripcion && document.getElementById('pago-meses').value === 'si') {
                    this.sugerirValoresRecurrentes(descripcion);
                }
            });
        }

        // 🔥 NUEVO: Event listener para cambios en el usuario
    const usuarioSelect = document.getElementById('usuario-gasto');
    if (usuarioSelect) {
        usuarioSelect.addEventListener('change', () => {
            this.actualizarCamposPorUsuario();
        });
    }
    
    // 🔥 NUEVO: Event listener para gastos recurrentes
    const gastoRecurrenteSelect = document.getElementById('gasto-recurrente');
    if (gastoRecurrenteSelect) {
        gastoRecurrenteSelect.addEventListener('change', (e) => {
            const gastoId = e.target.value;
            if (gastoId) {
                this.completarConGastoRecurrente(gastoId);
                this.mostrarInfoGastoRecurrente(gastoId);
            } else {
                // Limpiar información si no hay selección
                const infoContainer = document.getElementById('gasto-recurrente-info');
                if (infoContainer) {
                    infoContainer.remove();
                }
            }
        });
        }
    
    }


    // 🔥 NUEVO: Actualizar campos cuando cambia el usuario
actualizarCamposPorUsuario() {
    const tipoGasto = document.getElementById('tipo-gasto').value;
    const usuarioSelect = document.getElementById('usuario-gasto');
    const gastoRecurrentContainer = document.getElementById('gasto-recurrente-container');
    const gastoRecurrenteSelect = document.getElementById('gasto-recurrente');
    
    const usuarioSeleccionado = usuarioSelect.value;
    
    if (usuarioSeleccionado) {
        // Buscar gastos pendientes del usuario seleccionado
        const gastosPendientes = this.buscarGastosPendientesUsuario(usuarioSeleccionado);
        
        if (gastosPendientes.length > 0) {
            gastoRecurrentContainer.style.display = 'block';
            this.poblarSelectGastosRecurrentes(gastoRecurrenteSelect, gastosPendientes);
        } else {
            gastoRecurrentContainer.style.display = 'none';
            gastoRecurrenteSelect.innerHTML = '<option value="">Seleccionar un gasto pendiente...</option>';
        }
    } else {
        gastoRecurrentContainer.style.display = 'none';
        gastoRecurrenteSelect.innerHTML = '<option value="">Seleccionar un gasto pendiente...</option>';
    }
}

// 🔥 NUEVO: Buscar gastos pendientes del usuario
buscarGastosPendientesUsuario(usuarioNombre) {
    return this.gastos.filter(gasto => 
        gasto.usuario === usuarioNombre &&
        gasto.pagoMeses === 'si' &&
        gasto.estado !== 'pagado' &&
        gasto.mesActual < gasto.totalMeses
    );
}

// 🔥 NUEVO: Poblar select con gastos recurrentes
poblarSelectGastosRecurrentes(selectElement, gastosPendientes) {
    selectElement.innerHTML = '<option value="">Seleccionar un gasto pendiente...</option>';
    
    gastosPendientes.forEach(gasto => {
        const option = document.createElement('option');
        option.value = gasto.id;
        option.textContent = `${gasto.descripcion} - ${gasto.mesActual}/${gasto.totalMeses} meses - $${gasto.montoMensual}/mes`;
        option.dataset.gasto = JSON.stringify(gasto);
        selectElement.appendChild(option);
    });
}

// 🔥 NUEVO: Completar formulario con datos del gasto recurrente
completarConGastoRecurrente(gastoId) {
    const gastoRecurrenteSelect = document.getElementById('gasto-recurrente');
    const optionSeleccionada = gastoRecurrenteSelect.querySelector(`option[value="${gastoId}"]`);
    
    if (!optionSeleccionada) return;
    
    const gasto = JSON.parse(optionSeleccionada.dataset.gasto);
    
    console.log('🔄 Completando formulario con gasto recurrente:', gasto);
    
    // Completar campos del formulario
    document.getElementById('descripcion').value = gasto.descripcion;
    document.getElementById('categoria').value = gasto.categoria;
    document.getElementById('metodo-pago').value = gasto.metodoPago;
    document.getElementById('tarjeta-gasto').value = gasto.tarjeta || '';
    document.getElementById('pago-meses').value = 'si';
    document.getElementById('monto-mensual').value = gasto.montoMensual || gasto.monto;
    document.getElementById('total-meses').value = gasto.totalMeses;
    
    // Calcular mes actual (siguiente mes)
    const mesActual = parseInt(gasto.mesActual) + 1;
    document.getElementById('mes-actual').value = mesActual;
    
    // Actualizar controles
    this.actualizarCamposPagoMeses();
    this.calcularMontoTotal();
    this.poblarSelectMesActual(parseInt(gasto.totalMeses));
    
    this.mostrarMensaje(`Formulario completado con el gasto: ${gasto.descripcion}`, 'success');
}

// 🔥 NUEVO: Mostrar información del gasto recurrente seleccionado
mostrarInfoGastoRecurrente(gastoId) {
    const gastoRecurrenteSelect = document.getElementById('gasto-recurrente');
    const optionSeleccionada = gastoRecurrenteSelect.querySelector(`option[value="${gastoId}"]`);
    
    if (!optionSeleccionada) return;
    
    const gasto = JSON.parse(optionSeleccionada.dataset.gasto);
    
    // Crear o actualizar el contenedor de información
    let infoContainer = document.getElementById('gasto-recurrente-info');
    if (!infoContainer) {
        infoContainer = document.createElement('div');
        infoContainer.id = 'gasto-recurrente-info';
        infoContainer.className = 'gasto-recurrente-info';
        gastoRecurrenteSelect.parentNode.appendChild(infoContainer);
    }
    
    infoContainer.innerHTML = `
        <h5>📋 Información del Gasto Seleccionado</h5>
        <div class="gasto-recurrente-details">
            <span><strong>Descripción:</strong> ${gasto.descripcion}</span>
            <span><strong>Categoría:</strong> ${gasto.categoria}</span>
            <span><strong>Progreso:</strong> ${gasto.mesActual} de ${gasto.totalMeses} meses</span>
            <span><strong>Monto Mensual:</strong> $${gasto.montoMensual || gasto.monto}</span>
            <span><strong>Total:</strong> $${gasto.montoTotal || (gasto.monto * gasto.totalMeses).toFixed(2)}</span>
            <span><strong>Saldo Pendiente:</strong> $${this.calcularSaldoPendiente(gasto).texto}</span>
        </div>
    `;
}

    // 🔥 NUEVO MÉTODO: Actualizar campos según tipo de gasto
    // 🔥 MEJORADO: Actualizar campos según tipo de gasto
// 🔥 MEJORADO: Actualizar campos según tipo de gasto preservando valores
actualizarCamposPorTipoGasto() {
    const tipoGasto = document.getElementById('tipo-gasto').value;
    const usuarioContainer = document.getElementById('usuario-gasto-container');
    const usuarioSelect = document.getElementById('usuario-gasto');
    
    // 🔥 CORRECCIÓN: Guardar el valor actual antes de cambiar
    const valorActual = usuarioSelect.value;
    
    console.log('🔄 Cambiando tipo de gasto a:', tipoGasto, 'valor actual:', valorActual);
    
    if (tipoGasto === 'interno') {
        usuarioContainer.style.display = 'block';
        this.poblarSelectUsuariosInternos(usuarioSelect);
    } else if (tipoGasto === 'externo') {
        usuarioContainer.style.display = 'block';
        this.poblarSelectPersonasExternas(usuarioSelect);
    } else {
        usuarioContainer.style.display = 'none';
    }
    
    // 🔥 CORRECCIÓN: Restaurar el valor después de poblar
    setTimeout(() => {
        if (valorActual && usuarioSelect.querySelector(`option[value="${valorActual}"]`)) {
            usuarioSelect.value = valorActual;
            console.log('✅ Valor de usuario restaurado:', valorActual);
        }
        // 🔥 NUEVO: Actualizar campos por usuario después de cambiar tipo
        this.actualizarCamposPorUsuario();
    }, 100);
    
    // Forzar actualización del estado del campo tarjeta
    setTimeout(() => {
        this.actualizarEstadoVisualTarjeta();
    }, 150);
}
    
    // 🔥 NUEVO MÉTODO: Poblar select con usuarios internos
    // 🔥 MEJORADO: Poblar select con usuarios internos preservando valor
poblarSelectUsuariosInternos(selectElement) {
    if (!selectElement) return;
    
    // 🔥 CORRECCIÓN: Guardar valor actual
    const valorActual = selectElement.value;
    
    selectElement.innerHTML = '<option value="">Seleccionar usuario</option>';
    
    console.log('👥 Usuarios disponibles para interno:', this.usuarios.map(u => u.nombre));
    
    const usuariosInternos = this.usuarios.filter(user => 
        user.activo !== false
    );
    
    usuariosInternos.forEach(usuario => {
        const option = document.createElement('option');
        option.value = usuario.nombre;
        option.textContent = usuario.nombre;
        option.dataset.userId = usuario.id;
        selectElement.appendChild(option);
    });
    
    // 🔥 CORRECCIÓN: Restaurar valor si existe
    if (valorActual && selectElement.querySelector(`option[value="${valorActual}"]`)) {
        selectElement.value = valorActual;
        console.log('✅ Valor restaurado en usuarios internos:', valorActual);
    }
    
    console.log('✅ Usuarios internos poblados:', usuariosInternos.length);
}

// 🔥 MEJORADO: Poblar select con personas externas preservando valor
poblarSelectPersonasExternas(selectElement) {
    if (!selectElement) return;
    
    // 🔥 CORRECCIÓN: Guardar valor actual
    const valorActual = selectElement.value;
    
    selectElement.innerHTML = '<option value="">Seleccionar persona</option>';
    
    console.log('👤 Personas disponibles para externo:', this.personas.map(p => p.nombre));
    
    const personasExternas = this.personas.filter(persona => 
        persona.activo !== false
    );
    
    personasExternas.forEach(persona => {
        const option = document.createElement('option');
        option.value = persona.nombre;
        option.textContent = persona.nombre;
        option.dataset.userId = persona.id;
        selectElement.appendChild(option);
    });
    
    // 🔥 CORRECCIÓN: Restaurar valor si existe
    if (valorActual && selectElement.querySelector(`option[value="${valorActual}"]`)) {
        selectElement.value = valorActual;
        console.log('✅ Valor restaurado en personas externas:', valorActual);
    }
    
    console.log('✅ Personas externas pobladas:', personasExternas.length);
}

// 🔥 CORREGIDO: Poblar select con personas externas
poblarSelectPersonasExternas(selectElement) {
    if (!selectElement) return;
    
    selectElement.innerHTML = '<option value="">Seleccionar persona</option>';
    
    console.log('👤 Personas disponibles para externo:', this.personas.map(p => p.nombre));
    
    // 🔥 CORRECCIÓN: Para gastos externos, mostrar SOLO personas (tipo "persona")
    const personasExternas = this.personas.filter(persona => 
        persona.activo !== false
    );
    
    personasExternas.forEach(persona => {
        const option = document.createElement('option');
        option.value = persona.nombre;
        option.textContent = persona.nombre;
        option.dataset.userId = persona.id;
        selectElement.appendChild(option);
    });
    
    console.log('✅ Personas externas pobladas:', personasExternas.length);
}
    
    // 🔥 NUEVO MÉTODO: Controlar campos de pago a meses
    // 🔥 NUEVO: Actualizar campos de pago a meses
// 🔥 CORREGIDO: Actualizar campos de pago a meses
actualizarCamposPagoMeses() {
    const pagoMeses = document.getElementById('pago-meses').value;
    const mesesContainer = document.getElementById('meses-container');
    const montoMensualContainer = document.getElementById('monto-mensual-container');
    const montoTotalContainer = document.getElementById('monto-total-container');
    const montoInput = document.getElementById('monto');
    const montoLabel = document.querySelector('label[for="monto"]');

    this.manejarCamposRequeridos();
    
    if (pagoMeses === 'si') {
        mesesContainer.style.display = 'block';
        montoMensualContainer.style.display = 'block';
        montoTotalContainer.style.display = 'block';
        montoInput.style.display = 'none';
        
        
        // 🔥 CORRECCIÓN: Deshabilitar el campo monto normal en lugar de ocultarlo
        montoInput.disabled = true;
        montoInput.required = false;
        
        if (montoLabel) montoLabel.style.display = 'none';
        
        // Calcular monto total inicial
        this.calcularMontoTotal();
        
    } else {
        mesesContainer.style.display = 'none';
        montoMensualContainer.style.display = 'none';
        montoTotalContainer.style.display = 'none';
        montoInput.style.display = 'block';
        
        // 🔥 CORRECCIÓN: Habilitar el campo monto normal
        montoInput.disabled = false;
        montoInput.required = true;
        
        if (montoLabel) montoLabel.style.display = 'block';
    }
}

// 🔥 NUEVO: Calcular monto total automáticamente
calcularMontoTotal() {
    const montoMensual = parseFloat(document.getElementById('monto-mensual').value) || 0;
    const totalMeses = parseInt(document.getElementById('total-meses').value) || 0;
    const montoTotal = montoMensual * totalMeses;
    
    document.getElementById('monto-total').value = montoTotal.toFixed(2);
}

// 🔥 NUEVO: Buscar gastos existentes con el mismo nombre
buscarGastosSimilares(descripcion) {
    return this.gastos.filter(gasto => 
        gasto.descripcion.toLowerCase().includes(descripcion.toLowerCase()) &&
        gasto.pagoMeses === 'si'
    );
}

// 🔥 NUEVO: Sugerir valores para gastos recurrentes
sugerirValoresRecurrentes(descripcion) {
    const gastosSimilares = this.buscarGastosSimilares(descripcion);
    
    if (gastosSimilares.length > 0) {
        const ultimoGasto = gastosSimilares[gastosSimilares.length - 1];
        
        // Sugerir el mismo monto mensual
        document.getElementById('monto-mensual').value = ultimoGasto.montoMensual || '';
        this.calcularMontoTotal();
        
        // Sugerir el mismo total de meses
        if (ultimoGasto.totalMeses) {
            document.getElementById('total-meses').value = ultimoGasto.totalMeses;
        }
        
        this.mostrarMensaje(`Se encontró un gasto similar: ${ultimoGasto.descripcion}`, 'info');
    }
}
    
    // 🔥 NUEVO MÉTODO: Poblar select de mes actual
    poblarSelectMesActual(totalMeses) {
        const select = document.getElementById('mes-actual');
        const container = document.getElementById('mes-actual-container');
        
        if (!select) return;
        
        select.innerHTML = '';
        
        if (totalMeses && totalMeses > 1) {
            container.style.display = 'block';
            for (let i = 1; i <= totalMeses; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = `${i} de ${totalMeses}`;
                select.appendChild(option);
            }
        } else {
            container.style.display = 'none';
        }
    }   
    
    mostrarSeccion(seccionId) {
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'none';
        });
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const seccion = document.getElementById(seccionId);
        if (seccion) {
            seccion.style.display = 'block';
        }
        
        const link = document.querySelector(`[data-section="${seccionId}"]`);
        if (link) {
            link.classList.add('active');
        }
        
        this.actualizarModulo(seccionId);
    }
    
    actualizarModulo(seccionId) {
        console.log('🔄 Actualizando módulo:', seccionId);
        switch (seccionId) {
            case 'dashboard':
                if (window.dashboard && typeof window.dashboard.loadDashboardData === 'function') {
                    window.dashboard.loadDashboardData();
                } else {
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
        const selectModal = document.getElementById('categoria');
        if (selectModal) {
            this.poblarSelectCategorias(selectModal);
        }
        const selectFiltro = document.getElementById('filter-category');
        if (selectFiltro) {
            this.poblarSelectFiltroCategorias(selectFiltro);
        }
    }
    
    poblarSelectCategorias(selectElement) {
        if (!selectElement) return;
        const valorActual = selectElement.value;
        selectElement.innerHTML = '<option value="">Selecciona una categoría</option>';
        if (this.categorias && this.categorias.length > 0) {
            this.categorias.forEach(cat => {
                if (cat.activa !== false) {
                    const option = document.createElement('option');
                    option.value = cat.nombre;
                    option.textContent = `${cat.icono || '📦'} ${cat.nombre}`;
                    selectElement.appendChild(option);
                }
            });
            if (valorActual && selectElement.querySelector(`option[value="${valorActual}"]`)) {
                selectElement.value = valorActual;
            }
        } else {
            console.log('⚠️ No hay categorías para mostrar en el select');
        }
    }
    
    poblarSelectFiltroCategorias(selectElement) {
        if (!selectElement) return;
        const valorActual = selectElement.value;
        if (selectElement.options.length > 1) {
            while (selectElement.options.length > 1) {
                selectElement.remove(1);
            }
        } else {
            selectElement.innerHTML = '<option value="todas">Todas las categorías</option>';
        }
        if (this.categorias && this.categorias.length > 0) {
            this.categorias.forEach(cat => {
                if (cat.activa !== false) {
                    const option = document.createElement('option');
                    option.value = cat.nombre;
                    option.textContent = `${cat.icono || '📦'} ${cat.nombre}`;
                    selectElement.appendChild(option);
                }
            });
            if (valorActual && selectElement.querySelector(`option[value="${valorActual}"]`)) {
                selectElement.value = valorActual;
            }
        }
    }
    
    async cargarDatos() {
        const userId = window.authManager?.getUserId();
        if (!userId) {
            console.log('❌ No hay usuario autenticado');
            this.gastos = [];
            this.categorias = [];
            this.tarjetas = [];
            this.usuarios = [];
            this.personas = [];
            return;
        }
        
        try {
            console.log('📥 Cargando datos para usuario:', userId);
            await this.cargarGastos(userId);
            await this.cargarCategorias(userId);
            await this.cargarTarjetas(userId);
            await this.cargarUsuariosYPersonas();
        } catch (error) {
            console.error('❌ Error cargando datos:', error);
            this.gastos = [];
            this.categorias = [];
            this.tarjetas = [];
            this.usuarios = [];
            this.personas = [];
        }
    }

    // 🔥 NUEVO MÉTODO: Cargar usuarios y personas
    async cargarUsuariosYPersonas() {
    try {
        console.log('📥 Cargando usuarios y personas...');
        
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
                        tipo: userData.tipo || 'usuario', // Por defecto es 'usuario'
                        password: userData.password || '',
                        activo: userData.activo !== false,
                        fechaCreacion: userData.fechaCreacion || new Date()
                    };
                    
                    // 🔥 CORRECCIÓN: Clasificar correctamente
                    if (userInfo.tipo === 'persona') {
                        this.personas.push(userInfo);
                    } else {
                        this.usuarios.push(userInfo);
                    }
                    
                    console.log(`✅ ${userInfo.tipo} cargado: ${userInfo.nombre} (${userId})`);
                }
            } catch (error) {
                console.log(`⚠️ No se pudo cargar usuario ${userId}:`, error.message);
            }
        }
        
        console.log('✅ Usuarios cargados:', this.usuarios.map(u => u.nombre));
        console.log('✅ Personas cargadas:', this.personas.map(p => p.nombre));
        
    } catch (error) {
        console.error('❌ Error cargando usuarios y personas:', error);
    }
}
    
    async cargarGastos(userId) {
        try {
            const docRef = firebaseDb.collection(userId).doc('gastos');
            const doc = await docRef.get();
            if (doc.exists) {
                const data = doc.data();
                this.gastos = data.items || [];
            } else {
                this.gastos = [];
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
            } else {
                this.tarjetas = [];
            }
        } catch (error) {
            console.error('Error cargando tarjetas:', error);
            this.tarjetas = [];
        }
    }
    
    actualizarInterfazGastos() {
        // Aplicar filtros automáticamente al cargar
        this.aplicarFiltros();
        this.actualizarResumenGastos();
        this.poblarFiltros();
    }
    
    mostrarGastos() {
    if (!this.gastosFiltrados) {
        this.gastosFiltrados = this.gastos || [];
    }
    
    const tbody = document.getElementById('gastos-body');
    const countElement = document.getElementById('gastos-count');
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!this.gastosFiltrados || !Array.isArray(this.gastosFiltrados) || this.gastosFiltrados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" style="text-align: center; color: var(--text-light); padding: 3rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">💰</div>
                    <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">No hay gastos registrados</p>
                    <small style="font-size: 0.9rem;">Comienza agregando tu primer gasto</small>
                </td>
            </tr>
        `;
        if (countElement) countElement.textContent = '0';
        return;
    }
    
    if (countElement) {
        countElement.textContent = this.gastosFiltrados.length.toString();
    }
    
    const gastosOrdenados = [...this.gastosFiltrados].sort((a, b) => {
        const fechaA = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha);
        const fechaB = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha);
        return fechaB - fechaA;
    });
    
    // En el forEach donde creas cada fila, asegúrate de que la estructura sea consistente
// En el forEach donde creas cada fila, actualiza las columnas:
    gastosOrdenados.forEach(gasto => {
        const tr = document.createElement('tr');
        const fechaGasto = gasto.fecha?.toDate ? gasto.fecha.toDate() : new Date(gasto.fecha);
        const fechaFormateada = fechaGasto.toLocaleDateString('es-ES');
    
    // Calcular saldo pendiente
        const saldoPendiente = this.calcularSaldoPendiente(gasto);
    
    // Calcular texto de recibo para pagos a meses
        let reciboTexto = '-';
        if (gasto.pagoMeses && gasto.pagoMeses === 'si' && gasto.totalMeses && gasto.mesActual) {
            reciboTexto = `${gasto.mesActual} de ${gasto.totalMeses}`;
        }
    
    // 🔥 NUEVO: Determinar qué monto mostrar
        const montoMostrar = gasto.monto || 0;
        const montoTotalMostrar = gasto.montoTotal || gasto.monto || 0;
    
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
            <td>${gasto.usuario || '-'}</td>
            <td style="text-align: center;">${gasto.totalMeses ? `${gasto.totalMeses} meses` : '-'}</td>
            <td style="text-align: center;">${reciboTexto}</td>
            <td class="monto">$${montoMostrar.toFixed(2)}</td>
            <td class="monto">$${montoTotalMostrar.toFixed(2)}</td>
            <td class="saldo-pendiente ${saldoPendiente.estado}">
                ${saldoPendiente.texto}
            </td>
            <td class="acciones">
                <div class="acciones-container">
                    ${saldoPendiente.estado !== 'pagado' ? `
                        <button class="btn-icon btn-success marcar-pagado" data-id="${gasto.id}" title="Marcar como Pagado">
                            ✅
                        </button>
                    ` : `
                        <button class="btn-icon btn-success" disabled title="Ya está pagado">
                        ✅
                        </button>
                    `}
                    <button class="btn-icon" onclick="gastosApp.editarGasto('${gasto.id}')" title="Editar">
                        ✏️
                    </button>
                    <button class="btn-icon btn-danger" onclick="gastosApp.eliminarGasto('${gasto.id}')" title="Eliminar">
                        🗑️
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

        // 🔥 NUEVO: Configurar event listeners para botones de pagado
        this.setupBotonesPagado();
    }

    // 🔥 CORREGIDO: Calcular saldo pendiente con la lógica correcta
calcularSaldoPendiente(gasto) {
    if (gasto.estado === 'pagado') {
        return {
            texto: 'Pagado',
            estado: 'pagado',
            monto: 0
        };
    }

    if (gasto.pagoMeses && gasto.pagoMeses === 'si' && gasto.totalMeses && gasto.mesActual) {
        const totalMeses = parseInt(gasto.totalMeses);
        const mesActual = parseInt(gasto.mesActual);
        
        // 🔥 CORRECCIÓN: Usar montoTotal en lugar de monto mensual para el cálculo
        const montoTotal = parseFloat(gasto.montoTotal || (gasto.montoMensual * totalMeses) || gasto.monto);
        const montoMensual = parseFloat(gasto.montoMensual || gasto.monto);
        
        console.log('🔢 Cálculo saldo pendiente:', {
            descripcion: gasto.descripcion,
            montoTotal,
            montoMensual,
            mesActual,
            totalMeses
        });
        
        if (mesActual >= totalMeses) {
            return {
                texto: 'Pagado',
                estado: 'pagado',
                monto: 0
            };
        } else {
            // 🔥 CORRECCIÓN: Saldo restante = Total - (Monto Mensual × Meses Pagados)
            const saldoRestante = montoTotal - (montoMensual * mesActual);
            
            return {
                texto: `$${saldoRestante.toFixed(2)}`,
                estado: 'pendiente',
                monto: saldoRestante
            };
        }
    } else {
        // Gastos sin pago a meses
        if (gasto.estado === 'pagado') {
            return {
                texto: 'Pagado',
                estado: 'pagado',
                monto: 0
            };
        } else {
            return {
                texto: `$${parseFloat(gasto.monto).toFixed(2)}`,
                estado: 'pendiente',
                monto: parseFloat(gasto.monto)
            };
        }
    }
}

// 🔥 NUEVO MÉTODO: Configurar botones de pagado
setupBotonesPagado() {
    document.querySelectorAll('.marcar-pagado').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const gastoId = e.target.closest('.marcar-pagado').getAttribute('data-id');
            this.marcarComoPagado(gastoId);
        });
    });
}

// 🔥 NUEVO MÉTODO: Marcar gasto como pagado
async marcarComoPagado(gastoId) {
    if (!confirm('¿Estás seguro de que quieres marcar este gasto como pagado?')) {
        return;
    }
    
    const userId = window.authManager?.getUserId();
    if (!userId) {
        this.mostrarMensaje('Usuario no autenticado', 'error');
        return;
    }
    
    try {
        const docRef = firebaseDb.collection(userId).doc('gastos');
        const gastosActualizados = this.gastos.map(gasto => {
            if (gasto.id === gastoId) {
                return {
                    ...gasto,
                    estado: 'pagado',
                    fechaPago: new Date()
                };
            }
            return gasto;
        });
        
        await docRef.set({ items: gastosActualizados }, { merge: true });
        this.gastos = gastosActualizados;
        this.actualizarInterfazGastos();
        this.mostrarMensaje('Gasto marcado como pagado', 'success');
        
    } catch (error) {
        console.error('Error marcando gasto como pagado:', error);
        this.mostrarMensaje('Error al marcar como pagado', 'error');
    }
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
        const mes = document.getElementById('filter-month')?.value || 'all';
        const anio = document.getElementById('filter-year')?.value || 'all';
        const dia = document.getElementById('filter-day')?.value || 'all';
        const categoria = document.getElementById('filter-category')?.value || 'all';
        const metodoPago = document.getElementById('filter-payment')?.value || 'all';
        const usuario = document.getElementById('filter-usuario')?.value || 'all';
        
        this.gastosFiltrados = (this.gastos || []).filter(gasto => {
            const fechaGasto = gasto.fecha?.toDate ? gasto.fecha.toDate() : new Date(gasto.fecha);
            const cumpleMes = mes === 'all' || (fechaGasto.getMonth() + 1) === parseInt(mes);
            const cumpleAnio = anio === 'all' || fechaGasto.getFullYear() === parseInt(anio);
            const cumpleDia = dia === 'all' || fechaGasto.getDate() === parseInt(dia);
            const cumpleCategoria = categoria === 'all' || gasto.categoria === categoria;
            const cumpleMetodo = metodoPago === 'all' || gasto.metodoPago === metodoPago;
            const cumpleUsuario = usuario === 'all' || gasto.usuario === usuario;
            
            return cumpleMes && cumpleAnio && cumpleDia && cumpleCategoria && cumpleMetodo && cumpleUsuario;
        });
        
        this.mostrarGastos();
    }
    
    limpiarFiltros() {
        const monthSelect = document.getElementById('filter-month');
        const yearSelect = document.getElementById('filter-year');
        const daySelect = document.getElementById('filter-day');
        const categorySelect = document.getElementById('filter-category');
        const paymentSelect = document.getElementById('filter-payment');
        const usuarioSelect = document.getElementById('filter-usuario');
        
        if (monthSelect) monthSelect.value = 'all';
        if (yearSelect) yearSelect.value = 'all';
        if (daySelect) daySelect.value = 'all';
        if (categorySelect) categorySelect.value = 'all';
        if (paymentSelect) paymentSelect.value = 'all';
        if (usuarioSelect) usuarioSelect.value = 'all';
        
        this.gastosFiltrados = this.gastos || [];
        this.mostrarGastos();
    }
    
    poblarFiltros() {
        this.poblarFiltroMeses();
        this.poblarFiltroAnios();
        this.poblarFiltroDias();
        this.poblarFiltroCategorias();
        this.poblarFiltroMetodosPago();
        this.poblarFiltroUsuarios();
    }

    // 🔥 NUEVO MÉTODO: Poblar filtro de usuarios
    // 🔥 CORREGIDO: Poblar filtro de usuarios
    poblarFiltroUsuarios() {
        const select = document.getElementById('filter-usuario');
        if (!select) return;
    
        select.innerHTML = '<option value="all">Todos los usuarios</option>';
    
        // Obtener usuarios únicos de los gastos existentes
        const usuariosUnicos = [...new Set(this.gastos.map(g => g.usuario).filter(Boolean))];
    
        if (usuariosUnicos.length === 0) {
            console.log('⚠️ No hay usuarios en los gastos para mostrar en el filtro');
            return;
        }
    
        usuariosUnicos.forEach(usuario => {
            const option = document.createElement('option');
            option.value = usuario;
            option.textContent = usuario;
            select.appendChild(option);
        });
    
        console.log('✅ Filtro de usuarios poblado:', usuariosUnicos);
    }

    poblarFiltroDias() {
        const select = document.getElementById('filter-day');
        if (!select) return;
    
        select.innerHTML = '<option value="all">Todos los días</option>';
    
        for (let dia = 1; dia <= 31; dia++) {
            const option = document.createElement('option');
            option.value = dia;
            option.textContent = dia;
            select.appendChild(option);
        }
    }
    
    poblarFiltroMeses() {
        const select = document.getElementById('filter-month');
        if (!select) return;
        
        select.innerHTML = '<option value="all">Todos los meses</option>';
        const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        
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
    
    mostrarModalGasto(gastoExistente = null) {
    const modal = document.getElementById('modal-gasto');
    const form = document.getElementById('gasto-form');
    const title = document.getElementById('modal-gasto-title');
    
    if (!modal) return;
    
    if (gastoExistente) {
        title.textContent = 'Editar Gasto';
        this.llenarFormularioGasto(gastoExistente);
    } else {
        title.textContent = 'Nuevo Gasto';
        if (form) form.reset();
        this.establecerValoresPorDefectoGasto();
    }
    
    this.poblarSelectCategorias();
    this.poblarSelectTarjetas();
    modal.style.display = 'block';
    document.body.classList.add('modal-open');

    // 🔥 CORRECCIÓN: Usar setTimeout más largo y verificar visibilidad antes de enfocar
    setTimeout(() => {
        console.log('🎯 Inicializando controles del modal...');
        this.actualizarCamposPorTipoGasto();
        this.actualizarCamposPagoMeses();
        this.actualizarEstadoVisualTarjeta();
        this.actualizarCamposPorUsuario();
        
        resetModalScroll();
        preventHorizontalScroll();
        
        // 🔥 CORRECCIÓN: Solo enfocar si el elemento es visible y no está deshabilitado
        const primerInput = this.obtenerPrimerInputVisible();
        if (primerInput) {
            setTimeout(() => {
                primerInput.focus();
            }, 100);
        }
    }, 300);
}

// 🔥 NUEVO MÉTODO: Obtener el primer input visible y enfocable
obtenerPrimerInputVisible() {
    const inputs = [
        document.getElementById('descripcion'),
        document.getElementById('monto'),
        document.getElementById('monto-mensual'),
        document.getElementById('fecha'),
        document.getElementById('categoria'),
        document.getElementById('tipo-gasto')
    ];
    
    for (let input of inputs) {
        if (input && 
            input.offsetParent !== null && // Verifica que no esté oculto
            !input.disabled && 
            input.type !== 'hidden') {
            return input;
        }
    }
    return null;
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
    console.log('📝 Llenando formulario para gasto:', gasto);
    
    // Limpiar formulario primero
    document.getElementById('descripcion').value = gasto.descripcion || '';
    document.getElementById('monto').value = gasto.monto || '';
    
    if (gasto.fecha) {
        const fecha = gasto.fecha.toDate ? gasto.fecha.toDate() : new Date(gasto.fecha);
        document.getElementById('fecha').value = fecha.toISOString().split('T')[0];
    }
    
    document.getElementById('categoria').value = gasto.categoria || '';
    document.getElementById('metodo-pago').value = gasto.metodoPago || 'efectivo';
    document.getElementById('tarjeta-gasto').value = gasto.tarjeta || '';
    document.getElementById('tipo-gasto').value = gasto.tipoGasto || 'interno';
    document.getElementById('pago-meses').value = gasto.pagoMeses || 'no';
    document.getElementById('total-meses').value = gasto.totalMeses || '3';

    // 🔥 NUEVO: Llenar monto mensual si existe
    if (gasto.montoMensual) {
        document.getElementById('monto-mensual').value = gasto.montoMensual;
    }
    
    // 🔥 CORRECCIÓN: Llenar usuario SI existe
    if (gasto.usuario) {
        document.getElementById('usuario-gasto').value = gasto.usuario;
        console.log('✅ Usuario cargado:', gasto.usuario);
    } else {
        document.getElementById('usuario-gasto').value = '';
        console.log('⚠️ No hay usuario en el gasto');
    }
    
    const form = document.getElementById('gasto-form');
    if (form) form.dataset.editingId = gasto.id;
    
    // 🔥 CORRECCIÓN: Poblar mes actual si es pago a meses
    if (gasto.pagoMeses === 'si' && gasto.totalMeses) {
        this.poblarSelectMesActual(parseInt(gasto.totalMeses));
        if (gasto.mesActual) {
            document.getElementById('mes-actual').value = gasto.mesActual;
            console.log('✅ Mes actual cargado:', gasto.mesActual);
        }
    } else {
        document.getElementById('mes-actual-container').style.display = 'none';
    }
    
    // 🔥 CORRECCIÓN MEJORADA: Actualizar controles con timeout para asegurar que los selects estén poblados
    setTimeout(() => {
        console.log('🔄 Actualizando controles del formulario...');
        this.actualizarCamposPorTipoGasto();
        this.actualizarCamposPagoMeses();
        this.actualizarEstadoVisualTarjeta();
        
        // 🔥 FORZAR: Verificar que los valores se mantengan
        if (gasto.usuario) {
            document.getElementById('usuario-gasto').value = gasto.usuario;
        }
        if (gasto.tarjeta) {
            document.getElementById('tarjeta-gasto').value = gasto.tarjeta;
        }
        
        console.log('✅ Formulario completamente cargado');
        console.log('📍 Usuario final:', document.getElementById('usuario-gasto').value);
        console.log('📍 Tarjeta final:', document.getElementById('tarjeta-gasto').value);
        console.log('📍 Tipo gasto final:', document.getElementById('tipo-gasto').value);
    }, 300);
}

    establecerValoresPorDefectoGasto() {
    document.getElementById('fecha').value = new Date().toISOString().split('T')[0];
    document.getElementById('metodo-pago').value = 'efectivo';
    document.getElementById('tipo-gasto').value = 'interno';
    document.getElementById('pago-meses').value = 'no';
    
    // 🔥 CORRECCIÓN: Asegurar que los campos estén en estado correcto
    setTimeout(() => {
        this.actualizarCamposPagoMeses();
        this.manejarCamposRequeridos();
    }, 100);
    
    // Limpiar campos de gasto recurrente
    document.getElementById('gasto-recurrente').value = '';
    const infoContainer = document.getElementById('gasto-recurrente-info');
    if (infoContainer) {
        infoContainer.remove();
    }
    
    const form = document.getElementById('gasto-form');
    if (form) delete form.dataset.editingId;
}

        // 🔥 NUEVO MÉTODO: Solo actualiza el aspecto visual sin deshabilitar
    actualizarEstadoVisualTarjeta() {
        const metodoPago = document.getElementById('metodo-pago').value;
        const tarjetaSelect = document.getElementById('tarjeta-gasto');
        const tarjetaLabel = document.querySelector('label[for="tarjeta-gasto"]');
    
        if (!tarjetaSelect) return;
    
        if (metodoPago === 'efectivo') {
            // Solo cambiar el estilo visual, no deshabilitar
            tarjetaSelect.required = false;
            if (tarjetaLabel) {
                tarjetaLabel.innerHTML = 'Tarjeta (No aplica para efectivo)';
                tarjetaLabel.style.color = '#6c757d';
            }
            //tarjetaSelect.style.backgroundColor = '#f8f9fa';
            //tarjetaSelect.style.color = '#6c757d';
        } else {
            // Habilitar visualmente
            tarjetaSelect.required = true;
            if (tarjetaLabel) {
                tarjetaLabel.innerHTML = 'Tarjeta <span style="color: red;">*</span>';
                tarjetaLabel.style.color = '';
            }
            tarjetaSelect.style.backgroundColor = '';
            tarjetaSelect.style.color = '';
        }
    }

    actualizarEstadoCampoTarjeta() {
    const metodoPago = document.getElementById('metodo-pago').value;
    const tarjetaSelect = document.getElementById('tarjeta-gasto');
    const tarjetaLabel = document.querySelector('label[for="tarjeta-gasto"]');
    
    if (!tarjetaSelect) return;
    
    if (metodoPago === 'efectivo') {
        // Deshabilitar y hacer opcional para efectivo
        tarjetaSelect.disabled = true;
        tarjetaSelect.required = false;
        tarjetaSelect.value = ''; // Limpiar selección
        if (tarjetaLabel) {
            tarjetaLabel.innerHTML = 'Tarjeta (No aplica para efectivo)';
        }
    } else {
        // Habilitar y hacer obligatorio para débito/crédito
        tarjetaSelect.disabled = false;
        tarjetaSelect.required = true;
        if (tarjetaLabel) {
            tarjetaLabel.innerHTML = 'Tarjeta <span style="color: red;">*</span>';
        }
    }
}
    
    async guardarGasto() {
    const userId = window.authManager?.getUserId();
    if (!userId) {
        this.mostrarMensaje('Usuario no autenticado', 'error');
        return;
    }
    
    const descripcion = document.getElementById('descripcion').value.trim();
    const montoInput = document.getElementById('monto');
    const montoMensualInput = document.getElementById('monto-mensual');
    const montoTotalInput = document.getElementById('monto-total');
    let fecha = document.getElementById('fecha').value;
    const categoria = document.getElementById('categoria').value;
    const metodoPago = document.getElementById('metodo-pago').value;
    const tarjeta = document.getElementById('tarjeta-gasto').value;
    const tipoGasto = document.getElementById('tipo-gasto').value;
    const usuario = document.getElementById('usuario-gasto').value;
    const pagoMeses = document.getElementById('pago-meses').value;
    const totalMeses = document.getElementById('total-meses').value;
    const mesActual = document.getElementById('mes-actual').value;
    
    if (!descripcion) {
        this.mostrarMensaje('La descripción es obligatoria', 'error');
        // 🔥 CORRECCIÓN: Enfocar el campo de descripción
        document.getElementById('descripcion').focus();
        return;
    }
    
    let monto, montoMensual, montoTotal;
    
    if (pagoMeses === 'si') {
        // 🔥 CORRECCIÓN: Usar value en lugar de solo la referencia
        montoMensual = parseFloat(montoMensualInput.value);
        if (isNaN(montoMensual) || montoMensual <= 0) {
            this.mostrarMensaje('El monto mensual debe ser un número mayor a 0', 'error');
            montoMensualInput.focus();
            return;
        }
        
        montoTotal = parseFloat(montoTotalInput.value);
        monto = montoMensual;
    } else {
        // 🔥 CORRECCIÓN: Usar value en lugar de solo la referencia
        monto = parseFloat(montoInput.value);
        if (isNaN(monto) || monto <= 0) {
            this.mostrarMensaje('El monto debe ser un número mayor a 0', 'error');
            montoInput.focus();
            return;
        }
        montoMensual = null;
        montoTotal = monto;
    }
    
    if (!fecha) {
        this.mostrarMensaje('La fecha es obligatoria', 'error');
        document.getElementById('fecha').focus();
        return;
    }
    
    if (!categoria) {
        this.mostrarMensaje('La categoría es obligatoria', 'error');
        document.getElementById('categoria').focus();
        return;
    }

    // Validación: Tarjeta obligatoria para débito/crédito
    if (metodoPago !== 'efectivo' && !tarjeta) {
        this.mostrarMensaje('Debes seleccionar una tarjeta para este método de pago', 'error');
        document.getElementById('tarjeta-gasto').focus();
        return;
    }

    // Validación: Usuario obligatorio
    if (!usuario) {
        this.mostrarMensaje('Debes seleccionar un usuario/persona', 'error');
        document.getElementById('usuario-gasto').focus();
        return;
    }

    // 🔥 CORRECCIÓN CLAVE: evitar cambio de zona horaria → usar fecha local exacta
    const fechaObj = new Date(fecha + 'T00:00:00');

    const nuevoGasto = {
        id: Date.now().toString(),
        descripcion,
        monto,
        montoMensual: pagoMeses === 'si' ? montoMensual : null,
        montoTotal: pagoMeses === 'si' ? montoTotal : monto,
        fecha: fechaObj,
        categoria,
        metodoPago,
        tarjeta: tarjeta || null,
        tipoGasto,
        usuario,
        pagoMeses,
        totalMeses: pagoMeses === 'si' ? totalMeses : null,
        mesActual: pagoMeses === 'si' ? mesActual : null,
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
        
        if (window.dashboard) {
            window.dashboard.loadDashboardData();
        }
    } catch (error) {
        console.error('Error guardando gasto:', error);
        this.mostrarMensaje('Error al guardar gasto', 'error');
    }
}
    
    // 🔥 NUEVO MÉTODO: Manejar campos required dinámicamente
manejarCamposRequeridos() {
    const pagoMeses = document.getElementById('pago-meses').value;
    const montoInput = document.getElementById('monto');
    const montoMensualInput = document.getElementById('monto-mensual');
    
    if (pagoMeses === 'si') {
        montoInput.required = false;
        montoMensualInput.required = true;
    } else {
        montoInput.required = true;
        montoMensualInput.required = false;
    }
}

    cerrarModalGasto() {
        const modal = document.getElementById('modal-gasto');
        if (modal) modal.style.display = 'none';
        document.body.classList.remove('modal-open');
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
            
            if (window.dashboard) window.dashboard.loadDashboardData();
        } catch (error) {
            console.error('Error eliminando gasto:', error);
            this.mostrarMensaje('Error al eliminar gasto', 'error');
        }
    }
    
    mostrarMensaje(mensaje, tipo = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${tipo}`;
        notification.innerHTML = `<span>${tipo === 'success' ? '✅' : tipo === 'error' ? '❌' : 'ℹ️'} ${mensaje}</span>`;
        document.body.appendChild(notification);
        
        setTimeout(() => { 
            if (notification.parentElement) notification.remove(); 
        }, 4000);
    }
}

// Funciones auxiliares para mejor experiencia en móviles
function resetModalScroll() {
    const modalContent = document.querySelector('.modal-content');
    if (modalContent) {
        modalContent.scrollTop = 0;
    }
}

function preventHorizontalScroll() {
    const modalForms = document.querySelectorAll('.modal-form');
    modalForms.forEach(form => {
        form.addEventListener('touchmove', function(e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            e.preventDefault();
        }, { passive: false });
    });
}

window.gastosApp = new GastosApp();