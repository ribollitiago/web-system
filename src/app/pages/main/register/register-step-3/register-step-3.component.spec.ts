import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterStep3Component } from './register-step-3.component';

describe('RegisterStep3Component', () => {
  let component: RegisterStep3Component;
  let fixture: ComponentFixture<RegisterStep3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterStep3Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterStep3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
