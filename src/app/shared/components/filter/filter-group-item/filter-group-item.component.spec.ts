import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterGroupItemComponent } from './filter-group-item.component';

describe('FilterGroupItemComponent', () => {
  let component: FilterGroupItemComponent;
  let fixture: ComponentFixture<FilterGroupItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterGroupItemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FilterGroupItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('checkbox mode (default)', () => {
    beforeEach(() => {
      component.field = {
        key: 'f',
        label: 'Field',
        kind: 'group',
        options: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' }
        ]
      };
      component.selected = [];
      fixture.detectChanges();
    });

    it('toggles values when checkboxes clicked', () => {
      const inputs = fixture.nativeElement.querySelectorAll('input');
      expect(inputs.length).toBe(2);

      inputs[0].click();
      fixture.detectChanges();
      expect(component.selected).toEqual(['a']);

      inputs[1].click();
      fixture.detectChanges();
      expect(component.selected).toEqual(['a', 'b']);

      inputs[0].click();
      fixture.detectChanges();
      expect(component.selected).toEqual(['b']);
    });
  });

  describe('radio mode', () => {
    beforeEach(() => {
      component.field = {
        key: 'f',
        label: 'Field',
        kind: 'group',
        mode: 'radio',
        options: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' }
        ]
      };
      component.selected = [];
      fixture.detectChanges();
    });

    it('selects one option and deselects previous', () => {
      const inputs = fixture.nativeElement.querySelectorAll('input');
      expect(inputs[0].type).toBe('radio');

      inputs[0].click();
      fixture.detectChanges();
      expect(component.selected).toEqual(['a']);

      inputs[1].click();
      fixture.detectChanges();
      expect(component.selected).toEqual(['b']);
    });

    it('clicking same radio again clears selection', () => {
      const inputs = fixture.nativeElement.querySelectorAll('input');
      inputs[0].click();
      fixture.detectChanges();
      expect(component.selected).toEqual(['a']);

      inputs[0].click();
      fixture.detectChanges();
      expect(component.selected).toEqual([]);
    });
  });

  describe('submenu coordination', () => {
    let comp1: FilterGroupItemComponent;
    let fixture1: ComponentFixture<FilterGroupItemComponent>;
    let comp2: FilterGroupItemComponent;
    let fixture2: ComponentFixture<FilterGroupItemComponent>;

    beforeEach(() => {
      fixture1 = TestBed.createComponent(FilterGroupItemComponent);
      comp1 = fixture1.componentInstance;
      comp1.field = {
        key: 'one',
        label: 'One',
        kind: 'group',
        options: [{ label: 'X', value: 'x' }]
      };
      fixture1.detectChanges();

      fixture2 = TestBed.createComponent(FilterGroupItemComponent);
      comp2 = fixture2.componentInstance;
      comp2.field = {
        key: 'two',
        label: 'Two',
        kind: 'group',
        options: [{ label: 'Y', value: 'y' }]
      };
      fixture2.detectChanges();
    });

    it('opening second closes first', () => {
      comp1.toggle(new MouseEvent('click'));
      expect(comp1.isOpen).toBeTrue();

      comp2.toggle(new MouseEvent('click'));
      expect(comp2.isOpen).toBeTrue();
      expect(comp1.isOpen).toBeFalse();
    });
  });
});
