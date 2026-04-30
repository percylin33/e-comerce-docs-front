---
name: design-review
description: 'Use when: review component design, mejorar UX/UI de un componente Angular, design audit, design review, /design-review, revisar consistencia visual, propuestas de mejora visual, hacer responsive, mobile-first audit. Analiza componentes Angular standalone (Nebular + Angular Material v18 + SCSS) y propone mejoras concretas de jerarquía visual, espaciado, consistencia, accesibilidad, interacción, reutilización y responsive. Por defecto NO edita archivos: solo propone hasta que el usuario apruebe (P1/P2/P3).'
---

# Design Review — Angular 18 + Nebular + Material

Workflow para auditar y mejorar la calidad UX/UI de un componente del repo `e-comerce-docs-front`, usándolo como **base estándar** para escalar consistencia al resto del sistema.

## Reglas operativas (críticas)

1. **DRY-RUN por defecto**: solo propone, no edita archivos. Solo aplica cambios si el usuario dice explícitamente "aplica P1", "aplica todo", "ejecuta los cambios".
2. **Lee SIEMPRE los 3 archivos**: `*.component.ts`, `*.component.html`, `*.component.scss` (o `.css`).
3. **Detecta hijos**: parsea selectors en el HTML (`<ngx-*>`, `<app-*>`) y lee también esos componentes.
4. **Carga el contexto del design system** ANTES de proponer (paso 2).
5. **Output estructurado obligatorio**: secciones A/B/C/D/E (ver `references/output-template.md`).

## Workflow

### Paso 1 — Inputs
- Si el usuario indica un componente, úsalo. Si no, usa el archivo activo del editor.
- Resolver rutas absolutas de `.ts`, `.html`, `.scss`. Leerlos completos.
- Detectar componentes hijos referenciados en el template y leerlos también (mínimo `.ts` + `.html`).

### Paso 2 — Cargar contexto del design system
1. Si existe `DESIGN_TOKENS.md` en la raíz del proyecto, cárgalo.
2. Si NO existe, genéralo escaneando:
   - `src/**/*.scss` → variables (`$color-*`, `$spacing-*`, `$font-*`, `$radius-*`, `$breakpoint-*`).
   - `src/app/shared/component/**` → componentes reutilizables existentes.
   - `src/app/@theme/**` → tema Nebular activo.
   - `src/styles.scss` y `src/themes.scss` (si existen).
   Guardarlo en raíz como referencia futura.
3. Cargar `references/stack-constraints.md` y `references/responsive-guide.md`.

### Paso 3 — Análisis (10 dimensiones)
Aplicar la checklist de `references/ux-checklist.md`. Cubre:

1. **Jerarquía visual** — ¿CTA dominante? ¿flujo claro?
2. **Espaciado y layout** — escala 4/8/16/24/32; detectar inconsistencias.
3. **Consistencia** — botones, tipografías, colores vs tokens del repo.
4. **Simplicidad** — ruido visual, elementos eliminables.
5. **Accesibilidad** — contraste WCAG AA, tamaños táctiles ≥44px, `aria-*`, focus visible.
6. **Interacción** — estados hover/active/focus/disabled/loading; feedback visual.
7. **Layout/Grid** — estructura semántica; flexbox/grid coherente.
8. **Responsive** (ver `references/responsive-guide.md`):
   - Mobile-first ≥320px → 768px → 1024px → 1440px.
   - Tap targets ≥44px en mobile.
   - Modales: full-screen en <600px, centered en ≥600px.
   - Tipografía fluida (`clamp()`).
   - Imágenes con `srcset`/`<picture>`, `loading="lazy"` salvo LCP.
9. **Reutilización** — qué partes deben extraerse a `shared/component/`.
10. **Escalabilidad** — decisiones que romperían consistencia futura.

### Paso 4 — Reporte estructurado
Devolver SIEMPRE en este formato (template completo en `references/output-template.md`):

#### A. Diagnóstico
- ✅ Qué está bien
- ❌ Qué falla (con ubicación: `archivo.html#L45`)

#### B. Cambios propuestos al código
Cada propuesta clasificada:
- **P1 — Crítico** (accesibilidad, bugs visuales, responsive roto)
- **P2 — Mejora** (consistencia, jerarquía, tokens)
- **P3 — Nice-to-have** (animaciones, micro-interacciones)

Cada propuesta DEBE incluir:
- Archivo y línea
- Snippet `// antes`
- Snippet `// después`
- Justificación 1-2 frases

#### C. Patrones extraíbles al design system
- Qué convertir en componente reutilizable (`shared/component/<nombre>/`).
- Qué tokens nuevos añadir (`@theme/styles/_tokens.scss`).
- Qué mixins crear (ej. `@mixin modal-responsive`).

#### D. Desviaciones vs el resto del repo
- Comparar paddings, colores, tipografías, breakpoints contra `DESIGN_TOKENS.md`.
- Listar los puntos que se desvían.

#### E. Responsive audit
- Tabla por breakpoint (320 / 600 / 768 / 1024 / 1440) indicando: layout, tipografía, touch targets, problemas detectados.

### Paso 5 — Apply (solo si el usuario lo aprueba)
Solo modificar archivos cuando el usuario indique:
- `aplica P1` → solo críticos
- `aplica P1 y P2`
- `aplica todo`
- `aplica [propuesta N]` → individual

Después de aplicar, ejecutar `npm run build` (sync) para validar que no rompe TS/SCSS.

## Constraints — NO HACER
- ❌ No sugerir Tailwind, Bootstrap, Chakra, PrimeNG, etc. Stack fijo: **Nebular + Angular Material v18**.
- ❌ No crear `Button`/`Card` propios si ya existen `NbButton`, `MatButton`, `<ngx-card>`.
- ❌ No proponer librerías nuevas sin justificación fuerte.
- ❌ No romper `standalone: true` ni `ChangeDetectionStrategy.OnPush`.
- ❌ No usar `LOCALE_ID` distinto a `es-PE` en pipes.
- ❌ No editar archivos antes de aprobación explícita del usuario.
- ❌ No introducir `!important` salvo override justificado de Nebular/Material.
- ❌ No usar `@apply` ni utilities de Tailwind.

## Constraints — SÍ HACER
- ✅ Mobile-first: media queries `min-width`.
- ✅ Usar tokens SCSS existentes (`$spacing-md`, `$color-primary`, etc.).
- ✅ `aria-label`, `role`, `tabindex` cuando aplique.
- ✅ `OnPush` + `inject()` + signals si el componente lo usa.
- ✅ `@if`/`@for` (Angular 18 control flow), no `*ngIf`/`*ngFor`.
- ✅ `nb-icon` para Eva/Font Awesome; `mat-icon` para Material Icons.
