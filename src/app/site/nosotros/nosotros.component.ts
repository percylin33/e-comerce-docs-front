import { animate, query, stagger, state, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { HistoriaService } from '../../@core/backend/services/historia.service';
import { EquipoService } from '../../@core/backend/services/equipo.service';
import { AliadoService } from '../../@core/backend/services/aliado.service';
import { ComentarioClienteService } from '../../@core/backend/services/comentario-cliente.service';
import { Historia } from '../../@core/interfaces/historia';
import { Equipo } from '../../@core/interfaces/equipo';
import { Aliado } from '../../@core/interfaces/aliado';
import { ComentarioCliente } from '../../@core/interfaces/comentario-cliente';
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

  historia: Historia[] = [];
  equipo: Equipo[] = [];
  equipoDocentes: Equipo[] = [];
  equipoDireccion: Equipo[] = [];
  equipoAtencion: Equipo[] = [];
  aliados: Aliado[] = [];
  valores: any[] = [];
  comentarios: ComentarioCliente[] = [];

  constructor(
    private historiaService: HistoriaService,
    private equipoService: EquipoService,
    private aliadoService: AliadoService,
    private comentarioClienteService: ComentarioClienteService
  ) {}

  ngOnInit() {

    this.valores = [
    { icon: 'verified_user', title: 'Compromiso Educativo', desc: 'Creemos que la educación transforma vidas y comunidades. Por eso, creamos soluciones prácticas y de calidad, pensando siempre en el bienestar y el aprendizaje real de docentes y estudiantes.' },
    { icon: 'diversity_3', title: 'Relacionales', desc: 'Cada material, cada taller y cada asesoría están diseñados para impulsar clases más creativas, humanas y efectivas. Innovamos con sentido, escuchando a los maestros y respondiendo a sus verdaderos desafíos.' },
    { icon: 'auto_awesome', title: 'Comunidad y colaboración', desc: 'No caminamos solos: construimos redes de apoyo entre maestros, aliados y profesionales comprometidos con la educación. Juntos llegamos más lejos y logramos un impacto real y sostenible.' }
  ];
    this.historiaService.getAll().subscribe(data => {
      this.historia = data;
    });
    this.equipoService.getAll().subscribe(data => {
      // Reinicia los arrays
      this.equipo = [];
      this.equipoDocentes = [];
      this.equipoDireccion = [];
      this.equipoAtencion = [];
      // Recorre la respuesta y distribuye según tipo
      data.forEach((item: any) => {
        item.especialidades = item.especialidades ? item.especialidades.split(',').map((e: string) => e.trim()) : [];
        switch (item.tipo) {
          case 'equipo':
            this.equipo.push(item);
            break;
          case 'equipoDocentes':
            this.equipoDocentes.push(item);
            break;
          case 'equipoDireccion':
            this.equipoDireccion.push(item);
            break;
          case 'equipoAtencion':
            this.equipoAtencion.push(item);
            break;
        }
      });
    });
    this.aliadoService.getAll().subscribe(data => {
      this.aliados = data;
    });
    this.comentarioClienteService.getAll().subscribe(data => {
      this.comentarios = data;
    });
  }
    }
//       detalle: ``
//     },
//     {
//       img: 'assets/images/nosotros/luisa.png',
//       name: 'Luisa  Mostacero.',
//       role: 'Gestor de ventas 2024',
//       especialidades: [
//         'Asesor de Marketing',
//       ],
//       detalle: ``
//     },
//     {
//       img: 'assets/images/nosotros/yeyson.png',
//       name: 'Jheyson Pichen',
//       role: 'Editor de Materiales.',
//       especialidades: [
//         'Edición y ventas',
//       ],
//       detalle: ``
//     },
//     // {
//     //   img: 'assets/images/nosotros/derbyn.jpg',
//     //   name: 'Derbyn Chigne.',
//     //   role: 'Editor de Materiales.',
//     //   especialidades: [
//     //     'Edición y video',
//     //   ],
//     //   detalle: ``
//     // }
//   ];

//   oficinas = [
//     'assets/images/nick.png',
//     'assets/images/nick.png'
//   ];

//   aliados = [
//     { img: 'assets/images/nosotros/traime.jpg', name: 'TrainMe Education', location:"Bogotá, Colombia.", link:"https://trainme.education/", desc: 'Acompañamos a los docentes y líderes educativos a impulsar el aprendizaje con sentido humano, tecnología efectiva e innovación, a través de programas educativos y herramientas digitales que conectan con las emociones, las necesidades del aula y los retos del futuro.' },
//     { img: 'assets/images/nosotros/seres.jpg', name: 'Seres Educación', location:"Guanajuato, México.", link:"https://www.linkedin.com/in/edithverónicasotomayorflores/", desc: 'SERES Educación es un proyecto educativo que tiene como propósito transformar la educación para fortalecer el bienestar humano. Es una invitación para vivir los procesos educativos de una manera más consciente y real. Ofrezco mentorías, cursos y espacios de reflexión para visualizar la enseñanza y el aprendizaje como una experiencia significativa que nos permitan construir posibilidades para vivir dignamente.' },
//     { img: 'assets/images/nosotros/ludea.jpg', name: 'Lu´dea', location:"Monterrey, México.", link:"https://www.facebook.com/share/15vq2sFLPq/", desc: 'Lu’dea es una comunidad educativa que busca “parvulizar el mundo” a través del juego, la cercanía y una pedagogía con sentido. Ofrecemos talleres, recursos y acompañamiento para maestras, maestros y familias, enfocados en la cultura escrita, el pensamiento computacional y las habilidades socioemocionales en la primera infancia. Nuestra propuesta es relevante porque conecta la teoría con la práctica, fortalece la labor docente desde la reflexión colectiva y pone al centro el bienestar de las infancias. Lu’dea es comunidad, cobijo y transformación pedagógica.' },
//  { img: 'assets/images/nosotros/lideres.png', name: 'LÍDERES EN ACCIÓN M&C', location:"Lima – Perú.", link:"https://www.facebook.com/profile.php?id=100089591106238", desc: 'Lu’dea es una comunidad educativa que busca “parvulizar el mundo” a través del juego, la cercanía y una pedagogía con sentido. Ofrecemos talleres, recursos y acompañamiento para maestras, maestros y familias, enfocados en la cultura escrita, el pensamiento computacional y las habilidades socioemocionales en la primera infancia. Nuestra propuesta es relevante porque conecta la teoría con la práctica, fortalece la labor docente desde la reflexión colectiva y pone al centro el bienestar de las infancias. Lu’dea es comunidad, cobijo y transformación pedagógica.' },
//   ];


// El constructor real está dentro de la clase arriba. El cierre de la clase ya está correcto.

