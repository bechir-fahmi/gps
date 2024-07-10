import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Command } from '../../shared/models/command';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CommandsService {

  constructor(private _http:HttpClient) { }
/**
 * Dispatches a command to the API.
 *
 * @param {Command} command - The command to be dispatched.
 * @return {Observable<any>} An observable that emits the response from the API.
 */
  DispatchCommand(command:Command){
    return this._http.post(`${environment.API}/api/commands/send`,command)
  }

}
