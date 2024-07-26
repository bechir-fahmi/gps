import { Component, OnInit } from '@angular/core';
import { NotificationServiceService } from '../../Services/notifications/notification-service.service';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { NotificationPayload } from '../../shared/models/notification-payload';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
  providers: [ConfirmationService, MessageService],
})
export class NotificationsComponent implements OnInit {
  notifications: NotificationPayload[] = [];
  loading: boolean = true;
  displayDialog: boolean = false;
  totalRecords: number = 0;
  selectedNotification: NotificationPayload = {
    id: 0,
    attributes: {},
    calendarId: 0,
    always: false,
    type: '',
    commandId: 0,
    notificators: '',
  };

  constructor(
    private notificationService: NotificationServiceService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.notificationService.getNotifications().subscribe(
      (data: NotificationPayload[]) => {
        this.notifications = data;
        this.totalRecords = data.length;
        this.loading = false;
      },
      (error) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load notifications.'
        });
      }
    );
  }

  showAddDialog(): void {
    this.selectedNotification = {
      id: 0,
      attributes: {},
      calendarId: 0,
      always: false,
      type: '',
      commandId: 0,
      notificators: '',
    };
    this.displayDialog = true;
  }

  showEditDialog(notification: NotificationPayload): void {
    this.selectedNotification = { ...notification };
    this.displayDialog = true;
  }

  onNotificationSaved(): void {
    this.loadNotifications();
  }

  onDialogClosed(): void {
    this.displayDialog = false;
  }

  deleteNotification(notification: NotificationPayload): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this notification?',
      accept: () => {
        this.notificationService.deleteNotification(notification.id).subscribe(
          () => {
            this.notifications = this.notifications.filter((n) => n.id !== notification.id);
            this.totalRecords = this.notifications.length;
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Notification deleted.'
            });
          },
          (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete notification.'
            });
          }
        );
      }
    });
  }
}
