import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DefaultFilterListComponent } from './default-filter-list.component';

describe('DefaultFilterListComponent', () => {
  let component: DefaultFilterListComponent;
  let fixture: ComponentFixture<DefaultFilterListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DefaultFilterListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DefaultFilterListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
