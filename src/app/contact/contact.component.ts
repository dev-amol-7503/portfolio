import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../services/admin.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {
  isSubmitting = false;
  isSuccess = false;
  isError = false;
  personalInfo: any = {};
  isEditMode = false;

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.adminService.portfolioData$.subscribe(data => {
      this.personalInfo = data.personalInfo || {};
    });

    this.adminService.editMode$.subscribe(mode => {
      this.isEditMode = mode;
    });
  }

  onSubmit() {
    window.alert('Send message service is not available now, please send on amol.nagare279@gmail.com mail');
  }

  updatePersonalInfo() {
    if (this.isEditMode) {
      this.adminService.updatePersonalInfo(this.personalInfo);
    }
  }
}