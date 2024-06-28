import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-date-range-dialog',
  templateUrl: './date-range-dialog.component.html',
  styleUrls: ['./date-range-dialog.component.css']
})
export class DateRangeDialogComponent {
  fromDate: Date|null;
  toDate: Date|null;

  constructor(
    public dialogRef: MatDialogRef<DateRangeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { fromDate: string, toDate: string }
  ) {
    this.fromDate = data.fromDate ? new Date(data.fromDate) : null;
    this.toDate = data.toDate ? new Date(data.toDate) : null;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onConfirmClick(): void {
    this.dialogRef.close({
      fromDate: this.fromDate ? this.fromDate.toISOString() : '',
      toDate: this.toDate ? this.toDate.toISOString() : ''
    });
  }

  onCalendarClick(event: Event): void {
    event.stopPropagation();
  }
}
