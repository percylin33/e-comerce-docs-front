import { NbMenuItem } from '@nebular/theme';

export const MENU_ITEMS_ADMIN: NbMenuItem[] = [
  {
    title: 'Panel de Control',
    //icon: 'shopping-cart-outline',
    link: '/pages-admin',
    home: true,
  },
  {
    title: 'Usuarios',
    icon: 'people-outline',
    link: '/pages-admin/usuarios',
  },
  {
    title: 'Ventas',
    icon: 'shopping-cart-outline',
    link: '/pages-admin/ventas',
  },
  {
    title: 'Documentos',
    icon: 'archive-outline',
    link: '/pages-admin/documentos', 
  },
  {
    title: 'Papelera',
    icon: 'trash-2-outline',
    link: '/pages-admin/papelera', 
  },
  {
    title: 'Libro de reclamos',
    icon: 'layers-outline',
    link: '/pages-admin/librodereclamos', 
  },
  {
    title: 'Promotores',
    icon: 'person-outline',
    link: '/pages-admin/promotores',
  },
   {
    title: 'Suscriptores',
    icon: 'checkmark-square-outline',
    link: '/pages-admin/suscriptores',
  },
  {
    title: 'Membresías',
    icon: 'credit-card-outline',
    link: '/pages-admin/membresias',
  },
  {
    title: 'visitas',
    icon: 'eye-outline',
    link: '/pages-admin/visitas',
  },
  {
    title: 'Campañas Home',
    icon: 'percent-outline',
    link: '/pages-admin/campanas-promo',
  },
  {
    title: 'Catálogo Sus...',
    icon: 'book-open-outline',
    link: '/pages-admin/catalogo-suscripciones',
  },
  {
    title: 'Administrar',
    icon: 'settings-2-outline',
    link: '/pages-admin/administrar',
  },
  {
    title: 'Kits',
    icon: 'folder-outline',
    children: [
      {
        title: 'Generar Kit',
        icon: 'plus-outline',
        link: '/pages-admin/generate-kit',
      },
      {
        title: 'Aprobaciones',
        icon: 'checkmark-circle-outline',
        link: '/pages-admin/kit-approvals',
      },
      {
        title: 'Equivalencias',
        icon: 'link-outline',
        link: '/pages-admin/grade-equivalences',
      },
    ],
  },
];
