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

    /**
   * Constructs a new DateRangeDialogComponent.
   *
   * @param {MatDialogRef<DateRangeDialogComponent>} dialogRef - Reference to the dialog.
   * @param {{ fromDate: string, toDate: string }} data - Object containing fromDate and toDate strings.
   * @return {void} No return value
   */
  constructor(
    public dialogRef: MatDialogRef<DateRangeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { fromDate: string, toDate: string }
  ) {
    this.fromDate = data.fromDate ? new Date(data.fromDate) : null;
    this.toDate = data.toDate ? new Date(data.toDate) : null;
  }

    /**
   * A method that closes the dialog without any further action.
   *
   * @return {void} No return value
   */
  onNoClick(): void {
    this.dialogRef.close();
  }
  /**
   * A method that closes the dialog with selected date range values.
   *
   * @return {void} No return value
   */
  onConfirmClick(): void {
    this.dialogRef.close({
      fromDate: this.fromDate ? this.fromDate.toISOString() : '',
      toDate: this.toDate ? this.toDate.toISOString() : ''
    });
  }
/**
 * Prevents the default behavior of an event and stops its propagation.
 *
 * @param {Event} event - The event object.
 * @return {void} This function does not return a value.
 */
  onCalendarClick(event: Event): void {
    event.stopPropagation();
  }
}
