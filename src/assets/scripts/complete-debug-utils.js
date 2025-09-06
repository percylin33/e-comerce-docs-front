/* 
 * DEBUG UTILITIES FOR INFINITE LOOP SOLUTION
 * 
 * INSTRUCCIONES DE USO:
 * 1. Abrir DevTools (F12)
 * 2. Ir a la pestaña Console
 * 3. Copiar y pegar TODO este código
 * 4. Presionar Enter
 * 5. Las funciones estarán disponibles globalmente
 */

// Verificar estado del UnifiedAntiLoopService
// window.checkAntiLoopStatus = function() {
//   try {
//     const app = document.querySelector('ngx-app');
//     if (app && window.ng) {
//       const injector = window.ng.probe(app).injector;
//       const unifiedService = injector.get('UnifiedAntiLoopService');
      
//       console.log('🔍 ESTADO DEL ANTI-LOOP SERVICE:');
//       console.log('================================');
//       console.log('Emergency Mode Active:', unifiedService.isEmergencyModeActive());
//       console.log('Navigation Allowed:', unifiedService.isNavigationAllowed());
//       console.log('Navigation History:', unifiedService.getNavigationHistory());
//       console.log('Emergency State:', unifiedService.getEmergencyState());
      
//       return {
//         emergencyActive: unifiedService.isEmergencyModeActive(),
//         navigationAllowed: unifiedService.isNavigationAllowed(),
//         history: unifiedService.getNavigationHistory(),
//         state: unifiedService.getEmergencyState()
//       };
//     } else {
//       console.warn('⚠️ Angular no detectado o aplicación no cargada');
//       return null;
//     }
//   } catch (error) {
//     console.error('❌ Error accediendo al servicio:', error);
//     return null;
//   }
// };

// // Forzar reset completo del sistema anti-loop
// window.forceAntiLoopReset = function() {
//   try {
//     const app = document.querySelector('ngx-app');
//     if (app && window.ng) {
//       const injector = window.ng.probe(app).injector;
//       const unifiedService = injector.get('UnifiedAntiLoopService');
      
//       unifiedService.forceReset();
//       console.log('🔄 Anti-Loop Service reseteado completamente');
//       return true;
//     } else {
//       console.warn('⚠️ No se pudo acceder al servicio');
//       return false;
//     }
//   } catch (error) {
//     console.error('❌ Error en reset:', error);
//     return false;
//   }
// };

// // Activar manualmente el modo de emergencia
// window.forceEmergencyMode = function(reason) {
//   try {
//     const app = document.querySelector('ngx-app');
//     if (app && window.ng) {
//       const injector = window.ng.probe(app).injector;
//       const unifiedService = injector.get('UnifiedAntiLoopService');
      
//       unifiedService.forceEmergencyMode(reason || 'manual_activation');
//       console.log('🚨 Modo de emergencia activado manualmente');
//       return true;
//     } else {
//       console.warn('⚠️ No se pudo acceder al servicio');
//       return false;
//     }
//   } catch (error) {
//     console.error('❌ Error activando emergencia:', error);
//     return false;
//   }
// };

// // Verificar localStorage problemático
// window.checkProblematicStorage = function() {
//   const problematicKeys = [
//     'forcedLogout', 'forcedLogoutTime', 'emergency_mode', 'emergency_mode_time',
//     'visits_disabled', 'visit_backend_error', 'loginCooldown', 'visits_disabled_until'
//   ];
  
//   console.log('🔍 VERIFICANDO LOCALSTORAGE PROBLEMÁTICO:');
//   console.log('==========================================');
  
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
//     console.log('⚠️ Encontrados', Object.keys(found).length, 'keys problemáticos');
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
//     return Object.keys(problematic).length;
//   } else {
//     console.log('✅ No hay keys problemáticos que limpiar');
//     return 0;
//   }
// };

// // Información completa del sistema
// window.getSystemInfo = function() {
//   console.log('🖥️ INFORMACIÓN DEL SISTEMA:');
//   console.log('============================');
//   console.log('URL actual:', window.location.href);
//   console.log('Timestamp:', new Date().toISOString());
//   console.log('LocalStorage keys:', Object.keys(localStorage).length);
//   console.log('SessionStorage keys:', Object.keys(sessionStorage).length);
//   console.log('Angular detectado:', !!window.ng);
  
//   // Estado del anti-loop
//   const antiLoopStatus = window.checkAntiLoopStatus();
//   if (antiLoopStatus) {
//     console.log('Anti-Loop Emergency:', antiLoopStatus.emergencyActive);
//     console.log('Navigation Allowed:', antiLoopStatus.navigationAllowed);
//   }
  
//   // LocalStorage problemático
//   const problematic = window.checkProblematicStorage();
//   console.log('Keys problemáticos:', Object.keys(problematic).length);
  
//   return {
//     url: window.location.href,
//     timestamp: new Date().toISOString(),
//     localStorageKeys: Object.keys(localStorage).length,
//     sessionStorageKeys: Object.keys(sessionStorage).length,
//     angularLoaded: !!window.ng,
//     antiLoopStatus,
//     problematicKeys: Object.keys(problematic).length
//   };
// };

// // Limpieza nuclear (último recurso)
// window.nuclearCleanup = function() {
//   const confirmed = confirm('⚠️ ADVERTENCIA: Esto eliminará TODOS los datos del localStorage y sessionStorage. ¿Continuar?');
  
//   if (confirmed) {
//     try {
//       // Limpiar storages
//       localStorage.clear();
//       sessionStorage.clear();
      
//       // Limpiar cookies específicas
//       const cookiesToClear = ['g_state', 'G_AUTHUSER_H', 'G_ENABLED_IDPS'];
//       cookiesToClear.forEach(cookie => {
//         document.cookie = cookie + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
//       });
      
//       console.log('☢️ LIMPIEZA NUCLEAR COMPLETADA');
//       console.log('Recargando página en 2 segundos...');
      
//       setTimeout(() => {
//         window.location.href = '/site/home';
//       }, 2000);
      
//       return true;
//     } catch (error) {
//       console.error('❌ Error en limpieza nuclear:', error);
//       return false;
//     }
//   }
//   return false;
// };

// // Monitorear navegaciones en tiempo real
// window.startNavigationMonitoring = function() {
//   if (window.navigationMonitor) {
//     console.log('⚠️ Monitor ya está activo');
//     return false;
//   }
  
//   console.log('🔍 INICIANDO MONITOR DE NAVEGACIÓN...');
//   console.log('====================================');
  
//   let count = 0;
//   window.navigationMonitor = setInterval(() => {
//     count++;
//     const currentUrl = window.location.href;
//     const antiLoopStatus = window.checkAntiLoopStatus();
    
//     console.log(`[${count}] URL: ${currentUrl}`);
//     if (antiLoopStatus && antiLoopStatus.emergencyActive) {
//       console.log(`[${count}] 🚨 EMERGENCY MODE ACTIVE!`);
//     }
    
//     // Auto-stop después de 30 segundos
//     if (count >= 30) {
//       window.stopNavigationMonitoring();
//     }
//   }, 1000);
  
//   return true;
// };

// window.stopNavigationMonitoring = function() {
//   if (window.navigationMonitor) {
//     clearInterval(window.navigationMonitor);
//     window.navigationMonitor = null;
//     console.log('🛑 Monitor de navegación detenido');
//     return true;
//   }
//   return false;
// };

// // Simular bucle para testing
// window.simulateInfiniteLoop = function() {
//   console.log('🧪 SIMULANDO BUCLE INFINITO PARA TESTING...');
//   console.log('===========================================');
  
//   for(let i = 0; i < 6; i++) {
//     setTimeout(() => {
//       history.pushState({}, '', '/site/home');
//       console.log(`Navegación simulada ${i + 1}: /site/home`);
      
//       setTimeout(() => {
//         history.pushState({}, '', '/autenticacion/login');
//         console.log(`Navegación simulada ${i + 1}: /autenticacion/login`);
//       }, 100);
//     }, i * 200);
//   }
  
//   setTimeout(() => {
//     console.log('🔍 Verificando si el anti-loop se activó...');
//     const status = window.checkAntiLoopStatus();
//     if (status && status.emergencyActive) {
//       console.log('✅ ÉXITO: El anti-loop detectó y bloqueó el bucle!');
//     } else {
//       console.log('⚠️ El anti-loop no se activó. Puede necesitar más iteraciones.');
//     }
//   }, 2000);
// };

// // Mostrar ayuda
// window.showAntiLoopHelp = function() {
//   console.log(`
// 🛠️ HERRAMIENTAS DE DEBUG ANTI-LOOP
// ===================================

// FUNCIONES DISPONIBLES:

// 🔍 DIAGNÓSTICO:
// • checkAntiLoopStatus() - Ver estado del sistema anti-loop
// • getSystemInfo() - Información completa del sistema
// • checkProblematicStorage() - Ver localStorage problemático

// 🧹 LIMPIEZA:
// • cleanProblematicStorage() - Limpiar solo keys problemáticos (RECOMENDADO)
// • nuclearCleanup() - Limpieza total (ÚLTIMO RECURSO)

// 🔧 CONTROL:
// • forceAntiLoopReset() - Reset completo del anti-loop
// • forceEmergencyMode(reason) - Activar emergencia manualmente

// 📊 MONITOREO:
// • startNavigationMonitoring() - Monitor en tiempo real
// • stopNavigationMonitoring() - Detener monitor

// 🧪 TESTING:
// • simulateInfiniteLoop() - Simular bucle para probar protección

// USO RECOMENDADO:
// 1. checkAntiLoopStatus() - Para ver estado actual
// 2. checkProblematicStorage() - Para ver qué está mal
// 3. cleanProblematicStorage() - Para limpiar sin perder todo
// 4. Si nada funciona: nuclearCleanup() (última opción)

// Para ver esta ayuda nuevamente: showAntiLoopHelp()
// `);
// };

// // Mostrar mensaje de bienvenida
// console.log(`
// 🎉 DEBUG UTILITIES CARGADAS EXITOSAMENTE!
// =========================================

// Todas las herramientas de debug están ahora disponibles.
// Escribe: showAntiLoopHelp() para ver todas las funciones.

// Estado actual: ${window.checkAntiLoopStatus() ? 'Sistema funcionando' : 'Verificar sistema'}
// `);

// // Auto-verificar estado inicial
// setTimeout(() => {
//   console.log('🔍 Verificación automática inicial:');
//   window.getSystemInfo();
// }, 1000);
