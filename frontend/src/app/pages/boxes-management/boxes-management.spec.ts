import { TestBed } from '@angular/core/testing';
import { BoxesManagementComponent } from './boxes-management';

describe('BoxesManagementComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoxesManagementComponent]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(BoxesManagementComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
