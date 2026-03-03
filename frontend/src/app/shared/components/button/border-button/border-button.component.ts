import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-border-button',
  imports: [],
  templateUrl: './border-button.component.html',
  styleUrl: './border-button.component.scss'
})
export class BorderButtonComponent {
    @Input({ required: true }) label!: string;

    @Input() type: 'button' | 'submit' | 'reset' = 'button';



    @Output() action = new EventEmitter<void>();

    handleClick() {
      this.action.emit();
    }
}
