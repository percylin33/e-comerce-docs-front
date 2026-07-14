import { NbMenuItem } from '@nebular/theme';

export const MENU_ITEMS_ADMIN_CREADOR: NbMenuItem[] = [
  {
    title: 'Aprobaciones',
    icon: 'checkmark-square-outline',
    link: '/admin-creadores/aprobaciones',
    home: true,
  },
  {
    title: 'Creadores',
    icon: 'people-outline',
    link: '/admin-creadores/creadores',
  },
  {
    title: 'Documentos',
    icon: 'file-text-outline',
    link: '/admin-creadores/documentos',
  },
  {
    title: 'Retiros',
    icon: 'credit-card-outline',
    link: '/admin-creadores/retiros',
  },
  {
    title: 'Configuracion',
    icon: 'settings-2-outline',
    link: '/admin-creadores/config',
  },
  {
    title: 'Tutoriales',
    icon: 'film-outline',
    link: '/admin-creadores/tutoriales',
  },
];