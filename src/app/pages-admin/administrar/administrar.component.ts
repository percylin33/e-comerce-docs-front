import { Component } from '@angular/core';
import { MatCard } from '@angular/material/card';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { EquipoCrudComponent } from './equipos/equipo-crud.component';
import { AliadoCrudComponent } from './aliados/aliado-crud.component';
import { HistoriaCrudComponent } from './historia/historia-crud.component';
import { ComentarioCrudComponent } from './comentarios/comentario-crud.component';
import { UnitScheduleCrudComponent } from './unit-schedule/unit-schedule-crud.component';
import { AdminTerminosEmbajadorComponent } from './terminos/admin-terminos-embajador.component';

@Component({
    selector: 'ngx-administrar',
    templateUrl: './administrar.component.html',
    styleUrls: ['./administrar.component.scss'],
    standalone: true,
    imports: [MatCard, MatTabGroup, MatTab, EquipoCrudComponent, AliadoCrudComponent, HistoriaCrudComponent, ComentarioCrudComponent, UnitScheduleCrudComponent, AdminTerminosEmbajadorComponent]
})
export class AdministrarComponent {}
