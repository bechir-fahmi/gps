import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Command } from '../../shared/models/command';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CommandsService {

  constructor(private _http:HttpClient) { }

  DispatchCommand(command:Command){
    return this._http.post(`${environment.API}/commands/send`,command)
  }

}
