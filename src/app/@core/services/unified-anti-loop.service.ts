// import { Injectable } from '@angular/core';
// import { Router, NavigationEnd } from '@angular/router';
// import { filter, debounceTime } from 'rxjs/operators';
// import { BehaviorSubject } from 'rxjs';

// interface NavigationRecord {
//   url: string;
//   timestamp: number;
//   source: string;
// }

// interface EmergencyState {
//   active: boolean;
//   activatedAt: number;
//   reason: string;
//   attempts: number;
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class UnifiedAntiLoopService {
//   private navigationHistory: NavigationRecord[] = [];
//   private emergencyState: EmergencyState = {
//     active: false,
//     activatedAt: 0,
//     reason: '',
//     attempts: 0
//   };

//   // Estado observable para que otros servicios puedan reaccionar
//   private emergencyMode$ = new BehaviorSubject<boolean>(false);

//   // Configuración más agresiva
//   private readonly MAX_NAVIGATIONS_IN_WINDOW = 4;
//   private readonly TIME_WINDOW = 8000; // 8 segundos
//   private readonly EMERGENCY_DURATION = 15000; // 15 segundos
//   private readonly MAX_EMERGENCY_ATTEMPTS = 3;

//   // Patrones problemáticos
//   private readonly PROBLEMATIC_PATTERNS = [
//     '/autenticacion/login',
//     '/site/home',
//     '/',
//     ''
//   ];

//   constructor(private router: Router) {
//     this.initializeService();
//     this.checkExistingEmergencyMode();
//   }

//   private initializeService(): void {
//     // Escuchar navegaciones con debounce más agresivo
//     this.router.events
//       .pipe(
//         filter(event => event instanceof NavigationEnd),
//         debounceTime(200) // Debounce para evitar eventos múltiples
//       )
//       .subscribe((event: NavigationEnd) => {
//         this.trackNavigation(event.url, 'router');
//       });
//   }

//   private checkExistingEmergencyMode(): void {
//     const emergencyModeTime = localStorage.getItem('emergency_mode_time');
//     const emergencyMode = localStorage.getItem('emergency_mode');
    
//     if (emergencyMode === 'true' && emergencyModeTime) {
//       const timeDiff = Date.now() - parseInt(emergencyModeTime);
      
//       if (timeDiff < this.EMERGENCY_DURATION) {
//         console.warn('🚨 Continuando en modo de emergencia existente');
//         this.activateEmergencyMode('existing_emergency', false);
//       } else {
//         // Limpiar modo de emergencia expirado
//         this.deactivateEmergencyMode();
//       }
//     }
//   }

//   public trackNavigation(url: string, source: string = 'unknown'): void {
//     if (this.emergencyState.active) {
//       console.warn('🚫 Navigation blocked - Emergency mode active');
//       return;
//     }

//     const now = Date.now();
    
//     // Limpiar historial antiguo
//     this.navigationHistory = this.navigationHistory.filter(
//       record => now - record.timestamp < this.TIME_WINDOW
//     );

//     // Agregar navegación actual
//     this.navigationHistory.push({
//       url,
//       timestamp: now,
//       source
//     });

//     // Analizar patrones problemáticos
//     this.analyzeNavigationPatterns();
//   }

//   private analyzeNavigationPatterns(): void {
//     const recentNavigations = this.navigationHistory.slice(-this.MAX_NAVIGATIONS_IN_WINDOW);
    
//     if (recentNavigations.length < this.MAX_NAVIGATIONS_IN_WINDOW) {
//       return;
//     }

//     // Detectar navegaciones rápidas entre las mismas páginas
//     const urls = recentNavigations.map(nav => nav.url);
//     const uniqueUrls = new Set(urls);
    
//     // Si hay pocas URLs únicas en muchas navegaciones
//     if (uniqueUrls.size <= 2) {
//       this.activateEmergencyMode('rapid_navigation_same_pages');
//       return;
//     }

//     // Detectar oscilación entre páginas problemáticas
//     const problematicNavigations = recentNavigations.filter(nav => 
//       this.PROBLEMATIC_PATTERNS.some(pattern => nav.url.includes(pattern))
//     );

//     if (problematicNavigations.length >= 3) {
//       this.activateEmergencyMode('problematic_page_oscillation');
//       return;
//     }

//     // Detectar navegaciones excesivamente rápidas
//     const timeDiffs = [];
//     for (let i = 1; i < recentNavigations.length; i++) {
//       timeDiffs.push(recentNavigations[i].timestamp - recentNavigations[i-1].timestamp);
//     }

//     const avgTimeDiff = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
//     if (avgTimeDiff < 500) { // Menos de 500ms entre navegaciones
//       this.activateEmergencyMode('excessive_rapid_navigation');
//       return;
//     }
//   }

//   private activateEmergencyMode(reason: string, incrementAttempts: boolean = true): void {
//     if (this.emergencyState.active) {
//       return; // Ya está activo
//     }

//     if (incrementAttempts) {
//       this.emergencyState.attempts++;
      
//       // Si hay demasiados intentos de emergencia, hacer limpieza más agresiva
//       if (this.emergencyState.attempts > this.MAX_EMERGENCY_ATTEMPTS) {
//         this.performNuclearCleanup();
//         return;
//       }
//     }

//     console.error(`🚨 MODO DE EMERGENCIA ACTIVADO: ${reason}`);
//     console.table(this.navigationHistory);

//     this.emergencyState = {
//       active: true,
//       activatedAt: Date.now(),
//       reason,
//       attempts: this.emergencyState.attempts
//     };

//     // Guardar estado en localStorage
//     localStorage.setItem('emergency_mode', 'true');
//     localStorage.setItem('emergency_mode_time', this.emergencyState.activatedAt.toString());
//     localStorage.setItem('emergency_reason', reason);

//     // Notificar a otros servicios
//     this.emergencyMode$.next(true);

//     // Limpieza inmediata
//     this.performEmergencyCleanup();

//     // Navegación segura a home
//     setTimeout(() => {
//       this.performSafeNavigation();
//     }, 1000);

//     // Programar desactivación
//     setTimeout(() => {
//       this.deactivateEmergencyMode();
//     }, this.EMERGENCY_DURATION);
//   }

//   private performEmergencyCleanup(): void {
//     const keysToRemove = [
//       'forcedLogout',
//       'forcedLogoutTime',
//       'visits_disabled',
//       'visit_backend_error',
//       'loginCooldown',
//       'rememberedEmail'
//     ];

//     keysToRemove.forEach(key => {
//       try {
//         localStorage.removeItem(key);
//       } catch (e) {
//         console.warn(`Could not remove ${key}:`, e);
//       }
//     });

//     // Limpiar todos los keys de visits con errores
//     Object.keys(localStorage).forEach(key => {
//       if (key.startsWith('visit_errors:') || 
//           key.startsWith('visit:') || 
//           key.startsWith('reload_') ||
//           key.includes('diagnostic')) {
//         try {
//           localStorage.removeItem(key);
//         } catch (e) {
//           console.warn(`Could not remove ${key}:`, e);
//         }
//       }
//     });

//     // Limpiar sessionStorage selectivamente
//     try {
//       const criticalKeys = ['currentUser', 'auth_app_token'];
//       Object.keys(sessionStorage).forEach(key => {
//         if (!criticalKeys.includes(key)) {
//           sessionStorage.removeItem(key);
//         }
//       });
//     } catch (e) {
//       console.warn('Could not clean sessionStorage:', e);
//     }

//     // Deshabilitar temporalmente visits
//     localStorage.setItem('visits_disabled_until', (Date.now() + this.EMERGENCY_DURATION).toString());
//   }

//   private performSafeNavigation(): void {
//     try {
//       // Solo navegar si no estamos ya en home
//       const currentPath = this.router.url;
//       if (!currentPath.includes('/site/home') && currentPath !== '/') {
//         console.log('🏠 Navegando de forma segura a home...');
//         this.router.navigate(['/site/home'], { 
//           replaceUrl: true,
//           skipLocationChange: false 
//         });
//       }
//     } catch (error) {
//       console.error('Error en navegación segura:', error);
//       // Fallback usando window.location (último recurso)
//       if (window.location.pathname !== '/site/home') {
//         window.location.replace('/site/home');
//       }
//     }
//   }

//   private performNuclearCleanup(): void {
//     console.error('☢️ REALIZANDO LIMPIEZA NUCLEAR - Demasiados intentos de emergencia');
    
//     try {
//       // Limpiar COMPLETAMENTE localStorage
//       localStorage.clear();
      
//       // Limpiar COMPLETAMENTE sessionStorage
//       sessionStorage.clear();
      
//       // Marcar que se hizo limpieza nuclear
//       localStorage.setItem('nuclear_cleanup_performed', Date.now().toString());
//       localStorage.setItem('emergency_mode', 'true');
//       localStorage.setItem('emergency_mode_time', Date.now().toString());
      
//       // Recargar la página después de un delay
//       setTimeout(() => {
//         window.location.href = '/site/home';
//       }, 2000);
      
//     } catch (error) {
//       console.error('Error en limpieza nuclear:', error);
//       // Último recurso
//       window.location.reload();
//     }
//   }

//   private deactivateEmergencyMode(): void {
//     if (!this.emergencyState.active) {
//       return;
//     }

//     console.log('✅ Desactivando modo de emergencia');
    
//     this.emergencyState = {
//       active: false,
//       activatedAt: 0,
//       reason: '',
//       attempts: 0
//     };

//     // Limpiar localStorage relacionado con emergency
//     try {
//       localStorage.removeItem('emergency_mode');
//       localStorage.removeItem('emergency_mode_time');
//       localStorage.removeItem('emergency_reason');
//       localStorage.removeItem('visits_disabled_until');
//     } catch (e) {
//       console.warn('Error limpiando emergency flags:', e);
//     }

//     // Notificar desactivación
//     this.emergencyMode$.next(false);
//   }

//   // Métodos públicos para otros servicios
//   public isEmergencyModeActive(): boolean {
//     return this.emergencyState.active;
//   }

//   public getEmergencyModeObservable() {
//     return this.emergencyMode$.asObservable();
//   }

//   public isNavigationAllowed(): boolean {
//     const visitsDisabledUntil = localStorage.getItem('visits_disabled_until');
//     if (visitsDisabledUntil && Date.now() < parseInt(visitsDisabledUntil)) {
//       return false;
//     }
//     return !this.emergencyState.active;
//   }

//   public reportSuspiciousActivity(source: string, details: any): void {
//     console.warn(`🚨 Actividad sospechosa reportada por ${source}:`, details);
    
//     // Trackear como navegación sospechosa
//     this.trackNavigation(`suspicious_${source}`, `suspicious_${source}`);
//   }

//   public forceEmergencyMode(reason: string): void {
//     this.activateEmergencyMode(`forced_${reason}`);
//   }

//   public getNavigationHistory(): NavigationRecord[] {
//     return [...this.navigationHistory];
//   }

//   public getEmergencyState(): EmergencyState {
//     return { ...this.emergencyState };
//   }

//   // Método para reset manual desde DevTools
//   public forceReset(): void {
//     console.log('🔄 Forzando reset del anti-loop service');
//     this.navigationHistory = [];
//     this.deactivateEmergencyMode();
//     localStorage.removeItem('nuclear_cleanup_performed');
//   }
// }
