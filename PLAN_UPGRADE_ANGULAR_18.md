# Plan de Actualización: Angular 15 → Angular 18

> **Proyecto:** `ngx-admin-demo` (Carpeta Digital — Frontend)
> **Origen:** Angular `15.2.10`, Nebular `11.0.1`, RxJS `6.6.2`, zone.js `0.11.4`, TypeScript `4.9.5`, Node ≥ 16
> **Destino:** Angular `18.x` (LTS), Nebular `14.x`, RxJS `7.8.x`, zone.js `0.14.x`, TypeScript `5.5.x`, Node `20 LTS`
> **Estrategia:** Incremental oficial (15 → 16 → 17 → 18) con una rama por fase y PRs independientes.
> **Tests:** Auditoría primero; no son condición de paso por fase (estado actual: rotos/desactualizados).
> **Alcance:** Upgrade técnico + refactor de módulos legacy + migración progresiva a standalone/control flow nuevo.

---

## 0. Diagnóstico inicial (estado actual)

### 0.1 Stack detectado
| Área | Versión actual | Estado |
|------|----------------|--------|
| `@angular/*` | `^15.2.10` | Soportado solo hasta Angular 16 path |
| `@angular/material` + `cdk` | `^15.2.9` | Compatible con su Angular |
| `@nebular/*` | `11.0.1` | **Bloqueante** — atado a Angular 15 |
| `rxjs` | `6.6.2` + `rxjs-compat` | **Bloqueante** — Angular 16+ exige RxJS 7.5+ |
| `zone.js` | `~0.11.4` | **Bloqueante** — Angular 17+ exige 0.14+ |
| `typescript` | `^4.9.5` | OK para 15. Angular 18 exige 5.4+ |
| `core-js` | `2.5.1` | Obsoleto, eliminar (no necesario en 16+) |
| `tslib` | `^2.3.1` | OK |
| `@angular-devkit/build-angular` | `^15.2.10` | Migrar a `@angular/build` (esbuild) en fase 17/18 |
| `eslint` + `@angular-eslint` | 15.2.1 / eslint 8 | Subir alineado por major |
| `tslint` (residual) | sí — `tslint:7`, `tslint-language-service` en `tsconfig.json` | **Eliminar** |
| `protractor` | 7.0.0 | **Eliminar** (deprecado) — migrar e2e a Playwright/Cypress o suprimir |
| `husky` | 0.13.3 | Subir a 9.x |
| `karma` | 6.3.19 + jasmine 3.8 | Subir karma 6.4 + jasmine 5 |
| `bootstrap` | 4.3.1 | Evaluar subida a 5 (cambia clases utilitarias) — opcional |
| `swiper` | 11 | OK (revisar API custom-elements en Angular 17+) |
| `tinymce` | 4.5.7 | Muy antiguo, recomendado subir a 6/7 (opcional fuera del upgrade core) |
| `ngx-paypal` | ^11 | Revisar versión compatible con Angular 18 (requiere v15+) |
| `ng2-pdf-viewer` | ^9.1.2 | Revisar compatibilidad — alternativa: `ngx-extended-pdf-viewer` ya presente |
| `ngx-extended-pdf-viewer` | ^17.4.10 | OK |
| `angular-oauth2-oidc` | ^17.0.2 | OK para Angular 18 |
| `jwt-decode` | ^4 | OK |
| `@nebular/*` (theme/auth/security/eva-icons) | 11.0.1 | Migrar a 14.x |

### 0.2 Riesgos identificados (Top 10)
1. **Nebular 11 → 14**: cambios en `NbAuthModule`, `NbThemeModule`, `NbDialogService`; nuevos peer deps Angular 17.
2. **RxJS 6 → 7**: eliminar `rxjs-compat`, reemplazar `toPromise()`, operadores deprecados, `Observable.create`.
3. **NgModules monolíticos**: `app.module.ts` y submódulos grandes — migración a `standalone` requiere planificación.
4. **`postinstall` con `ngcc`**: ya **no existe** desde Angular 16 (Ivy es el único motor). Eliminar script.
5. **`polyfills.ts` manual**: en Angular 16+ se declara como array en `angular.json`; cambia el formato.
6. **`tsconfig`** con `"useDefineForClassFields": false` — revisar para evitar romper inputs/decoradores.
7. **`core-js` 2.x y `web-animations-js`**: removibles. Navegadores modernos los soportan nativos.
8. **`bootstrap 4.3.1` + `@angular/material 15`**: estilos globales pueden chocar tras upgrade a Material 18 (MDC).
9. **Tests rotos**: cobertura no fiable → debe planearse auditoría antes de fase 4 (standalone) para no perder señal.
10. **Bundle/`buildOptimizer`** y `budgets` desactualizados: el target esbuild reduce tamaño pero cambia hashing y output paths.

### 0.3 Bloqueos previos al upgrade (FASE 0)
- [ ] Eliminar `rxjs-compat` (auditar y limpiar imports `rxjs/operator/*`, `rxjs/Observable`).
- [ ] Eliminar script `postinstall` con `ngcc` (no aplica desde Angular 16).
- [ ] Eliminar `tslint` y dependencias relacionadas (ya hay ESLint configurado).
- [ ] Eliminar `protractor` y carpeta `e2e/` o decidir reemplazo (Playwright recomendado, opcional).
- [ ] Subir Node a **20 LTS** y npm a 10.x localmente y en CI.
- [ ] Crear branch base `upgrade/baseline` con limpieza, tests verdes mínimos (smoke build).
- [ ] Snapshot de bundle size y rutas críticas (login, dashboard promotores, checkout/Culqi/PayPal, descarga PDF).

---

## 1. Estrategia general

### 1.1 Principios
- **Un major a la vez.** Validar build + smoke manual de rutas críticas antes de pasar al siguiente.
- **Una rama por fase**, PR independiente, revisado y mergeado a una rama larga `upgrade/angular-18` y de ahí a `main` al final.
- **No mezclar refactor con upgrade dentro del mismo commit**: refactor (standalone/control flow) va en sub-fases marcadas.
- **Bloquear versiones** en `package.json` (sin `^`) durante el upgrade; restaurar `^` al cierre.
- **Lockfile committeado** (`package-lock.json`) en cada fase.
- **`ng update` siempre primero**, luego ajustes manuales.

### 1.2 Ramas y PRs
| Rama | Contenido | PR |
|------|-----------|----|
| `upgrade/baseline` | Limpieza pre-upgrade (Fase 0) | PR #1 |
| `upgrade/ng16` | Angular 16 + RxJS 7 + Material 16 + Nebular 12 | PR #2 |
| `upgrade/ng17` | Angular 17 + zone.js 0.14 + esbuild + Nebular 13 + control flow opcional | PR #3 |
| `upgrade/ng18` | Angular 18 + Material 18 (MDC) + Nebular 14 + signals (donde aplique) | PR #4 |
| `upgrade/standalone` | Migración progresiva a standalone (post-18) | PR #5..N |
| `upgrade/cleanup` | Remoción de wrappers/compat + ajuste budgets + docs | PR final |

### 1.3 Criterios de aceptación por fase
- `npm ci && npm run build:prod` finaliza sin errores.
- Smoke manual: login, dashboard, listado/compra de documentos, pago Culqi, pago PayPal, descarga PDF, panel promotor, panel admin.
- `npm run lint` sin errores nuevos (warnings tolerados).
- Bundle inicial dentro de los `budgets` ajustados de la fase.
- Documentación de breaking changes aplicada en `CHANGELOG.md`.

---

## 2. FASE 0 — Preparación (rama `upgrade/baseline`)

### 2.1 Higiene del repo
1. Crear rama `upgrade/baseline` desde `main`.
2. Backup: tag `pre-upgrade-angular-18`.
3. Subir Node local a 20 LTS (usar `.nvmrc` con `20`).
4. Actualizar `engines` en `package.json` → `"node": ">=20", "npm": ">=10"`.

### 2.2 Eliminar deuda que rompe el upgrade
- Quitar `rxjs-compat` y migrar imports:
  - `import { Observable } from 'rxjs/Observable'` → `from 'rxjs'`
  - `import 'rxjs/add/operator/map'` → `pipe(map(...))`
  - `Observable.throw(...)` → `throwError(() => ...)`
  - `.toPromise()` → `firstValueFrom(...)` (ya en RxJS 7, pero dejar listo).
- Quitar `script.postinstall` con `ngcc`.
- Quitar `tslint`, `tslint-language-service`, `tslint.json`, plugin en `tsconfig.json`.
- Quitar `protractor`, `e2e/`, `pree2e`, `e2e` en scripts.
- Quitar `core-js` 2.x y referencias en `polyfills.ts` (Angular 16+ no lo usa).
- Quitar `web-animations-js` (no necesario en navegadores soportados por Angular 18).
- Quitar `intl`, `classlist.js`, `rxjs-compat` (legacy ngx-admin).

### 2.3 Auditoría de tests (decisión: no bloquean fases)
- Generar reporte: `npx ng test --watch=false --browsers=ChromeHeadless || true`.
- Crear `TESTS_AUDIT.md` con: archivos rotos, motivo (deps obsoletas, mocks inválidos), prioridad de reescritura.
- **No** reescribir tests aún; la suite se reescribirá en Fase 5.

### 2.4 Snapshot de baseline
- `npm run build:prod -- --stats-json` → guardar `dist/stats.json` como `baseline-stats.json` en `/docs/upgrade/`.
- Capturas/recorrido de las 8 rutas críticas (revisar `RESUMEN_FINAL_COMPLETO.md` y `DEV_DOCS.md`).

**Salida Fase 0:** PR `#1 chore(upgrade): baseline cleanup pre-Angular-18`.

---

## 3. FASE 1 — Angular 15.2 → 16.x (rama `upgrade/ng16`)

### 3.1 Comandos guía
```powershell
git checkout -b upgrade/ng16 upgrade/baseline
npx @angular/cli@16 update @angular/cli@16 @angular/core@16 --force
npx @angular/cli@16 update @angular/material@16 @angular/cdk@16
npx @angular/cli@16 update rxjs@7
```

### 3.2 Ajustes manuales obligatorios
- **`tsconfig.json`**: `target` ya es `ES2022` ✓; añadir `"useDefineForClassFields": false` (mantener compat decoradores) o evaluar `true` en una sub-tarea.
- **TypeScript** a 5.1.x.
- **`zone.js`** a 0.13.x.
- **Standalone APIs**: disponibles, pero **no migrar aún**. Sólo asegurar que los nuevos `bootstrapApplication` no se introduzcan.
- **Material 16** (MDC opt-in todavía): mantener componentes legacy si ya están en uso; documentar en `MATERIAL_MIGRATION_NOTES.md` qué componentes deberán migrar a MDC en Fase 3.
- **Required Inputs**: revisar oportunidades, no obligatorio.

### 3.3 Nebular
- Subir a `@nebular/* @ 12.x` (compatible con Angular 16). Verificar:
  - `NbAuthModule.forRoot` API.
  - `NbThemeModule` token providers.
  - `NbDialog`, `NbToastr`, `NbDatePicker` (cambio `NbDateService`).
  - Migrar imports SCSS si cambiaron paths del paquete.

### 3.4 Validación
- `npm ci && npm run build:prod`.
- Smoke manual de las 8 rutas.
- Verificar consola sin warnings de `View Engine`/`legacy`.

**Salida Fase 1:** PR `#2 chore(upgrade): Angular 16 + RxJS 7 + Nebular 12`.

---

## 4. FASE 2 — Angular 16 → 17.x (rama `upgrade/ng17`)

### 4.1 Comandos guía
```powershell
git checkout -b upgrade/ng17 upgrade/ng16
npx @angular/cli@17 update @angular/cli@17 @angular/core@17 --force
npx @angular/cli@17 update @angular/material@17 @angular/cdk@17
```

### 4.2 Cambios estructurales
- **TypeScript** a 5.2.x.
- **`zone.js`** a 0.14.x.
- **Builder**: migrar a `@angular-devkit/build-angular:application` (esbuild + Vite dev server).
  - Editar `angular.json`: cambiar `builder` y mover `polyfills` a array.
  - Reemplazar `main` por `browser`, eliminar `buildOptimizer` (implícito), revisar `vendorChunk` (no aplica).
  - Revisar `allowedCommonJsDependencies` — esbuild es más estricto.
  - **`tinymce` y assets**: migrar carga vía `assets` array y `<script>` tag a `loadScript` runtime o reemplazar por `tinymce 6` en módulo.
- **Polyfills**: pasar de `src/polyfills.ts` a `["zone.js"]` en `angular.json`. Si hay polyfills custom (e.g. `intl`, `classlist`), eliminados en Fase 0.
- **Control flow nuevo (`@if`, `@for`, `@switch`)**: opt-in. Crear sub-PR `feat(ng17): migrate control flow` ejecutando:
  ```
  ng generate @angular/core:control-flow
  ```
  Aplicar por feature (auth, shared, dashboard-promotores, pages-admin, site).

### 4.3 Nebular
- Subir a `@nebular/* @ 13.x` (cuando esté liberado/compatible). Si no hay versión 13 estable compatible con Angular 17 al momento, **mantener Nebular 12** y forzar peerDeps con `overrides`/`resolutions`, documentando el riesgo.

### 4.4 Otras libs
- `bootstrap`: evaluar subida a 5.3 (cambio de clases utilitarias en plantillas — separar como sub-PR).
- `swiper@11`: revisar uso de Web Components (`<swiper-container>`); ya está soportado.
- `apexcharts` + `ng-apexcharts`: subir a últimas compatibles (>= 1.10).
- `html2canvas`, `jspdf`, `dompurify`: validar.
- `@asymmetrik/ngx-leaflet 3` → subir a 17/18 compatible (`@bluehalo/ngx-leaflet`).

### 4.5 Validación
- Build esbuild OK, dev server (Vite) OK.
- Smoke 8 rutas + medir bundle (esperar reducción 20–40 %).
- Ajustar `budgets` (initial: bajar de 6 mb a 4 mb si pasa).

**Salida Fase 2:** PR `#3 chore(upgrade): Angular 17 + esbuild builder + control flow`.

---

## 5. FASE 3 — Angular 17 → 18.x (rama `upgrade/ng18`)

### 5.1 Comandos guía
```powershell
git checkout -b upgrade/ng18 upgrade/ng17
npx @angular/cli@18 update @angular/cli@18 @angular/core@18 --force
npx @angular/cli@18 update @angular/material@18 @angular/cdk@18
```

### 5.2 Cambios clave
- **TypeScript** a 5.4–5.5.
- **Material 18**: basado 100 % en MDC. Repasar overrides SCSS (variables de color, tipografía, density). Posible romper estilos en:
  - botones, form-fields, tabs, dialog, snackbar, table.
  - Cualquier `@include mat.legacy-*` debe migrar a `@include mat.*`.
- **`zoneless` change detection**: opcional, **no activar** en este PR. Documentar como tarea futura.
- **Signals + effects**: disponibles. **No** refactorizar componentes existentes; sólo permitir su uso en código nuevo.
- **`@angular/forms` typed forms**: ya disponibles desde 14, pero validar `FormGroup<...>` donde se use.
- **Hydration/SSR**: el proyecto es CSR; documentar como descartado por ahora.

### 5.3 Nebular 14
- Subir a `@nebular/* @ 14.x`.
- Revisar:
  - Cambios en `NbAuthService.authenticate()` (puede requerir adaptador de tokens JWT).
  - `NbDialogService`/`NbWindowService` API.
  - Theming: nuevos tokens, posibles colisiones con Material 18.
- Si hay incompatibilidad real con un componente Nebular concreto, plan B: **reemplazar el componente puntual por Material 18** (no migrar todo).

### 5.4 Validación
- Build, lint, smoke 8 rutas.
- Revisión visual minuciosa por la migración Material MDC.
- Bundle final medido vs baseline (`/docs/upgrade/baseline-stats.json`).
- Restaurar `^` en `package.json`.

**Salida Fase 3:** PR `#4 feat(upgrade): Angular 18 + Material 18 (MDC) + Nebular 14`.

---

## 6. FASE 4 — Refactor a Standalone Components (rama `upgrade/standalone`)

> Posterior al upgrade. No bloquea el merge a `main` de Fase 3.

### 6.1 Estrategia
- Migración **automatizada por feature**:
  ```
  ng generate @angular/core:standalone --path=src/app/<feature>
  ```
  Pasos del schematic: (1) convert components, (2) remove unnecessary modules, (3) standalone bootstrap.
- Orden recomendado (de hojas a raíz):
  1. `shared/ui/*` (componentes presentacionales).
  2. `@theme/components/*`.
  3. `cuenta-usuario/`.
  4. `site/` (público).
  5. `dashboard-promotores/`.
  6. `admin-promotor/`.
  7. `pages-admin/`.
  8. `@auth/`, `@core/` providers.
  9. **Bootstrap final**: `app.module.ts` → `bootstrapApplication(AppComponent, { providers: [...] })`.
- Routing: migrar `RouterModule.forRoot` → `provideRouter` con `withPreloading`, `withComponentInputBinding`, `withViewTransitions`.
- HttpClient: `provideHttpClient(withInterceptors([...]))`. Migrar interceptores `HTTP_INTERCEPTORS` a interceptores funcionales (revisar `ERROR_INTERCEPTION_IMPLEMENTATION_SUMMARY.md` y `GLOBAL_HTTP_INTERCEPTOR_README.md`).

### 6.2 Validación por feature
- Build + smoke de la ruta migrada.
- PR pequeño por feature (`feat(standalone): migrate <feature>`).

---

## 7. FASE 5 — Auditoría y reescritura de tests

> Tras estabilizar Angular 18 + standalone.

- Reescribir specs roto a roto, priorizando:
  1. Servicios de pago (`payment.service`, integraciones Culqi/PayPal del front).
  2. Interceptores HTTP / manejo de errores.
  3. Guards y resolvers.
  4. Componentes críticos del checkout y dashboard promotor.
- Reemplazar `TestBed` heredado por `TestBed` con `provideExperimentalZonelessChangeDetection()` cuando sea estable.
- Considerar migración de Karma+Jasmine → **Vitest** o **Jest** (decisión separada; no parte del upgrade).
- Recuperar `npm run test:coverage` con threshold mínimo (e.g., 50 % statements al inicio).

---

## 8. FASE 6 — Limpieza y cierre

- Eliminar wrappers temporales y `overrides` en `package.json`.
- Quitar `rxjs-compat` definitivamente (verificar 0 imports).
- Activar `strict: true` en `tsconfig.json` (sub-PR aparte; medir errores).
- Revisar y subir `budgets` finales.
- Actualizar `README.md`, `DEV_DOCS.md`, `CHANGELOG.md`.
- Generar `UPGRADE_NOTES_ANGULAR_18.md` con: breaking changes vividos, soluciones, dependencias removidas, riesgos pendientes.
- Tag `release/angular-18`.

---

## 9. Checklist consolidado (resumen ejecutable)

### Pre-trabajo
- [ ] Tag `pre-upgrade-angular-18` en `main`.
- [ ] Node 20 LTS local + `.nvmrc`.
- [ ] Alinear CI (Node 20, cache npm, jobs por fase).

### Fase 0 — Baseline
- [ ] Quitar `rxjs-compat`, `core-js`, `web-animations-js`, `intl`, `classlist.js`.
- [ ] Quitar `tslint`, `protractor`, `ngcc postinstall`.
- [ ] `engines` Node ≥ 20.
- [ ] `baseline-stats.json` y smoke documentado.

### Fase 1 — Angular 16
- [ ] `ng update @angular/cli@16 @angular/core@16 --force`.
- [ ] `ng update @angular/material@16`.
- [ ] `ng update rxjs@7`.
- [ ] Nebular 12.
- [ ] Build + smoke OK.

### Fase 2 — Angular 17
- [ ] `ng update @angular/cli@17 @angular/core@17`.
- [ ] `ng update @angular/material@17`.
- [ ] zone.js 0.14, TS 5.2.
- [ ] Migrar a builder `application` (esbuild) y polyfills array.
- [ ] Schematic control flow `@if/@for/@switch`.
- [ ] Nebular 13 (o lock 12 con override documentado).
- [ ] Build + smoke OK.

### Fase 3 — Angular 18
- [ ] `ng update @angular/cli@18 @angular/core@18`.
- [ ] `ng update @angular/material@18` (MDC).
- [ ] Nebular 14.
- [ ] TS 5.4/5.5.
- [ ] Revisión visual MDC.
- [ ] Build + smoke OK + bundle dentro de budgets.

### Fase 4 — Standalone
- [ ] Schematic `@angular/core:standalone` por feature.
- [ ] `bootstrapApplication` final.
- [ ] `provideRouter` + `provideHttpClient` con interceptores funcionales.

### Fase 5 — Tests
- [ ] `TESTS_AUDIT.md` priorizado.
- [ ] Reescritura por dominio (pagos primero).

### Fase 6 — Cierre
- [ ] Limpiar overrides y deps muertas.
- [ ] Documentación actualizada.
- [ ] Tag `release/angular-18`.

---

## 10. Tabla de compatibilidades de referencia

| Angular | TypeScript | RxJS | zone.js | Node | Material/CDK | Nebular |
|--------:|-----------:|-----:|--------:|-----:|-------------:|--------:|
| 15 | 4.8–4.9 | 6.5/7.5 | 0.11/0.12 | 14/16 | 15 | 11 |
| 16 | 4.9–5.1 | 7.5+ | 0.13 | 16/18 | 16 | 12 |
| 17 | 5.2 | 7.8+ | 0.14 | 18.13+ | 17 | 13 |
| 18 | 5.4–5.5 | 7.8+ | 0.14 | 18.19+/20+ | 18 (MDC) | 14 |

---

## 11. Comandos de referencia

```powershell
# Diagnóstico de versiones
npx ng version

# Update por major (siempre con --force solo si es necesario)
npx @angular/cli@<MAJOR> update @angular/cli@<MAJOR> @angular/core@<MAJOR>
npx @angular/cli@<MAJOR> update @angular/material@<MAJOR>

# Schematic standalone
ng generate @angular/core:standalone --path=src/app/<feature>

# Schematic control flow
ng generate @angular/core:control-flow

# Build con stats (medir bundle)
npm run build:prod -- --stats-json
npx webpack-bundle-analyzer dist/stats.json

# Verificación rápida
npm ci
npm run lint
npm run build:prod
```

---

## 12. Decisiones registradas
- **Estrategia:** incremental 15→16→17→18 (no salto directo).
- **Nebular:** se mantiene, migrando a 14 (no se reemplaza por Material/PrimeNG en este plan).
- **Standalone + nueva control flow:** sí, en fase posterior al upgrade (Fase 4).
- **Tests:** auditoría primero, reescritura en Fase 5; no bloquean fases de upgrade.
- **Ramas:** una por fase con PRs aislados.
- **Ubicación del plan:** `PLAN_UPGRADE_ANGULAR_18.md` en raíz del front.

---

## 13. Próximo paso sugerido
Ejecutar **Fase 0 (baseline)** en una rama `upgrade/baseline`:
1. Crear tag `pre-upgrade-angular-18`.
2. Ejecutar limpieza de `rxjs-compat`, `ngcc`, `tslint`, `protractor`, `core-js`, `web-animations-js`.
3. Subir `engines.node` y CI a Node 20.
4. Generar `baseline-stats.json` y `TESTS_AUDIT.md`.
5. Abrir PR `#1`.

> Cuando confirmes, puedo ejecutar la Fase 0 directamente (limpieza de `package.json`, `tsconfig.json`, `polyfills.ts` y scripts).
