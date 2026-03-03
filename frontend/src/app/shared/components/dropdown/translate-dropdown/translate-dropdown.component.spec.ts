import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslateDropdownComponent } from './translate-dropdown.component';

describe('TranslateDropdownComponent', () => {
  let component: TranslateDropdownComponent;
  let fixture: ComponentFixture<TranslateDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranslateDropdownComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TranslateDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
