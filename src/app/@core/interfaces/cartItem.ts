export interface CartItem {
    id: number; // Identificador único
    title: string; // Nombre del producto
    description: string; // Descripción del producto
    price: number; // Precio del producto
    imagenUrlPublic?: string; // URL de la imagen del producto
    isSubscription: boolean; // Tipo de producto
    totalCuotas?: number; // Número de cuotas (opcional)
    cuotasPagadas?: number; // Número de cuotas pagadas (opcional)
    montoPorCuota?: number; // Precio por cuota (opcional)
    suscriptionTypeId?: number; // Tipo de suscripción (opcional)
    montoTotal?: number; // Monto total (opcional)
    documentoLibre?: boolean; // Indica si es un documento libre (opcional)
    materiasSeleccionadas?: {
      id: number;
      nombre: string;
      opcionesSeleccionadas: {
        nombre: string;
        antes: number;
        ahora: number;
        seleccionada: boolean;
        exclusivo: boolean;
      }[];
    }[];
  }