import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OnlineClipboardComponent } from './online-clipboard.component';

describe('OnlineClipboardComponent', () => {
  let component: OnlineClipboardComponent;
  let fixture: ComponentFixture<OnlineClipboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnlineClipboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OnlineClipboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
