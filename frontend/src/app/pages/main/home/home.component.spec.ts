import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { HomeComponent } from './home.component';
import { BackendHealthService } from '../../../core/services/backend/backend-health.service';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  const backendHealthServiceMock = {
    checkBackend: () =>
      of({
        online: true,
        checkedAt: new Date().toISOString(),
      }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [{ provide: BackendHealthService, useValue: backendHealthServiceMock }],
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
