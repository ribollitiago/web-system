import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Group {
  title: string;
  [key: string]: any;
}

@Component({
  selector: 'app-group-chip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './group-chip.component.html',
  styleUrl: './group-chip.component.scss'
})
export class GroupChipComponent {
  @Input() groups: Group[] = [];
  @Input() maxDisplay: number = Infinity;
  @Input() allowExpand: boolean = false; // Define se o clique é permitido

  isExpanded: boolean = false;

  get visibleGroups() {
    // Se estiver expandido, mostra tudo. Caso contrário, respeita o limite.
    if (this.isExpanded) return this.groups;
    return this.groups.slice(0, this.maxDisplay);
  }

  get hiddenCount() {
    return Math.max(0, this.groups.length - this.maxDisplay);
  }

  toggleExpand(event: MouseEvent) {
    if (this.allowExpand) {
      event.stopPropagation();
      this.isExpanded = !this.isExpanded;
    }
  }
}
