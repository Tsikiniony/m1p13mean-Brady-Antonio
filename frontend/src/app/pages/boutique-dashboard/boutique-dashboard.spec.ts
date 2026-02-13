import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoutiqueDashboard } from './boutique-dashboard';

describe('BoutiqueDashboard', () => {
  let component: BoutiqueDashboard;
  let fixture: ComponentFixture<BoutiqueDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoutiqueDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoutiqueDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
