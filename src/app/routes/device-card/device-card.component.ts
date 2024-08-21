import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-device-card',
  templateUrl: './device-card.component.html',
  styleUrls: ['./device-card.component.css']
})
export class DeviceCardComponent {
  @Input() device!: any;
  @Input() position!: any;
  @Output() close = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }
}
