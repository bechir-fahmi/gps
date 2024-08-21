import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditDeviceComponent } from './add-edit-device.component';

describe('AddEditDeviceComponent', () => {
  let component: AddEditDeviceComponent;
  let fixture: ComponentFixture<AddEditDeviceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddEditDeviceComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddEditDeviceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
