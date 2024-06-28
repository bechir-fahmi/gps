import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-replay-controls',
  templateUrl: './replay-controls.component.html',
  styleUrls: ['./replay-controls.component.css']
})
export class ReplayControlsComponent {
  @Output() play = new EventEmitter<void>();
  @Output() stop = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
  isPlaying = false;

  playReplay() {
    this.isPlaying = !this.isPlaying;
    this.play.emit();
  }

  stopReplay() {
    this.isPlaying = false;
    this.stop.emit();
  }

  closeReplay() {
    this.close.emit();
  }
}
