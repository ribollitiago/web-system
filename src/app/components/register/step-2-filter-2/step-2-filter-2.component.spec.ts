import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Step2Filter2Component } from './step-2-filter-2.component';

describe('Step2Filter2Component', () => {
  let component: Step2Filter2Component;
  let fixture: ComponentFixture<Step2Filter2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Step2Filter2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Step2Filter2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
