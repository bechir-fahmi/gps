import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OpenlayerMapComponent } from './openlayer-map.component';

describe('OpenlayerMapComponent', () => {
  let component: OpenlayerMapComponent;
  let fixture: ComponentFixture<OpenlayerMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OpenlayerMapComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(OpenlayerMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
