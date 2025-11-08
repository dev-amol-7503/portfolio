import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatrixNotesDashboardComponent } from './matrix-notes-dashboard.component';

describe('MatrixNotesDashboardComponent', () => {
  let component: MatrixNotesDashboardComponent;
  let fixture: ComponentFixture<MatrixNotesDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatrixNotesDashboardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MatrixNotesDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
