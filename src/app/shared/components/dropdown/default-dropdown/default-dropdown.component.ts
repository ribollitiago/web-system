import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface DropdownOption {
  label: string;
  value: string;
  permissions?: string[];
}

@Component({
  selector: 'app-default-dropdown',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './default-dropdown.component.html',
  styleUrl: './default-dropdown.component.scss'
})
export class DefaultDropdownComponent {
  @Input() options: DropdownOption[] = [];
  @Input() placeholder: string = 'Selecione uma opção';
  @Output() optionSelected = new EventEmitter<DropdownOption>();
  @Input() disabled = false;

  selectedValue: any = '';
  selectedLabel: string = '';
  dropdownOpen = false;

  get hasValue(): boolean {
    return this.selectedValue !== '' && this.selectedValue !== null && this.selectedValue !== undefined;
  }

  toggleDropdown() {
    if (this.disabled) return;
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectOption(opt: DropdownOption) {
    this.optionSelected.emit(opt);
    this.selectedValue = '';
    this.selectedLabel = '';
    this.dropdownOpen = false;
  }

  constructor() {
    document.addEventListener('click', (event: any) => {
      if (!event.target.closest('.custom-dropdown')) {
        this.dropdownOpen = false;
      }
    });
  }
}
