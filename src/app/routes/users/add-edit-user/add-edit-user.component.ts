import { Component, EventEmitter, Input, Output } from '@angular/core';
import { User } from '../../../shared/models/user';
import { SecureStorageService } from '../../../Services/storage/secure-storage.service';

@Component({
  selector: 'app-add-edit-user',
  templateUrl: './add-edit-user.component.html',
  styleUrl: './add-edit-user.component.css'
})
export class AddEditUserComponent {
  @Input() display: boolean = false;
  @Input() user: User | null = null;
  @Output() onSave = new EventEmitter<User>();
  @Output() onClose = new EventEmitter<void>();
  isAdmin: any;
  isTechnical: any;
  modeEdit:any;
constructor(private securestrorageservice:SecureStorageService){

}

  ngOnInit() {
    this.initializeUserRole();
  }

  initializeUserRole(): void {
    const sessionData = this.securestrorageservice.getDecryptedItem('sessionData');
    if (sessionData) {
      this.isAdmin = sessionData.administrator;
      this.isTechnical = sessionData.attributes.isTechnical;
    }
  }
  getCurrentLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        if (this.user) {
          this.user.latitude = position.coords.latitude;
          this.user.longitude = position.coords.longitude;
        }
      });
    }
  }

  save(): void {
    if (this.user) {
      this.onSave.emit(this.user);
    }
  }

  close(): void {
    this.onClose.emit();
  }
}
