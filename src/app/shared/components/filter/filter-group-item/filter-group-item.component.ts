// adicione HostListener para fechar ao clicar fora

import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { DefaultFilterOption } from '../default-filter-list/default-filter-list.component';

export type FilterGroupMode = 'checkbox' | 'radio';

export interface DefaultFilterGroupField {
  key: string;
  label: string;
  kind: 'group';
  options: DefaultFilterOption[];

  /**
   * Whether the group allows multiple selections (checkbox) or a single
   * choice (radio). Defaults to 'checkbox' for backwards compatibility.
   */
  mode?: FilterGroupMode;
}

@Component({
  selector: 'app-filter-group-item',
  standalone: true,
  imports: [],
  templateUrl: './filter-group-item.component.html',
  styleUrl: './filter-group-item.component.scss'
})
export class FilterGroupItemComponent {
  @Input({ required: true }) field!: DefaultFilterGroupField;
  @Input() selected: string[] = [];
  @Output() selectedChange = new EventEmitter<string[]>();

  /** computed convenience property, defaulting to checkbox if not provided */
  get mode(): FilterGroupMode {
    return this.field.mode ?? 'checkbox';
  }

  isOpen = false;

  /**
   * Static reference to whichever instance is currently open. Used to close
   * previous submenu when another is toggled open.
   */
  private static currentOpen: FilterGroupItemComponent | null = null;

  toggle(event: MouseEvent): void {
    event.stopPropagation(); // evita fechar imediatamente pelo HostListener abaixo
    const willOpen = !this.isOpen;
    if (willOpen) {
      // close any other open instance
      if (FilterGroupItemComponent.currentOpen && FilterGroupItemComponent.currentOpen !== this) {
        FilterGroupItemComponent.currentOpen.isOpen = false;
      }
      FilterGroupItemComponent.currentOpen = this;
    } else {
      if (FilterGroupItemComponent.currentOpen === this) {
        FilterGroupItemComponent.currentOpen = null;
      }
    }
    this.isOpen = willOpen;
  }

  // fecha ao clicar em qualquer lugar fora do componente
  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.isOpen) {
      this.isOpen = false;
      if (FilterGroupItemComponent.currentOpen === this) {
        FilterGroupItemComponent.currentOpen = null;
      }
    }
  }

  isChecked(value: string): boolean {
    if (this.mode === 'checkbox') {
      return this.selected.includes(value);
    } else {
      // radio mode: selected array contains at most one value
      return this.selected[0] === value;
    }
  }

  onToggle(value: string, checked: boolean): void {
    if (this.mode === 'checkbox') {
      const next = checked
        ? Array.from(new Set([...this.selected, value]))
        : this.selected.filter(v => v !== value);
      this.selected = next;
      this.selectedChange.emit(next);
    } else {
      // radio mode - clicking checkbox input with change event shouldn't
      // really happen since we'll render radios, but keep logic
      const next = checked ? [value] : [];
      this.selected = next;
      this.selectedChange.emit(next);
    }
  }

  onOptionClick(value: string): void {
    if (this.mode === 'radio') {
      const current = this.selected[0];
      const next = current === value ? [] : [value];
      this.selected = next;
      this.selectedChange.emit(next);
    }
  }

  ngOnDestroy(): void {
    if (FilterGroupItemComponent.currentOpen === this) {
      FilterGroupItemComponent.currentOpen = null;
    }
  }
}
