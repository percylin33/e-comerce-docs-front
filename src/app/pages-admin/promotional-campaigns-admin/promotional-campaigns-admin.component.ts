import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { NbToastrService } from '@nebular/theme';
import { PromotionsAdminApi } from '../../site/promotions/data/promotions-admin.api';
import {
  PromotionalCampaignAdmin,
  PromotionalCampaignSummaryAdmin,
  PromotionButtonAction,
} from '../../site/promotions/models/home-promotion.types';

@Component({
  selector: 'ngx-promotional-campaigns-admin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './promotional-campaigns-admin.component.html',
  styleUrls: ['./promotional-campaigns-admin.component.scss'],
})
export class PromotionalCampaignsAdminComponent implements OnInit {
  private readonly api = inject(PromotionsAdminApi);
  private readonly fb = inject(FormBuilder);
  private readonly toastr = inject(NbToastrService);

  readonly displayedColumns = ['title', 'placement', 'active', 'window', 'actions'];
  list: PromotionalCampaignSummaryAdmin[] = [];
  loadingList = true;
  showForm = false;
  saving = false;
  editingId: number | null = null;
  /** Índice del slide que está subiendo imagen, o null. */
  uploadingSlideIndex: number | null = null;
  /** Qué campo se sube en ese índice: escritorio o móvil. */
  uploadingSlideTarget: 'desktop' | 'mobile' | null = null;

  readonly buttonActions: PromotionButtonAction[] = ['NONE', 'LINK', 'COPY'];

  readonly form = this.fb.group({
    title: ['', Validators.required],
    code: [''],
    placement: [{ value: 'HOME_POPUP', disabled: true }],
    active: [true],
    priority: [0, [Validators.required]],
    startsAt: ['', Validators.required],
    endsAt: ['', Validators.required],
    showDelaySeconds: [4, [Validators.required, Validators.min(0)]],
    slides: this.fb.array<FormGroup>([]),
  });

  ngOnInit(): void {
    this.loadList();
  }

  get slides(): FormArray<FormGroup> {
    return this.form.get('slides') as FormArray<FormGroup>;
  }

  loadList(): void {
    this.loadingList = true;
    this.api.list().subscribe({
      next: (res) => {
        this.loadingList = false;
        if (res?.result && Array.isArray(res.data)) {
          this.list = res.data;
        } else {
          this.list = [];
        }
      },
      error: () => {
        this.loadingList = false;
        this.toastr.danger('No se pudo cargar el listado', 'Error');
      },
    });
  }

  newCampaign(): void {
    this.editingId = null;
    this.showForm = true;
    this.slides.clear();
    const now = new Date();
    const week = new Date(now.getTime() + 7 * 86400000);
    this.form.reset({
      title: '',
      code: '',
      active: true,
      priority: 0,
      showDelaySeconds: 4,
    });
    this.form.patchValue({
      startsAt: this.toDatetimeLocal(now.toISOString()),
      endsAt: this.toDatetimeLocal(week.toISOString()),
    });
    this.slides.push(this.createSlideGroup());
  }

  edit(id: number): void {
    this.api.get(id).subscribe({
      next: (res) => {
        if (!res?.result || !res.data) {
          this.toastr.danger('Campaña no encontrada', 'Error');
          return;
        }
        const d = res.data as PromotionalCampaignAdmin;
        this.editingId = d.id;
        this.showForm = true;
        this.slides.clear();
        d.slides.forEach((s) => this.slides.push(this.createSlideGroup(s)));
        if (this.slides.length === 0) {
          this.slides.push(this.createSlideGroup());
        }
        this.form.patchValue({
          title: d.title,
          code: d.code ?? '',
          active: d.active,
          priority: d.priority,
          startsAt: this.toDatetimeLocal(d.startsAt),
          endsAt: this.toDatetimeLocal(d.endsAt),
          showDelaySeconds: d.showDelaySeconds,
        });
      },
      error: () => this.toastr.danger('Error al cargar campaña', 'Error'),
    });
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingId = null;
  }

  addSlide(): void {
    this.slides.push(this.createSlideGroup());
  }

  removeSlide(i: number): void {
    if (this.slides.length <= 1) {
      this.toastr.warning('Debe existir al menos un slide', 'Atención');
      return;
    }
    this.slides.removeAt(i);
  }

  moveSlide(i: number, delta: number): void {
    const j = i + delta;
    if (j < 0 || j >= this.slides.length) {
      return;
    }
    const a = this.slides.at(i);
    const b = this.slides.at(j);
    this.slides.setControl(i, b);
    this.slides.setControl(j, a);
  }

  openSlideImagePicker(index: number, target: 'desktop' | 'mobile'): void {
    const el = document.getElementById(this.slideFileInputId(index, target)) as HTMLInputElement | null;
    el?.click();
  }

  onSlideImageSelected(event: Event, index: number, target: 'desktop' | 'mobile'): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      this.toastr.warning('Elige un archivo de imagen', 'Archivo');
      return;
    }
    const group = this.slides.at(index);
    if (!group) {
      return;
    }
    this.uploadingSlideIndex = index;
    this.uploadingSlideTarget = target;
    this.api.uploadSlideImage(file).subscribe({
      next: (res) => {
        this.uploadingSlideIndex = null;
        this.uploadingSlideTarget = null;
        if (res?.result && res.data?.imageUrl) {
          if (target === 'mobile') {
            group.patchValue({ imageUrlMobile: res.data.imageUrl });
          } else {
            group.patchValue({ imageUrl: res.data.imageUrl });
          }
          this.toastr.success('Imagen subida a Firebase', 'Éxito');
        } else {
          this.toastr.danger('No se recibi뿯½ URL de la imagen', 'Error');
        }
      },
      error: (err) => {
        this.uploadingSlideIndex = null;
        this.uploadingSlideTarget = null;
        const msg = err?.error?.data ?? err?.error?.message ?? 'Error al subir';
        this.toastr.danger(typeof msg === 'string' ? msg : 'Error al subir', 'Error');
      },
    });
  }

  slideFileInputId(index: number, target: 'desktop' | 'mobile'): string {
    return `promo-slide-file-${target}-${index}`;
  }

  isSlideUploading(index: number, target: 'desktop' | 'mobile'): boolean {
    return this.uploadingSlideIndex === index && this.uploadingSlideTarget === target;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Revisa los campos obligatorios', 'Formulario');
      return;
    }
    const v = this.form.getRawValue();
    const body = {
      title: v.title,
      code: v.code?.trim() ? v.code.trim() : null,
      placement: 'HOME_POPUP',
      active: !!v.active,
      priority: Number(v.priority),
      startsAt: new Date(v.startsAt as string).toISOString(),
      endsAt: new Date(v.endsAt as string).toISOString(),
      showDelaySeconds: Number(v.showDelaySeconds),
      slides: (v.slides as Record<string, unknown>[]).map((s, index) => ({
        id: s['id'] as number | null,
        sortOrder: index,
        active: !!s['active'],
        imageUrl: String(s['imageUrl'] ?? '').trim(),
        imageUrlMobile: (() => {
          const m = String(s['imageUrlMobile'] ?? '').trim();
          return m ? m : null;
        })(),
        title: (s['title'] as string)?.trim() || null,
        description: (s['description'] as string)?.trim() || null,
        badgeText: (s['badgeText'] as string)?.trim() || null,
        buttonAction: s['buttonAction'] as PromotionButtonAction,
        buttonLabel: (s['buttonLabel'] as string)?.trim() || null,
        linkUrl: (s['linkUrl'] as string)?.trim() || null,
        copyText: (s['copyText'] as string)?.trim() || null,
        openInNewTab: !!s['openInNewTab'],
      })),
    };

    this.saving = true;
    const req =
      this.editingId == null
        ? this.api.create(body)
        : this.api.update(this.editingId, body);

    req.subscribe({
      next: (res) => {
        this.saving = false;
        if (res?.result) {
          this.toastr.success('Cambios guardados', 'Éxito');
          this.showForm = false;
          this.editingId = null;
          this.loadList();
        } else {
          this.toastr.danger((res as { message?: string })?.message ?? 'Error al guardar', 'Error');
        }
      },
      error: (err) => {
        this.saving = false;
        const msg = err?.error?.data ?? err?.error?.message ?? 'Error al guardar';
        this.toastr.danger(typeof msg === 'string' ? msg : 'Error al guardar', 'Error');
      },
    });
  }

  delete(id: number): void {
    if (!confirm('¿Eliminar esta campaña y todos sus slides?')) {
      return;
    }
    this.api.delete(id).subscribe({
      next: (res) => {
        if (res?.result) {
          this.toastr.success('Eliminado', 'Éxito');
          this.loadList();
        } else {
          this.toastr.danger('No se pudo eliminar', 'Error');
        }
      },
      error: () => this.toastr.danger('No se pudo eliminar', 'Error'),
    });
  }

  private createSlideGroup(data?: Partial<{
    id: number | null;
    active: boolean;
    imageUrl: string;
    imageUrlMobile?: string | null;
    title: string | null;
    description: string | null;
    badgeText: string | null;
    buttonAction: PromotionButtonAction;
    buttonLabel: string | null;
    linkUrl: string | null;
    copyText: string | null;
    openInNewTab: boolean;
  }>): FormGroup {
    return this.fb.group({
      id: [data?.id ?? null],
      active: [data?.active ?? true],
      imageUrl: [data?.imageUrl ?? '', Validators.required],
      imageUrlMobile: [data?.imageUrlMobile ?? ''],
      title: [data?.title ?? ''],
      description: [data?.description ?? ''],
      badgeText: [data?.badgeText ?? ''],
      buttonAction: [data?.buttonAction ?? 'NONE'],
      buttonLabel: [data?.buttonLabel ?? ''],
      linkUrl: [data?.linkUrl ?? ''],
      copyText: [data?.copyText ?? ''],
      openInNewTab: [data?.openInNewTab ?? false],
    });
  }

  private toDatetimeLocal(iso: string): string {
    if (!iso) {
      return '';
    }
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return '';
    }
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
