import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DocumentsService } from '../../@core/backend/services/documents.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable, Subject, of } from 'rxjs';
import { takeUntil, map, catchError } from 'rxjs/operators';
import { DocumentData } from '../../@core/interfaces/documents';
import { NbToastrService } from '@nebular/theme';
import { MembresiaService } from '../../@core/backend/services/membresia.service';
import { Materias, Opciones } from '../../@core/interfaces/membresia';
import { GradeHierarchyService } from '../../@core/backend/services/grade-hierarchy.service';
import { HierarchyItem } from '../../@core/interfaces/grade-hierarchy';

@Component({
  selector: 'ngx-formulario-documentos',
  templateUrl: './formulario-documentos.component.html',
  styleUrls: ['./formulario-documentos.component.scss']
})
export class FormularioDocumentosComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  id: string;
  mode: string;
  documentForm: FormGroup;
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

  materiasSuscripcion: Materias[] = [];
  opcionesSuscripcion: Opciones[] = [];
  allMateriasData: Materias[] = [];

  // Propiedades para situaciones
  situaciones: any[] = [];
  mostrarNuevaSituacion = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private documentsService: DocumentData,
    private snackBar: MatSnackBar,
    private cd: ChangeDetectorRef,
    protected ref: MatDialogRef<FormularioDocumentosComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: { mode: string; id: string },
    private toastrService: NbToastrService,
    private membresiaService: MembresiaService,
    private gradeHierarchyService: GradeHierarchyService,
  ) {}

  ngOnInit(): void {
    this.mode = this.dialogData.mode;
    this.id = this.dialogData.id;

    this.initForm();
    
    // ✅ Cargar categorías desde backend
    this.loadCategories();

    if (this.mode === 'edit') {
      this.loadDocument(this.id);
    } else {
      this.ready = true;
    }

    this.setupFormListeners();
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
      isKits: [false],
      situacionesId: [{ value: '', disabled: true }],
      situacionesNombre: [{ value: '', disabled: true }],
      numeroPaginas: [{ value: '', disabled: true }, [Validators.required, Validators.min(1)]],
      paginasPreView: [{ value: '', disabled: true }], // ✅ NUEVO: Páginas para preview
      suscripcion: [false, Validators.required],
      subscriptionType: [{ value: '', disabled: true }],
      materiasSuscripcion: [{ value: '', disabled: true }],
      opcionesSuscripcion: [{ value: '', disabled: true }],
      linkZip: [{ value: '', disabled: true }, this.mode === 'edit' ? [] : [Validators.required]],
    });
  }

  private loadDocument(id: string): void {
    this.ready = false;
    this.documentsService.getDocument(id).pipe(takeUntil(this.destroy$)).subscribe((response) => {
      

      this.documentForm.patchValue({
        title: response.data.title,
        description: response.data.description,
        format: response.data.format,
        price: response.data.price,
        category: response.data.category,
        nivel: response.data.nivel,
        materia: response.data.materia || '',
        documentoLibre: response.data.documentoLibre,
        isKits: false, // Inicializar en false, se detectará automáticamente después
        numeroPaginas: response.data.numeroDePaginas
      });

    

      // Detectar automáticamente si es un kit (PLANIFICACION + ZIP)
      const isAutoKit = response.data.category === 'PLANIFICACION' && 
                        (response.data.format.toLowerCase() === 'zip');
      
    
      
      if (isAutoKit) {
        this.documentForm.patchValue({ isKits: true });
        
        
        // Forzar la actualización de los campos dependientes
        this.documentForm.get('situacionesId')?.enable();
        this.documentForm.get('situacionesId')?.setValidators([Validators.required]);
        this.documentForm.get('situacionesId')?.updateValueAndValidity();
        
        // Cargar situaciones automáticamente para kits
        this.cargarSituaciones();
        
        // Cargar situación si existe en el documento
        if ((response.data as any).situacion) {
          const situacionId = (response.data as any).situacion.id;
          setTimeout(() => {
            this.documentForm.patchValue({ situacionesId: situacionId });
          }, 100); // Pequeño delay para asegurar que las situaciones se carguen primero
        }
        
        // Cargar URL del archivo ZIP si existe
        if ((response.data as any).linkZip) {
          const zipUrl = (response.data as any).linkZip;
          this.documentForm.patchValue({ linkZip: zipUrl });
        }
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
        // Aquí puedes mostrar la imagen existente en la UI pero no la asignas al formulario
        // para permitir que el usuario la reemplace completamente
      }

      // Cargar URL del archivo ZIP si existe (solo para mostrar, se puede reemplazar)
      if ((response.data as any).linkZip) {
        this.documentForm.patchValue({ linkZip: (response.data as any).linkZip });
      }

      // En modo edición, ajustar validaciones para documentos ZIP
      if (this.mode === 'edit' && response.data.format.toLowerCase() === 'zip') {
        this.documentForm.get('linkZip')?.enable();
        // Solo validar patrón de URL, no requerido
        this.documentForm.get('linkZip')?.setValidators([Validators.pattern('https?://.+')]);
        this.documentForm.get('linkZip')?.updateValueAndValidity();
        
        this.documentForm.get('numeroPaginas')?.enable();
      }

      this.ready = true;
      
      // Forzar detección de cambios para asegurar que la UI se actualice
      this.cd.detectChanges();
    });
  }

  private setupFormListeners(): void {
    this.documentForm.get('nivel')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((nivel) => {
      this.updateGrados(nivel);
      this.updateMaterias(nivel);
      
      // Habilitar materia para todas las categorías excepto las que no la requieren
      const categoria = this.documentForm.get('category')?.value;
      if (categoria && categoria !== 'CONCURSOS' && categoria !== 'RECURSOS') {
        this.documentForm.get('materia')?.enable();
      }
      
      // Habilitar grado automáticamente para categorías específicas
      if (nivel && ['PLAN_LECTOR', 'REFORZAMIENTO'].includes(categoria)) {
        this.documentForm.get('grado')?.enable();
      }
    });

    this.documentForm.get('materia')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((materia) => {
      this.updateGrados(this.documentForm.get('nivel')?.value, materia);
      const categoria = this.documentForm.get('category')?.value;
      
      // Para categorías que dependen de materia para habilitar grado
      if (['PLANIFICACION', 'EVALUACION', 'ESTRATEGIAS', 'EBOOKS', 'TALLERES'].includes(categoria)) {
        if (materia) {
          this.documentForm.get('grado')?.enable();
        } else {
          this.documentForm.get('grado')?.disable();
        }
      }
      // Para PLAN_LECTOR y REFORZAMIENTO, el grado ya está habilitado por el nivel
    });

    this.documentForm.get('category')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((categoria) => {
      this.onCategoryChange(categoria);
      const gradoControl = this.documentForm.get('grado');
      const materiaControl = this.documentForm.get('materia');
      const nivel = this.documentForm.get('nivel')?.value;

      // Categorías que requieren grado
      if (['PLANIFICACION', 'EVALUACION', 'ESTRATEGIAS', 'EBOOKS', 'TALLERES', 'PLAN_LECTOR', 'REFORZAMIENTO'].includes(categoria)) {
        gradoControl?.setValidators([Validators.required]);
      } else {
        gradoControl?.clearValidators();
      }

      // Categorías que NO requieren materia (CONCURSOS y RECURSOS)
      if (categoria === 'CONCURSOS' || categoria === 'RECURSOS') {
        materiaControl?.clearValidators();
        materiaControl?.disable();
        gradoControl?.clearValidators(); // CONCURSOS y RECURSOS tampoco requieren grado
        gradoControl?.disable();
      } else {
        materiaControl?.setValidators([Validators.required]);
        materiaControl?.enable();
        
        // Para PLAN_LECTOR y REFORZAMIENTO, habilitar grado directamente si hay nivel
        if (['PLAN_LECTOR', 'REFORZAMIENTO'].includes(categoria) && nivel) {
          gradoControl?.enable();
        }
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
          this.cargarSituaciones();
          this.documentForm.get('situacionesId')?.enable();
          // Hacer requerido el campo de situaciones cuando es kit
          this.documentForm.get('situacionesId')?.setValidators([Validators.required]);
          this.documentForm.get('situacionesId')?.updateValueAndValidity();
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
        }
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

        if (format === 'ZIP' || format === 'OTROS') {
          // ZIP y OTROS: Solo número de páginas habilitado
          // NO requieren linkZip ni paginasPreView (suben PDF de preview)
          this.documentForm.get('numeroPaginas')?.enable();
          this.documentForm.get('linkZip')?.disable();
          this.documentForm.get('linkZip')?.clearValidators();
          this.documentForm.get('linkZip')?.setValue('');
          this.documentForm.get('paginasPreView')?.disable();
          this.documentForm.get('paginasPreView')?.clearValidators();
          this.documentForm.get('paginasPreView')?.setValue('');
        } else {
          // PDF y DOCX: requieren paginasPreView
          this.documentForm.get('numeroPaginas')?.disable();
          this.documentForm.get('numeroPaginas')?.setValue('');
          this.documentForm.get('linkZip')?.disable();
          this.documentForm.get('linkZip')?.clearValidators();
          this.documentForm.get('linkZip')?.setValue('');
          
          // Habilitar paginasPreView solo si NO es suscripción
          const isSuscripcion = this.documentForm.get('suscripcion')?.value;
          if (!isSuscripcion) {
            this.documentForm.get('paginasPreView')?.enable();
            this.documentForm.get('paginasPreView')?.setValidators([Validators.required]);
          }
        }
        this.documentForm.get('linkZip')?.updateValueAndValidity();
        this.documentForm.get('paginasPreView')?.updateValueAndValidity();
        
        // Limpiar error de imágenes cuando cambie el formato
        this.updateImageValidation();
      });

    this.documentForm.get('suscripcion')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((isSuscripcion) => {
      if (isSuscripcion) {
        this.documentForm.get('subscriptionType')?.enable();
        this.documentForm.get('materiasSuscripcion')?.enable();
        this.documentForm.get('opcionesSuscripcion')?.enable();
        
        // ✅ Suscripciones NO requieren paginasPreView
        this.documentForm.get('paginasPreView')?.disable();
        this.documentForm.get('paginasPreView')?.clearValidators();
        this.documentForm.get('paginasPreView')?.setValue('');
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
        
        // ✅ Documentos normales requieren paginasPreView solo si NO es ZIP/OTROS
        const format = this.documentForm.get('format')?.value;
        if (format !== 'ZIP' && format !== 'OTROS') {
          this.documentForm.get('paginasPreView')?.enable();
          this.documentForm.get('paginasPreView')?.setValidators([Validators.required]);
        }
      }
      this.documentForm.get('paginasPreView')?.updateValueAndValidity();
      
      // Limpiar error de imágenes cuando cambie el estado de suscripción
      this.updateImageValidation();
    });

    // Listener para cambios en subscriptionType
    this.documentForm.get('subscriptionType')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((subscriptionTypeId) => {
      if (subscriptionTypeId) {
        this.loadMateriasOpciones(subscriptionTypeId);
      } else {
        this.materiasSuscripcion = [];
        this.opcionesSuscripcion = [];
        this.allMateriasData = [];
        this.documentForm.get('materiasSuscripcion')?.setValue('');
        this.documentForm.get('opcionesSuscripcion')?.setValue('');
      }
    });

    // Listener para cambios en materiasSuscripcion
    this.documentForm.get('materiasSuscripcion')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((materiaId) => {
      this.onMateriaSuscripcionChange(materiaId);
    });

    // Listener para cambios en isKits
    this.documentForm.get('isKits')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      const nivel = this.documentForm.get('nivel')?.value;
      const materia = this.documentForm.get('materia')?.value;
      if (nivel) {
        this.updateGrados(nivel, materia);
      }
    });
  }

  // ✅ NUEVO: Cargar grados desde backend
  private updateGrados(nivel: string, materia?: string): void {
    const categoria = this.documentForm.get('category')?.value;
    
    if (!categoria || !nivel || !materia) {
      this.grados = [];
      return;
    }
    
    this.loadingGrados = true;
    this.gradeHierarchyService.getGrades(categoria, nivel, materia)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (grados) => {
          this.grados = grados;
          this.loadingGrados = false;
        },
        error: (error) => {
          console.error('Error al cargar grados:', error);
          this.grados = [];
          this.loadingGrados = false;
        }
      });
    
    this.documentForm.get('grado')?.setValue('');
  }

  // ✅ NUEVO: Cargar materias desde backend
  private updateMaterias(nivel: string): void {
    const categoria = this.documentForm.get('category')?.value;
    
    if (!categoria || !nivel) {
      this.materias = [];
      return;
    }
    
    this.loadingMaterias = true;
    this.gradeHierarchyService.getSubjects(categoria, nivel)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (materias) => {
          this.materias = materias;
          this.loadingMaterias = false;
        },
        error: (error) => {
          console.error('Error al cargar materias:', error);
          this.materias = [];
          this.loadingMaterias = false;
        }
      });
    
    this.documentForm.get('materia')?.setValue('');
  }

  // ✅ NUEVO: Cargar categorías desde backend
  private loadCategories(): void {
    this.loadingCategories = true;
    this.gradeHierarchyService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categories = categories;
          this.loadingCategories = false;
        },
        error: (error) => {
          console.error('Error al cargar categorías:', error);
          this.toastrService.danger('Error al cargar las categorías', 'Error');
          this.loadingCategories = false;
        }
      });
  }

  // ✅ NUEVO: Cargar niveles desde backend
  private loadNiveles(categoryCode: string): void {
    this.loadingNiveles = true;
    this.gradeHierarchyService.getLevels(categoryCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (niveles) => {
          this.niveles = niveles;
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
    this.documentForm.get('nivel')?.setValue('');
    this.documentForm.get('materia')?.setValue('');
    this.documentForm.get('grado')?.setValue('');
  }

  updateDetalleMaterias(materia: string): void {
    const secundariaMaterias = {
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
    this.isLoading = true;
    this.membresiaService.getMateriasOpciones(subscriptionTypeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          
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
      const allowedExtensions = formatExtensions[selectedFormat];
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
      return;
    }

    // ✅ NUEVO: Validar paginasPreView (requerido para todos excepto suscripciones)
    if (this.arePaginasPreViewRequired()) {
      const paginasPreView = this.documentForm.get('paginasPreView')?.value;
      if (!paginasPreView || paginasPreView.trim() === '') {
        this.toastrService.warning('Debe especificar las páginas para la vista previa (ej: 1-3, 5, 7-9)', 'Advertencia');
        return;
      }
    }

    // Validar situaciones para kits
    if (this.documentForm.get('isKits')?.value) {
      const situacionesId = this.documentForm.get('situacionesId')?.value;
      const situacionesNombre = this.documentForm.get('situacionesNombre')?.value;
      
      // Debe haber seleccionado una situación existente O haber escrito una nueva
      if ((!situacionesId || situacionesId === '') && (!situacionesNombre || situacionesNombre.trim() === '')) {
        this.toastrService.warning('Para los kits debe seleccionar una situación significativa o crear una nueva', 'Advertencia');
        return;
      }
      
      // Si seleccionó "nueva" pero no escribió el nombre
      if (situacionesId === 'nueva' && (!situacionesNombre || situacionesNombre.trim() === '')) {
        this.toastrService.warning('Debe escribir el nombre de la nueva situación', 'Advertencia');
        return;
      }
    }

    if (this.documentForm.valid) {
      this.isLoading = true;

      // ✅ Obtener gradeId primero
      this.obtenerGradeId().subscribe({
        next: (gradeId) => {
          const formData = this.createFormData(gradeId);
          
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
      Object.keys(this.documentForm.controls).forEach(key => {
        const control = this.documentForm.get(key);
        if (control?.errors) {
        }
      });
      this.toastrService.warning('Por favor, complete todos los campos requeridos', 'Advertencia');
    }
  }

  private obtenerGradeId(): Observable<number | null> {
    const category = this.documentForm.get('category')?.value;
    const nivel = this.documentForm.get('nivel')?.value;
    const materia = this.documentForm.get('materia')?.value;
    const grado = this.documentForm.get('grado')?.value;

    // Para categorías sin jerarquía completa (RECURSOS, CONCURSOS)
    if (['RECURSOS', 'CONCURSOS'].includes(category)) {
      return of(null); // Backend manejará SIN_GRADO
    }

    // ✅ Usar servicio para consultar al backend
    return this.gradeHierarchyService.findGradeId(
      category,
      nivel,
      materia || 'GEN',
      grado || 'GEN'
    ).pipe(
      catchError(error => {
        console.warn('Grade no encontrado, usando null:', error);
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
    formData.append('nivel', this.documentForm.get('nivel')?.value);
    formData.append('grado', this.documentForm.get('grado')?.value || '');
    formData.append('materia', this.documentForm.get('materia')?.value || '');
    formData.append('documentoLibre', this.documentForm.get('documentoLibre')?.value);
    formData.append('isKits', this.documentForm.get('isKits')?.value);
    
    // ✅ NUEVO: Agregar gradeId obtenido del backend
    if (gradeId !== null && gradeId !== undefined) {
      formData.append('gradeId', gradeId.toString());
    }
    
    // Campos de situaciones para kits
    if (this.documentForm.get('isKits')?.value) {
      const situacionesId = this.documentForm.get('situacionesId')?.value;
      if (situacionesId && situacionesId !== 'nueva') {
        formData.append('situacionesId', situacionesId);
      }
      
      const situacionesNombre = this.documentForm.get('situacionesNombre')?.value;
      if (situacionesNombre && this.mostrarNuevaSituacion) {
        formData.append('situacionesNombre', situacionesNombre);
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
    
    if (format === 'ZIP' || format === 'OTROS') {
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

  private onUpload(formData: FormData): void {
    this.documentsService.uploadDocument(formData).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isLoading = false;
        this.toastrService.success('Documento guardado exitosamente', 'Éxito');
        this.ref.close();
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
        this.ref.close();
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
    this.ref.close();
  }

  // ✅ NUEVO: Parsear string de páginas "1-3, 5, 7-9" a array de números
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

  // Método helper para verificar si las imágenes son requeridas
  private areImagesRequired(): boolean {
    const format = this.documentForm.get('format')?.value;
    const suscripcion = this.documentForm.get('suscripcion')?.value;
    
    // En modo edición, las imágenes NO son requeridas
    if (this.mode === 'edit') {
      return false;
    }
    
    // ✅ NUEVA LÓGICA:
    // 1. PDF/DOCX: NO requieren imagen (se extrae del archivo principal)
    // 2. ZIP/OTROS: NO requieren imagen (suben PDF de preview que contiene las imágenes)
    // 3. Suscripciones: NO requieren imagen
    
    if (format === 'PDF' || format === 'DOCX') {
      return false; // Backend extraerá la imagen del PDF/DOCX
    }
    
    if (format === 'ZIP' || format === 'OTROS') {
      return false; // Usarán PDF de preview
    }
    
    if (suscripcion === true) {
      return false; // Suscripciones no llevan imagen
    }
    
    return false;
  }

  // Método para actualizar la validación de imágenes
  private updateImageValidation(): void {
    if (!this.areImagesRequired() && this.images.length === 0) {
      // Si las imágenes no son requeridas, limpiar cualquier error
      this.imagesError = null;
    } else if (this.areImagesRequired() && this.images.length === 0) {
      // Si las imágenes son requeridas y no hay ninguna, mostrar error
      this.imagesError = 'Debe seleccionar al menos una imagen';
    }
  }
  
  onImagesChange(event: any): void {
    const files = event.target.files;
    if (files.length > 0) {
      this.images = Array.from(files);
      this.imagesError = null;
    } else {
      this.images = [];
      // Solo mostrar error si las imágenes son requeridas
      if (this.areImagesRequired()) {
        this.imagesError = 'Debe seleccionar al menos una imagen';
      } else {
        this.imagesError = null;
      }
    }
  }

  onMateriaSuscripcionChange(materiaId: number): void {
    const selectedMateria = this.allMateriasData.find(materia => materia.id === materiaId);
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
  private cargarSituaciones(): void {
    this.documentsService.getSituaciones()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.result && response.data && response.data.length > 0) {
            this.situaciones = response.data; // Cambiar de response.result a response.data
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

  onSituacionChange(situacionValue: string): void {
    if (situacionValue === 'nueva') {
      this.mostrarNuevaSituacion = true;
      this.documentForm.get('situacionesNombre')?.enable();
      this.documentForm.get('situacionesNombre')?.setValidators([Validators.required, Validators.minLength(3)]);
      this.documentForm.get('situacionesNombre')?.updateValueAndValidity();
      
      // Quitar la validación requerida del select cuando se crea nueva
      this.documentForm.get('situacionesId')?.clearValidators();
      this.documentForm.get('situacionesId')?.updateValueAndValidity();
    } else if (situacionValue) {
      // Si selecciona una situación existente (no vacía y no 'nueva')
      this.mostrarNuevaSituacion = false;
      this.documentForm.get('situacionesNombre')?.disable();
      this.documentForm.get('situacionesNombre')?.clearValidators();
      this.documentForm.get('situacionesNombre')?.setValue('');
      this.documentForm.get('situacionesNombre')?.updateValueAndValidity();
      
      // Restaurar validación del select
      this.documentForm.get('situacionesId')?.setValidators([Validators.required]);
      this.documentForm.get('situacionesId')?.updateValueAndValidity();
    } else {
      // Si no selecciona nada (valor vacío)
      this.mostrarNuevaSituacion = false;
      this.documentForm.get('situacionesNombre')?.disable();
      this.documentForm.get('situacionesNombre')?.clearValidators();
      this.documentForm.get('situacionesNombre')?.setValue('');
      this.documentForm.get('situacionesNombre')?.updateValueAndValidity();
      
      // Mantener validación requerida en el select
      this.documentForm.get('situacionesId')?.setValidators([Validators.required]);
      this.documentForm.get('situacionesId')?.updateValueAndValidity();
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
}
