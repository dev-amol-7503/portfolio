import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faDownload, 
  faArrowUp, 
  faSun, 
  faMoon, 
  faDesktop, 
  faEdit, 
  faCog,
  faSignInAlt,
  faSignOutAlt 
} from '@fortawesome/free-solid-svg-icons';
import { faLinkedinIn, faGithub, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { ThemeService } from './services/theme.service';
import { AdminService } from './services/admin.service';
import { NavItem } from './interfaces/social-post.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, NgbCollapseModule, FontAwesomeModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Amol Nagare - Full Stack Developer';
  isMenuCollapsed = true;
  showScrollButton = false;
  currentYear = new Date().getFullYear();
  isDarkTheme = false;
  isMobileDevice = false;
  showDesktopRecommendation = false;
  isAdmin = false;
  isEditMode = false;
  
  // Font Awesome Icons
  faDownload = faDownload;
  faArrowUp = faArrowUp;
  faLinkedin = faLinkedinIn;
  faGithub = faGithub;
  faTwitter = faTwitter;
  faSun = faSun;
  faMoon = faMoon;
  faDesktop = faDesktop;
  faEdit = faEdit;
  faCog = faCog;
  faSignInAlt = faSignInAlt;
  faSignOutAlt = faSignOutAlt;

  navItems: NavItem[] = [
    { label: 'Home', link: '/', icon: 'fas fa-home' },
    { label: 'About', link: '/about', icon: 'fas fa-user' },
    { label: 'Skills', link: '/skills', icon: 'fas fa-code' },
    { label: 'My Work', link: '/projects', icon: 'fas fa-project-diagram' },
    { label: 'Experience', link: '/experience', icon: 'fas fa-briefcase' },
    { label: 'Contact', link: '/contact', icon: 'fas fa-envelope' }
  ];

  constructor(
    private themeService: ThemeService, 
    private adminService: AdminService
  ) {}

  ngOnInit() {
    this.checkScrollPosition();
    
    this.themeService.isDarkTheme$.subscribe(isDark => {
      this.isDarkTheme = isDark;
    });
    
    this.adminService.isAdmin$.subscribe(isAdmin => {
      this.isAdmin = isAdmin;
    });

    this.adminService.editMode$.subscribe(editMode => {
      this.isEditMode = editMode;
    });
    
    this.checkIfMobile();
  }

  private checkIfMobile() {
    if (typeof window !== 'undefined') {
      this.isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      const hasSeenMessage = sessionStorage.getItem('hasSeenDesktopRecommendation');
      if (this.isMobileDevice && !hasSeenMessage) {
        this.showDesktopRecommendation = true;
        sessionStorage.setItem('hasSeenDesktopRecommendation', 'true');
      }
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.checkIfMobile();
  }

  @HostListener('window:scroll')
  checkScrollPosition() {
    this.showScrollButton = window.scrollY > 300;
  }

  toggleMenu() {
    this.isMenuCollapsed = !this.isMenuCollapsed;
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  toggleEditMode() {
    this.adminService.toggleEditMode();
  }

  logout() {
    this.adminService.logout();
  }

  closeRecommendation() {
    this.showDesktopRecommendation = false;
  }
}