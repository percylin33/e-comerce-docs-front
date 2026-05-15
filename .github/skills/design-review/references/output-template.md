# Output Template — Reporte Design Review

La skill DEBE devolver el resultado en este formato exacto. No omitir secciones.

---

# Design Review: `<NombreComponente>`

**Archivos analizados:**
- [path/to/component.ts](path/to/component.ts)
- [path/to/component.html](path/to/component.html)
- [path/to/component.scss](path/to/component.scss)

**Componentes hijos detectados:** `<ngx-card>`, `<ngx-foo>` (...)

**Contexto cargado:** `src/app/shared/styles/_tokens.scss` ✅ · `DESIGN_TOKENS.md` (si existe) ✅ / no aplica

---

## A. Diagnóstico

### ✅ Qué está bien
- ...
- ...

### ❌ Qué falla
| # | Problema | Ubicación | Dimensión |
|---|----------|-----------|-----------|
| 1 | Botón CTA no destaca, mismo color que secundarios | `component.html#L42` | Jerarquía |
| 2 | Padding `13px` arbitrario | `component.scss#L88` | Espaciado |
| 3 | Sin focus visible en links | `component.scss#L120` | Accesibilidad |
| ... | ... | ... | ... |

---

## B. Cambios propuestos al código

### 🔴 P1 — Crítico (accesibilidad, bugs visuales, responsive roto)

#### P1.1 — Añadir `aria-label` al botón cerrar
**Archivo:** `component.html#L12`
**Justificación:** Botón solo-icono sin texto accesible (WCAG 4.1.2).

```html
<!-- antes -->
<button mat-icon-button (click)="close()">
  <mat-icon>close</mat-icon>
</button>

<!-- después -->
<button mat-icon-button (click)="close()" aria-label="Cerrar modal">
  <mat-icon>close</mat-icon>
</button>
```

#### P1.2 — Modal full-screen en mobile
**Archivo:** `component.scss#L20`
**Justificación:** En 320px el modal se desborda; debe ser full-screen <600px.

```scss
// antes
.modal-container {
  width: 600px;
  border-radius: 8px;
}

// después
.modal-container {
  width: 100%;
  height: 100%;
  border-radius: 0;

  @include from(sm) {
    width: 600px;
    height: auto;
    border-radius: 8px;
  }
}
```

### 🟡 P2 — Mejora (consistencia, jerarquía, tokens)

#### P2.1 — Reemplazar `#002366` por `$color-primary`
**Archivo:** `component.scss#L45`
**Justificación:** Color hardcoded; el repo ya tiene `$color-primary: #002366`.

```scss
// antes
.header { background: #002366; }

// después
.header { background: $color-primary; }
```

### 🟢 P3 — Nice-to-have

#### P3.1 — Animación entrada modal
...

---

## C. Patrones extraíbles al design system

### Componentes reutilizables a crear/promover
- **`<ngx-modal-header>`**: extraer cabecera (título + botón cerrar) — se repite en 6 modales del repo.
  - Ubicación sugerida: `src/app/shared/component/modal-header/`
  - API: `@Input() title: string; @Output() closed = new EventEmitter<void>();`

### Tokens nuevos a añadir
Archivo sugerido: `src/app/shared/styles/_tokens.scss` (o el archivo de tokens que importe el tema del repo)

```scss
// Spacing scale
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 16px;
$spacing-lg: 24px;
$spacing-xl: 32px;
$spacing-2xl: 48px;

// Radius
$radius-sm: 4px;
$radius-md: 8px;
$radius-lg: 16px;

// Z-index
$z-modal: 1000;
$z-toast: 1100;
```

### Mixins a crear
- `@mixin modal-responsive` — full-screen <600px, centered ≥600px.
- `@mixin focus-ring` — outline accesible reutilizable.

---

## D. Desviaciones vs el resto del repo

| Item | En este componente | Estándar del repo | Acción |
|------|-------------------|-------------------|--------|
| Padding card | `13px` | `16px` (`$spacing-md`) | Alinear |
| Color header | `#002366` | `$color-primary` | Token |
| Border radius | `7px` | `$radius-md = 8px` | Token |
| Botón cerrar tamaño | `32px` | `44px` mínimo | Crítico |

---

## E. Responsive Audit

| Breakpoint | Layout | Tipografía | Touch ≥44px | Imágenes | Problemas |
|------------|--------|------------|-------------|----------|-----------|
| 320 xs     | ❌ Modal desborda | ⚠️ Título 32px fijo | ❌ Cerrar 32px | ✅ | P1.2, P1.5 |
| 600 sm     | ✅ | ✅ | ✅ | ✅ | -- |
| 768 md     | ✅ | ✅ | ✅ | ✅ | -- |
| 1024 lg    | ✅ | ✅ | ✅ | ✅ | -- |
| 1440 xxl   | ⚠️ Modal pequeño en pantalla grande | ✅ | ✅ | ✅ | P3.2 |

---

## Próximos pasos

Para aplicar los cambios responde con:
- `aplica P1` → solo críticos
- `aplica P1 y P2`
- `aplica todo`
- `aplica P1.2 y P2.1` → individuales

Después de aplicar, se ejecutará `npm run build` para validar.
