// Módulo Backup - Gestión de backups (Versión simplificada)
class BackupManager {
    constructor() {
        this.backups = [];
        this.autoBackupConfig = {
            enabled: false, // Desactivado por defecto para evitar problemas
            frequency: 'weekly',
            time: '02:00',
            maxBackups: 10
        };
        this.init();
    }

    init() {
        this.cargarBackups();
        this.cargarConfigAutoBackup();
        this.setupEventListeners();
        this.renderBackups();
        this.renderBackupStats();
    }

    setupEventListeners() {
        // Backup manual
        const btnBackup = document.getElementById('btn-backup-now');
        if (btnBackup) {
            btnBackup.addEventListener('click', () => {
                this.crearBackupManual();
            });
        }

        // Configuración auto backup
        const autoBackup = document.getElementById('auto-backup');
        if (autoBackup) {
            autoBackup.addEventListener('change', (e) => {
                this.autoBackupConfig.enabled = e.target.checked;
                this.guardarConfigAutoBackup();
            });
        }

        const frequency = document.getElementById('backup-frequency');
        if (frequency) {
            frequency.addEventListener('change', (e) => {
                this.autoBackupConfig.frequency = e.target.value;
                this.guardarConfigAutoBackup();
            });
        }

        const backupTime = document.getElementById('backup-time');
        if (backupTime) {
            backupTime.addEventListener('change', (e) => {
                this.autoBackupConfig.time = e.target.value;
                this.guardarConfigAutoBackup();
            });
        }

        const maxBackups = document.getElementById('max-backups');
        if (maxBackups) {
            maxBackups.addEventListener('change', (e) => {
                this.autoBackupConfig.maxBackups = parseInt(e.target.value);
                this.guardarConfigAutoBackup();
                this.aplicarLimiteBackups();
            });
        }

        // Restauración
        const btnRestore = document.getElementById('btn-restore');
        if (btnRestore) {
            btnRestore.addEventListener('click', () => {
                this.restaurarBackup();
            });
        }

        const btnDownload = document.getElementById('btn-download-backup');
        if (btnDownload) {
            btnDownload.addEventListener('click', () => {
                this.descargarBackup();
            });
        }

        const btnDelete = document.getElementById('btn-delete-backup');
        if (btnDelete) {
            btnDelete.addEventListener('click', () => {
                this.eliminarBackup();
            });
        }

        // Importación
        const btnChooseFile = document.getElementById('btn-choose-file');
        const importFile = document.getElementById('import-file');
        const btnImport = document.getElementById('btn-import-data');

        if (btnChooseFile && importFile) {
            btnChooseFile.addEventListener('click', () => {
                importFile.click();
            });
        }

        if (importFile) {
            importFile.addEventListener('change', (e) => {
                this.manejarArchivoImportado(e.target.files[0]);
            });
        }

        if (btnImport) {
            btnImport.addEventListener('click', () => {
                this.importarDatos();
            });
        }
    }

    cargarBackups() {
        this.backups = JSON.parse(localStorage.getItem('backups') || '[]');
    }

    cargarConfigAutoBackup() {
        const configGuardada = localStorage.getItem('autoBackupConfig');
        if (configGuardada) {
            this.autoBackupConfig = { ...this.autoBackupConfig, ...JSON.parse(configGuardada) };
        }
        
        // Aplicar configuración a los controles
        const autoBackup = document.getElementById('auto-backup');
        const frequency = document.getElementById('backup-frequency');
        const backupTime = document.getElementById('backup-time');
        const maxBackups = document.getElementById('max-backups');
        
        if (autoBackup) autoBackup.checked = this.autoBackupConfig.enabled;
        if (frequency) frequency.value = this.autoBackupConfig.frequency;
        if (backupTime) backupTime.value = this.autoBackupConfig.time;
        if (maxBackups) maxBackups.value = this.autoBackupConfig.maxBackups;
    }

    guardarBackups() {
        localStorage.setItem('backups', JSON.stringify(this.backups));
    }

    guardarConfigAutoBackup() {
        localStorage.setItem('autoBackupConfig', JSON.stringify(this.autoBackupConfig));
    }

    async crearBackupManual() {
        try {
            const backup = await this.crearBackup('manual');
            this.backups.unshift(backup);
            this.aplicarLimiteBackups();
            this.guardarBackups();
            this.renderBackups();
            this.renderBackupStats();
            this.mostrarMensaje('Backup creado correctamente', 'success');
        } catch (error) {
            this.mostrarMensaje('Error al crear el backup: ' + error.message, 'error');
        }
    }

    async crearBackup(tipo = 'auto') {
        const timestamp = new Date().toISOString();
        const datos = {
            gastos: JSON.parse(localStorage.getItem('gastos') || '[]'),
            presupuestos: JSON.parse(localStorage.getItem('presupuestos') || '[]'),
            categorias: JSON.parse(localStorage.getItem('categorias') || '[]'),
            configGraficos: JSON.parse(localStorage.getItem('configGraficos') || '{}'),
            autoBackupConfig: JSON.parse(localStorage.getItem('autoBackupConfig') || '{}'),
            metadata: {
                version: '1.0.0',
                fecha: timestamp,
                totalGastos: JSON.parse(localStorage.getItem('gastos') || '[]').length,
                totalPresupuestos: JSON.parse(localStorage.getItem('presupuestos') || '[]').length,
                totalCategorias: JSON.parse(localStorage.getItem('categorias') || '[]').length
            }
        };

        return {
            id: timestamp,
            tipo: tipo,
            fecha: timestamp,
            nombre: `backup_${timestamp.split('T')[0]}_${tipo}`,
            datos: datos,
            tamaño: JSON.stringify(datos).length
        };
    }

    aplicarLimiteBackups() {
        if (this.backups.length > this.autoBackupConfig.maxBackups) {
            this.backups = this.backups.slice(0, this.autoBackupConfig.maxBackups);
            this.guardarBackups();
        }
    }

    // En BackupManager, mejorar el renderBackups y la interfaz

renderBackups() {
    const container = document.getElementById('backup-list');
    const select = document.getElementById('restore-select');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    if (this.backups.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">💾</div>
                <h3>No hay backups disponibles</h3>
                <p>Crea tu primer backup para proteger tus datos.</p>
                <button class="btn-primary" onclick="backupManager.crearBackupManual()">
                    🛡️ Crear Primer Backup
                </button>
            </div>
        `;
        return;
    }
    
    this.backups.forEach(backup => {
        const item = this.crearElementoBackup(backup);
        container.appendChild(item);
    });

    // Actualizar select de restauración
    if (select) {
        select.innerHTML = '<option value="">Selecciona un backup</option>';
        this.backups.forEach(backup => {
            const option = document.createElement('option');
            option.value = backup.id;
            option.textContent = `${this.formatearFecha(backup.fecha)} (${backup.tipo}) - ${this.formatearTamaño(backup.tamaño)}`;
            select.appendChild(option);
        });
    }
}

crearElementoBackup(backup) {
    const item = document.createElement('div');
    item.className = 'backup-item';
    
    const tipoIcono = backup.tipo === 'manual' ? '🛡️' : '🤖';
    const tipoClass = backup.tipo === 'manual' ? 'manual' : 'auto';
    
    item.innerHTML = `
        <div class="backup-icon ${tipoClass}">
            ${tipoIcono}
        </div>
        <div class="backup-info">
            <div class="backup-header">
                <h4>${backup.nombre}</h4>
                <span class="backup-type ${tipoClass}">${backup.tipo === 'manual' ? 'Manual' : 'Automático'}</span>
            </div>
            <div class="backup-details">
                <div class="backup-meta">
                    <span class="backup-date">📅 ${this.formatearFecha(backup.fecha)}</span>
                    <span class="backup-size">💾 ${this.formatearTamaño(backup.tamaño)}</span>
                </div>
                <div class="backup-stats">
                    <span class="stat">${backup.datos.metadata.totalGastos} gastos</span>
                    <span class="stat">${backup.datos.metadata.totalPresupuestos} presupuestos</span>
                    <span class="stat">${backup.datos.metadata.totalCategorias} categorías</span>
                </div>
            </div>
        </div>
        <div class="backup-actions">
            <button class="btn-icon" onclick="backupManager.descargarBackupEspecifico('${backup.id}')" title="Descargar">
                📥
            </button>
            <button class="btn-icon btn-danger" onclick="backupManager.eliminarBackupEspecifico('${backup.id}')" title="Eliminar">
                🗑️
            </button>
        </div>
    `;
    return item;
}

renderBackupStats() {
    const lastBackup = this.backups[0];
    const nextBackup = this.calcularProximoBackup();
    const totalSize = this.backups.reduce((sum, backup) => sum + backup.tamaño, 0);
    
    const statsContainer = document.getElementById('backup-stats');
    if (!statsContainer) return;
    
    statsContainer.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">🕒</div>
                <div class="stat-info">
                    <span class="stat-label">Último Backup</span>
                    <span class="stat-number">${lastBackup ? this.formatearFechaCorta(lastBackup.fecha) : 'Nunca'}</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">⏰</div>
                <div class="stat-info">
                    <span class="stat-label">Próximo Backup</span>
                    <span class="stat-number">${nextBackup ? this.formatearFechaCorta(nextBackup) : '--'}</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📊</div>
                <div class="stat-info">
                    <span class="stat-label">Total Backups</span>
                    <span class="stat-number">${this.backups.length}</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">💾</div>
                <div class="stat-info">
                    <span class="stat-label">Espacio Usado</span>
                    <span class="stat-number">${this.formatearTamaño(totalSize)}</span>
                </div>
            </div>
        </div>
    `;
}

formatearFechaCorta(fechaISO) {
    return new Date(fechaISO).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit'
    });
}

    formatearTamaño(bytes) {
        const mb = bytes / (1024 * 1024);
        return mb < 1 ? `${Math.round(bytes / 1024)} KB` : `${mb.toFixed(2)} MB`;
    }

    calcularProximoBackup() {
        if (!this.autoBackupConfig.enabled) return null;
        
        const now = new Date();
        let nextBackup = new Date();
        
        switch (this.autoBackupConfig.frequency) {
            case 'daily':
                nextBackup.setDate(now.getDate() + 1);
                break;
            case 'weekly':
                nextBackup.setDate(now.getDate() + 7);
                break;
            case 'monthly':
                nextBackup.setMonth(now.getMonth() + 1);
                break;
        }
        
        const [hours, minutes] = this.autoBackupConfig.time.split(':');
        nextBackup.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        return nextBackup;
    }

    restaurarBackup() {
        const select = document.getElementById('restore-select');
        if (!select) return;
        
        const backupId = select.value;
        
        if (!backupId) {
            this.mostrarMensaje('Selecciona un backup para restaurar', 'error');
            return;
        }
        
        const backup = this.backups.find(b => b.id === backupId);
        if (!backup) {
            this.mostrarMensaje('Backup no encontrado', 'error');
            return;
        }
        
        if (!confirm(`¿Estás seguro de que quieres restaurar el backup del ${this.formatearFecha(backup.fecha)}? Esto sobrescribirá todos los datos actuales.`)) {
            return;
        }
        
        try {
            // Restaurar datos
            localStorage.setItem('gastos', JSON.stringify(backup.datos.gastos || []));
            localStorage.setItem('presupuestos', JSON.stringify(backup.datos.presupuestos || []));
            localStorage.setItem('categorias', JSON.stringify(backup.datos.categorias || []));
            localStorage.setItem('configGraficos', JSON.stringify(backup.datos.configGraficos || {}));
            
            if (backup.datos.autoBackupConfig) {
                localStorage.setItem('autoBackupConfig', JSON.stringify(backup.datos.autoBackupConfig));
            }
            
            this.mostrarMensaje('Datos restaurados correctamente. Recargando...', 'success');
            
            // Recargar la aplicación
            setTimeout(() => {
                location.reload();
            }, 2000);
            
        } catch (error) {
            this.mostrarMensaje('Error al restaurar el backup: ' + error.message, 'error');
        }
    }

    descargarBackup() {
        const select = document.getElementById('restore-select');
        if (!select) return;
        
        const backupId = select.value;
        
        if (!backupId) {
            this.mostrarMensaje('Selecciona un backup para descargar', 'error');
            return;
        }
        
        this.descargarBackupEspecifico(backupId);
    }

    descargarBackupEspecifico(backupId) {
        const backup = this.backups.find(b => b.id === backupId);
        if (!backup) {
            this.mostrarMensaje('Backup no encontrado', 'error');
            return;
        }
        
        const dataStr = JSON.stringify(backup.datos, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `${backup.nombre}.json`;
        link.click();
        
        URL.revokeObjectURL(link.href);
        this.mostrarMensaje('Backup descargado correctamente', 'success');
    }

    eliminarBackup() {
        const select = document.getElementById('restore-select');
        if (!select) return;
        
        const backupId = select.value;
        
        if (!backupId) {
            this.mostrarMensaje('Selecciona un backup para eliminar', 'error');
            return;
        }
        
        this.eliminarBackupEspecifico(backupId);
    }

    eliminarBackupEspecifico(backupId) {
        if (!confirm('¿Estás seguro de que quieres eliminar este backup?')) {
            return;
        }
        
        this.backups = this.backups.filter(b => b.id !== backupId);
        this.guardarBackups();
        this.renderBackups();
        this.renderBackupStats();
        this.mostrarMensaje('Backup eliminado correctamente', 'success');
    }

    manejarArchivoImportado(archivo) {
        if (!archivo) return;
        
        const fileName = document.getElementById('file-name');
        const importBtn = document.getElementById('btn-import-data');
        
        if (fileName) fileName.textContent = archivo.name;
        if (importBtn) importBtn.disabled = false;
        
        // Validar tipo de archivo
        if (!archivo.name.endsWith('.json')) {
            this.mostrarMensaje('Solo se permiten archivos JSON', 'error');
            if (importBtn) importBtn.disabled = true;
            return;
        }
    }

    importarDatos() {
        const archivo = document.getElementById('import-file').files[0];
        if (!archivo) {
            this.mostrarMensaje('Selecciona un archivo para importar', 'error');
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const datos = JSON.parse(e.target.result);
                this.procesarDatosImportados(datos, archivo.name);
            } catch (error) {
                this.mostrarMensaje('Error al leer el archivo: ' + error.message, 'error');
            }
        };
        
        reader.onerror = () => {
            this.mostrarMensaje('Error al leer el archivo', 'error');
        };
        
        reader.readAsText(archivo);
    }

    procesarDatosImportados(datos, nombreArchivo) {
        if (!confirm(`¿Importar datos desde ${nombreArchivo}? Esto mezclará con los datos existentes.`)) {
            return;
        }
        
        try {
            // Importar gastos
            if (datos.gastos && Array.isArray(datos.gastos)) {
                const gastosExistentes = JSON.parse(localStorage.getItem('gastos') || '[]');
                const nuevosGastos = [...gastosExistentes, ...datos.gastos];
                localStorage.setItem('gastos', JSON.stringify(nuevosGastos));
            }
            
            // Importar presupuestos
            if (datos.presupuestos && Array.isArray(datos.presupuestos)) {
                const presupuestosExistentes = JSON.parse(localStorage.getItem('presupuestos') || '[]');
                const nuevosPresupuestos = [...presupuestosExistentes, ...datos.presupuestos];
                localStorage.setItem('presupuestos', JSON.stringify(nuevosPresupuestos));
            }
            
            // Importar categorías
            if (datos.categorias && Array.isArray(datos.categorias)) {
                const categoriasExistentes = JSON.parse(localStorage.getItem('categorias') || '[]');
                const nuevasCategorias = [...categoriasExistentes, ...datos.categorias];
                localStorage.setItem('categorias', JSON.stringify(nuevasCategorias));
            }
            
            this.mostrarMensaje('Datos importados correctamente. Recargando...', 'success');
            
            // Recargar la aplicación
            setTimeout(() => {
                location.reload();
            }, 2000);
            
        } catch (error) {
            this.mostrarMensaje('Error al importar datos: ' + error.message, 'error');
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
        }, tipo === 'error' ? 5000 : 3000);
    }
}

// Inicializar manager de backups
//document.addEventListener('DOMContentLoaded', () => {
//    window.backupManager = new BackupManager();
//});