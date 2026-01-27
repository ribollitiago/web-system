import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SituationUserComponent } from './situation-chip.component';

describe('SituationUserComponent', () => {
  let component: SituationUserComponent;
  let fixture: ComponentFixture<SituationUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SituationUserComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SituationUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
