import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { DocumentsService } from '../../@core/backend/services/documents.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Observable, Subject, of, forkJoin, EMPTY } from 'rxjs';
import { takeUntil, map, catchError, switchMap, tap, finalize } from 'rxjs/operators';
import { DocumentData, Situaciones } from '../../@core/interfaces/documents';
import { NbToastrService, NbSpinnerModule } from '@nebular/theme';
import { MembresiaService } from '../../@core/backend/services/membresia.service';
import { SubscriptionTypesData, SubscriptionType } from '../../@core/data/subscription-types';
import { Materias, Opciones } from '../../@core/interfaces/membresia';
import { GradeHierarchyService } from '../../@core/backend/services/grade-hierarchy.service';
import { HierarchyItem } from '../../@core/interfaces/grade-hierarchy';
import { HierarchyEditorModalComponent } from './hierarchy-editor-modal/hierarchy-editor-modal.component';
import { MatFormField, MatLabel, MatError, MatPrefix, MatHint } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { MatOption, MatOptgroup } from '@angular/material/core';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatCheckbox } from '@angular/material/checkbox';

@Component({
    selector: 'ngx-formulario-documentos',
    templateUrl: './formulario-documentos.component.html',
    styleUrls: ['./formulario-documentos.component.scss'],
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, NbSpinnerModule, MatFormField, MatLabel, MatInput, MatError, MatPrefix, MatSelect, MatOption, MatHint, MatOptgroup, MatTooltip, MatIconButton, MatIcon, MatCheckbox, MatButton]
})
export class FormularioDocumentosComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  private documentsService = inject(DocumentData);
  private snackBar = inject(MatSnackBar);
  private cd = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private toastrService = inject(NbToastrService);
  private membresiaService = inject(MembresiaService);
  private subscriptionService = inject(SubscriptionTypesData);
  private gradeHierarchyService = inject(GradeHierarchyService);
  private dialog = inject(MatDialog);

  private readonly destroy$ = new Subject<void>();

  // Flag para silenciar handlers durante carga inicial del documento
  private loadingDocument = false;

  id!: string;
  mode!: string;
  documentForm!: FormGroup;
  file: File | null = null;
  fileError: string | null = null;
  isLoading = false;
  pdfSrc: SafeResourceUrl | null = null;
  ready = false;
  images: File[] = [];
  imagesError: string | null = null;

  // ✅ Arrays dinámicos desde backend
  categories: HierarchyItem[] = [];
  niveles: HierarchyItem[] = [];
  materias: HierarchyItem[] = [];
  grados: HierarchyItem[] = [];
  
  // Arrays estáticos que no cambia
  formatos = ['PDF', 'DOCX', 'ZIP','OTROS'];
  subscriptionTypes = [
    { id: 1, nombre: 'Membresia Mensual Inicial' },
    { id: 2, nombre: 'Membresia Mensual Primaria' },
    { id: 3, nombre: 'Membresia Mensual Secundaria' },
    { id: 4, nombre: 'Membresia Anual Secundaria' }
  ];
  
  // Flags de carga
  loadingCategories = false;
  loadingNiveles = false;
  loadingMaterias = false;
  loadingGrados = false;
  detalleMaterias: string[] = [];
  filePdfDelWord: File | null = null;
  filePdfDelWordError: string | null = null;
  preViewFilePdf: File | null = null;
  preViewFilePdfError: string | null = null;

  // Modo de subida: archivo físico o URL de Google Drive
  fileInputMode: 'upload' | 'url' = 'upload';
  driveUrl: string = '';
  driveUrlError: string | null = null;

  // Archivos existentes del documento (solo modo edición)
  existingImageUrl: string | null = null;
  existingPdfPreviewUrlRaw: string | null = null;
  existingPdfPreviewUrl: SafeResourceUrl | null = null;
  loadingDownloadUrl = false;
  loadingViewUrl = false;
  uploadingImage = false;
  uploadingPdfPreview = false;
  uploadingMainDoc = false;

  materiasSuscripcion: Materias[] = [];
  opcionesSuscripcion: Opciones[] = [];
  allMateriasData: Materias[] = [];

  // Propiedades para situaciones
  situaciones: Situaciones[] = [];
  mostrarNuevaSituacion = false;

  // Gestión inline de situaciones (crear / editar)
  modoGestionSituacion: 'none' | 'crear' | 'editar' = 'none';
  situacionFormData: {
    id?: number;
    nombre: string;
    nivel: string;
    unidadNumero: number | null;
    anio: number | null;
    activo: boolean;
    borradoLogico: boolean;
  } = { nombre: '', nivel: '', unidadNumero: null, anio: null, activo: true, borradoLogico: false };

  // ✅ NUEVO: Propiedades para unidades programáticas
  unitSchedules: any[] = [];
  unitScheduleYears: number[] = [];

  // Flag para controlar visibilidad de sección de configuración
  showDocumentConfig = true;

  // Track si el formulario fue modificado (para guard de cambios no guardados)
  private formDirty = false;

  // Getter para validar si el formulario puede ser enviado
  get canSubmitForm(): boolean {
    // En modo edición, validar campos básicos + coherencia de suscripción
    if (this.mode === 'edit') {
      const title = this.documentForm.get('title')?.value;
      const description = this.documentForm.get('description')?.value;
      const format = this.documentForm.get('format')?.value;
      
      // Validar campos básicos obligatorios
      if (!title || title.trim() === '' || title.length < 3) return false;
      if (!description || description.trim() === '' || description.length < 3) return false;
      if (!format || format.trim() === '') return false;

      // Bloquear si el usuario ingresó una URL de Drive con formato inválido
      if (this.driveUrlError) return false;

      // Si es suscripción, validar que los campos de suscripción estén completos
      const isSuscripcion = this.documentForm.get('suscripcion')?.value;
      if (isSuscripcion) {
        if (!this.documentForm.get('subscriptionType')?.value) return false;
        if (!this.documentForm.get('unitScheduleId')?.value) return false;
      }

      // Validar DOCX requiere filePdfDelWord solo si se subió nuevo archivo DOCX
      if (format === 'DOCX' && this.file && !this.filePdfDelWord) return false;

      return true;
    }

    // Modo create: validar formulario completo
    if (this.documentForm.invalid) return false;

    // Validar preViewFilePdf para ZIP/OTROS
    const format = this.documentForm.get('format')?.value;
    if ((format === 'ZIP' || format === 'OTROS') && !this.preViewFilePdf) return false;

    // Validar archivo principal
    const hasFileOrUrl = !!this.file || (this.fileInputMode === 'url' && this.driveUrl.trim() !== '');
    if (!hasFileOrUrl) return false;

    // Validar DOCX requiere PDF adicional
    if (format === 'DOCX' && !this.filePdfDelWord) return false;

    return true;
  }

  ngOnInit(): void {
    // Obtener parámetros de la ruta
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.id = params['id'] || null;
      // If no explicit mode is provided but an id exists, assume edit mode
      this.mode = params['mode'] || (this.id ? 'edit' : 'create');
      console.debug('route params resolved', { mode: this.mode, id: this.id });
    });

    this.initForm();
    this.loadSubscriptionTypes();
    
    // ✅ Cargar categorías desde backend
    this.loadCategories();

    // ✅ Setup listeners ANTES de cargar el documento
    this.setupFormListeners();

    if (this.mode === 'edit') {
      this.loadDocument(this.id);
    } else {
      this.ready = true;
    }
  }

  private loadSubscriptionTypes(): void {
    this.mostrarNuevaSituacion = false; // no relacionado, pero asegurar estado
    this.subscriptionService.getAllActive().subscribe({
      next: (data: SubscriptionType[]) => {
        // Mapear para el select si es necesario
        this.subscriptionTypes = data.map(s => ({ id: s.id, nombre: s.nombre }));
      },
      error: (err) => {
        console.error('Error cargando tipos de suscripción activos:', err);
        // Mantener los valores por defecto si falla
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.documentForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(3)]],
      format: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(10)]],
      price: [0, [Validators.required, Validators.min(0)]],
      category: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      nivel: ['', Validators.required],
      grado: [{ value: '', disabled: true }],
      materia: [{ value: '', disabled: true }],
      documentoLibre: [false, Validators.required],
      isKits: [{ value: false, disabled: true }], // ✅ DESHABILITADO por defecto
      situacionesId: [{ value: '', disabled: true }],
      situacionesNombre: [{ value: '', disabled: true }],
      numeroPaginas: [{ value: '', disabled: true }, [Validators.required, Validators.min(1)]],
      paginasPreView: [{ value: '', disabled: true }], // ✅ NUEVO: Páginas para preview
      suscripcion: [false, Validators.required],
      subscriptionType: [{ value: '', disabled: true }],
      materiasSuscripcion: [{ value: '', disabled: true }],
      opcionesSuscripcion: [{ value: '', disabled: true }],
      unitScheduleId: [{ value: '', disabled: true }], // ✅ NUEVO: Unidad programática para kits y suscripciones
    });
  }

  private loadDocument(id: string): void {
    this.ready = false;
    this.loadingDocument = true;
    this.documentsService.getDocument(id).pipe(takeUntil(this.destroy$)).subscribe((response) => {
      

      // ✅ Determinar si es suscripción y ajustar visibilidad
      const isSuscripcion = response.data.suscripcion === true;
      this.showDocumentConfig = !isSuscripcion;

      // Patchar campos estáticos primero (no tocar selects dependientes todavía)
      this.documentForm.patchValue({
        title: response.data.title,
        description: response.data.description,
        format: response.data.format,
        price: response.data.price,
        category: response.data.category,
        documentoLibre: response.data.documentoLibre,
        isKits: false, // Inicializar en false, se detectará automáticamente después
        numeroPaginas: response.data.numeroDePaginas,
        suscripcion: response.data.suscripcion || false
      });

      // Cargar y seleccionar jerarquía dependiente (niveles -> materias -> grados)
      // Extraer códigos reales desde el objeto grade (tiene la jerarquía completa con codes correctos)
      // Los campos string como raw.materia contienen el NAME, no el code — no sirven para findIdByCode
      const raw: any = response.data;
      const gradeObj = raw.grade;

      const categoriaCode = gradeObj?.subject?.level?.category?.code || raw.category;
      const nivelCode = gradeObj?.subject?.level?.code || raw.nivel || raw.level;
      const materiaCode = gradeObj?.subject?.code || (typeof (raw.materia || raw.subject) === 'object' ? (raw.materia || raw.subject)?.code : null) || raw.materia;
      const gradoValue = gradeObj?.code || (typeof (raw.grade || raw.grado) === 'string' ? (raw.grade || raw.grado) : null);

      console.debug('loadDocument: raw values', {
        'raw.category': raw.category,
        'raw.materia': raw.materia,
        'raw.nivel': raw.nivel,
        'raw.grado': raw.grado,
        'raw.grade': raw.grade ? { code: raw.grade.code, name: raw.grade.name, subject: raw.grade.subject?.code, level: raw.grade.subject?.level?.code } : null
      });
      console.debug('loadDocument: resolved codes', { categoriaCode, nivelCode, materiaCode, gradoValue });

      if (categoriaCode) {
        const categoryId = this.findIdByCode(this.categories, categoriaCode);
        if (!categoryId) {
          console.error('No se encontró categoryId para code:', categoriaCode);
          this.loadingDocument = false;
        } else {
          // cargar niveles para la categoría y luego seleccionar el nivel del servidor
          this.gradeHierarchyService.getLevels(categoryId).pipe(takeUntil(this.destroy$)).subscribe({
            next: (niveles) => {
              this.niveles = niveles.sort((a, b) => (a.position || 0) - (b.position || 0));
              console.debug('loadDocument: niveles cargados', this.niveles.map(n => ({ id: n.id, code: n.code, name: n.name })));
              // Seleccionar nivel si viene del servidor (usar code o name)
              if (nivelCode) {
                this.documentForm.get('nivel')?.setValue(nivelCode);
                console.debug('loadDocument: nivel setValue =', nivelCode);
              }

              // Cargar materias para ese nivel y seleccionar materia
              if (nivelCode) {
                const levelId = this.findIdByCode(this.niveles, nivelCode);
                console.debug('loadDocument: findIdByCode(niveles, nivelCode) =', levelId, '| nivelCode =', nivelCode);
                if (!levelId) {
                  console.warn('loadDocument: CASCADE STOPPED — no levelId found for nivelCode:', nivelCode);
                  this.loadingDocument = false;
                  return;
                }
                this.gradeHierarchyService.getSubjects(levelId).pipe(takeUntil(this.destroy$)).subscribe({
                  next: (materias) => {
                    this.materias = materias;
                    console.debug('loadDocument: materias cargadas', this.materias.map(m => ({ id: m.id, code: m.code, name: m.name })));
                    // Si el servidor envía materia (código o nombre), habilitar y setear
                    if (materiaCode) {
                      this.documentForm.get('materia')?.enable();
                      this.documentForm.get('materia')?.setValue(materiaCode);
                      console.debug('loadDocument: materia setValue =', materiaCode);
                    }

                    // Cargar grados si materia también está presente
                    if (materiaCode) {
                      const subjectId = this.findIdByCode(this.materias, materiaCode);
                      console.debug('loadDocument: findIdByCode(materias, materiaCode) =', subjectId, '| materiaCode =', materiaCode);
                      if (!subjectId) {
                        console.warn('loadDocument: CASCADE STOPPED — no subjectId found for materiaCode:', materiaCode,
                          '| available codes:', this.materias.map(m => m.code));
                        this.loadingDocument = false;
                        return;
                      }
                      this.gradeHierarchyService.getGrades(subjectId).pipe(takeUntil(this.destroy$)).subscribe({
                        next: (grados) => {
                          this.grados = grados;
                          console.debug('loadDocument: grados cargados', this.grados.map(g => ({ id: g.id, code: g.code, name: g.name })));
                          // Seleccionar grado si viene del servidor
                          if (gradoValue) {
                            this.documentForm.get('grado')?.enable();
                            this.documentForm.get('grado')?.setValue(gradoValue);
                            console.debug('loadDocument: grado setValue =', gradoValue);
                          }
                          this.loadingDocument = false;
                          console.debug('loadDocument: CASCADE COMPLETE ✅');
                        },
                        error: (err) => {
                          console.error('Error cargando grados durante inicialización:', err);
                          this.loadingDocument = false;
                        }
                      });
                    } else {
                      this.loadingDocument = false;
                    }
                  },
                  error: (err) => {
                    console.error('Error cargando materias durante inicialización:', err);
                    this.loadingDocument = false;
                  }
                });
              } else {
                this.loadingDocument = false;
              }
            },
            error: (err) => {
              console.error('Error cargando niveles durante inicialización:', err);
              this.loadingDocument = false;
            }
          });
        }
      } else {
        this.loadingDocument = false;
      }

      // ✅ Poblar campos de suscripción si es un documento de suscripción
      if (isSuscripcion) {
        // Habilitar controles de suscripción
        this.documentForm.get('subscriptionType')?.enable();
        this.documentForm.get('materiasSuscripcion')?.enable();
        this.documentForm.get('opcionesSuscripcion')?.enable();
        this.documentForm.get('unitScheduleId')?.enable();

        // Establecer subscriptionType
        if (response.data.subscriptionTypeId) {
          this.documentForm.patchValue({
            subscriptionType: response.data.subscriptionTypeId
          });

          // Cargar materias/opciones y unidades en paralelo, luego pre-seleccionar
          forkJoin([
            this.membresiaService.getMateriasOpciones(response.data.subscriptionTypeId).pipe(catchError(() => of(null))),
            this.documentsService.getUnitSchedulesBySubscriptionType(response.data.subscriptionTypeId).pipe(catchError(() => of([])))
          ]).pipe(takeUntil(this.destroy$)).subscribe(([materiasResponse, unitSchedulesResponse]) => {
            // Poblar materias
            if (materiasResponse?.result && materiasResponse?.data?.length > 0) {
              this.allMateriasData = materiasResponse.data;
              this.materiasSuscripcion = materiasResponse.data;
              this.documentForm.get('materiasSuscripcion')?.enable();
            }

            // Poblar unidades programáticas
            if (unitSchedulesResponse && Array.isArray(unitSchedulesResponse)) {
              this.unitSchedules = unitSchedulesResponse;
              const years = this.unitSchedules
                .map(u => u.anio || u.year)
                .filter((year, index, self) => year && self.indexOf(year) === index);
              this.unitScheduleYears = years.sort((a, b) => b - a);
            }

            // Pre-seleccionar materia (datos ya cargados, sin race condition)
            if (response.data.materiaId) {
              this.documentForm.patchValue({ materiasSuscripcion: response.data.materiaId });
              // Cargar opciones de esta materia de forma síncrona (allMateriasData ya está poblado)
              this.onMateriaSuscripcionChange(response.data.materiaId);
              // Pre-seleccionar opción (opciones ya pobladas por onMateriaSuscripcionChange)
              if (response.data.opcionId) {
                this.documentForm.patchValue({ opcionesSuscripcion: response.data.opcionId });
              }
            }

            // Pre-seleccionar unidad programática
            if (response.data.unitScheduleId) {
              this.documentForm.patchValue({ unitScheduleId: response.data.unitScheduleId });
            }

            this.cd.detectChanges();
          });
        }

      // Poblar campos relacionados a suscripción incluso cuando suscripcion === false
      } else {
        if (response.data.materiaId) {
          this.documentForm.patchValue({ materiasSuscripcion: response.data.materiaId });
          this.onMateriaSuscripcionChange(response.data.materiaId);
          if (response.data.opcionId) {
            this.documentForm.patchValue({ opcionesSuscripcion: response.data.opcionId });
          }
        }

        if (response.data.unitScheduleId) {
          this.documentForm.patchValue({ unitScheduleId: response.data.unitScheduleId });
        }
      }

      // Detectar automáticamente si es un kit (PLANIFICACION + ZIP)
      const isAutoKit = response.data.category === 'PLANIFICACION' && 
                        (response.data.format.toLowerCase() === 'zip');
      
      if (isAutoKit) {
        this.documentForm.patchValue({ isKits: true });
        
        // Forzar la actualización de los campos dependientes
        this.documentForm.get('situacionesId')?.enable();
        this.documentForm.get('situacionesId')?.setValidators([Validators.required]);
        this.documentForm.get('situacionesId')?.updateValueAndValidity();
        
        // Cargar situaciones y pre-seleccionar cuando estén listas (sin setTimeout)
        const situacionId = (response.data as any).situacion?.id;
        this.documentsService.getSituaciones().pipe(takeUntil(this.destroy$)).subscribe({
          next: (sitResponse) => {
            if (sitResponse.result && sitResponse.data?.length > 0) {
              this.situaciones = sitResponse.data;
            } else {
              this.situaciones = [];
            }
            // Pre-seleccionar situación ahora que las opciones están cargadas
            if (situacionId) {
              this.documentForm.patchValue({ situacionesId: situacionId });
            }
            this.cd.detectChanges();
          },
          error: () => {
            this.situaciones = [];
          }
        });
      }

      // Habilitar el control grado antes de establecer su valor
      this.documentForm.get('grado')?.enable();
      this.documentForm.get('grado')?.setValue(response.data.grado);

      // Manejar el estado del precio después de cargar los datos
      if (response.data.documentoLibre) {
        this.documentForm.get('price')?.disable();
      } else {
        this.documentForm.get('price')?.enable();
      }

      // Mostrar imagen existente como preview (sin cargarla en el formulario para permitir reemplazo)
      if (response.data.imagenUrlPublic) {
        this.existingImageUrl = response.data.imagenUrlPublic;
      }
      if (response.data.pdfPreviewUrl) {
        this.existingPdfPreviewUrlRaw = response.data.pdfPreviewUrl;
        this.existingPdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(response.data.pdfPreviewUrl);
      }

      // En modo edición, ajustar validaciones para documentos ZIP
      if (this.mode === 'edit' && response.data.format.toLowerCase() === 'zip') {
        this.documentForm.get('numeroPaginas')?.enable();
      }

      this.ready = true;

      // Forzar detección de cambios para asegurar que la UI se actualice
      this.cd.detectChanges();
    });
  }

  private setupFormListeners(): void {
    this.documentForm.get('nivel')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((nivel) => {
      console.debug('formulario: nivel.valueChanges triggered', { nivel, loadingDocument: this.loadingDocument, category: this.documentForm.get('category')?.value });

      // Durante la carga del documento, la cascada manual ya carga materias/grados
      if (!this.loadingDocument) {
        this.updateGrados(nivel);
        this.updateMaterias(nivel);
      }
      
      // Habilitar materia para todas las categorías
      const categoria = this.documentForm.get('category')?.value;
      if (categoria) {
        this.documentForm.get('materia')?.enable();
      }
      
      // Habilitar grado automáticamente para categorías específicas
      if (nivel && ['PLAN_LECTOR', 'REFORZAMIENTO'].includes(categoria)) {
        this.documentForm.get('grado')?.enable();
      }

      // ✅ NUEVO: Controlar habilitación del checkbox isKits
      this.actualizarEstadoIsKits();
    });

    this.documentForm.get('materia')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((materia) => {
      console.debug('formulario: materia.valueChanges triggered', { materia, nivel: this.documentForm.get('nivel')?.value, loadingDocument: this.loadingDocument });

      // Durante la carga del documento, la cascada manual ya carga grados
      if (!this.loadingDocument) {
        this.updateGrados(this.documentForm.get('nivel')?.value, materia);
      }

      const categoria = this.documentForm.get('category')?.value;
      
      // Habilitar grado cuando se selecciona materia (para todas las categorías)
      if (materia) {
        this.documentForm.get('grado')?.enable();
        console.log(`[GRADE DEBUG] materia.valueChanges: grado habilitado para categoría=${categoria}, materia=${materia}`);
      } else {
        this.documentForm.get('grado')?.disable();
        console.log(`[GRADE DEBUG] materia.valueChanges: grado deshabilitado (sin materia) para categoría=${categoria}`);
      }
      // Para PLAN_LECTOR y REFORZAMIENTO, el grado ya está habilitado por el nivel
    });

    this.documentForm.get('category')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((categoria) => {
      console.debug('formulario: category.valueChanges triggered', { categoria, loadingDocument: this.loadingDocument });
      if (!this.loadingDocument) {
        this.onCategoryChange(categoria);
      }
      const gradoControl = this.documentForm.get('grado');
      const materiaControl = this.documentForm.get('materia');
      const nivel = this.documentForm.get('nivel')?.value;

      // Todas las categorías requieren grado
      gradoControl?.setValidators([Validators.required]);

      // Habilitar materia y grado para todas las categorías (salvo suscripción)
      const isSuscripcion = this.documentForm.get('suscripcion')?.value;
      if (!isSuscripcion) {
        materiaControl?.setValidators([Validators.required]);
        materiaControl?.enable();
      }

      // Para PLAN_LECTOR y REFORZAMIENTO, habilitar grado directamente si hay nivel
      if (['PLAN_LECTOR', 'REFORZAMIENTO'].includes(categoria) && nivel) {
        gradoControl?.enable();
      }

      // Actualizar grados cuando cambie la categoría
      
      // Actualizar validaciones
      gradoControl?.updateValueAndValidity();
      materiaControl?.updateValueAndValidity();
      
      if (nivel) {
        this.updateGrados(nivel);
      }
    });

    // Modificar el listener de documentoLibre
    this.documentForm.get('documentoLibre')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((isLibre: boolean) => {
        const priceControl = this.documentForm.get('price');
        if (isLibre) {
          priceControl?.setValue(0);
          priceControl?.disable();
        } else {
          priceControl?.enable();
        }
      });

    // Listener para kits - cargar situaciones cuando se selecciona
    this.documentForm.get('isKits')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((isKits: boolean) => {
        if (isKits) {
          // ✅ Cargar situaciones filtradas por nivel cuando se activa el checkbox
          const nivel = this.documentForm.get('nivel')?.value;
          if (nivel) {
            this.cargarSituacionesPorNivel(nivel);
          }
          this.documentForm.get('situacionesId')?.enable();
          this.documentForm.get('situacionesId')?.setValidators([Validators.required]);
          this.documentForm.get('situacionesId')?.updateValueAndValidity();
          // ✅ NUEVO: Kits requieren numeroPaginas, preViewFilePdf y unitScheduleId
          this.documentForm.get('numeroPaginas')?.enable();
          this.documentForm.get('numeroPaginas')?.setValidators([Validators.required, Validators.min(1)]);
          // UnitSchedule UI is currently shown only for suscripciones; avoid forcing it required for kits
          this.documentForm.get('unitScheduleId')?.enable();
          // Do not set required validator for unitScheduleId here to avoid blocking submission when UI is hidden
          // If later the UI for unitSchedule for kits is enabled, add validators accordingly
          // this.documentForm.get('unitScheduleId')?.setValidators([Validators.required]);
          // this.documentForm.get('unitScheduleId')?.updateValueAndValidity();
          this.documentForm.get('numeroPaginas')?.updateValueAndValidity();
        } else {
          this.documentForm.get('situacionesId')?.disable();
          this.documentForm.get('situacionesId')?.setValue('');
          this.documentForm.get('situacionesId')?.clearValidators();
          this.documentForm.get('situacionesId')?.updateValueAndValidity();
          this.documentForm.get('situacionesNombre')?.disable();
          this.documentForm.get('situacionesNombre')?.setValue('');
          this.documentForm.get('situacionesNombre')?.clearValidators();
          this.documentForm.get('situacionesNombre')?.updateValueAndValidity();
          this.mostrarNuevaSituacion = false;
          this.situaciones = [];
          // ✅ NUEVO: Deshabilitar campos de kits, pero NO limpiar unitScheduleId
          this.documentForm.get('unitScheduleId')?.disable();
          this.documentForm.get('unitScheduleId')?.clearValidators();
          // NO hacer setValue('') aquí para conservar el valor
        }
        this.documentForm.get('numeroPaginas')?.updateValueAndValidity();
        this.documentForm.get('unitScheduleId')?.updateValueAndValidity();
      });

    this.documentForm.get('format')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((format) => {
        // Limpiar el archivo cuando cambia el formato
        this.file = null;
        this.fileError = null;
        this.pdfSrc = null;
        this.filePdfDelWord = null;
        this.filePdfDelWordError = null;
        this.preViewFilePdf = null;
        this.preViewFilePdfError = null;
        // Resetear modo de subida al cambiar formato
        this.fileInputMode = 'upload';
        this.driveUrl = '';
        this.driveUrlError = null;

        if (format === 'ZIP' || format === 'OTROS') {
          // ZIP y OTROS: Solo número de páginas habilitado
          // NO requieren paginasPreView (suben PDF de preview)
          this.documentForm.get('numeroPaginas')?.enable();
          this.documentForm.get('paginasPreView')?.disable();
          this.documentForm.get('paginasPreView')?.clearValidators();
          this.documentForm.get('paginasPreView')?.setValue('');
        } else {
          // PDF y DOCX: requieren paginasPreView
          this.documentForm.get('numeroPaginas')?.disable();
          this.documentForm.get('numeroPaginas')?.setValue('');
          
          // Habilitar paginasPreView solo si NO es suscripción
          const isSuscripcion = this.documentForm.get('suscripcion')?.value;
          if (!isSuscripcion) {
            this.documentForm.get('paginasPreView')?.enable();
            this.documentForm.get('paginasPreView')?.setValidators([Validators.required]);
          }
        }
        this.documentForm.get('paginasPreView')?.updateValueAndValidity();
        
        // Limpiar error de imágenes cuando cambie el formato
        this.updateImageValidation();
      });

    this.documentForm.get('suscripcion')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((isSuscripcion) => {
      // ✅ Controlar visibilidad de la sección de configuración
      this.showDocumentConfig = !isSuscripcion;
      
      if (isSuscripcion) {
        this.documentForm.get('subscriptionType')?.enable();
        this.documentForm.get('materiasSuscripcion')?.enable();
        this.documentForm.get('opcionesSuscripcion')?.enable();
        
        // ✅ Establecer categoría como PLANIFICACION automáticamente
        this.documentForm.get('category')?.setValue('PLANIFICACION');
        
        // ✅ Deshabilitar campos de configuración del documento cuando es suscripción
        this.documentForm.get('category')?.disable();
        this.documentForm.get('nivel')?.disable();
        this.documentForm.get('nivel')?.clearValidators();
        this.documentForm.get('nivel')?.setValue('');
        this.documentForm.get('grado')?.disable();
        this.documentForm.get('grado')?.clearValidators();
        this.documentForm.get('grado')?.setValue('');
        this.documentForm.get('materia')?.disable();
        this.documentForm.get('materia')?.clearValidators();
        this.documentForm.get('materia')?.setValue('');
        
        // ✅ Suscripciones NO requieren paginasPreView
        this.documentForm.get('paginasPreView')?.disable();
        this.documentForm.get('paginasPreView')?.clearValidators();
        this.documentForm.get('paginasPreView')?.setValue('');
        
        // ✅ Suscripciones requieren numeroPaginas
        this.documentForm.get('numeroPaginas')?.enable();
        this.documentForm.get('numeroPaginas')?.setValidators([Validators.required, Validators.min(1)]);
        
        // ✅ unitScheduleId se habilitará cuando se seleccione subscriptionType
      } else {
        this.documentForm.get('subscriptionType')?.disable();
        this.documentForm.get('subscriptionType')?.setValue('');
        this.documentForm.get('materiasSuscripcion')?.disable();
        this.documentForm.get('materiasSuscripcion')?.setValue('');
        this.documentForm.get('opcionesSuscripcion')?.disable();
        this.documentForm.get('opcionesSuscripcion')?.setValue('');
        this.materiasSuscripcion = [];
        this.opcionesSuscripcion = [];
        this.allMateriasData = [];
        
        // ✅ Habilitar campos de configuración del documento cuando NO es suscripción
        this.documentForm.get('category')?.enable();
        this.documentForm.get('nivel')?.enable();
        this.documentForm.get('grado')?.enable();
        this.documentForm.get('materia')?.enable();
        
        // ✅ Deshabilitar campos de suscripción
        this.documentForm.get('unitScheduleId')?.disable();
        this.documentForm.get('unitScheduleId')?.clearValidators();
        this.documentForm.get('unitScheduleId')?.setValue('');
        this.unitSchedules = [];
        this.unitScheduleYears = [];
        
        // ✅ Documentos normales requieren paginasPreView solo si NO es ZIP/OTROS
        const format = this.documentForm.get('format')?.value;
        if (format !== 'ZIP' && format !== 'OTROS') {
          this.documentForm.get('paginasPreView')?.enable();
          this.documentForm.get('paginasPreView')?.setValidators([Validators.required]);
        }
      }
      this.documentForm.get('paginasPreView')?.updateValueAndValidity();
      this.documentForm.get('numeroPaginas')?.updateValueAndValidity();
      this.documentForm.get('unitScheduleId')?.updateValueAndValidity();
      this.documentForm.get('category')?.updateValueAndValidity();
      this.documentForm.get('nivel')?.updateValueAndValidity();
      this.documentForm.get('grado')?.updateValueAndValidity();
      this.documentForm.get('materia')?.updateValueAndValidity();
      
      // Limpiar error de imágenes cuando cambie el estado de suscripción
      this.updateImageValidation();
    });

    // Listener para cambios en subscriptionType
    this.documentForm.get('subscriptionType')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((subscriptionTypeId) => {
      if (subscriptionTypeId) {
        this.loadMateriasOpciones(subscriptionTypeId);
        
        // ✅ Cargar unidades programáticas filtradas por tipo de suscripción
        this.loadUnitSchedulesBySubscriptionType(subscriptionTypeId);
        
        // ✅ Habilitar y hacer requerido el campo unitScheduleId
        this.documentForm.get('unitScheduleId')?.enable();
        this.documentForm.get('unitScheduleId')?.setValidators([Validators.required]);
        this.documentForm.get('unitScheduleId')?.updateValueAndValidity();
      } else {
        this.materiasSuscripcion = [];
        this.opcionesSuscripcion = [];
        this.allMateriasData = [];
        this.documentForm.get('materiasSuscripcion')?.setValue('');
        this.documentForm.get('opcionesSuscripcion')?.setValue('');
        
        // ✅ Limpiar y deshabilitar unitScheduleId
        this.unitSchedules = [];
        this.unitScheduleYears = [];
        this.documentForm.get('unitScheduleId')?.disable();
        this.documentForm.get('unitScheduleId')?.setValue('');
        this.documentForm.get('unitScheduleId')?.clearValidators();
        this.documentForm.get('unitScheduleId')?.updateValueAndValidity();
      }
    });

    // Listener para cambios en materiasSuscripcion
    this.documentForm.get('materiasSuscripcion')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((materiaId) => {
      this.onMateriaSuscripcionChange(materiaId);
    });

    // Track unsaved changes after any form value change (skip programmatic patches during load)
    this.documentForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (!this.loadingDocument) {
        this.formDirty = true;
      }
    });
  }

  // ✅ NUEVO: Cargar grados desde backend
  private updateGrados(nivel: string, materia?: string): void {
    const categoria = this.documentForm.get('category')?.value;
    console.debug('updateGrados called', { categoria, nivel, materia, loadingDocument: this.loadingDocument });
    
    if (!categoria || !nivel || !materia) {
      this.grados = [];
      return;
    }
    
    const subjectId = this.findIdByCode(this.materias, materia);
    if (!subjectId) {
      this.grados = [];
      return;
    }
    
    this.loadingGrados = true;
    this.documentForm.get('grado')?.disable({ emitEvent: false });
    this.gradeHierarchyService.getGrades(subjectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (grados) => {
            console.debug('updateGrados: grades loaded', { count: Array.isArray(grados) ? grados.length : 0 });
          this.grados = grados;
          this.loadingGrados = false;
          this.documentForm.get('grado')?.enable({ emitEvent: false });
        },
        error: (error) => {
          console.error('Error al cargar grados:', error);
          this.grados = [];
          this.loadingGrados = false;
          this.documentForm.get('grado')?.enable({ emitEvent: false });
        }
      });
    
    // No limpiar el grado si estamos inicializando desde el servidor
    if (!this.loadingDocument) {
      this.documentForm.get('grado')?.setValue('');
    }
  }

  // ✅ NUEVO: Cargar materias desde backend
  private updateMaterias(nivel: string): void {
    const categoria = this.documentForm.get('category')?.value;
    console.debug('updateMaterias called', { categoria, nivel, loadingDocument: this.loadingDocument });
    
    if (!categoria || !nivel) {
      this.materias = [];
      return;
    }
    
    const levelId = this.findIdByCode(this.niveles, nivel);
    if (!levelId) {
      this.materias = [];
      return;
    }

    this.loadingMaterias = true;
    this.gradeHierarchyService.getSubjects(levelId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (materias) => {
            console.debug('updateMaterias: materias loaded', { count: Array.isArray(materias) ? materias.length : 0 });
          this.materias = materias;
          this.loadingMaterias = false;
        },
        error: (error) => {
          console.error('Error al cargar materias:', error);
          this.materias = [];
          this.loadingMaterias = false;
        }
      });
    
    // Evitar limpiar la materia durante la carga inicial para no borrar el valor recibido
    if (!this.loadingDocument) {
      this.documentForm.get('materia')?.setValue('');
    }
  }

  // ✅ NUEVO: Cargar categorías desde backend
  private loadCategories(): void {
    this.loadingCategories = true;
    this.gradeHierarchyService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categories = categories.sort((a, b) => (a.position || 0) - (b.position || 0));
          this.loadingCategories = false;
        },
        error: (error) => {
          console.error('Error al cargar categorías:', error);
          this.toastrService.danger('Error al cargar las categorías', 'Error');
          this.loadingCategories = false;
        }
      });
  }

  /** Busca el id numérico de un HierarchyItem por su code dentro de un array */
  private findIdByCode(items: HierarchyItem[], code: string): number | null {
    const item = items.find(i => i.code === code);
    return item ? item.id : null;
  }

  // ✅ NUEVO: Cargar niveles desde backend
  private loadNiveles(categoryCode: string): void {
    const categoryId = this.findIdByCode(this.categories, categoryCode);
    if (!categoryId) {
      this.niveles = [];
      return;
    }
    this.loadingNiveles = true;
    this.gradeHierarchyService.getLevels(categoryId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (niveles) => {
          this.niveles = niveles.sort((a, b) => (a.position || 0) - (b.position || 0));
          this.loadingNiveles = false;
        },
        error: (error) => {
          console.error('Error al cargar niveles:', error);
          this.niveles = [];
          this.loadingNiveles = false;
        }
      });
  }

  private onCategoryChange(categoria: string): void {
    // ✅ Cargar niveles dinámicamente desde backend
    if (categoria) {
      this.loadNiveles(categoria);
    } else {
      this.niveles = [];
    }
    
    // Limpiar materias y grados
    this.materias = [];
    this.grados = [];
    
    // Limpiar el nivel seleccionado cuando cambie la categoría
    // Si estamos inicializando desde el servidor, no sobrescribimos los valores
    if (!this.loadingDocument) {
      this.documentForm.get('nivel')?.setValue('');
      this.documentForm.get('materia')?.setValue('');
      this.documentForm.get('grado')?.setValue('');
    }
  }

  updateDetalleMaterias(materia: string): void {
    const secundariaMaterias: Record<string, string[]> = {
      'comunicación': ['1° año', '2° año', '3° año', '4° año', '5° año'],
      'matemática': ['1° año', '2° año', '3° año', '4° año', '5° año'],
      'ciencias sociales': ['1° año', '2° año', '3° año', '4° año', '5° año'],
      'desarrollo personal': ['1° año', '2° año', '3° año', '4° año', '5° año'],
      'ciencia y tecnología': ['1° año', '2° año', '3° año', '4° año', '5° año'],
      'arte y cultura': ['1° - 2° año', '3° - 4° año', '5° año'],
      'inglés': ['1° - 2° año', '3° - 4° año', '5° año'],
      'religión': ['1° - 2° año', '3° - 4° año', '5° año'],
      'ept': ['1° - 2° año', '3° - 4° año', '5° año'],
      'tutoría': ['1° - 2° año', '3° - 4° año', '5° año']
    };

    const materiaLower = materia.toLowerCase();
    this.detalleMaterias = secundariaMaterias[materiaLower] || [];
    this.updateGrados(this.documentForm.get('nivel')?.value, materia);
  }

  private loadMateriasOpciones(subscriptionTypeId: number): void {
    console.debug('loadMateriasOpciones called', { subscriptionTypeId });
    this.isLoading = true;
    this.membresiaService.getMateriasOpciones(subscriptionTypeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.debug('loadMateriasOpciones response', { response });
          
          if (response.result && response.data && response.data.length > 0) {
            this.allMateriasData = response.data;
            this.materiasSuscripcion = response.data;
            
            // Limpiar las opciones ya que se llenarán cuando se seleccione una materia
            this.opcionesSuscripcion = [];
            
            // Habilitar el control de materia
            this.documentForm.get('materiasSuscripcion')?.enable();
            // Deshabilitar opciones hasta que se seleccione una materia
            this.documentForm.get('opcionesSuscripcion')?.disable();
            this.documentForm.get('opcionesSuscripcion')?.setValue('');
          } else {
            this.toastrService.danger('Error al cargar las materias y opciones', 'Error');
            this.materiasSuscripcion = [];
            this.opcionesSuscripcion = [];
            this.allMateriasData = [];
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('loadMateriasOpciones error', error);
          console.error('Error loading materias y opciones:', error);
          this.toastrService.danger('Error al cargar las materias y opciones', 'Error');
          this.materiasSuscripcion = [];
          this.opcionesSuscripcion = [];
          this.allMateriasData = [];
          this.isLoading = false;
        }
      });
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    const selectedFormat = this.documentForm.get('format')?.value;

    if (file) {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      const formatExtensions = {
        'PDF': ['pdf'],
        'DOCX': ['doc', 'docx'],
        'ZIP': ['zip']
      };

      // Para formato "OTROS", aceptar cualquier tipo de archivo
      if (selectedFormat === 'OTROS') {
        this.file = file;
        this.fileError = null;
        this.pdfSrc = null;
        return;
      }

      // Verificar si el formato del archivo coincide con el formato seleccionado
      const allowedExtensions = (formatExtensions as Record<string, string[]>)[selectedFormat];
      if (allowedExtensions && allowedExtensions.includes(fileExtension)) {
        this.file = file;
        this.fileError = null;

        if (fileExtension === 'pdf') {
          const fileReader = new FileReader();
          fileReader.onload = () => {
            this.pdfSrc = this.sanitizer.bypassSecurityTrustResourceUrl(fileReader.result as string);
            this.cd.detectChanges();
          };
          fileReader.readAsDataURL(file);
        } else {
          this.pdfSrc = null;
        }
      } else {
        this.file = null;
        this.fileError = `El formato del archivo debe ser ${selectedFormat}`;
        this.pdfSrc = null;
      }
    }
  }

  setFileInputMode(mode: 'upload' | 'url'): void {
    this.fileInputMode = mode;
    if (mode === 'upload') {
      this.driveUrl = '';
      this.driveUrlError = null;
    } else {
      this.file = null;
      this.fileError = null;
      this.pdfSrc = null;
    }
  }

  onDriveUrlChange(url: string): void {
    this.driveUrl = url;
    this.driveUrlError = null;

    if (!url || url.trim() === '') return;

    // Validar patrones válidos de Google Drive:
    // - https://drive.google.com/file/d/{fileId}/...
    // - https://drive.google.com/open?id={fileId}
    // - https://docs.google.com/document/d/{fileId}/...
    // - Raw file ID (25+ caracteres alfanuméricos, guiones, guiones bajos)
    const drivePatterns = [
      /^https?:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9_-]{25,}/,
      /^https?:\/\/drive\.google\.com\/open\?id=[a-zA-Z0-9_-]{25,}/,
      /^https?:\/\/docs\.google\.com\/\w+\/d\/[a-zA-Z0-9_-]{25,}/,
      /^https?:\/\/drive\.google\.com\/drive\/folders\/[a-zA-Z0-9_-]{25,}/,
      /^[a-zA-Z0-9_-]{25,}$/
    ];

    const isValid = drivePatterns.some(pattern => pattern.test(url.trim()));
    if (!isValid) {
      this.driveUrlError = 'Ingresa una URL válida de Google Drive (ej: https://drive.google.com/file/d/...)';
    }
  }

  onAdditionalFileChange(event: any): void {
    const file = event.target.files[0];

    if (file) {
      const fileExtension = file.name.split('.').pop().toLowerCase();

      if (fileExtension === 'pdf') {
        this.filePdfDelWord = file;
        this.filePdfDelWordError = null;
      } else {
        this.filePdfDelWord = null;
        this.filePdfDelWordError = 'El archivo debe estar en formato PDF';
        // Limpiar el input
        event.target.value = '';
      }
    }
  }

  onPreViewFileChange(event: any): void {
    const file = event.target.files[0];

    if (file) {
      const fileExtension = file.name.split('.').pop().toLowerCase();

      if (fileExtension === 'pdf') {
        this.preViewFilePdf = file;
        this.preViewFilePdfError = null;
      } else {
        this.preViewFilePdf = null;
        this.preViewFilePdfError = 'El archivo debe estar en formato PDF';
        // Limpiar el input
        event.target.value = '';
      }
    }
  }


  onSubmit(): void {
    // ✅ Validar imágenes según las reglas específicas
    if (this.areImagesRequired() && this.images.length === 0) {
      this.imagesError = 'Debe seleccionar al menos una imagen';
      this.toastrService.warning('Por favor, seleccione al menos una imagen', 'Advertencia');
      // focus image input if present
      this.focusElementById('file');
      return;
    }

    // ✅ NUEVO: Validar paginasPreView (requerido para todos excepto suscripciones)
    if (this.arePaginasPreViewRequired()) {
      const paginasPreView = this.documentForm.get('paginasPreView')?.value;
      if (!paginasPreView || paginasPreView.trim() === '') {
        this.toastrService.warning('Debe especificar las páginas para la vista previa (ej: 1-3, 5, 7-9)', 'Advertencia');
        this.focusControl('paginasPreView');
        return;
      }
    }
    
    // ✅ NUEVO: Validar preViewFilePdf (requerido para ZIP/OTROS en modo create)
    const format = this.documentForm.get('format')?.value;
    if ((this.mode === 'create') && (format === 'ZIP' || format === 'OTROS') && !this.preViewFilePdf) {
      this.preViewFilePdfError = 'El PDF de previsualización es obligatorio';
      this.toastrService.warning('Debe subir el PDF de previsualización', 'Advertencia');
      this.focusElementById('preViewFilePdf');
      return;
    }

    // Validar situaciones para kits
    if (this.documentForm.get('isKits')?.value) {
      const situacionesId = this.documentForm.get('situacionesId')?.value;

      // Debe haber seleccionado una situación significativa
      if (!situacionesId) {
        this.toastrService.warning('Para los kits debe seleccionar una situación significativa (puede crear una nueva con el botón "Nueva")', 'Advertencia');
        this.focusControl('situacionesId');
        return;
      }
    }

    // ✅ Validación especial para modo edición (ignora campos deshabilitados)
    const isFormValidForSubmit = this.mode === 'edit' ? this.canSubmitForm : this.documentForm.valid;

    if (isFormValidForSubmit) {
      this.isLoading = true;

      // --- DIAGNÓSTICO: estado de controles justo antes de enviar ---
      const gradoControl = this.documentForm.get('grado');
      const materiaControl = this.documentForm.get('materia');
      console.group('🔍 [GRADE DEBUG] Estado del formulario antes de enviar');
      console.log('category:', this.documentForm.get('category')?.value, '| enabled:', this.documentForm.get('category')?.enabled);
      console.log('nivel:', this.documentForm.get('nivel')?.value, '| enabled:', this.documentForm.get('nivel')?.enabled);
      console.log('materia:', materiaControl?.value, '| enabled:', materiaControl?.enabled, '| disabled:', materiaControl?.disabled);
      console.log('grado:', gradoControl?.value, '| enabled:', gradoControl?.enabled, '| disabled:', gradoControl?.disabled);
      console.log('grados disponibles en array:', this.grados);
      console.log('materias disponibles en array:', this.materias);
      console.groupEnd();
      // --- FIN DIAGNÓSTICO ---

      // ✅ Obtener gradeId primero
      this.obtenerGradeId().subscribe({
        next: (gradeId) => {
          const formData = this.createFormData(gradeId ?? undefined);

          // --- DEBUG LOG: Mostrar todos los pares clave-valor de FormData ---
          if (formData && typeof formData.forEach === 'function') {
            console.group('🗂️ [GRADE DEBUG] FormData enviado al backend');
            formData.forEach((value, key) => {
              console.log(`  ${key}:`, value);
            });
            console.groupEnd();
          } else {
            console.log('FormData no soporta forEach, no se puede mostrar el contenido.');
          }

          if (this.mode === 'create') {
            this.onUpload(formData);
          } else if (this.mode === 'edit') {
            this.onUpdate(formData);
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error al obtener gradeId:', error);
          this.toastrService.danger('Error al procesar la jerarquía del documento', 'Error');
        }
      });
    } else {
      // Mostrar mensaje específico según el modo y enfocar el primer control inválido
      this.documentForm.markAllAsTouched();
      const first = this.findFirstInvalidControl();
      if (first) this.focusControl(first);

      if (this.mode === 'edit') {
        this.toastrService.warning('Por favor, complete los campos obligatorios (título, descripción, formato)', 'Advertencia');
      } else {
        this.toastrService.warning('Por favor, complete todos los campos requeridos', 'Advertencia');
      }
    }
  }

  // Devuelve una lista entendible de campos faltantes para mostrar en la UI
  get missingFields(): string[] {
    const missing: string[] = [];

    // Modo edición: solo validar título, descripción y formato (coincide con canSubmitForm)
    if (this.mode === 'edit') {
      const title = this.documentForm.get('title')?.value;
      const description = this.documentForm.get('description')?.value;
      const format = this.documentForm.get('format')?.value;
      if (!title || title.trim().length < 3) missing.push('Título');
      if (!description || description.trim().length < 3) missing.push('Descripción');
      if (!format || String(format).trim() === '') missing.push('Formato');
      if (this.driveUrlError) missing.push('URL de Google Drive inválida');
      return missing;
    }

    // Para create y validaciones generales, usar controles inválidos habilitados
    const controls = this.documentForm.controls;
    const labelFor: Record<string, string> = {
      title: 'Título',
      description: 'Descripción',
      format: 'Formato',
      price: 'Precio',
      category: 'Categoría',
      nivel: 'Nivel',
      materia: 'Materia',
      grado: 'Grado',
      paginasPreView: 'Páginas para vista previa',
      numeroPaginas: 'Número de documentos/páginas',
      subscriptionType: 'Tipo de suscripción',
      materiasSuscripcion: 'Materia de suscripción',
      opcionesSuscripcion: 'Opción de suscripción',
      unitScheduleId: 'Unidad programática',
      situacionesId: 'Situación significativa',
      situacionesNombre: 'Nombre de nueva situación'
    };

    for (const name of Object.keys(controls)) {
      const control = controls[name];
      if (control && control.enabled && control.invalid) {
        const label = labelFor[name] || name;
        if (!missing.includes(label)) missing.push(label);
      }
    }

    // Reglas adicionales fuera del form control
    const formatVal = this.documentForm.get('format')?.value;
    // Imágenes
    if (this.areImagesRequired() && this.images.length === 0) {
      if (!missing.includes('Imágenes')) missing.push('Imágenes');
    }

    // Páginas de preview
    if (this.arePaginasPreViewRequired()) {
      const paginas = this.documentForm.get('paginasPreView')?.value;
      if (!paginas || String(paginas).trim() === '') {
        if (!missing.includes('Páginas para vista previa')) missing.push('Páginas para vista previa');
      }
    }

    // PDF de previsualización para ZIP/OTROS en create
    if (this.mode === 'create' && (formatVal === 'ZIP' || formatVal === 'OTROS')) {
      if (!this.preViewFilePdf) {
        if (!missing.includes('PDF de previsualización')) missing.push('PDF de previsualización');
      }
      const hasFileOrUrl = !!this.file || (this.fileInputMode === 'url' && this.driveUrl.trim() !== '');
      if (!hasFileOrUrl) {
        if (!missing.includes('Archivo principal')) missing.push('Archivo principal');
      }
    }

    // Archivo principal para PDF/DOCX
    if (this.mode === 'create' && (formatVal === 'PDF' || formatVal === 'DOCX')) {
      const hasFileOrUrl = !!this.file || (this.fileInputMode === 'url' && this.driveUrl.trim() !== '');
      if (!hasFileOrUrl) {
        if (!missing.includes('Archivo principal')) missing.push('Archivo principal');
      }
    }

    // Situaciones para kits (si está activado)
    if (this.documentForm.get('isKits')?.value) {
      const situacionesId = this.documentForm.get('situacionesId')?.value;
      if (!situacionesId) {
        if (!missing.includes('Situación significativa')) missing.push('Situación significativa');
      }
    }

    // Suscripciones: si se seleccionó subscriptionType, unitScheduleId es requerido
    if (this.documentForm.get('suscripcion')?.value && this.documentForm.get('subscriptionType')?.value) {
      const us = this.documentForm.get('unitScheduleId')?.value;
      if (!us) {
        if (!missing.includes('Unidad programática')) missing.push('Unidad programática');
      }
    }

    return missing;
  }

  // Enfoca control correspondiente al label mostrado en la lista
  focusField(label: string): void {
    const map: Record<string, string> = {
      'Título': 'title',
      'Descripción': 'description',
      'Formato': 'format',
      'Precio': 'price',
      'Categoría': 'category',
      'Nivel': 'nivel',
      'Materia': 'materia',
      'Grado': 'grado',
      'Páginas para vista previa': 'paginasPreView',
      'Número de documentos/páginas': 'numeroPaginas',
      'Tipo de suscripción': 'subscriptionType',
      'Materia de suscripción': 'materiasSuscripcion',
      'Opción de suscripción': 'opcionesSuscripcion',
      'Unidad programática': 'unitScheduleId',
      'Situación significativa': 'situacionesId',
      'Nombre de nueva situación': 'situacionesNombre',
      'Imágenes': 'file' // fallback to file input
    };

    const controlName = map[label] || null;
    if (controlName) {
      this.focusControl(controlName);
    } else {
      // fallback: intentar enfocar por id que coincida con la etiqueta normalizada
      const normalized = label.toLowerCase().replace(/[^a-z0-9]+/gi, '');
      this.focusElementById(normalized);
    }
  }

  private obtenerGradeId(): Observable<number | null> {
    const isSuscripcion = this.documentForm.get('suscripcion')?.value;

    // Para suscripciones: resolver grade genérico desde backend en vez de hardcodear
    if (isSuscripcion) {
      console.log('🔍 [GRADE DEBUG] obtenerGradeId → suscripción, usando GEN/GEN/GEN/GEN');
      return this.gradeHierarchyService.findGradeId(
        'PLANIFICACION', 'GEN', 'GEN', 'GEN'
      ).pipe(
        catchError(() => of(null))
      );
    }

    const category = this.documentForm.get('category')?.value;
    const nivel = this.documentForm.get('nivel')?.value;
    const materia = this.documentForm.get('materia')?.value;
    const grado = this.documentForm.get('grado')?.value;

    console.group('🔍 [GRADE DEBUG] obtenerGradeId → parámetros enviados al backend');
    console.log('category:', category);
    console.log('nivel:', nivel);
    console.log('materia (raw):', materia, '→ enviado como:', materia || 'GEN');
    console.log('grado (raw):', grado, '→ enviado como:', grado || 'GEN');
    console.log('Control grado enabled:', this.documentForm.get('grado')?.enabled);
    console.log('Control materia enabled:', this.documentForm.get('materia')?.enabled);
    console.groupEnd();

    return this.gradeHierarchyService.findGradeId(
      category,
      nivel,
      materia || 'GEN',
      grado || 'GEN'
    ).pipe(
      tap(result => {
        if (result != null) {
          console.log('✅ [GRADE DEBUG] findGradeId resultado → gradeId:', result);
        } else {
          console.warn('⚠️ [GRADE DEBUG] findGradeId devolvió NULL — el backend no encontró la jerarquía. El grado NO se guardará. Verifica que la categoría/nivel/materia/grado existan en la BD del backend.');
        }
      }),
      catchError(error => {
        console.error('❌ [GRADE DEBUG] findGradeId falló con error HTTP:', error);
        return of(null);
      })
    );
  }

  private createFormData(gradeId?: number): FormData {
    const formData = new FormData();
    const format = this.documentForm.get('format')?.value;
    
    // Campos básicos
    formData.append('title', this.documentForm.get('title')?.value);
    formData.append('description', this.documentForm.get('description')?.value);
    formData.append('format', format);
    formData.append('price', this.documentForm.get('price')?.value);
    formData.append('category', this.documentForm.get('category')?.value);
    formData.append('documentoLibre', this.documentForm.get('documentoLibre')?.value);
    formData.append('isKits', this.documentForm.get('isKits')?.value);
    
    // ✅ Solo enviar nivel, grado, materia si NO es suscripción
    const isSuscripcion = this.documentForm.get('suscripcion')?.value;
    if (!isSuscripcion) {
      formData.append('nivel', this.documentForm.get('nivel')?.value || '');
      formData.append('grado', this.documentForm.get('grado')?.value || '');
      formData.append('materia', this.documentForm.get('materia')?.value || '');
      
      // ✅ Agregar gradeId obtenido del backend para documentos normales
      if (gradeId !== null && gradeId !== undefined) {
        formData.append('gradeId', gradeId.toString());
      }
    } else {
      // Para suscripciones: NO enviar gradeId fijo — el backend resuelve el grade
      // a partir de subscriptionTypeId + materiaId + opcionId
      if (gradeId !== null && gradeId !== undefined) {
        formData.append('gradeId', gradeId.toString());
      }
    }
    
    // Campos de situaciones para kits
    if (this.documentForm.get('isKits')?.value) {
      const situacionesId = this.documentForm.get('situacionesId')?.value;
      if (situacionesId) {
        formData.append('situacionesId', situacionesId);
      }
    }
    
    // Campos de suscripción
    formData.append('suscription', this.documentForm.get('suscripcion')?.value);
    if (this.documentForm.get('suscripcion')?.value) {
      const subscriptionType = this.documentForm.get('subscriptionType')?.value;
      const materiasSuscripcion = this.documentForm.get('materiasSuscripcion')?.value;
      const opcionesSuscripcion = this.documentForm.get('opcionesSuscripcion')?.value;
      if (subscriptionType) formData.append('subscriptionTypeId', subscriptionType);
      if (materiasSuscripcion) formData.append('materiaId', materiasSuscripcion);
      if (opcionesSuscripcion) formData.append('opcionId', opcionesSuscripcion);
    }

    // ✅ Siempre enviar unitScheduleId si existe (para suscripción, kits o ambos)
    const unitScheduleId = this.documentForm.get('unitScheduleId')?.value;
    if (unitScheduleId) {
      formData.append('unitScheduleId', unitScheduleId);
    }

    // ✅ Páginas para preview (solo para PDF/DOCX, NO para ZIP/OTROS ni suscripciones)
    const paginasPreView = this.documentForm.get('paginasPreView')?.value;
    if (paginasPreView && paginasPreView.trim() !== '') {
      // Convertir string "1-3, 5, 7-9" a array de números
      const paginas = this.parsePaginasPreView(paginasPreView);
      // Enviar cada página como un valor separado del mismo parámetro (para que Spring Boot lo convierta a List<Integer>)
      paginas.forEach(pagina => formData.append('paginasPreView', pagina.toString()));
    }

    // ✅ Archivos según formato y modo (create o edit)
    // En modo edit, solo incluir archivos si el usuario seleccionó nuevos archivos
    const shouldIncludeFile = (this.mode === 'create') || (this.mode === 'edit' && this.file !== null);
    
    // Si el usuario eligió URL de Drive, enviarla en lugar del archivo físico
    if (this.fileInputMode === 'url' && this.driveUrl.trim() !== '') {
      formData.append('driveUrl', this.driveUrl.trim());
    } else if (format === 'ZIP' || format === 'OTROS') {
      // Para ZIP/OTROS: archivo principal + PDF de preview + numeroPaginas
      const numeroPaginas = this.documentForm.get('numeroPaginas')?.value;
      
      // Incluir archivo principal si existe
      if (shouldIncludeFile && this.file) {
        formData.append('file', this.file); // Archivo ZIP o OTROS
      }
      
      // Incluir PDF de previsualización si el usuario lo seleccionó
      if (this.preViewFilePdf) {
        formData.append('preViewFilePdf', this.preViewFilePdf);
      }
      
      if (numeroPaginas) formData.append('numeroDePaginas', numeroPaginas.toString());
    } else {
      // Para PDF/DOCX: archivo principal (backend extraerá imagen y preview)
      if (shouldIncludeFile && this.file) {
        formData.append('file', this.file);
      }
      
      // Para DOCX: archivo PDF adicional opcional - enviado como filePdfDelWord
      if (format === 'DOCX' && this.filePdfDelWord) {
        formData.append('filePdfDelWord', this.filePdfDelWord);
      }
    }

    return formData;
  }

  // Encuentra el primer control inválido y habilitado en el formulario
  private findFirstInvalidControl(): string | null {
    const controls = this.documentForm.controls;
    for (const name of Object.keys(controls)) {
      const control = controls[name];
      if (control && control.invalid && control.enabled) {
        return name;
      }
    }
    return null;
  }

  // Intenta enfocar un control por su formControlName
  private focusControl(controlName: string): void {
    try {
      const host = document.querySelector(`[formcontrolname="${controlName}"]`) as HTMLElement | null;
      if (!host) {
        this.focusElementById(controlName);
        return;
      }

      // Buscar un elemento enfocables dentro del host: input, textarea, select, button o trigger de mat-select
      const focusable = host.querySelector('input, textarea, select, button, .mat-select-trigger, .mat-select-value') as HTMLElement | null;
      const target = focusable || host;

      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        try {
          if (focusable && typeof (focusable as any).focus === 'function') {
            (focusable as any).focus();
            focusable.classList.add('focus-highlight');
            setTimeout(() => focusable.classList.remove('focus-highlight'), 1400);
          } else if (typeof (target as any).focus === 'function') {
            (target as any).focus();
            target.classList.add('focus-highlight');
            setTimeout(() => target.classList.remove('focus-highlight'), 1400);
          }
        } catch (e) {
          // fallback
          this.focusElementById(controlName);
        }
      }, 200);
    } catch (e) {
      console.warn('focusControl error', e);
    }
  }

  // Enfoca un elemento por id
  private focusElementById(id: string): void {
    try {
      const byId = document.getElementById(id) as HTMLElement | null;
      if (byId) {
        byId.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => { try { byId.focus(); byId.classList.add('focus-highlight'); setTimeout(() => byId.classList.remove('focus-highlight'), 1400); } catch(e){} }, 200);
      }
    } catch (e) {
      console.warn('focusElementById error', e);
    }
  }

  private onUpload(formData: FormData): void {
    this.documentsService.uploadDocument(formData).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isLoading = false;
        this.toastrService.success('Documento guardado exitosamente', 'Éxito');
        this.router.navigate(['/pages-admin/documentos']);
      },
      error: (err) => {
        this.isLoading = false;
        let serverMessage = 'Error al guardar el documento';

        if (err?.error?.errorresponse?.message) {
          const rawMessage = err.error.errorresponse.message; // p.ej. "Internal Server Error, documento existente"
          const parts = rawMessage.split(',');
          // Tomar la segunda parte si existe, si no, usamos la primera
          let finalMessage = parts.length > 1 ? parts[1].trim() : parts[0];
          // Mayúscula en la primera letra
          finalMessage = finalMessage.charAt(0).toUpperCase() + finalMessage.slice(1);
          serverMessage = finalMessage;
        }
        this.toastrService.warning(serverMessage, 'Error');
      },
    });
  }

  private onUpdate(formData: FormData): void {
    this.documentsService.updateDocument(this.id, formData).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isLoading = false;
        this.toastrService.success('Documento actualizado exitosamente', 'Éxito');
        this.router.navigate(['/pages-admin/documentos']);
      },
      error: (err) => {
        this.isLoading = false;
        let serverMessage = 'Error al actualizar el documento';

        if (err?.error?.errorresponse?.message) {
          const rawMessage = err.error.errorresponse.message;
          const parts = rawMessage.split(',');
          let finalMessage = parts.length > 1 ? parts[1].trim() : parts[0];
          finalMessage = finalMessage.charAt(0).toUpperCase() + finalMessage.slice(1);
          serverMessage = finalMessage;
        }
        this.toastrService.danger(serverMessage, 'Error');
      },
    });
  }

  onCancel(): void {
    if (this.formDirty) {
      if (!confirm('Hay cambios sin guardar. ¿Desea salir de todas formas?')) {
        return;
      }
    }
    this.location.back();
  }

  /** Obtiene el enlace de descarga del documento principal desde el backend y abre en nueva pestaña */
  downloadMainDocument(): void {
    if (!this.id) return;
    this.loadingDownloadUrl = true;
    this.documentsService.getAdminDownloadUrl(Number(this.id))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.loadingDownloadUrl = false;
          // Backend devuelve: { redirectUrl, downloadUrl, redirectToken, expiresAt, fallback }
          const url: string = response?.redirectUrl || response?.downloadUrl ||
            response?.url || response?.data?.url ||
            (typeof response === 'string' ? response : null);
          if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
            const a = document.createElement('a');
            a.href = url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => { try { document.body.removeChild(a); } catch (e) {} }, 200);
          } else {
            this.toastrService.warning('No se pudo obtener el enlace de descarga', 'Advertencia');
          }
        },
        error: () => {
          this.loadingDownloadUrl = false;
          this.toastrService.danger('Error al obtener el enlace de descarga', 'Error');
        }
      });
  }

  /** Indica si el formato del documento permite previsualización inline (no aplica a ZIP/OTROS) */
  get isMainDocPreviewable(): boolean {
    const fmt = this.documentForm?.get('format')?.value;
    return fmt === 'PDF' || fmt === 'DOCX';
  }

  /**
   * Abre el documento principal en modo visualización (no fuerza descarga).
   * Para PDF/DOCX construye la URL del visor de Drive a partir del fileId
   * extraído de la respuesta del backend.
   */
  viewMainDocument(): void {
    if (!this.id || !this.isMainDocPreviewable) return;
    this.loadingViewUrl = true;
    this.documentsService.getAdminDownloadUrl(Number(this.id))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.loadingViewUrl = false;
          const downloadUrl: string = response?.downloadUrl || '';
          // Extraer el fileId de Drive desde la URL ("...?export=download&id=FILEID")
          const match = /[?&]id=([a-zA-Z0-9_-]+)/.exec(downloadUrl);
          const fileId = match ? match[1] : null;
          if (fileId) {
            const viewUrl = `https://drive.google.com/file/d/${fileId}/view`;
            window.open(viewUrl, '_blank', 'noopener,noreferrer');
            return;
          }
          // Fallback: abrir el redirectUrl (el navegador previsualizará PDFs nativos)
          const fallback: string = response?.redirectUrl || downloadUrl;
          if (fallback && (fallback.startsWith('https://') || fallback.startsWith('http://'))) {
            window.open(fallback, '_blank', 'noopener,noreferrer');
          } else {
            this.toastrService.warning('No se pudo obtener el enlace de visualización', 'Advertencia');
          }
        },
        error: () => {
          this.loadingViewUrl = false;
          this.toastrService.danger('Error al obtener el enlace de visualización', 'Error');
        }
      });
  }

  /** Abre una URL externa en nueva pestaña de forma segura (solo URLs del backend) */
  openAssetInTab(url: string): void {
    if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  /** Fuerza la descarga de un asset. Para URLs cross-origin abre en nueva pestaña. */
  downloadAsset(url: string, filename = 'archivo'): void {
    if (!url || !(url.startsWith('https://') || url.startsWith('http://'))) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  onAssetImageChange(event: any): void {
    const file: File = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
      this.toastrService.warning('Selecciona una imagen válida (JPG, PNG, WEBP)', 'Advertencia');
      return;
    }
    this.uploadingImage = true;
    this.uploadSingleAsset(file, 'image');
  }

  onAssetPdfPreviewChange(event: any): void {
    const file: File = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.name.split('.').pop()?.toLowerCase() !== 'pdf') {
      this.toastrService.warning('El archivo de previsualización debe ser un PDF', 'Advertencia');
      return;
    }
    this.uploadingPdfPreview = true;
    this.uploadSingleAsset(file, 'pdfPreview');
  }

  onAssetMainDocChange(event: any): void {
    const file: File = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const format: string = this.documentForm.get('format')?.value || '';
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const allowed: Record<string, string[]> = { PDF: ['pdf'], DOCX: ['doc', 'docx'], ZIP: ['zip'] };
    if (allowed[format] && !allowed[format].includes(ext)) {
      this.toastrService.warning(`El archivo debe tener formato ${format}`, 'Advertencia');
      return;
    }
    this.uploadingMainDoc = true;
    this.uploadSingleAsset(file, 'mainDoc');
  }

  /**
   * Sube un único asset al endpoint dedicado correspondiente.
   * Cada tipo va a su propio endpoint PATCH para no tocar el resto
   * de los metadatos del documento.
   */
  private uploadSingleAsset(file: File, type: 'image' | 'pdfPreview' | 'mainDoc'): void {
    const docId = Number(this.id);
    let request$;
    switch (type) {
      case 'image':
        request$ = this.documentsService.replaceCoverImage(docId, file);
        break;
      case 'pdfPreview':
        request$ = this.documentsService.replacePreview(docId, file);
        break;
      case 'mainDoc':
        request$ = this.documentsService.replaceMainFile(docId, file);
        break;
    }

    request$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          if (type === 'image') this.uploadingImage = false;
          if (type === 'pdfPreview') this.uploadingPdfPreview = false;
          if (type === 'mainDoc') this.uploadingMainDoc = false;
          this.toastrService.success('Archivo actualizado correctamente', 'Éxito');
          this.refreshAssetUrls();
        },
        error: (err) => {
          if (type === 'image') this.uploadingImage = false;
          if (type === 'pdfPreview') this.uploadingPdfPreview = false;
          if (type === 'mainDoc') this.uploadingMainDoc = false;
          const msg = err?.error?.error || err?.error?.message || 'Error al actualizar el archivo';
          this.toastrService.danger(msg, 'Error');
          this.cd.detectChanges();
        }
      });
  }

  private refreshAssetUrls(): void {
    this.documentsService.getDocument(this.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.data.imagenUrlPublic) {
            this.existingImageUrl = response.data.imagenUrlPublic;
          }
          if (response.data.pdfPreviewUrl) {
            this.existingPdfPreviewUrlRaw = response.data.pdfPreviewUrl;
            this.existingPdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(response.data.pdfPreviewUrl);
          }
          this.cd.detectChanges();
        },
        error: () => {}
      });
  }


  private parsePaginasPreView(paginasStr: string): number[] {
    const paginas: number[] = [];
    const partes = paginasStr.split(',').map(p => p.trim());
    
    partes.forEach(parte => {
      if (parte.includes('-')) {
        // Rango: "1-3" → [1, 2, 3]
        const [inicio, fin] = parte.split('-').map(n => parseInt(n.trim()));
        for (let i = inicio; i <= fin; i++) {
          paginas.push(i);
        }
      } else {
        // Número individual: "5" → [5]
        paginas.push(parseInt(parte));
      }
    });
    
    return [...new Set(paginas)].sort((a, b) => a - b); // Eliminar duplicados y ordenar
  }

  onPriceFocus(event: FocusEvent): void {
    const target = event.target as HTMLInputElement;
    target.select();
  }

  // ✅ NUEVO: Verificar si paginasPreView es requerido
  private arePaginasPreViewRequired(): boolean {
    const format = this.documentForm.get('format')?.value;
    const suscripcion = this.documentForm.get('suscripcion')?.value;
    
    // En modo edición, NO es requerido
    if (this.mode === 'edit') {
      return false;
    }
    
    // Documentos de suscripción NO requieren paginasPreView
    if (suscripcion === true) {
      return false;
    }
    
    // ZIP y OTROS NO requieren paginasPreView (usan PDF de preview)
    if (format === 'ZIP' || format === 'OTROS') {
      return false;
    }
    
    // PDF y DOCX SÍ requieren paginasPreView
    return true;
  }

  // Imágenes no son requeridas: el backend extrae portada del PDF/DOCX,
  // y ZIP/OTROS usan PDF de preview. Se conserva el método por compatibilidad.
  private areImagesRequired(): boolean {
    return false;
  }

  private updateImageValidation(): void {
    this.imagesError = null;
  }
  
  onImagesChange(event: any): void {
    const files = event.target.files;
    if (files.length > 0) {
      this.images = Array.from(files);
      this.imagesError = null;
    } else {
      this.images = [];
      this.imagesError = null;
    }
  }

  onMateriaSuscripcionChange(materiaId: number): void {
    console.debug('onMateriaSuscripcionChange called', { materiaId });
    const selectedMateria = this.allMateriasData.find(materia => materia.id === materiaId);
    console.debug('onMateriaSuscripcionChange selectedMateria', { selectedMateria });
    if (selectedMateria) {
      this.opcionesSuscripcion = selectedMateria.opciones;
      this.documentForm.get('opcionesSuscripcion')?.enable();
      this.documentForm.get('opcionesSuscripcion')?.setValue('');
    } else {
      this.opcionesSuscripcion = [];
      this.documentForm.get('opcionesSuscripcion')?.disable();
      this.documentForm.get('opcionesSuscripcion')?.setValue('');
    }
  }

  // Funciones para manejar situaciones

  /** Años únicos presentes en el array de situaciones cargado */
  get situacionesAnios(): number[] {
    const years = this.situaciones
      .map(s => s.anio)
      .filter((y, i, arr) => y != null && arr.indexOf(y) === i) as number[];
    return years.sort((a, b) => b - a); // descendente
  }

  /**
   * Situaciones de un año para el SELECT.
   * - En modo CREATE: excluye borradoLogico=true (no las muestra)
   * - En modo EDIT: devuelve todas incluyendo borradoLogico=true
   */
  getSituacionesByAnio(anio: number): Situaciones[] {
    const todas = this.situaciones.filter(s => s.anio === anio);
    const filtradas = this.mode === 'edit' ? todas : todas.filter(s => !s.borradoLogico);
    return filtradas.sort((a, b) => (a.unidadNumero ?? 0) - (b.unidadNumero ?? 0));
  }

  /** En modo create, una situación activo=false se muestra pero deshabilitada */
  isSituacionDisabled(sit: Situaciones): boolean {
    if (this.mode === 'edit') return false;
    return sit.activo === false;
  }

  /** Etiqueta descriptiva de una situación para mostrar en el select */
  getSituacionLabel(sit: Situaciones): string {
    const estado = sit.borradoLogico ? ' [ELIMINADA]' : (!sit.activo ? ' [INACTIVA]' : '');
    const unidad = sit.unidadNumero != null ? `Unidad ${sit.unidadNumero}: ` : '';
    return `${unidad}${sit.nombre}${estado}`;
  }

  // ---- Gestión inline create / edit de situaciones ----

  abrirCrearSituacion(): void {
    const nivel = this.documentForm.get('nivel')?.value || '';
    this.situacionFormData = {
      nombre: '',
      nivel,
      unidadNumero: null,
      anio: null,
      activo: true,
      borradoLogico: false
    };
    this.modoGestionSituacion = 'crear';
  }

  abrirEditarSituacion(): void {
    const id = this.documentForm.get('situacionesId')?.value;
    if (!id || id === 'nueva') return;
    const sit = this.situaciones.find(s => s.id === id || s.id === Number(id));
    if (!sit) return;
    this.situacionFormData = {
      id: sit.id,
      nombre: sit.nombre,
      nivel: sit.nivel,
      unidadNumero: sit.unidadNumero,
      anio: sit.anio,
      activo: sit.activo !== false,
      borradoLogico: sit.borradoLogico === true
    };
    this.modoGestionSituacion = 'editar';
  }

  cancelarGestionSituacion(): void {
    this.modoGestionSituacion = 'none';
  }

  guardarGestionSituacion(): void {
    const dto: Partial<Situaciones> = {
      nombre: this.situacionFormData.nombre,
      nivel: this.situacionFormData.nivel,
      unidadNumero: this.situacionFormData.unidadNumero,
      anio: this.situacionFormData.anio,
      activo: this.situacionFormData.activo,
      borradoLogico: this.situacionFormData.borradoLogico
    };

    if (this.modoGestionSituacion === 'crear') {
      this.documentsService.createSituacion(dto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            this.toastrService.success('Situación creada correctamente', 'Éxito');
            this.modoGestionSituacion = 'none';
            // Recargar lista y pre-seleccionar la nueva
            this.recargarSituacionesYSeleccionar(res?.data?.id ?? res?.id);
          },
          error: () => this.toastrService.danger('Error al crear la situación', 'Error')
        });
    } else {
      this.documentsService.updateSituacion(this.situacionFormData.id!, dto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastrService.success('Situación actualizada correctamente', 'Éxito');
            this.modoGestionSituacion = 'none';
            const currentId = this.documentForm.get('situacionesId')?.value;
            this.recargarSituacionesYSeleccionar(currentId);
          },
          error: () => this.toastrService.danger('Error al actualizar la situación', 'Error')
        });
    }
  }

  private recargarSituacionesYSeleccionar(idToSelect?: number): void {
    this.documentsService.getSituaciones()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.situaciones = response.data || [];
          if (idToSelect) {
            this.documentForm.get('situacionesId')?.setValue(idToSelect);
          }
          this.cd.detectChanges();
        },
        error: () => {}
      });
  }

  private cargarSituaciones(): void {
    this.documentsService.getSituaciones()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.result && response.data && response.data.length > 0) {
            this.situaciones = response.data;
          } else {
            this.situaciones = [];
            this.toastrService.info('No se encontraron situaciones disponibles', 'Información');
          }
        },
        error: (error) => {
          console.error('Error al cargar situaciones:', error);
          this.toastrService.danger('Error al cargar las situaciones', 'Error');
          this.situaciones = [];
        }
      });
  }

  // ✅ NUEVO: Cargar situaciones filtradas por nivel (usa getSituaciones() para tener activo y borradoLogico)
  private cargarSituacionesPorNivel(nivel: string): void {
    // Siempre cargamos TODAS para poder agrupar / mostrar inactivas en modo edit
    this.documentsService.getSituaciones()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.result && response.data && response.data.length > 0) {
            // En modo create filtramos a las de ese nivel; en edit se muestran todas
            this.situaciones = this.mode === 'edit'
              ? response.data
              : response.data.filter((s: Situaciones) => !s.nivel || s.nivel === nivel || s.nivel.toUpperCase() === nivel.toUpperCase());
          } else {
            this.situaciones = [];
            this.toastrService.info(`No hay situaciones disponibles para el nivel ${nivel}`, 'Información');
          }
        },
        error: (error) => {
          console.error('Error al cargar situaciones por nivel:', error);
          this.situaciones = [];
          this.toastrService.danger('Error al cargar las situaciones', 'Error');
        }
      });
  }

  // ✅ NUEVO: Cargar unidades programáticas
  private loadUnitSchedules(): void {
    this.documentsService.getUnitSchedules()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response && Array.isArray(response)) {
            this.unitSchedules = response;
            // Extraer años únicos y ordenar
            const years = this.unitSchedules
              .map(u => u.anio || u.year)
              .filter((year, index, self) => year && self.indexOf(year) === index);
            this.unitScheduleYears = years.sort((a, b) => b - a); // Descendente
          }
        },
        error: (error) => {
          console.error('Error al cargar unidades programáticas:', error);
          this.toastrService.danger('Error al cargar las unidades programáticas', 'Error');
          // Valores por defecto en caso de error
          this.unitSchedules = [];
          this.unitScheduleYears = [];
        }
      });
  }

  // ✅ NUEVO: Cargar unidades programáticas filtradas por tipo de suscripción
  private loadUnitSchedulesBySubscriptionType(subscriptionTypeId: number): void {
    console.debug('loadUnitSchedulesBySubscriptionType called', { subscriptionTypeId });
    this.documentsService.getUnitSchedulesBySubscriptionType(subscriptionTypeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.debug('loadUnitSchedulesBySubscriptionType response', { response });
          if (response && Array.isArray(response)) {
            this.unitSchedules = response;
            // Extraer años únicos y ordenar
            const years = this.unitSchedules
              .map(u => u.anio || u.year)
              .filter((year, index, self) => year && self.indexOf(year) === index);
            this.unitScheduleYears = years.sort((a, b) => b - a); // Descendente
          }
        },
        error: (error) => {
          console.error('Error al cargar unidades programáticas por tipo de suscripción:', error);
          this.toastrService.danger('Error al cargar las unidades programáticas', 'Error');
          // Valores por defecto en caso de error
          this.unitSchedules = [];
          this.unitScheduleYears = [];
        }
      });
  }

  // ✅ NUEVO: Obtener unidades por año
  getUnitsByYear(year: number): any[] {
    return this.unitSchedules.filter(u => (u.anio || u.year) === year);
  }

  // ✅ NUEVO: Método para actualizar el estado del checkbox isKits
  private actualizarEstadoIsKits(): void {
    const categoria = this.documentForm.get('category')?.value;
    const nivel = this.documentForm.get('nivel')?.value;
    const isKitsControl = this.documentForm.get('isKits');

    // Habilitar isKits solo si es PLANIFICACION y hay un nivel seleccionado
    if (categoria === 'PLANIFICACION' && nivel) {
      isKitsControl?.enable();
    } else {
      isKitsControl?.setValue(false);
      isKitsControl?.disable();
      
      // Limpiar situaciones si se deshabilita
      this.documentForm.get('situacionesId')?.setValue('');
      this.documentForm.get('situacionesId')?.disable();
      this.documentForm.get('situacionesNombre')?.setValue('');
      this.documentForm.get('situacionesNombre')?.disable();
      this.mostrarNuevaSituacion = false;
      this.situaciones = [];
    }
  }

  onSituacionChange(_situacionValue: string): void {
    // Mantenemos siempre el validador required para situacionesId.
    // El flujo de "nueva" / "editar" se gestiona ahora con los botones del template
    // y el formulario inline (modoGestionSituacion).
    const ctrl = this.documentForm.get('situacionesId');
    if (ctrl && !ctrl.hasValidator(Validators.required)) {
      ctrl.setValidators([Validators.required]);
      ctrl.updateValueAndValidity();
    }
  }

  getDisplayCategoryName(category: string): string {
    if (category === 'PLANIFICACION') {
      return 'SESIONES';
    } else if (category === 'PLAN_LECTOR') {
      return 'PLAN LECTOR';
    }
    return category;
  }

  /**
   * Abre el modal de gestión de jerarquías (Categoría, Nivel, Materia, Grado)
   */
  openHierarchyEditor(type: 'category' | 'level' | 'subject' | 'grade'): void {
    const dialogRef = this.dialog.open(HierarchyEditorModalComponent, {
      width: '700px',
      maxWidth: '95vw',
      data: {
        type: type,
        mode: 'create',
        parentData: {
          categoryCode: this.documentForm.get('category')?.value,
          categoryId: this.findIdByCode(this.categories, this.documentForm.get('category')?.value),
          levelCode: this.documentForm.get('nivel')?.value,
          levelId: this.findIdByCode(this.niveles, this.documentForm.get('nivel')?.value),
          subjectCode: this.documentForm.get('materia')?.value,
          subjectId: this.findIdByCode(this.materias, this.documentForm.get('materia')?.value)
        }
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.saved) {
        const cat = this.documentForm.get('category')?.value;
        const niv = this.documentForm.get('nivel')?.value;
        const mat = this.documentForm.get('materia')?.value;

        switch (type) {
          case 'category':
            this.loadCategories();
            // Auto-seleccionar la categoría recién creada
            const newCatCode = result.data?.code;
            if (newCatCode) {
              this.documentForm.get('category')?.setValue(newCatCode);
            }
            break;

          case 'level':
            if (cat) {
              const categoryId = this.findIdByCode(this.categories, cat);
              if (!categoryId) break;
              this.loadingDocument = true;
              this.gradeHierarchyService.getLevels(categoryId).pipe(takeUntil(this.destroy$)).subscribe({
                next: (niveles) => {
                  this.niveles = niveles;
                  this.loadingNiveles = false;
                  const newCode = result.data?.code;
                  if (newCode) {
                    this.documentForm.get('nivel')?.setValue(newCode);
                  }
                  this.loadingDocument = false;
                },
                error: () => {
                  this.loadingNiveles = false;
                  this.loadingDocument = false;
                }
              });
            }
            break;

          case 'subject':
            if (cat && niv) {
              const levelId = this.findIdByCode(this.niveles, niv);
              if (!levelId) break;
              this.loadingDocument = true;
              this.gradeHierarchyService.getSubjects(levelId).pipe(takeUntil(this.destroy$)).subscribe({
                next: (materias) => {
                  this.materias = materias;
                  this.loadingMaterias = false;
                  const newCode = result.data?.result?.code ?? result.data?.code;
                  if (newCode) {
                    this.documentForm.get('materia')?.setValue(newCode);
                  }
                  this.loadingDocument = false;
                },
                error: () => {
                  this.loadingMaterias = false;
                  this.loadingDocument = false;
                }
              });
            }
            break;

          case 'grade':
            if (cat && niv && mat) {
              const subjectId = this.findIdByCode(this.materias, mat);
              if (!subjectId) break;
              this.loadingDocument = true;
              this.gradeHierarchyService.getGrades(subjectId).pipe(takeUntil(this.destroy$)).subscribe({
                next: (grados) => {
                  this.grados = grados;
                  this.loadingGrados = false;
                  const newCode = result.data?.result?.code ?? result.data?.code;
                  if (newCode) {
                    this.documentForm.get('grado')?.setValue(newCode);
                  }
                  this.loadingDocument = false;
                },
                error: () => {
                  this.loadingGrados = false;
                  this.loadingDocument = false;
                }
              });
            }
            break;
        }
      }
    });
  }
}