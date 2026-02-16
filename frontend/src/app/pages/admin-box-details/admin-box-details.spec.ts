import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminBoxDetailsComponent } from './admin-box-details';

describe('AdminBoxDetailsComponent', () => {
  let component: AdminBoxDetailsComponent;
  let fixture: ComponentFixture<AdminBoxDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminBoxDetailsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminBoxDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
