import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../services/admin.service';
import { ThemeService, ThemeConfig } from '../services/theme.service';

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
  currentTheme!: ThemeConfig;
  isDarkTheme = false;

  constructor(
    private adminService: AdminService,
    private themeService: ThemeService
  ) {}

  ngOnInit() {
    this.adminService.portfolioData$.subscribe(data => {
      this.personalInfo = data.personalInfo || {};
    });

    this.adminService.editMode$.subscribe(mode => {
      this.isEditMode = mode;
    });

    // Subscribe to theme changes
    this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
    });

    this.themeService.isDarkTheme$.subscribe(isDark => {
      this.isDarkTheme = isDark;
    });
  }

  updatePersonalInfo() {
    if (this.isEditMode) {
      this.adminService.updatePersonalInfo(this.personalInfo);
    }
  }
}