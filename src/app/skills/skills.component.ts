import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../services/admin.service';
import { Skill } from '../interfaces/social-post.model';

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skills.component.html',
  styleUrls: ['./skills.component.scss']
})
export class SkillsComponent implements OnInit {
  skills: Skill[] = [];
  isEditMode = false;

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.adminService.portfolioData$.subscribe(data => {
      this.skills = data.skills || [];
    });

    this.adminService.editMode$.subscribe(mode => {
      this.isEditMode = mode;
    });
  }
}