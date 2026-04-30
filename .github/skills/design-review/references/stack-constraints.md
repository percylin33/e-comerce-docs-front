# Stack Constraints — `e-comerce-docs-front`

Reglas duras del stack. La skill **NO** debe proponer nada que viole esto.

## Stack confirmado
- **Angular 18.2** (standalone components, signals, control flow `@if`/`@for`).
- **TypeScript 5.5** strict mode (`strictPropertyInitialization`, `strictNullChecks`).
- **Angular Material 18.2** — usar `*Module` para tabla, paginator, form-field, input, etc.
- **Nebular 14** — `NbCardModule`, `NbButtonModule`, `NbAccordionModule`, `NbIconModule`, etc.
- **Eva Icons** + **Material Icons** + **Font Awesome** (registrados en `AppComponent`).
- **SCSS** (no Tailwind, no styled-components).
- **RxJS 7+** con `pipe(map, takeUntil, shareReplay)`.
- **LOCALE_ID = `es-PE`** (registrado en `main.ts`).

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

## Imports standalone obligatorios (Material v18)

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
