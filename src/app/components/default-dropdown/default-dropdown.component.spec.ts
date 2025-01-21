import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DefaultDropdownComponent } from './default-dropdown.component';

describe('DefaultDropdownComponent', () => {
  let component: DefaultDropdownComponent;
  let fixture: ComponentFixture<DefaultDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DefaultDropdownComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DefaultDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
