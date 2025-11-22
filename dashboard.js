// dashboard.js - TOTALMENTE CORREGIDO PARA ESTRUCTURA user1/documentos
class Dashboard {
    constructor() {
        this.currentMonth = new Date().getMonth() + 1;
        this.currentYear = new Date().getFullYear();
        this.init();
    }

    init() {
        console.log('Inicializando Dashboard...');
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
    }

    populateMonthSelect() {
        const monthSelect = document.getElementById('dashboard-month');
        if (!monthSelect) return;
        
        monthSelect.innerHTML = '';
        
        const meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        
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
        for (let year = currentYear - 2; year <= currentYear + 1; year++) {
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
        console.log('Cargando datos del dashboard...');
        const userId = window.authManager.getUserId();
        if (!userId) {
            console.log('No hay usuario autenticado');
            return;
        }

        try {
            // CORRECCIÓN: Forzar recarga de todos los datos
            const gastos = await this.getGastosDelMes(userId);
            const presupuesto = await this.getPresupuestoActual(userId);
            const categorias = await this.getCategorias(userId);
            const stats = this.calculateStats(gastos, presupuesto);
            
            this.updateKPICards(stats);
            this.updateAlerts(stats, presupuesto);
            this.updateCharts(stats);
            
            console.log('Dashboard actualizado correctamente');
        } catch (error) {
            console.error('Error en dashboard:', error);
        }
    }

    // AGREGAR ESTE MÉTODO NUEVO para obtener categorías
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
            // CORRECCIÓN: Obtener el documento gastos
            const docRef = firebaseDb.collection(userId).doc('gastos');
            const doc = await docRef.get();
            
            if (!doc.exists) {
                console.log('No existe documento de gastos');
                return [];
            }

            const data = doc.data();
            const todosLosGastos = data.items || [];
            
            // Filtrar gastos del mes actual
            const startDate = new Date(this.currentYear, this.currentMonth - 1, 1);
            const endDate = new Date(this.currentYear, this.currentMonth, 0, 23, 59, 59);
            
            const gastosDelMes = todosLosGastos.filter(gasto => {
                const fechaGasto = gasto.fecha.toDate ? gasto.fecha.toDate() : new Date(gasto.fecha);
                return fechaGasto >= startDate && fechaGasto <= endDate;
            });

            console.log(`Gastos del mes: ${gastosDelMes.length}`);
            return gastosDelMes;
            
        } catch (error) {
            console.error('Error obteniendo gastos:', error);
            return [];
        }
    }

    async getPresupuestoActual(userId) {
        try {
            // CORRECCIÓN: Obtener el documento presupuestos
            const docRef = firebaseDb.collection(userId).doc('presupuestos');
            const doc = await docRef.get();
            
            if (!doc.exists) {
                console.log('No existe documento de presupuestos');
                return null;
            }

            const data = doc.data();
            const presupuestos = data.items || [];
            
            // Buscar presupuesto para el mes actual
            const presupuestoActual = presupuestos.find(p => 
                p.mes === this.currentMonth && p.anio === this.currentYear
            );

            return presupuestoActual || null;
            
        } catch (error) {
            console.error('Error obteniendo presupuesto:', error);
            return null;
        }
    }

    calculateStats(gastos, presupuesto, categorias = []) {
        const totalGastado = gastos.reduce((sum, g) => sum + (g.monto || 0), 0);
        const numGastos = gastos.length;
        
        // Calcular promedio diario
        const hoy = new Date();
        const primerDiaMes = new Date(this.currentYear, this.currentMonth - 1, 1);
        const diasTranscurridos = Math.max(1, Math.floor((hoy - primerDiaMes) / (1000 * 60 * 60 * 24)) + 1);
        const promedioDiario = totalGastado / diasTranscurridos;
        
        // Agrupar por categoría
        const porCategoria = {};
        gastos.forEach(gasto => {
            if (!porCategoria[gasto.categoria]) {
                porCategoria[gasto.categoria] = 0;
            }
            porCategoria[gasto.categoria] += gasto.monto;
        });
        
        // Agrupar por método de pago
        const porMetodoPago = {};
        gastos.forEach(gasto => {
            if (!porMetodoPago[gasto.metodoPago]) {
                porMetodoPago[gasto.metodoPago] = 0;
            }
            porMetodoPago[gasto.metodoPago] += gasto.monto;
        });
        
        // Calcular tendencia
        const tendencia = this.calculateTrend(gastos);

        return {
            totalGastado,
            numGastos,
            promedioDiario,
            porCategoria,
            porMetodoPago,
            presupuesto,
            tendencia,
            diasTranscurridos,
            totalCategorias: categorias.length
        };
    }

    calculateTrend(gastos) {
        if (gastos.length === 0) return 'stable';
        
        // Agrupar gastos por día
        const gastosPorDia = {};
        gastos.forEach(gasto => {
            const fechaGasto = gasto.fecha.toDate ? gasto.fecha.toDate() : new Date(gasto.fecha);
            const dia = fechaGasto.getDate();
            if (!gastosPorDia[dia]) {
                gastosPorDia[dia] = 0;
            }
            gastosPorDia[dia] += gasto.monto;
        });
        
        const dias = Object.keys(gastosPorDia).map(Number).sort((a, b) => a - b);
        if (dias.length < 7) return 'stable';
        
        // Comparar primera semana vs última semana
        const primeraSemana = dias.slice(0, 7).reduce((sum, dia) => sum + (gastosPorDia[dia] || 0), 0) / 7;
        const ultimaSemana = dias.slice(-7).reduce((sum, dia) => sum + (gastosPorDia[dia] || 0), 0) / 7;
        
        if (ultimaSemana > primeraSemana * 1.2) return 'up';
        if (ultimaSemana < primeraSemana * 0.8) return 'down';
        return 'stable';
    }

    updateKPICards(stats) {
        // Total Gastado
        this.updateTotalGastado(stats);
        
        // Presupuesto
        this.updatePresupuesto(stats);
        
        // Gastos del mes
        this.updateGastosCount(stats);
        
        // Promedio diario
        this.updatePromedioDiario(stats);
    }

    updateTotalGastado(stats) {
        const totalElement = document.getElementById('total-gastado');
        const trendElement = document.getElementById('total-trend');
        
        if (totalElement) {
            totalElement.textContent = `$${stats.totalGastado.toFixed(2)}`;
        }
        
        if (trendElement) {
            let trendText = '→ Estable';
            let trendColor = '#2196F3';
            
            if (stats.tendencia === 'up') {
                trendText = '↑ En aumento';
                trendColor = '#FF9800';
            } else if (stats.tendencia === 'down') {
                trendText = '↓ Disminuyendo';
                trendColor = '#4CAF50';
            }
            
            trendElement.textContent = trendText;
            trendElement.style.color = trendColor;
        }
    }

    updatePresupuesto(stats) {
        const presupuestoElement = document.getElementById('total-presupuesto');
        const progressFill = document.getElementById('budget-progress');
        const progressPercentage = document.getElementById('budget-percentage');
        const budgetAvailable = document.getElementById('budget-available');
        
        if (presupuestoElement && progressFill && progressPercentage) {
            if (stats.presupuesto) {
                presupuestoElement.textContent = `$${stats.presupuesto.monto.toFixed(2)}`;
                const porcentajeUso = stats.presupuesto.monto > 0 ? (stats.totalGastado / stats.presupuesto.monto) * 100 : 0;
                
                progressFill.style.width = `${Math.min(porcentajeUso, 100)}%`;
                progressPercentage.textContent = `${porcentajeUso.toFixed(1)}%`;
                
                // Cambiar color según el porcentaje
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
                
                // Actualizar disponible
                if (budgetAvailable) {
                    const disponible = stats.presupuesto.monto - stats.totalGastado;
                    budgetAvailable.textContent = `$${disponible.toFixed(2)}`;
                    budgetAvailable.style.color = disponible >= 0 ? '#4CAF50' : '#f44336';
                }
            } else {
                presupuestoElement.textContent = 'Sin presupuesto';
                progressFill.style.width = '0%';
                progressPercentage.textContent = '0%';
                progressFill.style.background = '#666';
                progressPercentage.style.color = '#666';
                
                if (budgetAvailable) {
                    budgetAvailable.textContent = '$0.00';
                    budgetAvailable.style.color = '#666';
                }
            }
        }
    }

    updateGastosCount(stats) {
        const monthCount = document.getElementById('month-count');
        const monthTrend = document.getElementById('month-trend');
        
        if (monthCount) {
            monthCount.textContent = stats.numGastos;
        }
        
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
        
        if (promedioElement) {
            promedioElement.textContent = `$${stats.promedioDiario.toFixed(2)}`;
        }
        
        if (dailyTrend) {
            let trendText = '→ Normal';
            let trendColor = '#2196F3';
            
            if (stats.promedioDiario > 1000) {
                trendText = '↑ Alto gasto diario';
                trendColor = '#FF9800';
            } else if (stats.promedioDiario < 100) {
                trendText = '↓ Bajo gasto diario';
                trendColor = '#4CAF50';
            }
            
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
            container.innerHTML = `
                <div class="alerta success">
                    <span>✅ Todo está bajo control. ¡Buen trabajo gestionando tus gastos!</span>
                </div>
            `;
            return;
        }
        
        alertas.forEach(alerta => {
            const alertElement = document.createElement('div');
            alertElement.className = `alerta ${alerta.tipo}`;
            alertElement.innerHTML = `
                <span>${alerta.icono} ${alerta.mensaje}</span>
            `;
            container.appendChild(alertElement);
        });
    }

    generateAlerts(stats, presupuesto) {
        const alertas = [];
        
        // Alerta de presupuesto
        if (presupuesto) {
            const porcentajeUso = presupuesto.monto > 0 ? (stats.totalGastado / presupuesto.monto) * 100 : 0;
            
            if (porcentajeUso >= 100) {
                alertas.push({
                    tipo: 'excedido',
                    mensaje: `Has excedido tu presupuesto mensual en $${(stats.totalGastado - presupuesto.monto).toFixed(2)} (${(porcentajeUso - 100).toFixed(1)}%)`,
                    icono: '🚨'
                });
            } else if (porcentajeUso >= 80) {
                alertas.push({
                    tipo: 'cerca',
                    mensaje: `Has usado el ${porcentajeUso.toFixed(1)}% de tu presupuesto. Te quedan $${(presupuesto.monto - stats.totalGastado).toFixed(2)}`,
                    icono: '⚠️'
                });
            }
        } else {
            alertas.push({
                tipo: 'normal',
                mensaje: 'No tienes un presupuesto configurado para este mes. Configúralo en la sección de Presupuestos.',
                icono: '💡'
            });
        }
        
        // Alerta de gasto diario alto
        if (stats.promedioDiario > 1000) {
            alertas.push({
                tipo: 'normal',
                mensaje: `Tu gasto diario promedio es de $${stats.promedioDiario.toFixed(2)}. Considera revisar tus gastos frecuentes.`,
                icono: '💰'
            });
        }
        
        // Alerta de categoría dominante
        const categorias = Object.entries(stats.porCategoria);
        if (categorias.length > 0) {
            const categoriaMayor = categorias.reduce((max, cat) => cat[1] > max[1] ? cat : max);
            const porcentajeCategoria = (categoriaMayor[1] / stats.totalGastado) * 100;
            
            if (porcentajeCategoria > 50) {
                alertas.push({
                    tipo: 'normal',
                    mensaje: `La categoría "${categoriaMayor[0]}" representa el ${porcentajeCategoria.toFixed(1)}% de tus gastos totales`,
                    icono: '🎯'
                });
            }
        }
        
        // Alerta de pocos gastos
        if (stats.numGastos === 0) {
            alertas.push({
                tipo: 'normal',
                mensaje: 'No hay gastos registrados para este mes. ¡Comienza agregando tu primer gasto!',
                icono: '📝'
            });
        } else if (stats.numGastos < 5) {
            alertas.push({
                tipo: 'normal',
                mensaje: `Solo tienes ${stats.numGastos} gastos registrados. ¿Estás seguro de haber registrado todos?`,
                icono: '🤔'
            });
        }
        
        return alertas;
    }

    updateCharts(stats) {
        this.updatePieChart(stats.porCategoria);
        this.updateBudgetChart(stats);
        this.updatePaymentChart(stats.porMetodoPago);
    }

    updatePieChart(categoriaData) {
        const container = document.getElementById('chart-pie');
        if (!container) return;
        
        const categorias = Object.keys(categoriaData);
        const valores = Object.values(categoriaData);
        
        if (categorias.length === 0) {
            container.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;">
                    <div style="text-align: center;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">📊</div>
                        <p>No hay datos para mostrar</p>
                        <small>Los datos aparecerán al registrar gastos</small>
                    </div>
                </div>
            `;
            return;
        }
        
        const data = [{
            values: valores,
            labels: categorias,
            type: 'pie',
            hole: 0.4,
            textinfo: 'label+percent',
            textposition: 'outside',
            automargin: true
        }];
        
        const layout = {
            height: 250,
            margin: { t: 0, b: 0, l: 0, r: 0 },
            showlegend: false,
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent'
        };
        
        try {
            Plotly.newPlot(container, data, layout, { displayModeBar: false });
        } catch (error) {
            console.error('Error creando gráfico pie:', error);
        }
    }

    updateBudgetChart(stats) {
        const container = document.getElementById('chart-budget');
        if (!container) return;
        
        if (!stats.presupuesto) {
            container.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;">
                    <div style="text-align: center;">
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">🎯</div>
                        <p>Sin presupuesto</p>
                        <small>Configura un presupuesto en la sección correspondiente</small>
                    </div>
                </div>
            `;
            return;
        }
        
        const data = [{
            x: ['Presupuesto', 'Gastado'],
            y: [stats.presupuesto.monto, stats.totalGastado],
            type: 'bar',
            marker: {
                color: ['#4CAF50', stats.totalGastado > stats.presupuesto.monto ? '#f44336' : '#4361ee']
            }
        }];
        
        const layout = {
            height: 250,
            margin: { t: 30, b: 30, l: 40, r: 30 },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            xaxis: { gridcolor: '#f0f0f0' },
            yaxis: {
                gridcolor: '#f0f0f0',
                tickformat: '$.0f'
            }
        };
        
        try {
            Plotly.newPlot(container, data, layout, { displayModeBar: false });
        } catch (error) {
            console.error('Error creando gráfico de presupuesto:', error);
        }
    }

    updatePaymentChart(metodoPagoData) {
        const container = document.getElementById('chart-payment');
        if (!container) return;
        
        const metodos = Object.keys(metodoPagoData);
        const valores = Object.values(metodoPagoData);
        
        if (metodos.length === 0) {
            container.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666;">
                    <div style="text-align: center;">
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">💳</div>
                        <p>Sin datos de pagos</p>
                        <small>Los datos aparecerán al registrar gastos</small>
                    </div>
                </div>
            `;
            return;
        }
        
        // Mapear nombres amigables para los métodos de pago
        const nombresAmigables = {
            'efectivo': '💵 Efectivo',
            'debito': '🏦 Débito',
            'credito': '💳 Crédito'
        };
        
        const labels = metodos.map(metodo => nombresAmigables[metodo] || metodo);
        
        const data = [{
            x: labels,
            y: valores,
            type: 'bar',
            marker: {
                color: ['#4CAF50', '#2196F3', '#FF9800']
            }
        }];
        
        const layout = {
            height: 250,
            margin: { t: 30, b: 30, l: 40, r: 30 },
            paper_bgcolor: 'transparent',
            plot_bgcolor: 'transparent',
            xaxis: {
                gridcolor: '#f0f0f0',
                tickangle: -45
            },
            yaxis: {
                gridcolor: '#f0f0f0',
                tickformat: '$.0f'
            }
        };
        
        try {
            Plotly.newPlot(container, data, layout, { displayModeBar: false });
        } catch (error) {
            console.error('Error creando gráfico de métodos de pago:', error);
        }
    }

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

    // Método para recargar datos manualmente
    refresh() {
        this.loadDashboardData();
    }

    // Método para cambiar mes/año programáticamente
    setDate(month, year) {
        this.currentMonth = month;
        this.currentYear = year;
        
        const monthSelect = document.getElementById('dashboard-month');
        const yearSelect = document.getElementById('dashboard-year');
        
        if (monthSelect) monthSelect.value = month;
        if (yearSelect) yearSelect.value = year;
        
        this.loadDashboardData();
    }
}