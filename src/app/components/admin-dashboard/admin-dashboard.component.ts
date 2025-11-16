import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AdminService } from '../../services/admin.service';
import { ThemeService, ThemeName } from '../../services/theme.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, RouterOutlet],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  isEditMode = false;
  currentRoute: string = '';
  isDarkTheme = false;
  currentThemeName: ThemeName = 'professional-light';
  availableThemes: { name: ThemeName; label: string; isDark: boolean }[] = [];
  lightThemes: { name: ThemeName; label: string; isDark: boolean }[] = [];
  darkThemes: { name: ThemeName; label: string; isDark: boolean }[] = [];
  showThemeDropdown = false;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private adminService: AdminService,
    private themeService: ThemeService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.adminService.editMode$.subscribe(mode => {
        this.isEditMode = mode;
      })
    );

    // Subscribe to theme changes
    this.subscriptions.push(
      this.themeService.isDarkTheme$.subscribe(isDark => {
        this.isDarkTheme = isDark;
      })
    );

    this.subscriptions.push(
      this.themeService.currentThemeName$.subscribe(themeName => {
        this.currentThemeName = themeName;
      })
    );

    // Get available themes and separate them
    this.availableThemes = this.themeService.getAvailableThemes();
    this.lightThemes = this.availableThemes.filter(theme => !theme.isDark);
    this.darkThemes = this.availableThemes.filter(theme => theme.isDark);

    // Track route changes to update active tab
    this.subscriptions.push(
      this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe((event: any) => {
          this.currentRoute = event.url;
        })
    );

    // Set initial route
    this.currentRoute = this.router.url;
  }

  toggleEditMode() {
    this.adminService.toggleEditMode();
    this.toastr.success(this.isEditMode ? 'Edit mode disabled' : 'Edit mode enabled');
  }

  toggleTheme() {
    this.themeService.toggleTheme();
    const newTheme = this.themeService.getCurrentThemeName();
    this.toastr.info(`Switched to ${newTheme.replace('-', ' ')} theme`);
  }

  setTheme(themeName: ThemeName) {
    this.themeService.setThemeByName(themeName);
    this.showThemeDropdown = false;
    this.toastr.info(`Theme changed to ${themeName.replace('-', ' ')}`);
  }

  toggleThemeDropdown() {
    this.showThemeDropdown = !this.showThemeDropdown;
  }

  getThemeGradient(themeName: ThemeName): string {
    const theme = this.themeService.getThemeByName(themeName);
    return theme?.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  }

  logout() {
    this.adminService.logout();
    this.toastr.info('Logged out successfully');
    this.router.navigate(['/']);
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown')) {
      this.showThemeDropdown = false;
    }
  }

  // Close dropdown on escape key
  @HostListener('document:keydown.escape')
  onEscapePress() {
    this.showThemeDropdown = false;
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}