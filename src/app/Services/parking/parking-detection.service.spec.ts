import { TestBed } from '@angular/core/testing';

import { ParkingDetectionService } from './parking-detection.service';

describe('ParkingDetectionService', () => {
  let service: ParkingDetectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ParkingDetectionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
