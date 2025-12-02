// backup.js - Sistema de Copias de Seguridad
class BackupManager {
    constructor() {
        this.backupInterval = null;
        this.init();
    }
    
    init() {
        console.log('Inicializando Backup Manager...');
        this.setupEventListeners();
        this.setupAutoBackup();
        this.checkLastBackup();
    }
    
    setupEventListeners() {
        // Agregar botón de backup en la interfaz
        this.addBackupButton();
        
        // Event listener para restauración
        document.addEventListener('backup:restore', (e) => {
            this.restoreBackup(e.detail);
        });
    }
    
    addBackupButton() {
        // Buscar la sección de configuración o crear nueva
        const configSection = document.getElementById('configuracion');
        if (configSection) {
            const backupHTML = `
                <div class="config-card">
                    <div class="config-card-header">
                        <div class="config-icon">💾</div>
                        <div class="config-info">
                            <h4>Copias de Seguridad</h4>
                            <div class="config-badges">
                                <span class="badge badge-success" id="backup-status">Sin backups</span>
                                <span class="badge badge-info" id="last-backup">Último: --</span>
                            </div>
                        </div>
                    </div>
                    <div class="config-actions">
                        <button class="btn btn-primary" id="btn-crear-backup">Crear Backup</button>
                        <button class="btn btn-outline" id="btn-restaurar-backup">Restaurar</button>
                        <button class="btn btn-outline" id="btn-descargar-backup">Descargar</button>
                    </div>
                </div>
            `;
            
            const statsGrid = document.getElementById('config-stats');
            if (statsGrid) {
                statsGrid.insertAdjacentHTML('afterbegin', backupHTML);
                
                // Configurar eventos de los botones
                document.getElementById('btn-crear-backup')?.addEventListener('click', () => this.createBackup());
                document.getElementById('btn-restaurar-backup')?.addEventListener('click', () => this.showRestoreModal());
                document.getElementById('btn-descargar-backup')?.addEventListener('click', () => this.downloadLatestBackup());
            }
        }
    }
    
    async createBackup() {
        const userId = window.authManager?.getUserId();
        if (!userId) {
            this.showNotification('Usuario no autenticado', 'error');
            return;
        }
        
        try {
            this.showNotification('Creando copia de seguridad...', 'info');
            
            // Recopilar todos los datos del usuario
            const backupData = {
                timestamp: new Date().toISOString(),
                userId: userId,
                data: {}
            };
            
            // Lista de colecciones a respaldar
            const collections = ['gastos', 'categorias', 'tarjetas', 'presupuestos', 'tareas'];
            
            for (const collection of collections) {
                try {
                    const docRef = firebaseDb.collection(userId).doc(collection);
                    const doc = await docRef.get();
                    if (doc.exists) {
                        backupData.data[collection] = doc.data();
                    }
                } catch (error) {
                    console.warn(`Error respaldando ${collection}:`, error);
                }
            }
            
            // Guardar en localStorage
            const backupKey = `backup_${userId}_${Date.now()}`;
            localStorage.setItem(backupKey, JSON.stringify(backupData));
            
            // Guardar referencia en lista de backups
            this.saveBackupReference(backupKey, backupData.timestamp);
            
            this.showNotification('✅ Copia de seguridad creada exitosamente', 'success');
            this.updateBackupStatus();
            
            // Opcional: Guardar en Firebase también
            await this.saveToFirebase(userId, backupData);
            
        } catch (error) {
            console.error('Error creando backup:', error);
            this.showNotification('❌ Error creando backup', 'error');
        }
    }
    
    async saveToFirebase(userId, backupData) {
        try {
            const backupRef = firebaseDb.collection('backups').doc(`${userId}_${Date.now()}`);
            await backupRef.set(backupData);
            console.log('Backup guardado en Firebase');
        } catch (error) {
            console.warn('No se pudo guardar backup en Firebase:', error);
        }
    }
    
    saveBackupReference(key, timestamp) {
        const userId = window.authManager?.getUserId();
        const backupListKey = `backup_list_${userId}`;
        let backupList = JSON.parse(localStorage.getItem(backupListKey) || '[]');
        
        backupList.push({
            key: key,
            timestamp: timestamp,
            date: new Date(timestamp).toLocaleString('es-ES')
        });
        
        // Mantener solo los últimos 10 backups
        if (backupList.length > 10) {
            const oldestBackup = backupList.shift();
            localStorage.removeItem(oldestBackup.key);
        }
        
        localStorage.setItem(backupListKey, JSON.stringify(backupList));
    }
    
    async showRestoreModal() {
        const userId = window.authManager?.getUserId();
        const backupListKey = `backup_list_${userId}`;
        const backupList = JSON.parse(localStorage.getItem(backupListKey) || '[]');
        
        if (backupList.length === 0) {
            this.showNotification('No hay backups disponibles', 'warning');
            return;
        }
        
        const modalHTML = `
            <div class="modal" id="modal-restore">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>🔄 Restaurar Copia de Seguridad</h3>
                        <span class="close">&times;</span>
                    </div>
                    <div class="modal-form">
                        <div class="form-group">
                            <label>Seleccionar Backup</label>
                            <select id="select-backup" class="filter-select">
                                ${backupList.map((backup, index) => `
                                    <option value="${backup.key}">
                                        ${backup.date} ${index === 0 ? '(Más reciente)' : ''}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="alert alert-warning" style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 1rem; border-radius: 6px; margin: 1rem 0;">
                            <strong>⚠️ Advertencia:</strong> Restaurar un backup sobrescribirá tus datos actuales.
                        </div>
                        <div class="form-actions">
                            <button class="btn btn-outline cancel">Cancelar</button>
                            <button class="btn btn-primary" id="btn-confirm-restore">Restaurar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = document.getElementById('modal-restore');
        
        // Mostrar modal
        modal.style.display = 'block';
        
        // Configurar eventos
        modal.querySelector('.close').addEventListener('click', () => {
            modal.style.display = 'none';
            modal.remove();
        });
        
        modal.querySelector('.cancel').addEventListener('click', () => {
            modal.style.display = 'none';
            modal.remove();
        });
        
        modal.querySelector('#btn-confirm-restore').addEventListener('click', async () => {
            const selectedKey = modal.querySelector('#select-backup').value;
            await this.restoreBackup(selectedKey);
            modal.style.display = 'none';
            modal.remove();
        });
    }
    
    async restoreBackup(backupKey) {
        if (!confirm('¿Estás seguro de restaurar este backup? Se sobrescribirán los datos actuales.')) {
            return;
        }
        
        try {
            this.showNotification('Restaurando backup...', 'info');
            
            const backupData = JSON.parse(localStorage.getItem(backupKey));
            if (!backupData) {
                throw new Error('Backup no encontrado');
            }
            
            const userId = window.authManager?.getUserId();
            
            // Restaurar cada colección
            for (const [collection, data] of Object.entries(backupData.data)) {
                try {
                    const docRef = firebaseDb.collection(userId).doc(collection);
                    await docRef.set(data);
                    console.log(`Restaurado: ${collection}`);
                } catch (error) {
                    console.warn(`Error restaurando ${collection}:`, error);
                }
            }
            
            this.showNotification('✅ Backup restaurado exitosamente', 'success');
            
            // Recargar la aplicación
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            
        } catch (error) {
            console.error('Error restaurando backup:', error);
            this.showNotification('❌ Error restaurando backup', 'error');
        }
    }
    
    async downloadLatestBackup() {
        const userId = window.authManager?.getUserId();
        const backupListKey = `backup_list_${userId}`;
        const backupList = JSON.parse(localStorage.getItem(backupListKey) || '[]');
        
        if (backupList.length === 0) {
            this.showNotification('No hay backups para descargar', 'warning');
            return;
        }
        
        const latestBackupKey = backupList[0].key;
        const backupData = JSON.parse(localStorage.getItem(latestBackupKey));
        
        if (!backupData) {
            this.showNotification('Backup no encontrado', 'error');
            return;
        }
        
        // Crear archivo JSON
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        const dateStr = new Date().toISOString().split('T')[0];
        a.href = url;
        a.download = `backup_${userId}_${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('✅ Backup descargado', 'success');
    }
    
    setupAutoBackup() {
        // Crear backup automático cada 24 horas
        this.backupInterval = setInterval(() => {
            const lastBackup = localStorage.getItem('last_auto_backup');
            const now = Date.now();
            
            if (!lastBackup || (now - parseInt(lastBackup)) > 24 * 60 * 60 * 1000) {
                console.log('Creando backup automático...');
                this.createBackup();
                localStorage.setItem('last_auto_backup', now.toString());
            }
        }, 60 * 60 * 1000); // Revisar cada hora
    }
    
    checkLastBackup() {
        const lastBackup = localStorage.getItem('last_auto_backup');
        if (lastBackup) {
            const lastDate = new Date(parseInt(lastBackup));
            const now = new Date();
            const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays > 7) {
                this.showNotification(`⚠️ No hay backups desde hace ${diffDays} días`, 'warning');
            }
        }
    }
    
    updateBackupStatus() {
        const userId = window.authManager?.getUserId();
        const backupListKey = `backup_list_${userId}`;
        const backupList = JSON.parse(localStorage.getItem(backupListKey) || '[]');
        
        const statusElement = document.getElementById('backup-status');
        const lastBackupElement = document.getElementById('last-backup');
        
        if (statusElement) {
            if (backupList.length > 0) {
                statusElement.textContent = `${backupList.length} backups`;
                statusElement.className = 'badge badge-success';
            } else {
                statusElement.textContent = 'Sin backups';
                statusElement.className = 'badge badge-secondary';
            }
        }
        
        if (lastBackupElement && backupList.length > 0) {
            lastBackupElement.textContent = `Último: ${backupList[0].date}`;
        }
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `<span>${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'} ${message}</span>`;
        document.body.appendChild(notification);
        
        setTimeout(() => { 
            if (notification.parentElement) notification.remove(); 
        }, 4000);
    }
}

// Hacer disponible globalmente
window.BackupManager = BackupManager;