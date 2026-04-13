import { NbMenuItem } from '@nebular/theme';

export const MENU_ITEMS: NbMenuItem[] = [
  {
    title: 'Inicio',
    icon: 'home-outline',
    link: '/site/home',
    home: true,
  },
  {
    title: 'Servicios',
    icon: 'credit-card-outline', // Icono para el menú de suscripciones
    children: [
      {
        title: 'MEMBRESÍAS',
        link: '/site/membresia', // Ruta directa
      },
      {
        title: 'KITS DE PLANIFICACIÓN',
        link: '/site/categorias/KITS',
      },
      {
        title: 'SESIONES',
        link: '/site/categorias/PLANIFICACION',
      },
      {
        title: 'KITS DE REFORZAMIENTO',
        link: '/site/categorias/REFORZAMIENTO',
      },
      {
        title: 'PLAN LECTOR',
        link: '/site/categorias/PLAN_LECTOR',
      },
      {
        title: 'EVALUACION',
        link: '/site/categorias/EVALUACION',
      },
      {
        title: 'ESTRATEGIAS',
        link: '/site/categorias/ESTRATEGIAS',
      },
      {
        title: 'RECURSOS',
        link: '/site/categorias/RECURSOS',
      },
      {
        title: 'EBOOKS Y TALLERES',
        link: '/site/categorias/EBOOKS',
      },
      {
        title: 'MATERIAL GRATIS',
        link: '/site/categorias/MATERIAL_GRATIS',
      }
    ],
  },
  {
    title: 'Nosotros',
    icon: 'people-outline',
    link: '/site/nosotros',
  },
  {
    title: 'Contacto',
    icon: 'email-outline',
    link: '/site/contacto',
  },
  

];
