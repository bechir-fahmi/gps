import { Component, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DateRangeDialogComponent } from '../date-range-dialog/date-range-dialog.component';

@Component({
  selector: 'app-replay-controls',
  templateUrl: './replay-controls.component.html',
  styleUrls: ['./replay-controls.component.css']
})
export class ReplayControlsComponent {
  @Output() stop = new EventEmitter<void>();
  @Output() play = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
  @Output() dateRangeChanged = new EventEmitter<{ fromDate: string, toDate: string }>();

  isPlaying = true;

  constructor(private dialog: MatDialog) {}

  stopReplay() {
    this.isPlaying = false;
    this.stop.emit();
  }

  playReplay() {
    this.isPlaying = true;
    this.play.emit();
  }

  closeReplay() {
    this.isPlaying = false;
    this.close.emit();
  }

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
