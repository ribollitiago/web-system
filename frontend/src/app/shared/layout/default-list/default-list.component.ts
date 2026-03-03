import { Component, EventEmitter, Input, Output, TemplateRef, ContentChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ColumnConfig {
  key: string;
  label: string;
  flex?: string; // Para controlar a largura da coluna no CSS (ex: '0 0 54px' ou '1 1 10%')
  sortable?: boolean;
  sortFn?: (valueA: any, valueB: any, objectA?: any, objectB?: any) => number; // Função de comparação customizada
}

@Component({
  selector: 'app-default-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './default-list.component.html',
  styleUrl: './default-list.component.scss'
})
export class DefaultListComponent implements OnChanges {
  @Input() data: any[] = [];
  @Input() columns: ColumnConfig[] = [];
  @Input() itemsPerPage: number = 10;
  @Input() currentPage: number = 1;
  @Input() selectable: boolean = true;
  @Input() idKey: string = 'id';

  @Output() selectionChange = new EventEmitter<any[]>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() itemsPerPageChange = new EventEmitter<number>();
  @Output() rowClick = new EventEmitter<any>();
  @Output() sortChange = new EventEmitter<{ column: string; direction: 'asc' | 'desc' }>();

  // Template customizado para as linhas, passado pelo componente pai
  @ContentChild('rowTemplate') rowTemplate?: TemplateRef<any>;

  selectedItems: Set<any> = new Set();
  allSelected: boolean = false;
  totalPages: number = 1;

  // Rastreamento de ordenação
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';
  sortedData: any[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['itemsPerPage']) {
      this.applySorting();
      this.updateTotalPages();
      this.updateAllSelectedState();
    }
  }

  // --- Paginação ---
  get visibleData(): any[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.sortedData.slice(start, end);
  }

  updateTotalPages(): void {
    this.totalPages = Math.ceil(this.sortedData.length / this.itemsPerPage) || 1;
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
      this.pageChange.emit(this.currentPage);
    }
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.pageChange.emit(this.currentPage);
    this.itemsPerPageChange.emit(this.itemsPerPage);
    this.updateTotalPages();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.pageChange.emit(this.currentPage);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.pageChange.emit(this.currentPage);
    }
  }

  goToPage(page: number | string): void {
    if (typeof page === 'number' && page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.pageChange.emit(this.currentPage);
    }
  }

  get displayedPages(): (number | string)[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const pages: (number | string)[] = [];

    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    pages.push(1);
    let start = Math.max(2, current - 1);
    let end = Math.min(total - 1, current + 1);

    if (current <= 3) end = 4;
    else if (current >= total - 2) start = total - 3;

    if (start > 2) pages.push('...');
    for (let i = start; i <= end; i++) {
      if (i > 1 && i < total) pages.push(i);
    }
    if (end < total - 1) pages.push('...');
    if (total > 1) pages.push(total);

    return pages;
  }

  // --- Seleção ---
  toggleSelectAll(event: MouseEvent): void {
    event.stopPropagation();
    const visibleIds = this.visibleData.map(item => item[this.idKey]);
    const isAllVisibleSelected = visibleIds.every(id => this.selectedItems.has(id));

    if (isAllVisibleSelected) {
      visibleIds.forEach(id => this.selectedItems.delete(id));
    } else {
      visibleIds.forEach(id => this.selectedItems.add(id));
    }
    this.emitSelection();
  }

  toggleItemSelection(item: any, event: MouseEvent): void {
    event.stopPropagation();
    const id = item[this.idKey];
    if (this.selectedItems.has(id)) {
      this.selectedItems.delete(id);
    } else {
      this.selectedItems.add(id);
    }
    this.emitSelection();
  }

  onRowClick(item: any): void {
    this.rowClick.emit(item);
  }

  isSelected(item: any): boolean {
    return this.selectedItems.has(item[this.idKey]);
  }

  private updateAllSelectedState(): void {
    const visible = this.visibleData;
    this.allSelected = visible.length > 0 && visible.every(item => this.selectedItems.has(item[this.idKey]));
  }

  private emitSelection(): void {
    this.updateAllSelectedState();
    const selected = this.data.filter(item => this.selectedItems.has(item[this.idKey]));
    this.selectionChange.emit(selected);
  }

  public clearSelection(): void {
    this.selectedItems.clear();
    this.emitSelection();
  }

  // --- Ordenação ---
  sort(columnKey: string): void {
    const previous = this.sortColumn;
    const previousDirection = this.sortDirection;

    // Se clicou na mesma coluna, inverte a direção
    if (this.sortColumn === columnKey) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Se clicou em coluna diferente, começa com 'asc'
      this.sortColumn = columnKey;
      this.sortDirection = 'asc';
    }

    // debug
    if (columnKey === 'situation') {
      console.log('DefaultList.sort -> situação clicada', {
        previous,
        previousDirection,
        newDirection: this.sortDirection
      });
    }

    this.applySorting();
    this.currentPage = 1;
    this.pageChange.emit(this.currentPage);
    this.sortChange.emit({ column: this.sortColumn, direction: this.sortDirection });
  }

  private applySorting(): void {
    if (!this.sortColumn) {
      this.sortedData = [...this.data];
      return;
    }

    const column = this.columns.find(c => c.key === this.sortColumn);
    if (!column) {
      this.sortedData = [...this.data];
      return;
    }

    this.sortedData = [...this.data].sort((a, b) => {
      let comparison = 0;

      // Usa a função customizada se fornecida
      if (column.sortFn) {
        comparison = column.sortFn(a[this.sortColumn!], b[this.sortColumn!], a, b);
      } else {
        // Default: ordenação alfabética/numérica simples
        const aVal = a[this.sortColumn!];
        const bVal = b[this.sortColumn!];

        if (aVal < bVal) comparison = -1;
        if (aVal > bVal) comparison = 1;
      }

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
    this.updateTotalPages();
  }

  isSorted(columnKey: string): boolean {
    return this.sortColumn === columnKey;
  }
}
