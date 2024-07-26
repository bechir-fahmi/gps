import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NotificationServiceService } from '../../../Services/notifications/notification-service.service';
import { NotificationPayload } from '../../../shared/models/notification-payload';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-add-edit-notification',
  templateUrl: './add-edit-notification.component.html',
  styleUrl: './add-edit-notification.component.css',
  providers: [MessageService],
})
export class AddEditNotificationComponent {
  @Input() displayDialog: boolean = false;
  @Input() notification: NotificationPayload = {
    id: 0,
    attributes: {},
    calendarId: 0,
    always: false,
    type: '',
    commandId: 0,
    notificators: '',
  };
  @Output() notificationSaved = new EventEmitter<void>();
  @Output() dialogClosed = new EventEmitter<void>();

  constructor(
    private notificationService: NotificationServiceService,
    private messageService: MessageService
  ) {}

  saveNotification(): void {
    if (this.notification.id === 0) {
      this.notificationService.createNotification(this.notification).subscribe(
        () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Notification added successfully.'
          });
          this.notificationSaved.emit();
          this.closeDialog();
        },
        (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to add notification.'
          });
        }
      );
    } else {
      this.notificationService.updateNotification(this.notification).subscribe(
        () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Notification updated successfully.'
          });
          this.notificationSaved.emit();
          this.closeDialog();
        },
        (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update notification.'
          });
        }
      );
    }
  }

  closeDialog(): void {
    this.dialogClosed.emit();
  }
}
