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
    title: 'visitas',
    icon: 'checkmark-square-outline',
    link: '/pages-admin/visitas',
  },
];
