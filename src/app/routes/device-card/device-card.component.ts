import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-device-card',
  templateUrl: './device-card.component.html',
  styleUrls: ['./device-card.component.css']
})
export class DeviceCardComponent {
  // @Input() device: any;
  // @Output() button1Click = new EventEmitter<void>();
  // @Output() button2Click = new EventEmitter<void>();
  // @Output() button3Click = new EventEmitter<void>();

  // onButton1Click() {
  //   console.log("device=============",this.device);

  //   this.button1Click.emit();
  // }

  // onButton2Click() {
  //   this.button2Click.emit();
  // }

  // onButton3Click() {
  //   this.button3Click.emit();
  // }
  @Input() device!: any;
  @Input() position!: any;
  @Output() close = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }
}
