import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface Project {
  id: number;
  title: string;
  description: string;
  technologies: string[];
  imageUrl: string;
  link?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private projectsUrl = 'assets/data/projects.json';

  constructor(private http: HttpClient) { }

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(this.projectsUrl).pipe(
      catchError(() => {
        // Return fallback data if the request fails
        return of([
          {
            id: 1,
            title: 'Ignio Environment UI',
            description: 'Developed and maintained the UI of Ignio environment using Angular',
            technologies: ['Angular', 'TypeScript', 'Bootstrap'],
            imageUrl: 'assets/images/project1.jpg'
          },
          {
            id: 2,
            title: 'RESTful APIs',
            description: 'Designed and developed RESTful APIs using Spring Boot',
            technologies: ['Java', 'Spring Boot', 'REST'],
            imageUrl: 'assets/images/project2.jpg'
          }
        ]);
      })
    );
  }
}