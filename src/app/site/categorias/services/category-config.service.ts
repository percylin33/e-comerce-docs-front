import { Injectable } from '@angular/core';

/**
 * Servicio centralizado para toda la configuración de categorías educativas.
 * Contiene constantes, mapeos de niveles/materias/grados, íconos y descripciones.
 */
@Injectable({
  providedIn: 'root'
})
export class CategoryConfigService {

  // ============================================
  // CONSTANTES GENERALES
  // ============================================

  readonly DEFAULT_NIVELES = ['INICIAL', 'PRIMARIA', 'SECUNDARIA'];
  readonly CONCURSOS_NIVELES = ['PRIMARIA', 'SECUNDARIA'];
  readonly SERVICIOS = [
    'PLANIFICACION', 
    'EVALUACION', 
    'ESTRATEGIAS', 
    'RECURSOS', 
    'CONCURSOS', 
    'EBOOKS', 
    'TALLERES', 
    'PLAN_LECTOR', 
    'REFORZAMIENTO', 
    'MATERIAL_GRATIS'
  ];

  // ============================================
  // CONFIGURACIÓN DE GRADOS POR NIVEL
  // ============================================

  readonly GRADOS_CONFIG: Record<string, string[]> = {
    'INICIAL': ['3 años', '4 años', '5 años'],
    'PRIMARIA': ['III CICLO 1°-2°', 'IV CICLO 3°-4°', 'V CICLO 5°-6°'],
    'SECUNDARIA': ['1°', '2°', '3°', '4°', '5°']
  };

  readonly GRADOS_ESPECIALES_SECUNDARIA = ['1°-2°', '3°-4°', '5°'];
  readonly MATERIAS_GRADOS_ESPECIALES = ['ARTE_Y_CULTURA', 'INGLES', 'RELIGION', 'EPT', 'TUTORIA'];

  // ============================================
  // CONFIGURACIÓN DE MATERIAS POR NIVEL Y CATEGORÍA
  // ============================================

  readonly MATERIAS_CONFIG: Record<string, Record<string, string[]>> = {
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

  // ============================================
  // DESCRIPCIONES E ÍCONOS DE ÁREAS
  // ============================================

  readonly AREAS_DATA = [
    // Nivel Inicial
    { nivel: 'INICIAL', area: 'PERSONAL_SOCIAL', icono: '👧🧒', justificacion: 'Representa interacción social y desarrollo emocional.' },
    { nivel: 'INICIAL', area: 'COMUNICACION', icono: '🗣📖', justificacion: 'Evoca el lenguaje oral y la lectura inicial.' },
    { nivel: 'INICIAL', area: 'MATEMATICA', icono: '🔢🧮', justificacion: 'Asociado al conteo, nociones básicas de número.' },
    { nivel: 'INICIAL', area: 'CIENCIA_Y_TECNOLOGIA', icono: '🔬🐛', justificacion: 'Exploración del entorno natural y tecnológico.' },
    { nivel: 'INICIAL', area: 'PSICOMOTRICIDAD', icono: '🧘‍♂🏃‍♀', justificacion: 'Movimiento corporal y coordinación.' },
    { nivel: 'INICIAL', area: 'TUTORIA', icono: '💬🧑‍🏫', justificacion: 'Acompañamiento afectivo y orientación personal.' },
    
    // Nivel Primaria
    { nivel: 'PRIMARIA', area: 'PERSONAL_SOCIAL', icono: '🧍‍♂🧍‍♀🌍', justificacion: 'Formación en ciudadanía y entorno social.' },
    { nivel: 'PRIMARIA', area: 'COMUNICACION', icono: '📚📝', justificacion: 'Comprensión lectora y producción de textos.' },
    { nivel: 'PRIMARIA', area: 'MATEMATICA', icono: '➕➖✖➗', justificacion: 'Operaciones básicas, resolución de problemas.' },
    { nivel: 'PRIMARIA', area: 'CIENCIA_Y_TECNOLOGIA', icono: '⚗🌱💡', justificacion: 'Ciencias naturales, experimentación y curiosidad.' },
    { nivel: 'PRIMARIA', area: 'ARTE_Y_CULTURA', icono: '🎨🎭🎵', justificacion: 'Creatividad, expresión plástica y artística.' },
    { nivel: 'PRIMARIA', area: 'RELIGION', icono: '✝🕊', justificacion: 'Formación espiritual y valores.' },
    { nivel: 'PRIMARIA', area: 'TUTORIA', icono: '🧠❤', justificacion: 'Formación socioemocional, habilidades blandas.' },
    { nivel: 'PRIMARIA', area: 'FISICA', icono: '🧠❤', justificacion: 'Formación socioemocional, habilidades blandas.' },
    
    // Nivel Secundaria
    { nivel: 'SECUNDARIA', area: 'COMUNICACION', icono: '🗞🖊', justificacion: 'Producción de textos, comprensión crítica.' },
    { nivel: 'SECUNDARIA', area: 'MATEMATICA', icono: '📐📊', justificacion: 'Geometría, álgebra, estadística.' },
    { nivel: 'SECUNDARIA', area: 'CIENCIAS_SOCIALES', icono: '🏛🌎', justificacion: 'Historia, geografía, formación ciudadana.' },
    { nivel: 'SECUNDARIA', area: 'DESARROLLO_PERSONAL', icono: '🧠🧘‍♀', justificacion: 'Identidad, proyecto de vida, autocuidado.' },
    { nivel: 'SECUNDARIA', area: 'CIENCIA_Y_TECNOLOGIA', icono: '🧬🔭', justificacion: 'Física, química, biología, investigación.' },
    { nivel: 'SECUNDARIA', area: 'ARTE_Y_CULTURA', icono: '🎼🖌🎬', justificacion: 'Apreciación artística, producción cultural.' },
    { nivel: 'SECUNDARIA', area: 'INGLES', icono: '📘', justificacion: 'Idioma extranjero, comunicación global.' },
    { nivel: 'SECUNDARIA', area: 'RELIGION', icono: '⛪📿', justificacion: 'Dimensión espiritual, ética.' },
    { nivel: 'SECUNDARIA', area: 'EPT', icono: '🛠💼', justificacion: 'Emprendimiento, habilidades técnicas.' },
    { nivel: 'SECUNDARIA', area: 'TUTORIA', icono: '🗣🧭', justificacion: 'Orientación vocacional, emocional, convivencia.' },
    { nivel: 'SECUNDARIA', area: 'FISICA', icono: '🧠❤', justificacion: 'Formación socioemocional, habilidades blandas.' },
    { nivel: 'SECUNDARIA', area: 'EMPRENDIMIENTO', icono: '🧠❤', justificacion: '🛠🤔💭 Habilidades técnicas y design thinking' }
  ];

  // ============================================
  // MÉTODOS DE UTILIDAD
  // ============================================

  /**
   * Obtiene las materias disponibles para un nivel y categoría específicos
   */
  getMaterias(nivel: string, categoria: string): string[] {
    // Para KITS usar PLANIFICACION, para MATERIAL_GRATIS usar MATERIAL_GRATIS
    const categoriaParaMaterias = categoria === 'KITS' ? 'PLANIFICACION' : categoria;
    
    if (!nivel) {
      // Si no hay nivel, devolver todas las materias únicas de la categoría
      const allMaterias = new Set<string>();
      Object.keys(this.MATERIAS_CONFIG[categoriaParaMaterias] || {}).forEach(nivelKey => {
        this.MATERIAS_CONFIG[categoriaParaMaterias][nivelKey].forEach(materia => {
          allMaterias.add(materia);
        });
      });
      return Array.from(allMaterias).sort();
    }
    
    return this.MATERIAS_CONFIG[categoriaParaMaterias]?.[nivel] || [];
  }

  /**
   * Obtiene los grados disponibles para un nivel específico
   */
  getGrados(nivel: string, materia?: string, categoria?: string): string[] {
    if (!nivel) {
      // Si no hay nivel, devolver todos los grados disponibles
      const allGrados = new Set<string>();
      Object.keys(this.GRADOS_CONFIG).forEach(nivelKey => {
        this.GRADOS_CONFIG[nivelKey].forEach(grado => {
          allGrados.add(grado);
        });
      });
      this.GRADOS_ESPECIALES_SECUNDARIA.forEach(grado => allGrados.add(grado));
      if (categoria === 'KITS') {
        allGrados.add('UNIDOCENTE');
      }
      return Array.from(allGrados).sort();
    }

    // Para REFORZAMIENTO, siempre usar grados individuales en SECUNDARIA
    if (categoria === 'REFORZAMIENTO' && nivel === 'SECUNDARIA') {
      return ['1°', '2°', '3°', '4°', '5°'];
    }

    // Lógica normal para otras categorías
    if (nivel === 'SECUNDARIA' && materia && this.MATERIAS_GRADOS_ESPECIALES.includes(materia)) {
      return [...this.GRADOS_ESPECIALES_SECUNDARIA];
    }

    let grados = [...(this.GRADOS_CONFIG[nivel] || [])];

    // Para KITS añadir UNIDOCENTE en INICIAL
    if (categoria === 'KITS' && nivel === 'INICIAL') {
      grados.push('UNIDOCENTE');
    }

    // Para KITS en SECUNDARIA con ARTE_Y_CULTURA usar grados individuales
    if (categoria === 'KITS' && nivel === 'SECUNDARIA' && materia === 'ARTE_Y_CULTURA') {
      grados = ['1°', '2°', '3°', '4°', '5°'];
    }

    return grados;
  }

  /**
   * Obtiene la descripción de una materia
   */
  getDescription(materia: string): string {
    const area = this.AREAS_DATA.find(a => a.area === materia);
    return area?.justificacion || '';
  }

  /**
   * Formatea el nombre de una materia para mostrar
   */
  formatMateriaName(materia: string): string {
    return materia.replace(/_/g, ' ');
  }

  /**
   * Obtiene los niveles disponibles para una categoría
   */
  getNiveles(categoria: string): string[] {
    if (categoria === 'CONCURSOS') {
      return this.CONCURSOS_NIVELES;
    }
    if (categoria === 'REFORZAMIENTO') {
      return ['SECUNDARIA'];
    }
    return this.DEFAULT_NIVELES;
  }

  /**
   * Obtiene el servicio por defecto para una categoría
   */
  getDefaultServicio(categoria: string): string {
    return categoria === 'KITS' ? 'PLANIFICACION' : categoria;
  }
}
