# Responsive Guide — Mobile-first

Reglas para que la skill audite y proponga responsive correcto.

## Breakpoints estándar del repo

| Nombre | Min-width | Uso típico |
|--------|-----------|-----------|
| `xs` | 0 (base) | Mobile portrait (320–599px) |
| `sm` | 600px | Mobile landscape / phablet |
| `md` | 768px | Tablet portrait |
| `lg` | 1024px | Tablet landscape / laptop |
| `xl` | 1280px | Desktop |
| `xxl` | 1440px | Large desktop |

Nebular usa breakpoints similares vía `NbThemeService.getBreakpointsMap()` — preferir esos en lógica TS y los SCSS variables en estilos.

## Mixins SCSS recomendados

Si no existen, proponer crearlos en `src/app/@theme/styles/_responsive.scss`:

```scss
@mixin from($bp) {
  @if $bp == sm { @media (min-width: 600px)  { @content; } }
  @else if $bp == md { @media (min-width: 768px)  { @content; } }
  @else if $bp == lg { @media (min-width: 1024px) { @content; } }
  @else if $bp == xl { @media (min-width: 1280px) { @content; } }
  @else if $bp == xxl{ @media (min-width: 1440px) { @content; } }
}
```

Uso:
```scss
.card {
  padding: 16px;            // base mobile
  @include from(md) { padding: 24px; }
  @include from(lg) { padding: 32px; }
}
```

## Reglas mobile-first

1. **Estilos base = mobile**. Las media queries solo agregan, nunca restan.
2. **Usar `min-width`**, NO `max-width` (salvo casos puntuales).
3. **Touch targets ≥ 44×44 px** en cualquier interactivo en mobile.
4. **Tipografía fluida** con `clamp(min, fluid, max)` para títulos:
   ```scss
   h1 { font-size: clamp(1.75rem, 4vw + 1rem, 3rem); }
   ```
5. **Imágenes**: `<picture>` + `srcset` + `sizes`. Hero/LCP con `loading="eager" fetchpriority="high"`.
6. **Containers**: `max-width` + `margin: 0 auto` + `padding-inline: 16px` (24 en md+).

## Patrones por componente

### Modales
- **<600px**: full-screen (`width: 100vw; height: 100vh; border-radius: 0;`).
- **≥600px**: centered con `max-width: 600px` (form), `800px` (detalle), `1024px` (galería).
- Botón cerrar siempre visible top-right, ≥44px.
- En mobile: scroll vertical interno (`overflow-y: auto`), header sticky.

### Cards (grids de productos)
- **<600px**: 1 columna.
- **600–767px**: 2 columnas.
- **768–1023px**: 3 columnas.
- **≥1024px**: 4 columnas.
- Usar `display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;`.

### Navegación / Header
- **<768px**: hamburger menu (drawer/sidenav).
- **≥768px**: navegación horizontal inline.
- Logo escala: 32px mobile → 40px desktop.

### Tablas (admin)
- **<768px**: convertir a cards stack o scroll horizontal con sombra de scroll-hint.
- **≥768px**: tabla normal.

### Formularios
- **<768px**: inputs full-width, labels arriba (no inline).
- **≥768px**: opcional 2 columnas con `display: grid; grid-template-columns: 1fr 1fr; gap: 16px;`.
- Submit button: full-width en mobile, auto en desktop.

### Hero / Landing
- **<768px**: stack vertical (texto arriba, imagen abajo).
- **≥768px**: side-by-side (texto izquierda, imagen derecha).

## Audit checklist responsive (la skill DEBE chequear)

Para cada componente, generar tabla:

| Breakpoint | Layout OK | Tipografía OK | Touch targets ≥44px | Imágenes optimizadas | Problemas |
|------------|-----------|---------------|---------------------|----------------------|-----------|
| 320 (xs)   | ?         | ?             | ?                   | ?                    | ...       |
| 600 (sm)   | ?         | ?             | ?                   | ?                    | ...       |
| 768 (md)   | ?         | ?             | ?                   | ?                    | ...       |
| 1024 (lg)  | ?         | ?             | ?                   | ?                    | ...       |
| 1440 (xxl) | ?         | ?             | ?                   | ?                    | ...       |

## Anti-patrones responsive

- ❌ `width: 100vw` (causa scroll horizontal con scrollbar).
- ❌ `font-size` en `px` para títulos (preferir `rem` o `clamp`).
- ❌ Media queries `max-width` desordenadas que sobreescriben base.
- ❌ Posicionamiento fijo sin `safe-area-inset` en mobile.
- ❌ `display: none` para ocultar contenido en mobile en vez de adaptar.
- ❌ Tablas sin alternativa mobile.
- ❌ Modales con `width: 600px` fijo (rompen <600px).
- ❌ Touch targets <44px (botones de icono pequeños sin padding).
