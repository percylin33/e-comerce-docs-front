# UX/UI Checklist — 10 dimensiones

Aplicar a CADA componente bajo revisión. Marcar ✅/❌ con ubicación exacta.

## 1. Jerarquía visual
- [ ] El usuario entiende en <3 segundos qué acción tomar.
- [ ] Hay UN CTA dominante (color de marca, tamaño, posición).
- [ ] CTAs secundarios son visualmente subordinados (outline/text button).
- [ ] Títulos siguen escala tipográfica (h1 > h2 > h3) sin saltos.
- [ ] Información crítica está arriba (above-the-fold en mobile).

## 2. Espaciado y layout
- [ ] Padding/margin usan escala 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64.
- [ ] No hay valores arbitrarios (`padding: 13px` ❌).
- [ ] Gap consistente en flex/grid (preferir `gap` sobre `margin` entre hijos).
- [ ] Vertical rhythm: distancias entre bloques múltiplos de 8.
- [ ] Padding interno de cards ≥ 16px (24 en desktop).

## 3. Consistencia
- [ ] Botones usan `nb-button` o `mat-button` (no `<button class="custom">`).
- [ ] Colores referencian variables SCSS (`$color-primary`, no `#002366` literal).
- [ ] Tipografías = Roboto (única familia salvo justificación).
- [ ] Border-radius usa tokens (`$radius-sm/md/lg`).
- [ ] Iconografía = una sola librería por contexto (no mezclar Material + Eva en el mismo botón).

## 4. Simplicidad
- [ ] Sin elementos decorativos sin función (gradientes excesivos, shadows múltiples).
- [ ] Sin labels redundantes ("Click aquí para hacer click").
- [ ] Sin más de 3 colores principales por vista.
- [ ] Microcopy concisa (acciones en imperativo: "Comprar", no "Hacer compra").

## 5. Accesibilidad (WCAG 2.1 AA)
- [ ] Contraste texto/fondo ≥ 4.5:1 (normal), ≥ 3:1 (large/bold ≥18px).
- [ ] Focus visible en TODOS los interactivos (`:focus-visible`).
- [ ] `aria-label` en botones solo-icono.
- [ ] `alt` descriptivo en imágenes (vacío `alt=""` solo si decorativa).
- [ ] Tamaño táctil mínimo 44×44px (mobile).
- [ ] Navegable por teclado (Tab/Enter/Esc en modales).
- [ ] `role="dialog"` + `aria-modal="true"` en modales.
- [ ] Tipografía base ≥ 16px para body.

## 6. Interacción
- [ ] Estado **hover**: cambio sutil (background, scale, shadow).
- [ ] Estado **active/pressed**: feedback inmediato.
- [ ] Estado **focus**: outline visible (no eliminar `outline` sin reemplazo).
- [ ] Estado **disabled**: opacidad ≤ 0.5 + `cursor: not-allowed`.
- [ ] Estado **loading**: spinner o skeleton, no bloqueo silencioso.
- [ ] Transiciones ≤ 300ms (cubic-bezier suave).
- [ ] Feedback tras acción (toast, mensaje inline, cambio de estado).

## 7. Layout / Grid
- [ ] Estructura semántica (`<header>`, `<main>`, `<section>`, `<nav>`).
- [ ] Flex/Grid coherente con el resto del repo.
- [ ] No `position: absolute` salvo overlay/tooltip.
- [ ] Sin `width: 100vw` (usar `100%`).
- [ ] Containers con `max-width` y `margin: auto`.

## 8. Responsive (ver `responsive-guide.md` para detalle)
- [ ] Mobile-first: estilos base = móvil, media queries `min-width`.
- [ ] Probado en 320 / 375 / 768 / 1024 / 1440.
- [ ] Tipografía fluida con `clamp()` cuando aplique.
- [ ] Imágenes responsive (`<picture>`, `srcset`, `sizes`).
- [ ] Modales: full-screen <600px, centered ≥600px.
- [ ] Tablas: scroll horizontal o transformación a cards en mobile.
- [ ] Menús: hamburger en <768px.

## 9. Reutilización
- [ ] ¿Este patrón aparece en ≥2 lugares? → extraer a `shared/component/`.
- [ ] ¿Este estilo (badge, pill, chip) está duplicado? → mixin SCSS.
- [ ] ¿Hay lógica de presentación copiada? → directiva o pipe.
- [ ] Inputs claros con `@Input()` tipados.
- [ ] Outputs como `@Output() EventEmitter` con tipo.

## 10. Escalabilidad
- [ ] Nada de magic numbers (todo via tokens).
- [ ] Nada de hardcoded strings de UI sin i18n key (si i18n existe).
- [ ] Nombres de clases CSS con prefijo de componente (`.modal-doc-*`).
- [ ] No depende de orden DOM frágil (selector posicional `:nth-child` sin razón).
- [ ] Estilos scoped al componente (no `::ng-deep` salvo override Nebular justificado).
