import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../services/admin.service';

interface Experience {
  company: string;
  position: string;
  period: string;
  description: string;
  responsibilities: string[];
  technologies: string[];
  logo?: string;
}

@Component({
  selector: 'app-experience',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './experience.component.html',
  styleUrls: ['./experience.component.scss']
})
export class ExperienceComponent implements OnInit, AfterViewInit {
  @ViewChild('progressBar') progressBar!: ElementRef;
  
  experiences: Experience[] = [];
  isEditMode = false;
  activeExperience: number = 0;

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    // Initialize with static data from resume
    this.experiences = [
      {
        company: 'Tata Consultancy Services',
        position: 'Full Stack Developer',
        period: 'Dec 2021 - Present',
        description: 'Full Stack Developer working on enterprise-scale applications and AI products',
        responsibilities: [
          'Developed and maintained user-centric interfaces for ignio ERPOps using Angular',
          'Engineered and optimized RESTful APIs using Spring Boot',
          'Improved application performance by implementing lazy loading and optimizing API calls',
          'Used Docker to containerize services for deployment consistency',
          'Collaborated within an Agile team environment'
        ],
        technologies: ['Angular', 'Spring Boot', 'Java', 'Docker', 'PostgreSQL', 'Jenkins', 'TypeScript', 'Hibernate']
      },
      {
        company: 'Insight Success',
        position: 'Intern',
        period: 'May 2021 – Dec 2021',
        description: 'Backend development internship focusing on Java and Spring technologies',
        responsibilities: [
          'Developed robust backend functionality using Core Java',
          'Supported development of RESTful web services with Spring Boot',
          'Gained hands-on experience with data persistence technologies'
        ],
        technologies: ['Core Java', 'Spring Boot', 'JPA/Hibernate', 'SQL', 'REST APIs']
      }
    ];

    this.adminService.editMode$.subscribe(mode => {
      this.isEditMode = mode;
    });
  }

  ngAfterViewInit() {
    // Animate progress bar
    setTimeout(() => {
      if (this.progressBar) {
        this.progressBar.nativeElement.style.height = '100%';
      }
    }, 500);
  }

  toggleExperience(index: number) {
    this.activeExperience = index;
  }

  calculateDuration(period: string): string {
    try {
      const [startStr, endStr] = period.split(' - ');
      const startDate = new Date(startStr);
      const endDate = endStr.toLowerCase() === 'present' ? new Date() : new Date(endStr);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return 'Present';
      }
      
      const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                    (endDate.getMonth() - startDate.getMonth());
      
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      
      if (years === 0) {
        return `${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
      } else if (remainingMonths === 0) {
        return `${years} ${years === 1 ? 'year' : 'years'}`;
      } else {
        return `${years} ${years === 1 ? 'year' : 'years'} ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
      }
    } catch (error) {
      return 'Present';
    }
  }
}