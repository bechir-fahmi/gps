import { Component, Output, EventEmitter, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DateRangeDialogComponent } from '../date-range-dialog/date-range-dialog.component';

@Component({
  selector: 'app-replay-controls',
  templateUrl: './replay-controls.component.html',
  styleUrls: ['./replay-controls.component.css']
})
export class ReplayControlsComponent {

  @Output() dateRangeChanged = new EventEmitter<{ fromDate: string, toDate: string }>();
  @Output() stop = new EventEmitter<void>();
  @Output() play = new EventEmitter<void>();
  @Output() pause = new EventEmitter<void>();
  @Output() forward = new EventEmitter<void>();
  @Output() rewind = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
  @Output() seek = new EventEmitter<number>();
  @Input() maxPosition: number = 0;
  @Input() currentPosition: number = 0;

  constructor(private dialog: MatDialog) {}
  onStop() {
    this.stop.emit();
  }

  onPlay() {
    this.play.emit();
  }

  onPause() {
    this.pause.emit();
  }

  onForward() {
    this.forward.emit();
  }

  onRewind() {
    this.rewind.emit();
  }

  onClose() {
    this.close.emit();
  }

  onSeek() {
    this.seek.emit(this.currentPosition);
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }
  /**
   * Opens the date range dialog, allowing the user to select a date range.
   *
   */
  openDateRangeDialog() {
    const dialogRef = this.dialog.open(DateRangeDialogComponent, {
      width: 'auto',
      data: { fromDate: new Date().toISOString(), toDate: new Date().toISOString() }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.dateRangeChanged.emit(result);
      }
    });
  }
}
