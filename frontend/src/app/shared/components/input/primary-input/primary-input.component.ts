import { CommonModule } from '@angular/common';
import { Component, forwardRef, Input, OnInit, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatTooltipModule, MatTooltip } from '@angular/material/tooltip';

type InputTypes = "text" | "email" | "password";

@Component({
  selector: 'app-primary-input',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTooltipModule
  ],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => PrimaryInputComponent),
    multi: true
  }],
  templateUrl: './primary-input.component.html',
  styleUrls: ['./primary-input.component.scss']
})
export class PrimaryInputComponent implements ControlValueAccessor, OnInit {
  @Input() type: InputTypes = "text";
  @Input() placeholder: string = "";
  @Input() label: string = "";
  @Input() inputName: string = "";
  @Input() isPassword: boolean = false;

  // Novas propriedades de restrição
  @Input() maxlength: number | string = "";
  @Input() maskType: 'numbers' | 'alphabet' | 'all' = 'all';


  // Variáveis de controle do Tooltip
  tooltipMessage: string = "";
  private tooltipTimeout: any;

  fieldTextType?: boolean;
  value: string = '';

  onChange: any = () => { }
  onTouched: any = () => { }

  ngOnInit() {
    this.fieldTextType = !this.isPassword;
  }

  onKeyDown(event: KeyboardEvent, tooltip: MatTooltip) {
    const input = event.target as HTMLInputElement;
    const key = event.key;

    const controlKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Control', 'Alt'];
    if (controlKeys.includes(key) || event.ctrlKey || event.metaKey) return;

    let error = "";

    if (this.maxlength && input.value.length >= +this.maxlength) {
      if (input.selectionStart === input.selectionEnd) {
        error = `Limite máximo de ${this.maxlength} caracteres atingido.`;
      }
    }

    if (!error) {
      if (this.maskType === 'numbers' && !/^\d$/.test(key)) {
        error = "Este campo aceita apenas números.";
      } else if (this.maskType === 'alphabet' && !/^[a-zA-ZÀ-ÿ\s]$/.test(key)) {
        error = "Este campo aceita apenas letras.";
      }
    }

    if (error) {
      event.preventDefault();
      this.handleTooltip(tooltip, error);
    }
  }

  onInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let val = input.value;

    if (this.maskType === 'numbers') val = val.replace(/\D/g, '');
    if (this.maskType === 'alphabet') val = val.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');

    if (this.maxlength && val.length > +this.maxlength) {
      val = val.substring(0, +this.maxlength);
    }

    input.value = val;
    this.value = val;
    this.onChange(val);
  }

  private handleTooltip(tooltip: MatTooltip, message: string) {
  this.tooltipMessage = message;
  tooltip.show();

  if (this.tooltipTimeout) clearTimeout(this.tooltipTimeout);

  this.tooltipTimeout = setTimeout(() => {
    tooltip.hide();
    setTimeout(() => {
      this.tooltipMessage = "";
    }, 200);
  }, 2500);
}

  writeValue(value: any): void { this.value = value || ''; }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { }

  toggleFieldTextType() {
    this.fieldTextType = !this.fieldTextType;
  }
}
