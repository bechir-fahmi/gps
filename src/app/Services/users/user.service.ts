import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../../shared/models/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private readonly apiUrl = `${environment.API}/api/users`;

  constructor(private _http: HttpClient) { }

  getUsers(userId?: string): Observable<User[]> {
    let params = new HttpParams();
    if (userId) {
      params = params.set('userId', userId);
    }
    return this._http.get<User[]>(this.apiUrl, { params });
  }

  createUser(user: User): Observable<User> {
    return this._http.post<User>(this.apiUrl, user);
  }

  updateUser(id: number, user: User): Observable<User> {
    return this._http.put<User>(`${this.apiUrl}/${id}`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this._http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
