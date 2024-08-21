import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { catchError, Observable, throwError } from 'rxjs';
import { NotificationPayload } from '../../shared/models/notification-payload';

@Injectable({
  providedIn: 'root'
})
export class NotificationServiceService {
  getNotificationTypes() {
    return this._http.get<NotificationPayload[]>(`${environment.API}/api/notifications/types`)
      .pipe(
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  constructor(private _http: HttpClient) { }

  getNotifications(all?: boolean, userId?: number, deviceId?: number, groupId?: number, refresh?: boolean): Observable<NotificationPayload[]> {
    let params = new HttpParams();

    if (all !== undefined) {
      params = params.set('all', all.toString());
    }
    if (userId !== undefined) {
      params = params.set('userId', userId.toString());
    }
    if (deviceId !== undefined) {
      params = params.set('deviceId', deviceId.toString());
    }
    if (groupId !== undefined) {
      params = params.set('groupId', groupId.toString());
    }
    if (refresh !== undefined) {
      params = params.set('refresh', refresh.toString());
    }

    return this._http.get<NotificationPayload[]>(`${environment.API}/api/notifications`, { params })
      .pipe(
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  createNotification(notification: NotificationPayload): Observable<Notification> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    return this._http.post<Notification>(`${environment.API}/api/notifications`, notification, { headers })
      .pipe(
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  updateNotification(notification: NotificationPayload): Observable<Notification> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    return this._http.put<Notification>(`${environment.API}/api/notifications/${notification.id}`, notification, { headers })
      .pipe(
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  deleteNotification(notificationId: number): Observable<void> {
    return this._http.delete<void>(`${environment.API}/api/notifications/${notificationId}`)
      .pipe(
        catchError(error => {
          return throwError(() => error);
        })
      );
  }
}
