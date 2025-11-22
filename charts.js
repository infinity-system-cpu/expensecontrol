// Módulo Charts - Gestión de gráficos interactivos (Versión simplificada)
class ChartsManager {
    constructor() {
        this.chartConfig = {
            range: '12',
            grouping: 'month'
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadChartConfig();
        this.initializeCharts();
    }

    setupEventListeners() {
        // Controles de rango de tiempo
        const rangeSelect = document.getElementById('chart-range');
        if (rangeSelect) {
            rangeSelect.addEventListener('change', (e) => {
                this.chartConfig.range = e.target.value;
                if (e.target.value === 'custom') {
                    document.getElementById('custom-range').style.display = 'flex';
                } else {
                    document.getElementById('custom-range').style.display = 'none';
                    this.updateAllCharts();
                }
            });
        }

        // Controles de agrupación
        const groupingSelect = document.getElementById('chart-grouping');
        if (groupingSelect) {
            groupingSelect.addEventListener('change', (e) => {
                this.chartConfig.grouping = e.target.value;
                this.updateAllCharts();
            });
        }

        // Controles de rango personalizado
        const fromInput = document.getElementById('chart-from');
        const toInput = document.getElementById('chart-to');
        if (fromInput && toInput) {
            fromInput.addEventListener('change', this.updateCustomRange.bind(this));
            toInput.addEventListener('change', this.updateCustomRange.bind(this));
        }

        // Exportación de gráficos
        document.querySelectorAll('.export-buttons button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const format = e.target.dataset.format;
                this.exportChart(format);
            });
        });

        // Botón exportar todos los gráficos
        const exportBtn = document.getElementById('btn-exportar-graficos');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportAllCharts();
            });
        }
    }

    async initializeCharts() {
        await this.updateAllCharts();
    }

    async updateAllCharts() {
        try {
            const data = await this.getChartData();
            await this.updateDetailedEvolutionChart(data);
            await this.updatePaymentMethodsChart(data);
            await this.updateSavingsTrendChart(data);
            await this.updateBudgetAnalysisChart(data);
        } catch (error) {
            console.error('Error updating charts:', error);
        }
    }

    async getChartData() {
        const allGastos = JSON.parse(localStorage.getItem('gastos') || '[]');
        const allPresupuestos = JSON.parse(localStorage.getItem('presupuestos') || '[]');
        
        let filteredGastos = allGastos;
        
        // Aplicar filtro de rango de tiempo
        if (this.chartConfig.range === 'custom' && this.chartConfig.customRange) {
            filteredGastos = filteredGastos.filter(gasto => {
                const gastoDate = new Date(gasto.fecha);
                return gastoDate >= this.chartConfig.customRange.from &&
                       gastoDate <= this.chartConfig.customRange.to;
            });
        } else if (this.chartConfig.range !== 'custom') {
            const months = parseInt(this.chartConfig.range);
            const cutoffDate = new Date();
            cutoffDate.setMonth(cutoffDate.getMonth() - months);
            filteredGastos = filteredGastos.filter(gasto => 
                new Date(gasto.fecha) >= cutoffDate
            );
        }
        
        return {
            gastos: filteredGastos,
            presupuestos: allPresupuestos
        };
    }

    async updateDetailedEvolutionChart(data) {
        const container = document.getElementById('chart-detailed-evolution');
        if (!container) return;

        const groupedData = this.groupDataByTimePeriod(data.gastos, this.chartConfig.grouping);
        const categorias = [...new Set(data.gastos.map(g => g.categoria))];
        
        // Colores para las categorías
        const colores = {
            'comida': '#4CAF50',
            'transporte': '#2196F3', 
            'entretenimiento': '#FF9800',
            'salud': '#F44336',
            'educacion': '#9C27B0',
            'compras': '#00796B',
            'servicios': '#C2185B',
            'otros': '#757575'
        };

        const traces = categorias.map(categoria => {
            const categoriaData = groupedData.map(period => 
                period.gastos.filter(g => g.categoria === categoria)
                    .reduce((sum, g) => sum + g.monto, 0)
            );
            
            return {
                x: groupedData.map(p => p.period),
                y: categoriaData,
                type: 'bar',
                name: this.getCategoryName(categoria),
                marker: {
                    color: colores[categoria] || '#4361ee'
                }
            };
        });

        const layout = {
            title: 'Evolución de Gastos por Categoría',
            xaxis: { 
                title: 'Período',
                tickangle: -45
            },
            yaxis: { title: 'Total Gastado ($)' },
            barmode: 'stack',
            showlegend: true,
            legend: { 
                orientation: 'h',
                y: -0.3
            },
            margin: { t: 50, b: 100, l: 60, r: 40 },
            height: 400
        };

        Plotly.newPlot('chart-detailed-evolution', traces, layout, { 
            responsive: true,
            displayModeBar: true
        });
    }

    async updatePaymentMethodsChart(data) {
        const container = document.getElementById('chart-payment-methods');
        if (!container) return;

        const metodoData = data.gastos.reduce((acc, gasto) => {
            acc[gasto.metodoPago] = (acc[gasto.metodoPago] || 0) + gasto.monto;
            return acc;
        }, {});
        
        const trace = {
            values: Object.values(metodoData),
            labels: Object.keys(metodoData).map(this.getPaymentMethodName),
            type: 'pie',
            hole: 0.4,
            marker: {
                colors: ['var(--efectivo-color)', 'var(--debito-color)', 'var(--credito-color)']
            },
            textinfo: 'percent+label',
            hoverinfo: 'label+value+percent'
        };
        
        const layout = {
            title: 'Distribución por Método de Pago',
            showlegend: true,
            height: 300,
            margin: { t: 50, b: 50, l: 50, r: 50 }
        };
        
        Plotly.newPlot('chart-payment-methods', [trace], layout, { responsive: true });
    }

    async updateSavingsTrendChart(data) {
        const container = document.getElementById('chart-savings-trend');
        if (!container) return;

        const monthlyData = this.calculateMonthlySavings(data.gastos, data.presupuestos);
        
        const traceAhorro = {
            x: monthlyData.meses,
            y: monthlyData.ahorro,
            type: 'bar',
            name: 'Ahorro/Déficit',
            marker: {
                color: monthlyData.ahorro.map(a => a >= 0 ? 'var(--success-color)' : 'var(--danger-color)')
            }
        };
        
        const layout = {
            title: 'Tendencia de Ahorro Mensual',
            xaxis: { 
                title: 'Mes',
                tickangle: -45
            },
            yaxis: { title: 'Monto ($)' },
            showlegend: true,
            height: 300,
            margin: { t: 50, b: 80, l: 60, r: 40 }
        };
        
        Plotly.newPlot('chart-savings-trend', [traceAhorro], layout, { 
            responsive: true 
        });
    }

    async updateBudgetAnalysisChart(data) {
        const container = document.getElementById('chart-budget-analysis');
        if (!container) return;

        const analysisData = this.analyzeBudgetPerformance(data.gastos, data.presupuestos);
        
        const traceDesviacion = {
            x: analysisData.meses,
            y: analysisData.desviacion,
            type: 'bar',
            name: 'Desviación del Presupuesto',
            marker: {
                color: analysisData.desviacion.map(d => 
                    d > 0 ? 'var(--danger-color)' : 'var(--success-color)'
                )
            }
        };
        
        const layout = {
            title: 'Análisis de Presupuesto vs Real',
            xaxis: { 
                title: 'Mes',
                tickangle: -45
            },
            yaxis: { title: 'Desviación ($)' },
            showlegend: true,
            height: 400,
            margin: { t: 50, b: 80, l: 60, r: 40 }
        };
        
        Plotly.newPlot('chart-budget-analysis', [traceDesviacion], layout, { 
            responsive: true 
        });
    }

    // Métodos auxiliares para procesamiento de datos
    groupDataByTimePeriod(gastos, grouping) {
        const grouped = {};
        
        gastos.forEach(gasto => {
            const date = new Date(gasto.fecha);
            let periodKey;
            
            switch (grouping) {
                case 'day':
                    periodKey = date.toISOString().split('T')[0];
                    break;
                case 'week':
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay());
                    periodKey = weekStart.toISOString().split('T')[0];
                    break;
                case 'month':
                default:
                    periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    break;
            }
            
            if (!grouped[periodKey]) {
                grouped[periodKey] = {
                    period: this.formatPeriod(periodKey, grouping),
                    gastos: []
                };
            }
            
            grouped[periodKey].gastos.push(gasto);
        });
        
        return Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));
    }

    formatPeriod(periodKey, grouping) {
        switch (grouping) {
            case 'day':
                return new Date(periodKey).toLocaleDateString('es-ES');
            case 'week':
                const date = new Date(periodKey);
                const weekEnd = new Date(date);
                weekEnd.setDate(date.getDate() + 6);
                return `${date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`;
            case 'month':
            default:
                const [year, month] = periodKey.split('-');
                return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('es-ES', { 
                    month: 'long', 
                    year: 'numeric' 
                });
        }
    }

    calculateMonthlySavings(gastos, presupuestos) {
        const monthlyTotals = {};
        
        gastos.forEach(gasto => {
            const date = new Date(gasto.fecha);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + gasto.monto;
        });
        
        const months = Object.keys(monthlyTotals).sort();
        const result = { meses: [], ahorro: [], presupuesto: [] };
        
        months.forEach(monthKey => {
            const [year, month] = monthKey.split('-');
            const presupuesto = presupuestos.find(p => 
                p.mes === parseInt(month) && p.anio === parseInt(year)
            );
            
            if (presupuesto) {
                const ahorro = presupuesto.monto - monthlyTotals[monthKey];
                result.meses.push(this.formatPeriod(monthKey, 'month'));
                result.ahorro.push(ahorro);
                result.presupuesto.push(presupuesto.monto);
            }
        });
        
        return result;
    }

    analyzeBudgetPerformance(gastos, presupuestos) {
        const monthlyData = {};
        
        gastos.forEach(gasto => {
            const date = new Date(gasto.fecha);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { gastos: 0, presupuesto: 0 };
            }
            monthlyData[monthKey].gastos += gasto.monto;
        });
        
        presupuestos.forEach(presupuesto => {
            const monthKey = `${presupuesto.anio}-${String(presupuesto.mes).padStart(2, '0')}`;
            if (monthlyData[monthKey]) {
                monthlyData[monthKey].presupuesto = presupuesto.monto;
            }
        });
        
        const months = Object.keys(monthlyData).sort();
        const result = { meses: [], desviacion: [], cumplimiento: [] };
        
        months.forEach(monthKey => {
            const data = monthlyData[monthKey];
            if (data.presupuesto > 0) {
                const desviacion = data.gastos - data.presupuesto;
                const cumplimiento = Math.max(0, (1 - (data.gastos / data.presupuesto)) * 100);
                
                result.meses.push(this.formatPeriod(monthKey, 'month'));
                result.desviacion.push(desviacion);
                result.cumplimiento.push(cumplimiento);
            }
        });
        
        return result;
    }

    getCategoryName(categoria) {
        const nombres = {
            'comida': '🍕 Comida',
            'transporte': '🚗 Transporte',
            'entretenimiento': '🎬 Entretenimiento',
            'salud': '🏥 Salud',
            'educacion': '📚 Educación',
            'compras': '🛍️ Compras',
            'servicios': '🏠 Servicios',
            'otros': '📦 Otros'
        };
        return nombres[categoria] || categoria;
    }

    getPaymentMethodName(metodo) {
        const nombres = {
            'efectivo': '💵 Efectivo',
            'debito': '🏦 Débito',
            'credito': '💳 Crédito'
        };
        return nombres[metodo] || metodo;
    }

    updateCustomRange() {
        const from = document.getElementById('chart-from').value;
        const to = document.getElementById('chart-to').value;
        
        if (from && to) {
            this.chartConfig.customRange = {
                from: new Date(from),
                to: new Date(to)
            };
            this.updateAllCharts();
        }
    }

    async exportChart(format) {
        // Implementación básica de exportación
        try {
            await Plotly.downloadImage('chart-detailed-evolution', {
                format: format,
                filename: `grafico_evolucion_${new Date().toISOString().split('T')[0]}`,
                height: 600,
                width: 800
            });
            this.mostrarMensaje('Gráfico exportado correctamente', 'success');
        } catch (error) {
            console.error('Error exportando gráfico:', error);
            this.mostrarMensaje('Error al exportar el gráfico', 'error');
        }
    }

    async exportAllCharts() {
        // Exportar todos los gráficos (implementación básica)
        const chartIds = [
            'chart-detailed-evolution',
            'chart-payment-methods', 
            'chart-savings-trend',
            'chart-budget-analysis'
        ];
        
        let exported = 0;
        for (const chartId of chartIds) {
            try {
                await Plotly.downloadImage(chartId, {
                    format: 'png',
                    filename: `grafico_${chartId}_${new Date().toISOString().split('T')[0]}`,
                    height: 600,
                    width: 800
                });
                exported++;
            } catch (error) {
                console.error(`Error exportando ${chartId}:`, error);
            }
        }
        
        if (exported > 0) {
            this.mostrarMensaje(`${exported} gráficos exportados correctamente`, 'success');
        } else {
            this.mostrarMensaje('Error al exportar los gráficos', 'error');
        }
    }

    loadChartConfig() {
        const savedConfig = localStorage.getItem('chartConfig');
        if (savedConfig) {
            this.chartConfig = { ...this.chartConfig, ...JSON.parse(savedConfig) };
        }
        
        // Aplicar configuración cargada a los controles
        const rangeSelect = document.getElementById('chart-range');
        const groupingSelect = document.getElementById('chart-grouping');
        
        if (rangeSelect) rangeSelect.value = this.chartConfig.range;
        if (groupingSelect) groupingSelect.value = this.chartConfig.grouping;
    }

    saveChartConfig() {
        localStorage.setItem('chartConfig', JSON.stringify(this.chartConfig));
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
            background: ${tipo === 'success' ? 'var(--success-color)' : tipo === 'error' ? 'var(--danger-color)' : 'var(--info-color)'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: var(--radius);
            box-shadow: var(--shadow);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Funciones globales para interactuar desde HTML
function toggleBudgetAnalysis() {
    // Implementar toggle para análisis detallado
    const chart = document.getElementById('chart-budget-analysis');
    if (chart) {
        // Alternar entre vista simple y detallada
        console.log('Alternando análisis de presupuesto...');
    }
}

// Inicializar manager de gráficos
//document.addEventListener('DOMContentLoaded', () => {
    // Solo inicializar si estamos en la sección gráficos
//    if (document.getElementById('graficos')) {
//        window.chartsManager = new ChartsManager();
//    }
//});