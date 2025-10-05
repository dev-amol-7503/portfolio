import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../services/admin.service';
import { Experience } from '../interfaces/social-post.model';

@Component({
  selector: 'app-experience',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './experience.component.html',
  styleUrls: ['./experience.component.scss']
})
export class ExperienceComponent implements OnInit {
  experiences: Experience[] = [];
  isEditMode = false;

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.adminService.portfolioData$.subscribe(data => {
      this.experiences = data.experiences || [];
    });

    this.adminService.editMode$.subscribe(mode => {
      this.isEditMode = mode;
    });
  }
}