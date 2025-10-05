import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-experience',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './experience.component.html',
  styleUrls: ['./experience.component.scss']
})
export class ExperienceComponent {
  experiences = [
    {
      company: 'TATA CONSULTANCY SERVICES LIMITED',
      position: 'Full Stack Developer',
      period: '2021 - Present',
      logo: 'assets/images/tcs-logo.png',
      description: 'Worked on developing and maintaining enterprise-level applications using Angular and Spring Boot.',
      responsibilities: [
        'Developed and maintained the UI of Ignio environment using Angular',
        'Designed and developed RESTful APIs using Spring Boot',
        'Implemented Jenkins-based CI/CD pipelines',
        'Deployed applications in Dockerized environment',
        'Optimized application performance by implementing best practices',
        'Collaborated with cross-functional teams in Agile environment'
      ],
      technologies: ['Angular', 'Spring Boot', 'Docker', 'Jenkins', 'MySQL', 'REST APIs']
    }
  ];
}