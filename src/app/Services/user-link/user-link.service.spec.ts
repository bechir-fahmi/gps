import { TestBed } from '@angular/core/testing';

import { UserLinkService } from './user-link.service';

describe('UserLinkService', () => {
  let service: UserLinkService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserLinkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
