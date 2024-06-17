import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ButtonModule } from 'primeng/button';
import { DataViewModule } from 'primeng/dataview';
import { GoogleMapsModule } from '@angular/google-maps';
import { MapComponent } from './routes/map/map.component';
import { DeviceListComponent } from './routes/device-list/device-list.component';
import { ScrollerModule } from 'primeng/scroller';
import { TooltipModule } from 'primeng/tooltip';
import { GoogleMapsLoaderService } from './Services/google-map-loader/google-maps-loader.service';
import { LoginComponent } from './routes/login/login.component';
import { ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { DeviceCardComponent } from './routes/device-card/device-card.component';
import { DragDropModule } from 'primeng/dragdrop';
import { AuthInterceptor } from './auth.interceptor';
export function initializeApp(googleMapsLoader: GoogleMapsLoaderService): () => Promise<void> {
  return (): Promise<void> => googleMapsLoader.load();
}
@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    DeviceListComponent,
    LoginComponent,
    DeviceCardComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    ButtonModule,
    DataViewModule,
    GoogleMapsModule,
    ScrollerModule,
    TooltipModule,
    ReactiveFormsModule,
    HttpClientModule,
    DragDropModule

  ],
  providers: [ {
    provide: APP_INITIALIZER,
    useFactory: initializeApp,
    deps: [GoogleMapsLoaderService],
    multi: true
  },
  {
    provide: HTTP_INTERCEPTORS,
    useClass: AuthInterceptor,
    multi: true
  }
],

  bootstrap: [AppComponent]
})
export class AppModule { }
