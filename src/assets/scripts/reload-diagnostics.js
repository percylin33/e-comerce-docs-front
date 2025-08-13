// Agregar este script al index.html para monitorear recargas en producción

(function() {
  'use strict';
  
  var STORAGE_KEY = 'reload_diagnostics';
  var MAX_RECORDS = 50;
  
  function getDiagnostics() {
    var stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : { reloads: [], errors: [] };
  }
  
  function saveDiagnostics(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
  
  function recordReload() {
    var diagnostics = getDiagnostics();
    var record = {
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      performance: performance.now()
    };
    
    diagnostics.reloads.unshift(record);
    if (diagnostics.reloads.length > MAX_RECORDS) {
      diagnostics.reloads = diagnostics.reloads.slice(0, MAX_RECORDS);
    }
    
    saveDiagnostics(diagnostics);
    
    // Detectar recargas rápidas (posible loop)
    var recentReloads = diagnostics.reloads.filter(function(r) {
      return Date.now() - r.timestamp < 10000; // Últimos 10 segundos
    });
    
    if (recentReloads.length >= 3) {
      console.error('🚨 INFINITE RELOAD LOOP DETECTED!', {
        recentReloads: recentReloads,
        totalReloads: diagnostics.reloads.length
      });
      
      // Intentar detener el loop
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      
      // Limpiar localStorage problemático
      var problematicKeys = ['forcedLogout', 'forcedLogoutTime'];
      for (var i = 0; i < problematicKeys.length; i++) {
        localStorage.removeItem(problematicKeys[i]);
      }
    }
  }
  
  function recordError(error) {
    var diagnostics = getDiagnostics();
    var record = {
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack,
      url: window.location.href
    };
    
    diagnostics.errors.unshift(record);
    if (diagnostics.errors.length > MAX_RECORDS) {
      diagnostics.errors = diagnostics.errors.slice(0, MAX_RECORDS);
    }
    
    saveDiagnostics(diagnostics);
  }
  
  // Registrar recarga al cargar la página
  document.addEventListener('DOMContentLoaded', recordReload);
  
  // Capturar errores JavaScript
  window.addEventListener('error', function(event) {
    recordError(event.error || { message: event.message });
  });
  
  // Capturar errores de promesas rechazadas
  window.addEventListener('unhandledrejection', function(event) {
    recordError(new Error('Unhandled Promise Rejection: ' + event.reason));
  });
  
  // Función global para obtener diagnósticos
  window.getReloadDiagnostics = function() {
    return getDiagnostics();
  };
  
  // Función global para limpiar diagnósticos
  window.clearReloadDiagnostics = function() {
    localStorage.removeItem(STORAGE_KEY);
    console.log('Diagnostics cleared');
  };
  
})();
