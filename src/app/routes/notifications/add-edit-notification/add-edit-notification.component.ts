import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NotificationPayload } from '../../../shared/models/notification-payload';

@Component({
  selector: 'app-add-edit-notification',
  templateUrl: './add-edit-notification.component.html',
  styleUrls: ['./add-edit-notification.component.css']
})
export class AddEditNotificationComponent {
  @Input() displayDialog: boolean = false;
  @Input() notification: NotificationPayload | null = null;

  @Output() notificationSaved = new EventEmitter<NotificationPayload>();
  @Output() dialogClosed = new EventEmitter<void>();

  notificationTypes: { label: string, value: string }[] = [];
  manualTypes: string[] = [
    'vibration', 'high speed', 'low voltage', 'low battery',
    'turn off', 'turn on', 'entering virtual perimeter',
    'leaving virtual perimeter', 'accident', 'towing'
  ];
  selectedManualType: string | null = null;
  isEditMode: boolean = false;

  ngOnInit(): void {
    this.fetchNotificationTypes();

    if (this.notification) {
      this.isEditMode = !!this.notification.id;
      if (this.isEditMode && this.notification.type === 'alarm') {
        this.selectedManualType = this.notification.attributes['alarm'] || null;
      }
      else{
        this.selectedManualType = null;
        this.notification.attributes['alarm'] = null;
      }
    }
  }

  ngOnChanges(): void {
    if (this.notification) {
      this.isEditMode = !!this.notification.id;
      if (this.isEditMode && this.notification.type === 'alarm') {
        this.selectedManualType = this.notification.attributes['alarm'] || null;
      } else{
        this.selectedManualType = null;
        this.notification.attributes['alarm'] = null;
      }
    }
  }

  fetchNotificationTypes(): void {
    this.notificationTypes = this.manualTypes.map(type => ({ label: type, value: type }));
  }

  saveNotification(): void {
    if (this.notification) {
      this.notification.attributes['alarm'] = this.selectedManualType || '';
      this.notificationSaved.emit(this.notification);
    }
  }

  closeDialog(): void {
    this.dialogClosed.emit();
  }
}
