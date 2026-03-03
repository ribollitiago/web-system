import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DefaultStepComponent } from './default-step.component';

describe('DefaultStepComponent', () => {
  let component: DefaultStepComponent;
  let fixture: ComponentFixture<DefaultStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DefaultStepComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DefaultStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
