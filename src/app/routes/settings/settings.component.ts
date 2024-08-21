import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SecureStorageService } from '../../Services/storage/secure-storage.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'] // Correct the typo here
})
export class SettingsComponent implements OnInit {

  selectedSection: string='' ; // Set default section to 'users'
  items: any[] = [];
  isAdmin: boolean = false;
  isTechnical: boolean = false;
  constructor(private router: Router, private secureStorageService: SecureStorageService) { }

  ngOnInit(): void {
    this.initializeUserRole();
    this.initializeMenuItems();
  }

  initializeUserRole(): void {
    const sessionData = this.secureStorageService.getDecryptedItem('sessionData');
    if (sessionData) {
      this.isAdmin = sessionData.administrator;
      this.isTechnical = sessionData.attributes.isTechnical;
    }
  }
  initializeMenuItems(): void {
      this.selectedSection = this.isAdmin||this.isTechnical?'users':'notifications';

    this.items = [
      { label: 'Notifications', icon: 'pi pi-bell', command: () => this.selectSection('notifications') },
      { label: 'Geofence', icon: 'pi pi-map', command: () => this.selectSection('geofence') },
      { label: 'Devices', icon: 'pi pi-car', command: () => this.selectSection('devices') },
      { label: 'Reporting', icon: 'pi pi-pen-to-square', command: () => this.selectSection('reporting') }
    ];
    if (this.isAdmin) {
      this.items.unshift({ label: 'User Manager', icon: 'pi pi-user', command: () => this.selectSection('users') });
    }
    // if(this.isTechnical||this.isAdmin){
    // this.items.push({label:'Rapporting',icon:'pi pi-pen-to-square',command:()=>this.selectSection('rapporting')})
    // }
  }

  selectSection(section: string): void {
    if (section === 'users' && !this.isAdmin) {
      this.router.navigate(['../']);
    } else {
      this.selectedSection = section;
    }
  }

  goBack(): void {
    this.router.navigate(['../']); // Navigate back one level
  }
  logout() {
    localStorage.clear();
    this.router.navigate(['login']);
  }
}
