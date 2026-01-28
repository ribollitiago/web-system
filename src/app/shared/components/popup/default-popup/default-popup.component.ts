import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { DefaultButtonComponent } from "../../button/default-button/default-button.component";

@Component({
  selector: 'app-default-popup',
  imports: [DefaultButtonComponent],
  templateUrl: './default-popup.component.html',
  styleUrl: './default-popup.component.scss'
})
export class DefaultPopupComponent {
  //Entradas
  //Textos padroes
  @Input({ required: true }) title!: string;
  @Input({ required: true }) description!: string;

  //Botoes
  @Input({ required: true }) buttonLeftTitle!: string;
  @Input({ required: true }) buttonRightTitle!: string;
  @Input() buttonLeftColor!: string;
  @Input() buttonRightColor!: string;

  //SAIDAS
  // Evento do botão esquerdo (Ação principal/Submit)
  @Output() confirmAction = new EventEmitter<void>();

  // Evento do botão direito (Fechar/Cancelar)
  @Output() closeDialog = new EventEmitter<void>();

  isVisible = signal(false);

  public open() {
    this.isVisible.set(true);
  }

  public close() {
    this.isVisible.set(false);
  }

  handleConfirm() {
    this.confirmAction.emit();
    this.close();
  }

  handleClose() {
    this.closeDialog.emit();
    this.close();

  }
}
