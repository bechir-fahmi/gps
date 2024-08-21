import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LinkUserDialogComponent } from './link-user-dialog.component';

describe('LinkUserDialogComponent', () => {
  let component: LinkUserDialogComponent;
  let fixture: ComponentFixture<LinkUserDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LinkUserDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LinkUserDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
