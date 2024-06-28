import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DateRangeDialogComponent } from './date-range-dialog.component';

describe('DateRangeDialogComponent', () => {
  let component: DateRangeDialogComponent;
  let fixture: ComponentFixture<DateRangeDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DateRangeDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DateRangeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
