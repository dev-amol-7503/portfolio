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
import { ThemeService, ThemeName } from './services/theme.service';
import { AdminService } from './services/admin.service';
import { NavItem } from './interfaces/social-post.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, NgbCollapseModule, FontAwesomeModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
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
  showThemeDropdown = false;
  showAdminDropdown = false;

  // Theme related properties
  currentThemeName: ThemeName = 'professional-light';
  availableThemes: { name: ThemeName; label: string; isDark: boolean }[] = [];
  lightThemes: { name: ThemeName; label: string; isDark: boolean }[] = [];
  darkThemes: { name: ThemeName; label: string; isDark: boolean }[] = [];

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
    { label: 'Technical Skills', link: '/skills', icon: 'fas fa-code' },
    { label: 'My Work', link: '/projects', icon: 'fas fa-project-diagram' },
    { label: 'Experience', link: '/experience', icon: 'fas fa-briefcase' },
    { label: 'Contact', link: '/contact', icon: 'fas fa-envelope' },
  ];

  constructor(
    private themeService: ThemeService,
    private adminService: AdminService
  ) {}

  ngOnInit() {
    this.checkScrollPosition();

    // Theme subscriptions
    this.themeService.isDarkTheme$.subscribe((isDark) => {
      this.isDarkTheme = isDark;
    });

    this.themeService.currentThemeName$.subscribe((themeName) => {
      this.currentThemeName = themeName;
    });

    // Get available themes
    this.availableThemes = this.themeService.getAvailableThemes();
    this.lightThemes = this.availableThemes.filter(theme => !theme.isDark);
    this.darkThemes = this.availableThemes.filter(theme => theme.isDark);

    // Admin subscriptions
    this.adminService.isAdmin$.subscribe((isAdmin) => {
      this.isAdmin = isAdmin;
    });

    this.adminService.editMode$.subscribe((editMode) => {
      this.isEditMode = editMode;
    });

    this.checkIfMobile();
  }

  private checkIfMobile() {
    if (typeof window !== 'undefined') {
      this.isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );

      const hasSeenMessage = sessionStorage.getItem(
        'hasSeenDesktopRecommendation'
      );
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    
    // Close theme dropdown when clicking outside
    if (!target.closest('.theme-selector-dropdown')) {
      this.showThemeDropdown = false;
    }
    
    // Close admin dropdown when clicking outside
    if (!target.closest('.admin-dropdown')) {
      this.showAdminDropdown = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscapePress() {
    this.showThemeDropdown = false;
    this.showAdminDropdown = false;
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  // Theme methods
  toggleTheme() {
    this.themeService.toggleTheme();
  }

  toggleThemeDropdown() {
    this.showThemeDropdown = !this.showThemeDropdown;
    // Close other dropdown
    if (this.showThemeDropdown) {
      this.showAdminDropdown = false;
    }
  }

  setTheme(themeName: ThemeName) {
    this.themeService.setThemeByName(themeName);
    this.showThemeDropdown = false;
  }

  getThemeGradient(themeName: ThemeName): string {
    const theme = this.themeService.getThemeByName(themeName);
    return theme?.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  }

  // Admin methods
  toggleAdminDropdown() {
    this.showAdminDropdown = !this.showAdminDropdown;
    // Close other dropdown
    if (this.showAdminDropdown) {
      this.showThemeDropdown = false;
    }
  }

  closeAdminDropdown() {
    this.showAdminDropdown = false;
    this.isMenuCollapsed = true;
  }

  toggleEditMode() {
    this.adminService.toggleEditMode();
    this.showAdminDropdown = false;
  }

  logout() {
    this.adminService.logout();
    this.showAdminDropdown = false;
  }

  closeRecommendation() {
    this.showDesktopRecommendation = false;
  }

  closeMobileMenu() {
    if (window.innerWidth < 992) {
      this.isMenuCollapsed = true;
    }
  }

  toggleMenu() {
  this.isMenuCollapsed = !this.isMenuCollapsed;
  
  // Close dropdowns when opening mobile menu
  if (!this.isMenuCollapsed) {
    this.showThemeDropdown = false;
    this.showAdminDropdown = false;
    
    // Add class to body to prevent scrolling
    document.body.classList.add('mobile-nav-open');
  } else {
    // Remove class from body when closing menu
    document.body.classList.remove('mobile-nav-open');
  }
  
  // Force a reflow to ensure smooth animation
  if (!this.isMenuCollapsed) {
    setTimeout(() => {
      const mobileNav = document.querySelector('.mobile-nav');
      if (mobileNav) {
        mobileNav.classList.add('show');
      }
    }, 10);
  }
}
}