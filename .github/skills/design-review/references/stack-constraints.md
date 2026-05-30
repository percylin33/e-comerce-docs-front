# Stack Constraints — `e-comerce-docs-front`

Reglas duras del stack. La skill **NO** debe proponer nada que viole esto.

## Stack confirmado
- **Angular + TypeScript + Angular Material + Nebular** — versiones exactas: leer **`package.json`** del front (no fijar major en la skill).
- Standalone components, signals cuando aplique, control flow `@if`/`@for`.
- **Angular Material** — muchos símbolos son **standalone** (`MatButton`, `MatFormField`, etc.); si el código usa `*Module`, no forzar migración en un design review salvo P1.
- **Nebular** — módulos típicos: `NbCardModule`, `NbButtonModule`, `NbAccordionModule`, `NbIconModule`, etc.
- **Eva Icons** + **Material Icons** + **Font Awesome** (según registro en la app).
- **SCSS** (no Tailwind, no styled-components).
- **RxJS** con `pipe(map, takeUntil, shareReplay)` según patrones del repo.
- **`LOCALE_ID` y pipes de i18n** — respetar lo configurado en `main.ts` / `app.config.ts` del proyecto (no cambiar en un review salvo petición explícita).

## Componentes/módulos preferidos por caso de uso

| Necesidad | Usar | NO usar |
|-----------|------|---------|
| Botón primario | `<button nbButton status="primary">` o `<button mat-raised-button color="primary">` | `<button class="my-btn">` |
| Botón con icono | `<button nbButton><nb-icon icon="..."></nb-icon></button>` | `<a class="icon-link">` |
| Card básica | `<nb-card>` o `<ngx-card>` (si es de producto) | `<div class="card">` |
| Modal/Dialog | `MatDialog` (`MatDialogModule`) | overlays manuales |
| Form input | `MatFormFieldModule` + `MatInputModule` | `<input class="form-control">` |
| Table | `MatTableModule` + `MatPaginatorModule` | `<table>` plano |
| Acordeón | `NbAccordionModule` | `<details>` |
| Spinner | `MatProgressSpinnerModule` o `NbSpinnerModule` | spinners CSS custom |
| Toast | `NbToastrService` | `alert()` |
| Iconos Material | `<mat-icon>name</mat-icon>` | `<i class="material-icons">` |
| Iconos Eva | `<nb-icon icon="..." pack="eva">` | -- |
| Iconos Font Awesome | `<nb-icon icon="..." pack="font-awesome">` | `<i class="fa fa-...">` |

## Imports Material / Nebular

Estos símbolos NO son standalone — requieren su `*Module`:
- `MatFormField`, `MatLabel`, `MatError`, `MatHint` → `MatFormFieldModule`
- `MatInput` → `MatInputModule`
- `MatTable`, `MatHeaderCell`, `MatCell`, etc. → `MatTableModule`
- `MatPaginator` → `MatPaginatorModule`
- `MatCheckbox` → `MatCheckboxModule`
- `MatProgressSpinner` → `MatProgressSpinnerModule`
- `MatDialogTitle`, `MatDialogContent`, `MatDialogActions` → `MatDialogModule` (estos sí son standalone individualmente desde v17)

Estos SÍ son standalone:
- `MatButton`, `MatIconButton`, `MatRaisedButton` → desde `MatButtonModule` (preferir Module igual)
- `MatIcon` → desde `MatIconModule`

**Regla de oro**: importar siempre los `*Module` para evitar errores en runtime.

## Patrones del repo (convenciones existentes)

- Servicios: `inject(Service)` en lugar de DI por constructor.
- Standalone obligatorio: `standalone: true` en todos los componentes nuevos/migrados.
- ChangeDetection: `ChangeDetectionStrategy.OnPush` por defecto.
- Naming: `ngx-*` para selectors de componentes propios (legacy del template Akveo).
- Formularios: Reactive Forms (`FormBuilder`, `FormGroup`).
- HTTP: `HttpService` wrapper en `@core/backend/api/`.
- Auth: JWT + `SharedService` (`isAuthenticated$`, `user$` BehaviorSubjects).
- Pagos: NO modificar metadata mínima de Culqi.

## Anti-patrones detectados en el repo (a corregir cuando se vean)
- ❌ Estilos inline largos en HTML (ej. `style="background:#002366;border-radius:7px;..."`).
- ❌ `!important` para overrides de Nebular sin documentar.
- ❌ Colores hardcoded en SCSS (`#7ec3ff`) en vez de tokens.
- ❌ Mezcla de control flow viejo (`*ngIf`) con nuevo (`@if`) en el mismo template.
- ❌ Selectores `::ng-deep` sin scope (`:host ::ng-deep`).
