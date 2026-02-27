// adicione HostListener para fechar ao clicar fora
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { DefaultFilterOption } from '../default-filter-list/default-filter-list.component';

export interface DefaultFilterGroupField {
  key: string;
  label: string;
  kind: 'group';
  options: DefaultFilterOption[];
}

@Component({
  selector: 'app-filter-group-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filter-group-item.component.html',
  styleUrl: './filter-group-item.component.scss'
})
export class FilterGroupItemComponent {
  @Input({ required: true }) field!: DefaultFilterGroupField;
  @Input() selected: string[] = [];
  @Output() selectedChange = new EventEmitter<string[]>();

  isOpen = false;

  toggle(event: MouseEvent): void {
    event.stopPropagation(); // evita fechar imediatamente pelo HostListener abaixo
    this.isOpen = !this.isOpen;
  }

  // fecha ao clicar em qualquer lugar fora do componente
  @HostListener('document:click')
  onDocumentClick(): void {
    this.isOpen = false;
  }

  isChecked(value: string): boolean {
    return this.selected.includes(value);
  }

  onToggle(value: string, checked: boolean): void {
    const next = checked
      ? Array.from(new Set([...this.selected, value]))
      : this.selected.filter(v => v !== value);
    this.selected = next;
    this.selectedChange.emit(next);
  }
}
