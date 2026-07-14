import { Component, OnInit, ViewEncapsulation, inject } from "@angular/core";
import { CurrencyPipe, DecimalPipe, UpperCasePipe } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { CreatorApiService, CreatorDocumentDto, CreatorDocumentForm, TutorialVideoDto } from "../services/creator-api.service";
import { GradeHierarchyService } from "../../@core/backend/services/grade-hierarchy.service";
import { HierarchyItem } from "../../@core/interfaces/grade-hierarchy";

type WizardStep = 1 | 2 | 3 | 4;

interface TutorialVideo {
  title: string;
  duration: string;
  thumbnail: string;
  videoUrl: string;
  description: string;
}

const MAX_MAIN_FILE_MB = 100;
const MAX_COVER_MB = 5;
const MAX_AUX_PDF_MB = 100;
const ACCEPTED_MAIN_EXT = ['pdf', 'doc', 'docx', 'xlsx', 'pptx', 'zip'];
const ACCEPTED_COVER_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
const ACCEPTED_PDF_EXT = ['pdf'];

@Component({
    selector: "ngx-creador-formulario",
    templateUrl: "./formulario-creador.component.html",
    styleUrls: ["./formulario-creador.component.scss"],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [ReactiveFormsModule, CurrencyPipe, DecimalPipe, UpperCasePipe],
})
export class CreadorFormularioComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(CreatorApiService);
  private hierarchy = inject(GradeHierarchyService);
  private route = inject(ActivatedRoute);
  router = inject(Router);

  form!: FormGroup;
  currentStep: WizardStep = 1;
  isEditMode = false;
  editingId: number | null = null;
  loading = false;
  loadingDoc = false;
  submitting = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  warningMessage: string | null = null;

  // Archivos seleccionados
  mainFile: File | null = null;
  mainFileError: string | null = null;
  coverImage: File | null = null;
  coverError: string | null = null;
  pdfAux: File | null = null;
  pdfAuxError: string | null = null;
  mainFileDragOver = false;
  coverDragOver = false;
  pdfAuxDragOver = false;

  /** Paginas seleccionadas para el PDF preview (1-based). */
  paginasPreView: Set<number> = new Set();
  /**
   * Cantidad de paginas que tiene el PDF fuente (la consulta al backend).
   * En modo "crear" lo estimamos; en modo "editar" lo pedimos al backend.
   * El backend tomara las primeras 3 si el Creador no selecciona ninguna.
   */
  pdfSourcePages = 0;
  /**
   * Tope maximo de paginas que dejamos seleccionar. Si el PDF tiene mas,
   * limitamos la eleccion a este numero (cubre el caso de PDFs enormes
   * donde mostrar 500 thumbnails no aporta).
   */
  readonly MAX_SELECTABLE_PAGES = 60;

  /**
   * Modo del selector de paginas:
   *  - 'chips': botones rapidos (1..N) sin preview visual.
   *  - 'visual': grilla con thumbnails reales de cada pagina.
   */
  pageSelectorMode: 'chips' | 'visual' = 'visual';
  loadingPageCount = false;
  pageCountError: string | null = null;

  // Existentes (modo edicion)
  existingFileUrl: string | null = null;
  existingCoverUrl: string | null = null;
  existingThumbUrl: string | null = null;
  existingPreviewUrl: string | null = null;

  /** Codigos originales del documento al momento de cargarlo.
   *  Se usan para re-disparar la cascada academica si las categorias no estaban
   *  listas cuando se llamo a populateForm. */
  pendingLevelCode: string | null = null;
  pendingSubjectCode: string | null = null;
  pendingSubjectName: string | null = null;
  pendingGradeCode: string | null = null;
  pendingGradeName: string | null = null;

  // Jerarquias (cascada)
  categories: HierarchyItem[] = [];
  niveles: HierarchyItem[] = [];
  materias: HierarchyItem[] = [];
  grados: HierarchyItem[] = [];

  loadingCategories = false;
  loadingNiveles = false;
  loadingMaterias = false;
  loadingGrados = false;

  /**
   * Tutoriales por defecto (fallback). Mantienen el contenido original
   * hardcoded que el componente mostraba antes de existir la API admin.
   * Si la llamada a la API falla o devuelve vacio, se usan estos.
   */
  tutorialsByStep: Record<WizardStep, TutorialVideo[]> = {
    1: [
      { title: "Como elegir un buen titulo", duration: "2:30",
        thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        description: "Aprende a redactar titulos claros y descriptivos que atraigan mas compradores." },
      { title: "Como fijar el precio correcto", duration: "3:45",
        thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        description: "Estrategias para fijar precios sin perder ventas." },
    ],
    2: [{ title: "Entendiendo la jerarquia academica", duration: "4:10",
        thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        description: "Como elegir correctamente categoria, nivel, materia y grado." }],
    3: [
      { title: "Como subir tu archivo", duration: "5:20",
        thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        description: "Arrastra tu PDF/DOCX/ZIP al area de carga y listo." },
      { title: "Buenas practicas para la portada", duration: "2:15",
        thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        description: "Como disenar una cover que destaque en el catalogo." },
    ],
    4: [{ title: "Que pasa despues de enviar a aprobacion", duration: "1:50",
        thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        description: "Conoce el flujo de revision y cuanto tarda la aprobacion." }],
  };

  /**
   * Tutoriales provistos por el backend (admin). Vacio hasta que
   * ngOnInit termine la peticion. La vista usa esto si esta poblado;
   * si no, usa el fallback estatico de arriba.
   */
  tutorialsFromBackend: Record<WizardStep, TutorialVideo[]> = { 1: [], 2: [], 3: [], 4: [] };
  loadingTutorials = false;
  tutorialsError: string | null = null;

  readonly maxMainMb = MAX_MAIN_FILE_MB;
  readonly maxCoverMb = MAX_COVER_MB;
  readonly maxAuxPdfMb = MAX_AUX_PDF_MB;

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
    this.loadTutorialsFromBackend();
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.editingId = Number(id);
        this.loadDocument(this.editingId);
      }
    });
  }

  /**
   * Trae los tutoriales configurados por el admin (BD). Si la llamada
   * falla o el backend devuelve vacio, el getter `tutorials` cae al
   * fallback estatico del componente.
   */
  private loadTutorialsFromBackend(): void {
    this.loadingTutorials = true;
    this.tutorialsError = null;
    this.api.getMyTutorials().subscribe({
      next: (grouped) => {
        const map: Record<WizardStep, TutorialVideo[]> = { 1: [], 2: [], 3: [], 4: [] };
        for (const step of [1, 2, 3, 4] as WizardStep[]) {
          const raw = grouped[String(step)] || grouped[step as any] || [];
          map[step] = (raw || []).map((t: TutorialVideoDto) => ({
            title: t.title,
            duration: t.duration || '',
            thumbnail: t.thumbnailUrl || '',
            videoUrl: t.videoUrl,
            description: t.description || '',
          }));
        }
        this.tutorialsFromBackend = map;
        this.loadingTutorials = false;
      },
      error: () => {
        // Silencioso: el getter ya sabe caer al fallback estatico.
        this.loadingTutorials = false;
        this.tutorialsError = 'No se pudieron cargar los tutoriales del servidor.';
      },
    });
  }

  private initForm(): void {
    this.form = this.fb.group({
      title: ["", [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      description: ["", [Validators.required, Validators.minLength(20), Validators.maxLength(1000)]],
      format: ["pdf", [Validators.required]],
      price: [10, [Validators.required, Validators.min(0), Validators.max(999)]],
      numeroDePaginas: [1, [Validators.required, Validators.min(1)]],
      categoryCode: ["", [Validators.required]],
      levelCode: [{ value: "", disabled: true }, [Validators.required]],
      subjectCode: [{ value: "", disabled: true }, [Validators.required]],
      gradeCode: [{ value: "", disabled: true }, [Validators.required]],
    });
  }

  /** Devuelve el formato elegido en el paso 1. */
  get currentFormat(): string {
    return (this.form.get('format')?.value || 'pdf').toLowerCase();
  }

  /** Determina si el formato requiere PDF auxiliar o imagen obligatoria. */
  get needsAuxOrCover(): boolean {
    return this.currentFormat !== 'pdf';
  }

  /** Si el formato es PDF, el backend puede generar la portada del propio PDF. */
  get canAutoGenerateCoverFromMain(): boolean {
    return this.currentFormat === 'pdf';
  }

  /**
   * Etiqueta contextual del PDF auxiliar segun el formato.
   * - pdf   → no se muestra (la fuente es el mainFile)
   * - docx  → "PDF generado a partir de tu Word"  (filePdfDelWord)
   * - otros → "PDF de preview del documento"      (preViewFilePdf)
   */
  get auxPdfLabel(): string {
    if (this.currentFormat === 'docx') {
      return 'PDF generado a partir de tu Word';
    }
    return 'PDF de preview del documento';
  }

  /** Key del campo multipart que recibe el PDF auxiliar en el backend. */
  get auxPdfFieldKey(): 'filePdfDelWord' | 'preViewFilePdf' | null {
    if (this.currentFormat === 'pdf') return null;
    if (this.currentFormat === 'docx') return 'filePdfDelWord';
    return 'preViewFilePdf';
  }

  /**
   * Reglas de obligatoriedad que el frontend refleja ANTES de enviar.
   * El backend las vuelve a aplicar (defensa en profundidad), pero
   * mostrarlas aca evita requests que sabemos que van a fallar.
   *
   * Devuelve un array de mensajes para mostrar al usuario; vacio = OK.
   */
  get uploadRequirements(): string[] {
    const reqs: string[] = [];
    const f = this.currentFormat;
    const hasMain = !!this.mainFile;
    const hasCover = !!this.coverImage;
    const hasAux = !!this.pdfAux;

    if (!hasMain && !hasCover) {
      reqs.push('Debes subir al menos el archivo principal o una imagen.');
    }
    if (f === 'pdf' && !hasMain) {
      reqs.push('Para PDF sube el archivo principal (.pdf).');
    }
    if (f === 'docx') {
      if (!hasMain) reqs.push('Sube el archivo Word (.docx).');
      if (!hasAux) reqs.push('Sube el PDF generado del Word para mostrar el preview.');
    }
    if (f === 'xlsx' || f === 'pptx' || f === 'zip') {
      if (!hasMain) reqs.push(`Sube el archivo principal (.${f}).`);
      if (!hasAux && !hasCover) {
        reqs.push(`Sube un PDF de preview o una imagen de portada.`);
      }
    }
    return reqs;
  }

  /** True si los requisitos del formato estan cumplidos (o estamos editando). */
  get uploadRequirementsMet(): boolean {
    if (this.isEditMode) return true; // edicion: archivos son opcionales
    return this.uploadRequirements.length === 0;
  }

  /** Devuelve el array de paginas del 1 a N para renderizar el selector. */
  get pageButtons(): number[] {
    return Array.from({ length: this.pdfSourcePages }, (_, i) => i + 1);
  }

  // ============ Edicion ============
  private loadDocument(id: number): void {
    this.loadingDoc = true;
    this.api.getDocumentById(id).subscribe({
      next: (doc) => {
        this.populateForm(doc);
        this.loadingDoc = false;
      },
      error: (e) => {
        // El backend devuelve 404 si el doc no existe o pertenece a otro
        // creador; mostramos un mensaje unificado para no filtrar info.
        if (e?.status === 404) {
          this.errorMessage = "No se encontro el documento o no tienes permisos para editarlo.";
        } else {
          this.errorMessage = this.parseError(e, "No se pudo cargar el documento.");
        }
        this.loadingDoc = false;
      },
    });
  }

private populateForm(doc: CreatorDocumentDto): void {
    this.form.patchValue({
      title: doc.title,
      description: doc.description,
      format: doc.format,
      price: doc.price,
      numeroDePaginas: doc.numeroDePaginas,
    });
    this.existingFileUrl = doc.fileUrlPublic || null;
    this.existingCoverUrl = doc.coverImageUrl || null;
    this.existingThumbUrl = doc.imagenThumbUrlPublic || null;
    this.existingPreviewUrl = doc.pdfPreviewUrl || null;

    // Hidratar la cascada de jerarquia: si tenemos los codes del backend, los
    // seleccionamos y vamos disparando las cargas de niveles / materias / grados.
    // Importante: el backend puede enviar el subjectCode como el nombre de la
    // materia (porque la entidad Materia no tiene campo code), asi que pasamos
    // tambien subjectName para que la cascada pueda matchear por nombre si el
    // code no coincide.
    const categoryCode = doc.categoryCode;
    const levelCode = doc.levelCode;
    const subjectCode = doc.subjectCode;
    const subjectName = doc.subjectName;
    const gradeCode = doc.gradeCode;
    const gradeName = doc.gradeName;

    // Aviso si el documento no tiene materia asignada: el formulario
    // exigira elegir una antes de guardar (Validators.required en subjectCode).
    // Esto cubre el caso de docs antiguos creados antes de hacer la materia
    // obligatoria por nivel (ej. SECUNDARIA).
    if (levelCode && (levelCode.toUpperCase() !== 'INICIAL') && !subjectCode) {
      this.warningMessage =
        'Este documento no tiene materia asignada. Selecciona una materia antes de guardar los cambios.';
    }

    if (categoryCode) {
      this.form.get('categoryCode')?.setValue(categoryCode);
      this.pendingLevelCode = levelCode || null;
      this.pendingSubjectCode = subjectCode || null;
      this.pendingSubjectName = subjectName || null;
      this.pendingGradeCode = gradeCode || null;
      this.pendingGradeName = gradeName || null;
      if (this.categories.length > 0) {
        this.loadLevelsFor(categoryCode, levelCode, subjectCode, subjectName, gradeCode, gradeName);
        this.pendingLevelCode = undefined;
      }
    }

    // Cargar el numero real de paginas del PDF guardado para alimentar
    // el selector visual. No falla la operacion si esto falla.
    if (doc.id) this.loadPageCountForDoc(doc.id);

    // Hidratar la seleccion de paginas del preview que el creador ya habia
    // elegido al subir el documento. Asi al editar no pierde la seleccion.
    if (Array.isArray(doc.paginasPreView) && doc.paginasPreView.length > 0) {
      this.paginasPreView.clear();
      for (const p of doc.paginasPreView) {
        if (Number.isFinite(p)) this.paginasPreView.add(p);
      }
    }

    // Cargar el numero real de paginas del PDF guardado para alimentar
    // el selector visual. No falla la operacion si esto falla.
    if (doc.id) this.loadPageCountForDoc(doc.id);
  }

  /**
   * Busca un HierarchyItem por code o por name (case-insensitive).
   * Util cuando el backend envia el name humano en lugar del code
   * (caso real con la entidad Materia que no tiene code propio).
   */
  private findIdByCodeOrName(items: HierarchyItem[], codeOrName: string | null | undefined): HierarchyItem | null {
    if (!codeOrName) return null;
    const direct = items.find(i => i.code === codeOrName);
    if (direct) return direct;
    const lower = codeOrName.toLowerCase();
    return items.find(i => i.name && i.name.toLowerCase() === lower) || null;
  }

  /** Carga niveles para la categoria y, en cadena, las materias y los grados. */
private loadLevelsFor(
    categoryCode: string,
    levelCode?: string,
    subjectCode?: string,
    subjectName?: string,
    gradeCode?: string,
    gradeName?: string,
  ): void {
    const catId = this.categories.find(c => c.code === categoryCode)?.id;
    if (!catId) {
      this.pendingLevelCode = levelCode || this.pendingLevelCode;
      this.pendingSubjectCode = subjectCode || this.pendingSubjectCode;
      this.pendingSubjectName = subjectName || this.pendingSubjectName;
      this.pendingGradeCode = gradeCode || this.pendingGradeCode;
      this.pendingGradeName = gradeName || this.pendingGradeName;
      return;
    }
    this.loadingNiveles = true;
    this.hierarchy.getLevels(catId).subscribe({
      next: (niveles) => {
        this.niveles = niveles.sort((a, b) => (a.position || 0) - (b.position || 0));
        this.loadingNiveles = false;
        this.form.get('levelCode')?.enable();
        if (levelCode) {
          this.form.get('levelCode')?.setValue(levelCode);
          this.loadSubjectsFor(levelCode, subjectCode, subjectName, gradeCode, gradeName);
        }
      },
      error: () => (this.loadingNiveles = false),
    });
  }

  private loadSubjectsFor(
    levelCode: string,
    subjectCode?: string,
    subjectName?: string,
    gradeCode?: string,
    gradeName?: string,
  ): void {
    const lvlId = this.niveles.find(n => n.code === levelCode)?.id;
    if (!lvlId) {
      return;
    }

    // El backend nos da las materias del nivel siempre (7 en Inicial, 9 en
    // SECUNDARIA, etc). Las cargamos para que el usuario pueda elegir una.
    // La cascada hacia grados SIEMPRE va por nivel (loadGradesForLevel)
    // para soportar Inicial sin tener que forzar una materia "GEN".
    this.loadingMaterias = true;
    this.hierarchy.getSubjects(lvlId).subscribe({
      next: (materias) => {
        this.materias = materias;
        this.loadingMaterias = false;
        this.form.get('subjectCode')?.enable();
        // Buscar por code; si no, por name (el backend a veces manda el nombre humano).
        const match = this.findIdByCodeOrName(materias, subjectCode) || this.findIdByCodeOrName(materias, subjectName);
        if (match) {
          this.form.get('subjectCode')?.setValue(match.code);
        }
        // Independientemente de si hay materia, cargamos grados por nivel.
        this.loadGradesForLevel(lvlId, gradeCode, gradeName);
      },
      error: () => (this.loadingMaterias = false),
    });
  }

  /**
   * Carga grados directamente por nivel (Mejora M7). Usado para soportar
   * niveles sin materia (ej. INICIAL) y como fallback universal.
   */
  private loadGradesForLevel(levelId: number, gradeCode?: string, gradeName?: string): void {
    this.loadingGrados = true;
    this.hierarchy.getGradesByLevel(levelId).subscribe({
      next: (grados) => {
        this.grados = grados;
        this.loadingGrados = false;
        this.form.get('gradeCode')?.enable();
        const match = this.findIdByCodeOrName(grados, gradeCode) || this.findIdByCodeOrName(grados, gradeName);
        if (match) {
          this.form.get('gradeCode')?.setValue(match.code);
        }
      },
      error: () => (this.loadingGrados = false),
    });
  }

  private loadGradesFor(subjectCode: string, gradeCode?: string, gradeName?: string): void {
    console.log('[DEBUG-CASCADE] loadGradesFor', { subjectCode, gradeCode, gradeName });
    const subjId = this.materias.find(s => s.code === subjectCode)?.id;
    if (!subjId) {
      console.warn('[DEBUG-CASCADE] loadGradesFor: subjId no encontrado para', subjectCode, 'materias:', this.materias.length);
      return;
    }
    this.loadingGrados = true;
    this.hierarchy.getGrades(subjId).subscribe({
      next: (grados) => {
        this.grados = grados;
        this.loadingGrados = false;
        this.form.get('gradeCode')?.enable();
        console.log('[DEBUG-CASCADE] getGrades OK', {
          gradosCount: this.grados.length,
          gradeCode,
          gradeName,
          matchByCode: this.findIdByCodeOrName(grados, gradeCode),
          matchByName: this.findIdByCodeOrName(grados, gradeName),
        });
        const match = this.findIdByCodeOrName(grados, gradeCode) || this.findIdByCodeOrName(grados, gradeName);
        if (match) {
          this.form.get('gradeCode')?.setValue(match.code);
        } else {
          console.warn('[DEBUG-CASCADE] loadGradesFor: NO MATCH para grade', { gradeCode, gradeName });
        }
      },
      error: () => (this.loadingGrados = false),
    });
  }

  // ============ Jerarquia en cascada ============
  loadCategories(): void {
    this.loadingCategories = true;
    this.hierarchy.getCategories().subscribe({
      next: (cats) => {
        this.categories = cats.sort((a, b) => (a.position || 0) - (b.position || 0));
        this.loadingCategories = false;
        // Si populateForm no pudo disparar la cascada (categories estaba vacio),
        // la disparamos ahora con los codes originales guardados.
        if (this.isEditMode && this.pendingLevelCode !== undefined) {
          const cat = this.form.get('categoryCode')?.value;
          if (cat && this.niveles.length === 0) {
            this.loadLevelsFor(
              cat,
              this.pendingLevelCode || undefined,
              this.pendingSubjectCode || undefined,
              this.pendingSubjectName || undefined,
              this.pendingGradeCode || undefined,
              this.pendingGradeName || undefined,
            );
            this.pendingLevelCode = undefined;
          }
        }
      },
      error: () => (this.loadingCategories = false),
    });
  }

  onCategoryChange(): void {
    const code = this.form.get('categoryCode')?.value;
    this.form.get('levelCode')?.setValue("");
    this.form.get('subjectCode')?.setValue("");
    this.form.get('gradeCode')?.setValue("");
    this.form.get('levelCode')?.disable();
    this.form.get('subjectCode')?.disable();
    this.form.get('gradeCode')?.disable();
    this.materias = [];
    this.grados = [];
    if (!code) { this.niveles = []; return; }
    const id = this.categories.find(c => c.code === code)?.id;
    if (!id) return;
    this.loadingNiveles = true;
    this.hierarchy.getLevels(id).subscribe({
      next: (l) => {
        this.niveles = l.sort((a, b) => (a.position || 0) - (b.position || 0));
        this.loadingNiveles = false;
        this.form.get('levelCode')?.enable();
      },
      error: () => (this.loadingNiveles = false),
    });
  }

  onLevelChange(): void {
    const code = this.form.get('levelCode')?.value;
    this.form.get('subjectCode')?.setValue("");
    this.form.get('gradeCode')?.setValue("");
    this.form.get('subjectCode')?.disable();
    this.form.get('gradeCode')?.disable();
    this.grados = [];
    this.materias = [];
    if (!code) return;
    const id = this.niveles.find(n => n.code === code)?.id;
    if (!id) return;

    // Cargamos materias (si las hay) y grados por nivel en paralelo.
    // Asi Inicial muestra la lista de materias para que el usuario pueda
    // elegir una si lo desea, y siempre puede elegir el grado.
    this.loadingMaterias = true;
    this.hierarchy.getSubjects(id).subscribe({
      next: (m) => {
        this.materias = m;
        this.loadingMaterias = false;
        if (m.length > 0) {
          this.form.get('subjectCode')?.enable();
        }
      },
      error: () => (this.loadingMaterias = false),
    });
    this.loadGradesForLevel(id);
  }

  onSubjectChange(): void {
    const code = this.form.get('subjectCode')?.value;
    this.form.get('gradeCode')?.setValue("");
    this.form.get('gradeCode')?.disable();
    if (!code) { this.grados = []; return; }
    const id = this.materias.find(s => s.code === code)?.id;
    if (!id) return;
    this.loadingGrados = true;
    this.hierarchy.getGrades(id).subscribe({
      next: (g) => {
        this.grados = g;
        this.loadingGrados = false;
        this.form.get('gradeCode')?.enable();
      },
      error: () => (this.loadingGrados = false),
    });
  }

  // ============ File pickers ============
  onMainFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) this.handleMainFile(input.files[0]);
    input.value = '';
  }
  onCoverSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) this.handleCover(input.files[0]);
    input.value = '';
  }
  onPdfAuxSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) this.handlePdfAux(input.files[0]);
    input.value = '';
  }
  onMainFileDrop(event: DragEvent): void {
    event.preventDefault(); this.mainFileDragOver = false;
    if (event.dataTransfer?.files?.length) this.handleMainFile(event.dataTransfer.files[0]);
  }
  onCoverDrop(event: DragEvent): void {
    event.preventDefault(); this.coverDragOver = false;
    if (event.dataTransfer?.files?.length) this.handleCover(event.dataTransfer.files[0]);
  }
  onPdfAuxDrop(event: DragEvent): void {
    event.preventDefault(); this.pdfAuxDragOver = false;
    if (event.dataTransfer?.files?.length) this.handlePdfAux(event.dataTransfer.files[0]);
  }
  onDragOver(event: DragEvent, kind: 'main' | 'cover' | 'pdf'): void {
    event.preventDefault();
    if (kind === 'main') this.mainFileDragOver = true;
    else if (kind === 'cover') this.coverDragOver = true;
    else this.pdfAuxDragOver = true;
  }
  onDragLeave(kind: 'main' | 'cover' | 'pdf'): void {
    if (kind === 'main') this.mainFileDragOver = false;
    else if (kind === 'cover') this.coverDragOver = false;
    else this.pdfAuxDragOver = false;
  }
  removeMainFile(): void {
    this.mainFile = null;
    this.mainFileError = null;
    // Si estaba habilitando el selector de paginas como fuente principal
    // (caso PDF en crear), limpiamos para evitar que queden botones
    // "seleccionados" apuntando a un PDF que ya no esta en memoria.
    if (this.currentFormat === 'pdf') {
      this.pdfSourcePages = 0;
      this.paginasPreView.clear();
    }
  }
  removeCover(): void { this.coverImage = null; this.coverError = null; }
  removePdfAux(): void {
    this.pdfAux = null;
    this.pdfAuxError = null;
    this.pdfSourcePages = 0;
    this.paginasPreView.clear();
  }

  private handleMainFile(file: File): void {
    this.mainFileError = null;
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!ACCEPTED_MAIN_EXT.includes(ext)) {
      this.mainFileError = `Formato no permitido. Aceptados: ${ACCEPTED_MAIN_EXT.join(', ')}.`;
      return;
    }
    const maxBytes = MAX_MAIN_FILE_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      this.mainFileError = `El archivo supera el limite de ${MAX_MAIN_FILE_MB} MB.`;
      return;
    }
    this.mainFile = file;
    // Si el archivo principal es un PDF, habilitamos el selector de paginas
    // del preview (las mismas reglas que se aplican al PDF auxiliar). Esto
    // cubre el caso "formato PDF" en modo crear: sin este llamado, el
    // selector permaneceria oculto y el backend usaria las primeras 3
    // paginas por defecto sin posibilidad de que el Creador elija.
    if (ext === 'pdf') {
      this.contarPaginasPdfLocal(file);
    }
  }

  private handleCover(file: File): void {
    this.coverError = null;
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!ACCEPTED_COVER_EXT.includes(ext)) {
      this.coverError = `Formato no permitido. Aceptados: ${ACCEPTED_COVER_EXT.join(', ')}.`;
      return;
    }
    const maxBytes = MAX_COVER_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      this.coverError = `La imagen supera el limite de ${MAX_COVER_MB} MB.`;
      return;
    }
    this.coverImage = file;
  }

  private handlePdfAux(file: File): void {
    this.pdfAuxError = null;
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (!ACCEPTED_PDF_EXT.includes(ext)) {
      this.pdfAuxError = `Formato no permitido. Aceptados: ${ACCEPTED_PDF_EXT.join(', ')}.`;
      return;
    }
    const maxBytes = MAX_AUX_PDF_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      this.pdfAuxError = `El PDF supera el limite de ${MAX_AUX_PDF_MB} MB.`;
      return;
    }
    this.pdfAux = file;
    // Contamos las paginas reales del PDF local con PDF.js para que el
    // selector muestre exactamente la cantidad que tiene el archivo.
    this.contarPaginasPdfLocal(file);
  }

  /**
   * Habilita el selector de paginas mostrando la cantidad REAL de paginas
   * del PDF (no un cap como antes). Pre-selecciona las primeras 3.
   *
   * <p>Antes este helper ponia {@code pdfSourcePages = MAX_SELECTABLE_PAGES}
   * (60) y dejaba que el backend recortara las paginas invalidas. Eso
   * confundia a los Creadores (mostraba 60 botones para un PDF de 3 paginas).
   * Ahora usamos pdfjs-dist para contar en el browser y solo si falla
   * caemos al cap como fallback.</p>
   */
  private async contarPaginasPdfLocal(file: File): Promise<void> {
    // Fallback inicial: mientras PDF.js cuenta, mostramos 1..3 con la
    // preseleccion por defecto. Si el conteo termina bien, lo actualizamos.
    this.pdfSourcePages = Math.min(3, this.MAX_SELECTABLE_PAGES);
    this.paginasPreView.clear();
    for (let i = 1; i <= this.pdfSourcePages; i++) this.paginasPreView.add(i);

    try {
      const pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');
      // Worker apuntando al bundle del propio paquete. Sin esto PDF.js falla
      // con "GlobalWorkerOptions.workerSrc is not set".
      (pdfjsLib as any).GlobalWorkerOptions.workerSrc =
        // webpack asset import: en build esto lo resuelve el bundler.
        // Como fallback por si el worker no se inlinea, apuntamos al CDN.
        (await import('pdfjs-dist/build/pdf.worker.min.mjs' /* webpackIgnore: true */))
          ? (new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)).href
          : 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.7.76/build/pdf.worker.min.mjs';

      const data = new Uint8Array(await file.arrayBuffer());
      const loadingTask = (pdfjsLib as any).getDocument({ data });
      const pdf = await loadingTask.promise;
      const pages = Math.min(pdf.numPages || 0, this.MAX_SELECTABLE_PAGES);

      this.pdfSourcePages = pages;
      // Si las preselecciones (1..3) caen fuera del rango real, las recortamos.
      this.paginasPreView = new Set(
        Array.from(this.paginasPreView).filter((p) => p <= pages)
      );
      if (this.paginasPreView.size === 0 && pages > 0) {
        for (let i = 1; i <= Math.min(3, pages); i++) this.paginasPreView.add(i);
      }
    } catch (e) {
      console.warn('[FormWizard] No se pudo contar paginas del PDF local:', e);
      // Fallback final: cap MAX_SELECTABLE_PAGES (comportamiento anterior).
      this.pdfSourcePages = this.MAX_SELECTABLE_PAGES;
      this.paginasPreView.clear();
      const def = Math.min(3, this.MAX_SELECTABLE_PAGES);
      for (let i = 1; i <= def; i++) this.paginasPreView.add(i);
    }
  }

  /**
   * Carga el numero real de paginas desde el backend para el documento en edicion.
   * Se usa despues de hidratar el form en modo edicion para que el selector
   * visual muestre los thumbnails correctos.
   */
  private loadPageCountForDoc(docId: number): void {
    if (!this.isEditMode) return;
    this.loadingPageCount = true;
    this.pageCountError = null;
    this.api.getDocumentPageCount(docId).subscribe({
      next: (res) => {
        this.pdfSourcePages = Math.min(
          Math.max(res.pages || 0, 0),
          this.MAX_SELECTABLE_PAGES,
        );
        this.loadingPageCount = false;
      },
      error: (e) => {
        this.loadingPageCount = false;
        this.pageCountError = 'No se pudo obtener el numero de paginas del PDF.';
        // Fallback razonable: mostrar 12 chips y las primeras 3 seleccionadas
        this.pdfSourcePages = Math.min(12, this.MAX_SELECTABLE_PAGES);
        this.paginasPreView.clear();
        for (let i = 1; i <= Math.min(3, this.pdfSourcePages); i++) this.paginasPreView.add(i);
      },
    });
  }

  togglePagina(p: number): void {
    if (this.paginasPreView.has(p)) this.paginasPreView.delete(p);
    else this.paginasPreView.add(p);
  }

  /**
   * Marca como seleccionadas las primeras N paginas del PDF. Usado por el
   * boton "Primeras 3" del selector. Si el PDF tiene menos de N paginas,
   * selecciona todas.
   */
  selectFirstNPages(n: number): void {
    this.paginasPreView.clear();
    const limit = Math.min(n, this.pdfSourcePages);
    for (let i = 1; i <= limit; i++) this.paginasPreView.add(i);
  }

  isPaginaSelected(p: number): boolean {
    return this.paginasPreView.has(p);
  }

  // ============ Navegacion entre pasos ============
  goToStep(step: WizardStep): void {
    if (step < this.currentStep) { this.currentStep = step; return; }
    if (this.isStepValid(this.currentStep)) this.currentStep = step;
    else this.markCurrentStepTouched();
  }
  nextStep(): void {
    if (this.isStepValid(this.currentStep) && this.currentStep < 4) {
      this.currentStep = (this.currentStep + 1) as WizardStep;
    } else this.markCurrentStepTouched();
  }
  prevStep(): void {
    if (this.currentStep > 1) this.currentStep = (this.currentStep - 1) as WizardStep;
  }

  isStepValid(step: WizardStep): boolean {
    if (step === 1) {
      return this.form.get('title')!.valid
        && this.form.get('description')!.valid
        && this.form.get('format')!.valid
        && this.form.get('price')!.valid
        && this.form.get('numeroDePaginas')!.valid;
    }
    if (step === 2) {
      return this.form.get('categoryCode')!.valid
        && this.form.get('levelCode')!.valid
        && this.form.get('subjectCode')!.valid
        && this.form.get('gradeCode')!.valid;
    }
    if (step === 3) {
      // Reglas:
      //  - main file obligatorio
      //  - para formatos != PDF: cover o pdfAux obligatorio
      //  - en edit, todo es opcional (conservar lo existente)
      if (this.isEditMode) return true;
      if (!this.mainFile) return false;
      if (this.needsAuxOrCover && !this.coverImage && !this.pdfAux) return false;
      return this.mainFileError === null;
    }
    return true;
  }

  isStepComplete(step: WizardStep): boolean {
    return this.isStepValid(step);
  }

  markCurrentStepTouched(): void {
    const fields = this.fieldsOfStep(this.currentStep);
    fields.forEach(name => this.form.get(name)?.markAsTouched());
  }

  private fieldsOfStep(step: WizardStep): string[] {
    if (step === 1) return ["title", "description", "format", "price", "numeroDePaginas"];
    if (step === 2) return ["categoryCode", "levelCode", "subjectCode", "gradeCode"];
    return [];
  }

  // ============ Submit ============
  submit(): void {
    if (!this.isStepValid(1) || !this.isStepValid(2) || !this.isStepValid(3)) {
      this.errorMessage = "Completa todos los pasos antes de enviar.";
      if (!this.isStepValid(1)) this.currentStep = 1;
      else if (!this.isStepValid(2)) this.currentStep = 2;
      else this.currentStep = 3;
      return;
    }

    // Validacion especifica de archivos segun formato (espejo del backend).
    if (!this.isEditMode && !this.uploadRequirementsMet) {
      this.submitting = false;
      this.errorMessage = this.uploadRequirements.join(' ');
      this.currentStep = 3;
      return;
    }

    this.submitting = true;
    this.errorMessage = null;
    this.successMessage = null;

    const gradeId = this.grados.find(g => g.code === this.form.get('gradeCode')?.value)?.id;
    const subjectId = this.materias.find(m => m.code === this.form.get('subjectCode')?.value)?.id;

    const paginas = Array.from(this.paginasPreView).sort((a, b) => a - b);
    const payload: CreatorDocumentForm = {
      title: this.form.get('title')?.value,
      description: this.form.get('description')?.value,
      format: this.form.get('format')?.value,
      price: this.form.get('price')?.value,
      numeroDePaginas: this.form.get('numeroDePaginas')?.value,
      gradeId,
      subjectId,
      paginasPreView: paginas.length ? paginas : undefined,
    };

    // Mapeo segun formato:
    //  - pdf   → mainFile = PDF; no se manda filePdfDelWord ni preViewFilePdf
    //  - docx  → mainFile = Word; pdfAux va como filePdfDelWord
    //  - otros → mainFile = XLSX/PPTX/ZIP; pdfAux va como preViewFilePdf
    //  - "solo imagen" → no hay mainFile; pdfAux es null; coverImage hace de main+thumb
    const filePdfDelWord = (this.currentFormat === 'docx' && this.pdfAux) ? this.pdfAux : undefined;
    const preViewFilePdf = (this.currentFormat !== 'docx' && this.currentFormat !== 'pdf' && this.pdfAux)
      ? this.pdfAux
      : undefined;

    let obs;
    if (this.isEditMode) {
      obs = this.api.updateDocumentWithFiles(
        this.editingId!,
        payload,
        this.mainFile || undefined,
        this.coverImage || undefined,
        filePdfDelWord,
        preViewFilePdf,
      );
    } else {
      // En modo crear: si no hay mainFile, exigimos cover (rama "solo imagen").
      if (!this.mainFile && !this.coverImage) {
        this.submitting = false;
        this.errorMessage = 'Adjunta al menos el archivo principal o una imagen de portada.';
        this.currentStep = 3;
        return;
      }
      obs = this.api.createDocumentWithFiles(
        payload,
        this.mainFile as File, // validado arriba: si no hay main, hay cover
        this.coverImage || undefined,
        filePdfDelWord,
        preViewFilePdf,
      );
    }

    obs.subscribe({
      next: () => {
        this.submitting = false;
        this.successMessage = this.isEditMode
          ? "Documento actualizado correctamente."
          : "Documento creado en estado BORRADOR. Podes editarlo o enviarlo a aprobacion desde Mis Documentos.";
        setTimeout(() => this.router.navigate(["/dashboard-creador/mis-documentos"]), 1500);
      },
      error: (e) => {
        this.submitting = false;
        this.errorMessage = this.parseError(e, "No se pudo guardar el documento.");
      },
    });
  }

  // ============ Helpers ============
  /**
   * Tutoriales a mostrar en el sidebar del paso actual.
   * Prioriza los que llegaron del backend (cargados en ngOnInit); si por
   * algun motivo la peticion fallo, cae al mapa estatico local.
   */
  get tutorials(): TutorialVideo[] {
    const fromBackend = this.tutorialsFromBackend[this.currentStep];
    if (fromBackend && fromBackend.length) {
      return fromBackend;
    }
    return this.tutorialsByStep[this.currentStep] || [];
  }
  openTutorial(t: TutorialVideo): void { window.open(t.videoUrl, "_blank", "noopener,noreferrer"); }

  /** Renderiza las paginas seleccionadas como texto: "1, 3, 5". */
  paginasSeleccionadasLabel(): string {
    return Array.from(this.paginasPreView).sort((a, b) => a - b).join(', ');
  }

  /**
   * Construye la URL del thumbnail de una pagina. Solo funciona en modo
   * edicion (necesitamos un id de documento persistido para alimentar al
   * endpoint del backend).
   */
  pageThumbUrl(p: number): string | null {
    if (!this.isEditMode || !this.editingId) return null;
    return this.api.getPageThumbUrl(this.editingId, p);
  }

  /**
   * TrackBy para no recrear el array de botones en cada CD cycle.
   */
  trackByPage = (_: number, p: number) => p;

  setPageSelectorMode(mode: 'chips' | 'visual'): void {
    this.pageSelectorMode = mode;
  }
  formatBytes(b: number): string {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1024 / 1024).toFixed(1)} MB`;
  }

  private parseError(err: any, fallback: string): string {
    if (err?.error?.message) return err.error.message;
    if (err?.status === 403) return "No tienes permisos para esta accion.";
    if (err?.status === 0) return "No se pudo conectar al servidor.";
    return fallback;
  }
}
