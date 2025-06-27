import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DocumentsService } from '../../@core/backend/services/documents.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DocumentData } from '../../@core/interfaces/documents';
import { NbToastrService } from '@nebular/theme';

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

  categories = ['PLANIFICACION', 'EVALUACION', 'ESTRATEGIAS', 'RECURSOS', 'CONCURSOS', 'EBOOKS', 'TALLERES'];
  formatos = ['PDF', 'DOCX', 'ZIP'];
  niveles = ['INICIAL', 'PRIMARIA', 'SECUNDARIA'];
  grados: string[] = [];
  materias: string[] = [];
  detalleMaterias: string[] = [];
  filePdfDelWord: File | null = null;
  filePdfDelWordError: string | null = null;

  materiasSuscripcion: string[] = ['Matemáticas', 'Ciencias', 'Historia'];
  opcionesSuscripcion: string[] = ['Opción 1', 'Opción 2', 'Opción 3'];

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
  ) {}

  ngOnInit(): void {
    this.mode = this.dialogData.mode;
    this.id = this.dialogData.id;

    this.initForm();

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
      documentoLibre: [false, Validators.required], // Inicializar como false
      numeroPaginas: [{ value: '', disabled: true }, [Validators.required, Validators.min(1)]],
      suscripcion: [false, Validators.required],
      materiasSuscripcion: [{ value: '', disabled: true }],
      opcionesSuscripcion: [{ value: '', disabled: true }],
      linkZip: [{ value: '', disabled: true }, [Validators.required]],
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
        numeroPaginas: response.data.numeroDePaginas
      });

      // Habilitar el control grado antes de establecer su valor
      this.documentForm.get('grado')?.enable();
      this.documentForm.get('grado')?.setValue(response.data.grado);

      // Manejar el estado del precio después de cargar los datos
      if (response.data.documentoLibre) {
        this.documentForm.get('price')?.disable();
      } else {
        this.documentForm.get('price')?.enable();
      }

      this.ready = true;
    });
  }

  private setupFormListeners(): void {
    this.documentForm.get('nivel')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((nivel) => {
      this.updateGrados(nivel);
      this.updateMaterias(nivel);
      this.documentForm.get('materia')?.enable();
    });

    this.documentForm.get('materia')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((materia) => {
      this.updateGrados(this.documentForm.get('nivel')?.value, materia);
      if (materia) {
        this.documentForm.get('grado')?.enable();
      } else {
        this.documentForm.get('grado')?.disable();
      }
    });

    this.documentForm.get('category')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((categoria) => {
      this.onCategoryChange(categoria);
      const gradoControl = this.documentForm.get('grado');
      const materiaControl = this.documentForm.get('materia');

      if (categoria === 'PLANIFICACION') {
        gradoControl?.setValidators([Validators.required]);
      } else {
        gradoControl?.clearValidators();
      }

      if (categoria === 'CONCURSOS' || categoria === 'RECURSOS') {
        materiaControl?.clearValidators();
        gradoControl?.clearValidators();
      } else {
        materiaControl?.setValidators([Validators.required]);
      }

      gradoControl?.updateValueAndValidity();
      materiaControl?.updateValueAndValidity();
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

    this.documentForm.get('format')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((format) => {
        // Limpiar el archivo cuando cambia el formato
        this.file = null;
        this.fileError = null;
        this.pdfSrc = null;

        if (format === 'ZIP') {
          this.documentForm.get('numeroPaginas')?.enable();
          this.documentForm.get('linkZip')?.enable();
          this.documentForm.get('linkZip')?.setValidators([Validators.required, Validators.pattern('https?://.+')]);
        } else {
          this.documentForm.get('numeroPaginas')?.disable();
          this.documentForm.get('numeroPaginas')?.setValue('');
          this.documentForm.get('linkZip')?.disable();
          this.documentForm.get('linkZip')?.clearValidators();
          this.documentForm.get('linkZip')?.setValue('');
        }
        this.documentForm.get('linkZip')?.updateValueAndValidity();
      
      });

    this.documentForm.get('suscripcion')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((isSuscripcion) => {
      if (isSuscripcion) {
        this.documentForm.get('materiasSuscripcion')?.enable();
        this.documentForm.get('opcionesSuscripcion')?.enable();
      } else {
        this.documentForm.get('materiasSuscripcion')?.disable();
        this.documentForm.get('opcionesSuscripcion')?.disable();
      }
    });
  }

  private updateGrados(nivel: string, materia?: string): void {
    const gradosMap = {
      INICIAL: ['3 años', '4 años', '5 años'],
      PRIMARIA: ['III CICLO 1°-2°', 'IV CICLO 3°-4°', 'V CICLO 5°-6°'],
      SECUNDARIA: materia && ['ARTE_Y_CULTURA', 'INGLES', 'RELIGION', 'EPT', 'TUTORIA'].includes(materia)
        ? ['1°-2°', '3°-4°', '5°']
        : ['1°', '2°', '3°', '4°', '5°']
    };

    this.grados = gradosMap[nivel] || [];
    this.documentForm.get('grado')?.setValue('');
  }

  private updateMaterias(nivel: string): void {
    const categoria = this.documentForm.get('category')?.value;
    const materiasMap = {
      PLANIFICACION: {
        INICIAL: ['PERSONAL_SOCIAL', 'COMUNICACION', 'MATEMATICA', 'CIENCIA_Y_TECNOLOGIA', 'PSICOMOTRICIDAD', 'TUTORIA'],
        PRIMARIA: ['PERSONAL_SOCIAL', 'COMUNICACION', 'MATEMATICA', 'CIENCIA_Y_TECNOLOGIA', 'ARTE_Y_CULTURA', 'RELIGION', 'TUTORIA'],
        SECUNDARIA: ['COMUNICACION', 'MATEMATICA', 'CIENCIAS_SOCIALES', 'DESARROLLO_PERSONAL', 'CIENCIA_Y_TECNOLOGIA', 'ARTE_Y_CULTURA', 'INGLES', 'RELIGION', 'EPT', 'TUTORIA']
      },
      EVALUACION: {
        INICIAL: ['PERSONAL_SOCIAL', 'COMUNICACION', 'MATEMATICA', 'CIENCIA_Y_TECNOLOGIA', 'PSICOMOTRICIDAD'],
        PRIMARIA: ['PERSONAL_SOCIAL', 'COMUNICACION', 'MATEMATICA', 'CIENCIA_Y_TECNOLOGIA', 'ARTE_Y_CULTURA', 'RELIGION', 'FISICA'],
        SECUNDARIA: ['COMUNICACION', 'MATEMATICA', 'CIENCIAS_SOCIALES', 'DESARROLLO_PERSONAL', 'CIENCIA_Y_TECNOLOGIA', 'ARTE_Y_CULTURA', 'INGLES', 'RELIGION', 'EMPRENDIMIENTO', 'FISICA']
      },
      ESTRATEGIAS: {
        INICIAL: ['PERSONAL_SOCIAL', 'COMUNICACION', 'MATEMATICA', 'CIENCIA_Y_TECNOLOGIA', 'PSICOMOTRICIDAD'],
        PRIMARIA: ['PERSONAL_SOCIAL', 'COMUNICACION', 'MATEMATICA', 'CIENCIA_Y_TECNOLOGIA', 'ARTE_Y_CULTURA', 'RELIGION'],
        SECUNDARIA: ['COMUNICACION', 'MATEMATICA', 'CIENCIAS_SOCIALES', 'DESARROLLO_PERSONAL', 'CIENCIA_Y_TECNOLOGIA', 'ARTE_Y_CULTURA', 'INGLES', 'RELIGION', 'EPT']
      },
      EBOOKS: {
        INICIAL: ['PERSONAL_SOCIAL', 'COMUNICACION', 'MATEMATICA', 'CIENCIA_Y_TECNOLOGIA', 'PSICOMOTRICIDAD', 'TUTORIA'],
        PRIMARIA: ['PERSONAL_SOCIAL', 'COMUNICACION', 'MATEMATICA', 'CIENCIA_Y_TECNOLOGIA', 'ARTE_Y_CULTURA', 'RELIGION', 'TUTORIA'],
        SECUNDARIA: ['COMUNICACION', 'MATEMATICA', 'CIENCIAS_SOCIALES', 'DESARROLLO_PERSONAL', 'CIENCIA_Y_TECNOLOGIA', 'ARTE_Y_CULTURA', 'INGLES', 'RELIGION', 'EPT', 'TUTORIA']
      },
      TALLERES: {
        INICIAL: ['PERSONAL_SOCIAL', 'COMUNICACION', 'MATEMATICA', 'CIENCIA_Y_TECNOLOGIA', 'PSICOMOTRICIDAD', 'TUTORIA'],
        PRIMARIA: ['PERSONAL_SOCIAL', 'COMUNICACION', 'MATEMATICA', 'CIENCIA_Y_TECNOLOGIA', 'ARTE_Y_CULTURA', 'RELIGION', 'TUTORIA'],
        SECUNDARIA: ['COMUNICACION', 'MATEMATICA', 'CIENCIAS_SOCIALES', 'DESARROLLO_PERSONAL', 'CIENCIA_Y_TECNOLOGIA', 'ARTE_Y_CULTURA', 'INGLES', 'RELIGION', 'EPT', 'TUTORIA']
      }
    };

    this.materias = materiasMap[categoria]?.[nivel] || [];
    this.documentForm.get('materia')?.setValue('');
  }

  private onCategoryChange(categoria: string): void {
    this.updateMaterias(this.documentForm.get('nivel')?.value);
    this.niveles = categoria === 'CONCURSOS' ? ['PRIMARIA', 'SECUNDARIA'] : ['INICIAL', 'PRIMARIA', 'SECUNDARIA'];
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


  onSubmit(): void {
    if (this.documentForm.valid) {
      this.isLoading = true; // Indicate loading state

      if (this.mode === 'create') {
        const format = this.documentForm.get('format')?.value;
        let formData: FormData;

        if (format === 'ZIP') {
          // Create form data without the main file for ZIP format
          formData = this.createFormData(false);
        } else {
          // Include the main file for other formats
          formData = this.createFormData(true);
        }

        this.onUpload(formData);
      } else if (this.mode === 'edit') {
        const formData = this.createFormData(this.file !== null); // Include the file if it exists
        this.onUpdate(formData);
      }
    } else {
      this.toastrService.warning('Por favor, complete todos los campos requeridos', 'Advertencia');
    }
  }

  private createFormData(includeFile: boolean = true): FormData {
    const formData = new FormData();
    formData.append('title', this.documentForm.get('title')?.value);
    formData.append('description', this.documentForm.get('description')?.value);
    formData.append('format', this.documentForm.get('format')?.value);
    formData.append('price', this.documentForm.get('price')?.value);
    formData.append('category', this.documentForm.get('category')?.value);
    formData.append('nivel', this.documentForm.get('nivel')?.value);
    formData.append('grado', this.documentForm.get('grado')?.value);
    formData.append('materia', this.documentForm.get('materia')?.value);
    formData.append('documentoLibre', this.documentForm.get('documentoLibre')?.value);
    formData.append('numeroDePaginas', this.documentForm.get('numeroPaginas')?.value);
    formData.append('suscription', this.documentForm.get('suscripcion')?.value);
    formData.append('materiasSuscripcion', this.documentForm.get('materiasSuscripcion')?.value);
    formData.append('opcionesSuscripcion', this.documentForm.get('opcionesSuscripcion')?.value);
    formData.append('fileUrlPublic', this.documentForm.get('linkZip')?.value); // Añadir el campo linkZip

    // Solo incluye el archivo si includeFile es true y existe un archivo
    if (includeFile && this.file) {
      formData.append('file', this.file);
    }

    // Solo incluye el archivo PDF adicional en modo crear y si existe
    if (this.filePdfDelWord) {
      formData.append('filePdfDelWord', this.filePdfDelWord);
    }

    if (this.images.length > 0) {
      this.images.forEach((image, index) => {
        formData.append(`images[${index}]`, image);
      });
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

  onPriceFocus(event: FocusEvent): void {
    const target = event.target as HTMLInputElement;
    target.select();
  }
  
  onImagesChange(event: any): void {
    const files = event.target.files;
    if (files.length > 0) {
      this.images = Array.from(files);
      this.imagesError = null;
    } else {
      this.images = [];
      this.imagesError = 'Debe seleccionar al menos una imagen';
    }
  }

}
