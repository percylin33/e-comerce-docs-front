import { NbMenuItem } from '@nebular/theme';

export const MENU_ITEMS_PROMOTOR: NbMenuItem[] = [
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

];