// src/app/app.module.ts
import { APP_INITIALIZER, CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { DeviceCardComponent } from './routes/device-card/device-card.component';
import { DragDropModule } from 'primeng/dragdrop';
import { AuthInterceptor } from './auth.interceptor';
import { ToastModule } from 'primeng/toast';
import { ReplayControlsComponent } from './routes/replay-controls/replay-controls.component';
import { CalendarModule } from 'primeng/calendar';

// Angular Material components and modules
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { DateRangeDialogComponent } from './routes/date-range-dialog/date-range-dialog.component';
import { NgxGaugeModule } from 'ngx-gauge';
// import { environment } from '../environments/environment';
// import { provideFirebaseApp, getApp, initializeApp } from '@angular/fire/app';
// import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DropdownModule } from 'primeng/dropdown';
import { OpenlayerMapComponent } from './routes/openlayer-map/openlayer-map.component';
import { SettingsComponent } from './routes/settings/settings.component';
import { NotificationsComponent } from './routes/notifications/notifications.component';
import { TableModule } from 'primeng/table';
import { AddEditNotificationComponent } from './routes/notifications/add-edit-notification/add-edit-notification.component';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { GeofenceComponent } from './routes/geofence/geofence.component';
import { GeofenceMapDialogComponent } from './shared/component/geofence-map-dialog/geofence-map-dialog.component';
import { MenuModule } from 'primeng/menu';
import { UsersComponent } from './routes/users/users.component';
import { AddEditUserComponent } from './routes/users/add-edit-user/add-edit-user.component';
export function initializeGoogleMaps(googleMapsLoader: GoogleMapsLoaderService): () => Promise<void> {
  return (): Promise<void> => googleMapsLoader.load();
}

@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    DeviceListComponent,
    LoginComponent,
    DeviceCardComponent,
    ReplayControlsComponent,
    DateRangeDialogComponent,
    OpenlayerMapComponent,
    SettingsComponent,
    NotificationsComponent,
    AddEditNotificationComponent,
    GeofenceComponent,
    GeofenceMapDialogComponent,
    UsersComponent,
    AddEditUserComponent,
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
    DragDropModule,
    ToastModule,
    CalendarModule,
    FormsModule,
    // Angular Material modules
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    NgxGaugeModule,
    ConfirmDialogModule,
    ProgressSpinnerModule,
    DropdownModule,
    TableModule,
    DialogModule,
    CheckboxModule,
    InputTextModule,
    FloatLabelModule,
    MenuModule
    //error handling module need to be fixed soon :/
    // provideFirebaseApp(() => initializeApp(environment.firebase)),
    // provideFirestore(() => getFirestore())

  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initializeGoogleMaps,
      deps: [GoogleMapsLoaderService],
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  bootstrap: [AppComponent]
})
export class AppModule { }
