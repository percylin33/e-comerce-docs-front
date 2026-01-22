# Plan de Alineación de Filtros por Categoría

## 📋 Resumen de Requerimientos

### Grupo 1: Filtros en Carta - Nivel y Materia
**Categorías:** KITS, SESIONES (display KITS), REFORZAMIENTO, PLAN_LECTOR, EVALUACION

**Comportamiento:**
- ✅ Mostrar filtros en **carta** de nivel Y materia
- ✅ Si URL trae `nivel` → NO mostrar carta de nivel (ya seleccionado)
- ✅ Si URL trae `materia` → NO mostrar ninguna carta (nivel + materia ya seleccionados)
- ✅ Selects (dropdowns) siempre sincronizados con URL

### Grupo 2: Filtro en Carta - Solo Nivel
**Categorías:** ESTRATEGIAS, RECURSOS

**Comportamiento:**
- ✅ Mostrar solo filtro en **carta** de nivel
- ✅ Si URL trae `nivel` → NO mostrar carta (ya seleccionado)
- ✅ Selects sincronizados con URL

### Grupo 3: Sin Filtros en Carta
**Categorías:** EBOOKS, TALLERES, MATERIAL_GRATIS

**Comportamiento:**
- ✅ NO mostrar filtros en carta
- ✅ Solo mostrar documentos directamente
- ✅ Selects sincronizados con URL

---

## 🎯 Objetivos del Plan

1. **Determinar visibilidad de cartas** según categoría y parámetros URL
2. **Sincronizar selects** con valores de URL al cargar
3. **Mantener coherencia** entre cartas y selects
4. **Centralizar lógica** en servicio reutilizable

---

## 🏗️ Arquitectura Propuesta

### 1. Nuevo Servicio: `FilterVisibilityService`

```typescript
interface FilterVisibilityConfig {
  // Qué filtros en carta debe mostrar la categoría
  showNivelCard: boolean;
  showMateriaCard: boolean;
  showGradoCard: boolean;
  
  // Qué filtros en select debe mostrar
  showNivelSelect: boolean;
  showMateriaSelect: boolean;
  showGradoSelect: boolean;
  
  // Si requiere nivel/materia obligatorio
  requiresNivel: boolean;
  requiresMateria: boolean;
  requiresGrado: boolean;
}

interface FilterVisibilityState {
  // Estado actual de visibilidad (considera URL)
  shouldShowNivelCard: boolean;
  shouldShowMateriaCard: boolean;
  shouldShowGradoCard: boolean;
  
  // Valores precargados desde URL
  preselectedNivel?: string;
  preselectedMateria?: string;
  preselectedGrado?: string;
}
```

**Responsabilidades:**
- Definir configuración por categoría
- Calcular visibilidad según URL params
- Determinar qué paso mostrar inicialmente
- Gestionar transiciones entre pasos

---

## 📐 Reglas de Visibilidad por Categoría

### Grupo 1: KITS, REFORZAMIENTO, PLAN_LECTOR, EVALUACION

```typescript
{
  categoria: 'KITS',
  config: {
    showNivelCard: true,
    showMateriaCard: true,
    showGradoCard: false, // Grado solo en select
    requiresNivel: true,
    requiresMateria: true,
    requiresGrado: false
  },
  rules: [
    // Regla 1: Si viene nivel + materia en URL → NO mostrar cartas
    {
      condition: (url) => url.has('nivel') && url.has('materia'),
      result: {
        shouldShowNivelCard: false,
        shouldShowMateriaCard: false,
        initialStep: 'documentos'
      }
    },
    // Regla 2: Si viene solo nivel en URL → NO mostrar carta de nivel
    {
      condition: (url) => url.has('nivel') && !url.has('materia'),
      result: {
        shouldShowNivelCard: false,
        shouldShowMateriaCard: true,
        initialStep: 'materias'
      }
    },
    // Regla 3: Sin parámetros URL → Mostrar carta de nivel
    {
      condition: (url) => !url.has('nivel'),
      result: {
        shouldShowNivelCard: true,
        shouldShowMateriaCard: false,
        initialStep: 'niveles'
      }
    }
  ]
}
```

### Grupo 2: ESTRATEGIAS, RECURSOS

```typescript
{
  categoria: 'ESTRATEGIAS',
  config: {
    showNivelCard: true,
    showMateriaCard: false, // Solo nivel
    showGradoCard: false,
    requiresNivel: true,
    requiresMateria: false,
    requiresGrado: false
  },
  rules: [
    // Regla 1: Si viene nivel en URL → NO mostrar carta
    {
      condition: (url) => url.has('nivel'),
      result: {
        shouldShowNivelCard: false,
        initialStep: 'documentos'
      }
    },
    // Regla 2: Sin nivel en URL → Mostrar carta
    {
      condition: (url) => !url.has('nivel'),
      result: {
        shouldShowNivelCard: true,
        initialStep: 'niveles'
      }
    }
  ]
}
```

### Grupo 3: EBOOKS, TALLERES, MATERIAL_GRATIS

```typescript
{
  categoria: 'EBOOKS',
  config: {
    showNivelCard: false, // Sin cartas
    showMateriaCard: false,
    showGradoCard: false,
    requiresNivel: false,
    requiresMateria: false,
    requiresGrado: false
  },
  rules: [
    // Regla única: Siempre mostrar documentos
    {
      condition: () => true,
      result: {
        shouldShowNivelCard: false,
        shouldShowMateriaCard: false,
        initialStep: 'documentos'
      }
    }
  ]
}
```

---

## 🔄 Flujo de Inicialización

### 1. Al cargar la página (`ngOnInit`)

```typescript
// 1. Leer parámetros de URL
const urlParams = this.route.snapshot.queryParams;

// 2. Consultar servicio de visibilidad
const visibility = this.filterVisibility.calculateVisibility(
  this.categoriaActual,
  urlParams
);

// 3. Aplicar configuración
this.shouldShowNivelCard = visibility.shouldShowNivelCard;
this.shouldShowMateriaCard = visibility.shouldShowMateriaCard;
this.currentStep = visibility.initialStep;

// 4. Pre-cargar selects con valores de URL
if (visibility.preselectedNivel) {
  this.selectedNivel = visibility.preselectedNivel;
  this.materias = this.config.getMaterias(visibility.preselectedNivel, this.categoriaActual);
}

if (visibility.preselectedMateria) {
  this.selectedMateria = visibility.preselectedMateria;
  this.grados = this.config.getGrados(
    visibility.preselectedNivel, 
    visibility.preselectedMateria, 
    this.categoriaActual
  );
}

if (visibility.preselectedGrado) {
  this.selectedGrado = visibility.preselectedGrado;
}

// 5. Cargar documentos si corresponde
if (visibility.initialStep === 'documentos') {
  this.loadInitialDocuments();
}
```

### 2. Al cambiar de categoría

```typescript
onCategoriaChange(newCategoria: Categoria): void {
  // 1. Actualizar categoría actual
  this.categoriaActual = newCategoria;
  
  // 2. Resetear filtros
  this.resetSelections();
  
  // 3. Limpiar URL (no hay filtros aún)
  this.router.navigate([], { queryParams: {} });
  
  // 4. Recalcular visibilidad (sin params URL)
  const visibility = this.filterVisibility.calculateVisibility(
    newCategoria,
    {} // Sin parámetros
  );
  
  // 5. Aplicar nueva configuración
  this.applyVisibilityConfig(visibility);
  
  // 6. Cargar datos según paso inicial
  if (visibility.initialStep === 'documentos') {
    this.loadInitialDocuments();
  }
}
```

---

## 🎨 Template - Visibilidad de Cartas

### Antes (Actual)
```html
<!-- Cartas siempre visibles según categoría hardcodeada -->
<div *ngIf="currentStep === 'niveles'">
  <app-nivel-card></app-nivel-card>
</div>

<div *ngIf="currentStep === 'materias'">
  <app-materia-card></app-materia-card>
</div>
```

### Después (Propuesto)
```html
<!-- Carta de nivel: solo si debe mostrarse Y estamos en paso niveles -->
<div *ngIf="shouldShowNivelCard && currentStep === 'niveles'">
  <app-nivel-card
    [niveles]="niveles"
    (nivelSelected)="onNivelSelect($event)">
  </app-nivel-card>
</div>

<!-- Carta de materia: solo si debe mostrarse Y estamos en paso materias -->
<div *ngIf="shouldShowMateriaCard && currentStep === 'materias'">
  <app-materia-card
    [materias]="materias"
    (materiaSelected)="onMateriaSelect($event)">
  </app-materia-card>
</div>

<!-- Documentos: cuando estamos en paso documentos -->
<div *ngIf="currentStep === 'documentos'">
  <app-document-list [documents]="ducumentList"></app-document-list>
</div>
```

---

## 🔧 Implementación Paso a Paso

### Paso 1: Crear FilterVisibilityService

**Archivo:** `services/filter-visibility.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class FilterVisibilityService {
  
  // Configuración por categoría
  private readonly categoryConfigs: Map<Categoria, FilterVisibilityConfig>;
  
  constructor() {
    this.initializeConfigs();
  }
  
  /**
   * Calcula la visibilidad de filtros según categoría y URL
   */
  calculateVisibility(
    categoria: Categoria,
    urlParams: Params
  ): FilterVisibilityState {
    const config = this.categoryConfigs.get(categoria);
    const hasNivel = !!urlParams['nivel'];
    const hasMateria = !!urlParams['materia'];
    const hasGrado = !!urlParams['grado'];
    
    // Aplicar reglas según categoría
    return this.applyRules(config, urlParams, {
      hasNivel,
      hasMateria,
      hasGrado
    });
  }
  
  /**
   * Determina el paso inicial según visibilidad
   */
  getInitialStep(visibility: FilterVisibilityState): CurrentStep {
    if (visibility.shouldShowNivelCard) return 'niveles';
    if (visibility.shouldShowMateriaCard) return 'materias';
    return 'documentos';
  }
  
  /**
   * Verifica si la categoría requiere mostrar cartas
   */
  shouldShowCards(categoria: Categoria): boolean {
    const config = this.categoryConfigs.get(categoria);
    return config.showNivelCard || config.showMateriaCard;
  }
}
```

### Paso 2: Integrar en Componente

**Modificar:** `categorias.component.ts`

```typescript
export class CategoriasComponent implements OnInit {
  
  // Nuevas propiedades
  shouldShowNivelCard = false;
  shouldShowMateriaCard = false;
  shouldShowGradoCard = false;
  
  constructor(
    // ... servicios existentes
    private filterVisibility: FilterVisibilityService
  ) {}
  
  ngOnInit(): void {
    this.initializeRouteSubscriptions();
    this.initializeFilterVisibility(); // NUEVO
    this.subscribeToFilterChanges();
    this.subscribeToStateMachine();
  }
  
  /**
   * Inicializa visibilidad de filtros desde URL
   */
  private initializeFilterVisibility(): void {
    const urlParams = this.route.snapshot.queryParams;
    
    const visibility = this.filterVisibility.calculateVisibility(
      this.categoriaActual,
      urlParams
    );
    
    this.applyVisibilityConfig(visibility);
    this.preselectFiltersFromUrl(visibility);
  }
  
  /**
   * Aplica configuración de visibilidad
   */
  private applyVisibilityConfig(visibility: FilterVisibilityState): void {
    this.shouldShowNivelCard = visibility.shouldShowNivelCard;
    this.shouldShowMateriaCard = visibility.shouldShowMateriaCard;
    this.shouldShowGradoCard = visibility.shouldShowGradoCard;
    this.currentStep = this.filterVisibility.getInitialStep(visibility);
  }
  
  /**
   * Pre-selecciona filtros desde URL
   */
  private preselectFiltersFromUrl(visibility: FilterVisibilityState): void {
    if (visibility.preselectedNivel) {
      this.selectedNivel = visibility.preselectedNivel;
      this.materias = this.config.getMaterias(
        visibility.preselectedNivel, 
        this.categoriaActual
      );
    }
    
    if (visibility.preselectedMateria) {
      this.selectedMateria = visibility.preselectedMateria;
      this.grados = this.config.getGrados(
        visibility.preselectedNivel,
        visibility.preselectedMateria,
        this.categoriaActual
      );
    }
    
    if (visibility.preselectedGrado) {
      this.selectedGrado = visibility.preselectedGrado;
    }
  }
}
```

### Paso 3: Actualizar Template

**Modificar:** `categorias.component.html`

```html
<!-- ANTES: Lógica compleja en template -->
<div *ngIf="currentStep === 'niveles' && someComplexCondition">

<!-- DESPUÉS: Lógica simple basada en propiedades -->
<div *ngIf="shouldShowNivelCard && currentStep === 'niveles'">
  <!-- Carta de nivel -->
</div>

<div *ngIf="shouldShowMateriaCard && currentStep === 'materias'">
  <!-- Carta de materia -->
</div>
```

### Paso 4: Tests

**Archivo:** `services/filter-visibility.service.spec.ts`

```typescript
describe('FilterVisibilityService - Grupo 1: KITS, REFORZAMIENTO, etc.', () => {
  
  it('debe mostrar carta nivel cuando URL sin parámetros', () => {
    const visibility = service.calculateVisibility('KITS', {});
    expect(visibility.shouldShowNivelCard).toBe(true);
    expect(visibility.shouldShowMateriaCard).toBe(false);
  });
  
  it('debe ocultar carta nivel cuando URL trae nivel', () => {
    const visibility = service.calculateVisibility('KITS', { nivel: 'PRIMARIA' });
    expect(visibility.shouldShowNivelCard).toBe(false);
    expect(visibility.shouldShowMateriaCard).toBe(true);
  });
  
  it('debe ocultar todas las cartas cuando URL trae nivel + materia', () => {
    const visibility = service.calculateVisibility('KITS', { 
      nivel: 'PRIMARIA', 
      materia: 'MATEMATICA' 
    });
    expect(visibility.shouldShowNivelCard).toBe(false);
    expect(visibility.shouldShowMateriaCard).toBe(false);
  });
});

describe('FilterVisibilityService - Grupo 2: ESTRATEGIAS, RECURSOS', () => {
  
  it('debe mostrar solo carta nivel cuando URL sin parámetros', () => {
    const visibility = service.calculateVisibility('ESTRATEGIAS', {});
    expect(visibility.shouldShowNivelCard).toBe(true);
    expect(visibility.shouldShowMateriaCard).toBe(false);
  });
  
  it('debe ocultar carta cuando URL trae nivel', () => {
    const visibility = service.calculateVisibility('ESTRATEGIAS', { nivel: 'PRIMARIA' });
    expect(visibility.shouldShowNivelCard).toBe(false);
  });
});

describe('FilterVisibilityService - Grupo 3: EBOOKS, TALLERES, MATERIAL_GRATIS', () => {
  
  it('nunca debe mostrar cartas', () => {
    const visibility = service.calculateVisibility('EBOOKS', {});
    expect(visibility.shouldShowNivelCard).toBe(false);
    expect(visibility.shouldShowMateriaCard).toBe(false);
  });
  
  it('siempre debe ir directo a documentos', () => {
    const step = service.getInitialStep(service.calculateVisibility('MATERIAL_GRATIS', {}));
    expect(step).toBe('documentos');
  });
});
```

---

## 📊 Matriz de Comportamiento

| Categoría | URL vacía | URL con nivel | URL con nivel+materia | Cartas iniciales |
|-----------|-----------|---------------|----------------------|------------------|
| **KITS** | Carta Nivel | Carta Materia | Documentos | Nivel, Materia |
| **REFORZAMIENTO** | Carta Nivel | Carta Materia | Documentos | Nivel, Materia |
| **PLAN_LECTOR** | Carta Nivel | Carta Materia | Documentos | Nivel, Materia |
| **EVALUACION** | Carta Nivel | Carta Materia | Documentos | Nivel, Materia |
| **ESTRATEGIAS** | Carta Nivel | Documentos | Documentos | Solo Nivel |
| **RECURSOS** | Carta Nivel | Documentos | Documentos | Solo Nivel |
| **EBOOKS** | Documentos | Documentos | Documentos | Ninguna |
| **TALLERES** | Documentos | Documentos | Documentos | Ninguna |
| **MATERIAL_GRATIS** | Documentos | Documentos | Documentos | Ninguna |

---

## ✅ Checklist de Implementación

### Fase 1: Servicio Base (2-3 horas)
- [ ] Crear `FilterVisibilityService`
- [ ] Definir interfaces `FilterVisibilityConfig` y `FilterVisibilityState`
- [ ] Implementar configuraciones por categoría (9 categorías)
- [ ] Implementar método `calculateVisibility()`
- [ ] Implementar método `getInitialStep()`
- [ ] Escribir tests unitarios (30+ tests)

### Fase 2: Integración Componente (2 horas)
- [ ] Inyectar `FilterVisibilityService` en constructor
- [ ] Agregar propiedades `shouldShowNivelCard`, `shouldShowMateriaCard`, `shouldShowGradoCard`
- [ ] Crear método `initializeFilterVisibility()`
- [ ] Crear método `applyVisibilityConfig()`
- [ ] Crear método `preselectFiltersFromUrl()`
- [ ] Modificar `onCategoriaChange()` para recalcular visibilidad
- [ ] Modificar `handleQueryParams()` para usar nuevo servicio

### Fase 3: Template Updates (1 hora)
- [ ] Actualizar `*ngIf` de cartas con `shouldShowNivelCard`
- [ ] Actualizar `*ngIf` de cartas con `shouldShowMateriaCard`
- [ ] Simplificar lógica condicional en template
- [ ] Verificar que selects siempre estén visibles

### Fase 4: Testing & Validación (2 horas)
- [ ] Test E2E: KITS sin URL → Carta Nivel
- [ ] Test E2E: KITS con nivel → Carta Materia
- [ ] Test E2E: KITS con nivel+materia → Documentos
- [ ] Test E2E: ESTRATEGIAS sin URL → Carta Nivel
- [ ] Test E2E: ESTRATEGIAS con nivel → Documentos
- [ ] Test E2E: EBOOKS → Siempre Documentos
- [ ] Verificar sincronización URL ↔ Selects en todos los casos
- [ ] Verificar navegación entre categorías

### Fase 5: Documentación (30 min)
- [ ] Actualizar README con nuevas reglas
- [ ] Documentar configuración por categoría
- [ ] Agregar ejemplos de URLs y comportamiento esperado

---

## 🎯 Beneficios Esperados

1. **Claridad:** Reglas explícitas por categoría en un solo lugar
2. **Mantenibilidad:** Fácil agregar nuevas categorías o cambiar reglas
3. **Testabilidad:** Lógica aislada con tests exhaustivos
4. **UX Mejorada:** Filtros solo cuando son necesarios
5. **Reducción de Código:** ~80-100 líneas menos en componente

---

## 📈 Impacto en Reducción de Líneas

- **Componente:** -80 a -100 líneas (lógica condicional simplificada)
- **Servicio nuevo:** +180 líneas (FilterVisibilityService)
- **Tests:** +250 líneas (cobertura completa)
- **Neto componente:** -80 líneas
- **Total arquitectura:** +350 líneas (bien distribuidas y testeadas)

---

## 🚀 Próximos Pasos Recomendados

1. ✅ **Revisar y aprobar este plan**
2. Implementar `FilterVisibilityService`
3. Integrar en componente
4. Actualizar template
5. Testing exhaustivo
6. Deploy y validación con usuarios

---

## 📝 Notas Adicionales

- **Compatibilidad:** Se mantiene retrocompatibilidad con URLs existentes
- **State Machine:** FilterVisibilityService se integra con CategoryStateMachineService
- **Performance:** Cálculo de visibilidad es O(1), sin impacto en rendimiento
- **Extensibilidad:** Fácil agregar nuevas reglas o categorías en el futuro
