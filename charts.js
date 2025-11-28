// charts.js - CORREGIDO: CARGA DATOS DE FIREBASE
class ChartsManager {
    constructor() {
        this.init();
    }
    async init() {
        this.setupEventListeners();
        await this.loadAllCharts();
    }
    setupEventListeners() {
        document.getElementById('btn-exportar-graficos')?.addEventListener('click', () => this.exportarTodos());
        document.getElementById('chart-range')?.addEventListener('change', (e) => {
            if (e.target.value === 'custom') {
                document.getElementById('custom-range').style.display = 'block';
            } else {
                document.getElementById('custom-range').style.display = 'none';
                this.loadAllCharts();
            }
        });
        document.getElementById('chart-grouping')?.addEventListener('change', () => this.loadAllCharts());
        ['chart-from', 'chart-to'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', () => this.loadAllCharts());
        });
    }
    async loadAllCharts() {
        const userId = window.authManager?.getUserId();
        if (!userId) return;
        try {
            const gastos = await this.fetchGastos(userId);
            const categorias = await this.fetchCategorias(userId);
            const metodos = this.agruparPorMetodo(gastos);
            const evolucion = this.agruparPorFecha(gastos);
            this.renderChartEvolucion(evolucion);
            this.renderChartPagos(metodos);
            this.renderChartAhorro(gastos);
            this.renderChartPresupuesto(gastos);
        } catch (error) {
            console.error('Error cargando gráficos:', error);
        }
    }
    async fetchGastos(userId) {
        const doc = await firebaseDb.collection(userId).doc('gastos').get();
        return doc.exists ? doc.data().items || [] : [];
    }
    async fetchCategorias(userId) {
        const doc = await firebaseDb.collection(userId).doc('categorias').get();
        return doc.exists ? doc.data().items || [] : [];
    }
    agruparPorMetodo(gastos) {
        const metodos = {};
        gastos.forEach(g => {
            const clave = g.metodoPago === 'credito' || g.metodoPago === 'debito'
                ? (g.tarjeta ? `${g.metodoPago}-${g.tarjeta}` : g.metodoPago)
                : g.metodoPago;
            if (!metodos[clave]) metodos[clave] = { total: 0, metodo: g.metodoPago, tarjeta: g.tarjeta || null };
            metodos[clave].total += g.monto;
        });
        return metodos;
    }
    agruparPorFecha(gastos) {
        const rango = document.getElementById('chart-range')?.value || '12';
        let startDate, endDate;
        if (rango === 'custom') {
            const desde = document.getElementById('chart-from')?.value;
            const hasta = document.getElementById('chart-to')?.value;
            if (desde && hasta) {
                startDate = new Date(desde);
                endDate = new Date(hasta);
            } else {
                return [];
            }
        } else {
            const meses = parseInt(rango);
            endDate = new Date();
            startDate = new Date();
            startDate.setMonth(endDate.getMonth() - meses);
        }
        const agrupado = {};
        gastos.forEach(g => {
            const fecha = g.fecha?.toDate ? g.fecha.toDate() : new Date(g.fecha);
            if (fecha < startDate || fecha > endDate) return;
            const key = fecha.toISOString().split('T')[0];
            if (!agrupado[key]) agrupado[key] = 0;
            agrupado[key] += g.monto;
        });
        return Object.entries(agrupado).map(([fecha, monto]) => ({ fecha, monto })).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    }
    renderChartEvolucion(data) {
        const container = document.getElementById('chart-detailed-evolution');
        if (!container) return;
        if (data.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:2rem;color:#666;">Sin datos</div>';
            return;
        }
        const fechas = data.map(d => d.fecha);
        const montos = data.map(d => d.monto);
        Plotly.newPlot(container, [{
            x: fechas, y: montos, type: 'scatter', mode: 'lines+markers', line: { color: '#4361ee' }
        }], {
            height: 250, margin: { t: 30, b: 40, l: 40, r: 20 }, paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
            xaxis: { tickangle: -45, gridcolor: '#f0f0f0' }, yaxis: { gridcolor: '#f0f0f0', tickformat: '$.0f' }
        }, { displayModeBar: false });
    }
    renderChartPagos(metodos) {
        const container = document.getElementById('chart-payment-methods');
        if (!container) return;
        const keys = Object.keys(metodos);
        if (keys.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:2rem;color:#666;">Sin datos</div>';
            return;
        }
        const nombres = { efectivo: '💵 Efectivo', debito: '🏦 Débito', credito: '💳 Crédito' };
        const labels = keys.map(k => {
            const partes = k.split('-');
            if (partes.length > 1) return `${nombres[partes[0]] || partes[0]} - ${partes.slice(1).join('-')}`;
            return nombres[k] || k;
        });
        const valores = keys.map(k => metodos[k].total);
        Plotly.newPlot(container, [{
            x: labels, y: valores, type: 'bar', marker: { color: ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0'] }
        }], {
            height: 250, margin: { t: 30, b: 60, l: 40, r: 20 }, paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
            xaxis: { tickangle: -45, gridcolor: '#f0f0f0' }, yaxis: { gridcolor: '#f0f0f0', tickformat: '$.0f' }
        }, { displayModeBar: false });
    }
    renderChartAhorro(gastos) {
        const container = document.getElementById('chart-savings-trend');
        if (!container) return;
        const porMes = {};
        gastos.forEach(g => {
            const fecha = g.fecha?.toDate ? g.fecha.toDate() : new Date(g.fecha);
            const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
            if (!porMes[mes]) porMes[mes] = 0;
            porMes[mes] += g.monto;
        });
        const meses = Object.keys(porMes).sort();
        const gastosArr = meses.map(m => porMes[m]);
        Plotly.newPlot(container, [{
            x: meses, y: gastosArr, type: 'bar', marker: { color: '#4361ee' }
        }], {
            height: 250, margin: { t: 30, b: 40, l: 40, r: 20 }, paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
            xaxis: { gridcolor: '#f0f0f0' }, yaxis: { gridcolor: '#f0f0f0', tickformat: '$.0f' }
        }, { displayModeBar: false });
    }
    renderChartPresupuesto(gastos) {
        const container = document.getElementById('chart-budget-analysis');
        if (!container) return;
        const porCategoria = {};
        gastos.forEach(g => {
            if (!porCategoria[g.categoria]) porCategoria[g.categoria] = 0;
            porCategoria[g.categoria] += g.monto;
        });
        const categorias = Object.keys(porCategoria);
        if (categorias.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:2rem;color:#666;">Sin datos</div>';
            return;
        }
        const montos = Object.values(porCategoria);
        Plotly.newPlot(container, [{
            values: montos, labels: categorias, type: 'pie', hole: 0.4, textinfo: 'label+percent', textposition: 'inside'
        }], {
            height: 250, margin: { t: 0, b: 0, l: 0, r: 0 }, paper_bgcolor: 'transparent', plot_bgcolor: 'transparent', showlegend: true
        }, { displayModeBar: false });
    }
    exportarTodos() {
        alert('Función de exportación implementable con Plotly.Snapshot (requiere licencia).\nPor ahora, usa los botones PNG/SVG en cada gráfico.');
    }
}
// Inicializar si la sección está activa
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('graficos')) {
        if (typeof ChartsManager !== 'undefined') {
            window.chartsManager = new ChartsManager();
        }
    }
});