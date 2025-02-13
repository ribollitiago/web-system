import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Step2Filter1Component } from './step-2-filter-1.component';

describe('Step2Filter1Component', () => {
  let component: Step2Filter1Component;
  let fixture: ComponentFixture<Step2Filter1Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Step2Filter1Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Step2Filter1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
