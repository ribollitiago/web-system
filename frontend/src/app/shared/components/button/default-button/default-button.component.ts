import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-default-button',
  imports: [],
  templateUrl: './default-button.component.html',
  styleUrl: './default-button.component.scss'
})
export class DefaultButtonComponent {
  @Input({ required: true }) label!: string;

  @Input() type: 'button' | 'submit' | 'reset' = 'button';

  @Input() color?: string;

  @Output() action = new EventEmitter<void>();

  handleClick() {
    this.action.emit();
  }

}
