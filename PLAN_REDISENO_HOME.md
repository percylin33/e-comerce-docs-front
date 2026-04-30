# Plan de rediseño — Home + Navbar + Footer
> Inspirado en referencia "EduMarket" (no fiel 1:1). Stack: **Angular 18 standalone + Nebular + Material v18 + SCSS**.
> Usa **exclusivamente** los tokens de [_tokens.scss](src/app/shared/styles/_tokens.scss).
> Modo: **DRY-RUN**. Nada se aplica hasta confirmación explícita (`aplica P1`, `aplica P1+P2`, `aplica todo`).

---

## 0. Decisiones acordadas (recordatorio)

| Tema | Decisión |
|---|---|
| Alcance | Rediseño profundo: nuevos componentes shared + refactor estructural |
| Fidelidad | Inspiración general; **paleta y tipografía = `_tokens.scss`** |
| Navbar | Mantener logo actual. **Sin buscador en navbar** (queda solo en hero) |
| Carrousel | Grid en desktop / carrousel en mobile (`@media (max-width: 768px)`) |
| Footer | Mantener estructura actual (4 secciones), solo restilizar |
| Dark mode | Mantener via `partials/dark-mode` |
| Secciones home | Hero + Servicios + Añadidos recientemente + FAQ + CTA azul + Footer |

---

## A. Diagnóstico

### Header actual ([header.component.scss](src/app/@theme/components/header/header.component.scss), [header.component.html](src/app/@theme/components/header/header.component.html))
✅ Buena: logo + nav central + acciones a la derecha; usa `nb-icon`, soporta dropdown servicios.
❌ Problemas:
- Colores hardcodeados (`#0C52D4`, `#11B0F2`) repetidos → no usa tokens ([header.component.scss#L186](src/app/@theme/components/header/header.component.scss#L186), [header.component.scss#L226](src/app/@theme/components/header/header.component.scss#L226)).
- Sin estado `sticky`, sin sombra al hacer scroll.
- `Login`/`Register` son `<a class="btn btn-primary/secondary">` (no usan `nbButton` consistente).
- Tap targets de los enlaces nav (≈ 16px font, padding 0.5rem) están justo en el límite de 44px.
- Falta jerarquía: `Login` y `Register` se ven con peso visual idéntico. La referencia muestra `Login` ghost / `Register` sólido.
- `outline`/`focus-visible` no definido para teclado.
- `box-shadow` repetido inline en dropdown ([header.component.scss#L195](src/app/@theme/components/header/header.component.scss#L195)).

### Home actual ([home.component.html](src/app/site/home/home.component.html), [home.component.scss](src/app/site/home/home.component.scss))
✅ Buena: hero con animación, accesible (aria-labels en search), control flow `@if/@for`, OnPush.
❌ Problemas:
- SCSS de **>2000 líneas** monolítico → ingobernable. Sin separación por sección.
- Mezcla de `nb-theme(...)`, variables hardcoded (`#0150b9`), tokens `var(--color-*)`, y `--color-neutral-*` sin importar `_tokens.scss` desde `styles.scss` (verificar).
- Hero: imagen `.teacher-image` sin contenedor "card flotante con badge éxito" como la referencia.
- Cards de servicios: grid OK pero icono no tiene fondo circular suave (la referencia usa `circle bg-brand-50` → `icon brand-500`).
- Sección "Añadidos Recientemente" usa `<ngx-carrousel>` directo, sin header con título + "Ver todos".
- Sin sección "Más populares" (decisión: omitida).
- CTA final azul "¿Listo para transformar tus clases?" **no existe** → hay que crearla.
- `service-badge`, `card-item`, etc. con estilos repetidos → candidatos a componentes shared.
- Demasiadas animaciones decorativas (carpetas flotantes en hero) → impacto en LCP.

### Footer actual ([footer.component.html](src/app/@theme/components/footer/footer.component.html), [footer.component.scss](src/app/@theme/components/footer/footer.component.scss))
✅ 4 secciones (Acerca / Ayuda / Legal / Social) — ya alineado con la referencia.
❌ Problemas:
- Colores `$primary-color: #333`, `$link-hover-color: #555` hardcoded → no tokens.
- Sin barra inferior con copyright + año dinámico.
- Iconos de redes inconsistentes (mezcla `ion-*` + `fab fa-*`) — funcional pero visualmente desigual (tamaños distintos).
- Sin separador visual top (`border-top: 1px solid var(--color-border)`).
- Ancho responsive: en mobile 2x2 grid, OK. En tablet (~600-768px) puede romperse.
- `.footer` no está dentro de `<footer class="site-footer">` con fondo diferenciado.
- `min-width: 50px` en `.footer-section` permite columnas absurdamente angostas.

---

## B. Cambios propuestos al código

### 🟥 P1 — Crítico (accesibilidad, tokens, base estructural)

#### P1.1 — Crear partials SCSS para descomponer `home.component.scss`
**Archivo nuevo:** `src/app/site/home/partials/`
- `_hero.scss`
- `_services-grid.scss`
- `_recent-added.scss`
- `_faq.scss`
- `_cta-banner.scss`
- `_search.scss`
- `_animations.scss` (ya existe)
- `_dark-mode.scss` (ya existe)

`home.component.scss` queda como **orquestador** de ~30 líneas:
```scss
@import '@nebular/theme/styles/theming';
@include nb-install-component();

@import './partials/animations';
@import './partials/hero';
@import './partials/search';
@import './partials/services-grid';
@import './partials/recent-added';
@import './partials/cta-banner';
@import './partials/faq';
@import './partials/dark-mode';
```
**Justificación:** mantenibilidad. 2000 líneas en un solo archivo es bug-prone.

#### P1.2 — Header: tokens + sticky + focus visible + jerarquía Login/Register
**Archivo:** [header.component.scss](src/app/@theme/components/header/header.component.scss)

```scss
// antes (L186, L226, L246, ...)
color: #0C52D4;
&:hover { color: #11B0F2; }

// después
color: var(--color-primary);
&:hover { color: var(--color-primary-hover); }
&:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; border-radius: var(--radius-xs); }
```

Header sticky con sombra al scroll:
```scss
.header-container {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  background: var(--color-bg);
  backdrop-filter: saturate(180%) blur(8px);
  border-bottom: 1px solid var(--color-border);
  transition: box-shadow var(--dur-base) var(--ease-standard);

  &.is-scrolled { box-shadow: var(--shadow-sm); }
}
```

Login ghost / Register sólido:
```scss
.btn-primary {                  // Login → ghost
  background: transparent;
  color: var(--color-primary);
  border: 1px solid transparent;
  &:hover { background: var(--color-primary-soft); }
}
.btn-secondary {                // Register → sólido (es el CTA)
  background: var(--color-primary);
  color: var(--color-text-on-brand);
  border-radius: var(--radius-sm);
  padding: 0 var(--control-padding-x-md);
  height: var(--control-height-md);
  &:hover { background: var(--color-primary-hover); box-shadow: var(--shadow-md); }
}
```

> Nota: en el HTML las clases `btn-primary`/`btn-secondary` se mantienen para no tocar `header.component.html`. Si prefieres invertirlas semánticamente, hacerlo en P2.

#### P1.3 — Eliminar buscador del navbar (no aplica, ya no existe)
La referencia tiene buscador en navbar, pero **decidiste mantenerlo solo en hero**. ✅ Sin cambio.

#### P1.4 — Footer: usar tokens + barra de copyright
**Archivo:** [footer.component.scss](src/app/@theme/components/footer/footer.component.scss)

```scss
// antes
$primary-color: #333;
$link-hover-color: #555;

// después
.footer {
  background: var(--color-bg-subtle);
  border-top: 1px solid var(--color-border);
  padding: var(--space-7) var(--space-5) var(--space-5);
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 1fr;
  gap: var(--space-7);

  .footer-section {
    h4 {
      font-size: var(--font-size-body);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text);
      letter-spacing: var(--letter-spacing-wide);
      text-transform: uppercase;
      margin-bottom: var(--space-4);
    }
    a {
      color: var(--color-text-muted);
      font-size: var(--font-size-body);
      transition: color var(--dur-fast) var(--ease-standard);
      &:hover { color: var(--color-primary); text-decoration: none; }
      &:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
    }
  }

  @media (max-width: 768px) { grid-template-columns: 1fr 1fr; }
  @media (max-width: 480px) { grid-template-columns: 1fr; }
}
```

**Añadir en `footer.component.html` (al final del `<footer>`):**
```html
<div class="footer-bottom">
  <small>© {{ currentYear }} Carpeta Digital. Todos los derechos reservados.</small>
</div>
```
Y en TS: `currentYear = new Date().getFullYear();`

#### P1.5 — Servicios: icono con fondo circular suave (estilo referencia)
**Archivo:** `home/partials/_services-grid.scss` (nuevo)
```scss
.service-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-3);
  transition: transform var(--dur-base) var(--ease-standard),
              box-shadow var(--dur-base) var(--ease-standard),
              border-color var(--dur-fast);

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
    border-color: var(--color-primary);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  .service-icon {
    width: 56px;
    height: 56px;
    border-radius: var(--radius-pill);
    background: var(--color-primary-soft);
    display: grid;
    place-items: center;
    color: var(--color-primary);
    mat-icon, nb-icon { font-size: 28px; width: 28px; height: 28px; }
  }

  .service-title {
    font-size: var(--font-size-body);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text);
    margin: 0;
  }
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--space-4);

  @media (max-width: 1200px) { grid-template-columns: repeat(4, 1fr); }
  @media (max-width: 900px)  { grid-template-columns: repeat(3, 1fr); }
  @media (max-width: 600px)  { grid-template-columns: repeat(2, 1fr); }
}
```

#### P1.6 — Hero: card flotante con imagen + badge "Éxito Total"
**Archivo:** [home.component.html](src/app/site/home/home.component.html#L60) (sustituir `.hero-image`)
```html
<div class="hero-figure animate-slide-right animate-delay-300">
  <picture class="hero-figure__photo">
    <source media="(max-width: 810px)" srcset="/assets/images/home.webp">
    <source media="(max-width: 1200px)" srcset="/assets/images/home-2.webp">
    <img src="/assets/images/home-3.webp" alt="Material pedagógico"
         loading="eager" fetchpriority="high">
  </picture>
  <div class="hero-figure__badge" role="status">
    <mat-icon aria-hidden="true">check_circle</mat-icon>
    <div>
      <small>ÉXITO TOTAL</small>
      <strong>Planificación {{ currentYear }}</strong>
    </div>
  </div>
</div>
```
SCSS en `_hero.scss`:
```scss
.hero-figure {
  position: relative;
  border-radius: var(--radius-xl);
  overflow: visible;
  background: var(--color-bg);
  box-shadow: var(--shadow-lg);

  &__photo img { display: block; width: 100%; border-radius: var(--radius-xl); }
  &__badge {
    position: absolute;
    bottom: -16px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-pill);
    padding: var(--space-2) var(--space-4);
    box-shadow: var(--shadow-md);
    display: flex;
    align-items: center;
    gap: var(--space-2);

    mat-icon { color: var(--color-success); }
    small { display: block; font-size: 10px; color: var(--color-text-muted); letter-spacing: var(--letter-spacing-wide); }
    strong { font-size: var(--font-size-body); color: var(--color-text); }
  }
}
```

#### P1.7 — Tipografía hero: jerarquía + título a 2 colores
HTML:
```html
<h1 class="hero-title">
  Material pedagógico
  <span class="hero-title__accent">listo para aplicar</span>
</h1>
```
SCSS:
```scss
.hero-title {
  font-size: clamp(28px, 4.5vw, var(--font-size-hero));
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--color-text);

  &__accent { color: var(--color-primary); display: block; }
}
.hero-subtitle {
  font-size: var(--font-size-lead);
  color: var(--color-text-muted);
  line-height: var(--line-height-snug);
  margin-top: var(--space-3);
  max-width: 56ch;
}
```

> **Importante:** quitar fondo azul oscuro del hero actual. Pasar a fondo blanco/`--color-bg-subtle` con tipografía oscura sobre claro (igual referencia).

#### P1.8 — Accesibilidad: tap targets + focus en CTA principal
- Botones de CTA en hero, FAQ y banner final → `min-height: var(--control-height-lg)` (48px) en mobile.
- Asegurar `:focus-visible` con `var(--shadow-focus)` en todos los enlaces e inputs.

---

### 🟧 P2 — Mejora (consistencia + nuevos componentes shared)

#### P2.1 — Nuevo componente shared: `<ngx-section-header>`
**Path:** `src/app/shared/component/section-header/section-header.component.ts`
Standalone, OnPush, signals + `inject()`.
Inputs: `title`, `subtitle?`, `actionLabel?`, `actionRoute?`.
Render: título h2 + subtítulo + botón "Ver todos →" alineado a la derecha (referencia "Añadidos Recientemente").
Uso: hero, servicios, recientes, FAQ, populares.

#### P2.2 — Nuevo componente shared: `<ngx-product-card>`
**Path:** `src/app/shared/component/product-card/product-card.component.ts`
Reemplaza el HTML de cards en home y resultados de búsqueda.
Estructura:
```html
<article class="product-card">
  <div class="product-card__media">
    <img [src]="item.image" [alt]="item.title" loading="lazy">
    @if (item.level) { <span class="product-card__badge">{{ item.level }}</span> }
  </div>
  <div class="product-card__body">
    <small class="product-card__category">{{ item.category }}</small>
    <h3 class="product-card__title">{{ item.title }}</h3>
    <div class="product-card__rating">⭐ {{ item.rating }} <small>({{ item.reviews }})</small></div>
    <div class="product-card__footer">
      <span class="product-card__price">S/ {{ item.price | number:'1.2-2' }}</span>
      <button mat-icon-button class="product-card__cart" (click)="addToCart()">
        <mat-icon>shopping_cart</mat-icon>
      </button>
    </div>
  </div>
</article>
```
SCSS usa tokens íntegros. Estados `:hover` con `transform: translateY(-2px)` + `var(--shadow-md)`.

#### P2.3 — Nuevo componente shared: `<ngx-cta-banner>`
**Path:** `src/app/shared/component/cta-banner/cta-banner.component.ts`
Banner azul final ("¿Listo para transformar tus clases?"). Inputs:
- `title`, `subtitle`, `primaryAction { label, route }`, `secondaryAction? { label, route }`.
SCSS:
```scss
.cta-banner {
  background: linear-gradient(135deg, var(--color-brand-700), var(--color-brand-500));
  color: var(--color-text-on-brand);
  border-radius: var(--radius-lg);
  padding: var(--space-7) var(--space-5);
  text-align: center;
  display: grid;
  gap: var(--space-4);
  justify-items: center;

  &__actions { display: flex; gap: var(--space-3); flex-wrap: wrap; justify-content: center; }
  &__btn--primary {
    background: var(--color-bg); color: var(--color-primary);
    height: var(--control-height-lg); padding: 0 var(--space-5);
    border-radius: var(--radius-sm); font-weight: var(--font-weight-semibold);
  }
  &__btn--ghost {
    background: transparent; color: var(--color-text-on-brand);
    border: 1px solid rgba(255,255,255,0.4);
    height: var(--control-height-lg); padding: 0 var(--space-5);
  }
}
```
Uso en `home.component.html` reemplazando bloque actual o como nueva sección antes del footer.

#### P2.4 — Sección "Añadidos Recientemente" con grid+carrousel responsive
HTML:
```html
<section class="recent-section animate-on-scroll">
  <div class="container">
    <ngx-section-header title="Añadidos Recientemente"
                       subtitle="Nuevos materiales educativos frescos cada semana."
                       actionLabel="Ver todos →"
                       actionRoute="/site/categorias">
    </ngx-section-header>

    <!-- Desktop: grid -->
    <div class="recent-section__grid">
      @for (item of recentDocs(); track item.id) {
        <ngx-product-card [item]="item"></ngx-product-card>
      }
    </div>
    <!-- Mobile: carrousel -->
    <div class="recent-section__carrousel">
      <ngx-carrousel [items]="recentDocs()"></ngx-carrousel>
    </div>
  </div>
</section>
```
SCSS:
```scss
.recent-section {
  &__grid     { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-5); }
  &__carrousel { display: none; }

  @media (max-width: 768px) {
    &__grid     { display: none; }
    &__carrousel { display: block; }
  }
}
```

#### P2.5 — Hero: social proof avatares + CTA inline
HTML:
```html
<div class="hero-search-row">
  <input ...>
  <button class="hero-search-btn">Buscar Recursos</button>
</div>
<div class="hero-social-proof">
  <div class="hero-avatars">
    <img src="/assets/images/avatars/a1.webp" alt="">
    <img src="/assets/images/avatars/a2.webp" alt="">
    <img src="/assets/images/avatars/a3.webp" alt="">
  </div>
  <small>Más de 10,000 docentes confían en nosotros</small>
</div>
```
SCSS: avatares con `border-radius: var(--radius-pill); border: 2px solid var(--color-bg);` y solapados (`margin-left: -8px`).

> **Pendiente confirmar:** ¿usamos avatares reales o placeholders genéricos por ahora?

#### P2.6 — FAQ: estilo limpio (sin iconos decorativos)
- Quitar `<mat-icon class="question-icon">help_center</mat-icon>` y `<mat-icon class="answer-icon">lightbulb_outline</mat-icon>`.
- Borde fino `var(--color-border)`, `border-radius: var(--radius-md)`, padding `var(--space-4) var(--space-5)`.
- Icono `+` que rota a `×` al expandir (CSS-only).

#### P2.7 — Header: dropdown servicios con tokens + microinteracción
- Reemplazar colores hardcoded por tokens.
- `transform: translateY(-4px) → 0` con `transition: transform var(--dur-base)`.
- `box-shadow: var(--shadow-md)`.

---

### 🟦 P3 — Nice-to-have

- P3.1 — `loading="lazy"` en imágenes de cards (excepto LCP).
- P3.2 — Skeleton loader reutilizable `<ngx-card-skeleton>` para "Añadidos Recientemente" mientras carga.
- P3.3 — Animación sutil de scale en hover de avatares (social proof).
- P3.4 — Reducir/eliminar `.animated-folders` en hero (impacto LCP). Ya tienes `@media (max-width: 767px)` que las desactiva → extender a desktop también o reducir cantidad a 3.
- P3.5 — Footer: añadir mini-formulario de newsletter (1 input + 1 botón).
- P3.6 — Header: dot rojo de notificación sobre el carrito si hay items.

---

## I. Secciones extra (P3) — listados de productos

Cuatro secciones nuevas en el home, todas reutilizando `<ngx-section-header>` + `<ngx-product-card>` + grid/carrousel responsive (P2.4). Mismo patrón visual, solo cambia el dataset y el endpoint.

**Orden propuesto en el home:**
1. Hero
2. Servicios (grid de iconos)
3. **Añadidos Recientemente** (P3.A)
4. **Los más populares** (P3.B)
5. **Los más vendidos** (P3.C)
6. **Descargas gratis** (P3.D)
7. FAQ
8. CTA banner (`<ngx-cta-banner>`)
9. Footer

### P3.A — Añadidos Recientemente
- Endpoint: `documents?sort=createdAt,desc&limit=8`
- Card variant: `default` (imagen + badge nivel + precio + add-to-cart).
- Header: "Añadidos Recientemente" / "Nuevos materiales educativos frescos cada semana." / `Ver todos →` → `/site/categorias?sort=recent`.

### P3.B — Los más populares
- Endpoint: `documents?sort=rating,desc&limit=6`
- Card variant: `compact-horizontal` (imagen pequeña a la izquierda, título + rating + precio a la derecha). Distinta a `<ngx-product-card>` default → segundo modo `[variant]="'horizontal'"`.
- Header: "Los más populares" / "Los preferidos por miles de docentes." / `Ver todos →` → `/site/categorias?sort=popular`.
- Grid: 3 cols desktop / 1 col mobile.

### P3.C — Los más vendidos
- Endpoint: `documents?sort=salesCount,desc&limit=8`
- Card variant: `default` igual que Recientes pero con badge `🔥 Top ventas`.
- Header: "Los más vendidos" / "Lo que están comprando otros docentes ahora." / `Ver todos →` → `/site/categorias?sort=bestsellers`.

### P3.D — Descargas gratis
- Endpoint: `documents?price=0&limit=8`
- Card variant: `default` con badge verde `GRATIS` reemplazando precio.
- Header: "Descargas gratis" / "Material de cortesía para que pruebes la calidad." / `Ver todos →` → `/site/categorias/MATERIAL_GRATIS`.

### Componentes/inputs adicionales necesarios
- `<ngx-product-card>` extiende con `[variant]="'default' | 'horizontal'"` y `[badge]="{ label, color }"`.
- Servicio nuevo (o método nuevo en `DocumentData`): `getRecent()`, `getPopular()`, `getBestsellers()`, `getFreebies()`. **Verificar si ya existen** antes de crear duplicados.
- En `home.component.ts`: 4 signals (`recentDocs`, `popularDocs`, `bestsellerDocs`, `freebieDocs`) cargadas en paralelo con `forkJoin` al `ngOnInit`.

### Avatares social proof (P2.5)
Crear 3 SVG genéricos en `src/assets/images/avatars/`:
```
placeholder-1.svg  → silueta sobre fondo var(--color-brand-100)
placeholder-2.svg  → silueta sobre fondo var(--color-success-100)
placeholder-3.svg  → silueta sobre fondo var(--color-warning-100)
```
Tamaño: 40×40 viewBox, render circular vía CSS `border-radius: var(--radius-pill)`.

---

## C. Patrones extraíbles al design system

| Patrón | Ubicación propuesta | Reemplaza |
|---|---|---|
| `<ngx-section-header>` | `shared/component/section-header/` | Headers manuales en home, categorías, etc. |
| `<ngx-product-card>` | `shared/component/product-card/` | Variante "comercial" del `card` actual |
| `<ngx-cta-banner>` | `shared/component/cta-banner/` | Banners de conversión (home, fin de listados) |
| `<ngx-social-proof>` | `shared/component/social-proof/` | Reusable en landing pages |
| Mixin `@mixin focusable` | `shared/styles/_mixins.scss` | DRY del focus-visible (header, footer, cards) |
| Mixin `@mixin section-padding` | `shared/styles/_mixins.scss` | Padding vertical consistente entre secciones |

**Tokens NUEVOS sugeridos** (añadir a [_tokens.scss](src/app/shared/styles/_tokens.scss)):
- `--container-max: 1280px;`
- `--container-padding-x: var(--space-5);`
- `--section-padding-y: clamp(var(--space-6), 6vw, var(--space-9));`

---

## D. Desviaciones vs el repo actual

| Elemento | Actual | Token correcto |
|---|---|---|
| Header `#0C52D4` | hardcoded | `var(--color-primary)` |
| Header `#11B0F2` | hardcoded | `var(--color-primary-hover)` o `var(--color-brand-300)` |
| Hero `#0150b9` → `#0139a0` | gradient hardcoded | gradient con `var(--color-brand-700/500)` |
| Footer `#333` / `#555` | hardcoded | `var(--color-text)` / `var(--color-text-muted)` |
| Footer `#007aff` | hardcoded | `var(--color-primary)` |
| Spacings `1rem`, `0.5rem`, `2rem` ad-hoc | mezclados | `var(--space-3/4/5/6)` |
| Border-radius `0.5rem`, `0.25rem` | mezclados | `var(--radius-sm/xs)` |
| Box-shadow `0 4px 12px rgba(0,0,0,0.15)` | repetido | `var(--shadow-md)` |
| `transition: all 0.3s ease` | genérico | `transition: <prop> var(--dur-base) var(--ease-standard)` |

**Acción transversal:** crear regla lint (stylelint plugin `declaration-strict-value`) para impedir colores literales en `header/`, `footer/`, `home/`. (P3, opcional)

---

## E. Responsive audit

| Breakpoint | Hero | Servicios | Recientes | Footer | Notas |
|---|---|---|---|---|---|
| **320px** | Stack vertical, título 28px (`clamp`), search full-width, badge "Éxito" oculta o reposicionada | 2 cols | Carrousel 1 card visible | 1 col | Tap targets ≥44px obligatorio |
| **600px** | Stack, título 32px, imagen visible | 2 cols | Carrousel 1.5 visible | 2 cols | |
| **768px** | Texto + imagen lado a lado al 50/50 | 3 cols | **Cambia** carrousel→grid 2 cols (o mantener carrousel hasta 992px, decisión) | 2 cols | Punto de quiebre principal |
| **1024px** | Texto 55% + imagen 45%, search inline + botón | 4 cols | Grid 3 cols | 4 cols | |
| **1280px** | Igual | 5 cols | Grid 4 cols | 4 cols | |
| **1440px+** | Container max 1280px centrado | 5 cols | Grid 4 cols | 4 cols | Evitar líneas de texto >75ch |

**Reglas globales propuestas:**
- Mobile-first: todas las media queries con `min-width`.
- Tipografía fluida: `clamp(min, ideal, max)` para `h1`, `h2`, `lead`.
- Imágenes de hero ya usan `<picture srcset>` ✅, mantener.
- Modal cart ya tiene su propio responsive (no toca este plan).
- `@media (prefers-reduced-motion: reduce)` ya cubierto en home, **replicar en cta-banner y product-card**.

---

## F. Plan de ejecución por fases

### Fase 0 — Preparación (sin tocar UI)
1. Confirmar import de `_tokens.scss` en `src/styles.scss` global. Si falta → añadir.
2. Crear `src/app/shared/styles/_mixins.scss` con `@mixin focusable` y `@mixin section-padding`.

### Fase 1 — P1 (foundation)
3. Refactor `header.component.scss` → tokens + sticky + focus.
4. Refactor `footer.component.scss` → tokens + grid + barra copyright.
5. Crear partials de `home/` y mover bloques actuales tal cual (sin cambios visuales todavía).
6. Aplicar P1.5/P1.6/P1.7 en hero + servicios.

### Fase 2 — P2 (componentes shared)
7. Crear `<ngx-section-header>`, `<ngx-product-card>`, `<ngx-cta-banner>`.
8. Reemplazar bloques en `home.component.html`.
9. Implementar grid+carrousel responsive en "Recientes".
10. Restilizar FAQ.

### Fase 3 — P3 (pulido + secciones extra)
11. Skeleton loaders.
12. Newsletter footer (si aplica).
13. Reducir animaciones de carpetas en hero.
14. Crear avatares SVG genéricos + activar social proof (P2.5).
15. Implementar las 4 secciones de listados (§I): Recientes, Populares, Más vendidos, Gratis.
16. Extender `<ngx-product-card>` con `variant` + `badge`.

### Fase 4 — Validación
14. `npm run build` — sin errores TS/SCSS.
15. Lighthouse local: comparar before/after (LCP, CLS, accesibilidad).
16. Test manual breakpoints: 320, 600, 768, 1024, 1280, 1440.
17. Test dark mode toggle.
18. `npm test` para componentes shared nuevos.

---

## G. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Romper estilos en otras páginas que usan `<ngx-card>` | `<ngx-product-card>` es **componente nuevo**; `<ngx-card>` queda intacto |
| `header.component.scss` afecta layout admin/promotor | Cambios solo en colores y `position: sticky`; comportamiento `sidebar-toggle-*` se preserva |
| Dark mode roto al cambiar a tokens | Tokens ya tienen variantes implícitas; verificar `partials/dark-mode.scss` y añadir overrides necesarios |
| Imágenes nuevas (avatares social proof) inexistentes | Usar placeholders SVG genéricos hasta tener assets reales |
| Build falla por SCSS de partials no encontrados | Crear archivos vacíos primero, luego mover contenido |

---

## H. Checklist para activar ejecución

Cuando confirmes con uno de estos, aplico:
- `aplica P1` → solo críticos (Fase 0 + 1)
- `aplica P1+P2` → críticos + componentes shared (Fase 0 + 1 + 2)
- `aplica todo` → todo (Fases 0-4)
- `aplica P1.X` → propuesta individual

**Decisiones confirmadas:**
- ✅ Avatares: **placeholders SVG genéricos** (silueta neutra, 3 variantes de color) en `src/assets/images/avatars/placeholder-{1,2,3}.svg`.
- ✅ `<ngx-cta-banner>` va **después del FAQ** (antes del footer).
- ✅ Secciones extra entran como **P3**: `Añadidos Recientemente`, `Los más populares`, `Los más vendidos`, `Descargas gratis` (ver §I).
