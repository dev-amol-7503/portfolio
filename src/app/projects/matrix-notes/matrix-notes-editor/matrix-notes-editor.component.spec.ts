import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatrixNotesEditorComponent } from './matrix-notes-editor.component';

describe('MatrixNotesEditorComponent', () => {
  let component: MatrixNotesEditorComponent;
  let fixture: ComponentFixture<MatrixNotesEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatrixNotesEditorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MatrixNotesEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
