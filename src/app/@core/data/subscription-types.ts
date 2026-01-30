import { Observable } from 'rxjs';

// Tipo para niveles educativos
export type NivelEducativo = 'INICIAL' | 'PRIMARIA' | 'SECUNDARIA' | 'TODOS';

// Interface para Opción de precio
export interface Opcion {
  id?: number;
  nombre: string;
  antes: number;
  ahora: number;
  exclusivo: boolean;
}

// Interface para Materia
export interface Materia {
  id?: number;
  nombre: string;
  muestra: string;
  afiche: string;
  beneficios: string[];
  opciones: Opcion[];
}

// Interface completa para SubscriptionType (respuesta del backend)
export interface SubscriptionType {
  id: number;
  nombre: string;
  descripcion: string;

  // Campos de Marketing
  textoDescuento?: string;
  textoPrecio?: string;
  notaPrecio?: string;

  // Flags de Destacado
  esRecomendada: boolean;
  esPopular: boolean;

  // Control de Visualización
  posicion: number;
  activo: boolean;
  colorBadge?: string;

  // Nivel Educativo
  nivel: NivelEducativo;

  // Soporte para Unidades Históricas
  esEspecial?: boolean; // Indica si ofrece acceso a unidades históricas
  descuentoUnidadesPasadas?: number; // Porcentaje de descuento (0-100)

  // Tipo de periodo: 'M' = mensual, 'A' = anual
  tipoPeriodo?: 'M' | 'A';

  tieneUnidadesVigentes?: boolean; // Indica si tiene un cronograma activo hoy

  // Beneficios generales propios de la membresía
  beneficiosGenerales?: string[];

  // Materias asociadas
  materias: Materia[];
}

// Interface simplificada para tarjetas de membresía (frontend)
export interface MembresiaCard {
  id: number;
  titulo: string;
  descuento?: string;
  precio: string;
  descripcion: string;
  isRecommended: boolean;
  popular: boolean;
  nivel: NivelEducativo;
  colorBadge?: string;
  beneficios: string[];

  // Soporte para Unidades Históricas
  esVersionHistorica?: boolean; // Indica si esta tarjeta es la versión histórica
  subscriptionTypeOriginalId?: number; // ID real del SubscriptionType (si es versión histórica)
  descuentoHistorico?: number; // Porcentaje de descuento aplicado
  posicion?: number; // Posición para ordenamiento
  tieneUnidadesVigentes?: boolean; // Pre-calculado del backend
  permiteCuotas?: boolean; // Indica si permite pago en cuotas
}

// Interface para creación/actualización (DTO)
export interface SubscriptionTypeDto {
  id?: number;
  nombre: string;
  descripcion: string;
  textoDescuento?: string;
  textoPrecio?: string;
  notaPrecio?: string;
  esRecomendada?: boolean;
  esPopular?: boolean;
  posicion?: number;
  activo?: boolean;
  colorBadge?: string;
  nivel?: NivelEducativo;
  beneficiosGenerales?: string[];
  materias?: Materia[];
}

// Abstract service para inyección de dependencias
export abstract class SubscriptionTypesData {
  abstract getAll(): Observable<SubscriptionType[]>;
  abstract getById(id: number): Observable<SubscriptionType>;
  abstract getByNivel(nivel: NivelEducativo): Observable<SubscriptionType[]>;
  abstract getAllActive(): Observable<SubscriptionType[]>;
  abstract getTitulos(id: number): Observable<string[]>;

  // Métodos admin (requieren autenticación SUPADMIN)
  abstract create(dto: SubscriptionTypeDto): Observable<SubscriptionType>;
  abstract update(id: number, dto: SubscriptionTypeDto): Observable<SubscriptionType>;
  abstract toggleActivo(id: number): Observable<SubscriptionType>;
  abstract updatePosicion(id: number, nuevaPosicion: number): Observable<SubscriptionType>;
  abstract delete(id: number): Observable<any>;
}
