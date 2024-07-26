import { Component } from '@angular/core';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {
  selectedSection: string = 'notifications';

  selectSection(section: string): void {
    this.selectedSection = section;
  }
}
