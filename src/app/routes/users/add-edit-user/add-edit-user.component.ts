import { Component, EventEmitter, Input, Output } from '@angular/core';
import { User } from '../../../shared/models/user';

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
