import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-date-range-dialog',
  templateUrl: './date-range-dialog.component.html',
  styleUrls: ['./date-range-dialog.component.css']
})
export class DateRangeDialogComponent {
  fromDate: Date | null;
  toDate: Date | null;
  selectedOption: string | null = null;
  showCustomDateRange = false;
  isConfirmEnabled = false;

  dateOptions = [
    { label: 'Aujourd\'hui', value: 'today' },
    { label: 'Hier', value: 'yesterday' },
    { label: 'Cette semaine', value: 'thisWeek' },
    { label: 'Personnaliser', value: 'custom' }
  ];

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

  onDateOptionChange(event: any): void {
    this.showCustomDateRange = event.value === 'custom';
    if (this.showCustomDateRange) {
      this.isConfirmEnabled = !!this.fromDate && !!this.toDate;
    } else {
      this.setDateRange(event.value);
      this.isConfirmEnabled = true;
    }
  }

  setDateRange(option: string): void {
    const today = new Date();
    if (option === 'today') {
      this.fromDate = new Date(today.setHours(0, 0, 0, 0));
      this.toDate = new Date(today.setHours(23, 59, 59, 999));
    } else if (option === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      this.fromDate = new Date(yesterday.setHours(0, 0, 0, 0));
      this.toDate = new Date(yesterday.setHours(23, 59, 59, 999));
    } else if (option === 'thisWeek') {
      const firstDayOfWeek = new Date(today);
      firstDayOfWeek.setDate(today.getDate() - today.getDay() + 1);
      this.fromDate = new Date(firstDayOfWeek.setHours(0, 0, 0, 0));
      this.toDate = new Date(today.setHours(23, 59, 59, 999));
    }
  }

  onDateChange(): void {
    this.isConfirmEnabled = !!this.fromDate && !!this.toDate;
  }
}
