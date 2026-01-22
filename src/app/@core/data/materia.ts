export interface Materia {
  id: number;
  nombre: string;
  muestra: string[];
  afiche: string;
  beneficios: string[];
  subscriptionTypeId: number;
  activo: boolean;
  opciones: Opcion[];
}

export interface MateriaDto {
  nombre: string;
  muestra: string[];
  afiche: string;
  beneficios: string[];
  subscriptionTypeId: number;
  activo?: boolean;
}

export interface Opcion {
  id: number;
  nombre: string;
  antes: number;
  ahora: number;
  posicion: number;
  exclusivo: boolean;
  activo: boolean;
  materiaId: number;
}

export interface OpcionDto {
  nombre: string;
  antes: number;
  ahora: number;
  posicion?: number;
  exclusivo?: boolean;
  activo?: boolean;
  materiaId: number;
}

export abstract class MateriaData {
  abstract getById(id: number): Observable<Materia>;
  abstract getBySubscriptionType(subscriptionTypeId: number, incluirInactivas?: boolean): Observable<Materia[]>;
  abstract getActivasBySubscriptionType(subscriptionTypeId: number): Observable<Materia[]>;
  abstract create(dto: MateriaDto): Observable<Materia>;
  abstract update(id: number, dto: MateriaDto): Observable<Materia>;
  abstract delete(id: number): Observable<void>;
  abstract toggleActivo(id: number): Observable<Materia>;
  abstract updatePosicion(id: number, nuevaPosicion: number): Observable<Materia>;
}

export abstract class OpcionData {
  abstract getById(id: number): Observable<Opcion>;
  abstract getByMateria(materiaId: number, incluirInactivas?: boolean): Observable<Opcion[]>;
  abstract getActivasByMateria(materiaId: number): Observable<Opcion[]>;
  abstract create(dto: OpcionDto): Observable<Opcion>;
  abstract update(id: number, dto: OpcionDto): Observable<Opcion>;
  abstract delete(id: number): Observable<void>;
  abstract toggleActivo(id: number): Observable<Opcion>;
  abstract updatePosicion(id: number, nuevaPosicion: number): Observable<Opcion>;
}

import { Observable } from 'rxjs';
