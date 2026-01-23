# 🚀 Carpeta Digital E-commerce Frontend

[![Angular](https://img.shields.io/badge/Angular-15.2.10-red)](https://angular.io/)
[![Nebular](https://img.shields.io/badge/Nebular-11.0.1-blue)](https://akveo.github.io/nebular/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Build](https://img.shields.io/badge/Build-Passing-brightgreen)](https://github.com/percylin33/e-comerce-docs-front)

Plataforma e-commerce educativa para la compra y descarga de documentos académicos, con sistema de gestión de promotores y embajadores. Desarrollada con Angular 15 y Nebular UI.

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#️-tecnologías)
- [Prerequisitos](#-prerequisitos)
- [Instalación](#-instalación)
- [Configuración](#️-configuración)
- [Desarrollo](#-desarrollo)
- [Build](#-build)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Documentación](#-documentación)
- [Contribución](#-contribución)
- [Licencia](#-licencia)

---

## ✨ Características

### 🛒 E-commerce
- ✅ Catálogo de documentos educativos por categorías
- ✅ Sistema de filtros avanzado (nivel, área, grado)
- ✅ Búsqueda inteligente con sugerencias
- ✅ Carrito de compras con descuentos automáticos
- ✅ Sistema de cupones
- ✅ Preview de documentos (imágenes)
- ✅ Documentos gratuitos

### 💳 Pagos
- ✅ **Culqi** - Tarjetas peruanas (Visa, Mastercard, Amex)
- ✅ **PayPal** - Pagos internacionales
- ✅ Procesamiento seguro con PCI compliance
- ✅ Confirmación por email
- ✅ Historial de compras

### 📚 Categorías de Documentos
- **PLANIFICACION** - Sesiones de clase DOCX
- **EVALUACION** - Instrumentos de evaluación
- **ESTRATEGIAS** - Estrategias didácticas
- **RECURSOS** - Material complementario
- **KITS** - Paquetes de documentos ZIP con descuentos
- **EBOOKS** - Libros digitales
- **TALLERES** - Material educativo en ZIP
- **PLAN_LECTOR** - Plan de lectura
- **REFORZAMIENTO** - Material de refuerzo
- **MATERIAL_GRATIS** - Recursos descargables sin costo

### 👤 Autenticación
- ✅ Login tradicional (email + contraseña)
- ✅ OAuth2 con Google
- ✅ JWT con refresh tokens
- ✅ Recuperación de contraseña
- ✅ Gestión de perfil con upload de imágenes

### 👥 Sistema de Promotores
- ✅ Dashboard con métricas en tiempo real
- ✅ Gestión de embajadores
- ✅ Sistema de comisiones
- ✅ Solicitudes de retiro
- ✅ Códigos de referencia
- ✅ Material educativo exclusivo
- ✅ Notificaciones en tiempo real

### 📱 Responsive Design
- ✅ Mobile-first approach
- ✅ Adaptive layouts (320px - 2560px)
- ✅ Touch-friendly interfaces
- ✅ Progressive Web App ready
- ✅ Cross-browser compatibility

### 🔔 Notificaciones
- ✅ Sistema de notificaciones en tiempo real
- ✅ Polling inteligente (cada 5 minutos)
- ✅ Badge con contador
- ✅ Marcado de leídas/no leídas
- ✅ Historial completo

---

## 🛠️ Tecnologías

### Core
- **Angular** 15.2.10
- **TypeScript** 4.9.x
- **RxJS** 6.6.2
- **Zone.js** 0.11.4

### UI Framework
- **Nebular** 11.0.1 (Eva Design System)
- **Bootstrap** 4.3.1
- **Angular Material** 15.2.9
- **SCSS** (Styling)

### Librerías Destacadas
- **ng2-pdf-viewer** 9.1.2 - Preview de PDFs
- **ng-apexcharts** 1.7.6 - Gráficos y estadísticas
- **ngx-paypal** 11.0.0 - Integración PayPal
- **jwt-decode** 4.0.0 - Decodificación JWT
- **html2canvas** 1.4.1 - Captura de pantalla
- **jspdf** 3.0.2 - Generación de PDFs
- **swiper** 11.1.14 - Carruseles
- **leaflet** 1.2.0 - Mapas interactivos

### Desarrollo
- **Angular CLI** 15.2.10
- **ESLint** 8.57.1
- **Karma + Jasmine** - Testing
- **Compodoc** - Documentación automática

---

## 📦 Prerequisitos

Asegúrate de tener instalado:

- **Node.js** >= 14.14.0 (Recomendado: 16.x o 18.x)
- **npm** >= 6.14.0
- **Angular CLI** >= 15.2.0

```bash
# Verificar versiones
node --version
npm --version
ng version
```

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/percylin33/e-comerce-docs-front.git
cd e-comerce-docs-front
```

### 2. Instalar dependencias

```bash
npm install
```

**Nota**: Si encuentras errores con `node-sass`, usa Node.js 14.14+ o ejecuta:
```bash
npm rebuild node-sass
```

### 3. Configurar variables de entorno

Edita `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080', // URL de tu backend
  GOOGLE_CLIENT_ID: 'tu-google-client-id',
  CULQI_PUBLIC_KEY: 'tu-culqi-test-key',
  PAYPAL_PUBLIC: 'tu-paypal-sandbox-key',
  ORDER: 'tu-culqi-order-id'
};
```

---

## ⚙️ Configuración

### Backend API

Configura la URL del backend en:
- `src/environments/environment.ts` (desarrollo)
- `src/environments/environment.prod.ts` (producción)

```typescript
apiUrl: 'https://api.carpetadigital.edu.pe'
```

### Claves de Pago

#### Culqi (Perú)
```typescript
CULQI_PUBLIC_KEY: 'pk_test_...' // Sandbox
CULQI_PUBLIC_KEY: 'pk_live_...' // Producción
```

#### PayPal
```typescript
PAYPAL_PUBLIC: 'sandbox-key' // Sandbox
PAYPAL_PUBLIC: 'production-key' // Producción
```

### OAuth2 Google

1. Crear proyecto en [Google Console](https://console.cloud.google.com/)
2. Habilitar Google+ API
3. Configurar OAuth consent screen
4. Crear credenciales OAuth 2.0
5. Agregar URIs autorizados:
   ```
   http://localhost:4200
   https://www.carpetadigital.net
   ```
6. Copiar Client ID a `environment.ts`

---

## 💻 Desarrollo

### Servidor de desarrollo

```bash
npm start
# o
ng serve
```

Navega a `http://localhost:4200/`. La aplicación se recargará automáticamente al modificar archivos.

### Con host específico

```bash
ng serve --host 0.0.0.0 --port 4200
```

### Con proxy API

Crea `proxy.conf.json`:
```json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true
  }
}
```

Ejecuta:
```bash
ng serve --proxy-config proxy.conf.json
```

---

## 🏗️ Build

### Build de desarrollo

```bash
npm run build
```

### Build de producción

```bash
npm run build:prod
```

Genera archivos optimizados en `/dist`:
- Minificación
- Tree shaking
- AOT compilation
- Source maps deshabilitados
- Bundle size < 7MB

### Análisis de bundle

```bash
npm run build:analyze
```

Abre el analizador de webpack para inspeccionar el tamaño del bundle.

---

## 🧪 Testing

### Unit tests

```bash
npm test
```

Ejecuta tests con Karma.

### Test con coverage

```bash
npm run test:coverage
```

Genera reporte de cobertura en `/coverage`.

### E2E tests

```bash
npm run e2e
```

Ejecuta tests end-to-end con Protractor.

---

## 🌐 Deployment

### 1. Build de producción

```bash
npm run build:prod
```

### 2. Verificar archivos

Asegúrate de que `/dist` contenga:
- `index.html`
- Archivos JS y CSS minificados
- Assets (imágenes, fuentes, etc.)

### 3. Subir al servidor

#### Opción A: Nginx

```bash
# Copiar archivos
scp -r dist/* usuario@servidor:/var/www/carpetadigital/

# Configurar Nginx
server {
    listen 80;
    server_name www.carpetadigital.net;
    root /var/www/carpetadigital;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### Opción B: Apache

```bash
# Copiar archivos
scp -r dist/* usuario@servidor:/var/www/html/carpetadigital/

# Crear .htaccess
RewriteEngine On
RewriteCond %{DOCUMENT_ROOT}%{REQUEST_URI} -f [OR]
RewriteCond %{DOCUMENT_ROOT}%{REQUEST_URI} -d
RewriteRule ^ - [L]
RewriteRule ^ /index.html [L]
```

#### Opción C: Vercel/Netlify

```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod
```

### 4. Configurar SSL

Usa Let's Encrypt para HTTPS gratuito:

```bash
sudo certbot --nginx -d www.carpetadigital.net
```

### 5. Verificar deployment

Checklist:
- [ ] HTTPS funcionando
- [ ] Redirects configurados
- [ ] API conectada correctamente
- [ ] Login/Registro funcional
- [ ] Pagos en modo producción
- [ ] Descarga de documentos operativa

---

## 📁 Estructura del Proyecto

```
e-comerce-docs-front/
├── src/
│   ├── app/
│   │   ├── @auth/              # Módulo de autenticación
│   │   ├── @core/              # Servicios core y lógica de negocio
│   │   ├── @theme/             # Componentes de UI y layouts
│   │   ├── admin-promotor/     # Panel de promotores
│   │   ├── dashboard-promotores/ # Dashboard administrativo
│   │   ├── cuenta-usuario/     # Gestión de cuenta
│   │   ├── pages-admin/        # Administración
│   │   ├── site/               # Frontend público
│   │   ├── shared/             # Componentes compartidos
│   │   ├── app.module.ts
│   │   └── app-routing.module.ts
│   │
│   ├── assets/                 # Recursos estáticos
│   │   ├── images/
│   │   ├── icons/
│   │   └── documents/
│   │
│   ├── environments/           # Configuración de entornos
│   │   ├── environment.ts      # Desarrollo
│   │   └── environment.prod.ts # Producción
│   │
│   ├── index.html
│   ├── main.ts
│   ├── styles.scss
│   └── ...
│
├── angular.json                # Configuración de Angular
├── package.json                # Dependencias
├── tsconfig.json              # Configuración TypeScript
├── README.md                  # Este archivo
└── DOCUMENTATION.md           # Documentación técnica detallada
```

---

## 📚 Documentación

### 📖 Documentación Técnica Completa
Ver [**DOCUMENTATION.md**](./DOCUMENTATION.md) para detalles completos sobre:
- Arquitectura y estructura del proyecto
- Descripción detallada de módulos y componentes
- APIs y endpoints
- Servicios y guards
- Flujos de usuario
- Patrones de responsive design
- Guías de deployment y mantenimiento

### 📋 Otros Documentos
- [CHANGELOG.md](./CHANGELOG.md) - Historial de cambios
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Guía de contribución
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) - Código de conducta
- [PDF_REPORTS_README.md](./PDF_REPORTS_README.md) - Generación de reportes PDF
- [RELOAD_FIX_README.md](./RELOAD_FIX_README.md) - Fix para recarga en servidor

---

## 🤝 Contribución

¡Las contribuciones son bienvenidas!

### Cómo contribuir

1. **Fork** del repositorio
2. **Crear branch** para tu feature
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```
3. **Commit** tus cambios
   ```bash
   git commit -m 'feat: agregar nueva funcionalidad'
   ```
4. **Push** al branch
   ```bash
   git push origin feature/nueva-funcionalidad
   ```
5. **Abrir Pull Request**

### Convenciones de Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: nueva característica
fix: corrección de bug
docs: documentación
style: formato de código
refactor: refactorización
test: agregar tests
chore: tareas de mantenimiento
```

### Code Review

Todos los PRs serán revisados antes de merge. Asegúrate de:
- ✅ Pasar todos los tests
- ✅ Seguir las convenciones de código
- ✅ Actualizar documentación
- ✅ Agregar tests para nuevas features

---

## 🐛 Reporte de Bugs

¿Encontraste un bug? [Crear Issue](https://github.com/percylin33/e-comerce-docs-front/issues/new)

Incluye:
- Descripción del problema
- Pasos para reproducir
- Comportamiento esperado vs actual
- Screenshots (si aplica)
- Versión del navegador/OS

---

## 📊 Estado del Proyecto

### Versión Actual
`v11.0.0` - Noviembre 2025

### Próximas Features
- [ ] PWA completo con service workers
- [ ] Notificaciones push
- [ ] Chat en vivo con soporte
- [ ] Sistema de reviews y ratings
- [ ] Wishlists personalizadas
- [ ] Recomendaciones con ML

---

## 📞 Soporte

### Canales de Soporte
- 📧 Email: soporte@carpetadigital.edu.pe
- 💬 Issues: [GitHub Issues](https://github.com/percylin33/e-comerce-docs-front/issues)
- 📖 Docs: [Documentación Técnica](./DOCUMENTATION.md)

### FAQ

**P: ¿Cómo configuro las claves de pago?**  
R: Ver sección [Configuración](#️-configuración)

**P: ¿El backend es necesario?**  
R: Sí, este frontend consume APIs del backend. Repo: [Ecommerce-docs-back](https://github.com/percylin33/Ecommerce-docs-back)

**P: ¿Soporta otros métodos de pago?**  
R: Actualmente Culqi y PayPal. Para agregar más, extender `PaymentService`.

**P: ¿Es compatible con Angular 16+?**  
R: La migración a Angular 16+ está en roadmap. Actualmente estable en Angular 15.

---

## 🔐 Seguridad

### Reporte de Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad, **NO** abras un issue público.

Envía un email a: security@carpetadigital.edu.pe

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

---

## 👥 Equipo

Desarrollado con ❤️ por el equipo de **Carpeta Digital**

- **Percy Lin** - Lead Developer - [@percylin33](https://github.com/percylin33)

### Tecnologías Base
Este proyecto está construido sobre:
- [ngx-admin](https://github.com/akveo/ngx-admin) - Angular Admin Template
- [Nebular](https://github.com/akveo/nebular) - Angular UI Library
- [Eva Icons](https://github.com/akveo/eva-icons) - Icon System

---

**Hecho en Perú 🇵🇪 | Última actualización: Noviembre 2025**
