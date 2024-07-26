import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {
  selectedSection: string = 'notifications';
  items: any[];
  constructor(private router: Router) {
    this.items = [
      { label: 'Notifications', icon: 'pi pi-bell', command: () => this.selectSection('notifications') },
      { label: 'Account', icon: 'pi pi-user', command: () => this.selectSection('account') },
      { label: 'Geofence', icon: 'pi pi-map', command: () => this.selectSection('geofence') }
    ];
  }
  selectSection(section: string): void {
    this.selectedSection = section;
  }

  goBack(): void {
    this.router.navigate(['../']); // Navigate back one level
  }
}
