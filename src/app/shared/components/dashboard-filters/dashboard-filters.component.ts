  // Opciones filtradas para el select de materiaSuscripcion
import { Component, EventEmitter, OnInit, Output } from '@angular/core';

export interface DashboardFilters {
  tipoProducto?: 'documentos' | 'suscripcion' | 'todos';
  categoria: string;
  materia?: string;
  nivel?: string;
  grado?: string;
  periodo: string;
  tipoSuscripcion?: string;
  materiaSuscripcion?: string;
  opcionSuscripcion?: string;
}

@Component({
  selector: 'ngx-dashboard-filters',
  templateUrl: './dashboard-filters.component.html',
  styleUrls: ['./dashboard-filters.component.scss']
})
export class DashboardFiltersComponent implements OnInit {
  get filteredMateriaSuscripcionOptions(): { value: string; label: string }[] {
    // Siempre mostrar todas las opciones para permitir cambiar la materia
    return this.materiaSuscripcionOptions;
  }
  @Output() filtersChanged = new EventEmitter<DashboardFilters>();

  // Configuración de categorías (basado en categorias.component.ts)
  categorias = [
    { value: '', label: 'Todas las Categorías' },
    { value: 'PLANIFICACION', label: 'Planificación' },
    { value: 'EVALUACION', label: 'Evaluación' },
    { value: 'ESTRATEGIAS', label: 'Estrategias' },
    { value: 'RECURSOS', label: 'Recursos' },
    { value: 'EBOOKS', label: 'E-books' },
    { value: 'TALLERES', label: 'Talleres' },
    { value: 'PLAN_LECTOR', label: 'Plan Lector' },
    { value: 'REFORZAMIENTO', label: 'Reforzamiento' },
    { value: 'KITS', label: 'Kits' },
   // { value: 'MATERIAL_GRATIS', label: 'Material Gratis' }
  ];

  // Configuración de niveles educativos
  niveles = [
    { value: '', label: 'Todos los Niveles' },
    { value: 'INICIAL', label: 'Inicial' },
    { value: 'PRIMARIA', label: 'Primaria' },
    { value: 'SECUNDARIA', label: 'Secundaria' }
  ];

  // Configuración dinámica de materias por categoría y nivel
  private readonly MATERIAS_CONFIG: Record<string, Record<string, string[]>> = {
    'PLANIFICACION': {
      'INICIAL': ['PERSONAL_SOCIAL', 'COMUNICACION', 'MATEMATICA', 'CIENCIA_Y_TECNOLOGIA', 'PSICOMOTRICIDAD', 'TUTORIA'],
      'PRIMARIA': ['PERSONAL_SOCIAL', 'COMUNICACION', 'MATEMATICA', 'CIENCIA_Y_TECNOLOGIA', 'ARTE_Y_CULTURA', 'RELIGION', 'TUTORIA'],
      'SECUNDARIA': ['COMUNICACION', 'MATEMATICA', 'CIENCIAS_SOCIALES', 'DESARROLLO_PERSONAL', 'CIENCIA_Y_TECNOLOGIA', 'ARTE_Y_CULTURA', 'INGLES', 'RELIGION', 'EPT', 'TUTORIA']
    },
    'EVALUACION': {
      'INICIAL': ['PERSONAL_SOCIAL', 'COMUNICACION', 'MATEMATICA', 'CIENCIA_Y_TECNOLOGIA', 'PSICOMOTRICIDAD'],
      'PRIMARIA': ['PERSONAL_SOCIAL', 'COMUNICACION', 'MATEMATICA', 'CIENCIA_Y_TECNOLOGIA', 'ARTE_Y_CULTURA', 'RELIGION', 'FISICA'],
      'SECUNDARIA': ['COMUNICACION', 'MATEMATICA', 'CIENCIAS_SOCIALES', 'DESARROLLO_PERSONAL', 'CIENCIA_Y_TECNOLOGIA', 'ARTE_Y_CULTURA', 'INGLES', 'RELIGION', 'EMPRENDIMIENTO', 'FISICA']
    },
    'ESTRATEGIAS': {
      'INICIAL': ['PERSONAL_SOCIAL', 'COMUNICACION', 'MATEMATICA', 'CIENCIA_Y_TECNOLOGIA', 'PSICOMOTRICIDAD'],
      'PRIMARIA': ['PERSONAL_SOCIAL', 'COMUNICACION', 'MATEMATICA', 'CIENCIA_Y_TECNOLOGIA', 'ARTE_Y_CULTURA', 'RELIGION'],
      'SECUNDARIA': ['COMUNICACION', 'MATEMATICA', 'CIENCIAS_SOCIALES', 'DESARROLLO_PERSONAL', 'CIENCIA_Y_TECNOLOGIA', 'ARTE_Y_CULTURA', 'INGLES', 'RELIGION', 'EPT']
    },
    'EBOOKS': {
      'INICIAL': ['PERSONAL_SOCIAL', 'COMUNICACION', 'MATEMATICA', 'CIENCIA_Y_TECNOLOGIA', 'PSICOMOTRICIDAD', 'TUTORIA'],
      'PRIMARIA': ['PERSONAL_SOCIAL', 'COMUNICACION', 'MATEMATICA', 'CIENCIA_Y_TECNOLOGIA', 'ARTE_Y_CULTURA', 'RELIGION', 'TUTORIA'],
      'SECUNDARIA': ['COMUNICACION', 'MATEMATICA', 'CIENCIAS_SOCIALES', 'DESARROLLO_PERSONAL', 'CIENCIA_Y_TECNOLOGIA', 'ARTE_Y_CULTURA', 'INGLES', 'RELIGION', 'EPT', 'TUTORIA']
    },
    'TALLERES': {
      'INICIAL': ['PERSONAL_SOCIAL', 'COMUNICACION', 'MATEMATICA', 'CIENCIA_Y_TECNOLOGIA', 'PSICOMOTRICIDAD'],
      'PRIMARIA': ['PERSONAL_SOCIAL', 'COMUNICACION', 'MATEMATICA', 'CIENCIA_Y_TECNOLOGIA', 'ARTE_Y_CULTURA', 'RELIGION', 'FISICA'],
      'SECUNDARIA': ['COMUNICACION', 'MATEMATICA', 'CIENCIAS_SOCIALES', 'DESARROLLO_PERSONAL', 'CIENCIA_Y_TECNOLOGIA', 'ARTE_Y_CULTURA', 'INGLES', 'RELIGION', 'EMPRENDIMIENTO', 'FISICA']
    },
    'PLAN_LECTOR': {
      'INICIAL': ['COMUNICACION'],
      'PRIMARIA': ['COMUNICACION'],
      'SECUNDARIA': ['COMUNICACION']
    },
    'REFORZAMIENTO': {
      'SECUNDARIA': ['COMUNICACION', 'MATEMATICA', 'CIENCIAS_SOCIALES', 'DESARROLLO_PERSONAL', 'CIENCIA_Y_TECNOLOGIA']
    },
    'MATERIAL_GRATIS': {
      'INICIAL': ['PERSONAL_SOCIAL', 'COMUNICACION', 'MATEMATICA', 'CIENCIA_Y_TECNOLOGIA', 'PSICOMOTRICIDAD', 'TUTORIA'],
      'PRIMARIA': ['PERSONAL_SOCIAL', 'COMUNICACION', 'MATEMATICA', 'CIENCIA_Y_TECNOLOGIA', 'ARTE_Y_CULTURA', 'RELIGION', 'TUTORIA', 'FISICA'],
      'SECUNDARIA': ['COMUNICACION', 'MATEMATICA', 'CIENCIAS_SOCIALES', 'DESARROLLO_PERSONAL', 'CIENCIA_Y_TECNOLOGIA', 'ARTE_Y_CULTURA', 'INGLES', 'RELIGION', 'EPT', 'TUTORIA', 'EMPRENDIMIENTO', 'FISICA']
    }
  };

  // Configuración de grados por nivel
  private readonly GRADOS_CONFIG: Record<string, string[]> = {
    'INICIAL': ['3 años', '4 años', '5 años'],
    'PRIMARIA': ['III CICLO 1°-2°', 'IV CICLO 3°-4°', 'V CICLO 5°-6°'],
    'SECUNDARIA': ['1°', '2°', '3°', '4°', '5°']
  };

  // Arrays dinámicos que se actualizan según selecciones
  materias: { value: string; label: string }[] = [
    { value: '', label: 'Todas las Materias' }
  ];

  grados: { value: string; label: string }[] = [
    { value: '', label: 'Todos los Grados' }
  ];

  periodos = [
    { value: '7', label: 'Últimos 7 días' },
    { value: '30', label: 'Últimos 30 días' },
    { value: '90', label: 'Últimos 3 meses' },
    { value: '180', label: 'Últimos 6 meses' },
    { value: '365', label: 'Último año' }
  ];

  // Filtro principal
  tipoProductoOptions = [
    { value: 'todos', label: 'Todos' },
    { value: 'documentos', label: 'Documentos' },
    { value: 'suscripcion', label: 'Suscripción' },
  ];

  tipoSuscripcionOptions = [
    { value: '', label: 'Todos los tipos' },
    { value: 'Membresía Mensual Inicial', label: 'Membresía Mensual Inicial' },
    { value: 'Membresía Mensual Primaria', label: 'Membresía Mensual Primaria' },
    { value: 'Membresía Mensual Secundaria', label: 'Membresía Mensual Secundaria' },
    { value: 'Membresía Anual Secundaria', label: 'Membresía Anual Secundaria' }
    // Puedes agregar más tipos según tu modelo
  ];

  materiaSuscripcionOptions: { value: string; label: string }[] = [];
  opcionSuscripcionOptions: { value: string; label: string }[] = [];

  showMateriaSuscripcion = false;
  showOpcionSuscripcion = false;

  // Valores seleccionados
  selectedFilters: DashboardFilters = {
    tipoProducto: 'todos',
    categoria: '',
    materia: '',
    nivel: '',
    grado: '',
    periodo: '365',
    tipoSuscripcion: '',
    materiaSuscripcion: '',
    opcionSuscripcion: ''
  };


  ngOnInit(): void {
    this.updateMaterias();
    this.updateGrados();
    this.updateSuscripcionFields();
    this.emitFilters();
  }

  onCategoriaChange(): void {
    // Resetear dependencias cuando cambia la categoría
    this.selectedFilters.materia = '';
    this.selectedFilters.grado = '';
    
    this.updateMaterias();
    this.updateGrados();
    this.onFilterChange();
  }

  onNivelChange(): void {
    // Resetear dependencias cuando cambia el nivel
    this.selectedFilters.materia = '';
    this.selectedFilters.grado = '';
    
    this.updateMaterias();
    this.updateGrados();
    this.onFilterChange();
  }

  onMateriaChange(): void {
    // Resetear grado cuando cambia la materia
    this.selectedFilters.grado = '';
    this.updateGrados();
    this.onFilterChange();
  }


  onTipoProductoChange(): void {
    // Limpiar todos los selects al cambiar tipoProducto
    if (this.selectedFilters.tipoProducto === 'suscripcion') {
      this.selectedFilters.tipoSuscripcion = '';
      this.selectedFilters.materiaSuscripcion = '';
      this.selectedFilters.opcionSuscripcion = '';
    } else {
      this.selectedFilters.categoria = '';
      this.selectedFilters.nivel = '';
      this.selectedFilters.materia = '';
      this.selectedFilters.grado = '';
    }
    this.updateSuscripcionFields();
    this.updateMaterias();
    this.updateGrados();
    this.emitFilters();
  }

  onTipoSuscripcionChange(): void {
    // Si la materia seleccionada no está en las opciones, limpiar
    this.updateSuscripcionFields();
    const found = this.materiaSuscripcionOptions.find(opt => opt.value === this.selectedFilters.materiaSuscripcion);
    if (!found) {
      this.selectedFilters.materiaSuscripcion = '';
    }
    this.selectedFilters.opcionSuscripcion = '';
    this.emitFilters();
  }

  onMateriaSuscripcionChange(): void {
    // El valor seleccionado ya se actualiza por ngModel, solo hay que actualizar las opciones
    this.selectedFilters.opcionSuscripcion = '';
    this.updateSuscripcionFields();
    this.emitFilters();
  }
  private updateSuscripcionFields(): void {
    const tipo = this.selectedFilters.tipoSuscripcion;
    const materia = this.selectedFilters.materiaSuscripcion;

    // Por defecto ocultar ambos
    this.showMateriaSuscripcion = false;
    this.showOpcionSuscripcion = false;
    this.materiaSuscripcionOptions = [];
    this.opcionSuscripcionOptions = [];

    if (tipo === 'Membresía Mensual Inicial') {
      // No mostrar materia, mostrar opciones de inicial
      this.showMateriaSuscripcion = false;
      this.showOpcionSuscripcion = true;
      this.opcionSuscripcionOptions = [
        { value: '', label: 'Todas las opciones' },
        { value: '3 AÑOS', label: '3 AÑOS' },
        { value: '4 AÑOS', label: '4 AÑOS' },
        { value: '5 AÑOS', label: '5 AÑOS' },
        { value: 'UNIDOCENTE', label: 'UNIDOCENTE' }
      ];
    } else if (tipo === 'Membresía Mensual Primaria') {
      // No mostrar materia, mostrar opciones de primaria
      this.showMateriaSuscripcion = false;
      this.showOpcionSuscripcion = true;
      this.opcionSuscripcionOptions = [
        { value: '', label: 'Todas las opciones' },
        { value: 'III CICLO', label: 'III CICLO' },
        { value: 'IV CICLO', label: 'IV CICLO' },
        { value: 'V CICLO', label: 'V CICLO' }
      ];
    } else if (
      tipo === 'Membresía Mensual Secundaria' ||
      tipo === 'Membresía Anual Secundaria'
    ) {
      // Mostrar materia y opciones según materia
      this.showMateriaSuscripcion = true;
      this.materiaSuscripcionOptions = [
        { value: '', label: 'Todas las materias' },
        { value: 'Comunicación', label: 'Comunicación' },
        { value: 'Matemática', label: 'Matemática' },
        { value: 'Ciencia y Tecnología', label: 'Ciencia y Tecnología' },
        { value: 'Ciencias Sociales', label: 'Ciencias Sociales' },
        { value: 'DPCC', label: 'DPCC' },
        { value: 'Arte', label: 'Arte' },
        { value: 'Inglés', label: 'Inglés' },
        { value: 'EPT', label: 'EPT' },
        { value: 'Religión', label: 'Religión' },
        { value: 'Tutoría', label: 'Tutoría' }
      ];
      this.showOpcionSuscripcion = true;
      // Opciones según materia seleccionada
      if (
        ['Comunicación', 'Matemática', 'Ciencia y Tecnología', 'Ciencias Sociales', 'DPCC', 'Arte'].includes(materia)
      ) {
        this.opcionSuscripcionOptions = [
          { value: '', label: 'Todas las opciones' },
          { value: '1° GRADO', label: '1° GRADO' },
          { value: '2° GRADO', label: '2° GRADO' },
          { value: '3° GRADO', label: '3° GRADO' },
          { value: '4° GRADO', label: '4° GRADO' },
          { value: '5° GRADO', label: '5° GRADO' }
        ];
      } else if (
        ['Inglés', 'EPT', 'Religión', 'Tutoría'].includes(materia)
      ) {
        this.opcionSuscripcionOptions = [
          { value: '', label: 'Todas las opciones' },
          { value: '1 CICLO ( 1° y 2° )', label: '1 CICLO (1° y 2°)' },
          { value: '2 CICLO ( 3° y 4° )', label: '2 CICLO (3° y 4°)' },
          { value: '3 CICLO ( 5° )', label: '3 CICLO (5°)' }
        ];
      } else {
        // Si no hay materia seleccionada o es Comunicación
        this.opcionSuscripcionOptions = [
          { value: '', label: 'Todas las opciones' }
        ];
      }
    } else {
      // Si no hay tipo de suscripción seleccionado, ocultar ambos
      this.showMateriaSuscripcion = false;
      this.showOpcionSuscripcion = false;
      this.materiaSuscripcionOptions = [];
      this.opcionSuscripcionOptions = [];
    }
  }

  onFilterChange(): void {
    this.emitFilters();
  }

  onResetFilters(): void {
    this.selectedFilters = {
      tipoProducto: 'documentos',
      categoria: '',
      materia: '',
      nivel: '',
      grado: '',
      periodo: '365',
      tipoSuscripcion: '',
      materiaSuscripcion: '',
      opcionSuscripcion: ''
    };
    this.updateMaterias();
    this.updateGrados();
    this.emitFilters();
  }

  private updateMaterias(): void {
    // Empezar con "Todas las Materias"
    this.materias = [{ value: '', label: 'Todas las Materias' }];

    if (this.selectedFilters.categoria && this.selectedFilters.nivel) {
      // Si hay categoría y nivel seleccionados, mostrar materias específicas
      const materiasConfig = this.MATERIAS_CONFIG[this.selectedFilters.categoria];
      if (materiasConfig && materiasConfig[this.selectedFilters.nivel]) {
        const materiasDisponibles = materiasConfig[this.selectedFilters.nivel];
        materiasDisponibles.forEach(materia => {
          this.materias.push({
            value: materia,
            label: this.formatMateriaName(materia)
          });
        });
      }
    } else if (this.selectedFilters.categoria && !this.selectedFilters.nivel) {
      // Si solo hay categoría, mostrar todas las materias de esa categoría
      const materiasConfig = this.MATERIAS_CONFIG[this.selectedFilters.categoria];
      if (materiasConfig) {
        const todasLasMaterias = new Set<string>();
        Object.values(materiasConfig).forEach(materiasArray => {
          materiasArray.forEach(materia => todasLasMaterias.add(materia));
        });
        
        Array.from(todasLasMaterias).forEach(materia => {
          this.materias.push({
            value: materia,
            label: this.formatMateriaName(materia)
          });
        });
      }
    } else if (!this.selectedFilters.categoria && this.selectedFilters.nivel) {
      // Si solo hay nivel, mostrar materias de todas las categorías para ese nivel
      const todasLasMaterias = new Set<string>();
      Object.values(this.MATERIAS_CONFIG).forEach(categoriaConfig => {
        if (categoriaConfig[this.selectedFilters.nivel!]) {
          categoriaConfig[this.selectedFilters.nivel!].forEach(materia => {
            todasLasMaterias.add(materia);
          });
        }
      });
      
      Array.from(todasLasMaterias).forEach(materia => {
        this.materias.push({
          value: materia,
          label: this.formatMateriaName(materia)
        });
      });
    } else {
      // Si no hay filtros, mostrar todas las materias disponibles
      const todasLasMaterias = new Set<string>();
      Object.values(this.MATERIAS_CONFIG).forEach(categoriaConfig => {
        Object.values(categoriaConfig).forEach(materiasArray => {
          materiasArray.forEach(materia => todasLasMaterias.add(materia));
        });
      });
      
      Array.from(todasLasMaterias).forEach(materia => {
        this.materias.push({
          value: materia,
          label: this.formatMateriaName(materia)
        });
      });
    }
  }

  private updateGrados(): void {
    // Empezar con "Todos los Grados"
    this.grados = [{ value: '', label: 'Todos los Grados' }];

    if (this.selectedFilters.nivel) {
      // Si hay nivel seleccionado, mostrar grados específicos
      const gradosDisponibles = this.GRADOS_CONFIG[this.selectedFilters.nivel];
      if (gradosDisponibles) {
        gradosDisponibles.forEach(grado => {
          this.grados.push({
            value: grado,
            label: grado
          });
        });
      }
    } else {
      // Si no hay nivel, mostrar todos los grados disponibles
      Object.values(this.GRADOS_CONFIG).forEach(gradosArray => {
        gradosArray.forEach(grado => {
          // Evitar duplicados
          if (!this.grados.find(g => g.value === grado)) {
            this.grados.push({
              value: grado,
              label: grado
            });
          }
        });
      });
    }
  }

  private formatMateriaName(materia: string): string {
    const formatMap: Record<string, string> = {
      'PERSONAL_SOCIAL': 'Personal Social',
      'COMUNICACION': 'Comunicación',
      'MATEMATICA': 'Matemática',
      'CIENCIA_Y_TECNOLOGIA': 'Ciencia y Tecnología',
      'PSICOMOTRICIDAD': 'Psicomotricidad',
      'TUTORIA': 'Tutoría',
      'ARTE_Y_CULTURA': 'Arte y Cultura',
      'RELIGION': 'Religión',
      'CIENCIAS_SOCIALES': 'Ciencias Sociales',
      'DESARROLLO_PERSONAL': 'Desarrollo Personal',
      'INGLES': 'Inglés',
      'EPT': 'Educación para el Trabajo',
      'FISICA': 'Educación Física',
      'EMPRENDIMIENTO': 'Emprendimiento'
    };
    
    return formatMap[materia] || materia;
  }

  private emitFilters(): void {
    this.filtersChanged.emit({ ...this.selectedFilters });
  }
}