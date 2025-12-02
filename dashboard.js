// dashboard.js - ACTUALIZADO CON NUEVAS MEJORAS
class Dashboard {
    constructor() {
        this.currentMonth = new Date().getMonth() + 1;
        this.currentYear = new Date().getFullYear();
        this.mesesComparativa = 6;
        this.init();
    }
    
    init() {
        console.log('🚀 Inicializando Dashboard...');
        this.setupEventListeners();
        this.populateMonthSelect();
        this.populateYearSelect();
        this.setCurrentMonth();
        this.loadDashboardData();
    }
    
    setupEventListeners() {
        const monthSelect = document.getElementById('dashboard-month');
        const yearSelect = document.getElementById('dashboard-year');
        
        if (monthSelect) {
            monthSelect.addEventListener('change', (e) => {
                this.currentMonth = parseInt(e.target.value);
                this.loadDashboardData();
            });
        }
        
        if (yearSelect) {
            yearSelect.addEventListener('change', (e) => {
                this.currentYear = parseInt(e.target.value);
                this.loadDashboardData();
            });
        }

        // Configurar selector de comparativa si existe
        const comparativaSelect = document.getElementById('comparativa-range');
        if (comparativaSelect) {
            comparativaSelect.addEventListener('change', (e) => {
                this.mesesComparativa = parseInt(e.target.value);
                this.loadDashboardData();
            });
        }
    }
    
    populateMonthSelect() {
        const monthSelect = document.getElementById('dashboard-month');
        if (!monthSelect) return;
        
        monthSelect.innerHTML = '';
        const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        
        meses.forEach((mes, index) => {
            const option = document.createElement('option');
            option.value = index + 1;
            option.textContent = mes;
            if (index + 1 === this.currentMonth) option.selected = true;
            monthSelect.appendChild(option);
        });
    }
    
    populateYearSelect() {
        const yearSelect = document.getElementById('dashboard-year');
        if (!yearSelect) return;
        
        yearSelect.innerHTML = '';
        const currentYear = new Date().getFullYear();
        
        for (let year = currentYear - 2; year <= currentYear + 2; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            if (year === currentYear) option.selected = true;
            yearSelect.appendChild(option);
        }
    }
    
    setCurrentMonth() {
        const monthSelect = document.getElementById('dashboard-month');
        if (monthSelect) monthSelect.value = this.currentMonth;
    }

    async loadDashboardData() {
        const userId = window.authManager?.getUserId();
        if (!userId) {
            console.log('❌ Usuario no autenticado');
            return;
        }

        try {
            console.log('📊 Cargando datos del dashboard...');
            
            // Cargar datos principales
            const gastos = await this.getGastosDelMes(userId);
            const gastosHistoricos = await this.getGastosHistoricos(userId, this.mesesComparativa);
            const presupuesto = await this.getPresupuestoActual(userId);
            const categorias = await this.getCategorias(userId);
            const tareas = await this.getTareasPendientes(userId);
            const usuarios = await this.getUsuariosPersonas();

            // Verificar si presupuesto está habilitado
            const togglePresupuesto = document.getElementById('toggle-presupuesto');
            const presupuestoHabilitado = togglePresupuesto?.checked !== false;

            const stats = this.calculateStats(gastos, presupuestoHabilitado ? presupuesto : null, categorias);
            const comparativaStats = this.calculateComparativaStats(gastosHistoricos);
            const statsUsuarios = this.calculateStatsPorUsuario(gastos, usuarios);
            const statsMetodosDetallados = this.calculateStatsMetodosDetallados(gastos, categorias);

            this.updateKPICards(stats);
            this.updateAlerts(stats, presupuesto);
            this.updateCharts(stats, comparativaStats, statsUsuarios, statsMetodosDetallados);
            this.updateTareasPendientes(tareas);
            this.updateResumenPagos(gastos);

            console.log('✅ Dashboard actualizado correctamente');
        } catch (error) {
            console.error('❌ Error en dashboard:', error);
            this.showMensaje('Error cargando datos del dashboard', 'error');
        }
    }

    async getGastosHistoricos(userId, meses) {
        try {
            const docRef = firebaseDb.collection(userId).doc('gastos');
            const doc = await docRef.get();
            if (!doc.exists) return [];
            
            const todosLosGastos = doc.data().items || [];
            console.log(`📈 Gastos totales: ${todosLosGastos.length}`);
            
            if (todosLosGastos.length === 0) return [];
            
            const fechaLimite = new Date();
            fechaLimite.setMonth(fechaLimite.getMonth() - meses);
            
            const gastosFiltrados = todosLosGastos.filter(gasto => {
                try {
                    const fechaGasto = gasto.fecha?.toDate ? gasto.fecha.toDate() : new Date(gasto.fecha);
                    return fechaGasto >= fechaLimite && fechaGasto <= new Date();
                } catch (error) {
                    console.warn('Error procesando fecha de gasto:', gasto);
                    return false;
                }
            });
            
            console.log(`📊 Gastos históricos (últimos ${meses} meses): ${gastosFiltrados.length}`);
            return gastosFiltrados;
        } catch (error) {
            console.error('❌ Error obteniendo gastos históricos:', error);
            return [];
        }
    }

    async getUsuariosPersonas() {
        try {
            const usuarios = [];
            // Solo buscar usuarios activos
            for (let i = 1; i <= 10; i++) {
                const userId = `user${i}`;
                try {
                    const docRef = firebaseDb.collection(userId).doc('usuario');
                    const doc = await docRef.get();
                    if (doc.exists) {
                        const userData = doc.data();
                        usuarios.push({
                            id: userId,
                            nombre: userData.nombre || `Usuario ${i}`,
                            tipo: userData.tipo || 'usuario'
                        });
                    }
                } catch (error) {
                    // Usuario no existe o error de conexión
                    continue;
                }
            }
            
            console.log(`👥 Usuarios encontrados: ${usuarios.length}`);
            return usuarios;
        } catch (error) {
            console.error('❌ Error obteniendo usuarios:', error);
            return [];
        }
    }

    calculateComparativaStats(gastosHistoricos) {
        if (!gastosHistoricos || !Array.isArray(gastosHistoricos) || gastosHistoricos.length === 0) {
            console.log('⚠️ No hay datos históricos para comparativa');
            return [];
        }
        
        console.log(`📊 Calculando comparativa de ${gastosHistoricos.length} gastos`);
        
        const mesesMap = new Map();
        const mesesOrdenados = [];
        
        // Procesar todos los gastos
        gastosHistoricos.forEach(gasto => {
            try {
                const fechaGasto = gasto.fecha?.toDate ? gasto.fecha.toDate() : new Date(gasto.fecha);
                const año = fechaGasto.getFullYear();
                const mes = fechaGasto.getMonth() + 1;
                const clave = `${año}-${mes.toString().padStart(2, '0')}`;
                const nombreMes = this.getNombreMes(mes);
                const mesCompleto = `${nombreMes} ${año}`;
                
                if (!mesesMap.has(clave)) {
                    mesesMap.set(clave, {
                        mes: mesCompleto,
                        total: 0,
                        clave: clave,
                        fecha: new Date(año, mes - 1, 1)
                    });
                }
                
                const mesData = mesesMap.get(clave);
                mesData.total += parseFloat(gasto.monto) || 0;
                
            } catch (error) {
                console.warn('⚠️ Error procesando gasto para comparativa:', gasto);
            }
        });
        
        // Convertir a array y ordenar por fecha
        const mesesArray = Array.from(mesesMap.values());
        mesesArray.sort((a, b) => a.fecha - b.fecha);
        
        // Tomar solo los últimos N meses
        const resultado = mesesArray.slice(-this.mesesComparativa);
        
        console.log(`📈 Comparativa generada: ${resultado.length} meses`);
        console.log('Meses:', resultado.map(m => m.mes));
        
        return resultado;
    }

    calculateStatsPorUsuario(gastos, usuarios) {
        if (!gastos || !Array.isArray(gastos) || gastos.length === 0) {
            return {};
        }
        
        const stats = {};
        
        // Inicializar todos los usuarios encontrados
        usuarios.forEach(usuario => {
            stats[usuario.nombre] = {
                total: 0,
                porMetodo: {
                    efectivo: 0,
                    debito: 0,
                    credito: 0
                }
            };
        });
        
        // Procesar gastos
        gastos.forEach(gasto => {
            if (gasto.usuario && stats[gasto.usuario]) {
                stats[gasto.usuario].total += parseFloat(gasto.monto) || 0;
                
                // Agrupar por método de pago
                const metodo = gasto.metodoPago || 'efectivo';
                if (['efectivo', 'debito', 'credito'].includes(metodo)) {
                    stats[gasto.usuario].porMetodo[metodo] += parseFloat(gasto.monto) || 0;
                }
            }
        });
        
        // Filtrar usuarios con gastos
        const usuariosConGastos = {};
        Object.keys(stats).forEach(usuario => {
            if (stats[usuario].total > 0) {
                usuariosConGastos[usuario] = stats[usuario];
            }
        });
        
        console.log(`👥 Usuarios con gastos: ${Object.keys(usuariosConGastos).length}`);
        return usuariosConGastos;
    }

    calculateStatsMetodosDetallados(gastos, categorias) {
        if (!gastos || !Array.isArray(gastos) || gastos.length === 0) {
            return {};
        }
        
        const stats = {};
        
        gastos.forEach(gasto => {
            if (gasto.metodoPago && gasto.tarjeta && gasto.categoria) {
                const clave = `${gasto.tarjeta}-${gasto.metodoPago}`;
                
                if (!stats[clave]) {
                    stats[clave] = {
                        tarjeta: gasto.tarjeta,
                        metodo: gasto.metodoPago,
                        total: 0,
                        porCategoria: {}
                    };
                }
                
                stats[clave].total += parseFloat(gasto.monto) || 0;
                
                if (!stats[clave].porCategoria[gasto.categoria]) {
                    stats[clave].porCategoria[gasto.categoria] = 0;
                }
                stats[clave].porCategoria[gasto.categoria] += parseFloat(gasto.monto) || 0;
            }
        });
        
        console.log(`💳 Métodos detallados: ${Object.keys(stats).length}`);
        return stats;
    }

    getNombreMes(mes) {
        const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        return meses[mes - 1] || `Mes ${mes}`;
    }

    getNombreMetodo(metodo) {
        const nombres = {
            'efectivo': '💵 Efectivo',
            'debito': '🏦 Débito',
            'credito': '💳 Crédito'
        };
        return nombres[metodo] || metodo;
    }

    updateCharts(stats, comparativaStats = [], statsUsuarios = {}, statsMetodosDetallados = {}) {
        console.log('🎨 Actualizando gráficas...');
        
        // Actualizar gráficas existentes del dashboard
        this.updatePieChart(stats.porCategoria);
        this.updateEvolucionChart(stats);
        this.updateBudgetChart(stats);
        this.updatePaymentChart(stats.porMetodoPago);
        
        // Actualizar nuevas gráficas del dashboard
        this.updateComparativaMensual(comparativaStats);
        this.updateGraficaPorUsuario(statsUsuarios);
        this.updateGraficaMetodosDetallados(statsMetodosDetallados);
        this.updateEvolucionTemporal(comparativaStats);
    }

    // CORREGIDO: Gráfica de Evolución de Gastos (existente)
    updateEvolucionChart(stats) {
        const container = document.getElementById('chart-evolution');
        if (!container) {
            console.log('❌ Contenedor chart-evolution no encontrado');
            return;
        }
        
        // Si no hay datos de días, mostrar estado vacío
        if (!stats.gastosPorDia || Object.keys(stats.gastosPorDia).length === 0) {
            container.innerHTML = this.getEmptyStateHTML('📈', 'No hay datos de evolución diaria');
            return;
        }
        
        try {
            const dias = Object.keys(stats.gastosPorDia).sort();
            const montos = dias.map(dia => stats.gastosPorDia[dia]);
            
            const data = [{
                x: dias.map(dia => `Día ${dia}`),
                y: montos,
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Gasto Diario',
                line: { 
                    color: '#4361ee',
                    width: 3
                },
                marker: {
                    size: 8,
                    color: '#7209b7'
                }
            }];
            
            const layout = {
                title: 'Evolución de Gastos',
                height: 300,
                margin: { t: 40, b: 50, l: 60, r: 30 },
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                xaxis: {
                    title: 'Día del Mes',
                    gridcolor: 'rgba(255,255,255,0.1)',
                    tickangle: -45
                },
                yaxis: {
                    title: 'Monto ($)',
                    gridcolor: 'rgba(255,255,255,0.1)',
                    tickformat: '$.0f'
                },
                hovermode: 'closest'
            };
            
            Plotly.newPlot(container, data, layout, { 
                displayModeBar: true,
                responsive: true,
                displaylogo: false
            });
            
            console.log('✅ Gráfica de evolución actualizada');
        } catch (error) {
            console.error('❌ Error actualizando gráfica de evolución:', error);
            container.innerHTML = this.getErrorStateHTML('📈', 'Error cargando evolución');
        }
    }

    updateComparativaMensual(comparativaStats) {
        const container = document.getElementById('chart-comparativa-mensual');
        if (!container) {
            console.log('❌ Contenedor chart-comparativa-mensual no encontrado');
            return;
        }
        
        if (!comparativaStats || comparativaStats.length === 0) {
            container.innerHTML = this.getEmptyStateHTML('📊', 'No hay datos para comparativa mensual');
            return;
        }
        
        try {
            const meses = comparativaStats.map(item => item.mes);
            const totales = comparativaStats.map(item => item.total);
            
            const data = [{
                x: meses,
                y: totales,
                type: 'bar',
                name: 'Gasto Mensual',
                marker: {
                    color: totales.map((total, index) => {
                        // Colores diferentes para destacar el mes actual
                        if (index === totales.length - 1) return '#4361ee'; // Último mes (más reciente)
                        return index % 2 === 0 ? '#4CAF50' : '#2196F3';
                    }),
                    line: {
                        width: 2,
                        color: 'rgba(0,0,0,0.3)'
                    }
                },
                text: totales.map(t => `$${t.toFixed(2)}`),
                textposition: 'auto',
                textfont: {
                    size: 10,
                    color: 'white'
                }
            }];
            
            const layout = {
                title: 'Comparativa Mensual',
                height: 300,
                margin: { t: 40, b: 80, l: 60, r: 30 },
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                xaxis: {
                    title: 'Mes',
                    gridcolor: 'rgba(255,255,255,0.1)',
                    tickangle: -45
                },
                yaxis: {
                    title: 'Monto ($)',
                    gridcolor: 'rgba(255,255,255,0.1)',
                    tickformat: '$.0f'
                },
                hovermode: 'closest',
                bargap: 0.3
            };
            
            Plotly.newPlot(container, data, layout, { 
                displayModeBar: true,
                responsive: true,
                displaylogo: false
            });
            
            console.log('✅ Gráfica de comparativa mensual actualizada');
        } catch (error) {
            console.error('❌ Error actualizando comparativa mensual:', error);
            container.innerHTML = this.getErrorStateHTML('📊', 'Error cargando comparativa');
        }
    }

    // CORREGIDO: Gráfica por Usuario
    updateGraficaPorUsuario(statsUsuarios) {
        const container = document.getElementById('chart-por-usuario');
        if (!container) {
            console.log('❌ Contenedor chart-por-usuario no encontrado');
            return;
        }
        
        const usuarios = Object.keys(statsUsuarios);
        if (usuarios.length === 0) {
            container.innerHTML = this.getEmptyStateHTML('👥', 'No hay datos por usuario');
            return;
        }
        
        try {
            const metodos = ['efectivo', 'debito', 'credito'];
            const colores = ['#FF6B6B', '#4ECDC4', '#45B7D1'];
            const datos = [];
            
            metodos.forEach((metodo, index) => {
                const valores = usuarios.map(usuario => 
                    statsUsuarios[usuario].porMetodo?.[metodo] || 0
                );
                
                // Solo agregar si hay valores mayores a 0
                if (valores.some(v => v > 0)) {
                    datos.push({
                        x: usuarios,
                        y: valores,
                        name: this.getNombreMetodo(metodo),
                        type: 'bar',
                        marker: {
                            color: colores[index]
                        }
                    });
                }
            });
            
            if (datos.length === 0) {
                container.innerHTML = this.getEmptyStateHTML('👥', 'No hay datos por método de pago');
                return;
            }
            
            const layout = {
                title: 'Gastos por Usuario',
                height: 300,
                barmode: 'stack',
                margin: { t: 40, b: 80, l: 60, r: 30 },
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                xaxis: {
                    title: 'Usuario',
                    gridcolor: 'rgba(255,255,255,0.1)'
                },
                yaxis: {
                    title: 'Monto ($)',
                    gridcolor: 'rgba(255,255,255,0.1)',
                    tickformat: '$.0f'
                },
                legend: {
                    orientation: 'h',
                    y: -0.2
                }
            };
            
            Plotly.newPlot(container, datos, layout, { 
                displayModeBar: true,
                responsive: true,
                displaylogo: false
            });
            
            console.log('✅ Gráfica por usuario actualizada');
        } catch (error) {
            console.error('❌ Error actualizando gráfica por usuario:', error);
            container.innerHTML = this.getErrorStateHTML('👥', 'Error cargando gráfica');
        }
    }

    // CORREGIDO: Gráfica de Métodos Detallados
    updateGraficaMetodosDetallados(statsMetodosDetallados) {
        const container = document.getElementById('chart-metodos-detallados');
        if (!container) {
            console.log('❌ Contenedor chart-metodos-detallados no encontrado');
            return;
        }
        
        const metodos = Object.keys(statsMetodosDetallados);
        if (metodos.length === 0) {
            container.innerHTML = this.getEmptyStateHTML('💳', 'No hay datos detallados de tarjetas');
            return;
        }
        
        try {
            // Obtener todas las categorías únicas
            const categoriasSet = new Set();
            metodos.forEach(clave => {
                Object.keys(statsMetodosDetallados[clave].porCategoria || {}).forEach(categoria => {
                    categoriasSet.add(categoria);
                });
            });
            
            const categorias = Array.from(categoriasSet);
            const datos = [];
            const colores = ['#FF9F1C', '#2EC4B6', '#E71D36', '#011627', '#FF3366', '#20A4F3'];
            
            categorias.forEach((categoria, catIndex) => {
                const valores = metodos.map(clave => 
                    statsMetodosDetallados[clave].porCategoria?.[categoria] || 0
                );
                
                // Solo agregar si hay valores mayores a 0
                if (valores.some(v => v > 0)) {
                    const labels = metodos.map(clave => {
                        const data = statsMetodosDetallados[clave];
                        const icono = data.metodo === 'credito' ? '💳' : '🏦';
                        return `${icono} ${data.tarjeta}`;
                    });
                    
                    datos.push({
                        x: labels,
                        y: valores,
                        name: categoria,
                        type: 'bar',
                        marker: {
                            color: colores[catIndex % colores.length]
                        }
                    });
                }
            });
            
            if (datos.length === 0) {
                container.innerHTML = this.getEmptyStateHTML('💳', 'No hay datos por categoría');
                return;
            }
            
            const layout = {
                title: 'Gastos por Tarjeta y Categoría',
                height: 300,
                barmode: 'stack',
                margin: { t: 40, b: 100, l: 60, r: 30 },
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                xaxis: {
                    title: 'Tarjeta',
                    gridcolor: 'rgba(255,255,255,0.1)',
                    tickangle: -45
                },
                yaxis: {
                    title: 'Monto ($)',
                    gridcolor: 'rgba(255,255,255,0.1)',
                    tickformat: '$.0f'
                },
                legend: {
                    orientation: 'h',
                    y: -0.3
                }
            };
            
            Plotly.newPlot(container, datos, layout, { 
                displayModeBar: true,
                responsive: true,
                displaylogo: false
            });
            
            console.log('✅ Gráfica de métodos detallados actualizada');
        } catch (error) {
            console.error('❌ Error actualizando gráfica de métodos:', error);
            container.innerHTML = this.getErrorStateHTML('💳', 'Error cargando gráfica');
        }
    }

    // CORREGIDO: Gráfica de Evolución Temporal
    updateEvolucionTemporal(comparativaStats) {
        const container = document.getElementById('chart-evolucion');
        if (!container) {
            console.log('❌ Contenedor chart-evolucion no encontrado');
            return;
        }
        
        if (!comparativaStats || comparativaStats.length === 0) {
            container.innerHTML = this.getEmptyStateHTML('📈', 'No hay datos de evolución temporal');
            return;
        }
        
        try {
            const meses = comparativaStats.map(item => item.mes);
            const totales = comparativaStats.map(item => item.total);
            
            // Calcular promedios móviles (3 meses)
            const promediosMoviles = [];
            for (let i = 0; i < totales.length; i++) {
                const inicio = Math.max(0, i - 2);
                const fin = i + 1;
                const slice = totales.slice(inicio, fin);
                const promedio = slice.reduce((a, b) => a + b, 0) / slice.length;
                promediosMoviles.push(promedio);
            }
            
            const data = [
                {
                    x: meses,
                    y: totales,
                    type: 'bar',
                    name: 'Gasto Mensual',
                    marker: { 
                        color: '#4361ee',
                        opacity: 0.7
                    }
                },
                {
                    x: meses,
                    y: promediosMoviles,
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'Tendencia (3 meses)',
                    line: { 
                        color: '#FF6B6B', 
                        width: 3,
                        dash: 'dot'
                    },
                    marker: { 
                        size: 8,
                        color: '#FF6B6B'
                    }
                }
            ];
            
            const layout = {
                title: 'Evolución Temporal',
                height: 300,
                margin: { t: 40, b: 80, l: 60, r: 30 },
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                xaxis: {
                    title: 'Mes',
                    gridcolor: 'rgba(255,255,255,0.1)',
                    tickangle: -45
                },
                yaxis: {
                    title: 'Monto ($)',
                    gridcolor: 'rgba(255,255,255,0.1)',
                    tickformat: '$.0f'
                },
                legend: {
                    orientation: 'h',
                    y: -0.2
                }
            };
            
            Plotly.newPlot(container, data, layout, { 
                displayModeBar: true,
                responsive: true,
                displaylogo: false
            });
            
            console.log('✅ Gráfica de evolución temporal actualizada');
        } catch (error) {
            console.error('❌ Error actualizando evolución temporal:', error);
            container.innerHTML = this.getErrorStateHTML('📈', 'Error cargando evolución');
        }
    }

    async getTareasPendientes(userId) {
        try {
            const docRef = firebaseDb.collection(userId).doc('tareas');
            const doc = await docRef.get();
            if (doc.exists) {
                const data = doc.data();
                return (data.items || []).filter(t => t.estado === 'pendiente');
            }
            return [];
        } catch (error) {
            console.error('Error obteniendo tareas:', error);
            return [];
        }
    }

    // Métodos auxiliares para estados de gráficas
    getEmptyStateHTML(icono, mensaje) {
        return `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--text-light);text-align:center;padding:2rem;">
                <div style="font-size:3rem;margin-bottom:1rem;opacity:0.5;">${icono}</div>
                <p style="font-size:0.9rem;margin-bottom:0.5rem;">${mensaje}</p>
                <small style="font-size:0.8rem;opacity:0.7;">Agrega más gastos para ver datos</small>
            </div>
        `;
    }

    getErrorStateHTML(icono, mensaje) {
        return `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#f44336;text-align:center;padding:2rem;">
                <div style="font-size:3rem;margin-bottom:1rem;">${icono}</div>
                <p style="font-size:0.9rem;margin-bottom:1rem;">${mensaje}</p>
                <button class="btn btn-outline btn-sm" onclick="window.dashboard?.loadDashboardData()" 
                        style="padding:0.5rem 1rem;font-size:0.8rem;">
                    Reintentar
                </button>
            </div>
        `;
    }

    showMensaje(mensaje, tipo = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${tipo}`;
        notification.innerHTML = `<span>${tipo === 'success' ? '✅' : tipo === 'error' ? '❌' : 'ℹ️'} ${mensaje}</span>`;
        document.body.appendChild(notification);
        
        setTimeout(() => { 
            if (notification.parentElement) notification.remove(); 
        }, 4000);
    }

    async getCategorias(userId) {
        try {
            const docRef = firebaseDb.collection(userId).doc('categorias');
            const doc = await docRef.get();
            if (doc.exists) {
                const data = doc.data();
                return data.items || [];
            }
            return [];
        } catch (error) {
            console.error('Error obteniendo categorías:', error);
            return [];
        }
    }

    async getGastosDelMes(userId) {
        try {
            const docRef = firebaseDb.collection(userId).doc('gastos');
            const doc = await docRef.get();
            if (!doc.exists) return [];
            const data = doc.data();
            const todosLosGastos = data.items || [];
            const startDate = new Date(this.currentYear, this.currentMonth - 1, 1);
            const endDate = new Date(this.currentYear, this.currentMonth, 0, 23, 59, 59);
            const gastosDelMes = todosLosGastos.filter(gasto => {
                const fechaGasto = gasto.fecha.toDate ? gasto.fecha.toDate() : new Date(gasto.fecha);
                return fechaGasto >= startDate && fechaGasto <= endDate;
            });
            return gastosDelMes;
        } catch (error) {
            console.error('Error obteniendo gastos:', error);
            return [];
        }
    }

    async getPresupuestoActual(userId) {
        try {
            const docRef = firebaseDb.collection(userId).doc('presupuestos');
            const doc = await docRef.get();
            if (!doc.exists) return null;
            const data = doc.data();
            const presupuestos = data.items || [];
            return presupuestos.find(p => p.mes === this.currentMonth && p.anio === this.currentYear) || null;
        } catch (error) {
            console.error('Error obteniendo presupuesto:', error);
            return null;
        }
    }

    calculateStats(gastos, presupuesto, categorias = []) {
        const totalGastado = gastos.reduce((sum, g) => sum + (g.monto || 0), 0);
        const numGastos = gastos.length;
        const hoy = new Date();
        const primerDiaMes = new Date(this.currentYear, this.currentMonth - 1, 1);
        const diasTranscurridos = Math.max(1, Math.floor((hoy - primerDiaMes) / (1000 * 60 * 60 * 24)) + 1);
        const promedioDiario = totalGastado / diasTranscurridos;

        const porCategoria = {};
        gastos.forEach(gasto => {
            if (!porCategoria[gasto.categoria]) porCategoria[gasto.categoria] = 0;
            porCategoria[gasto.categoria] += gasto.monto;
        });

        const porMetodoPago = {};
        gastos.forEach(gasto => {
            const clave = gasto.metodoPago === 'credito' || gasto.metodoPago === 'debito' 
                ? (gasto.tarjeta ? `${gasto.metodoPago}-${gasto.tarjeta}` : gasto.metodoPago)
                : gasto.metodoPago;
            if (!porMetodoPago[clave]) porMetodoPago[clave] = { total: 0, metodo: gasto.metodoPago, tarjeta: gasto.tarjeta || null };
            porMetodoPago[clave].total += gasto.monto;
        });

        const tendencia = this.calculateTrend(gastos);
        return { totalGastado, numGastos, promedioDiario, porCategoria, porMetodoPago, presupuesto, tendencia, diasTranscurridos, totalCategorias: categorias.length };
    }

    calculateTrend(gastos) {
        if (gastos.length === 0) return 'stable';
        const gastosPorDia = {};
        gastos.forEach(gasto => {
            const fechaGasto = gasto.fecha.toDate ? gasto.fecha.toDate() : new Date(gasto.fecha);
            const dia = fechaGasto.getDate();
            if (!gastosPorDia[dia]) gastosPorDia[dia] = 0;
            gastosPorDia[dia] += gasto.monto;
        });
        const dias = Object.keys(gastosPorDia).map(Number).sort((a, b) => a - b);
        if (dias.length < 7) return 'stable';
        const primeraSemana = dias.slice(0, 7).reduce((sum, dia) => sum + (gastosPorDia[dia] || 0), 0) / 7;
        const ultimaSemana = dias.slice(-7).reduce((sum, dia) => sum + (gastosPorDia[dia] || 0), 0) / 7;
        if (ultimaSemana > primeraSemana * 1.2) return 'up';
        if (ultimaSemana < primeraSemana * 0.8) return 'down';
        return 'stable';
    }

    updateKPICards(stats) {
        this.updateTotalGastado(stats);
        this.updatePresupuesto(stats);
        this.updateGastosCount(stats);
        this.updatePromedioDiario(stats);
    }

    updateTotalGastado(stats) {
        const totalElement = document.getElementById('total-gastado');
        const trendElement = document.getElementById('total-trend');
        if (totalElement) totalElement.textContent = `$${stats.totalGastado.toFixed(2)}`;
        if (trendElement) {
            let text = '→ Estable', color = '#2196F3';
            if (stats.tendencia === 'up') { text = '↑ En aumento'; color = '#FF9800'; }
            else if (stats.tendencia === 'down') { text = '↓ Disminuyendo'; color = '#4CAF50'; }
            trendElement.textContent = text;
            trendElement.style.color = color;
        }
    }

    updatePresupuesto(stats) {
        const presupuestoElement = document.getElementById('total-presupuesto');
        const progressFill = document.getElementById('budget-progress');
        const progressPercentage = document.getElementById('budget-percentage');
        const budgetAvailable = document.getElementById('budget-available');

        const togglePresupuesto = document.getElementById('toggle-presupuesto');
        const estaHabilitado = togglePresupuesto?.checked !== false;

        if (!estaHabilitado) {
            if (presupuestoElement) presupuestoElement.textContent = 'Deshabilitado';
            if (progressFill) {
                progressFill.style.width = '0%';
                progressFill.style.background = '#ccc';
            }
            if (progressPercentage) {
                progressPercentage.textContent = '—';
                progressPercentage.style.color = '#666';
            }
            if (budgetAvailable) {
                budgetAvailable.textContent = '—';
                budgetAvailable.style.color = '#666';
            }
            return;
        }

        if (stats.presupuesto) {
            presupuestoElement.textContent = `$${stats.presupuesto.monto.toFixed(2)}`;
            const porcentajeUso = stats.presupuesto.monto > 0 ? (stats.totalGastado / stats.presupuesto.monto) * 100 : 0;
            const ancho = Math.min(porcentajeUso, 100);
            progressFill.style.width = `${ancho}%`;
            progressPercentage.textContent = `${porcentajeUso.toFixed(1)}%`;

            if (porcentajeUso >= 100) {
                progressFill.style.background = '#f44336';
                progressPercentage.style.color = '#f44336';
            } else if (porcentajeUso >= 80) {
                progressFill.style.background = '#FF9800';
                progressPercentage.style.color = '#FF9800';
            } else {
                progressFill.style.background = '#4CAF50';
                progressPercentage.style.color = '#4CAF50';
            }

            const disponible = stats.presupuesto.monto - stats.totalGastado;
            if (budgetAvailable) {
                budgetAvailable.textContent = `$${disponible.toFixed(2)}`;
                budgetAvailable.style.color = disponible >= 0 ? '#4CAF50' : '#f44336';
            }
        } else {
            if (presupuestoElement) presupuestoElement.textContent = 'Sin presupuesto';
            if (progressFill) {
                progressFill.style.width = '0%';
                progressFill.style.background = '#666';
            }
            if (progressPercentage) {
                progressPercentage.textContent = '0%';
                progressPercentage.style.color = '#666';
            }
            if (budgetAvailable) {
                budgetAvailable.textContent = '$0.00';
                budgetAvailable.style.color = '#666';
            }
        }
    }

    updateGastosCount(stats) {
        const monthCount = document.getElementById('month-count');
        const monthTrend = document.getElementById('month-trend');
        if (monthCount) monthCount.textContent = stats.numGastos;
        if (monthTrend) {
            let trendText = '→ Normal';
            if (stats.numGastos > 50) trendText = '↑ Alto volumen';
            else if (stats.numGastos < 5) trendText = '↓ Bajo volumen';
            monthTrend.textContent = trendText;
        }
    }

    updatePromedioDiario(stats) {
        const promedioElement = document.getElementById('promedio-diario');
        const dailyTrend = document.getElementById('daily-trend');
        if (promedioElement) promedioElement.textContent = `$${stats.promedioDiario.toFixed(2)}`;
        if (dailyTrend) {
            let trendText = '→ Normal', trendColor = '#2196F3';
            if (stats.promedioDiario > 1000) { trendText = '↑ Alto gasto diario'; trendColor = '#FF9800'; }
            else if (stats.promedioDiario < 100) { trendText = '↓ Bajo gasto diario'; trendColor = '#4CAF50'; }
            dailyTrend.textContent = trendText;
            dailyTrend.style.color = trendColor;
        }
    }

    updateAlerts(stats, presupuesto) {
        const container = document.getElementById('alertas-container');
        if (!container) return;
        const alertas = this.generateAlerts(stats, presupuesto);
        container.innerHTML = '';
        if (alertas.length === 0) {
            container.innerHTML = `<div class="alerta success"><span>✅ Todo está bajo control. ¡Buen trabajo gestionando tus gastos!</span></div>`;
            return;
        }
        alertas.forEach(alerta => {
            const el = document.createElement('div');
            el.className = `alerta ${alerta.tipo}`;
            el.innerHTML = `<span>${alerta.icono} ${alerta.mensaje}</span>`;
            container.appendChild(el);
        });
    }

    generateAlerts(stats, presupuesto) {
        const alertas = [];
        const togglePresupuesto = document.getElementById('toggle-presupuesto');
        const estaHabilitado = togglePresupuesto?.checked !== false;

        if (estaHabilitado && presupuesto) {
            const porcentajeUso = presupuesto.monto > 0 ? (stats.totalGastado / presupuesto.monto) * 100 : 0;
            if (porcentajeUso >= 100) {
                alertas.push({ tipo: 'excedido', mensaje: `Has excedido tu presupuesto mensual en $${(stats.totalGastado - presupuesto.monto).toFixed(2)} (${(porcentajeUso - 100).toFixed(1)}%)`, icono: '🚨' });
            } else if (porcentajeUso >= 80) {
                alertas.push({ tipo: 'cerca', mensaje: `Has usado el ${porcentajeUso.toFixed(1)}% de tu presupuesto. Te quedan $${(presupuesto.monto - stats.totalGastado).toFixed(2)}`, icono: '⚠️' });
            }
        } else if (estaHabilitado && !presupuesto) {
            alertas.push({ tipo: 'normal', mensaje: 'No tienes un presupuesto configurado para este mes.', icono: '💡' });
        }

        if (stats.promedioDiario > 1000) {
            alertas.push({ tipo: 'normal', mensaje: `Tu gasto diario promedio es de $${stats.promedioDiario.toFixed(2)}.`, icono: '💰' });
        }

        const categorias = Object.entries(stats.porCategoria);
        if (categorias.length > 0) {
            const categoriaMayor = categorias.reduce((max, cat) => cat[1] > max[1] ? cat : max);
            const porcentajeCategoria = (categoriaMayor[1] / stats.totalGastado) * 100;
            if (porcentajeCategoria > 50) {
                alertas.push({ tipo: 'normal', mensaje: `La categoría "${categoriaMayor[0]}" representa el ${porcentajeCategoria.toFixed(1)}% de tus gastos.`, icono: '🎯' });
            }
        }

        if (stats.numGastos === 0) {
            alertas.push({ tipo: 'normal', mensaje: 'No hay gastos registrados para este mes.', icono: '📝' });
        } else if (stats.numGastos < 5) {
            alertas.push({ tipo: 'normal', mensaje: `Solo tienes ${stats.numGastos} gastos registrados.`, icono: '🤔' });
        }

        return alertas;
    }

    updateTareasPendientes(tareas) {
        const container = document.getElementById('tareas-pendientes-dashboard');
        const lista = document.getElementById('lista-tareas-pendientes');
        if (!container || !lista) return;

        if (!tareas || tareas.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        lista.innerHTML = '';
        
        tareas.forEach(tarea => {
            const li = document.createElement('li');
            li.textContent = tarea.descripcion || 'Sin descripción';
            lista.appendChild(li);
        });
    }

    updateResumenPagos(gastos) {
        const container = document.getElementById('resumen-pagos-detalle');
        if (!container) return;

        const metodos = {};
        gastos.forEach(gasto => {
            const clave = gasto.metodoPago;
            if (!metodos[clave]) metodos[clave] = { total: 0, tarjetas: {} };
            metodos[clave].total += gasto.monto;
            if (gasto.tarjeta) {
                if (!metodos[clave].tarjetas[gasto.tarjeta]) {
                    metodos[clave].tarjetas[gasto.tarjeta] = 0;
                }
                metodos[clave].tarjetas[gasto.tarjeta] += gasto.monto;
            }
        });

        if (Object.keys(metodos).length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-icon">💳</div><p>No hay gastos registrados</p></div>';
            return;
        }

        let html = '';
        const nombres = { 
            efectivo: { icono: '💵', nombre: 'Efectivo' }, 
            debito: { icono: '🏦', nombre: 'Débito' }, 
            credito: { icono: '💳', nombre: 'Crédito' } 
        };

        for (const metodo in metodos) {
            const info = nombres[metodo] || { icono: '💰', nombre: metodo };
            const tieneTarjetas = Object.keys(metodos[metodo].tarjetas).length > 0;
            
            html += `
                <div class="metodo-card">
                    <div class="metodo-header">
                        <div class="metodo-icon">${info.icono}</div>
                        <div class="metodo-title">${info.nombre}</div>
                    </div>
                    <div class="metodo-monto">$${metodos[metodo].total.toFixed(2)}</div>
                    ${tieneTarjetas ? `
                        <div class="metodo-detalle">
                            <strong>Detalle por tarjeta:</strong>
                            <ul>
                                ${Object.entries(metodos[metodo].tarjetas).map(([tarjeta, monto]) => 
                                    `<li>${tarjeta}: $${monto.toFixed(2)}</li>`
                                ).join('')}
                            </ul>
                        </div>
                    ` : '<div class="metodo-detalle">Sin tarjetas específicas</div>'}
                </div>
            `;
        }
        
        container.innerHTML = html;
        
        // Mostrar la sección
        document.getElementById('resumen-pagos-section').style.display = 'block';
    }

    updateGraficaEvolucion(comparativaStats) {
        const container = document.getElementById('chart-evolucion');
        if (!container) {
            console.log('Contenedor chart-evolucion no encontrado');
            return;
        }
        
        if (!comparativaStats || comparativaStats.length === 0) {
            container.innerHTML = this.getEmptyStateHTML('📈', 'Sin datos de evolución');
            return;
        }
        
        try {
            const meses = comparativaStats.map(item => item.mes);
            const totales = comparativaStats.map(item => item.total || 0);
            
            // Calcular promedios móviles
            const promediosMoviles = [];
            for (let i = 0; i < totales.length; i++) {
                const inicio = Math.max(0, i - 2);
                const fin = i + 1;
                const slice = totales.slice(inicio, fin);
                const promedio = slice.reduce((a, b) => a + b, 0) / slice.length;
                promediosMoviles.push(promedio);
            }
            
            const data = [
                {
                    x: meses,
                    y: totales,
                    type: 'bar',
                    name: 'Gasto Mensual',
                    marker: { color: '#4361ee' }
                },
                {
                    x: meses,
                    y: promediosMoviles,
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: 'Promedio Móvil (3 meses)',
                    line: { color: '#FF6B6B', width: 3 },
                    marker: { size: 8 }
                }
            ];
            
            const layout = {
                title: 'Evolución de Gastos',
                height: 300,
                margin: { t: 40, b: 80, l: 60, r: 30 },
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                xaxis: {
                    gridcolor: 'rgba(255,255,255,0.1)',
                    tickangle: -45
                },
                yaxis: {
                    gridcolor: 'rgba(255,255,255,0.1)',
                    tickformat: '$.0f',
                    title: 'Monto ($)'
                },
                legend: {
                    orientation: 'h',
                    y: -0.2
                }
            };
            
            Plotly.newPlot(container, data, layout, { 
                displayModeBar: true,
                responsive: true,
                displaylogo: false
            });
            
            console.log('Gráfica de evolución actualizada');
        } catch (error) {
            console.error('Error actualizando gráfica de evolución:', error);
            container.innerHTML = this.getErrorStateHTML('❌', 'Error cargando gráfica');
        }
    }

    updatePieChart(categoriaData) {
        const container = document.getElementById('chart-pie');
        if (!container) return;
        const categorias = Object.keys(categoriaData);
        const valores = Object.values(categoriaData);
        if (categorias.length === 0) {
            container.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#666;text-align:center;"><div><div style="font-size:3rem;margin-bottom:1rem;">📊</div><p>No hay datos</p></div></div>`;
            return;
        }
        const data = [{ values: valores, labels: categorias, type: 'pie', hole: 0.4, textinfo: 'label+percent', textposition: 'outside', automargin: true }];
        const layout = { height: 250, margin: { t: 0, b: 0, l: 0, r: 0 }, showlegend: false, paper_bgcolor: 'transparent', plot_bgcolor: 'transparent' };
        Plotly.newPlot(container, data, layout, { displayModeBar: false });
    }

    updateBudgetChart(stats) {
        const container = document.getElementById('chart-budget');
        if (!container) return;
        if (!stats.presupuesto) {
            container.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#666;text-align:center;"><div><div style="font-size:2rem;margin-bottom:0.5rem;">🎯</div><p>Sin presupuesto</p></div></div>`;
            return;
        }
        const data = [{ x: ['Presupuesto', 'Gastado'], y: [stats.presupuesto.monto, stats.totalGastado], type: 'bar', marker: { color: ['#4CAF50', stats.totalGastado > stats.presupuesto.monto ? '#f44336' : '#4361ee'] } }];
        const layout = { height: 250, margin: { t: 30, b: 30, l: 40, r: 30 }, paper_bgcolor: 'transparent', plot_bgcolor: 'transparent', xaxis: { gridcolor: '#f0f0f0' }, yaxis: { gridcolor: '#f0f0f0', tickformat: '$.0f' } };
        Plotly.newPlot(container, data, layout, { displayModeBar: false });
    }

    updatePaymentChart(metodoPagoData) {
        const container = document.getElementById('chart-payment');
        if (!container) return;

        const nombres = { efectivo: '💵 Efectivo', debito: '🏦 Débito', credito: '💳 Crédito' };
        const metodos = Object.keys(metodoPagoData);
        if (metodos.length === 0) {
            container.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#666;text-align:center;"><div><div style="font-size:2rem;margin-bottom:0.5rem;">💳</div><p>Sin datos de pagos</p></div></div>`;
            return;
        }

        const labels = metodos.map(m => {
            const partes = m.split('-');
            if (partes.length > 1) {
                const metodo = partes[0];
                const tarjeta = partes.slice(1).join('-');
                return `${nombres[metodo] || metodo} - ${tarjeta}`;
            }
            return nombres[m] || m;
        });

        const valores = metodos.map(m => metodoPagoData[m].total || 0);

        const data = [{ x: labels, y: valores, type: 'bar', marker: { color: ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#FF5722'] } }];
        const layout = {
            height: 250,
            margin: { t: 30, b: 30, l: 40, r: 30 },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            xaxis: { gridcolor: '#f0f0f0', tickangle: -45 },
            yaxis: { gridcolor: '#f0f0f0', tickformat: '$.0f' }
        };
        Plotly.newPlot(container, data, layout, { displayModeBar: false });
    }

    mostrarMensaje(mensaje, tipo = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${tipo}`;
        notification.innerHTML = `<span>${tipo === 'success' ? '✅' : tipo === 'error' ? '❌' : 'ℹ️'} ${mensaje}</span>`;
        document.body.appendChild(notification);
        setTimeout(() => { if (notification.parentElement) notification.remove(); }, 4000);
    }

    refresh() { this.loadDashboardData(); }
    
    setDate(month, year) {
        this.currentMonth = month;
        this.currentYear = year;
        if (document.getElementById('dashboard-month')) document.getElementById('dashboard-month').value = month;
        if (document.getElementById('dashboard-year')) document.getElementById('dashboard-year').value = year;
        this.loadDashboardData();
    }
}