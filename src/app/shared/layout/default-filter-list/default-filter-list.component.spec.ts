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

  describe('radio option selection', () => {
    beforeEach(() => {
      component.sections = [
        {
          title: 'Test',
          fields: [
            {
              key: 'choice',
              label: 'Choice',
              kind: 'radio' as const,
              options: [
                { label: 'A', value: 'a' },
                { label: 'B', value: 'b' }
              ]
            }
          ]
        }
      ];
      component.model = {};
      fixture.detectChanges();
    });

    it('clicking a radio sets the model', () => {
      const inputs = fixture.nativeElement.querySelectorAll('input[type=radio]');
      inputs[0].click();
      fixture.detectChanges();
      expect(component.model['choice']).toBe('a');
      expect(inputs[0].checked).toBeTrue();
    });

    it('clicking the same radio again clears the model', () => {
      const inputs = fixture.nativeElement.querySelectorAll('input[type=radio]');
      inputs[0].click();
      fixture.detectChanges();
      expect(component.model['choice']).toBe('a');

      inputs[0].click();
      fixture.detectChanges();
      expect(component.model['choice']).toBeNull();
      expect(inputs[0].checked).toBeFalse();
    });
  });
});
