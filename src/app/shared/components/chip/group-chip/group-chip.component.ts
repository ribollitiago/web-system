import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-group-chip',
  imports: [],
  templateUrl: './group-chip.component.html',
  styleUrl: './group-chip.component.scss'
})
export class GroupChipComponent {
  @Input() groupName: string = "";
}
