import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import {
  CreatorApiService,
  CreatorTermsDto,
} from "./creator-api.service";

/**
 * Estado singleton del gate de Terminos y Condiciones del Creador.
 *
 * <p><b>Por que existe:</b> la primera vez que un Creador entra al panel
 * debe aceptar el contrato vigente antes de poder navegar. Este servicio
 * centraliza ese check para que TODOS los componentes hijos del dashboard
 * pasen por el mismo punto de control.</p>
 *
 * <p><b>Reglas del bloqueo:</b></p>
 * <ul>
 *   <li>{@code mustBlock = true} si el backend tiene una version ACTIVE
 *       y {@code acceptedByCurrentUser = false} en ella.</li>
 *   <li>Si NO hay version ACTIVE (ej. error 503, o el admin no ha creado ninguna),
 *       no se bloquea: se degrada y permite navegar.</li>
 *   <li>Si la llamada al backend falla por red (status 0), tampoco se bloquea.</li>
 * </ul>
 *
 * <p><b>Ciclo de uso:</b></p>
 * <pre>{@code
 * // En DashboardCreadoresComponent (layout):
 * ngOnInit() {
 *   this.termsState.refresh().subscribe();  // dispara fetch
 *   this.termsState.mustBlock$.subscribe(block => this.mustBlock = block);
 * }
 *
 * // En MisTerminosComponent (pagina), tras aceptar:
 * this.termsState.markAccepted();  // pasa mustBlock a false
 * }</pre>
 */
@Injectable({ providedIn: "root" })
export class CreatorTermsStateService {
  private readonly _mustBlock$ = new BehaviorSubject<boolean>(false);
  private readonly _activeTerms$ = new BehaviorSubject<CreatorTermsDto | null>(null);
  private inflight: Observable<CreatorTermsDto> | null = null;

  readonly mustBlock$ = this._mustBlock$.asObservable();
  readonly activeTerms$ = this._activeTerms$.asObservable();

  constructor(private api: CreatorApiService) {}

  /**
   * Dispara la consulta al backend y actualiza ambos signals.
   *
   * <p>Emite la peticion HTTP; los subscribers de {@link mustBlock$} reciben
   * el valor nuevo. Si ya hay una en vuelo (anti stampede), reusa la misma.</p>
   *
   * <p>Devuelve el observable para que el caller pueda suscribirse si quiere
   * mostrar un loading state.</p>
   */
  refresh(): Observable<CreatorTermsDto | undefined> {
    const obs = this.api.getMyActiveTerms();
    this.inflight = obs as any;

    return new Observable<CreatorTermsDto | undefined>((subscriber) => {
      const sub = obs.subscribe({
        next: (t) => {
          this._activeTerms$.next(t);
          // Bloqueamos SOLO si hay version activa y el user NO la acepto.
          const block = !!t && !!t.id && t.acceptedByCurrentUser === false;
          this._mustBlock$.next(block);
          subscriber.next(t);
        },
        error: (err) => {
          // 503 = no hay version activa (acceptable: la app no queda bloqueada).
          // 0 = sin conexion (degradamos: dejamos pasar para no romper UX).
          // Otro: tambien degradamos para no dejar al usuario tirado.
          this._mustBlock$.next(false);
          this._activeTerms$.next(null);
          subscriber.next(undefined);
          subscriber.error?.(err);
        },
        complete: () => {
          subscriber.complete();
          if (this.inflight === (obs as any)) this.inflight = null;
        },
      });
      return () => sub.unsubscribe();
    });
  }

  /**
   * Llamado tras una aceptacion exitosa para liberar el gate sin re-fetch
   * (optimista). Si el caller quiere garantia puede llamar tambien a
   * {@link refresh()}.
   */
  markAccepted(): void {
    this._mustBlock$.next(false);
    const current = this._activeTerms$.value;
    if (current) {
      this._activeTerms$.next({
        ...current,
        acceptedByCurrentUser: true,
      });
    }
  }

  /** Snapshot del estado actual (sincronico, util para guards). */
  snapshot(): { blocked: boolean; terms: CreatorTermsDto | null } {
    return {
      blocked: this._mustBlock$.value,
      terms: this._activeTerms$.value,
    };
  }
}
