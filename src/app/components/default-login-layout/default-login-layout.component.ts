import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-default-login-layout',
  imports: [],
  templateUrl: './default-login-layout.component.html',
  styleUrl: './default-login-layout.component.scss'
})
export class DefaultLoginLayoutComponent {
  @Input() title: string = "";
  @Input() subtitle: string = "";
  @Input() btnText: string = "";
  @Input() txtLink: string = "";

  @Output("submit") onSubmit = new EventEmitter();

  submit() {
    this.onSubmit.emit();
  }
}
