import { Component } from '@angular/core';
import { MessageService } from 'primeng/api';
import { GeofenceService } from '../../Services/geofence/geofence.service';
import { Geofence } from '../../shared/models/geofence';

@Component({
  selector: 'app-geofence',
  templateUrl: './geofence.component.html',
  styleUrls: ['./geofence.component.css'],
  providers: [MessageService],
})
export class GeofenceComponent {
  geofences: Geofence[] = [];
  selectedGeofence: Geofence | null = null;
  displayMapDialog: boolean = false;
  mapDialogMode: 'view' | 'edit' = 'edit';
  loading: boolean = true;

  constructor(
    private geofenceService: GeofenceService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadGeofences();
  }

  loadGeofences(): void {
    this.geofenceService.getGeofences().subscribe(
      (data: Geofence[]) => {
        this.geofences = data;
        this.loading = false;
      },
      (error) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load geofences.',
        });
      }
    );
  }

  showMapDialog(geofence: Geofence | null, mode: 'view' | 'edit'): void {
    this.selectedGeofence = geofence ? { ...geofence } : { id: 0, name: '', description: '', area: '', calendarId: 0, attributes: {} };
    this.mapDialogMode = mode;
    this.displayMapDialog = true;
  }

  onGeofenceSaved(geofence: Geofence): void {
    if (geofence.id === 0) {
      this.geofenceService.createGeofence(geofence).subscribe(
        (newGeofence) => {
          this.geofences.push(newGeofence);
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Geofence added.',
          });
        },
        (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to add geofence.',
          });
        }
      );
    } else {
      this.geofenceService.updateGeofence(geofence.id, geofence).subscribe(
        (updatedGeofence) => {
          const index = this.geofences.findIndex(g => g.id === updatedGeofence.id);
          this.geofences[index] = updatedGeofence;
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Geofence updated.',
          });
        },
        (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update geofence.',
          });
        }
      );
    }
    this.displayMapDialog = false;
  }

  deleteGeofence(id: number): void {
    this.geofenceService.deleteGeofence(id).subscribe(
      () => {
        this.geofences = this.geofences.filter(g => g.id !== id);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Geofence deleted.',
        });
      },
      (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to delete geofence.',
        });
      }
    );
  }

  onDialogClosed(): void {
    this.displayMapDialog = false;
  }
}
