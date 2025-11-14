import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export interface ThemeConfig {
  name: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  secondaryDark: string;
  secondaryLight: string;
  accent: string;
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceHover: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  gradient: string;
  shadow: string;
}

// Define specific theme names as a union type
export type ThemeName = 
  | 'professional-light' 
  | 'professional-dark' 
  | 'ocean-light' 
  | 'ocean-dark' 
  | 'forest-light' 
  | 'forest-dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkTheme = new BehaviorSubject<boolean>(false);
  private currentTheme = new BehaviorSubject<ThemeConfig>(this.getDefaultLightTheme());
  private currentThemeName = new BehaviorSubject<ThemeName>('professional-light');
  
  isDarkTheme$ = this.darkTheme.asObservable();
  currentTheme$ = this.currentTheme.asObservable();
  currentThemeName$ = this.currentThemeName.asObservable();

  // Enhanced Theme configurations - defined as a getter to ensure initialization
  private get themes(): Record<ThemeName, ThemeConfig> {
    return {
      'professional-light': {
        name: 'professional-light',
        primary: '#2563eb',
        primaryDark: '#1d4ed8',
        primaryLight: '#3b82f6',
        secondary: '#7c3aed',
        secondaryDark: '#6d28d9',
        secondaryLight: '#8b5cf6',
        accent: '#06d6a0',
        background: '#ffffff',
        backgroundSecondary: '#f8fafc',
        surface: '#f1f5f9',
        surfaceHover: '#e2e8f0',
        text: '#0f172a',
        textSecondary: '#334155',
        textMuted: '#64748b',
        border: '#e2e8f0',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
        gradient: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
        shadow: '0 10px 25px rgba(0, 0, 0, 0.08)'
      },
      'professional-dark': {
        name: 'professional-dark',
        primary: '#3b82f6',
        primaryDark: '#2563eb',
        primaryLight: '#60a5fa',
        secondary: '#8b5cf6',
        secondaryDark: '#7c3aed',
        secondaryLight: '#a78bfa',
        accent: '#34d399',
        background: '#0f172a',
        backgroundSecondary: '#1e293b',
        surface: '#334155',
        surfaceHover: '#475569',
        text: '#f8fafc',
        textSecondary: '#e2e8f0',
        textMuted: '#94a3b8',
        border: '#334155',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6',
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
        shadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
      },
      'ocean-light': {
        name: 'ocean-light',
        primary: '#0891b2',
        primaryDark: '#0e7490',
        primaryLight: '#06b6d4',
        secondary: '#0ea5e9',
        secondaryDark: '#0284c7',
        secondaryLight: '#38bdf8',
        accent: '#f59e0b',
        background: '#f0fdfa',
        backgroundSecondary: '#ecfeff',
        surface: '#f8fafc',
        surfaceHover: '#e2e8f0',
        text: '#0f172a',
        textSecondary: '#334155',
        textMuted: '#64748b',
        border: '#cbd5e1',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#0891b2',
        gradient: 'linear-gradient(135deg, #0891b2 0%, #0ea5e9 100%)',
        shadow: '0 10px 25px rgba(8, 145, 178, 0.15)'
      },
      'ocean-dark': {
        name: 'ocean-dark',
        primary: '#06b6d4',
        primaryDark: '#0891b2',
        primaryLight: '#22d3ee',
        secondary: '#38bdf8',
        secondaryDark: '#0ea5e9',
        secondaryLight: '#7dd3fc',
        accent: '#fbbf24',
        background: '#0c4a6e',
        backgroundSecondary: '#0f172a',
        surface: '#1e293b',
        surfaceHover: '#334155',
        text: '#f0f9ff',
        textSecondary: '#e0f2fe',
        textMuted: '#bae6fd',
        border: '#1e40af',
        success: '#34d399',
        warning: '#fbbf24',
        error: '#f87171',
        info: '#38bdf8',
        gradient: 'linear-gradient(135deg, #06b6d4 0%, #38bdf8 100%)',
        shadow: '0 10px 25px rgba(6, 182, 212, 0.2)'
      },
      'forest-light': {
        name: 'forest-light',
        primary: '#059669',
        primaryDark: '#047857',
        primaryLight: '#10b981',
        secondary: '#65a30d',
        secondaryDark: '#4d7c0f',
        secondaryLight: '#84cc16',
        accent: '#dc2626',
        background: '#f0fdf4',
        backgroundSecondary: '#ecfdf5',
        surface: '#f8fafc',
        surfaceHover: '#e2e8f0',
        text: '#0f172a',
        textSecondary: '#1e293b',
        textMuted: '#475569',
        border: '#cbd5e1',
        success: '#059669',
        warning: '#d97706',
        error: '#dc2626',
        info: '#0891b2',
        gradient: 'linear-gradient(135deg, #059669 0%, #65a30d 100%)',
        shadow: '0 10px 25px rgba(5, 150, 105, 0.15)'
      },
      'forest-dark': {
        name: 'forest-dark',
        primary: '#10b981',
        primaryDark: '#059669',
        primaryLight: '#34d399',
        secondary: '#84cc16',
        secondaryDark: '#65a30d',
        secondaryLight: '#a3e635',
        accent: '#f87171',
        background: '#052e16',
        backgroundSecondary: '#0f172a',
        surface: '#1e293b',
        surfaceHover: '#334155',
        text: '#f0fdf4',
        textSecondary: '#dcfce7',
        textMuted: '#bbf7d0',
        border: '#166534',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#f87171',
        info: '#38bdf8',
        gradient: 'linear-gradient(135deg, #10b981 0%, #84cc16 100%)',
        shadow: '0 10px 25px rgba(16, 185, 129, 0.2)'
      }
    };
  }

  constructor(@Inject(PLATFORM_ID) private platformId: any) {
    // Initialize with default theme
    this.currentTheme.next(this.getDefaultLightTheme());
    this.initializeTheme();
  }

  private getDefaultLightTheme(): ThemeConfig {
    // Use the getter to ensure themes are initialized
    return this.themes['professional-light'];
  }

  private initializeTheme() {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('darkTheme');
      const savedThemeName = (localStorage.getItem('themeName') as ThemeName) || 'professional-light';
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      const isDark = savedTheme ? savedTheme === 'true' : prefersDark;
      const themeName = isDark ? this.getDarkVariant(savedThemeName) : savedThemeName;
      
      this.setTheme(isDark, themeName);
    }
  }

  toggleTheme() {
    const newValue = !this.darkTheme.value;
    const currentThemeName = this.currentThemeName.value;
    const newThemeName = newValue ? this.getDarkVariant(currentThemeName) : this.getLightVariant(currentThemeName);
    
    this.setTheme(newValue, newThemeName);
  }

  setThemeByName(themeName: ThemeName) {
    const theme = this.themes[themeName];
    if (theme) {
      const isDark = themeName.includes('dark');
      this.setTheme(isDark, themeName);
    }
  }

  getAvailableThemes(): { name: ThemeName; label: string; isDark: boolean }[] {
    return [
      { name: 'professional-light', label: 'Professional Light', isDark: false },
      { name: 'professional-dark', label: 'Professional Dark', isDark: true },
      { name: 'ocean-light', label: 'Ocean Light', isDark: false },
      { name: 'ocean-dark', label: 'Ocean Dark', isDark: true },
      { name: 'forest-light', label: 'Forest Light', isDark: false },
      { name: 'forest-dark', label: 'Forest Dark', isDark: true }
    ];
  }

  private getDarkVariant(themeName: ThemeName): ThemeName {
    if (themeName.includes('light')) {
      return themeName.replace('light', 'dark') as ThemeName;
    }
    return themeName.includes('dark') ? themeName : `${themeName.split('-')[0]}-dark` as ThemeName;
  }

  private getLightVariant(themeName: ThemeName): ThemeName {
    if (themeName.includes('dark')) {
      return themeName.replace('dark', 'light') as ThemeName;
    }
    return themeName.includes('light') ? themeName : `${themeName.split('-')[0]}-light` as ThemeName;
  }

  private setTheme(isDark: boolean, themeName: ThemeName) {
    const theme = this.themes[themeName] || (isDark ? this.themes['professional-dark'] : this.themes['professional-light']);
    
    this.darkTheme.next(isDark);
    this.currentTheme.next(theme);
    this.currentThemeName.next(themeName);
    this.applyTheme(isDark, theme);
    
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('darkTheme', isDark.toString());
      localStorage.setItem('themeName', themeName);
    }
  }

  private applyTheme(isDark: boolean, theme: ThemeConfig) {
    if (isPlatformBrowser(this.platformId)) {
      const root = document.documentElement;
      
      // Set CSS custom properties
      root.style.setProperty('--bs-primary', theme.primary);
      root.style.setProperty('--bs-primary-dark', theme.primaryDark);
      root.style.setProperty('--bs-primary-light', theme.primaryLight);
      root.style.setProperty('--bs-secondary', theme.secondary);
      root.style.setProperty('--bs-secondary-dark', theme.secondaryDark);
      root.style.setProperty('--bs-secondary-light', theme.secondaryLight);
      root.style.setProperty('--bs-accent', theme.accent);
      root.style.setProperty('--bs-success', theme.success);
      root.style.setProperty('--bs-warning', theme.warning);
      root.style.setProperty('--bs-error', theme.error);
      root.style.setProperty('--bs-info', theme.info);
      
      root.style.setProperty('--theme-bg', theme.background);
      root.style.setProperty('--theme-bg-secondary', theme.backgroundSecondary);
      root.style.setProperty('--theme-surface', theme.surface);
      root.style.setProperty('--theme-surface-hover', theme.surfaceHover);
      root.style.setProperty('--theme-text', theme.text);
      root.style.setProperty('--theme-text-secondary', theme.textSecondary);
      root.style.setProperty('--theme-text-muted', theme.textMuted);
      root.style.setProperty('--theme-border', theme.border);
      root.style.setProperty('--theme-gradient', theme.gradient);
      root.style.setProperty('--theme-shadow', theme.shadow);
      
      // Set RGB values for opacity variations
      root.style.setProperty('--bs-primary-rgb', this.hexToRgb(theme.primary));
      root.style.setProperty('--bs-secondary-rgb', this.hexToRgb(theme.secondary));
      root.style.setProperty('--bs-accent-rgb', this.hexToRgb(theme.accent));

      // Apply dark/light class
      if (isDark) {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
      } else {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
      }

      // Apply theme-specific class
      this.getAvailableThemes().forEach(availableTheme => {
        document.body.classList.remove(`theme-${availableTheme.name}`);
      });
      document.body.classList.add(`theme-${theme.name}`);
    }
  }

  private hexToRgb(hex: string): string {
    // Remove the # if present
    hex = hex.replace('#', '');
    
    // Convert 3-digit hex to 6-digits
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return `${r}, ${g}, ${b}`;
  }

  // Utility method to get contrast color (black or white)
  getContrastColor(hexColor: string): string {
    const rgb = this.hexToRgb(hexColor).split(',').map(val => parseInt(val.trim()));
    const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  }

  // Get current theme configuration
  getCurrentTheme(): ThemeConfig {
    return this.currentTheme.value;
  }

  // Get specific theme by name
  getThemeByName(name: ThemeName): ThemeConfig | null {
    return this.themes[name] || null;
  }

  // Check if current theme is dark
  isDarkTheme(): boolean {
    return this.darkTheme.value;
  }

  // Get current theme name
  getCurrentThemeName(): ThemeName {
    return this.currentThemeName.value;
  }
}