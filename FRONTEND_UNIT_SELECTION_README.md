# Frontend Adaptation - Subscription Unit Selection System

## Resumen de Cambios

Este documento describe las adaptaciones realizadas en el frontend Angular para soportar el nuevo sistema de entitlements basado en unidades/cronogramas del backend.

### Fecha de Implementación
Diciembre 2025

---

## 1. Cambios en Interfaces TypeScript

### 1.1 Interface `PostPayment` (`payments.ts`)
**Ubicación:** `src/app/@core/interfaces/payments.ts`

```typescript
export interface PostPayment {
  // ... campos existentes ...
  unidadNumero?: number; // NUEVO: Número de unidad del cronograma seleccionado
}
```

**Propósito:** Permitir enviar el número de unidad seleccionado al backend durante el proceso de pago.

### 1.2 Interface `CartItem` (`cartItem.ts`)
**Ubicación:** `src/app/@core/interfaces/cartItem.ts`

```typescript
export interface CartItem {
  // ... campos existentes ...
  unidadNumero?: number; // NUEVO: Número de unidad/proyecto del cronograma seleccionado
}
```

**Propósito:** Almacenar el número de unidad seleccionado en el carrito de compras.

---

## 2. Nuevos Servicios y API

### 2.1 Backend API Endpoint
**Nueva Ruta:** `GET /api/v1/unit-schedule/subscription-type/{subscriptionTypeId}?anio={anio}`

**Parámetros:**
- `subscriptionTypeId` (requerido): ID del tipo de suscripción
- `anio` (opcional): Año del cronograma. Si no se proporciona, usa el año actual

**Respuesta:**
```json
[
  {
    "id": 1,
    "subscriptionTypeId": 1,
    "unidadNumero": 1,
    "titulo": "Proyecto 1: Conociendo mi cuerpo",
    "fechaInicio": "2025-03-01",
    "fechaFin": "2025-04-15",
    "anio": 2025
  }
]
```

### 2.2 UnitScheduleRepository (Backend)
**Ubicación:** `UnitScheduleRepository.java`

**Nuevo Método:**
```java
List<UnitSchedule> findBySubscriptionTypeIdAndAnio(Long subscriptionTypeId, int anio);
```

### 2.3 UnitScheduleService (Frontend)
**Ubicación:** `src/app/@core/backend/services/unit-schedule.service.ts`

**Nuevo Método:**
```typescript
getBySubscriptionType(subscriptionTypeId: number, anio?: number): Observable<UnitSchedule[]>
```

**Uso:**
```typescript
this.unitScheduleService.getBySubscriptionType(subscriptionTypeId, 2025)
  .subscribe(units => {
    console.log('Unidades disponibles:', units);
  });
```

---

## 3. Componente de Selección de Membresía

### 3.1 MembresiaDetailComponent
**Ubicación:** `src/app/site/membresia-detail/membresia-detail.component.ts`

#### Nuevos Campos
```typescript
availableUnits: UnitSchedule[] = [];      // Unidades disponibles para la suscripción
selectedUnitId: number | null = null;      // ID de la unidad seleccionada
loadingUnits: boolean = false;             // Estado de carga
```

#### Nuevos Métodos

**`loadAvailableUnits(subscriptionTypeId: number)`**
- Carga las unidades disponibles desde el backend
- Se ejecuta automáticamente después de cargar la membresía
- Si solo hay una unidad disponible, la selecciona automáticamente

**`getSelectedUnit(): UnitSchedule | undefined`**
- Retorna la unidad completa seleccionada actualmente

**`formatDate(dateString: string): string`**
- Formatea fechas en formato legible (español-Perú)

#### Modificaciones en `goToCheckout()`
```typescript
const selectedUnit = this.getSelectedUnit();
if (!selectedUnit) {
  // Muestra error si no hay unidad seleccionada
  this.notificationService.showError('Debes seleccionar un proyecto/unidad', 'Error');
  return;
}

const subscriptionItem: CartItem = {
  // ... campos existentes ...
  unidadNumero: selectedUnit.unidadNumero, // NUEVO
};
```

---

## 4. Interfaz de Usuario

### 4.1 Template HTML
**Ubicación:** `src/app/site/membresia-detail/membresia-detail.component.html`

#### Nueva Sección: Unit Selection
```html
<div class="unit-selection-section">
  <h4 class="section-title">
    <i class="icon-calendar"></i>
    Selecciona el Proyecto/Unidad:
  </h4>
  
  <!-- Loading State -->
  <div *ngIf="loadingUnits" class="loading-units">
    <p>Cargando proyectos disponibles...</p>
  </div>
  
  <!-- No Units Available -->
  <div *ngIf="!loadingUnits && availableUnits.length === 0" class="no-units-message">
    <p class="warning-text">⚠️ No hay proyectos disponibles para este año.</p>
  </div>
  
  <!-- Units List -->
  <div *ngIf="!loadingUnits && availableUnits.length > 0" class="units-list">
    <div *ngFor="let unit of availableUnits" 
         class="unit-card" 
         [class.selected]="selectedUnitId === unit.id"
         (click)="selectedUnitId = unit.id">
      <div class="unit-radio">
        <input type="radio" 
               [id]="'unit-' + unit.id" 
               name="unitSelection" 
               [(ngModel)]="selectedUnitId">
        <label [for]="'unit-' + unit.id">
          <div class="unit-info">
            <h5 class="unit-title">
              <span class="unit-number">Unidad {{ unit.unidadNumero }}</span>
              <span class="unit-name">{{ unit.titulo }}</span>
            </h5>
            <div class="unit-dates">
              <span class="date-info">
                📅 Desde: <strong>{{ formatDate(unit.fechaInicio) }}</strong>
              </span>
              <span class="date-info">
                📅 Hasta: <strong>{{ formatDate(unit.fechaFin) }}</strong>
              </span>
            </div>
          </div>
        </label>
      </div>
    </div>
  </div>
</div>
```

### 4.2 Estilos CSS
**Ubicación:** `src/app/site/membresia-detail/membresia-detail.component.scss`

**Características:**
- Diseño responsive para móviles, tablets y desktop
- Estilos de selección visual (border azul, fondo resaltado)
- Estados hover para mejor UX
- Animaciones suaves de transición
- Formato de fechas legible

**Clases principales:**
- `.unit-selection-section`: Contenedor principal
- `.unit-card`: Tarjeta individual de cada unidad
- `.unit-card.selected`: Estado seleccionado
- `.loading-units`: Estado de carga
- `.no-units-message`: Mensaje de advertencia

---

## 5. Componente de Checkout

### 5.1 CheckoutComponent
**Ubicación:** `src/app/site/checkout/checkout.component.ts`

#### Modificaciones Realizadas

**1. createOrder() - Metadata de PayPal/Orden**
```typescript
const metadata = {
  // ... campos existentes ...
  unidadNumero: this.cartItems.find(item => item.isSubscription && item.unidadNumero)?.unidadNumero,
};
```

**2. culqiHandler() - Payment Data de Culqi**
```typescript
const paymentData: PostPayment = {
  // ... campos existentes ...
  unidadNumero: subscriptionItem?.unidadNumero,
};
```

**3. initPaypalPayment() - DTO de PayPal**
```typescript
const dto: any = {
  // ... campos existentes ...
  unidadNumero: this.cartItems.find(item => item.isSubscription && item.unidadNumero)?.unidadNumero,
};
```

---

## 6. Flujo de Usuario Completo

### Paso 1: Selección de Membresía
1. Usuario navega a `/membresia-detail/{id}`
2. El componente carga la información de la membresía
3. **NUEVO:** El componente carga automáticamente las unidades disponibles para el año actual
4. Si solo hay una unidad, se selecciona automáticamente

### Paso 2: Personalización
1. Usuario selecciona materias y opciones deseadas
2. **NUEVO:** Usuario selecciona el proyecto/unidad que desea comprar:
   - Ve el número de unidad
   - Ve el título descriptivo del proyecto
   - Ve las fechas de inicio y fin
   - Puede hacer clic en cualquier tarjeta para seleccionar

### Paso 3: Validación
1. Al hacer clic en "Ir al Checkout"
2. Sistema valida que se haya seleccionado una unidad
3. Si no hay unidad seleccionada, muestra error y no permite continuar

### Paso 4: Checkout
1. La información de la unidad seleccionada se guarda en el `CartItem`
2. En el checkout, el `unidadNumero` se incluye en todos los requests de pago
3. El backend recibe el `unidadNumero` y crea los entitlements correspondientes

---

## 7. Consideraciones Técnicas

### 7.1 Manejo de Años
- Por defecto, el frontend solicita unidades del año actual
- El backend puede devolver unidades de años diferentes si se especifica el parámetro `anio`
- Futura mejora: Permitir al usuario seleccionar el año manualmente

### 7.2 Validaciones
- **Frontend:** Verifica que se haya seleccionado una unidad antes de agregar al carrito
- **Backend:** Valida que el `unidadNumero` exista y pertenezca al `subscriptionType`

### 7.3 Estados de Carga
- `loadingUnits = true`: Mientras se cargan las unidades desde el backend
- `availableUnits.length === 0`: Muestra mensaje de advertencia
- `selectedUnitId === null`: Usuario no ha seleccionado ninguna unidad

### 7.4 Auto-selección
Si solo hay una unidad disponible, se selecciona automáticamente para mejorar la UX:
```typescript
if (this.availableUnits.length === 1) {
  this.selectedUnitId = this.availableUnits[0].id;
}
```

---

## 8. Diagrama de Flujo

```
┌─────────────────────────────────────┐
│ Usuario ingresa a Membresía Detail │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│ loadMembresia(id)                   │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│ loadAvailableUnits(id)              │
│ ↓ GET /api/v1/unit-schedule/        │
│   subscription-type/{id}?anio=2025  │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│ Mostrar lista de unidades           │
│ con radio buttons                   │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│ Usuario selecciona unidad           │
│ selectedUnitId = unit.id            │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│ Usuario hace clic en                │
│ "Ir al Checkout"                    │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│ goToCheckout()                      │
│ ↓ Valida selectedUnitId             │
│ ↓ Obtiene selectedUnit.unidadNumero │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│ Crea CartItem con                   │
│ unidadNumero: selectedUnit.unidadNu…│
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│ Navega a /checkout                  │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│ CheckoutComponent                   │
│ ↓ Incluye unidadNumero en:          │
│   - createOrder (metadata)          │
│   - culqiHandler (paymentData)      │
│   - initPaypalPayment (dto)         │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│ Backend recibe unidadNumero         │
│ ↓ PaymentService.saveSuscripcion... │
│ ↓ SubscriptionEntitlementService    │
│ ↓ Crea entitlements con acceso      │
│   temporal basado en unidadNumero   │
└─────────────────────────────────────┘
```

---

## 9. Testing

### 9.1 Tests Manuales Recomendados

1. **Test de Carga de Unidades**
   - Navegar a `/membresia-detail/1`
   - Verificar que se carguen las unidades disponibles
   - Verificar formato de fechas correcto

2. **Test de Selección**
   - Seleccionar diferentes unidades
   - Verificar cambio visual de estado (borde azul, fondo)
   - Verificar que solo una unidad pueda estar seleccionada

3. **Test de Validación**
   - Intentar ir al checkout sin seleccionar unidad
   - Verificar mensaje de error
   - Seleccionar unidad y proceder exitosamente

4. **Test de Pago Culqi**
   - Completar compra con Culqi
   - Verificar que `unidadNumero` se envíe en el request
   - Verificar en backend que se creen entitlements correctos

5. **Test de Pago PayPal**
   - Completar compra con PayPal
   - Verificar que `unidadNumero` se envíe en el request
   - Verificar en backend que se creen entitlements correctos

6. **Test de Una Sola Unidad**
   - Configurar membresía con una sola unidad disponible
   - Verificar auto-selección automática

7. **Test de Sin Unidades**
   - Eliminar todas las unidades de un `subscriptionType`
   - Verificar mensaje de advertencia
   - Verificar que no se pueda proceder al checkout

### 9.2 Tests de Responsividad
- Desktop (>768px)
- Tablet (768px - 480px)
- Mobile (< 480px)

---

## 10. Futuras Mejoras

### 10.1 Selector de Año
Permitir al usuario seleccionar el año del cronograma:
```typescript
<select [(ngModel)]="selectedYear" (change)="loadAvailableUnits(subscriptionTypeId)">
  <option value="2025">2025</option>
  <option value="2026">2026</option>
</select>
```

### 10.2 Información Adicional
Mostrar más detalles de cada unidad:
- Descripción del proyecto
- Cantidad de documentos incluidos
- Preview de contenido

### 10.3 Filtros y Búsqueda
Para suscripciones con muchas unidades:
- Búsqueda por título
- Filtro por rango de fechas
- Agrupación por trimestre/semestre

---

## 11. Archivos Modificados

### Backend
- ✅ `UnitScheduleController.java` - Nuevo endpoint
- ✅ `UnitScheduleRepository.java` - Nuevo método de consulta

### Frontend
- ✅ `src/app/@core/interfaces/payments.ts` - Interface `PostPayment`
- ✅ `src/app/@core/interfaces/cartItem.ts` - Interface `CartItem`
- ✅ `src/app/@core/backend/api/unit-schedule.api.ts` - Nuevo método API
- ✅ `src/app/@core/backend/services/unit-schedule.service.ts` - Nuevo método servicio
- ✅ `src/app/site/membresia-detail/membresia-detail.component.ts` - Lógica de selección
- ✅ `src/app/site/membresia-detail/membresia-detail.component.html` - UI de selección
- ✅ `src/app/site/membresia-detail/membresia-detail.component.scss` - Estilos
- ✅ `src/app/site/checkout/checkout.component.ts` - Integración con pago

---

## 12. Contacto y Soporte

Para preguntas o issues relacionados con esta implementación:
- Revisar el código backend en `ENTITLEMENTS_REFACTOR_README.md`
- Revisar tests en `TESTS_README.md`
- Contactar al equipo de desarrollo

---

**Última actualización:** Diciembre 2025  
**Versión:** 1.0.0  
**Estado:** ✅ Implementado y Funcionando
