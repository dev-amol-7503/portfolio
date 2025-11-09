import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../services/admin.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  title = 'Full Stack Developer';
  personalInfo: any = {};

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.adminService.portfolioData$.subscribe(data => {
      this.personalInfo = data.personalInfo || {};
    });
  }
}