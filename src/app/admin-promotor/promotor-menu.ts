import { NbMenuItem } from '@nebular/theme';

export const MENU_ITEMS_PROMOTOR: NbMenuItem[] = [
  {
    title: 'Panel de Control',
    link: '/promotor/panel',
    home: true,
  },
  {
    title: 'Graficos de Ventas',
    icon: 'bar-chart-outline',
    link: '/promotor/panel',
  },
  {
    title: 'Generar Cupón',
    icon: 'file-text-outline',
    link: '/promotor/cupon',
  }
];