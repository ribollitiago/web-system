import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DefaultFilterGroupField, FilterGroupItemComponent } from '../filter-group-item/filter-group-item.component';

export type DefaultFilterKind = 'checkbox' | 'radio';

export interface DefaultFilterOption {
  label: string;
  value: string;
}

export interface DefaultFilterFieldBase {
  /** Identificador do campo no model (ex: "status", "device") */
  key: string;
  label: string;
  kind: DefaultFilterKind;
}

export interface DefaultFilterCheckboxField extends DefaultFilterFieldBase {
  kind: 'checkbox';
  options: DefaultFilterOption[];
}

export interface DefaultFilterRadioField extends DefaultFilterFieldBase {
  kind: 'radio';
  options: DefaultFilterOption[];
}

export type DefaultFilterField = DefaultFilterCheckboxField | DefaultFilterRadioField | DefaultFilterGroupField;;

export interface DefaultFilterSection {
  title: string;
  fields: DefaultFilterField[];
}

export interface DefaultFixedDateConfig {
  label: string;
  fromKey: string;
  toKey: string;
  min?: string; // yyyy-mm-dd
  max?: string; // yyyy-mm-dd
}

@Component({
  selector: 'app-default-filter-list',
  standalone: true,
  imports: [CommonModule, FilterGroupItemComponent],
  templateUrl: './default-filter-list.component.html',
  styleUrl: './default-filter-list.component.scss'
})
export class DefaultFilterListComponent {
  /** Controla abrir/fechar pelo pai (recomendado) */
  @Input() isOpen = false;

  /** Configuração modular do filtro (checkbox/radio) */
  @Input({ required: true }) sections: DefaultFilterSection[] = [];

  /** Date fixo no final (sempre renderiza, se informado) */
  @Input() fixedDate?: DefaultFixedDateConfig;

  /**
   * Model com valores dos filtros.
   * checkbox -> string[]
   * radio -> string | null
   * date -> string (yyyy-mm-dd) | null
   */
  @Input() model: Record<string, any> = {};

  /** Two-way binding opcional: [(model)]="filtersModel" */
  @Output() modelChange = new EventEmitter<Record<string, any>>();

  /** Eventos do header */
  @Output() clear = new EventEmitter<void>();
  @Output() apply = new EventEmitter<Record<string, any>>();
  @Output() closed = new EventEmitter<void>();

  onToggleCheckbox(fieldKey: string, optionValue: string, checked: boolean): void {
    const current: string[] = Array.isArray(this.model[fieldKey]) ? [...this.model[fieldKey]] : [];
    const next = checked
      ? Array.from(new Set([...current, optionValue]))
      : current.filter(v => v !== optionValue);

    this.emitModel({ ...this.model, [fieldKey]: next });
  }

  onSelectRadio(fieldKey: string, optionValue: string): void {
    this.emitModel({ ...this.model, [fieldKey]: optionValue });
  }

  onDateChange(key: string, value: string): void {
    this.emitModel({ ...this.model, [key]: value || null });
  }

  isCheckboxChecked(fieldKey: string, optionValue: string): boolean {
    const current: string[] = Array.isArray(this.model[fieldKey]) ? this.model[fieldKey] : [];
    return current.includes(optionValue);
  }

  isRadioSelected(fieldKey: string, optionValue: string): boolean {
    return this.model[fieldKey] === optionValue;
  }

  handleClear(): void {
    this.clear.emit();
  }

  handleApply(): void {
    this.apply.emit(this.model);
    this.isOpen = false;
    this.closed.emit();
  }

  private emitModel(next: Record<string, any>): void {
    this.model = next;
  }

  onGroupChange(key: string, values: string[]): void {
  this.emitModel({ ...this.model, [key]: values });
}
}
