import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DefaultDropdownComponent } from '../default-dropdown/default-dropdown.component';

@Component({
  selector: 'app-default-login-layout',
  imports: [
    DefaultDropdownComponent
  ],
  templateUrl: './default-login-layout.component.html',
  styleUrl: './default-login-layout.component.scss'
})
export class DefaultLoginLayoutComponent {
  @Input() title: string = "";
  @Input() subtitle: string = "";
  @Input() btnText: string = "";
  @Input() txtLink: string = "";
  @Input() placeholderEmail: string = '';
  @Input() placeholderPassword: string = '';

  @Output("submit") onSubmit = new EventEmitter();

  @Output("navigate") onNavigate = new EventEmitter();

  submit() {
    this.onSubmit.emit();
  }

  navigate() {
    this.onNavigate.emit();
  }
}
