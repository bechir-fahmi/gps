import { Injectable, NgZone } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  private socket$: WebSocketSubject<any>;
  private messagesSubject = new Subject<any>();
  messages$ = this.messagesSubject.asObservable();

  constructor(private ngZone: NgZone) {
    const token = localStorage.getItem('token');
    this.socket$ = webSocket(`${environment.API}/api/socket?token=${token}`);

    this.socket$.subscribe(
      message => {
        this.ngZone.run(() => {
          this.messagesSubject.next(message);
        });
      },
      err => console.error('WebSocket error:', err),
      () => console.warn('WebSocket connection closed')
    );
  }
}
