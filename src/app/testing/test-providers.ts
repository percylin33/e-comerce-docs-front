/**
 * Providers compartidos para specs de Karma/Jasmine.
 *
 * Uso:
 *   import { commonTestProviders } from 'src/app/testing/test-providers';
 *   TestBed.configureTestingModule({
 *     imports: [MyComponent],
 *     providers: [...commonTestProviders()],
 *   });
 */
import { Provider, EnvironmentProviders } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  NbDialogRef,
  NbToastrService,
  NbStatusService,
  NbDialogService,
  NbIconLibraries,
  NbSidebarService,
  NbMenuService,
  NbThemeService,
  NbPositionBuilderService,
  NbOverlayService,
  NbTriggerStrategyBuilderService,
  NbOverlayContainer,
  NbLayoutDirectionService,
} from '@nebular/theme';
import { of } from 'rxjs';

import { DocumentData } from '../@core/interfaces/documents';
import { UserData } from '../@core/interfaces/users';
import { PaymentData } from '../@core/interfaces/payments';
import { ContactData } from '../@core/interfaces/contact';
import { SuscripcionesData } from '../@core/interfaces/suscripciones';
import { SubscriptionTypesData } from '../@core/data/subscription-types';
import { GraphicsData } from '../@core/interfaces/graphics';

/** Proxy fluido: cualquier metodo retorna el propio proxy excepto build/show$/hide$ que retornan vacios */
function fluentMock(): any {
  const obj: any = new Proxy(function () {}, {
    get: (_t, prop) => {
      if (prop === 'show$' || prop === 'hide$') return of({});
      if (prop === 'build') return () => ({ show$: of({}), hide$: of({}), destroy: () => {}, attach: () => ({ instance: {} }), updatePosition: () => {} });
      if (prop === 'then' || typeof prop === 'symbol') return undefined;
      return () => obj;
    },
    apply: () => obj,
  });
  return obj;
}

/**
 * Proxy stub: cualquier propiedad accedida devuelve una funcion que
 * retorna un Observable vacio.
 */
function dataServiceStub(): any {
  const handler: ProxyHandler<any> = {
    get: (_target, prop) => {
      if (prop === 'then' || prop === Symbol.toPrimitive || prop === Symbol.iterator) {
        return undefined;
      }
      return (..._args: any[]) => of([] as any);
    },
  };
  return new Proxy({}, handler);
}

const nbToastrMock: any = {
  show: () => {},
  success: () => {},
  warning: () => {},
  danger: () => {},
  info: () => {},
  primary: () => {},
};

const nbStatusServiceMock: any = {
  getStatusClass: () => '',
  isCustomStatus: () => false,
};

const nbDialogServiceMock: any = {
  open: () => ({ onClose: of(null), close: () => {} }),
};

const nbIconLibrariesMock: any = (() => {
  const iconDef = {
    name: 'noop',
    type: 'svg',
    pack: 'eva',
    icon: { getContent: () => '', getClasses: () => [] as string[] },
  };
  return {
    registerSvgPack: () => {},
    registerFontPack: () => {},
    setDefaultPack: () => {},
    getPack: () => ({ icons: new Map(), name: 'eva', type: 'svg' }),
    getSvgIcon: () => iconDef,
    getFontIcon: () => iconDef,
    getIcon: () => iconDef,
  };
})();

const activatedRouteMock: any = {
  params: of({}),
  queryParams: of({}),
  data: of({}),
  fragment: of(null),
  url: of([]),
  snapshot: {
    params: {},
    queryParams: {},
    data: {},
    paramMap: { get: () => null, getAll: () => [], has: () => false, keys: [] },
    queryParamMap: { get: () => null, getAll: () => [], has: () => false, keys: [] },
  },
  paramMap: of({ get: () => null, getAll: () => [], has: () => false, keys: [] }),
  queryParamMap: of({ get: () => null, getAll: () => [], has: () => false, keys: [] }),
};

const dialogRefMock: any = {
  close: () => {},
  afterClosed: () => of(null),
  onClose: of(null),
  componentInstance: {},
};

export function commonTestProviders(): Array<Provider | EnvironmentProviders> {
  return [
    provideHttpClient(),
    provideHttpClientTesting(),
    provideRouter([]),
    provideNoopAnimations(),
    { provide: ActivatedRoute, useValue: activatedRouteMock },
    { provide: MatDialogRef, useValue: dialogRefMock },
    { provide: MAT_DIALOG_DATA, useValue: {} },
    { provide: NbDialogRef, useValue: dialogRefMock },
    { provide: NbDialogService, useValue: nbDialogServiceMock },
    { provide: NbToastrService, useValue: nbToastrMock },
    { provide: NbStatusService, useValue: nbStatusServiceMock },
    { provide: NbIconLibraries, useValue: nbIconLibrariesMock },
    {
      provide: NbPositionBuilderService,
      useValue: { connectedTo: () => fluentMock() },
    },
    {
      provide: NbTriggerStrategyBuilderService,
      useValue: { trigger: () => fluentMock() },
    },
    {
      provide: NbOverlayService,
      useValue: {
        create: () => ({
          attach: () => ({ instance: {} }),
          detach: () => {},
          dispose: () => {},
          updatePosition: () => {},
          hasAttached: () => false,
        }),
        scrollStrategies: { reposition: () => ({}), block: () => ({}), close: () => ({}), noop: () => ({}) },
      },
    },
    {
      provide: NbOverlayContainer,
      useValue: {
        getContainerElement: () => document.createElement('div'),
        ngOnDestroy: () => {},
      },
    },
    {
      provide: NbLayoutDirectionService,
      useValue: {
        getDirection: () => 'ltr',
        setDirection: () => {},
        onDirectionChange: () => of('ltr'),
        isLtr: () => true,
        isRtl: () => false,
      },
    },
    {
      provide: NbSidebarService,
      useValue: {
        toggle: () => {},
        expand: () => {},
        collapse: () => {},
        onToggle: () => of({}),
        onExpand: () => of({}),
        onCollapse: () => of({}),
        onCompact: () => of({}),
      },
    },
    {
      provide: NbMenuService,
      useValue: {
        onItemClick: () => of({}),
        onItemSelect: () => of({}),
        onItemHover: () => of({}),
        onSubmenuToggle: () => of({}),
        onItemCollapse: () => of({}),
        addItems: () => {},
        navigateHome: () => {},
        getSelectedItem: () => of({}),
        collapseAll: () => {},
      },
    },
    {
      provide: NbThemeService,
      useValue: {
        currentTheme: 'default',
        onThemeChange: () => of({ name: 'default', previous: 'default' }),
        onMediaQueryChange: () => of([null, null]),
        getJsTheme: () => of({ name: 'default', variables: {} }),
        changeTheme: () => {},
      },
    },
    { provide: DocumentData, useFactory: dataServiceStub },
    { provide: UserData, useFactory: dataServiceStub },
    { provide: PaymentData, useFactory: dataServiceStub },
    { provide: ContactData, useFactory: dataServiceStub },
    { provide: SuscripcionesData, useFactory: dataServiceStub },
    { provide: SubscriptionTypesData, useFactory: dataServiceStub },
    { provide: GraphicsData, useFactory: dataServiceStub },
  ];
}
