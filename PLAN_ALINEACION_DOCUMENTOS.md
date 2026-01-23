# 📋 PLAN DE ALINEACIÓN: Formulario de Documentos ↔️ Backend

**Fecha:** 2024  
**Objetivo:** Alinear completamente el formulario frontend de creación de documentos con la lógica del backend  
**Estado:** 🔍 Análisis Completo

---

## 📊 MAPEO DE FORMATOS Y CAMPOS REQUERIDOS

### **1. Formato PDF** 📄

#### Backend (`DocumentsEntity`)
- ✅ `format`: "PDF" (String, max 10 chars)
- ✅ `file`: Archivo PDF principal
- ✅ `numeroDePaginas`: int (extraído automáticamente del PDF)
- ✅ `pdfPreviewUrl`: String(500) - URL del preview
- ✅ `pdfPreviewNameId`: String(250) - ID del archivo preview

#### Frontend (`formulario-documentos.component`)
```typescript
{
  format: 'PDF',
  file: File,                    // ✅ Archivo PDF principal
  paginasPreView: number,        // ✅ Número de páginas para preview
  numeroPaginas: DESHABILITADO  // ❌ NO usado para PDF (se extrae automáticamente)
}
```

#### Flujo de Procesamiento
1. Usuario sube archivo PDF
2. Frontend extrae páginas para preview (según `paginasPreView`)
3. Backend:
   - Guarda PDF completo en Drive
   - Extrae `numeroDePaginas` automáticamente
   - Genera preview de N páginas
   - Guarda URLs en `fileUrlPublic/Private` y `pdfPreviewUrl`

#### Validaciones Frontend
```typescript
format === 'PDF' => {
  file: [Validators.required],           // Archivo obligatorio
  paginasPreView: [Validators.required], // Solo si NO es suscripción
  numeroPaginas: DISABLED               // Backend lo calcula
}
```

---

### **2. Formato DOCX** 📝

#### Backend (`DocumentsEntity`)
- ✅ `format`: "DOCX" (String)
- ✅ `file`: Archivo DOCX principal
- ✅ `filePdfDelWord`: PDF convertido del DOCX (requerido)
- ✅ `numeroDePaginas`: int (del PDF convertido)
- ✅ `pdfPreviewUrl`: String - Preview extraído del PDF

#### Frontend (`formulario-documentos.component`)
```typescript
{
  format: 'DOCX',
  file: File,                    // ✅ Archivo DOCX principal
  filePdfDelWord: File,          // ✅ PDF del Word (OBLIGATORIO)
  paginasPreView: number,        // ✅ Páginas preview del PDF
  numeroPaginas: DESHABILITADO  // Backend lo extrae del PDF
}
```

#### Flujo de Procesamiento
1. Usuario sube archivo DOCX
2. **REQUIERE** subir también el PDF convertido (`filePdfDelWord`)
3. Frontend extrae preview del PDF según `paginasPreView`
4. Backend:
   - Guarda DOCX como archivo principal
   - Guarda PDF convertido
   - Extrae `numeroDePaginas` del PDF
   - Genera preview del PDF

#### Validaciones Frontend
```typescript
format === 'DOCX' => {
  file: [Validators.required],            // DOCX obligatorio
  filePdfDelWord: [Validators.required],  // PDF del Word obligatorio
  paginasPreView: [Validators.required],  // Solo si NO es suscripción
  numeroPaginas: DISABLED                // Backend lo calcula
}
```

---

### **3. Formato ZIP** 🗜️

#### Backend (`DocumentsEntity`)
- ✅ `format`: "ZIP" (String)
- ✅ `file`: Archivo ZIP principal
- ✅ `preViewFilePdf`: PDF para preview (separado del ZIP)
- ✅ `numeroDePaginas`: int (manual)

#### Frontend (`formulario-documentos.component`)
```typescript
{
  format: 'ZIP',
  file: File,                   // ✅ Archivo ZIP principal
  preViewFilePdf: File,         // ✅ PDF de preview (separado)
  numeroPaginas: number,        // ✅ HABILITADO (manual)
  paginasPreView: DESHABILITADO // ❌ NO se usa (preview viene del PDF separado)
}
```

#### Flujo de Procesamiento
1. Usuario sube archivo ZIP
2. Usuario sube PDF separado para preview (`preViewFilePdf`)
3. Usuario ingresa manualmente `numeroPaginas`
4. Backend:
   - Guarda ZIP como archivo principal
   - Guarda PDF preview por separado
   - Usa `numeroDePaginas` manual

#### Validaciones Frontend
```typescript
format === 'ZIP' => {
  file: [Validators.required],           // ZIP obligatorio
  preViewFilePdf: [Validators.required], // PDF preview obligatorio
  numeroPaginas: [Validators.required],  // Manual obligatorio
  paginasPreView: DISABLED              // NO se usa
}
```

---

### **4. Formato OTROS** 📦

#### Backend (`DocumentsEntity`)
- ✅ `format`: "OTROS" (String)
- ✅ `file`: Archivo de cualquier tipo
- ✅ `preViewFilePdf`: PDF para preview (separado)
- ✅ `numeroDePaginas`: int (manual)

#### Frontend (`formulario-documentos.component`)
```typescript
{
  format: 'OTROS',
  file: File,                   // ✅ Archivo cualquier tipo
  preViewFilePdf: File,         // ✅ PDF preview separado
  numeroPaginas: number,        // ✅ Manual
  paginasPreView: DESHABILITADO // ❌ NO se usa
}
```

#### Flujo de Procesamiento
**IDÉNTICO a ZIP:**
1. Archivo principal (cualquier extensión)
2. PDF preview separado
3. `numeroPaginas` manual

#### Validaciones Frontend
```typescript
format === 'OTROS' => {
  file: [Validators.required],
  preViewFilePdf: [Validators.required],
  numeroPaginas: [Validators.required],
  paginasPreView: DISABLED
}
```

---

## 🔄 TIPOS DE DOCUMENTOS

### **Tipo 1: Documento Normal** 📄
```typescript
{
  suscripcion: false,
  isKits: false,
  // Requiere jerarquía completa
  category: CategoryEntity,     // Obligatorio
  nivel: LevelEntity,          // Obligatorio
  materia: SubjectEntity,      // Obligatorio (excepto CONCURSOS/RECURSOS)
  grado: GradeEntity          // Obligatorio (según categoría)
}
```

**Categorías que NO requieren materia/grado:**
- `CONCURSOS`
- `RECURSOS`

**Categorías que requieren grado:**
- `PLANIFICACION`, `EVALUACION`, `ESTRATEGIAS`, `EBOOKS`, `TALLERES`, `PLAN_LECTOR`, `REFORZAMIENTO`

---

### **Tipo 2: Kit de Planificación** 📦
```typescript
{
  suscripcion: false,
  isKits: true,
  // Campos especiales
  situacionesId: Long,                    // Situación significativa (obligatoria)
  situacionesNombre: string,              // Opcional: crear nueva situación
  unitScheduleId: Long,                   // ✅ NUEVO: Unidad programática (obligatoria)
  numeroPaginas: number,                  // ✅ NUEVO: Número de páginas (obligatorio)
  preViewFilePdf: File,                   // ✅ NUEVO: PDF preview (obligatorio)
  
  // Detección automática
  category: 'PLANIFICACION' && format: 'ZIP' => isKits = true (auto)
}
```

#### Backend (`DocumentsEntity`)
```java
@ManyToOne
@JoinColumn(name = "situacion_id", nullable = true)
private SituacionesSgnificativas situacionSignificativa;

// Campos para kits generados
private Boolean esKitPlanificacion;      // true cuando es kit
private String estado;                   // "PENDIENTE", "GENERANDO", "COMPLETADO"
private Integer totalDocumentos;         // Contador de sesiones
private LocalDate fechaGeneracion;       // Timestamp generación
```

#### Lógica Frontend
```typescript
// ✅ Checkbox isKits solo habilitado si:
category === 'PLANIFICACION' && 
nivel !== null &&
(format === 'ZIP' || format === 'OTROS')

// ✅ Detección automática en modo edición:
if (category === 'PLANIFICACION' && format === 'ZIP') {
  isKits = true (forzado)
}
```

---

### **Tipo 3: Documento de Suscripción** 🔐
```typescript
{
  suscripcion: true,
  // Campos obligatorios
  subscriptionType: SubscriptionType,     // Tipo suscripción
  materiasSuscripcion: Materia[],         // Materias asociadas
  opcionesSuscripcion: Opcion[],          // Opciones asociadas
  unitScheduleId: Long,                   // ✅ NUEVO: Unidad programática (obligatoria)
  numeroPaginas: number,                  // ✅ NUEVO: Número de páginas (obligatorio)
  preViewFilePdf: File,                   // ✅ NUEVO: PDF preview (obligatorio)
  
  // Automático
  category: 'PLANIFICACION' (forzado),
  
  // NO requiere
  paginasPreView: DISABLED,               // ❌ No extrae páginas automáticamente
  nivel/materia/grado: OCULTOS           // ❌ No usan jerarquía normal
}
```

#### Backend (`DocumentsEntity`)
```java
private Boolean suscripcion;

@ManyToOne
@JoinColumn(name = "subscription_type_id", nullable = true)
private SubscriptionType subscriptionType;

@ManyToOne
@JoinColumn(name = "materia_id", nullable = true)
private Materia materiaEntity;

@ManyToOne
@JoinColumn(name = "opcion_id", nullable = true)
private Opcion opcion;

// ✅ Asociación con UnitSchedule (unidades programáticas)
@ManyToOne
@JoinColumn(name = "unit_schedule_id", nullable = true)
private UnitSchedule unitSchedule;

// ✅ Métodos helper retornan null si es suscripción
public CategoryEntity getCategoryEntidad() {
    return suscripcion ? null : grade.getSubject().getLevel().getCategory();
}
```

#### Tipos de Suscripción (hardcoded frontend)
```typescript
subscriptionTypes = [
  { id: 1, name: 'Mensual - Inicial' },
  { id: 2, name: 'Mensual - Primaria' },
  { id: 3, name: 'Anual - Inicial' },
  { id: 4, name: 'Anual - Primaria' }
];
```

---

## 🎯 MATRIZ DE VALIDACIONES CONDICIONALES

| Campo              | PDF | DOCX | ZIP | OTROS | Normal | Kit | Suscripción |
|--------------------|-----|------|-----|-------|--------|-----|-------------|
| `file`             | ✅  | ✅  | ✅  | ✅   | ✅    | ✅   | ✅           |
| `filePdfDelWord`   | ❌  | ✅  | ❌  | ❌   | -      | -   | -           |
| `preViewFilePdf`   | ❌  | ❌  | ✅  | ✅   | -      | ✅  | ✅           |
| `paginasPreView`   | ✅  | ✅  | ❌  | ❌   | ✅    | ❌  | ❌           |
| `numeroPaginas`    | ❌  | ❌  | ✅  | ✅   | -      | ✅  | ✅           |
| `category`         | -   | -    | -   | -     | ✅    | ✅  | PLANIFICACION (forzado) |
| `nivel`            | -   | -    | -   | -     | ✅    | ✅  | ❌           |
| `materia`          | -   | -    | -   | -     | ✅*   | ✅  | ❌           |
| `grado`            | -   | -    | -   | -     | ✅**  | ✅  | ❌           |
| `situacionesId`    | -   | -    | -   | -     | ❌    | ✅  | ❌           |
| `unitScheduleId`   | -   | -    | -   | -     | ❌    | ✅  | ✅           |
| `subscriptionType` | -   | -    | -   | -     | ❌    | ❌  | ✅           |
| `materiasSuscripcion` | - | -   | -   | -     | ❌    | ❌  | ✅           |
| `opcionesSuscripcion` | - | -   | -   | -     | ❌    | ❌  | ✅           |

**Leyenda:**
- ✅ = Obligatorio / Habilitado
- ❌ = Deshabilitado / No requerido
- \* = Excepto CONCURSOS/RECURSOS
- \*\* = Solo categorías específicas

---

## 🔧 ACCIONES DE ALINEACIÓN REQUERIDAS

### ✅ **YA COMPLETADO**
1. ✅ Sección "Configuración del Documento" oculta cuando `suscripcion === true`
2. ✅ Categoría automática `PLANIFICACION` al activar suscripción
3. ✅ Select de formato movido a "Archivos y Previsualización"
4. ✅ Lógica de formato ZIP/OTROS con `numeroPaginas`
5. ✅ Detección automática de kits en modo edición

### 🚧 **PENDIENTE DE IMPLEMENTACIÓN**

#### **P1. Validaciones de Archivos por Formato (ALTA PRIORIDAD)**
```typescript
// formulario-documentos.component.ts - setupFormListeners()

this.documentForm.get('format')?.valueChanges.subscribe((format) => {
  const isSuscripcion = this.documentForm.get('suscripcion')?.value;
  
  switch(format) {
    case 'PDF':
      // Requiere: file + paginasPreView (si no es suscripción)
      this.setupPdfValidations(isSuscripcion);
      break;
      
    case 'DOCX':
      // Requiere: file + filePdfDelWord + paginasPreView (si no es suscripción)
      this.setupDocxValidations(isSuscripcion);
      break;
      
    case 'ZIP':
    case 'OTROS':
      // Requiere: file + preViewFilePdf + numeroPaginas
      this.setupZipOtrosValidations();
      break;
  }
});
```

**Métodos a crear:**
```typescript
private setupPdfValidations(isSuscripcion: boolean): void {
  this.documentForm.get('filePdfDelWord')?.clearValidators();
  this.documentForm.get('filePdfDelWord')?.disable();
  this.documentForm.get('preViewFilePdf')?.clearValidators();
  this.documentForm.get('preViewFilePdf')?.disable();
  this.documentForm.get('numeroPaginas')?.clearValidators();
  this.documentForm.get('numeroPaginas')?.disable();
  
  if (!isSuscripcion) {
    this.documentForm.get('paginasPreView')?.setValidators([Validators.required]);
    this.documentForm.get('paginasPreView')?.enable();
  }
}

private setupDocxValidations(isSuscripcion: boolean): void {
  // Similar a PDF pero añade filePdfDelWord
  this.documentForm.get('filePdfDelWord')?.setValidators([Validators.required]);
  this.documentForm.get('filePdfDelWord')?.enable();
  
  this.documentForm.get('preViewFilePdf')?.clearValidators();
  this.documentForm.get('preViewFilePdf')?.disable();
  this.documentForm.get('numeroPaginas')?.clearValidators();
  this.documentForm.get('numeroPaginas')?.disable();
  
  if (!isSuscripcion) {
    this.documentForm.get('paginasPreView')?.setValidators([Validators.required]);
    this.documentForm.get('paginasPreView')?.enable();
  }
}

private setupZipOtrosValidations(): void {
  this.documentForm.get('preViewFilePdf')?.setValidators([Validators.required]);
  this.documentForm.get('preViewFilePdf')?.enable();
  this.documentForm.get('numeroPaginas')?.setValidators([Validators.required]);
  this.documentForm.get('numeroPaginas')?.enable();
  
  this.documentForm.get('filePdfDelWord')?.clearValidators();
  this.documentForm.get('filePdfDelWord')?.disable();
  this.documentForm.get('paginasPreView')?.clearValidators();
  this.documentForm.get('paginasPreView')?.disable();
}
```

---

#### **P2. Deprecar Campo `linkZip` (MEDIA PRIORIDAD)**
```typescript
// ❌ DEPRECAR COMPLETAMENTE
linkZip: ['', [Validators.pattern('https?://.+')]],

// ✅ Usar solo upload de archivos
```

**Acciones:**
1. Eliminar campo `linkZip` del FormGroup
2. Eliminar input de `linkZip` del HTML
3. Remover lógica en modo edición que muestra `linkZip`
4. Backend: Migrar datos existentes con `linkZip` (si existen)

---

#### **P3. Checkbox `isKits` - Habilitar Solo Cuando Aplique (ALTA PRIORIDAD)**
```typescript
// Actualizar actualizarEstadoIsKits()
private actualizarEstadoIsKits(): void {
  const category = this.documentForm.get('category')?.value;
  const nivel = this.documentForm.get('nivel')?.value;
  const format = this.documentForm.get('format')?.value;
  
  // ✅ Habilitar checkbox solo si:
  const canBeKit = 
    category === 'PLANIFICACION' && 
    nivel !== null && 
    (format === 'ZIP' || format === 'OTROS');
  
  if (canBeKit) {
    this.documentForm.get('isKits')?.enable();
  } else {
    this.documentForm.get('isKits')?.disable();
    this.documentForm.get('isKits')?.setValue(false);
  }
}
```

**Llamar desde:**
- `valueChanges` de `category`
- `valueChanges` de `nivel`
- `valueChanges` de `format`

---

#### **P4. Validación de Categorías (MEDIA PRIORIDAD)**
```typescript
// Mapa de categorías y sus requisitos
private categoryRequirements = {
  PLANIFICACION: { materia: true, grado: true },
  EVALUACION: { materia: true, grado: true },
  ESTRATEGIAS: { materia: true, grado: true },
  EBOOKS: { materia: true, grado: true },
  TALLERES: { materia: true, grado: true },
  PLAN_LECTOR: { materia: true, grado: true },
  REFORZAMIENTO: { materia: true, grado: true },
  CONCURSOS: { materia: false, grado: false },
  RECURSOS: { materia: false, grado: false }
};

private updateCategoryValidations(categoria: string): void {
  const requirements = this.categoryRequirements[categoria];
  
  if (requirements.materia) {
    this.documentForm.get('materia')?.setValidators([Validators.required]);
    this.documentForm.get('materia')?.enable();
  } else {
    this.documentForm.get('materia')?.clearValidators();
    this.documentForm.get('materia')?.disable();
  }
  
  if (requirements.grado) {
    this.documentForm.get('grado')?.setValidators([Validators.required]);
    // Grado se habilita cuando hay materia seleccionada
  } else {
    this.documentForm.get('grado')?.clearValidators();
    this.documentForm.get('grado')?.disable();
  }
}
```

---

#### **P5. Feedback Visual de Archivos Requeridos (BAJA PRIORIDAD)**
```html
<!-- formulario-documentos.component.html -->

<!-- Para DOCX mostrar requerimiento de PDF -->
<div *ngIf="documentForm.get('format')?.value === 'DOCX'" class="alert alert-info">
  <i class="fas fa-info-circle"></i>
  <strong>Formato DOCX:</strong> Debes subir el archivo Word y su versión en PDF.
</div>

<!-- Para ZIP/OTROS mostrar requerimientos -->
<div *ngIf="['ZIP', 'OTROS'].includes(documentForm.get('format')?.value)" class="alert alert-info">
  <i class="fas fa-info-circle"></i>
  <strong>Formato {{ documentForm.get('format')?.value }}:</strong>
  <ul>
    <li>Sube el archivo principal ({{ documentForm.get('format')?.value }})</li>
    <li>Sube un PDF para preview</li>
    <li>Indica el número total de páginas</li>
  </ul>
</div>
```

---

#### **P6. Validación de Backend - DTO (ALTA PRIORIDAD)**
**Crear/Actualizar DTO para validar datos según formato:**

```java
// DocumentCreateDTO.java o DocumentUpdateDTO.java

@NotNull(message = "El formato es obligatorio")
@Pattern(regexp = "PDF|DOCX|ZIP|OTROS", message = "Formato inválido")
private String format;

// Validaciones condicionales con @AssertTrue
@AssertTrue(message = "DOCX requiere archivo PDF del Word")
private boolean isDocxValid() {
    if ("DOCX".equals(format)) {
        return filePdfDelWord != null;
    }
    return true;
}

@AssertTrue(message = "ZIP/OTROS requieren PDF de preview y número de páginas")
private boolean isZipOtrosValid() {
    if ("ZIP".equals(format) || "OTROS".equals(format)) {
        return preViewFilePdf != null && numeroDePaginas != null && numeroDePaginas > 0;
    }
    return true;
}

@AssertTrue(message = "PDF/DOCX requieren páginas de preview si no es suscripción")
private boolean isPdfDocxPreviewValid() {
    if (("PDF".equals(format) || "DOCX".equals(format)) && !suscripcion) {
        return paginasPreView != null && paginasPreView > 0;
    }
    return true;
}

@AssertTrue(message = "Kits requieren situación significativa")
private boolean isKitValid() {
    if (isKits != null && isKits) {
        return situacionId != null;
    }
    return true;
}

@AssertTrue(message = "Suscripciones requieren tipo, materia y opción")
private boolean isSuscripcionValid() {
    if (suscripcion != null && suscripcion) {
        return subscriptionTypeId != null && 
               materiaId != null && 
               opcionId != null;
    }
    return true;
}
```

---

## 📐 DIAGRAMA DE FLUJO DE CREACIÓN

```
┌─────────────────────────────────────────────────────┐
│ 1. INFORMACIÓN BÁSICA                               │
│    - title, price, description                      │
└───────────────────┬─────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 2. CONFIGURACIÓN DE ACCESO                          │
│    - documentoLibre (price = 0)                     │
│    - suscripcion                                    │
└───────────────────┬─────────────────────────────────┘
                    ↓
            ┌───────┴───────┐
            │               │
        suscripcion?    NO ─────┐
            │ SÍ              │
            ↓                 ↓
┌────────────────────┐  ┌─────────────────────────────┐
│ 3A. SUSCRIPCIÓN    │  │ 3B. CONFIGURACIÓN DOCUMENTO │
│ - subscriptionType │  │ - category                  │
│ - materiasSusc.    │  │ - nivel                     │
│ - opcionesSusc.    │  │ - materia (condicional)     │
│                    │  │ - grado (condicional)       │
│ category =         │  │                             │
│ PLANIFICACION      │  │ ┌──────────────────────┐    │
│ (auto)             │  │ │ isKits checkbox      │    │
│                    │  │ │ (PLANIFICACION + ZIP)│    │
│                    │  │ └────────┬─────────────┘    │
└──────────┬─────────┘  └──────────┼─────────────────┘
           │                       │
           │                  isKits?
           │                       │ SÍ
           │                       ↓
           │            ┌──────────────────────┐
           │            │ - situacionesId      │
           │            │ - situacionesNombre  │
           │            └──────────┬───────────┘
           │                       │
           └───────────┬───────────┘
                       ↓
┌─────────────────────────────────────────────────────┐
│ 4. ARCHIVOS Y PREVISUALIZACIÓN                      │
│    - format (PDF/DOCX/ZIP/OTROS)                    │
└───────────────────┬─────────────────────────────────┘
                    ↓
        ┌───────────┴───────────┐
        │                       │
    format?                 format?
        │                       │
    ┌───┴───┐             ┌─────┴─────┐
   PDF    DOCX          ZIP        OTROS
    │       │             │             │
    ↓       ↓             ↓             ↓
┌──────┐ ┌──────┐   ┌──────────┐  ┌──────────┐
│ file │ │ file │   │ file     │  │ file     │
│      │ │ PDF  │   │ preview  │  │ preview  │
│ págPr│ │ págPr│   │ numPág   │  │ numPág   │
└──────┘ └──────┘   └──────────┘  └──────────┘
           (Word)      (manual)      (manual)

                    ↓
┌─────────────────────────────────────────────────────┐
│ 5. SUBMIT                                           │
│    - Validar todos los campos según tipo/formato    │
│    - Crear FormData con archivos                    │
│    - POST a backend                                 │
└─────────────────────────────────────────────────────┘
```

---

## 🔍 CAMPOS LEGACY A REVISAR

### ⚠️ **linkZip**
```typescript
linkZip: ['', [Validators.pattern('https?://.+')]]
```

**Problema:**
- Solo visible en modo edición
- Duplica funcionalidad de upload de archivos
- Inconsistente con flujo actual

**Recomendación:**
- ✅ **DEPRECAR COMPLETAMENTE**
- Usar solo `file` upload para todos los formatos
- Migrar datos existentes en BD si hay URLs

---

### ⚠️ **paginasPreView vs numeroPaginas**
```typescript
paginasPreView: number   // Páginas para extraer en preview (PDF/DOCX)
numeroPaginas: number    // Total páginas manual (ZIP/OTROS)
```

**Estado:**
- ✅ Bien diferenciados
- ✅ Lógica correcta por formato

---

## 🎯 PRIORIDADES DE IMPLEMENTACIÓN

### **FASE 1: Validaciones Críticas** ⚡
1. **P1**: Validaciones de archivos por formato (métodos `setupXxxValidations()`)
2. **P3**: Checkbox `isKits` habilitado condicionalmente
3. **P6**: DTOs en backend con validaciones `@AssertTrue`

**Tiempo estimado:** 2-3 horas

---

### **FASE 2: Limpieza y Refactorización** 🧹
1. **P2**: Deprecar campo `linkZip`
2. **P4**: Validación de categorías con mapa de requisitos
3. Actualizar tests unitarios

**Tiempo estimado:** 2 horas

---

### **FASE 3: UX Improvements** ✨
1. **P5**: Feedback visual de archivos requeridos
2. Mensajes de error específicos por formato
3. Loading states durante upload

**Tiempo estimado:** 1-2 horas

---

## 📝 CHECKLIST DE VERIFICACIÓN

### **Frontend (formulario-documentos.component.ts)**
- [ ] Validaciones dinámicas por formato
- [ ] `setupPdfValidations()`
- [ ] `setupDocxValidations()`
- [ ] `setupZipOtrosValidations()`
- [ ] `actualizarEstadoIsKits()` mejorado
- [ ] Deprecar `linkZip`
- [ ] Mapa de `categoryRequirements`
- [ ] Tests unitarios

### **Frontend (formulario-documentos.component.html)**
- [ ] Alertas informativas por formato
- [ ] Ocultar campos según formato
- [ ] Mostrar/ocultar `filePdfDelWord` (solo DOCX)
- [ ] Mostrar/ocultar `preViewFilePdf` (solo ZIP/OTROS)
- [ ] Mostrar/ocultar `paginasPreView` (solo PDF/DOCX)
- [ ] Mostrar/ocultar `numeroPaginas` (solo ZIP/OTROS)
- [ ] Deshabilitar `isKits` condicionalmente

### **Backend (DocumentsEntity.java)**
- [ ] Revisar campos nullable
- [ ] Validaciones en `@Column`
- [ ] Índices en BD para búsquedas

### **Backend (DTOs)**
- [ ] `DocumentCreateDTO` con validaciones
- [ ] `DocumentUpdateDTO` con validaciones
- [ ] `@AssertTrue` para validaciones condicionales
- [ ] Mensajes de error descriptivos

### **Backend (Service/Controller)**
- [ ] Validar archivos según formato
- [ ] Validar `filePdfDelWord` si DOCX
- [ ] Validar `preViewFilePdf` si ZIP/OTROS
- [ ] Validar `numeroPaginas` si ZIP/OTROS
- [ ] Validar situación si es kit
- [ ] Validar suscripción completa

---

## 🚀 PRÓXIMOS PASOS INMEDIATOS

1. **Crear métodos de validación por formato** en `formulario-documentos.component.ts`
2. **Actualizar listener de `format`** para llamar métodos específicos
3. **Mejorar `actualizarEstadoIsKits()`** con validación de formato
4. **Eliminar campo `linkZip`** del formulario
5. **Crear DTOs en backend** con validaciones `@AssertTrue`
6. **Testing completo** de todos los flujos:
   - Crear documento PDF normal
   - Crear documento DOCX normal
   - Crear kit ZIP
   - Crear documento suscripción
   - Crear documento OTROS

---

## 📊 RESUMEN EJECUTIVO

| **Aspecto**              | **Estado**                                      |
|--------------------------|-------------------------------------------------|
| **Formatos soportados**  | ✅ PDF, DOCX, ZIP, OTROS                        |
| **Tipos de documentos**  | ✅ Normal, Kit, Suscripción                     |
| **Validaciones básicas** | ✅ Implementadas                                |
| **Validaciones por formato** | ⚠️ PARCIAL - Necesita métodos específicos   |
| **Campo legacy**         | ⚠️ `linkZip` pendiente de deprecar            |
| **Checkbox isKits**      | ⚠️ Siempre habilitado - Necesita condicional  |
| **Backend DTOs**         | ❌ Faltan validaciones condicionales           |
| **Feedback visual**      | ❌ Falta información por formato               |

**Impacto:** MEDIO-ALTO  
**Complejidad:** MEDIA  
**Tiempo estimado total:** 5-7 horas  

---

**Última actualización:** 2024  
**Autor:** Análisis automatizado GitHub Copilot
