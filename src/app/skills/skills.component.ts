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
  filteredSkills: Skill[] = [];
  activeCategory: string = 'all';
  isEditMode = false;

  skillCategories = [
    { 
      name: 'frontend', 
      displayName: 'Frontend',
      icon: 'fas fa-laptop-code',
      description: 'Building responsive and interactive user interfaces'
    },
    { 
      name: 'backend', 
      displayName: 'Backend',
      icon: 'fas fa-server',
      description: 'Developing robust server-side applications and APIs'
    },
    { 
      name: 'database', 
      displayName: 'Database',
      icon: 'fas fa-database',
      description: 'Designing and managing efficient data storage solutions'
    },
    { 
      name: 'devops', 
      displayName: 'DevOps & Tools',
      icon: 'fas fa-tools',
      description: 'Streamlining development and deployment processes'
    }
  ];

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadSkills();
    
    this.adminService.editMode$.subscribe(mode => {
      this.isEditMode = mode;
    });
  }

  private loadSkills() {
    this.adminService.portfolioData$.subscribe(data => {
      if (data.skills && data.skills.length > 0) {
        this.skills = data.skills;
        this.filterSkills('all');
      } else {
        // Fallback to default skills if none in service
        this.initializeDefaultSkills();
      }
    });
  }

  private initializeDefaultSkills() {
    this.skills = [
      // Frontend Skills
      { id: 1, name: 'HTML/CSS', level: 90, color: '#E44D26', category: 'frontend' },
      { id: 2, name: 'JavaScript', level: 85, color: '#F7DF1E', category: 'frontend' },
      { id: 3, name: 'TypeScript', level: 88, color: '#3178C6', category: 'frontend' },
      { id: 4, name: 'Angular', level: 87, color: '#DD0031', category: 'frontend' },
      { id: 5, name: 'Bootstrap', level: 82, color: '#7952B3', category: 'frontend' },
      
      // Backend Skills
      { id: 6, name: 'Java', level: 88, color: '#ED8B00', category: 'backend' },
      { id: 7, name: 'Spring Boot', level: 86, color: '#6DB33F', category: 'backend' },
      { id: 8, name: 'Spring Framework', level: 85, color: '#6DB33F', category: 'backend' },
      { id: 9, name: 'Hibernate', level: 83, color: '#59666C', category: 'backend' },
      { id: 10, name: 'Spring Data JPA', level: 84, color: '#6DB33F', category: 'backend' },
      { id: 11, name: 'Microservices', level: 80, color: '#1890FF', category: 'backend' },
      { id: 12, name: 'RESTful APIs', level: 90, color: '#FF6B6B', category: 'backend' },
      
      // Database Skills
      { id: 13, name: 'PostgreSQL', level: 82, color: '#336791', category: 'database' },
      { id: 14, name: 'MySQL', level: 80, color: '#4479A1', category: 'database' },
      
      // DevOps & Tools
      { id: 15, name: 'Docker', level: 78, color: '#2496ED', category: 'devops' },
      { id: 16, name: 'Jenkins', level: 75, color: '#D24939', category: 'devops' },
      { id: 17, name: 'Git/GitHub', level: 88, color: '#F05032', category: 'devops' },
      { id: 18, name: 'AWS DevOps', level: 70, color: '#FF9900', category: 'devops' },
      { id: 19, name: 'Maven', level: 85, color: '#C71A36', category: 'devops' }
    ];
    this.filterSkills('all');
  }

  filterSkills(category: string) {
    this.activeCategory = category;
    if (category === 'all') {
      this.filteredSkills = this.skills;
    } else {
      this.filteredSkills = this.skills.filter(skill => 
        skill.category.toLowerCase() === category.toLowerCase()
      );
    }
  }

  getSkillsByCategory(category: string): Skill[] {
    return this.skills.filter(skill => 
      skill.category.toLowerCase() === category.toLowerCase()
    );
  }

  getCategoryDisplayName(categoryName: string): string {
    const category = this.skillCategories.find(cat => cat.name === categoryName);
    return category ? category.displayName : categoryName;
  }

  // Edit mode methods
  onSkillLevelChange(skill: Skill, event: any) {
    if (this.isEditMode) {
      const updatedSkill = { ...skill, level: +event.target.value };
      this.adminService.updateSkill(updatedSkill);
    }
  }

  onSkillNameChange(skill: Skill, event: any) {
    if (this.isEditMode) {
      const updatedSkill = { ...skill, name: event.target.value };
      this.adminService.updateSkill(updatedSkill);
    }
  }

  addNewSkill() {
    if (this.isEditMode) {
      const newSkill: Skill = {
        name: 'New Skill',
        level: 50,
        color: '#6B7280',
        category: 'frontend'
      };
      this.adminService.addSkill(newSkill);
    }
  }

  deleteSkill(skill: Skill) {
    if (this.isEditMode && skill.id) {
      this.adminService.deleteSkill(skill.id);
    }
  }

  // Add this method to your SkillsComponent class
getSkillIcon(skillName: string): string {
  const iconMap: {[key: string]: string} = {
    // Frontend
    'HTML/CSS': 'fab fa-html5',
    'JavaScript': 'fab fa-js-square',
    'TypeScript': 'fab fa-js-square',
    'Angular': 'fab fa-angular',
    'Bootstrap': 'fab fa-bootstrap',
    
    // Backend
    'Java': 'fab fa-java',
    'Spring Boot': 'fas fa-leaf',
    'Spring Framework': 'fas fa-leaf',
    'Hibernate': 'fas fa-database',
    'Spring Data JPA': 'fas fa-database',
    'Microservices': 'fas fa-cubes',
    'RESTful APIs': 'fas fa-code',
    
    // Database
    'PostgreSQL': 'fas fa-database',
    'MySQL': 'fas fa-database',
    
    // DevOps & Tools
    'Docker': 'fab fa-docker',
    'Jenkins': 'fas fa-tools',
    'Git/GitHub': 'fab fa-github',
    'AWS DevOps': 'fab fa-aws',
    'Maven': 'fas fa-tools'
  };
  
  return iconMap[skillName] || 'fas fa-code';
}
}