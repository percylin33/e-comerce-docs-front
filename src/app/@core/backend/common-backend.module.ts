import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// USERS
import { UsersApi } from './api/users.api';
import { UsersService } from './services/users.service';
import { UserData } from '../interfaces/users';

// DOCUMENTS
import { DocumentData } from '../interfaces/documents';
import { DocumentsApi } from './api/documents.api';
import { DocumentsService } from './services/documents.service';
import { PaymentData } from '../interfaces/payments';
import { PaymentsApi } from './api/payments.api';
import { PaymentService } from './services/payment.service';
import { GraphicsApi } from './api/graphics.api';
import { GraphicsData } from '../interfaces/graphics';
import { GraphicsService } from './services/graphics.service';
import { TokenApi } from './api/token.api';
import { TokenData } from '../interfaces/token';
import { TokenService } from './services/token.service';

// EMBAJADOR
import { EmbajadorApi } from './api/embajador.api';
import { EmbajadorService } from './services/embajador.service';
import { EmbajadorData } from '../interfaces/embajador';

// WITHDRAWAL
import { WithdrawalApi } from './api/withdrawal.api';
import { WithdrawalService } from './services/withdrawal.service';

// LEGAL TEXTS
import { LegalTextApi } from './api/legal-text.api';
import { LegalTextService } from '../services/legal-text.service';

// PROMOTOR DASHBOARD
import { PromotorDashboardApi } from './api/promotor-dashboard.api';
import { PromotorDashboardService } from '../services/promotor-dashboard.service';

// VENTAS
import { VentasApi } from './api/ventas.api';
import { VentasService } from '../services/ventas.service';

// NOTIFICATIONS
import { NotificationsApi } from './api/notifications.api';
import { NotificationsService } from '../services/notifications.service';

// REPORTS
import { ReportsApi } from './api/reports.api';
import { ReportsService } from '../services/reports.service';

const API = [
  UsersApi,
  DocumentsApi,
  PaymentsApi,
  GraphicsApi,
  TokenApi,
  EmbajadorApi,
  WithdrawalApi,
  LegalTextApi,
  PromotorDashboardApi,
  VentasApi,
  NotificationsApi,
  ReportsApi
];

const SERVICES = [
  { provide: UserData, useClass: UsersService },
  { provide: DocumentData, useClass: DocumentsService },
  { provide: PaymentData, useClass: PaymentService },
  { provide: GraphicsData, useClass: GraphicsService },
  { provide: TokenData, useClass: TokenService },
  { provide: EmbajadorData, useClass: EmbajadorService },
  WithdrawalService,
  LegalTextService,
  PromotorDashboardService,
  VentasService,
  NotificationsService,
  ReportsService
]

@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ]
})
export class CommonBackendModule {
  static forRoot(): ModuleWithProviders<CommonBackendModule> {
    return {
      ngModule: CommonBackendModule,
      providers: [
        ...API,
        ...SERVICES,
      ],
    }
  }
}
