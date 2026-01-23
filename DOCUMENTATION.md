# 📚 Documentación Técnica - Carpeta Digital E-commerce Frontend

## 📋 Tabla de Contenidos

1. [Información General](#información-general)
2. [Arquitectura del Proyecto](#arquitectura-del-proyecto)
3. [Módulos Principales](#módulos-principales)
4. [Servicios Core](#servicios-core)
5. [Guards y Seguridad](#guards-y-seguridad)
6. [Componentes Principales](#componentes-principales)
7. [Flujos de Usuario](#flujos-de-usuario)
8. [APIs y Endpoints](#apis-y-endpoints)
9. [Responsive Design](#responsive-design)
10. [Deployment](#deployment)

---

## 📌 Información General

### Descripción
Plataforma e-commerce educativa para la compra y descarga de documentos académicos, con sistema de gestión de promotores y embajadores.

### Tecnologías
- **Framework**: Angular 15.2.10
- **UI Library**: Nebular 11.0.1
- **Estilos**: SCSS, Bootstrap 4.3.1
- **Iconos**: Eva Icons, Font Awesome, Ionicons
- **Pagos**: Culqi, PayPal
- **Autenticación**: JWT, OAuth2 (Google)
- **PDF**: ng2-pdf-viewer
- **Gráficos**: ApexCharts

### Versión
`11.0.0`

---

## 🏗️ Arquitectura del Proyecto

### Estructura de Directorios

```
src/app/
├── @auth/                      # Módulo de autenticación
│   ├── components/
│   │   ├── login/
│   │   ├── register/
│   │   └── request-password/
│   ├── auth-routing.module.ts
│   └── auth.module.ts
│
├── @core/                      # Servicios y lógica core
│   ├── backend/                # Servicios de API
│   ├── data/                   # Interfaces y modelos
│   ├── guards/                 # Guards de rutas
│   ├── interfaces/             # TypeScript interfaces
│   ├── mock/                   # Data de prueba
│   ├── services/               # Servicios compartidos
│   └── utils/                  # Utilidades
│
├── @theme/                     # Componentes de UI
│   ├── components/
│   │   ├── header/
│   │   ├── footer/
│   │   └── notification-bell/
│   ├── directives/
│   ├── layouts/
│   ├── pipes/
│   └── styles/
│
├── admin-promotor/             # Panel de promotores
│   ├── Embajador/
│   ├── components/
│   ├── retiros/
│   └── ventas/
│
├── dashboard-promotores/       # Dashboard administrativo
│   ├── contenido/
│   ├── dashboard/
│   ├── embajadores/
│   ├── legales/
│   ├── objetivos/
│   └── solicitud-retiro/
│
├── cuenta-usuario/             # Gestión de cuenta
│   ├── suscripciones/
│   └── perfil/
│
├── pages-admin/                # Administración
│   ├── dashboard-document/
│   ├── formulario-documentos/
│   ├── promotores/
│   └── suscripciones/
│
├── site/                       # Frontend público
│   ├── home/
│   ├── categorias/
│   ├── detail/
│   ├── checkout/
│   ├── descarga/
│   └── membresia-detail/
│
└── shared/                     # Componentes compartidos
    ├── component/
    ├── directives/
    └── pipes/
```

---

## 🔧 Módulos Principales

### 1. Auth Module (`@auth`)
**Propósito**: Manejo de autenticación y autorización.

**Componentes**:
- `LoginComponent`: Login tradicional + OAuth2 Google
- `RegisterComponent`: Registro de usuarios
- `RequestPasswordComponent`: Recuperación de contraseña

**Características**:
- JWT token storage
- Refresh token mechanism
- OAuth2 Google integration
- Remember me functionality

### 2. Core Module (`@core`)
**Propósito**: Servicios singleton y lógica de negocio.

**Servicios principales**:
- `AuthService`: Gestión de autenticación
- `DocumentData`: Manejo de documentos
- `PaymentService`: Procesamiento de pagos
- `CartService`: Carrito de compras
- `NotificationService`: Sistema de notificaciones

**Guards**:
- `AuthGuard`: Protección de rutas privadas
- `AdminGuard`: Acceso solo para administradores
- `PromotorGuard`: Acceso para promotores

### 3. Theme Module (`@theme`)
**Propósito**: Componentes de UI y layouts.

**Componentes**:
- `HeaderComponent`: Navegación principal
- `FooterComponent`: Pie de página
- `NotificationBellComponent`: Notificaciones en tiempo real
- `SidebarComponent`: Menú lateral

**Layouts**:
- `OneColumnLayout`: Layout de una columna
- `TwoColumnsLayout`: Layout de dos columnas
- `ThreeColumnsLayout`: Layout de tres columnas

### 4. Site Module
**Propósito**: Frontend público del e-commerce.

**Rutas principales**:
```typescript
/site/home                    // Página de inicio
/site/categorias/:service     // Catálogo de documentos
/site/detail/:id              // Detalle de documento
/site/checkout                // Proceso de compra
/site/descarga/:id            // Descarga de documentos
/site/membresia-detail/:id    // Detalle de membresía
```

### 5. Dashboard Promotores Module
**Propósito**: Panel de control para promotores.

**Componentes**:
- `DashboardComponent`: Métricas y estadísticas
- `EmbajadoresComponent`: Gestión de embajadores
- `SolicitudRetiroComponent`: Solicitudes de retiro
- `ContenidoComponent`: Material educativo
- `ObjetivosComponent`: Objetivos y comisiones

---

## 🔌 Servicios Core

### AuthService
```typescript
// Ubicación: src/app/@core/services/auth.service.ts

// Métodos principales
login(credentials): Observable<AuthResponse>
register(userData): Observable<AuthResponse>
loginWithGoogle(token): Observable<AuthResponse>
logout(): void
getCurrentUser(): UserEntity
isAuthenticated(): boolean
refreshToken(): Observable<AuthResponse>
```

### DocumentData Service
```typescript
// Ubicación: src/app/@core/data/documents.ts

// Métodos principales
getDocuments(page, limit): Observable<Document[]>
getDocumentById(id): Observable<Document>
filterDocuments(params): Observable<Document[]>
searchDocuments(field, value): Observable<Document[]>
getDocumentFree(): Observable<Document[]>
getSituacionesByNivel(nivel): Observable<Situacion[]>
```

### PaymentService
```typescript
// Ubicación: src/app/@core/services/payment.service.ts

// Métodos principales
processCulqiPayment(data): Observable<PaymentResponse>
processPayPalPayment(data): Observable<PaymentResponse>
getPaymentStatus(orderId): Observable<PaymentStatus>
validateCoupon(code): Observable<Coupon>
```

### CartService
```typescript
// Ubicación: src/app/@core/services/cart.service.ts

// Métodos principales
addToCart(document): void
removeFromCart(documentId): void
getCartItems(): Observable<CartItem[]>
getCartTotal(): number
clearCart(): void
applyDiscount(documents): number
```

### NotificationService
```typescript
// Ubicación: src/app/@core/services/notification.service.ts

// Métodos principales
getUnreadCount(): Observable<number>
getNotifications(): Observable<Notification[]>
markAsRead(notificationId): Observable<void>
markAllAsRead(): Observable<void>
// Polling cada 5 minutos
```

---

## 🛡️ Guards y Seguridad

### AuthGuard
```typescript
// Verifica autenticación JWT
canActivate(): boolean {
  if (this.authService.isAuthenticated()) {
    return true;
  }
  this.router.navigate(['/auth/login']);
  return false;
}
```

### AdminGuard
```typescript
// Verifica rol de administrador
canActivate(): boolean {
  const user = this.authService.getCurrentUser();
  if (user?.roles.includes('ADMIN')) {
    return true;
  }
  this.router.navigate(['/site/home']);
  return false;
}
```

### PromotorGuard
```typescript
// Verifica rol de promotor
canActivate(): boolean {
  const user = this.authService.getCurrentUser();
  if (user?.roles.includes('PROMOTOR')) {
    return true;
  }
  this.router.navigate(['/site/home']);
  return false;
}
```

---

## 🎨 Componentes Principales

### 1. Home Component
**Ruta**: `/site/home`
**Propósito**: Landing page con catálogo destacado

**Características**:
- Carrusel de documentos destacados
- Categorías principales
- Búsqueda global
- Documentos gratuitos
- Sección de membresías

### 2. Categorías Component
**Ruta**: `/site/categorias/:service`
**Propósito**: Navegación por categorías de documentos

**Servicios soportados**:
- PLANIFICACION (Sesiones de clase)
- EVALUACION (Instrumentos de evaluación)
- ESTRATEGIAS (Estrategias didácticas)
- RECURSOS (Material complementario)
- KITS (Paquetes de documentos)
- EBOOKS (Libros digitales)
- TALLERES (Material en ZIP)
- PLAN_LECTOR (Plan de lectura)
- REFORZAMIENTO (Material de refuerzo)
- MATERIAL_GRATIS (Recursos gratuitos)

**Filtros**:
- Nivel educativo (INICIAL, PRIMARIA, SECUNDARIA)
- Área curricular (COMUNICACION, MATEMATICA, etc.)
- Grado/ciclo específico
- Búsqueda por título

**Lógica de descuentos automáticos**:
```typescript
// KITS: Por situación didáctica + nivel
// REFORZAMIENTO: Por materia
// PLAN_LECTOR: Por nivel
```

### 3. Detail Component
**Ruta**: `/site/detail/:id`
**Propósito**: Detalle completo del documento

**Información mostrada**:
- Título y descripción
- Preview de imágenes
- Especificaciones técnicas
- Precio y descuentos
- Documentos relacionados
- Botón de compra/descarga

### 4. Checkout Component
**Ruta**: `/site/checkout`
**Propósito**: Proceso de pago

**Métodos de pago**:
1. **Culqi** (Tarjetas Perú)
   - Visa, Mastercard, Amex
   - Soles (PEN)
   
2. **PayPal** (Internacional)
   - PayPal account
   - Tarjetas internacionales
   - USD

**Flujo**:
```
1. Selección de método de pago
2. Ingreso de datos
3. Validación de cupón (opcional)
4. Procesamiento de pago
5. Confirmación
6. Redirección a descarga
```

### 5. Descarga Component
**Ruta**: `/site/descarga/:id`
**Propósito**: Descarga de documentos comprados

**Características**:
- Verificación de compra
- Generación de link temporal
- Download tracking
- Historial de descargas
- Límite de descargas

### 6. Dashboard Component (Promotores)
**Ruta**: `/dashboard-promotores/dashboard`
**Propósito**: Panel de control de promotores

**Métricas mostradas**:
- Ventas del mes
- Comisiones generadas
- Embajadores activos
- Solicitudes pendientes
- Actividad reciente
- Top embajadores

**Gráficos**:
- Ventas por mes (ApexCharts)
- Comisiones acumuladas
- Performance de embajadores

---

## 🔄 Flujos de Usuario

### Flujo de Compra
```
1. Usuario navega a /site/categorias/:service
2. Aplica filtros (nivel, área, grado)
3. Selecciona documento → /site/detail/:id
4. Agrega al carrito
5. Procede al checkout → /site/checkout
6. Selecciona método de pago (Culqi/PayPal)
7. Aplica cupón (opcional)
8. Confirma pago
9. Redirección a /site/purchase-confirmation/:orderId
10. Acceso a descarga → /site/descarga/:orderId
```

### Flujo de Autenticación
```
1. Usuario accede a /auth/login
2. Opciones:
   a) Login tradicional (email + password)
   b) Login con Google OAuth2
3. Validación de credenciales
4. Generación de JWT + Refresh token
5. Storage en localStorage
6. Redirección según rol:
   - USER → /site/home
   - ADMIN → /admin/dashboard
   - PROMOTOR → /admin-promotor/dashboard
```

### Flujo de Promotor
```
1. Promotor login → /admin-promotor
2. Dashboard con métricas
3. Gestión de embajadores:
   - Registro de nuevos embajadores
   - Asignación de códigos de referencia
   - Tracking de ventas por embajador
4. Solicitud de retiro:
   - Visualización de comisiones
   - Envío de solicitud
   - Tracking de estado
5. Acceso a contenido educativo
6. Visualización de objetivos y comisiones
```

---

## 🌐 APIs y Endpoints

### Base URL
```typescript
// Desarrollo
apiUrl: 'http://localhost:8080'

// Producción
apiUrl: 'https://api.carpetadigital.edu.pe'
```

### Endpoints Principales

#### Autenticación
```typescript
POST   /auth/login              // Login tradicional
POST   /auth/register           // Registro de usuario
POST   /auth/google             // OAuth2 Google
POST   /auth/refresh-token      // Renovar token
POST   /auth/logout             // Cerrar sesión
GET    /auth/user/:id           // Obtener usuario
POST   /auth/update-user        // Actualizar perfil
```

#### Documentos
```typescript
GET    /api/v1/documents                    // Listar documentos
GET    /api/v1/documents/:id                // Detalle de documento
GET    /api/v1/documents/filter             // Filtrar documentos
GET    /api/v1/documents/search             // Buscar documentos
GET    /api/v1/documents/free               // Documentos gratuitos
GET    /api/v1/documents/situaciones/:nivel // Situaciones por nivel
```

#### Pagos
```typescript
POST   /api/v1/payments/culqi              // Pago con Culqi
POST   /api/v1/payments/paypal             // Pago con PayPal
GET    /api/v1/payments/status/:orderId    // Estado de pago
POST   /api/v1/coupons/validate            // Validar cupón
```

#### Promotores
```typescript
GET    /api/v1/promotores/dashboard/:id           // Dashboard de promotor
GET    /api/v1/promotores/embajadores             // Listar embajadores
POST   /api/v1/promotores/embajadores/register    // Registrar embajador
GET    /api/v1/promotores/retiros                 // Solicitudes de retiro
POST   /api/v1/promotores/retiros                 // Crear solicitud
GET    /api/v1/promotores/ventas                  // Ventas del promotor
GET    /api/v1/promotores/comisiones              // Comisiones generadas
```

#### Notificaciones
```typescript
GET    /api/v1/notifications/:userId/unread-count    // Contador no leídas
GET    /api/v1/notifications/:userId                 // Listar notificaciones
PUT    /api/v1/notifications/:id/read                // Marcar como leída
PUT    /api/v1/notifications/:userId/read-all        // Marcar todas leídas
```

---

## 📱 Responsive Design

### Breakpoints Definidos
```scss
// Breakpoints principales
$mobile: 575px;
$tablet: 767px;
$desktop: 991px;
$large-desktop: 1199px;

// Media queries
@media (max-width: 575px) { /* Mobile */ }
@media (max-width: 767px) { /* Tablet */ }
@media (max-width: 991px) { /* Desktop */ }
```

### Componentes Responsive Implementados

#### Dashboard Promotores
Todos los componentes fueron optimizados con patrón **table → cards**:

1. **Dashboard Component**
   - Últimas solicitudes de retiro
   - Top embajadores del mes
   - Actividad reciente
   
2. **Embajadores Component**
   - Tabla de embajadores → Cards con avatar
   - Filtros stack vertical en mobile
   
3. **Solicitud Retiro Component**
   - Tabla de solicitudes → Cards
   - Modal responsive (max-height 95vh)
   
4. **Contenido Component**
   - Tabla de videos → Cards con iconos
   - Tabla de recursos → Cards con tipos de archivo
   
5. **Objetivos Component**
   - Tabla de comisiones → Cards con badge gradient
   
6. **Legales Component**
   - Tabla de términos → Cards con estados

**Patrón CSS Implementado**:
```scss
.table-view-component { display: block; }
.cards-view-component { display: none; }

@media (max-width: 767px) {
  .table-view-component { display: none; }
  .cards-view-component { display: block; }
}
```

#### Site Components

**Home**: 
- Carrusel adaptable
- Grid de categorías (4 cols → 2 cols → 1 col)
- Cards de documentos stack vertical

**Categorías**:
- Filtros en accordion mobile
- Cards de documentos 2 columnas mobile
- Sticky filters en desktop

**Checkout**:
- Modal de pago full-screen mobile
- Botones full-width en mobile
- Formularios stack vertical

**Detail**:
- Imágenes full-width mobile
- Info stack vertical
- Botón de compra sticky bottom

---

## 🚀 Deployment

### Build de Producción

```bash
# 1. Instalar dependencias
npm install

# 2. Build de producción
npm run build:prod

# Salida en /dist
```

### Configuración de Producción

**environment.prod.ts**:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.carpetadigital.edu.pe',
  CULQI_PUBLIC_KEY: 'pk_live_bc049f968b0dbb2b',
  PAYPAL_PUBLIC: 'AdNDY5yuJJ9_dKEhxmNr94DKzemL7qPJ5vAzzJ5ud3OP-6JlDDZmXoddyxRjrPz6K0G0O-x2mt_ml03d',
  GOOGLE_CLIENT_ID: '1091653603242-sqt221va2bku0thp5vn5hd9cmqqnrf9k.apps.googleusercontent.com'
};
```

### Servidor Web

**Nginx Configuration**:
```nginx
server {
    listen 80;
    server_name www.carpetadigital.net;

    root /var/www/carpetadigital/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass https://api.carpetadigital.edu.pe;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Apache .htaccess**:
```apache
RewriteEngine On
RewriteCond %{DOCUMENT_ROOT}%{REQUEST_URI} -f [OR]
RewriteCond %{DOCUMENT_ROOT}%{REQUEST_URI} -d
RewriteRule ^ - [L]
RewriteRule ^ /index.html [L]
```

### Checklist de Deployment

- [ ] Ejecutar `npm run build:prod`
- [ ] Verificar bundle size < 7MB
- [ ] Verificar environment.prod.ts
- [ ] Subir archivos de /dist al servidor
- [ ] Configurar redirects del servidor
- [ ] Verificar SSL (HTTPS)
- [ ] Probar flujos críticos:
  - [ ] Login/Registro
  - [ ] Búsqueda de documentos
  - [ ] Checkout con Culqi
  - [ ] Checkout con PayPal
  - [ ] Descarga de documentos
  - [ ] Dashboard de promotores

### Variables de Entorno

Asegurarse de configurar en el servidor:
```bash
# API Backend
API_URL=https://api.carpetadigital.edu.pe

# Pagos
CULQI_PUBLIC_KEY=pk_live_bc049f968b0dbb2b
PAYPAL_PUBLIC=<paypal_production_key>

# OAuth2
GOOGLE_CLIENT_ID=<google_client_id>
```

---

## 📊 Métricas y Optimización

### Bundle Size
```
Initial Bundle: 5.20 MB
Estimated Transfer: 928.51 kB
Build Time: ~35 segundos
```

### Lighthouse Score (Target)
- Performance: > 85
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 95

### Optimizaciones Aplicadas
- ✅ Lazy loading de módulos
- ✅ Tree shaking habilitado
- ✅ Minification y uglification
- ✅ GZIP compression
- ✅ Image optimization (WebP)
- ✅ CSS purge (unused styles)

---

## 🔧 Mantenimiento

### Actualización de Dependencias
```bash
# Ver outdated packages
npm outdated

# Actualizar Angular
ng update @angular/cli @angular/core

# Actualizar Nebular
ng update @nebular/theme

# Actualizar todas las dependencias
npm update
```

### Debugging

**Chrome DevTools**:
- Angular DevTools extension
- Network tab para API calls
- Console para errores
- Application → LocalStorage para JWT

**VSCode Launch Configuration**:
```json
{
  "type": "chrome",
  "request": "launch",
  "name": "Launch Chrome",
  "url": "http://localhost:4200",
  "webRoot": "${workspaceFolder}"
}
```

---

## 📝 Notas Adicionales

### Convenciones de Código

**Nomenclatura de componentes**:
```
nombre-componente.component.ts
nombre-componente.component.html
nombre-componente.component.scss
nombre-componente.component.spec.ts
```

**Nomenclatura de servicios**:
```
nombre-servicio.service.ts
nombre-servicio.service.spec.ts
```

**Nomenclatura de variables**:
```typescript
// camelCase para variables y funciones
const userName = 'John';
function getUserData() {}

// PascalCase para clases e interfaces
class UserEntity {}
interface UserData {}

// UPPERCASE para constantes
const API_URL = 'https://api.example.com';
```

### Git Workflow
```bash
# Branches principales
main          # Producción
develop       # Desarrollo
feature/*     # Nuevas características
bugfix/*      # Corrección de bugs
hotfix/*      # Correcciones urgentes

# Commits
feat: nueva característica
fix: corrección de bug
docs: documentación
style: formato de código
refactor: refactorización
test: tests
chore: tareas de mantenimiento
```

---

## 🤝 Contribución

Para contribuir al proyecto:

1. Fork del repositorio
2. Crear branch de feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

---

## 📞 Soporte

Para soporte técnico:
- Email: soporte@carpetadigital.edu.pe
- Documentación: [Docs](./DOCUMENTATION.md)
- Issues: [GitHub Issues](https://github.com/percylin33/e-comerce-docs-front/issues)

---

**Última actualización**: Noviembre 2025
**Versión de documentación**: 1.0.0
