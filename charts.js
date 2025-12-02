// charts.js - VERSIÓN COMPLETAMENTE CORREGIDA
class ChartsManager {
    constructor() {
        console.log('📊 Inicializando Charts Manager para sección Gráficos...');
        this.isInitialized = false;
        this.chartContainers = {};
    }
    
    async init() {
        if (this.isInitialized) return;
        
        console.log('🎯 Configurando Charts Manager...');
        this.setupEventListeners();
        this.cacheChartContainers();
        await this.loadAllCharts();
        this.isInitialized = true;
    }
    
    cacheChartContainers() {
        // Cachear todos los contenedores de gráficas
        this.chartContainers = {
            detailedEvolution: document.getElementById('chart-detailed-evolution'),
            paymentMethods: document.getElementById('chart-payment-methods'),
            savingsTrend: document.getElementById('chart-savings-trend'),
            budgetAnalysis: document.getElementById('chart-budget-analysis'),
            comparativa: document.getElementById('chart-graficos-comparativa'),
            porUsuario: document.getElementById('chart-graficos-usuario'),
            detalleTarjeta: document.getElementById('chart-graficos-tarjeta'),
            evolucionTemporal: document.getElementById('chart-graficos-evolucion')
        };
        
        console.log('📦 Contenedores de gráficas cacheados:', Object.keys(this.chartContainers));
    }
    
    setupEventListeners() {
        console.log('🔧 Configurando event listeners...');
        
        // Botón de exportar
        const btnExportar = document.getElementById('btn-exportar-graficos');
        if (btnExportar) {
            btnExportar.addEventListener('click', () => this.exportarTodos());
        }
        
        // Selector de rango
        const chartRange = document.getElementById('chart-range');
        if (chartRange) {
            chartRange.addEventListener('change', (e) => {
                if (e.target.value === 'custom') {
                    document.getElementById('custom-range').style.display = 'block';
                } else {
                    document.getElementById('custom-range').style.display = 'none';
                    this.loadAllCharts();
                }
            });
        }
        
        // Selector de agrupación
        const chartGrouping = document.getElementById('chart-grouping');
        if (chartGrouping) {
            chartGrouping.addEventListener('change', () => this.loadAllCharts());
        }
        
        // Fechas personalizadas
        ['chart-from', 'chart-to'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => this.loadAllCharts());
            }
        });
        
        // Botones de exportación individual
        document.querySelectorAll('.export-buttons button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const format = e.target.getAttribute('data-format');
                const chartContainer = e.target.closest('.chart-card').querySelector('.chart-container');
                this.exportarGrafica(chartContainer, format);
            });
        });
    }
    
    async loadAllCharts() {
        const userId = window.authManager?.getUserId();
        if (!userId) {
            console.log('❌ Usuario no autenticado en Charts Manager');
            this.showEmptyStates();
            return;
        }
        
        try {
            console.log('🚀 Cargando todas las gráficas de la sección Gráficos...');
            
            // Obtener rango de fechas
            const { startDate, endDate } = this.getDateRange();
            console.log(`📅 Rango de fechas: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`);
            
            // Cargar datos
            const gastos = await this.fetchGastos(userId, startDate, endDate);
            const categorias = await this.fetchCategorias(userId);
            const usuarios = await this.fetchUsuarios();
            
            console.log(`📊 Datos cargados: ${gastos.length} gastos, ${categorias.length} categorías, ${usuarios.length} usuarios`);
            
            if (gastos.length === 0) {
                console.log('⚠️ No hay gastos en el rango seleccionado');
                this.showEmptyStates();
                return;
            }
            
            // Procesar datos para gráficas
            const datosProcesados = this.procesarDatosParaGraficas(gastos, categorias, usuarios);
            
            // Renderizar todas las gráficas
            this.renderAllCharts(datosProcesados);
            
            console.log('✅ Todas las gráficas de la sección Gráficos cargadas');
        } catch (error) {
            console.error('❌ Error crítico cargando gráficas:', error);
            this.showErrorStates();
        }
    }
    
    getDateRange() {
        const range = document.getElementById('chart-range')?.value || '12';
        
        if (range === 'custom') {
            const desde = document.getElementById('chart-from')?.value;
            const hasta = document.getElementById('chart-to')?.value;
            
            if (desde && hasta) {
                const startDate = new Date(desde);
                const endDate = new Date(hasta);
                endDate.setHours(23, 59, 59, 999); // Incluir todo el día
                return { startDate, endDate };
            }
        }
        
        const meses = parseInt(range);
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(endDate.getMonth() - meses);
        startDate.setDate(1); // Primer día del mes
        
        return { startDate, endDate };
    }
    
    async fetchGastos(userId, startDate, endDate) {
        try {
            const docRef = firebaseDb.collection(userId).doc('gastos');
            const doc = await docRef.get();
            if (!doc.exists) {
                console.log('📭 No hay documento de gastos');
                return [];
            }
            
            const todosLosGastos = doc.data().items || [];
            console.log(`📦 Total de gastos en BD: ${todosLosGastos.length}`);
            
            // Filtrar por fecha
            const gastosFiltrados = todosLosGastos.filter(gasto => {
                try {
                    const fechaGasto = gasto.fecha?.toDate ? gasto.fecha.toDate() : new Date(gasto.fecha);
                    return fechaGasto >= startDate && fechaGasto <= endDate;
                } catch (error) {
                    console.warn('⚠️ Error procesando fecha de gasto:', gasto);
                    return false;
                }
            });
            
            console.log(`✅ Gastos filtrados: ${gastosFiltrados.length}`);
            return gastosFiltrados;
        } catch (error) {
            console.error('❌ Error obteniendo gastos:', error);
            return [];
        }
    }
    
    async fetchCategorias(userId) {
        try {
            const docRef = firebaseDb.collection(userId).doc('categorias');
            const doc = await docRef.get();
            return doc.exists ? doc.data().items || [] : [];
        } catch (error) {
            console.error('❌ Error obteniendo categorías:', error);
            return [];
        }
    }
    
    async fetchUsuarios() {
        try {
            const usuarios = [];
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
                    // Usuario no existe, continuar
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
    
    procesarDatosParaGraficas(gastos, categorias, usuarios) {
        console.log('🔧 Procesando datos para gráficas...');
        
        return {
            // Gráficas existentes
            evolucionDetallada: this.procesarEvolucionDetallada(gastos),
            metodosPago: this.procesarMetodosPago(gastos),
            tendenciaAhorro: this.procesarTendenciaAhorro(gastos),
            analisisPresupuesto: this.procesarAnalisisPresupuesto(gastos, categorias),
            
            // Nuevas gráficas
            comparativaMensual: this.procesarComparativaMensual(gastos),
            porUsuario: this.procesarPorUsuario(gastos, usuarios),
            metodosDetallados: this.procesarMetodosDetallados(gastos, categorias),
            evolucionTemporal: this.procesarEvolucionTemporal(gastos)
        };
    }
    
    // PROCESAMIENTO DE NUEVAS GRÁFICAS
    procesarComparativaMensual(gastos) {
        const mesesMap = new Map();
        
        gastos.forEach(gasto => {
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
                        fecha: new Date(año, mes - 1, 1)
                    });
                }
                
                const mesData = mesesMap.get(clave);
                mesData.total += parseFloat(gasto.monto) || 0;
            } catch (error) {
                // Ignorar gastos con fecha inválida
            }
        });
        
        // Convertir a array y ordenar por fecha
        const mesesArray = Array.from(mesesMap.values());
        mesesArray.sort((a, b) => a.fecha - b.fecha);
        
        console.log(`📊 Comparativa mensual: ${mesesArray.length} meses`);
        return mesesArray;
    }
    
    procesarPorUsuario(gastos, usuarios) {
        const stats = {};
        
        // Inicializar todos los usuarios
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
                const monto = parseFloat(gasto.monto) || 0;
                stats[gasto.usuario].total += monto;
                
                const metodo = gasto.metodoPago || 'efectivo';
                if (stats[gasto.usuario].porMetodo[metodo] !== undefined) {
                    stats[gasto.usuario].porMetodo[metodo] += monto;
                }
            }
        });
        
        // Filtrar solo usuarios con gastos
        const usuariosConGastos = {};
        Object.keys(stats).forEach(usuario => {
            if (stats[usuario].total > 0) {
                usuariosConGastos[usuario] = stats[usuario];
            }
        });
        
        console.log(`👥 Usuarios con gastos: ${Object.keys(usuariosConGastos).length}`);
        return usuariosConGastos;
    }
    
    procesarMetodosDetallados(gastos, categorias) {
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
                
                const monto = parseFloat(gasto.monto) || 0;
                stats[clave].total += monto;
                
                if (!stats[clave].porCategoria[gasto.categoria]) {
                    stats[clave].porCategoria[gasto.categoria] = 0;
                }
                stats[clave].porCategoria[gasto.categoria] += monto;
            }
        });
        
        console.log(`💳 Métodos detallados: ${Object.keys(stats).length}`);
        return stats;
    }
    
    procesarEvolucionTemporal(gastos) {
        return this.procesarComparativaMensual(gastos);
    }
    
    // RENDERIZADO DE TODAS LAS GRÁFICAS
    renderAllCharts(datos) {
        console.log('🎨 Renderizando todas las gráficas...');
        
        // Renderizar gráficas existentes
        this.renderChartDetailedEvolution(datos.evolucionDetallada);
        this.renderChartPaymentMethods(datos.metodosPago);
        this.renderChartSavingsTrend(datos.tendenciaAhorro);
        this.renderChartBudgetAnalysis(datos.analisisPresupuesto);
        
        // Renderizar nuevas gráficas
        this.renderChartComparativaMensual(datos.comparativaMensual);
        this.renderChartPorUsuario(datos.porUsuario);
        this.renderChartMetodosDetallados(datos.metodosDetallados);
        this.renderChartEvolucionTemporal(datos.evolucionTemporal);
    }
    
    // RENDERIZADO DE NUEVAS GRÁFICAS
    renderChartComparativaMensual(comparativaMensual) {
        const container = this.chartContainers.comparativa;
        if (!container) {
            console.log('❌ Contenedor chart-graficos-comparativa no encontrado');
            return;
        }
        
        if (!comparativaMensual || comparativaMensual.length === 0) {
            container.innerHTML = this.getEmptyStateHTML('📊', 'No hay datos para comparativa mensual');
            return;
        }
        
        try {
            const meses = comparativaMensual.map(item => item.mes);
            const totales = comparativaMensual.map(item => item.total);
            
            // Calcular promedio
            const promedio = totales.reduce((a, b) => a + b, 0) / totales.length;
            
            const data = [
                {
                    x: meses,
                    y: totales,
                    type: 'bar',
                    name: 'Gasto Mensual',
                    marker: {
                        color: totales.map(total => 
                            total > promedio * 1.2 ? '#f44336' : 
                            total > promedio ? '#FF9800' : '#4CAF50'
                        )
                    },
                    text: totales.map(t => `$${t.toFixed(2)}`),
                    textposition: 'auto',
                    textfont: {
                        size: 10,
                        color: 'white'
                    }
                },
                {
                    x: meses,
                    y: Array(meses.length).fill(promedio),
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Promedio',
                    line: {
                        color: '#4361ee',
                        width: 2,
                        dash: 'dash'
                    },
                    hoverinfo: 'skip'
                }
            ];
            
            const layout = {
                title: 'Comparativa Mensual',
                height: 350,
                margin: { t: 50, b: 100, l: 60, r: 30 },
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
                    y: -0.25
                },
                hovermode: 'closest'
            };
            
            Plotly.newPlot(container, data, layout, { 
                displayModeBar: true,
                responsive: true,
                displaylogo: false
            });
            
            console.log('✅ Gráfica de comparativa mensual renderizada');
        } catch (error) {
            console.error('❌ Error renderizando comparativa mensual:', error);
            container.innerHTML = this.getErrorStateHTML('📊', 'Error cargando comparativa');
        }
    }
    
    renderChartPorUsuario(porUsuario) {
        const container = this.chartContainers.porUsuario;
        if (!container) {
            console.log('❌ Contenedor chart-graficos-usuario no encontrado');
            return;
        }
        
        const usuarios = Object.keys(porUsuario);
        if (usuarios.length === 0) {
            container.innerHTML = this.getEmptyStateHTML('👥', 'No hay datos por usuario');
            return;
        }
        
        try {
            const metodos = ['efectivo', 'debito', 'credito'];
            const colores = ['#FF6B6B', '#4ECDC4', '#45B7D1'];
            const nombresMetodos = {
                'efectivo': '💵 Efectivo',
                'debito': '🏦 Débito', 
                'credito': '💳 Crédito'
            };
            
            const datos = [];
            
            metodos.forEach((metodo, index) => {
                const valores = usuarios.map(usuario => 
                    porUsuario[usuario].porMetodo?.[metodo] || 0
                );
                
                if (valores.some(v => v > 0)) {
                    datos.push({
                        x: usuarios,
                        y: valores,
                        name: nombresMetodos[metodo],
                        type: 'bar',
                        marker: {
                            color: colores[index],
                            line: {
                                width: 1,
                                color: 'rgba(0,0,0,0.3)'
                            }
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
                height: 350,
                barmode: 'stack',
                margin: { t: 50, b: 100, l: 60, r: 30 },
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
                    y: -0.25
                }
            };
            
            Plotly.newPlot(container, datos, layout, { 
                displayModeBar: true,
                responsive: true,
                displaylogo: false
            });
            
            console.log('✅ Gráfica por usuario renderizada');
        } catch (error) {
            console.error('❌ Error renderizando gráfica por usuario:', error);
            container.innerHTML = this.getErrorStateHTML('👥', 'Error cargando gráfica');
        }
    }
    
    renderChartMetodosDetallados(metodosDetallados) {
        const container = this.chartContainers.detalleTarjeta;
        if (!container) {
            console.log('❌ Contenedor chart-graficos-tarjeta no encontrado');
            return;
        }
        
        const metodos = Object.keys(metodosDetallados);
        if (metodos.length === 0) {
            container.innerHTML = this.getEmptyStateHTML('💳', 'No hay datos detallados de tarjetas');
            return;
        }
        
        try {
            // Obtener todas las categorías únicas
            const categoriasSet = new Set();
            metodos.forEach(clave => {
                Object.keys(metodosDetallados[clave].porCategoria || {}).forEach(categoria => {
                    categoriasSet.add(categoria);
                });
            });
            
            const categorias = Array.from(categoriasSet);
            const datos = [];
            const colores = ['#FF9F1C', '#2EC4B6', '#E71D36', '#011627', '#FF3366', '#20A4F3'];
            
            categorias.forEach((categoria, catIndex) => {
                const valores = metodos.map(clave => 
                    metodosDetallados[clave].porCategoria?.[categoria] || 0
                );
                
                if (valores.some(v => v > 0)) {
                    const labels = metodos.map(clave => {
                        const data = metodosDetallados[clave];
                        const icono = data.metodo === 'credito' ? '💳' : '🏦';
                        return `${icono} ${data.tarjeta}`;
                    });
                    
                    datos.push({
                        x: labels,
                        y: valores,
                        name: categoria,
                        type: 'bar',
                        marker: {
                            color: colores[catIndex % colores.length],
                            line: {
                                width: 1,
                                color: 'rgba(0,0,0,0.3)'
                            }
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
                height: 350,
                barmode: 'stack',
                margin: { t: 50, b: 120, l: 60, r: 30 },
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
            
            console.log('✅ Gráfica de métodos detallados renderizada');
        } catch (error) {
            console.error('❌ Error renderizando métodos detallados:', error);
            container.innerHTML = this.getErrorStateHTML('💳', 'Error cargando gráfica');
        }
    }
    
    renderChartEvolucionTemporal(evolucionTemporal) {
        const container = this.chartContainers.evolucionTemporal;
        if (!container) {
            console.log('❌ Contenedor chart-graficos-evolucion no encontrado');
            return;
        }
        
        if (!evolucionTemporal || evolucionTemporal.length === 0) {
            container.innerHTML = this.getEmptyStateHTML('📈', 'No hay datos de evolución temporal');
            return;
        }
        
        try {
            const meses = evolucionTemporal.map(item => item.mes);
            const totales = evolucionTemporal.map(item => item.total);
            
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
                        opacity: 0.8
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
                height: 350,
                margin: { t: 50, b: 100, l: 60, r: 30 },
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
                    y: -0.25
                }
            };
            
            Plotly.newPlot(container, data, layout, { 
                displayModeBar: true,
                responsive: true,
                displaylogo: false
            });
            
            console.log('✅ Gráfica de evolución temporal renderizada');
        } catch (error) {
            console.error('❌ Error renderizando evolución temporal:', error);
            container.innerHTML = this.getErrorStateHTML('📈', 'Error cargando evolución');
        }
    }
    
    // MÉTODOS AUXILIARES
    getNombreMes(mes) {
        const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        return meses[mes - 1] || `Mes ${mes}`;
    }
    
    getEmptyStateHTML(icono, mensaje) {
        return `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--text-light);text-align:center;padding:2rem;">
                <div style="font-size:3rem;margin-bottom:1rem;opacity:0.5;">${icono}</div>
                <p style="font-size:0.9rem;margin-bottom:0.5rem;">${mensaje}</p>
                <small style="font-size:0.8rem;opacity:0.7;">Cambia el rango de fechas o agrega más gastos</small>
            </div>
        `;
    }
    
    getErrorStateHTML(icono, mensaje = 'Error cargando gráfica') {
        return `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#f44336;text-align:center;padding:2rem;">
                <div style="font-size:3rem;margin-bottom:1rem;">${icono}</div>
                <p style="font-size:0.9rem;margin-bottom:1rem;">${mensaje}</p>
                <button class="btn btn-outline btn-sm" onclick="window.chartsManager?.loadAllCharts()" 
                        style="padding:0.5rem 1rem;font-size:0.8rem;">
                    Reintentar
                </button>
            </div>
        `;
    }
    
    showEmptyStates() {
        // Mostrar estado vacío en todos los contenedores
        Object.values(this.chartContainers).forEach(container => {
            if (container) {
                container.innerHTML = this.getEmptyStateHTML('📊', 'No hay datos disponibles');
            }
        });
    }
    
    showErrorStates() {
        // Mostrar estado de error en todos los contenedores
        Object.values(this.chartContainers).forEach(container => {
            if (container) {
                container.innerHTML = this.getErrorStateHTML('❌');
            }
        });
    }
    
    // MÉTODOS EXISTENTES (simplificados para mantener compatibilidad)
    procesarEvolucionDetallada(gastos) {
        const dias = {};
        gastos.forEach(gasto => {
            try {
                const fechaGasto = gasto.fecha?.toDate ? gasto.fecha.toDate() : new Date(gasto.fecha);
                const dia = fechaGasto.getDate();
                if (!dias[dia]) dias[dia] = 0;
                dias[dia] += parseFloat(gasto.monto) || 0;
            } catch (error) {
                // Ignorar errores
            }
        });
        return dias;
    }
    
    procesarMetodosPago(gastos) {
        const metodos = {};
        gastos.forEach(gasto => {
            const metodo = gasto.metodoPago || 'efectivo';
            if (!metodos[metodo]) metodos[metodo] = 0;
            metodos[metodo] += parseFloat(gasto.monto) || 0;
        });
        return metodos;
    }
    
    procesarTendenciaAhorro(gastos) {
        return this.procesarComparativaMensual(gastos);
    }
    
    procesarAnalisisPresupuesto(gastos, categorias) {
        const porCategoria = {};
        gastos.forEach(gasto => {
            const categoria = gasto.categoria || 'Sin categoría';
            if (!porCategoria[categoria]) porCategoria[categoria] = 0;
            porCategoria[categoria] += parseFloat(gasto.monto) || 0;
        });
        return porCategoria;
    }
    
    renderChartDetailedEvolution(data) {
        const container = this.chartContainers.detailedEvolution;
        if (!container || Object.keys(data).length === 0) {
            if (container) container.innerHTML = this.getEmptyStateHTML('📈', 'No hay datos de evolución');
            return;
        }
        
        const dias = Object.keys(data).sort((a, b) => a - b);
        const montos = dias.map(dia => data[dia]);
        
        const trace = {
            x: dias.map(d => `Día ${d}`),
            y: montos,
            type: 'scatter',
            mode: 'lines+markers',
            line: { color: '#4361ee', width: 3 },
            marker: { size: 8, color: '#7209b7' }
        };
        
        const layout = {
            title: 'Evolución Detallada',
            height: 350,
            margin: { t: 50, b: 80, l: 60, r: 30 },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            xaxis: { gridcolor: 'rgba(255,255,255,0.1)' },
            yaxis: { gridcolor: 'rgba(255,255,255,0.1)', tickformat: '$.0f' }
        };
        
        Plotly.newPlot(container, [trace], layout, { 
            displayModeBar: true,
            responsive: true,
            displaylogo: false 
        });
    }
    
    renderChartPaymentMethods(data) {
        const container = this.chartContainers.paymentMethods;
        if (!container || Object.keys(data).length === 0) {
            if (container) container.innerHTML = this.getEmptyStateHTML('💳', 'No hay datos de métodos de pago');
            return;
        }
        
        const metodos = Object.keys(data);
        const montos = metodos.map(metodo => data[metodo]);
        
        const nombres = {
            'efectivo': '💵 Efectivo',
            'debito': '🏦 Débito',
            'credito': '💳 Crédito'
        };
        
        const labels = metodos.map(m => nombres[m] || m);
        
        const trace = {
            x: labels,
            y: montos,
            type: 'bar',
            marker: { 
                color: ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#FF5722']
            }
        };
        
        const layout = {
            title: 'Distribución de Pagos',
            height: 350,
            margin: { t: 50, b: 100, l: 60, r: 30 },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            xaxis: { 
                gridcolor: 'rgba(255,255,255,0.1)',
                tickangle: -45
            },
            yaxis: { 
                gridcolor: 'rgba(255,255,255,0.1)', 
                tickformat: '$.0f' 
            }
        };
        
        Plotly.newPlot(container, [trace], layout, { 
            displayModeBar: true,
            responsive: true,
            displaylogo: false 
        });
    }
    
    renderChartSavingsTrend(data) {
        const container = this.chartContainers.savingsTrend;
        if (!container || !data || data.length === 0) {
            if (container) container.innerHTML = this.getEmptyStateHTML('💰', 'No hay datos de tendencia');
            return;
        }
        
        const meses = data.map(item => item.mes);
        const montos = data.map(item => item.total);
        
        const trace = {
            x: meses,
            y: montos,
            type: 'bar',
            marker: { color: '#4361ee' }
        };
        
        const layout = {
            title: 'Tendencia de Ahorro',
            height: 350,
            margin: { t: 50, b: 100, l: 60, r: 30 },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            xaxis: { 
                gridcolor: 'rgba(255,255,255,0.1)',
                tickangle: -45
            },
            yaxis: { 
                gridcolor: 'rgba(255,255,255,0.1)', 
                tickformat: '$.0f' 
            }
        };
        
        Plotly.newPlot(container, [trace], layout, { 
            displayModeBar: true,
            responsive: true,
            displaylogo: false 
        });
    }
    
    renderChartBudgetAnalysis(data) {
        const container = this.chartContainers.budgetAnalysis;
        if (!container || Object.keys(data).length === 0) {
            if (container) container.innerHTML = this.getEmptyStateHTML('🎯', 'No hay datos de presupuesto');
            return;
        }
        
        const categorias = Object.keys(data);
        const montos = Object.values(data);
        
        const trace = {
            values: montos,
            labels: categorias,
            type: 'pie',
            hole: 0.4,
            textinfo: 'label+percent',
            textposition: 'inside'
        };
        
        const layout = {
            title: 'Análisis de Presupuesto',
            height: 350,
            margin: { t: 50, b: 50, l: 50, r: 50 },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            showlegend: true
        };
        
        Plotly.newPlot(container, [trace], layout, { 
            displayModeBar: true,
            responsive: true,
            displaylogo: false 
        });
    }
    
    exportarGrafica(container, format) {
        console.log(`Exportando gráfica como ${format}`);
        // Implementación básica de exportación
        alert(`Funcionalidad de exportación ${format} implementable con Plotly.toImage`);
    }
    
    exportarTodos() {
        alert('Exportando todas las gráficas...\n\nEsta funcionalidad puede implementarse usando:\n- Plotly.toImage para cada gráfica\n- jsPDF para combinar en PDF\n- o usar la funcionalidad nativa de Plotly');
    }
}

// INICIALIZACIÓN MEJORADA
function initializeChartsManager() {
    // Verificar si estamos en la sección gráficos
    const graficosSection = document.getElementById('graficos');
    if (!graficosSection || graficosSection.style.display !== 'block') {
        console.log('📭 Sección gráficos no visible, no inicializando Charts Manager');
        return;
    }
    
    // Verificar que los contenedores existan
    const requiredContainers = [
        'chart-detailed-evolution',
        'chart-payment-methods', 
        'chart-savings-trend',
        'chart-budget-analysis',
        'chart-graficos-comparativa',
        'chart-graficos-usuario',
        'chart-graficos-tarjeta',
        'chart-graficos-evolucion'
    ];
    
    const missingContainers = requiredContainers.filter(id => !document.getElementById(id));
    if (missingContainers.length > 0) {
        console.error('❌ Contenedores de gráficas faltantes:', missingContainers);
        return;
    }
    
    // Inicializar Charts Manager
    if (!window.chartsManager) {
        window.chartsManager = new ChartsManager();
        window.chartsManager.init();
    } else if (!window.chartsManager.isInitialized) {
        window.chartsManager.init();
    } else {
        // Recargar datos si ya está inicializado
        window.chartsManager.loadAllCharts();
    }
}

// Observar cuando se muestre la sección gráficos
document.addEventListener('DOMContentLoaded', () => {
    // Configurar observer para la sección gráficos
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const section = mutation.target;
                if (section.id === 'graficos' && section.style.display === 'block') {
                    console.log('🎯 Sección gráficos activada, inicializando Charts Manager...');
                    // Pequeño delay para asegurar que el DOM esté listo
                    setTimeout(initializeChartsManager, 300);
                }
            }
        });
    });
    
    // Observar la sección de gráficos
    const graficosSection = document.getElementById('graficos');
    if (graficosSection) {
        observer.observe(graficosSection, { attributes: true });
        console.log('👁️ Observando sección gráficos para cambios');
    }
    
    // También inicializar si ya está activa al cargar
    if (graficosSection && graficosSection.style.display === 'block') {
        setTimeout(initializeChartsManager, 500);
    }
});