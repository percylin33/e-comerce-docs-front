import { NbMenuItem } from '@nebular/theme';

export const MENU_ITEMS_CUENTA: NbMenuItem[] = [
  {
    title: 'Panel de Cuenta',
    link: '/cuenta/panel',
    home: true,
  },
  {
    title: 'Mi perfil',
    icon: 'bar-chart-outline',
    link: '/cuenta-usuario/perfil',
  },
  {
    title: 'Suscripciones',
    icon: 'file-text-outline',
    link: '/cuenta-usuario/suscripciones',
  }
];