import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Step2Filter3Component } from './step-2-filter-3.component';

describe('Step2Filter3Component', () => {
  let component: Step2Filter3Component;
  let fixture: ComponentFixture<Step2Filter3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Step2Filter3Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Step2Filter3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
