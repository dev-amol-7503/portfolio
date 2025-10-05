import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../services/admin.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit {
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

  updatePersonalInfo() {
    if (this.isEditMode) {
      this.adminService.updatePersonalInfo(this.personalInfo);
    }
  }
}