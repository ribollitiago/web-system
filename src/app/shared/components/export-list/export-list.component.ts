import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, ElementRef, HostListener } from '@angular/core';

@Component({
  selector: 'app-export-list',
  imports: [CommonModule],
  templateUrl: './export-list.component.html',
  styleUrl: './export-list.component.scss'
})
export class ExportListComponent {
  @Input() isOpen = false;
  @Output() closed = new EventEmitter<void>();

  constructor(private elementRef: ElementRef) {}

  /**
   * Listen for clicks anywhere in the document. If the popup is open and the
   * click happened outside of this component, emit the `closed` event so the
   * parent can update its state.
   */
  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent): void {
    if (!this.isOpen) {
      return;
    }

    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.closed.emit();
    }
  }
}
