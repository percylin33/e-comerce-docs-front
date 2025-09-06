// Funciones de utilidad para debug en DevTools Console
// Escribir en la consola del navegador para usar estas funciones

// Verificar estado del UnifiedAntiLoopService
// window.checkAntiLoopStatus = function() {
//   const unifiedService = window.ng?.probe(document.querySelector('ngx-app'))?.injector?.get('UnifiedAntiLoopService');
//   if (unifiedService) {
//     console.log('🔍 Estado del Anti-Loop Service:');
//     console.log('Emergency Mode Active:', unifiedService.isEmergencyModeActive());
//     console.log('Navigation Allowed:', unifiedService.isNavigationAllowed());
//     console.log('Navigation History:', unifiedService.getNavigationHistory());
//     console.log('Emergency State:', unifiedService.getEmergencyState());
//   } else {
//     console.warn('⚠️ No se pudo acceder al UnifiedAntiLoopService');
//   }
// };

// // Forzar reset completo del sistema anti-loop
// window.forceAntiLoopReset = function() {
//   const unifiedService = window.ng?.probe(document.querySelector('ngx-app'))?.injector?.get('UnifiedAntiLoopService');
//   if (unifiedService) {
//     unifiedService.forceReset();
//     console.log('🔄 Anti-Loop Service reseteado completamente');
//   } else {
//     console.warn('⚠️ No se pudo acceder al UnifiedAntiLoopService para reset');
//   }
// };

// // Activar manualmente el modo de emergencia
// window.forceEmergencyMode = function(reason) {
//   const unifiedService = window.ng?.probe(document.querySelector('ngx-app'))?.injector?.get('UnifiedAntiLoopService');
//   if (unifiedService) {
//     unifiedService.forceEmergencyMode(reason || 'manual_activation');
//     console.log('🚨 Modo de emergencia activado manualmente');
//   } else {
//     console.warn('⚠️ No se pudo acceder al UnifiedAntiLoopService');
//   }
// };

// // Limpiar COMPLETAMENTE localStorage (nuclear option)
// window.nuclearCleanup = function() {
//   if (confirm('⚠️ ADVERTENCIA: Esto eliminará TODOS los datos del localStorage. ¿Continuar?')) {
//     try {
//       localStorage.clear();
//       sessionStorage.clear();
      
//       // Limpiar cookies específicas
//       const cookiesToClear = ['g_state', 'G_AUTHUSER_H', 'G_ENABLED_IDPS'];
//       cookiesToClear.forEach(cookie => {
//         document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
//       });
      
//       console.log('☢️ Limpieza nuclear completada - Recargando página...');
      
//       setTimeout(() => {
//         window.location.href = '/site/home';
//       }, 1000);
      
//     } catch (error) {
//       console.error('Error en limpieza nuclear:', error);
//     }
//   }
// };

// // Verificar localStorage problemático
// window.checkProblematicStorage = function() {
//   const problematicKeys = [
//     'forcedLogout', 'forcedLogoutTime', 'emergency_mode', 'emergency_mode_time',
//     'visits_disabled', 'visit_backend_error', 'loginCooldown'
//   ];
  
//   console.log('🔍 Verificando localStorage problemático:');
  
//   const found = {};
//   problematicKeys.forEach(key => {
//     const value = localStorage.getItem(key);
//     if (value) {
//       found[key] = value;
//     }
//   });
  
//   // Verificar también keys de visits
//   Object.keys(localStorage).forEach(key => {
//     if (key.startsWith('visit') || key.includes('diagnostic') || key.includes('reload')) {
//       found[key] = localStorage.getItem(key);
//     }
//   });
  
//   if (Object.keys(found).length > 0) {
//     console.table(found);
//   } else {
//     console.log('✅ No se encontraron keys problemáticos');
//   }
  
//   return found;
// };

// // Limpiar solo keys problemáticos
// window.cleanProblematicStorage = function() {
//   const problematic = window.checkProblematicStorage();
  
//   if (Object.keys(problematic).length > 0) {
//     Object.keys(problematic).forEach(key => {
//       try {
//         localStorage.removeItem(key);
//         console.log(`🧹 Removed: ${key}`);
//       } catch (e) {
//         console.warn(`Could not remove ${key}:`, e);
//       }
//     });
//     console.log('✅ Limpieza de keys problemáticos completada');
//   } else {
//     console.log('✅ No hay keys problemáticos que limpiar');
//   }
// };

// // Monitorear navegaciones en tiempo real
// window.startNavigationMonitoring = function() {
//   if (window.navigationMonitor) {
//     console.log('⚠️ Monitor ya está activo');
//     return;
//   }
  
//   console.log('🔍 Iniciando monitor de navegación...');
  
//   let navigationCount = 0;
//   window.navigationMonitor = setInterval(() => {
//     const currentUrl = window.location.href;
//     navigationCount++;
//     console.log(`[${navigationCount}] Current URL: ${currentUrl}`);
    
//     // Auto-stop después de 30 segundos
//     if (navigationCount >= 30) {
//       window.stopNavigationMonitoring();
//     }
//   }, 1000);
// };

// window.stopNavigationMonitoring = function() {
//   if (window.navigationMonitor) {
//     clearInterval(window.navigationMonitor);
//     window.navigationMonitor = null;
//     console.log('🛑 Monitor de navegación detenido');
//   }
// };

// // Información del sistema
// window.getSystemInfo = function() {
//   console.log('🖥️ Información del Sistema:');
//   console.log('URL actual:', window.location.href);
//   console.log('User Agent:', navigator.userAgent);
//   console.log('Timestamp:', new Date().toISOString());
//   console.log('LocalStorage usage:', Object.keys(localStorage).length, 'keys');
//   console.log('SessionStorage usage:', Object.keys(sessionStorage).length, 'keys');
  
//   // Verificar si Angular está cargado
//   console.log('Angular detectado:', !!window.ng);
  
//   // Verificar servicios específicos
//   try {
//     const app = document.querySelector('ngx-app');
//     if (app && window.ng) {
//       const injector = window.ng.probe(app)?.injector;
//       console.log('Router disponible:', !!injector?.get('Router'));
//       console.log('UnifiedAntiLoopService disponible:', !!injector?.get('UnifiedAntiLoopService'));
//     }
//   } catch (e) {
//     console.log('Error verificando servicios Angular:', e.message);
//   }
// };

// console.log(`
// 🛠️ DEBUG UTILITIES LOADED
// ==========================
// Funciones disponibles:
// • checkAntiLoopStatus() - Ver estado del anti-loop
// • forceAntiLoopReset() - Reset completo del anti-loop
// • forceEmergencyMode(reason) - Activar emergencia manualmente
// • nuclearCleanup() - Limpieza nuclear (cuidado!)
// • checkProblematicStorage() - Ver localStorage problemático
// • cleanProblematicStorage() - Limpiar solo keys problemáticos
// • startNavigationMonitoring() - Monitor navegación en tiempo real
// • stopNavigationMonitoring() - Detener monitor
// • getSystemInfo() - Información del sistema

// USO RECOMENDADO:
// 1. checkAntiLoopStatus() - Para ver estado actual
// 2. checkProblematicStorage() - Para ver qué está mal
// 3. cleanProblematicStorage() - Para limpiar sin perder todo
// 4. Si nada funciona: nuclearCleanup() (última opción)
// `);
