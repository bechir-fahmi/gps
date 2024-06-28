import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReplayControlsComponent } from './replay-controls.component';

describe('ReplayControlsComponent', () => {
  let component: ReplayControlsComponent;
  let fixture: ComponentFixture<ReplayControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReplayControlsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReplayControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
