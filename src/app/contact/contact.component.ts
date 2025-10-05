import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent {
  isSubmitting = false;
  isSuccess = false;
  isError = false;

  onSubmit() {
    window.alert('Send message service is not available now, please send on amol.nagare279@gmail.com mail');
  }
  
}