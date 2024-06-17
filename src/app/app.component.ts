import { Component } from '@angular/core';
import { ServerService } from './Services/server/server.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'amena';
constructor(private server:ServerService) { }
  ngOnInit() {
    console.log('App component initialized');
    this.server.server().subscribe((res)=>{console.log(res)})
  }
}
