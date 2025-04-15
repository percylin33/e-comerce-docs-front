import { NbMenuItem } from '@nebular/theme';

export const MENU_ITEMS: NbMenuItem[] = [
  {
    title: 'Inicio',
    icon: 'home-outline',
    link: '/site/home',
    home: true,
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
  {
    title: 'Servicios',
    icon: 'credit-card-outline', // Icono para el menú de suscripciones
    children: [
      {
        title: 'SESIONES',
        link: '/site/categorias/PLANIFICACION',
        queryParams: { category: 'PLANIFICACION' }, // Parámetro de consulta
      },
      {
        title: 'EVALUACION',
        link: '/site/categorias/EVALUACION',
        queryParams: { category: 'EVALUACION' }, // Parámetro de consulta
      },
      {
        title: 'ESTRATEGIAS',
        link: '/site/categorias/ESTRATEGIAS',
        queryParams: { category: 'ESTRATEGIAS' }, // Parámetro de consulta
      },
      {
        title: 'RECURSOS',
        link: '/site/categorias/RECURSOS',
        queryParams: { category: 'RECURSOS' }, // Parámetro de consulta
      },
      {
        title: 'EBOOKS',
        link: '/site/categorias/EBOOKS',
        queryParams: { category: 'EBOOKS' }, // Parámetro de consulta
      },
      {
        title: 'KITS',
        link: '/site/categorias/KITS',
        queryParams: { category: 'KITS' }, // Parámetro de consulta
      },
      {
        title: 'TALLERES',
        link: '/site/categorias/TALLERES',
        queryParams: { category: 'TALLERES' }, // Parámetro de consulta
      }
    ],
  }

];
