---
name: design-review
description: >-
  Audita y propone mejoras UX/UI de componentes Angular en e-comerce-docs-front
  (Nebular + Material + SCSS). Usar cuando el usuario pida design review, revisar
  consistencia visual, mejorar UI/UX, responsive/mobile-first, accesibilidad,
  jerarquía, tokens, /design-review, o audit de un .component. Por defecto solo
  reporta (dry-run); implementa cambios solo con aprobación explícita (P1/P2/P3).
---

# Design Review — Angular + Nebular + Material

Auditoría UX/UI de componentes del front `e-comerce-docs-front`. El objetivo es **mejorar el componente analizado** y **extraer patrones** reutilizables para el resto del sistema.

## Modos de trabajo

| Modo | Cuándo | Qué hace el agente |
|------|--------|-------------------|
| **Dry-run** (default) | Review, análisis, “qué mejorarías”, sin pedir implementar | Lee archivos, carga tokens, entrega reporte A–E. **No edita código.** |
| **Apply** | “aplica P1”, “aplica todo”, “implementa”, “haz los cambios” | Aplica solo lo aprobado y ejecuta build (`npm run build` o `npx ng build`). |

Si el usuario no especifica prioridad al aplicar, preguntar: **P1 solo**, **P1+P2** o **todo**.

---

## Inicio rápido (orden obligatorio)

```
1. Resolver componente → leer .ts + .html + .scss
2. Detectar hijos (template + imports standalone) → leer mínimo .ts + .html de cada uno
3. Cargar design system (_tokens.scss + references/)
4. Analizar 10 dimensiones (ux-checklist.md)
5. Entregar reporte A–E (output-template.md)
6. [Opcional] Apply si el usuario lo pide
```

---

## Paso 1 — Resolver el componente

**Entrada:** ruta del usuario, selector (`ngx-*`, `app-*`) o **archivo activo** en el editor.

| Archivo | Obligatorio |
|---------|-------------|
| `*.component.ts` | Sí |
| `*.component.html` | Sí |
| `*.component.scss` o `.css` | Sí |

**Hijos:** además del HTML, revisar `imports: []` del `standalone` y componentes referenciados. Leer cada hijo (mínimo `.ts` + `.html`).

---

## Paso 2 — Contexto del design system

Cargar **antes** de proponer cambios:

| Prioridad | Recurso | Ruta |
|-----------|---------|------|
| 1 | Tokens CSS | `src/app/shared/styles/_tokens.scss` (`:root`, `--color-*`, `--space-*`, `--radius-*`) |
| 2 | Mixins / animaciones | `src/app/shared/styles/_mixins.scss`, `_animations-on-scroll.scss` (si aplica) |
| 3 | Referencias de la skill | `references/stack-constraints.md`, `references/responsive-guide.md`, `references/ux-checklist.md` |
| 4 | Tema / shared | `src/app/@theme/**`, `src/app/shared/component/**`, `src/styles.scss` (según necesidad) |
| 5 | Doc humana (opcional) | `DESIGN_TOKENS.md` en raíz del front, si existe |

No crear `DESIGN_TOKENS.md` automáticamente; proponerlo en sección **C** solo si aporta valor.

---

## Paso 3 — Dimensiones de análisis

Usar `references/ux-checklist.md` como guía detallada. Resumen:

| # | Dimensión | Pregunta clave |
|---|-----------|----------------|
| 1 | Jerarquía visual | ¿El CTA principal se entiende en 3 s? |
| 2 | Espaciado / layout | ¿Escala 4/8/16/24/32 y sin valores mágicos? |
| 3 | Consistencia | ¿Colores, tipografía y botones vs tokens? |
| 4 | Simplicidad | ¿Qué sobra o duplica otro bloque? |
| 5 | Accesibilidad | ¿Contraste AA, focus visible, `aria-*`, targets ≥44px? |
| 6 | Interacción | ¿hover / focus / disabled / loading con feedback? |
| 7 | Layout / grid | ¿HTML semántico y flex/grid coherentes? |
| 8 | Responsive | Ver `references/responsive-guide.md` (320 → 1440) |
| 9 | Reutilización | ¿Extraer a `shared/component/`? |
| 10 | Escalabilidad | ¿La solución escala sin romper el DS? |

**Opcional (P3 o mención breve):** orden de tabulación, copy/i18n, CLS, `prefers-reduced-motion`.

---

## Paso 4 — Reporte (formato obligatorio)

Plantilla completa: **`references/output-template.md`**.

### Prioridades de propuestas

| Nivel | Significado | Ejemplos |
|-------|-------------|----------|
| **P1 — Crítico** | Bloquea uso, accesibilidad, responsive roto | Sin `aria-label` en icon-only, modal desbordado en 320px |
| **P2 — Mejora** | Consistencia, tokens, jerarquía | Padding arbitrario, color fuera de `--color-*` |
| **P3 — Nice-to-have** | Pulido | Micro-animación, refinamiento de densidad |

Cada ítem en **B** debe incluir: archivo + línea, snippet **antes/después**, justificación (1–2 frases).

### Secciones del reporte

| Sección | Contenido |
|---------|-----------|
| **A** | Diagnóstico (✅ bien / ❌ fallas con ubicación) |
| **B** | Cambios propuestos (P1 / P2 / P3 con snippets) |
| **C** | Patrones para el design system (componentes, tokens, mixins) |
| **D** | Desviaciones vs resto del repo |
| **E** | Tabla responsive (320 / 600 / 768 / 1024 / 1440) |

---

## Paso 5 — Apply (solo con aprobación)

Frases que activan implementación:

- `aplica P1` → solo críticos  
- `aplica P1 y P2`  
- `aplica todo` / `aplica [propuesta N]`  
- `implementa`, `haz los cambios`, `mejora e implementa`

Tras aplicar: **build del front** y corregir errores TS/SCSS antes de dar por cerrado.

---

## Stack y restricciones

Detalle: `references/stack-constraints.md`.

### Usar

- Versiones de **Angular / Material** según `package.json` del front  
- **Mobile-first** (`min-width` en media queries)  
- Tokens: `var(--*)` en CSS; `$*` en SCSS alineado al repo  
- Control flow **`@if` / `@for`** (evitar `*ngIf` / `*ngFor` en código nuevo)  
- `OnPush`, `inject()`, signals si el componente ya los usa  
- `nb-icon` (Eva/FA) y `mat-icon` (Material) con criterio, sin mezclar en el mismo control  

### No usar / no proponer

| Evitar | Motivo |
|--------|--------|
| Tailwind, Chakra, PrimeNG “desde cero” | Stack ya definido |
| `Button`/`Card` custom si existen `NbButton`, `MatButton`, `ngx-card` | Duplicar DS |
| `!important` | Salvo override documentado de Nebular/Material |
| `@apply` / utilidades Tailwind | No es el stack |
| Cambiar `LOCALE_ID` / pipes i18n | Salvo petición explícita |
| Romper `standalone` u `OnPush` | Salvo acuerdo explícito |
| Editar en dry-run | Solo reportar |

**Bootstrap** puede existir en el tema global: no proponer añadirlo; no usar utilidades Bootstrap ad-hoc si contradicen tokens/Material.

---

## Casos frecuentes en este repo

| Patrón | Revisar especialmente |
|--------|------------------------|
| Admin (`pages-admin/**`) | Scroll en Nebular `windowMode`, overlays Material, tablas densas |
| `mat-autocomplete` | Atributo `class` en el panel (no `panelClass` en Material 18+), `overflow-y: auto` en lista |
| `mat-select` / `nb-select` | Panel con scroll, `panelClass` si aplica |
| Modales / dialogs | Full-screen &lt;600px, focus trap, cierre accesible |
| Formularios largos (wizards) | Progreso visible, validación inline, sticky actions |

---

## Ejemplos de invocación

**Dry-run:**

> Revisa el diseño de `registrar-suscripcion`  
> Design review del checkout — solo propuestas  
> ¿Qué mejorarías en la UI de suscripciones?

**Apply:**

> Aplica P1 del design review  
> Implementa las mejoras P1 y P2 que propusiste  

---

## Referencias

| Archivo | Uso |
|---------|-----|
| [references/output-template.md](references/output-template.md) | Formato exacto del reporte |
| [references/ux-checklist.md](references/ux-checklist.md) | Checklist por dimensión |
| [references/responsive-guide.md](references/responsive-guide.md) | Breakpoints y patrones responsive |
| [references/stack-constraints.md](references/stack-constraints.md) | Stack, módulos y anti-patrones |
