import { animate, query, stagger, state, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { title } from 'process';

@Component({
  selector: 'ngx-nosotros',
  templateUrl: './nosotros.component.html',
  styleUrls: ['./nosotros.component.scss'],
  animations: [
    trigger('fadeUp', [
      state('out', style({ opacity: 0, transform: 'translateY(150px)' })),
      state('in', style({ opacity: 1, transform: 'none' })),
      transition('out => in', [
        animate('1500ms cubic-bezier(.23,1.02,.67,.98)')
      ]),
      transition('in => out', [
        animate('300ms cubic-bezier(.23,1.02,.67,.98)')
      ]),
    ]),
    trigger('fadeRight', [
      state('out', style({ opacity: 0, transform: 'translateX(200px)' })),
      state('in', style({ opacity: 1, transform: 'none' })),
      transition('out => in', [
        animate('1500ms cubic-bezier(.23,1.02,.67,.98)')
      ]),
      transition('in => out', [
        animate('300ms cubic-bezier(.23,1.02,.67,.98)')
      ]),
    ]),
    trigger('fadeLeft', [
      state('out', style({ opacity: 0, transform: 'translateX(-200px)' })),
      state('in', style({ opacity: 1, transform: 'none' })),
      transition('out => in', [
        animate('1500ms cubic-bezier(.23,1.02,.67,.98)')
      ]),
      transition('in => out', [
        animate('300ms cubic-bezier(.23,1.02,.67,.98)')
      ]),
    ]),
    trigger('listStagger', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(120px)' }),
          stagger(120, [
            animate('700ms cubic-bezier(.23,1.02,.67,.98)', style({ opacity: 1, transform: 'none' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class NosotrosComponent implements OnInit {
  //  @ViewChild('wrapperAOS') wrapper!: ElementRef<HTMLElement>;

  isVisible = false;
  isValoresVisible = false;
  isHistoriaVisible = false;
  isPremiosVisible = false;
  isEquipoVisible = false;
  isOficinasVisible = false;
  isAliadosVisible = false;
  isComentariosVisible = false;
  flipped: boolean[] = [];
  flipped2: boolean[] = [];

  ngOnInit() {
    this.flipped = this.equipo.map(() => false);

  }

  valores = [
    { icon: 'verified_user', title: 'Compromiso Educativo', desc: 'Creemos que la educación transforma vidas y comunidades. Por eso, creamos soluciones prácticas y de calidad, pensando siempre en el bienestar y el aprendizaje real de docentes y estudiantes.' }, // Integridad y resiliencia
    { icon: 'diversity_3', title: 'Relacionales', desc: 'Cada material, cada taller y cada asesoría están diseñados para impulsar clases más creativas, humanas y efectivas. Innovamos con sentido, escuchando a los maestros y respondiendo a sus verdaderos desafíos.' }, // Relaciones y comunidad
    { icon: 'auto_awesome', title: 'Comunidad y colaboración', desc: 'No caminamos solos: construimos redes de apoyo entre maestros, aliados y profesionales comprometidos con la educación. Juntos llegamos más lejos y logramos un impacto real y sostenible.' }, // Innovación y calidad


  ];

  historia = [
    { year: '2020', img: 'assets/iconos/20.jpg', title: '2020 – Fundadores con visión', text: 'Nace Carpeta Digital el 06 de junio de 2020, fundada por Santos y Esther para apoyar a docentes en plena pandemia.' },
    { year: '2021', img: 'assets/iconos/21.jpg', title: '2021 – Ampliación de servicios', text: 'Ofrecemos materiales innovadores para inicial, primaria y secundaria.' },
    { year: '2022', img: 'assets/iconos/22.jpg', title: '2022 – Crecimiento acelerado', text: 'Explosión en redes sociales y compra de nuestro 1er local físico.' },
    { year: '2023', img: 'assets/iconos/23.jpg', title: '2023 – Consolidación y expansión', text: 'Adquirimos nuestra segunda oficina para ampliar capacidades.' },
    { year: '2024', img: 'assets/iconos/24.jpg', title: '2024 – Más servicios, más impacto', text: 'Ampliamos nuestros kits, asesorías y recursos para llegar a más docentes.' },
    { year: '2025', img: 'assets/iconos/25.jpg', title: '2025 – Tienda virtual y proyección internacional', text: 'Lanzamos nuestra tienda virtual y empezamos a conectar con educadores de toda Latinoamérica.' }
  ];

  premios = [
    { img: 'assets/images/nick.png', title: 'Premio a la Excelencia', desc: 'Mejor Startup 2018' },
    { img: 'assets/images/nick.png', title: 'Innovación', desc: 'Reconocimiento 2021' }
  ];

  equipo = [
    {
      img: 'assets/images/nosotros/santos.jpg',
      name: 'Santos Dávalos Culquichicón',
      role: 'Gerente 2020 - 2025',
      title: 'Fundador, Educador y Abogado',
      especialidades: [
        'Experto en Educación Primaria y Derecho Corporativo. ',
        'Asesor en Dirección integral de empresas.',
        'Asesor en transformación educativa y desarrollo innovador.'
      ],
      detalle: `Profesor especialista en el nivel Primaria y Abogado especializado en Derecho Corporativo y gestor integral de Carpeta Digital.
Responsable de la dirección legal, técnica, contable y administrativa de la empresa.
Visionario y líder comprometido con la transformación educativa en el país.`
    },
    {
      img: 'assets/images/nosotros/esther.jpg',
      name: 'Esther Pichén Leon',
      role: 'Gerente Organizacional 2021 – 2025',
      title: 'Cofundador, Educadora y Doctora',
      especialidades: [
        'Experta en comunicación y gestión organizacional.',
        'Asesora en Dirección estratégica en educación.',
        'Asesora en crecimiento e impacto de la empresa.'
      ],
      detalle: `Doctora en educación, especialista y consultora en el área de comunicación y gestora organizacional de Carpeta Digital. 
Responsable de la dirección Pedagógica, Marketing, Producción y ventas de la empresa. Visionaria, empoderada y Líder innata con la trascendencia de la empresa.`
    }
  ];

  equipoDocentes = [
    {
      img: 'assets/images/nosotros/raysa.png',
      name: 'Raysa, Carranza',
      role: 'Diseño y Producción.',
      especialidades: [
        'Especialista de Comunicación.',
      ],
      detalle: ``
    },
    {
      img: 'assets/images/nosotros/elvis.png',
      name: 'Elvis, Ruiz',
      role: 'Diseño y Producción. ',
      especialidades: [
        'Especialista de Matemática.',
      ],
      detalle: ``
    },
    {
      img: 'assets/images/nosotros/raul.png',
      name: 'Raul, Loloy',
      role: 'Diseño y Producción. ',
      especialidades: [
        'Especialista de sociales y persona',
      ],
      detalle: ` `
    },
    {
      img: 'assets/images/nosotros/leonidas.jpg',
      name: 'Leonidas, Ruiz',
      role: 'Diseño y Producción. ',
      especialidades: [
        'Especialista de ciencia y tecnología.',
      ],
      detalle: ` `
    },
    {
      img: 'assets/images/nosotros/jhyno.jpg',
      name: 'Yhino, Perez',
      role: 'Diseño y Producción. ',
      especialidades: [
        'Especialista de Arte y Cultura.',
      ],
      detalle: ` `
    },
    {
      img: 'assets/images/nosotros/nancy.jpg',
      name: 'Nancy, Saucedo',
      role: 'Diseño y Producción. ',
      especialidades: [
        'Especialista de ciencia',
      ],
      detalle: ` `
    },
    {
      img: 'assets/images/nosotros/yasmin.jpg',
      name: 'Jazmin, Berrocal',
      role: 'Diseño y Producción. ',
      especialidades: [
        'Especialista de inglés.',
      ],
      detalle: ` `
    },
    {
      img: 'assets/images/nosotros/ana.jpg',
      name: 'Ana, Gonzales',
      role: 'Diseño y Producción. ',
      especialidades: [
        'Especialista del Nivel Inicial. ',
      ],
      detalle: ` `
    }
  ];

  equipoDireccion = [
    {
      img: 'assets/images/nosotros/virginia.jpg',
      name: 'Virginia Mostacero',
      role: 'Coordinadora Estratégica y Administrativa - 2025',
      title: 'Contadora',
      especialidades: [
        'Responsable de operaciones y marketing'
      ],
      detalle: `Contadora, Con profundo conocimiento de las regulaciones específicas del sector, encargada de la contabilidad, tributación y planificación financiera de la empresa. Especialista en marketing digital y tecnologías en crecimiento. `
    },
    {
      img: 'assets/images/nosotros/mercy.jpg',
      name: 'Mercy Medina',
      role: 'Coordinador de Gestión Pedagógica y Acompañamiento Institucional.',
      title: 'Educadora',
      especialidades: [
        'Responsable Pedagógica y dirección',
      ],
      detalle: `Docente nivel Primaria, Con profunda vocación de acompañar, monitorear y evaluar de forma cercana y con enfoque pedagógico al equipo docente y administrativo.`
    },
    {
      img: 'assets/images/nosotros/percy.jpg',
      name: 'Percy Valderrama Arias',
      role: 'Desarrollo Web y Soporte Técnico.  - 2025',
      title: 'Desarrollador',
      especialidades: [
        'Responsable de la plataforma digital y soporte técnico',
      ],
      detalle: `Responsable de la implementación técnica de la plataforma, soporte a usuarios, actualización de recursos y mantenimiento de nuestra tienda virtual y aulas digitales.`
    },
  ];

  equipoAtencion = [
    {
      img: 'assets/images/nosotros/rosita.png',
      name: 'Rosa Rafael Silva',
      role: 'Gestor de ventas 2023 - 2024',
      especialidades: [
        'Asesor de venta.',
      ],
      detalle: ``
    },
    {
      img: 'assets/images/nosotros/luisa.png',
      name: 'Luisa  Mostacero.',
      role: 'Gestor de ventas 2024',
      especialidades: [
        'Asesor de Marketing',
      ],
      detalle: ``
    },
    {
      img: 'assets/images/nosotros/yeyson.png',
      name: 'Jheyson Pichen',
      role: 'Editor de Materiales.',
      especialidades: [
        'Edición y ventas',
      ],
      detalle: ``
    },
    {
      img: 'assets/images/nosotros/derbyn.jpg',
      name: 'Derbyn Chigne.',
      role: 'Editor de Materiales.',
      especialidades: [
        'Edición y video',
      ],
      detalle: ``
    }
  ];

  oficinas = [
    'assets/images/nick.png',
    'assets/images/nick.png'
  ];

  aliados = [
    { img: 'assets/images/nosotros/traime.jpg', name: 'TrainMe Education', location:"Bogotá, Colombia.", link:"https://trainme.education/", desc: 'Acompañamos a los docentes y líderes educativos a impulsar el aprendizaje con sentido humano, tecnología efectiva e innovación, a través de programas educativos y herramientas digitales que conectan con las emociones, las necesidades del aula y los retos del futuro.' },
    { img: 'assets/images/nosotros/seres.jpg', name: 'Seres Educación', location:"Guanajuato, México.", link:"https://www.linkedin.com/in/edithverónicasotomayorflores/", desc: 'SERES Educación es un proyecto educativo que tiene como propósito transformar la educación para fortalecer el bienestar humano. Es una invitación para vivir los procesos educativos de una manera más consciente y real. Ofrezco mentorías, cursos y espacios de reflexión para visualizar la enseñanza y el aprendizaje como una experiencia significativa que nos permitan construir posibilidades para vivir dignamente.' },
    { img: 'assets/images/nosotros/ludea.jpg', name: 'Lu´dea', location:"Monterrey, México.", link:"https://www.facebook.com/share/15vq2sFLPq/", desc: 'Lu’dea es una comunidad educativa que busca “parvulizar el mundo” a través del juego, la cercanía y una pedagogía con sentido. Ofrecemos talleres, recursos y acompañamiento para maestras, maestros y familias, enfocados en la cultura escrita, el pensamiento computacional y las habilidades socioemocionales en la primera infancia. Nuestra propuesta es relevante porque conecta la teoría con la práctica, fortalece la labor docente desde la reflexión colectiva y pone al centro el bienestar de las infancias. Lu’dea es comunidad, cobijo y transformación pedagógica.' },
 { img: 'assets/images/nosotros/lideres.png', name: 'LÍDERES EN ACCIÓN M&C', location:"Lima – Perú.", link:"https://www.facebook.com/profile.php?id=100089591106238", desc: 'Lu’dea es una comunidad educativa que busca “parvulizar el mundo” a través del juego, la cercanía y una pedagogía con sentido. Ofrecemos talleres, recursos y acompañamiento para maestras, maestros y familias, enfocados en la cultura escrita, el pensamiento computacional y las habilidades socioemocionales en la primera infancia. Nuestra propuesta es relevante porque conecta la teoría con la práctica, fortalece la labor docente desde la reflexión colectiva y pone al centro el bienestar de las infancias. Lu’dea es comunidad, cobijo y transformación pedagógica.' },
  ];

  comentarios = [
    {
      avatar: 'assets/images/nosotros/ah1.png',
      texto: 'Excelente experiencia con Carpeta Digital Education. La atención al cliente es impecable y los servicios ofrecidos son de alta calidad.',
      nombre: 'Cesar Chayguaque',
      ubicacion: 'La Libertad'
    },
    {
      avatar: 'assets/images/nosotros/am1.png',
      texto: 'Excelente material educativo de acuerdo al enfoque actualizado de la evaluación formativa.',
      nombre: 'Yessica Bustinza Caira',
      ubicacion: 'Arequipa'
    },
    {
      avatar: 'assets/images/nosotros/am1.png',
      texto: 'Agradecemos por su ayuda e información que nos son de mucha utilidad para el Área de Arte y Cultura.',
      nombre: 'Karen Karol Ojeda Lam',
      ubicacion: 'Piura'
    },
    {
      avatar: 'assets/images/nosotros/ah2.png',
      texto: 'Yo recomiendo Carpeta Digital porque nos brinda material de acuerdo a lo establecido con el MINEDU y cumple con los que nos ofrece de manera oportuna.',
      nombre: 'Alan German Murrugarra',
      ubicacion: 'Cajamarca'
    }
  ];

  constructor() { }



  //   ngAfterViewInit(): void {
  //   AOS.init({
  //     duration: 2000,
  //     once: false,
  //     offset: 120
  //   });
  //   setTimeout(() => {
  //     AOS.refresh();
  //   }, 4000);

  //   // Opcional: si quieres refrescar en cada scroll o resize del window
  //   window.addEventListener('scroll', () => AOS.refresh());
  //   window.addEventListener('resize', () => AOS.refresh());
  // }

}

