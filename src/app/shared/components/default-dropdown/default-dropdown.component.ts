import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-default-dropdown',
  standalone: true,
  imports: [
    CommonModule,
    // ...other imports...
  ],
  templateUrl: './default-dropdown.component.html',
  styleUrl: './default-dropdown.component.scss'
})
export class DefaultDropdownComponent {
  @Input() options: { label: string, value: any }[] = [];
  @Input() placeholder: string = 'Selecione uma opção';
}
