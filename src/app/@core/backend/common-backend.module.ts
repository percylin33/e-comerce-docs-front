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

const API = [
  UsersApi,
  DocumentsApi,
  PaymentsApi,
  GraphicsApi,
];

const SERVICES = [
  { provide: UserData, useClass: UsersService },
  { provide: DocumentData, useClass: DocumentsService },
  { provide: PaymentData, useClass: PaymentService },
  { provide: GraphicsData, useClass: GraphicsService },
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
