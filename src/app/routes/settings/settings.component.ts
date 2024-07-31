import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'] // Correct the typo here
})
export class SettingsComponent implements OnInit {
  selectedSection: string = 'notifications'; // Set default section to 'users'
  items: any[] = [];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.initializeMenuItems();
  }

  initializeMenuItems(): void {
    this.items = [

      { label: 'Notifications', icon: 'pi pi-bell', command: () => this.selectSection('notifications') },
      { label: 'User Manager', icon: 'pi pi-user', command: () => this.selectSection('users') },
      { label: 'Geofence', icon: 'pi pi-map', command: () => this.selectSection('geofence') }
    ];
  }

  selectSection(section: string): void {
    console.log('Selected section:', section); // Debugging statement
    this.selectedSection = section;
  }

  goBack(): void {
    this.router.navigate(['../']); // Navigate back one level
  }
}
