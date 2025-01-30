import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, forwardRef, Input, OnInit, Output, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { PrimaryInputComponent } from '../primary-input/primary-input.component';

type InputTypes = "text" | "email" | "password";

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => PrimaryInputComponent),
    multi: true
  }],
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.scss'
})
export class SearchInputComponent {
  @Input() type: InputTypes = "text";
  @Input() placeholder: string = "";
  @Input() label: string = "";
  @Input() inputName: string = "";
  @Input() isPassword: boolean = false;
  @Input() isCollapsed = false;
  @Output() iconClick = new EventEmitter<void>();
  @Output() focus = new EventEmitter<void>();
  @Output() blur = new EventEmitter<void>();
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  fieldTextType?: boolean;

  value: string = '';
  onChange: any = () => { }
  onTouched: any = () => { }

  ngOnInit() {
    // Inicializa o tipo do campo com base em isPassword
    this.fieldTextType = !this.isPassword;
  }

  onInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.onChange(value);
  }

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void { }

  toggleFieldTextType() {
    this.fieldTextType = !this.fieldTextType;
  }

  handleIconClick() {
    this.iconClick.emit();

    // Focus input after sidebar animation completes
    if (!this.isCollapsed) {
      setTimeout(() => this.searchInput.nativeElement.focus(), 50);
    }
  }

  public focusInput() {
    this.searchInput.nativeElement.focus();
  }
}
