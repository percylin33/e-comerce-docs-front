import {
  Component, EventEmitter, Input, Output, forwardRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';

import { ManualPaymentMethod } from '../../../@core/interfaces/payments';

export interface PaymentMethodOption {
  value: ManualPaymentMethod;
  label: string;
  icon: string;
  /** Hint corto bajo el label. Aclara cuando se usa. */
  hint?: string;
}

/**
 * Selector visual de metodo de pago (tiles con icono). Implementa
 * ControlValueAccessor para integrarse al `paymentForm` del wizard
 * via formControlName, manteniendo retrocompatibilidad con el FormGroup
 * existente.
 */
@Component({
  selector: 'ngx-payment-method-picker',
  templateUrl: './payment-method-picker.component.html',
  styleUrls: ['./payment-method-picker.component.scss'],
  standalone: true,
  imports: [CommonModule, MatIcon],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PaymentMethodPickerComponent),
      multi: true,
    },
  ],
})
export class PaymentMethodPickerComponent implements ControlValueAccessor {
  @Input() options: PaymentMethodOption[] = [];
  /** Cuando es true, deshabilita todos los tiles (consumido por CVA). */
  @Input() disabled = false;
  /** Mensaje de error a mostrar (alimentado por el padre desde el form). */
  @Input() errorMessage: string | null = null;

  @Output() valueChange = new EventEmitter<ManualPaymentMethod | null>();

  selected: ManualPaymentMethod | null = null;
  touched = false;

  private onChange: (v: ManualPaymentMethod | null) => void = () => {};
  private onTouched: () => void = () => {};

  trackByValue = (_: number, o: PaymentMethodOption) => o.value;

  // ===== ControlValueAccessor =====
  writeValue(value: ManualPaymentMethod | null): void {
    this.selected = value ?? null;
  }

  registerOnChange(fn: (v: ManualPaymentMethod | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // ===== UI =====
  select(option: PaymentMethodOption): void {
    if (this.disabled) return;
    if (this.selected === option.value) return;
    this.selected = option.value;
    this.touched = true;
    this.onTouched();
    this.onChange(this.selected);
    this.valueChange.emit(this.selected);
  }

  isActive(option: PaymentMethodOption): boolean {
    return this.selected === option.value;
  }

  /** Para a11y: keyboard support (Enter / Space). */
  onKey(event: KeyboardEvent, option: PaymentMethodOption): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.select(option);
    }
  }
}
