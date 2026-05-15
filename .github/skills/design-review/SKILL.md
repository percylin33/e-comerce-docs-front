---
name: design-review
description: 'Use when: review component design, mejorar UX/UI de un componente Angular, design audit, design review, /design-review, revisar consistencia visual, propuestas de mejora visual, hacer responsive, mobile-first audit. Analiza componentes Angular standalone (Nebular + Angular Material + SCSS del monorepo) y propone mejoras concretas de jerarquía visual, espaciado, consistencia, accesibilidad, interacción, reutilización y responsive. Por defecto NO edita archivos: solo propone hasta que el usuario apruebe (P1/P2/P3) o pida implementación explícita.'
---

# Design Review — Angular + Nebular + Material

Workflow para auditar y mejorar la calidad UX/UI de un componente del repo `e-comerce-docs-front`, usándolo como **base estándar** para escalar consistencia al resto del sistema.

## Reglas operativas (críticas)

1. **DRY-RUN por defecto**: solo propone, no edita archivos. Aplica cambios si el usuario dice explícitamente **"aplica P1"**, **"aplica todo"**, **"ejecuta los cambios"**, o frases equivalentes de implementación (**"mejora e implementa"**, **"haz los cambios"**, **"aplica lo que propusiste"**). Si solo pide análisis o review, mantener dry-run.
2. **Lee SIEMPRE los 3 archivos**: `*.component.ts`, `*.component.html`, `*.component.scss` (o `.css`).
3. **Detecta hijos**: además de etiquetas en el HTML (`<ngx-*>`, `<app-*>`), revisa **`imports: []` del `standalone`** y rutas referenciadas; lee esos componentes (mínimo `.ts` + `.html`).
4. **Carga el contexto del design system** ANTES de proponer (paso 2).
5. **Output estructurado obligatorio**: secciones A/B/C/D/E (ver `references/output-template.md`).

## Workflow

### Paso 1 — Inputs
- Si el usuario indica un componente, úsalo. Si no, usa el archivo activo del editor.
- Resolver rutas absolutas de `.ts`, `.html`, `.scss`. Leerlos completos.
- Detectar componentes hijos (template + imports standalone) y leerlos también (mínimo `.ts` + `.html`).

### Paso 2 — Cargar contexto del design system
1. **Fuente canónica de tokens en este repo**: cargar `src/app/shared/styles/_tokens.scss` (variables CSS en `:root`, p. ej. `--color-*`, `--space-*`, `--radius-*`). Si el proyecto define otro archivo de tokens, usar el que esté importado en el tema principal.
2. Si existe **`DESIGN_TOKENS.md`** en la raíz del front (documentación humana), cárgalo como resumen; no sustituye al SCSS de tokens.
3. **No generar `DESIGN_TOKENS.md` automáticamente** salvo que el usuario lo pida: evita ruido en el repo. Si hace falta documentar, proponerlo en sección C como tarea opcional.
4. Para contexto adicional, revisar según necesidad: `src/app/shared/component/**`, `src/app/@theme/**`, `src/styles.scss` / `src/themes.scss` (si existen).
5. Cargar `references/stack-constraints.md`, `references/responsive-guide.md` y `references/ux-checklist.md`.

### Paso 3 — Análisis (10 dimensiones + opcionales)
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
   - Modales: full-screen en <600px, centered en ≥600px (ajustar si el producto define otro patrón).
   - Tipografía fluida (`clamp()`).
   - Imágenes con `srcset`/`<picture>`, `loading="lazy"` salvo LCP.
9. **Reutilización** — qué partes deben extraerse a `shared/component/`.
10. **Escalabilidad** — decisiones que romperían consistencia futura.

**Opcional (P3 / mención breve si aplica):** orden de foco y teclado, copy/i18n, **CLS** (imágenes/fonts), `prefers-reduced-motion`.

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
- Qué tokens nuevos añadir en el archivo de tokens del proyecto (p. ej. `src/app/shared/styles/_tokens.scss`).
- Qué mixins crear (ej. `@mixin modal-responsive`).

#### D. Desviaciones vs el resto del repo
- Comparar paddings, colores, tipografías, breakpoints contra **los tokens del proyecto** (`_tokens.scss` / `:root`) y, si existe, `DESIGN_TOKENS.md`.
- Listar los puntos que se desvían.

#### E. Responsive audit
- Tabla por breakpoint (320 / 600 / 768 / 1024 / 1440) indicando: layout, tipografía, touch targets, problemas detectados.

### Paso 5 — Apply (solo si el usuario lo aprueba o pide implementación)
Solo modificar archivos cuando el usuario indique:
- `aplica P1` → solo críticos
- `aplica P1 y P2`
- `aplica todo`
- `aplica [propuesta N]` → individual
- o cualquiera de las frases de implementación explícita de la regla 1.

Después de aplicar, **ejecutar el build del front** según `package.json` del repo (p. ej. `npm run build` o `npx ng build`) para validar que no rompe TS/SCSS.

## Constraints — NO HACER
- ❌ No sugerir **nuevas** dependencias UI masivas (Tailwind, Chakra, PrimeNG, etc.). Stack previsto: **Nebular + Angular Material** ya integrados. **Bootstrap** puede estar presente en el tema global: no proponer “meter Bootstrap desde cero”; no usar utilidades Bootstrap ad-hoc si contradice tokens/Material sin motivo.
- ❌ No crear `Button`/`Card` propios si ya existen `NbButton`, `MatButton`, `<ngx-card>`.
- ❌ No proponer librerías nuevas sin justificación fuerte.
- ❌ No romper `standalone: true` ni `ChangeDetectionStrategy.OnPush` sin acuerdo explícito.
- ❌ No cambiar convenciones de **localización** del proyecto (p. ej. `LOCALE_ID` o pipes de fecha/moneda) salvo petición explícita del usuario.
- ❌ No editar archivos en modo dry-run (sin aprobación o sin pedido de implementación).
- ❌ No introducir `!important` salvo override justificado de Nebular/Material.
- ❌ No usar `@apply` ni utilities de Tailwind.

## Constraints — SÍ HACER
- ✅ Versiones de **Angular / Material**: alinearse con lo declarado en `package.json` del front (no asumir un número fijo de major).
- ✅ Mobile-first: media queries `min-width`.
- ✅ Usar tokens del proyecto: variables **`var(--*)`** desde `:root` y, si el componente usa SCSS clásico, variables **`$*`** coherentes con el repo.
- ✅ `aria-label`, `role`, `tabindex` cuando aplique.
- ✅ `OnPush` + `inject()` + signals si el componente lo usa.
- ✅ `@if`/`@for` (control flow moderno de Angular), evitar `*ngIf`/`*ngFor` en código nuevo.
- ✅ `nb-icon` para Eva/Font Awesome; `mat-icon` para Material Icons (no mezclar sin criterio en el mismo control).
