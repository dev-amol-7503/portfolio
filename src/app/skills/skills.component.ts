import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skills.component.html',
  styleUrls: ['./skills.component.scss']
})
export class SkillsComponent {
  skills = [
    { name: 'Angular', level: 90, color: '#dd0031' },
    { name: 'Java/Spring Boot', level: 85, color: '#5382a1' },
    { name: 'TypeScript', level: 88, color: '#3178c6' },
    { name: 'JavaScript', level: 90, color: '#f7df1e' },
    { name: 'HTML/CSS', level: 95, color: '#e34f26' },
    { name: 'Bootstrap', level: 92, color: '#7952b3' },
    { name: 'RESTful APIs', level: 87, color: '#6bd134' },
    { name: 'Docker', level: 80, color: '#2496ed' },
    { name: 'Jenkins', level: 78, color: '#d33833' },
    { name: 'MySQL/PostgreSQL', level: 85, color: '#4479a1' },
    { name: 'Git', level: 90, color: '#f05032' },
    { name: 'Android Development', level: 75, color: '#3ddc84' }
  ];
}