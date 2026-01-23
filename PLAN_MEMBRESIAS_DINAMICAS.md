# 📋 PLAN COMPLETO: MIGRACIÓN DE MEMBRESÍAS ESTÁTICAS A DINÁMICAS

**Fecha:** 9 de Enero, 2026 (Actualizado: 10 de Enero, 2026)  
**Objetivo:** Convertir toda la data hardcodeada de membresías en `membresia.component.ts` a data dinámica administrable desde el dashboard por el SUPER_ADMIN.

---

## 🎨 NUEVO DISEÑO REQUERIDO

### **Vista Frontend - Agrupación por Niveles**

**Diseño solicitado:**
```
┌─────────────────────────────────────────────────────────────┐
│        Elige el plan perfecto para tu aula                  │
│                                                              │
│   [Secundaria] [Primaria] [Inicial]  ← Toggle buttons       │
│                                                              │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│   │PLAN BÁSICO  │  │PLAN PREMIUM │  │ PLAN MAX +  │       │
│   │S/ 20.00     │  │🔥MÁS VENDIDO│  │ Pago Anual  │       │
│   │por unidad   │  │S/ 30.00     │  │             │       │
│   │             │  │por unidad   │  │             │       │
│   │- Beneficio 1│  │- Beneficio 1│  │- Beneficio 1│       │
│   │- Beneficio 2│  │- Beneficio 2│  │- Beneficio 2│       │
│   └─────────────┘  └─────────────┘  └─────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

**Funcionalidad:**
1. ✅ **Toggle de Niveles:** Botones para filtrar por INICIAL / PRIMARIA / SECUNDARIA
2. ✅ **Cards Dinámicas:** Mostrar solo las membresías del nivel seleccionado
3. ✅ **Badge "MÁS VENDIDO":** Resaltar plan más popular
4. ❌ **NO incluir select de área** (se mantiene en membresia-detail)

### **Nueva Estructura de Datos Requerida:**

**Campo adicional en SubscriptionType:**
```java
@Column(name = "nivel", length = 20)
private String nivel; // "INICIAL", "PRIMARIA", "SECUNDARIA", "TODOS"
```

**Migration SQL adicional:**
```sql
ALTER TABLE subscription_types 
ADD COLUMN IF NOT EXISTS nivel VARCHAR(20) DEFAULT 'TODOS';

-- Actualizar membresías existentes
UPDATE subscription_types SET nivel = 'INICIAL' WHERE id = 1;
UPDATE subscription_types SET nivel = 'SECUNDARIA' WHERE id IN (3, 4);
```

---

## 📊 ANÁLISIS DEL ESTADO ACTUAL

### ✅ **Lo que YA existe (Backend):**
```
✓ Entidad SubscriptionType (id, nombre, descripcion)
✓ Entidad Materia (nombre, muestra, afiche, beneficios)
✓ Entidad Opcion (nombre, antes, ahora, exclusivo, posicion)
✓ Endpoint GET /api/v1/subscription-type (lista todas)
✓ Endpoint GET /api/v1/subscription-type/{id} (detalle completo)
✓ Endpoint POST /api/v1/subscription-type (crear)
✓ Endpoint GET /api/v1/subscription-type/title/{id} (títulos)
```

### ❌ **Lo que FALTA:**

#### **Backend (Java):**
1. **Campos adicionales en SubscriptionType:**
   - `textoDescuento` (String) → "Ahora 28% de descuento"
   - `textoPrecio` (String) → "Desde S/.45/mes*"
   - `notaPrecio` (String) → "Los precios varían según..."
   - `esRecomendada` (Boolean) → Marca como destacada
   - `esPopular` (Boolean) → Badge de "Popular" / "MÁS VENDIDO"
   - `posicion` (Integer) → Orden de aparición
   - `activo` (Boolean) → Mostrar/ocultar en frontend
   - `colorBadge` (String, opcional) → Color del badge
   - **`nivel` (String) → "INICIAL", "PRIMARIA", "SECUNDARIA", "TODOS"** 🆕

2. **Endpoints adicionales:**
   - `PUT /api/v1/subscription-type/{id}` → Actualizar
   - `DELETE /api/v1/subscription-type/{id}` → Soft delete
   - `PUT /api/v1/subscription-type/{id}/toggle` → Activar/desactivar
   - `PUT /api/v1/subscription-type/reorder` → Cambiar orden
   - `GET /api/v1/subscription-type/active` → Solo activas (público)
   - `GET /api/v1/subscription-type/all` → Todas (admin)
   - **`GET /api/v1/subscription-type/by-nivel/{nivel}` → Filtrar por nivel** 🆕

#### **Frontend:**
1. **membresia.component.ts - REDISEÑO COMPLETO:**
   - ✅ Eliminar array estático `membresias[]`
   - ✅ Consumir servicio backend
   - ✅ **Agregar toggle buttons para niveles (Inicial/Primaria/Secundaria)** 🆕
   - ✅ **Filtrar membresías por nivel seleccionado** 🆕
   - ✅ **Nuevo diseño de cards como en la imagen** 🆕
   - ✅ Agregar loading state
   - ✅ Mapear response a formato del template

2. **Dashboard Admin - NUEVO:**
   - Componente: `subscription-type-management.component.ts`
   - Formulario crear/editar membresía (incluir campo nivel)
   - Lista con drag & drop para reordenar
   - Toggle activar/desactivar
   - Gestión de beneficios por materia

---

## 🎯 PLAN DE IMPLEMENTACIÓN

### **FASE 1: BACKEND - Migración de Base de Datos** ⏱️ 2-3 horas

#### 1.1 Modificar Entidad `SubscriptionType.java`

**Ubicación:** `Ecommerce-docs-back/src/main/java/com/carpetadigital/ecommerce/entity/SubscriptionType.java`

**Agregar campos:**
**Agregar campos:**
```java
@Column(name = "texto_descuento", length = 100)
private String textoDescuento; // "Ahora 28% de descuento"

@Column(name = "texto_precio", length = 50)
private String textoPrecio; // "Desde S/.45/mes*"

@Column(name = "nota_precio", length = 200)
private String notaPrecio; // "Los precios varían según el número de grados"

@Column(name = "es_recomendada", nullable = false)
private Boolean esRecomendada = false;

@Column(name = "es_popular", nullable = false)
private Boolean esPopular = false;

@Column(name = "posicion", nullable = false)
private Integer posicion = 0;

@Column(name = "activo", nullable = false)
private Boolean activo = true;

@Column(name = "color_badge", length = 20)
private String colorBadge; // Opcional: "primary", "success", "warning"

// 🆕 NUEVO: Campo para agrupación por nivel educativo
@Column(name = "nivel", length = 20)
private String nivel; // "INICIAL", "PRIMARIA", "SECUNDARIA", "TODOS"
```

#### 1.2 Crear Migration Script (Flyway o Liquibase)

**Archivo:** `V{version}__add_marketing_fields_to_subscription_types.sql`

```sql
-- Agregar nuevas columnas
ALTER TABLE subscription_types 
ADD COLUMN texto_descuento VARCHAR(100),
ADD COLUMN texto_precio VARCHAR(50),
ADD COLUMN nota_precio VARCHAR(200),
ADD COLUMN es_recomendada BOOLEAN DEFAULT FALSE,
ADD COLUMN es_popular BOOLEAN DEFAULT FALSE,
ADD COLUMN posicion INT DEFAULT 0,
ADD COLUMN activo BOOLEAN DEFAULT TRUE,
ADD COLUMN color_badge VARCHAR(20),
ADD COLUMN nivel VARCHAR(20) DEFAULT 'TODOS'; -- 🆕 NUEVO

-- Poblar data inicial desde membresia.component.ts existente
UPDATE subscription_types 
SET texto_descuento = 'Ahora 28% de descuento',
    texto_precio = 'Desde S/.45/mes*',
    nota_precio = 'Los precios varían según el número de grados',
    posicion = 1,
    activo = TRUE,
    nivel = 'INICIAL' -- 🆕
WHERE id = 1;

UPDATE subscription_types 
SET texto_descuento = 'Ahora 10% de descuento',
    texto_precio = 'Desde S/.32/mes*',
    nota_precio = 'Los precios varían según el curso y el número de grados',
    posicion = 2,
    activo = TRUE,
    nivel = 'SECUNDARIA' -- 🆕
WHERE id = 3;

UPDATE subscription_types 
SET texto_descuento = 'Ahora 15% de descuento',
    texto_precio = 'Desde S/.250/anual*',
    nota_precio = 'Los precios varían según el curso y el número de grados',
    es_recomendada = TRUE,
    es_popular = TRUE,
    posicion = 3,
    activo = TRUE,
    nivel = 'SECUNDARIA' -- 🆕
WHERE id = 4;
```

#### 1.3 Actualizar DTOs

**Archivo:** `SubscriptionTypeDto.java`

```java
@Data
public class SubscriptionTypeDto {
    private Long id;
    private String nombre;
    private String descripcion;
    private String textoDescuento;
    private String textoPrecio;
    private String notaPrecio;
    private Boolean esRecomendada;
    private Boolean esPopular;
    private Integer posicion;
    private Boolean activo;
    private String colorBadge;
    // ... materias, etc.
}
```

---

### **FASE 2: BACKEND - Servicios y Controladores** ⏱️ 3-4 horas

#### 2.1 Actualizar `SubscriptionTypeService.java`

**Agregar métodos:**
```java
// Obtener solo las activas (para público)
public List<SubscriptionType> getActiveSubscriptionTypes() {
    return subscriptionTypeRepository.findByActivoTrueOrderByPosicionAsc();
}

// Obtener todas (para admin)
public List<SubscriptionType> getAllSubscriptionTypesAdmin() {
    return subscriptionTypeRepository.findAllByOrderByPosicionAsc();
}

// Actualizar
public SubscriptionType updateSubscriptionType(Long id, SubscriptionTypeDto dto) {
    SubscriptionType existing = getSubscriptionTypeById(id);
    // Mapear campos del DTO a la entidad
    existing.setNombre(dto.getNombre());
    existing.setDescripcion(dto.getDescripcion());
    existing.setTextoDescuento(dto.getTextoDescuento());
    existing.setTextoPrecio(dto.getTextoPrecio());
    existing.setNotaPrecio(dto.getNotaPrecio());
    existing.setEsRecomendada(dto.getEsRecomendada());
    existing.setEsPopular(dto.getEsPopular());
    existing.setPosicion(dto.getPosicion());
    existing.setActivo(dto.getActivo());
    existing.setColorBadge(dto.getColorBadge());
    return subscriptionTypeRepository.save(existing);
}

// Toggle activo/inactivo
public SubscriptionType toggleActive(Long id) {
    SubscriptionType subscriptionType = getSubscriptionTypeById(id);
    subscriptionType.setActivo(!subscriptionType.getActivo());
    return subscriptionTypeRepository.save(subscriptionType);
}

// Reordenar
public void reorderSubscriptionTypes(List<Long> ids) {
    for (int i = 0; i < ids.size(); i++) {
        SubscriptionType st = getSubscriptionTypeById(ids.get(i));
        st.setPosicion(i + 1);
        subscriptionTypeRepository.save(st);
    }
}

// Eliminar (soft delete)
public void deleteSubscriptionType(Long id) {
    SubscriptionType st = getSubscriptionTypeById(id);
    st.setActivo(false); // Soft delete
    subscriptionTypeRepository.save(st);
}
```

#### 2.2 Actualizar `SubscriptionTypeRepository.java`

```java
public interface SubscriptionTypeRepository extends JpaRepository<SubscriptionType, Long> {
    List<SubscriptionType> findByActivoTrueOrderByPosicionAsc();
    List<SubscriptionType> findAllByOrderByPosicionAsc();
}
```

#### 2.3 Actualizar `SubscriptionTypeController.java`

```java
@RestController
@RequestMapping("/api/v1/subscription-type")
public class SubscriptionTypeController {

    // PÚBLICOS (sin auth)
    @GetMapping
    public ResponseEntity<Object> getAllSubscriptionTypes() {
        List<SubscriptionType> types = service.getActiveSubscriptionTypes();
        return ResponseHandler.generateResponse(HttpStatus.OK, types, true);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Object> getSubscriptionTypeById(@PathVariable Long id) {
        SubscriptionType type = service.getSubscriptionTypeById(id);
        return ResponseHandler.generateResponse(HttpStatus.OK, type, true);
    }

    // ADMIN ONLY (requiere SUPER_ADMIN)
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Object> getAllForAdmin() {
        List<SubscriptionType> types = service.getAllSubscriptionTypesAdmin();
        return ResponseHandler.generateResponse(HttpStatus.OK, types, true);
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Object> createSubscriptionType(@RequestBody SubscriptionTypeDto dto) {
        SubscriptionType created = service.createSubscriptionType(dto);
        return ResponseHandler.generateResponse(HttpStatus.CREATED, created, true);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Object> updateSubscriptionType(
        @PathVariable Long id, 
        @RequestBody SubscriptionTypeDto dto
    ) {
        SubscriptionType updated = service.updateSubscriptionType(id, dto);
        return ResponseHandler.generateResponse(HttpStatus.OK, updated, true);
    }

    @PutMapping("/{id}/toggle")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Object> toggleActive(@PathVariable Long id) {
        SubscriptionType toggled = service.toggleActive(id);
        return ResponseHandler.generateResponse(HttpStatus.OK, toggled, true);
    }

    @PutMapping("/reorder")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Object> reorder(@RequestBody List<Long> ids) {
        service.reorderSubscriptionTypes(ids);
        return ResponseHandler.generateResponse(HttpStatus.OK, "Reordenado exitosamente", true);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Object> delete(@PathVariable Long id) {
        service.deleteSubscriptionType(id);
        return ResponseHandler.generateResponse(HttpStatus.OK, "Eliminado exitosamente", true);
    }
}
```

---

### **FASE 3: FRONTEND - Interfaces y Servicios** ⏱️ 1-2 horas

#### 3.1 Actualizar Interface `membresia.ts`

**Ubicación:** `e-comerce-docs-front/src/app/@core/interfaces/membresia.ts`

```typescript
export interface ResponseMembresia {
  result: boolean;
  data: Membresia;
  timestamp: string;
  status: number;
}

export interface ResponseMembresiasLista {
  result: boolean;
  data: MembresiaCard[];
  timestamp: string;
  status: number;
}

export interface Membresia {
  id: number;
  nombre: string;
  descripcion: string;
  textoDescuento?: string;
  textoPrecio?: string;
  notaPrecio?: string;
  esRecomendada: boolean;
  esPopular: boolean;
  posicion: number;
  activo: boolean;
  colorBadge?: string;
  materias: Materias[];
}

// Para la lista de cards (vista membresia.component)
export interface MembresiaCard {
  id: number;
  titulo: string;
  descuento: string;
  precio: string;
  descripcion: string;
  isRecommended: boolean;
  popular: boolean;
  posicion: number;
  beneficios: string[]; // Agregado de todas las materias
}
```

#### 3.2 Actualizar `membresia.service.ts`

**Agregar métodos:**
```typescript
export class MembresiaService extends MembresiaData {
  
  // Obtener todas las activas (para vista pública)
  getAllActiveSubscriptionTypes(): Observable<ResponseMembresiasLista> {
    return this.api.getAllActiveSubscriptionTypes();
  }

  // ADMIN: Obtener todas (activas e inactivas)
  getAllSubscriptionTypesAdmin(): Observable<ResponseMembresiasLista> {
    return this.api.getAllSubscriptionTypesAdmin();
  }

  // ADMIN: Crear
  createSubscriptionType(data: Membresia): Observable<ResponseMembresia> {
    return this.api.createSubscriptionType(data);
  }

  // ADMIN: Actualizar
  updateSubscriptionType(id: number, data: Membresia): Observable<ResponseMembresia> {
    return this.api.updateSubscriptionType(id, data);
  }

  // ADMIN: Toggle activo
  toggleSubscriptionType(id: number): Observable<ResponseMembresia> {
    return this.api.toggleSubscriptionType(id);
  }

  // ADMIN: Reordenar
  reorderSubscriptionTypes(ids: number[]): Observable<any> {
    return this.api.reorderSubscriptionTypes(ids);
  }

  // ADMIN: Eliminar
  deleteSubscriptionType(id: number): Observable<any> {
    return this.api.deleteSubscriptionType(id);
  }
}
```

#### 3.3 Actualizar `membresia.api.ts`

```typescript
export class MembresiaApi {
  
  getAllActiveSubscriptionTypes(): Observable<ResponseMembresiasLista> {
    return this.api.get('api/v1/subscription-type');
  }

  getAllSubscriptionTypesAdmin(): Observable<ResponseMembresiasLista> {
    return this.api.get('api/v1/subscription-type/admin/all');
  }

  createSubscriptionType(data: Membresia): Observable<ResponseMembresia> {
    return this.api.post('api/v1/subscription-type', data);
  }

  updateSubscriptionType(id: number, data: Membresia): Observable<ResponseMembresia> {
    return this.api.put(`api/v1/subscription-type/${id}`, data);
  }

  toggleSubscriptionType(id: number): Observable<ResponseMembresia> {
    return this.api.put(`api/v1/subscription-type/${id}/toggle`, {});
  }

  reorderSubscriptionTypes(ids: number[]): Observable<any> {
    return this.api.put('api/v1/subscription-type/reorder', ids);
  }

  deleteSubscriptionType(id: number): Observable<any> {
    return this.api.delete(`api/v1/subscription-type/${id}`);
  }
}
```

---

### **FASE 4: FRONTEND - Actualizar membresia.component.ts** ⏱️ 3-4 horas ⚠️ ACTUALIZADO

#### 4.1 Modificar `membresia.component.ts` - NUEVO DISEÑO POR NIVELES

**ANTES (Estático):**
```typescript
membresias = [
  {
    id: 1,
    titulo: 'Membresía Mensual Inicial',
    descuento: 'Ahora 28% de descuento',
    // ... hardcodeado
  }
];
```

**DESPUÉS (Dinámico con Filtro por Nivel):**
```typescript
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MembresiaData, MembresiaCard } from '../../@core/interfaces/membresia';

type NivelEducativo = 'INICIAL' | 'PRIMARIA' | 'SECUNDARIA';

@Component({
  selector: 'ngx-membresia',
  templateUrl: './membresia.component.html',
  styleUrls: ['./membresia.component.scss']
})
export class MembresiaComponent implements OnInit {
  
  // 🆕 Todas las membresías cargadas
  todasMembresias: MembresiaCard[] = [];
  
  // 🆕 Membresías filtradas por nivel
  membresias: MembresiaCard[] = [];
  
  // 🆕 Nivel seleccionado (por defecto SECUNDARIA)
  nivelSeleccionado: NivelEducativo = 'SECUNDARIA';
  
  // 🆕 Niveles disponibles para toggle buttons
  nivelesDisponibles: NivelEducativo[] = ['SECUNDARIA', 'PRIMARIA', 'INICIAL'];
  
  isLoading = true;
  error: string | null = null;
  
  constructor(
    private router: Router,
    private membresiaService: MembresiaData
  ) {}

  ngOnInit(): void {
    this.loadMembresias();
  }

  loadMembresias(): void {
    this.isLoading = true;
    this.error = null;

    this.membresiaService.getAllActiveSubscriptionTypes()
      .subscribe({
        next: (response) => {
          if (response.result) {
            // Mapear todas las membresías
            this.todasMembresias = this.mapToCards(response.data);
            
            // Aplicar filtro inicial
            this.filterByNivel(this.nivelSeleccionado);
            
            this.isLoading = false;
          }
        },
        error: (err) => {
          console.error('Error cargando membresías:', err);
          this.error = 'Error al cargar las membresías. Por favor, intenta nuevamente.';
          this.isLoading = false;
        }
      });
  }

  /**
   * 🆕 NUEVO: Filtra membresías por nivel educativo
   */
  onNivelChange(nivel: NivelEducativo): void {
    this.nivelSeleccionado = nivel;
    this.filterByNivel(nivel);
  }

  /**
   * 🆕 NUEVO: Aplica filtro por nivel
   */
  private filterByNivel(nivel: NivelEducativo): void {
    this.membresias = this.todasMembresias.filter(m => 
      m.nivel === nivel || m.nivel === 'TODOS'
    );
  }

  /**
   * Mapea la respuesta del backend al formato del template
   */
  private mapToCards(data: any[]): MembresiaCard[] {
    return data.map(item => ({
      id: item.id,
      titulo: item.nombre,
      descuento: item.textoDescuento || '',
      precio: item.textoPrecio || '',
      descripcion: item.notaPrecio || '',
      isRecommended: item.esRecomendada || false,
      popular: item.esPopular || false,
      posicion: item.posicion || 0,
      nivel: item.nivel || 'TODOS', // 🆕
      beneficios: this.extractAllBeneficios(item.materias)
    }));
  }

  /**
   * Mapea la respuesta del backend al formato que usa el template
   */
  private mapToCards(data: any[]): MembresiaCard[] {
    return data.map(item => ({
      id: item.id,
      titulo: item.nombre,
      descuento: item.textoDescuento || '',
      precio: item.textoPrecio || '',
      descripcion: item.notaPrecio || '',
      isRecommended: item.esRecomendada || false,
      popular: item.esPopular || false,
      posicion: item.posicion || 0,
      beneficios: this.extractAllBeneficios(item.materias)
    }));
  }

  /**
   * Extrae todos los beneficios únicos de todas las materias
   */
  private extractAllBeneficios(materias: any[]): string[] {
    if (!materias || materias.length === 0) return [];
    
    const allBeneficios = new Set<string>();
    
    materias.forEach(materia => {
      if (materia.beneficios && Array.isArray(materia.beneficios)) {
        materia.beneficios.forEach(b => allBeneficios.add(b));
      }
    });
    
    return Array.from(allBeneficios);
  }

  onViewBenefits(index: number): void {
    const selectedMembresia = this.membresias[index];
    this.router.navigate(['/site/membresia-detail', selectedMembresia.id]);
  }

  getMostPopularPlan(): MembresiaCard | undefined {
    return this.membresias.find(m => m.isRecommended);
  }

  getNumericPrice(priceString: string): number {
    const match = priceString.match(/S\/\.(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  getUniqueFeatures(planIndex: number): string[] {
    const currentPlan = this.membresias[planIndex];
    const otherPlans = this.membresias.filter((_, i) => i !== planIndex);
    
    return currentPlan.beneficios.filter(benefit => 
      !otherPlans.some(plan => 
        plan.beneficios.some(otherBenefit => 
          otherBenefit.toLowerCase().includes(benefit.toLowerCase().split(' ')[0])
        )
      )
    );
  }

  getBenefitsCount(planIndex: number): number {
    return this.membresias[planIndex].beneficios.length;
  }
}
```

#### 4.2 Actualizar Template HTML - NUEVO DISEÑO

**membresia.component.html:**
```html
<div class="membresias-container">
  
  <!-- Título Principal -->
  <div class="header-section">
    <h1 class="main-title">Elige el plan perfecto para tu aula</h1>
  </div>

  <!-- 🆕 Toggle Buttons para Niveles -->
  <div class="nivel-toggle-container">
    <div class="toggle-buttons">
      <button 
        *ngFor="let nivel of nivelesDisponibles"
        class="toggle-btn"
        [class.active]="nivelSeleccionado === nivel"
        (click)="onNivelChange(nivel)">
        {{ nivel }}
      </button>
    </div>
  </div>

  <!-- Loading State -->
  <div *ngIf="isLoading" class="loading-container">
    <nb-spinner size="giant"></nb-spinner>
    <p>Cargando membresías...</p>
  </div>

  <!-- Error State -->
  <div *ngIf="error" class="error-container">
    <nb-alert status="danger">{{ error }}</nb-alert>
    <button nbButton status="primary" (click)="loadMembresias()">
      Reintentar
    </button>
  </div>

  <!-- 🆕 Cards Grid - Nuevo Diseño -->
  <div *ngIf="!isLoading && !error" class="plans-grid">
    <div 
      *ngFor="let membresia of membresias; let i = index" 
      class="plan-card"
      [class.recommended]="membresia.isRecommended">
      
      <!-- Badge "MÁS VENDIDO" -->
      <div *ngIf="membresia.popular" class="badge-popular">
        MÁS VENDIDO
      </div>

      <!-- Título del Plan -->
      <div class="plan-header">
        <h3 class="plan-title">{{ membresia.titulo }}</h3>
        <p class="plan-subtitle" *ngIf="membresia.descuento">
          {{ membresia.descuento }}
        </p>
      </div>

      <!-- Precio -->
      <div class="plan-price">
        <span class="price-amount">{{ membresia.precio }}</span>
        <span class="price-period" *ngIf="membresia.descripcion">
          {{ membresia.descripcion }}
        </span>
      </div>

      <!-- Beneficios -->
      <div class="plan-benefits">
        <ul class="benefits-list">
          <li *ngFor="let beneficio of membresia.beneficios">
            <nb-icon icon="checkmark-circle-2-outline" status="success"></nb-icon>
            {{ beneficio }}
          </li>
        </ul>
      </div>

      <!-- Contador de Beneficios -->
      <div class="benefits-count">
        {{ getBenefitsCount(i) }} beneficios incluidos
      </div>

      <!-- Botón de Acción -->
      <button 
        nbButton 
        fullWidth 
        [status]="membresia.isRecommended ? 'primary' : 'basic'"
        (click)="onViewBenefits(i)">
        Ver Beneficios Completos
      </button>
    </div>
  </div>
</div>
```

#### 4.3 Estilos SCSS - NUEVO DISEÑO

**membresia.component.scss:**
```scss
.membresias-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;

  .header-section {
    text-align: center;
    margin-bottom: 2rem;

    .main-title {
      font-size: 2.5rem;
      font-weight: 700;
      color: #2c3e50;
      margin-bottom: 1rem;
    }
  }

  // 🆕 Toggle Buttons para Niveles
  .nivel-toggle-container {
    display: flex;
    justify-content: center;
    margin-bottom: 3rem;

    .toggle-buttons {
      display: flex;
      gap: 1rem;
      background: #f8f9fa;
      padding: 0.5rem;
      border-radius: 50px;

      .toggle-btn {
        padding: 0.75rem 2rem;
        border: none;
        background: transparent;
        color: #6c757d;
        font-weight: 600;
        font-size: 1rem;
        border-radius: 50px;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background: rgba(255, 193, 7, 0.1);
        }

        &.active {
          background: #ffc107;
          color: #000;
          box-shadow: 0 2px 8px rgba(255, 193, 7, 0.3);
        }
      }
    }
  }

  // Loading & Error
  .loading-container,
  .error-container {
    text-align: center;
    padding: 3rem;
  }

  // 🆕 Grid de Plans - Nuevo Diseño
  .plans-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 2rem;
    margin-top: 2rem;

    .plan-card {
      background: white;
      border: 2px solid #e9ecef;
      border-radius: 12px;
      padding: 2rem;
      position: relative;
      transition: transform 0.3s ease, box-shadow 0.3s ease;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      }

      &.recommended {
        border-color: #0066ff;
        box-shadow: 0 4px 16px rgba(0, 102, 255, 0.2);
      }

      // Badge "MÁS VENDIDO"
      .badge-popular {
        position: absolute;
        top: -12px;
        left: 50%;
        transform: translateX(-50%);
        background: #0066ff;
        color: white;
        padding: 0.5rem 1.5rem;
        border-radius: 20px;
        font-weight: 700;
        font-size: 0.75rem;
        letter-spacing: 1px;
      }

      .plan-header {
        text-align: center;
        margin-bottom: 1.5rem;
        margin-top: 1rem;

        .plan-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 0.5rem;
        }

        .plan-subtitle {
          color: #28a745;
          font-weight: 600;
        }
      }

      .plan-price {
        text-align: center;
        margin-bottom: 2rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid #e9ecef;

        .price-amount {
          display: block;
          font-size: 2.5rem;
          font-weight: 700;
          color: #2c3e50;
        }

        .price-period {
          display: block;
          font-size: 0.875rem;
          color: #6c757d;
          margin-top: 0.5rem;
        }
      }

      .plan-benefits {
        margin-bottom: 1.5rem;

        .benefits-list {
          list-style: none;
          padding: 0;

          li {
            display: flex;
            align-items: flex-start;
            margin-bottom: 0.75rem;
            font-size: 0.9rem;
            color: #495057;

            nb-icon {
              margin-right: 0.5rem;
              flex-shrink: 0;
              margin-top: 0.1rem;
            }
          }
        }
      }

      .benefits-count {
        text-align: center;
        font-size: 0.875rem;
        color: #6c757d;
        font-style: italic;
        margin-bottom: 1rem;
      }
    }
  }
}

// Responsive
@media (max-width: 768px) {
  .membresias-container {
    padding: 1rem;

    .header-section .main-title {
      font-size: 1.75rem;
    }

    .nivel-toggle-container .toggle-buttons {
      flex-direction: column;
      width: 100%;

      .toggle-btn {
        width: 100%;
      }
    }

    .plans-grid {
      grid-template-columns: 1fr;
    }
  }
}
```

  getUniqueFeatures(planIndex: number): string[] {
    const currentPlan = this.membresias[planIndex];
    const otherPlans = this.membresias.filter((_, i) => i !== planIndex);
    
    return currentPlan.beneficios.filter(benefit => 
      !otherPlans.some(plan => 
        plan.beneficios.some(otherBenefit => 
          otherBenefit.toLowerCase().includes(benefit.toLowerCase().split(' ')[0])
        )
      )
    );
  }

  getBenefitsCount(planIndex: number): number {
    return this.membresias[planIndex].beneficios.length;
  }
}
```

#### 4.2 Agregar Loading State en Template

**membresia.component.html:**
```html
<!-- Loading State -->
<div *ngIf="isLoading" class="loading-container">
  <nb-spinner size="giant"></nb-spinner>
  <p>Cargando membresías...</p>
</div>

<!-- Error State -->
<div *ngIf="error" class="error-container">
  <nb-alert status="danger">{{ error }}</nb-alert>
  <button nbButton status="primary" (click)="loadMembresias()">
    Reintentar
  </button>
</div>

<!-- Content (solo si no hay loading ni error) -->
<div *ngIf="!isLoading && !error">
  <!-- Tu código existente de cards -->
</div>
```

---

### **FASE 5: DASHBOARD ADMIN - CRUD de Membresías** ⏱️ 6-8 horas

#### 5.1 Crear Módulo Admin

**Estructura de archivos:**
```
pages-admin/
├── subscription-management/
│   ├── subscription-management.component.ts
│   ├── subscription-management.component.html
│   ├── subscription-management.component.scss
│   ├── subscription-form/
│   │   ├── subscription-form.component.ts
│   │   ├── subscription-form.component.html
│   │   └── subscription-form.component.scss
│   └── materia-form/
│       ├── materia-form.component.ts
│       ├── materia-form.component.html
│       └── materia-form.component.scss
```

#### 5.2 Lista de Membresías (`subscription-management.component.ts`)

**Funcionalidades:**
- ✅ Listar todas las membresías (activas e inactivas)
- ✅ Botón "Crear Nueva Membresía"
- ✅ Drag & Drop para reordenar (usando @angular/cdk/drag-drop)
- ✅ Toggle activar/desactivar
- ✅ Botón editar → Abre modal con formulario
- ✅ Botón eliminar → Confirmación y soft delete
- ✅ Badge visual para "Recomendada" y "Popular"
- ✅ Vista previa de cómo se ve en el frontend

**Código base:**
```typescript
import { Component, OnInit } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { MembresiaData, Membresia } from '../../../@core/interfaces/membresia';
import { SubscriptionFormComponent } from './subscription-form/subscription-form.component';

@Component({
  selector: 'ngx-subscription-management',
  templateUrl: './subscription-management.component.html',
  styleUrls: ['./subscription-management.component.scss']
})
export class SubscriptionManagementComponent implements OnInit {
  
  subscriptionTypes: Membresia[] = [];
  isLoading = true;

  constructor(
    private membresiaService: MembresiaData,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadSubscriptionTypes();
  }

  loadSubscriptionTypes(): void {
    this.isLoading = true;
    this.membresiaService.getAllSubscriptionTypesAdmin()
      .subscribe({
        next: (response) => {
          if (response.result) {
            this.subscriptionTypes = response.data;
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error:', err);
          this.isLoading = false;
        }
      });
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(SubscriptionFormComponent, {
      width: '80%',
      maxWidth: '1200px',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadSubscriptionTypes();
      }
    });
  }

  openEditDialog(subscription: Membresia): void {
    const dialogRef = this.dialog.open(SubscriptionFormComponent, {
      width: '80%',
      maxWidth: '1200px',
      data: { mode: 'edit', subscription }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadSubscriptionTypes();
      }
    });
  }

  onDrop(event: CdkDragDrop<Membresia[]>): void {
    moveItemInArray(this.subscriptionTypes, event.previousIndex, event.currentIndex);
    
    // Actualizar posiciones en el backend
    const ids = this.subscriptionTypes.map(st => st.id);
    this.membresiaService.reorderSubscriptionTypes(ids).subscribe({
      next: () => console.log('Orden actualizado'),
      error: (err) => console.error('Error reordenando:', err)
    });
  }

  toggleActive(subscription: Membresia): void {
    this.membresiaService.toggleSubscriptionType(subscription.id).subscribe({
      next: () => {
        subscription.activo = !subscription.activo;
      },
      error: (err) => console.error('Error:', err)
    });
  }

  delete(subscription: Membresia): void {
    if (confirm(`¿Eliminar "${subscription.nombre}"?`)) {
      this.membresiaService.deleteSubscriptionType(subscription.id).subscribe({
        next: () => this.loadSubscriptionTypes(),
        error: (err) => console.error('Error:', err)
      });
    }
  }
}
```

**Template HTML:**
```html
<nb-card>
  <nb-card-header>
    <div class="header-container">
      <h3>Gestión de Membresías</h3>
      <button nbButton status="primary" (click)="openCreateDialog()">
        <nb-icon icon="plus-outline"></nb-icon>
        Nueva Membresía
      </button>
    </div>
  </nb-card-header>

  <nb-card-body>
    <div cdkDropList (cdkDropListDropped)="onDrop($event)">
      <div *ngFor="let subscription of subscriptionTypes" 
           cdkDrag
           class="subscription-item"
           [class.inactive]="!subscription.activo">
        
        <!-- Drag Handle -->
        <div class="drag-handle" cdkDragHandle>
          <nb-icon icon="menu-outline"></nb-icon>
        </div>

        <!-- Content -->
        <div class="content">
          <div class="title-badges">
            <h5>{{ subscription.nombre }}</h5>
            <nb-badge *ngIf="subscription.esRecomendada" 
                      status="success">
              Recomendada
            </nb-badge>
            <nb-badge *ngIf="subscription.esPopular" 
                      status="info">
              Popular
            </nb-badge>
            <nb-badge *ngIf="!subscription.activo" 
                      status="danger">
              Inactiva
            </nb-badge>
          </div>
          <p class="descripcion">{{ subscription.descripcion }}</p>
          <div class="pricing-info">
            <span class="descuento">{{ subscription.textoDescuento }}</span>
            <span class="precio">{{ subscription.textoPrecio }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="actions">
          <button nbButton size="small" status="basic" 
                  (click)="toggleActive(subscription)">
            <nb-icon [icon]="subscription.activo ? 'eye-outline' : 'eye-off-outline'"></nb-icon>
          </button>
          <button nbButton size="small" status="info" 
                  (click)="openEditDialog(subscription)">
            <nb-icon icon="edit-outline"></nb-icon>
          </button>
          <button nbButton size="small" status="danger" 
                  (click)="delete(subscription)">
            <nb-icon icon="trash-outline"></nb-icon>
          </button>
        </div>
      </div>
    </div>
  </nb-card-body>
</nb-card>
```

#### 5.3 Formulario de Creación/Edición (`subscription-form.component.ts`)

**Tabs del formulario:**
1. **Información Básica:** nombre, descripción
2. **Marketing:** textoDescuento, textoPrecio, notaPrecio, badges
3. **Materias:** Agregar/editar materias con beneficios y opciones
4. **Vista Previa:** Cómo se verá en el frontend

**Código base:**
```typescript
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MembresiaData, Membresia } from '../../../../@core/interfaces/membresia';

@Component({
  selector: 'ngx-subscription-form',
  templateUrl: './subscription-form.component.html'
})
export class SubscriptionFormComponent implements OnInit {
  
  form: FormGroup;
  mode: 'create' | 'edit';
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private membresiaService: MembresiaData,
    public dialogRef: MatDialogRef<SubscriptionFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.mode = data.mode;
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['', [Validators.required, Validators.maxLength(500)]],
      textoDescuento: [''],
      textoPrecio: [''],
      notaPrecio: [''],
      esRecomendada: [false],
      esPopular: [false],
      activo: [true],
      colorBadge: [''],
      materias: this.fb.array([]) // Array de materias
    });

    if (this.mode === 'edit' && this.data.subscription) {
      this.patchFormValues(this.data.subscription);
    }
  }

  get materiasArray(): FormArray {
    return this.form.get('materias') as FormArray;
  }

  addMateria(): void {
    const materiaGroup = this.fb.group({
      id: [null],
      nombre: ['', Validators.required],
      afiche: [''],
      beneficios: this.fb.array([]),
      opciones: this.fb.array([])
    });
    this.materiasArray.push(materiaGroup);
  }

  removeMateria(index: number): void {
    this.materiasArray.removeAt(index);
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isSubmitting = true;
    const formValue = this.form.value;

    const request$ = this.mode === 'create'
      ? this.membresiaService.createSubscriptionType(formValue)
      : this.membresiaService.updateSubscriptionType(this.data.subscription.id, formValue);

    request$.subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Error:', err);
        this.isSubmitting = false;
      }
    });
  }

  private patchFormValues(subscription: Membresia): void {
    this.form.patchValue({
      nombre: subscription.nombre,
      descripcion: subscription.descripcion,
      textoDescuento: subscription.textoDescuento,
      textoPrecio: subscription.textoPrecio,
      notaPrecio: subscription.notaPrecio,
      esRecomendada: subscription.esRecomendada,
      esPopular: subscription.esPopular,
      activo: subscription.activo,
      colorBadge: subscription.colorBadge
    });
    
    // Cargar materias...
  }
}
```

---

## 📝 CHECKLIST DE IMPLEMENTACIÓN

### Backend (Java/Spring Boot)
- [ ] Agregar campos a entidad `SubscriptionType`
- [ ] Crear migration script SQL
- [ ] Actualizar DTOs
- [ ] Agregar métodos al `SubscriptionTypeService`
- [ ] Agregar query methods al `Repository`
- [ ] Crear endpoints en `Controller`
- [ ] Agregar seguridad `@PreAuthorize("hasRole('SUPER_ADMIN')")`
- [ ] Probar endpoints con Postman/Insomnia

### Frontend - Servicios
- [ ] Actualizar interfaces en `membresia.ts`
- [ ] Agregar métodos a `membresia.service.ts`
- [ ] Agregar métodos a `membresia.api.ts`
- [ ] Actualizar abstract class `MembresiaData`

### Frontend - Vista Pública
- [ ] Eliminar array estático de `membresia.component.ts`
- [ ] Inyectar servicio y consumir API
- [ ] Agregar loading state
- [ ] Agregar error handling
- [ ] Mapear response del backend
- [ ] Actualizar template HTML (loading/error)

### Frontend - Dashboard Admin
- [ ] Crear módulo `SubscriptionManagementModule`
- [ ] Crear componente lista (`subscription-management.component`)
- [ ] Implementar drag & drop (Angular CDK)
- [ ] Crear formulario (`subscription-form.component`)
- [ ] Agregar tabs en formulario
- [ ] Implementar gestión de materias
- [ ] Agregar vista previa
- [ ] Configurar rutas y guards (solo SUPER_ADMIN)
- [ ] Agregar al menú del dashboard

### Testing
- [ ] Tests unitarios backend
- [ ] Tests de integración backend
- [ ] Tests unitarios frontend
- [ ] Tests E2E para flujo completo

---

## 🚀 BENEFICIOS DE ESTA IMPLEMENTACIÓN

### ✅ Para el Negocio:
- **Flexibilidad:** Cambiar precios, descuentos, beneficios sin deployar código
- **Marketing Ágil:** Pruebas A/B de diferentes textos y ofertas
- **Escalabilidad:** Agregar nuevas membresías fácilmente
- **Control:** Activar/desactivar ofertas por temporada

### ✅ Para el Desarrollo:
- **Mantenibilidad:** No más hardcoding de data
- **Trazabilidad:** Logs de quién modificó qué
- **Consistencia:** Single source of truth (base de datos)
- **Testing:** Data de prueba sin tocar código

### ✅ Para el Usuario:
- **Información Actualizada:** Siempre ve las ofertas vigentes
- **Mejor UX:** Loading states y error handling
- **Performance:** Cache y optimizaciones posibles

---

## ⚠️ CONSIDERACIONES IMPORTANTES

1. **Migración de Data Existente:**
   - Ejecutar script SQL para poblar campos nuevos con data actual
   - Verificar que IDs coincidan con lógica existente

2. **Backwards Compatibility:**
   - `membresia-detail.component.ts` ya consume el backend, no requiere cambios
   - Otros componentes que usen membresías deben adaptarse

3. **Caché:**
   - Considerar implementar cache en frontend (5-10 minutos)
   - Invalidar cache cuando admin modifica

4. **SEO:**
   - Si las membresías afectan SEO, implementar SSR (Angular Universal)

5. **Auditoría:**
   - Agregar tabla `subscription_type_audit` para tracking de cambios
   - Campos: `quien_modifico`, `fecha`, `cambios_json`

---

## 📅 TIEMPO ESTIMADO TOTAL

| Fase | Tiempo | 
|------|--------|
| FASE 1: Backend - Base de Datos | 2-3 horas |
| FASE 2: Backend - Services/Controllers | 3-4 horas |
| FASE 3: Frontend - Interfaces/Services | 1-2 horas |
| FASE 4: Frontend - Vista Pública | 1-2 horas |
| FASE 5: Dashboard Admin - CRUD | 6-8 horas |
| Testing y Correcciones | 3-4 horas |
| **TOTAL** | **16-23 horas** |

---

## 🎯 PRÓXIMOS PASOS

1. **Revisar y aprobar este plan**
2. **Crear branch:** `feature/dynamic-memberships`
3. **Implementar FASE 1** (Backend DB)
4. **Implementar FASE 2** (Backend API)
5. **Probar endpoints con Postman**
6. **Implementar FASE 3** (Frontend Services)
7. **Implementar FASE 4** (Vista Pública)
8. **Implementar FASE 5** (Dashboard Admin)
9. **Testing completo**
10. **Deploy a staging**
11. **QA y correcciones**
12. **Deploy a producción**

---

**¿Deseas que empiece con alguna fase específica?** 🚀
