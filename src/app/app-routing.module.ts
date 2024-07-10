import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MapComponent } from './routes/map/map.component';
import { DeviceListComponent } from './routes/device-list/device-list.component';
import { LoginComponent } from './routes/login/login.component';
import { DeviceCardComponent } from './routes/device-card/device-card.component';
import { authGuard } from './core/authGuard/auth.guard';
const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'map', component: MapComponent, canActivate: [authGuard] },
  { path: 'device-list', component: DeviceListComponent, canActivate: [authGuard] },
  { path: 'device-card', component: DeviceCardComponent, canActivate: [authGuard] },
  { path: '', redirectTo: '/map', pathMatch: 'full' }, // Redirect to /map by default
  { path: '**', redirectTo: '/map' } // Redirect unknown routes to /map
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
