import { Component, ElementRef, Renderer2, AfterViewInit, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { PreEmbajadorService } from '../../@core/backend/services/preembajador.service';
import { PreEmbajador } from '../../@core/backend/api/preembajador.api';
import { TerminosCondicionesService } from '../../@core/backend/services/terminos-condiciones.service';
import { TerminosCondiciones } from '../../@core/interfaces/terminos-condiciones.model';

@Component({
    selector: 'ngx-embajadores',
    templateUrl: './embajadores.component.html',
    styleUrls: ['./embajadores.component.scss']
})
export class EmbajadoresComponent implements AfterViewInit, OnInit {
    errores: { [key: string]: string } = {};

        showModalMensaje: boolean = false;
        modalMensaje: string = '';
        modalTipo: 'success' | 'error' = 'success';

    get fechaActualizacion(): string {
        const fechaTerm = this.terminosModal.find(t => t.titulo === 'fecha');
        return fechaTerm ? fechaTerm.contenido : 'Sin fecha';
    }
    selectedCountry: string = '';
    terminosVistaPrevia: TerminosCondiciones[] = [];
    terminosModal: TerminosCondiciones[] = [];
    onCountryChange(event: Event) {
        const select = event.target as HTMLSelectElement;
        this.selectedCountry = select.value;
    }
    showTermsModal = false;
    faqActiveIndex: number | null = null;

    constructor(
        private el: ElementRef,
        private renderer: Renderer2,
        private preEmbajadorService: PreEmbajadorService,
        private terminosService: TerminosCondicionesService,
        private sanitizer: DomSanitizer
    ) {}
    ngOnInit() {
        this.terminosService.getAll().subscribe((data) => {
            this.terminosVistaPrevia = data.filter(t => t.vistaPrevia);
            this.terminosModal = data.filter(t => !t.vistaPrevia);
        });
    }

    ngAfterViewInit() {
        // Validación de DNI
        const dniInput = this.el.nativeElement.querySelector('#dni');
        if (dniInput) {
            this.renderer.listen(dniInput, 'input', (event: any) => {
                let value = event.target.value.replace(/\D/g, '');
                if (value.length > 8) value = value.slice(0, 8);
                event.target.value = value;
            });
        }
        // Validación de RUC
        const rucInput = this.el.nativeElement.querySelector('#ruc');
        if (rucInput) {
            this.renderer.listen(rucInput, 'input', (event: any) => {
                let value = event.target.value.replace(/\D/g, '');
                if (value.length > 11) value = value.slice(0, 11);
                event.target.value = value;
            });
        }
        // Validación de teléfono
        const telefonoInput = this.el.nativeElement.querySelector('#telefono');
        if (telefonoInput) {
            this.renderer.listen(telefonoInput, 'input', (event: any) => {
                let value = event.target.value.replace(/\D/g, '');
                if (value.length > 9) value = value.slice(0, 9);
                event.target.value = value;
            });
        }
    }

    // Modal para términos y condiciones
    openTermsModal(event: Event) {
        console.log('Modal abierto');
        this.showTermsModal = true;
    }
    closeTermsModal() {
        this.showTermsModal = false;
    }
    onModalBackgroundClick(event: Event) {
        if ((event.target as HTMLElement).classList.contains('modal')) {
            this.closeTermsModal();
        }
    }

    // FAQ Toggle
    toggleFaq(index: number) {
        this.faqActiveIndex = this.faqActiveIndex === index ? null : index;
    }

    // Form submission
    onSubmit(form: HTMLFormElement) {
        this.errores = {};
        const aceptaTerminos = (form.querySelector('#aceptoTerminos') as HTMLInputElement)?.checked;
        const aceptaPrivacidad = (form.querySelector('#aceptoPrivacidad') as HTMLInputElement)?.checked;
        let hasError = false;

        // Validar todos los campos obligatorios
        const nombres = (form.querySelector('#nombres') as HTMLInputElement)?.value?.trim();
        const apellidos = (form.querySelector('#apellidos') as HTMLInputElement)?.value?.trim();
        const dni = (form.querySelector('#dni') as HTMLInputElement)?.value?.trim();
        const ruc = (form.querySelector('#ruc') as HTMLInputElement)?.value?.trim();
        const email = (form.querySelector('#email') as HTMLInputElement)?.value?.trim();
        const telefono = (form.querySelector('#telefono') as HTMLInputElement)?.value?.trim();
        const banco = (form.querySelector('#banco') as HTMLSelectElement)?.value?.trim();
        const cuenta = (form.querySelector('#cuenta') as HTMLInputElement)?.value?.trim();
        let paisFinal = this.selectedCountry;
        let customCountry = '';

    if (!nombres) { this.errores['nombres'] = 'Este campo es obligatorio.'; hasError = true; }
    else if (nombres.length > 50) { this.errores['nombres'] = 'Máximo 50 caracteres.'; hasError = true; }
    if (!apellidos) { this.errores['apellidos'] = 'Este campo es obligatorio.'; hasError = true; }
    else if (apellidos.length > 50) { this.errores['apellidos'] = 'Máximo 50 caracteres.'; hasError = true; }
    if (!dni) { this.errores['dni'] = 'Este campo es obligatorio.'; hasError = true; }
    else if (dni.length > 8) { this.errores['dni'] = 'Máximo 8 caracteres.'; hasError = true; }
    if (!ruc) { this.errores['ruc'] = 'Este campo es obligatorio.'; hasError = true; }
    else if (ruc.length > 11) { this.errores['ruc'] = 'Máximo 11 caracteres.'; hasError = true; }
    if (!email) { this.errores['email'] = 'Este campo es obligatorio.'; hasError = true; }
    else if (email.length > 60) { this.errores['email'] = 'Máximo 60 caracteres.'; hasError = true; }
    if (!telefono) { this.errores['telefono'] = 'Este campo es obligatorio.'; hasError = true; }
    else if (telefono.length > 15) { this.errores['telefono'] = 'Máximo 15 caracteres.'; hasError = true; }
    if (!banco) { this.errores['banco'] = 'Este campo es obligatorio.'; hasError = true; }
    else if (banco.length > 30) { this.errores['banco'] = 'Máximo 30 caracteres.'; hasError = true; }
    if (!cuenta) { this.errores['cuenta'] = 'Este campo es obligatorio.'; hasError = true; }
    else if (cuenta.length > 30) { this.errores['cuenta'] = 'Máximo 30 caracteres.'; hasError = true; }
        if (!paisFinal) { this.errores['pais'] = 'Selecciona un país.'; hasError = true; }
        if (paisFinal === 'Otro') {
            const customCountryInput = form.querySelector('#customCountry') as HTMLInputElement;
            customCountry = customCountryInput?.value?.trim();
            if (!customCountry) {
                this.errores['customCountry'] = 'Escribe tu país.'; hasError = true;
            }
            paisFinal = customCountry;
        }
        if (!aceptaTerminos) { this.errores['aceptoTerminos'] = 'Debes aceptar los Términos y Condiciones.'; hasError = true; }
        if (!aceptaPrivacidad) { this.errores['aceptoPrivacidad'] = 'Debes aceptar la Política de Privacidad.'; hasError = true; }

        if (hasError) return;

        // Sanitizar los datos antes de enviarlos
        const preEmbajador: PreEmbajador = {
            nombres: this.sanitizer.sanitize(1, nombres) || '',
            apellidos: this.sanitizer.sanitize(1, apellidos) || '',
            dni: this.sanitizer.sanitize(1, dni) || '',
            ruc: this.sanitizer.sanitize(1, ruc) || '',
            email: this.sanitizer.sanitize(1, email) || '',
            telefono: this.sanitizer.sanitize(1, telefono) || '',
            banco: this.sanitizer.sanitize(1, banco) || '',
            cuenta: this.sanitizer.sanitize(1, cuenta) || '',
            pais: this.sanitizer.sanitize(1, paisFinal) || '',
        };

        this.preEmbajadorService.postPreEmbajador(preEmbajador).subscribe({
            next: (resp) => {
                let mensaje = resp?.data || resp;
                this.modalMensaje = typeof mensaje === 'string' ? mensaje : JSON.stringify(mensaje);
                this.modalTipo = 'success';
                this.showModalMensaje = true;
            },
            error: (err) => {
                let mensaje = err?.error?.data || 'Hubo un error al registrar. Intenta nuevamente.';
                this.modalMensaje = mensaje;
                this.modalTipo = 'error';
                this.showModalMensaje = true;
            }
        });
    }
    
        // Método para cerrar el modal de mensaje
        closeModalMensaje() {
            this.showModalMensaje = false;
        }
}