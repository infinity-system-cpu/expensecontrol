// service-worker.js - Service Worker con sincronización mejorada
const CACHE_NAME = 'control-gastos-v1.3';
const SYNC_TAG = 'sync-gastos';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/dashboard.js',
  '/config.js',
  '/budget.js',
  '/tasks.js',
  '/backup.js',
  '/charts.js',
  '/theme.js',
  '/pwa.js',
  'https://cdn.plot.ly/plotly-3.0.1.min.js',
  'https://cdn.jsdelivr.net/npm/feather-icons@4.29.2/dist/feather.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Instalar Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto durante instalación');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Todos los recursos cacheados');
        return self.skipWaiting();
      })
  );
});

// Activar Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Limpiar caches antiguos
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Borrando cache antiguo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Tomar control de todos los clients
      self.clients.claim()
    ]).then(() => {
      console.log('Service Worker activado y listo');
      
      // Enviar mensaje a todos los clients
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            version: '1.3'
          });
        });
      });
    })
  );
});

// Estrategia: Stale While Revalidate para mejor UX
self.addEventListener('fetch', event => {
  // Excluir Firebase y APIs externas del cache
  if (event.request.url.includes('firebase') || 
      event.request.url.includes('googleapis') ||
      event.request.url.includes('gstatic') ||
      event.request.url.includes('cdnjs') ||
      event.request.url.includes('cdn.plot.ly') ||
      event.request.url.includes('cdn.jsdelivr.net')) {
    return fetch(event.request);
  }

  // Para solicitudes de datos (API), usar Network First
  if (event.request.url.includes('/api/') || event.request.headers.get('Accept') === 'application/json') {
    event.respondWith(networkFirstStrategy(event));
    return;
  }

  // Para recursos estáticos, usar Cache First
  event.respondWith(cacheFirstStrategy(event));
});

// Estrategia: Cache First para recursos estáticos
async function cacheFirstStrategy(event) {
  const cachedResponse = await caches.match(event.request);
  
  if (cachedResponse) {
    // Actualizar el cache en segundo plano
    event.waitUntil(updateCache(event.request));
    return cachedResponse;
  }
  
  // Si no está en cache, buscar en red
  try {
    const networkResponse = await fetch(event.request);
    
    // Cachear la respuesta para futuras solicitudes
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(event.request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback para HTML
    if (event.request.headers.get('Accept').includes('text/html')) {
      return caches.match('/index.html');
    }
    
    // Fallback para otros recursos
    return new Response('Error de conexión', {
      status: 408,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Estrategia: Network First para datos
async function networkFirstStrategy(event) {
  try {
    const networkResponse = await fetch(event.request);
    
    // Actualizar cache con nueva respuesta
    const cache = await caches.open(CACHE_NAME);
    cache.put(event.request, networkResponse.clone());
    
    return networkResponse;
  } catch (error) {
    // Si falla la red, intentar servir desde cache
    const cachedResponse = await caches.match(event.request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response(JSON.stringify({ 
      error: 'Sin conexión y sin datos en cache',
      offline: true 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Actualizar cache en segundo plano
async function updateCache(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response);
    }
  } catch (error) {
    // Silenciar errores de actualización
    console.log('Error actualizando cache:', error);
  }
}

// LÓGICA DE SINCRONIZACIÓN MEJORADA
const syncQueue = [];

// Manejar mensajes del cliente
self.addEventListener('message', event => {
  console.log('Mensaje recibido del cliente:', event.data);
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'QUEUE_SYNC':
      // Agregar operación a la cola de sincronización
      syncQueue.push(event.data.payload);
      console.log('Operación encolada:', event.data.payload);
      
      // Solicitar sincronización
      self.registration.sync.register(SYNC_TAG)
        .then(() => {
          console.log('Sincronización registrada');
          event.ports[0].postMessage({ success: true });
        })
        .catch(error => {
          console.error('Error registrando sync:', error);
          event.ports[0].postMessage({ 
            success: false, 
            error: error.message 
          });
        });
      break;
      
    case 'GET_SYNC_QUEUE':
      // Enviar cola de sincronización al cliente
      event.ports[0].postMessage({ queue: syncQueue });
      break;
      
    case 'CLEAR_SYNC_QUEUE':
      // Limpiar cola de sincronización
      syncQueue.length = 0;
      event.ports[0].postMessage({ success: true });
      break;
  }
});

// Manejar sincronización en segundo plano
self.addEventListener('sync', event => {
  if (event.tag === SYNC_TAG) {
    console.log('Iniciando sincronización en segundo plano...');
    event.waitUntil(processSyncQueue());
  }
});

// Procesar cola de sincronización
async function processSyncQueue() {
  console.log('Procesando cola de sincronización:', syncQueue.length);
  
  if (syncQueue.length === 0) {
    console.log('Cola de sincronización vacía');
    return;
  }
  
  const resultados = [];
  
  // Procesar cada operación en la cola
  for (const operation of syncQueue) {
    try {
      console.log('Procesando operación:', operation);
      
      const result = await processSyncOperation(operation);
      resultados.push({
        operation,
        success: true,
        result
      });
      
      console.log('Operación exitosa:', operation);
    } catch (error) {
      console.error('Error procesando operación:', error);
      resultados.push({
        operation,
        success: false,
        error: error.message
      });
      
      // Si es un error crítico, mantener en cola para reintentar
      if (isCriticalError(error)) {
        throw error; // Esto hará que se reintente la sincronización
      }
    }
  }
  
  // Notificar a los clients sobre los resultados
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'SYNC_COMPLETE',
      results: resultados,
      timestamp: new Date().toISOString()
    });
  });
  
  // Limpiar cola solo si todas las operaciones fueron exitosas
  const allSuccessful = resultados.every(r => r.success);
  if (allSuccessful) {
    syncQueue.length = 0;
    console.log('Cola de sincronización limpiada');
  }
}

// Procesar operación individual de sincronización
async function processSyncOperation(operation) {
  switch (operation.type) {
    case 'SYNC_GASTOS':
      return await syncGastos(operation.data);
      
    case 'BACKUP_DATA':
      return await backupData(operation.data);
      
    case 'SYNC_CONFIG':
      return await syncConfig(operation.data);
      
    default:
      throw new Error(`Tipo de operación no soportado: ${operation.type}`);
  }
}

// Sincronizar gastos con Firebase
async function syncGastos(data) {
  const { userId, gastos } = data;
  
  try {
    // Aquí iría la lógica real para sincronizar con Firebase
    // Por ahora simulamos una llamada exitosa
    console.log(`Sincronizando ${gastos.length} gastos para usuario ${userId}`);
    
    // Simular retardo de red
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      synced: gastos.length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error sincronizando gastos:', error);
    throw error;
  }
}

// Hacer backup de datos
async function backupData(data) {
  const { userId, collection, items } = data;
  
  console.log(`Haciendo backup de ${items.length} items de ${collection} para ${userId}`);
  
  // Guardar en IndexedDB para backup local
  await saveToIndexedDB(userId, collection, items);
  
  return {
    backedUp: items.length,
    collection,
    timestamp: new Date().toISOString()
  };
}

// Sincronizar configuración
async function syncConfig(data) {
  const { userId, config } = data;
  
  console.log(`Sincronizando configuración para ${userId}:`, config);
  
  // Simular retardo
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    synced: Object.keys(config).length,
    timestamp: new Date().toISOString()
  };
}

// Guardar en IndexedDB
async function saveToIndexedDB(userId, collection, items) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('GastosBackup', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['backups'], 'readwrite');
      const store = transaction.objectStore('backups');
      
      const backupData = {
        id: `${userId}_${collection}_${Date.now()}`,
        userId,
        collection,
        items,
        timestamp: new Date().toISOString()
      };
      
      const putRequest = store.put(backupData);
      
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('backups')) {
        db.createObjectStore('backups', { keyPath: 'id' });
      }
    };
  });
}

// Determinar si un error es crítico
function isCriticalError(error) {
  const criticalErrors = [
    'NetworkError',
    'TypeError',
    'QuotaExceededError'
  ];
  
  return criticalErrors.some(criticalError => 
    error.name.includes(criticalError) || error.message.includes(criticalError)
  );
}

// Manejar push notifications (opcional)
self.addEventListener('push', event => {
  console.log('Push notification recibida:', event);
  
  const options = {
    body: 'Tienes datos pendientes por sincronizar',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'sync',
        title: 'Sincronizar ahora'
      },
      {
        action: 'close',
        title: 'Cerrar'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Control de Gastos', options)
  );
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', event => {
  console.log('Notificación clickeada:', event.notification.tag);
  event.notification.close();
  
  if (event.action === 'sync') {
    // Iniciar sincronización
    self.registration.sync.register(SYNC_TAG)
      .then(() => {
        console.log('Sincronización iniciada desde notificación');
      })
      .catch(error => {
        console.error('Error iniciando sync desde notificación:', error);
      });
  }
  
  // Abrir la aplicación
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow('/');
    })
  );
});

// Periodic Sync (solo en navegadores que lo soporten)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', event => {
    if (event.tag === 'periodic-sync-gastos') {
      console.log('Sincronización periódica iniciada');
      event.waitUntil(processPeriodicSync());
    }
  });
}

// Procesar sincronización periódica
async function processPeriodicSync() {
  try {
    // Obtener datos pendientes de IndexedDB
    const pendingData = await getPendingDataFromIndexedDB();
    
    if (pendingData.length > 0) {
      console.log(`Sincronizando ${pendingData.length} datos pendientes`);
      
      // Aquí iría la lógica para sincronizar con el servidor
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Limpiar datos sincronizados
      await clearSyncedDataFromIndexedDB(pendingData);
      
      console.log('Sincronización periódica completada');
    }
  } catch (error) {
    console.error('Error en sincronización periódica:', error);
  }
}

// Obtener datos pendientes de IndexedDB
async function getPendingDataFromIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('GastosBackup', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['backups'], 'readonly');
      const store = transaction.objectStore('backups');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
  });
}

// Limpiar datos sincronizados de IndexedDB
async function clearSyncedDataFromIndexedDB(data) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('GastosBackup', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['backups'], 'readwrite');
      const store = transaction.objectStore('backups');
      
      const deletePromises = data.map(item => {
        return new Promise((resolveDelete, rejectDelete) => {
          const deleteRequest = store.delete(item.id);
          deleteRequest.onsuccess = () => resolveDelete();
          deleteRequest.onerror = () => rejectDelete(deleteRequest.error);
        });
      });
      
      Promise.all(deletePromises)
        .then(() => resolve())
        .catch(error => reject(error));
    };
  });
}