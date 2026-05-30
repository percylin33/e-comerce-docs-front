// Interceptor nativo para capturar errores HTTP antes de Angular/RxJS
declare global {
  interface Window {
    __LAST_PAYMENT_ERROR_RESPONSE__: any;
  }
}

export function setupNativeHttpErrorInterception(): void {
  if (typeof window === 'undefined') {
    return;
  }

  const OriginalXMLHttpRequest = window.XMLHttpRequest;

  function PatchedXMLHttpRequest() {
    const xhr = new OriginalXMLHttpRequest();
    
    const originalSend = xhr.send.bind(xhr);
    xhr.send = function(body?: Document | XMLHttpRequestBodyInit | null) {
      
      const originalOnReadyStateChange = xhr.onreadystatechange;
      xhr.onreadystatechange = function(ev) {
        if (xhr.readyState === 4 && xhr.status >= 400) {
          try {
            const responseData = JSON.parse(xhr.responseText);
            
            // Almacenar para errores de pago
            if (xhr.responseURL?.includes('/culqi/charge') || xhr.responseURL?.includes('/payment')) {
              window.__LAST_PAYMENT_ERROR_RESPONSE__ = responseData;
            }
            
          } catch (parseError) {
            // Ignorar errores de parsing silenciosamente
          }
        }
        
        if (originalOnReadyStateChange) {
          originalOnReadyStateChange.call(xhr, ev);
        }
      };
      
      return originalSend(body);
    };
    
    return xhr;
  }
  
  // Configurar prototype y constantes
  PatchedXMLHttpRequest.prototype = Object.create(OriginalXMLHttpRequest.prototype);
  PatchedXMLHttpRequest.prototype.constructor = PatchedXMLHttpRequest;
  
  // Copiar constantes XMLHttpRequest
  const constants = ['DONE', 'HEADERS_RECEIVED', 'LOADING', 'OPENED', 'UNSENT'];
  constants.forEach(constant => {
    const descriptor = Object.getOwnPropertyDescriptor(OriginalXMLHttpRequest, constant);
    if (descriptor && descriptor.value !== undefined) {
      Object.defineProperty(PatchedXMLHttpRequest, constant, {
        value: descriptor.value,
        writable: false,
        enumerable: true,
        configurable: true
      });
    }
  });
  
  // Reemplazar XMLHttpRequest global
  (window as any).XMLHttpRequest = PatchedXMLHttpRequest;
}