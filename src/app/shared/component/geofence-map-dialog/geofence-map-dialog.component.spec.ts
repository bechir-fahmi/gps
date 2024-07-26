import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeofenceMapDialogComponent } from './geofence-map-dialog.component';

describe('GeofenceMapDialogComponent', () => {
  let component: GeofenceMapDialogComponent;
  let fixture: ComponentFixture<GeofenceMapDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GeofenceMapDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GeofenceMapDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
