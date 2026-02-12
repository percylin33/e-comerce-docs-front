# Plan de Pruebas - Sistema de Interceptación de Errores

## Problema Original
El frontend Angular mostraba errores como funciones corruptas (`()=>L`, `()=>m`) en lugar de mensajes de error significativos del backend.

## Solución Implementada
Sistema de interceptación de errores a tres niveles:

### 1. Nivel HttpService (Interceptación Más Baja)
- **Archivo**: `src/app/@core/backend/api/http.service.ts`
- **Función**: Intercepta errores antes de que RxJS los corrompa
- **Logs a buscar**: 
  - `🔴 [HttpService] RAW ERROR INTERCEPTED`
  - `💾 [HttpService] Preserved error`

### 2. Nivel PaymentsApi (Enriquecimiento)
- **Archivo**: `src/app/@core/backend/api/payments.api.ts`
- **Función**: Enriquece datos preservados del HttpService
- **Logs a buscar**: 
  - `🚨 [PaymentsApi] Error received from HttpService`
  - `💾 [PaymentsApi] Final enriched error`

### 3. Nivel Componente (Extracción y Display)
- **Archivo**: `src/app/site/checkout/checkout.component.ts`
- **Función**: Extrae mensaje final para mostrar al usuario
- **Logs a buscar**: 
  - `🎯 [DEBUG] Extracted from preserved errorData`
  - `🎯 [DEBUG] Using context-based detection`

## Casos de Prueba

### Caso 1: Error de Tarjeta con CVV Inválido
1. Ir a checkout con una suscripción
2. Usar datos de tarjeta: `4444333322221111` con CVV inválido `111`
3. Esperar error backend: `"[CULQI] CVV de la tarjeta inválido (Error Code: DNGE0031, HTTP: 402)"`
4. **Resultado esperado**: Usuario ve: `"CVV de la tarjeta inválido"`

### Caso 2: Error de Tarjeta Inválida
1. Usar tarjeta completamente inválida
2. **Resultado esperado**: Mensaje limpio sin prefijos [CULQI] ni códigos de error

## Logs de Debugging
Los logs aparecerán en orden:
1. `🔴 [HttpService] RAW ERROR INTERCEPTED` - Error interceptado a nivel más bajo
2. `🚨 [PaymentsApi] Error received from HttpService` - Error enriquecido
3. `🎯 [DEBUG] Extracted from preserved errorData` - Mensaje final extraído

## Verificación del Funcionamiento
- ✅ Backend responde con estructura: `{ result: false, data: "[CULQI] mensaje (Error Code: XXX)", status: 402 }`
- ✅ HttpService preserva error completo antes de corrupción RxJS
- ✅ PaymentsApi enriquece con datos preservados
- ✅ Componente extrae mensaje limpio sin prefijos/códigos
- ✅ Usuario ve mensaje profesional y útil

## Estado Actual
- ✅ Compilación exitosa
- ✅ Frontend corriendo en http://localhost:4200
- ✅ Backend corriendo con Spring Boot
- 🧪 **Pendiente**: Verificar funcionamiento con error real

## Comandos de Verificación
```bash
# Frontend
npm start -- --port 4200

# Backend  
cd "c:\Users\USUARIO\Desktop\CARPETA-DIGITAL\Ecommerce-docs-back"
mvn spring-boot:run
```