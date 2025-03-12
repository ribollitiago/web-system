import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StepsFilterComponent } from './steps-filter.component';

describe('StepsFilterComponent', () => {
  let component: StepsFilterComponent;
  let fixture: ComponentFixture<StepsFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepsFilterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StepsFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
