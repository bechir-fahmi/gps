import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { DeviceService } from '../../../Services/device/device.service';
import { Device } from '../../../shared/models/device';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-add-edit-device',
  templateUrl: './add-edit-device.component.html',
  styleUrls: ['./add-edit-device.component.css'],
  providers: [MessageService]
})
export class AddEditDeviceComponent implements OnInit {
  @Input() display: boolean = false;
  @Input() device: Device | null = null;
  @Output() onSave = new EventEmitter<Device>();
  @Output() onClose = new EventEmitter<void>();

  isEditMode: boolean = false;

  constructor(private deviceService: DeviceService,private messageService: MessageService) {}

  ngOnChanges(): void {
    this.isEditMode = !!this.device?.id;
    if (!this.device) {
      this.device = {
        id: 0,
        name: '',
        uniqueId: '',
        status: '',
        disabled: false,
        lastUpdate: '',
        positionId: 0,
        groupId: 0,
        phone: '',
        model: '',
        contact: '',
        category: '',
        attributes: {}
      };
    }
  }
  ngOnInit(): void {
    // if (!this.device) {
    //   this.device = {
    //     id: 0,
    //     name: '',
    //     uniqueId: '',
    //     status: '',
    //     disabled: false,
    //     lastUpdate: '',
    //     positionId: 0,
    //     groupId: 0,
    //     phone: '',
    //     model: '',
    //     contact: '',
    //     category: '',
    //     attributes: {}
    //   };
    // }

    // this.isEditMode = !!this.device.id;
  }

  saveDevice(): void {
   if(this.device){
    this.onSave.emit(this.device);
   }
  }

  close(): void {
    this.onClose.emit();
  }
}
