import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export interface ThemeConfig {
  name: string;
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkTheme = new BehaviorSubject<boolean>(false);
  private currentTheme = new BehaviorSubject<ThemeConfig>(this.getDefaultLightTheme());
  
  isDarkTheme$ = this.darkTheme.asObservable();
  currentTheme$ = this.currentTheme.asObservable();

  // Theme configurations
  private lightTheme: ThemeConfig = {
    name: 'light',
    primary: '#2563eb',
    secondary: '#64748b',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#0f172a',
    textSecondary: '#475569'
  };

  private darkThemeConfig: ThemeConfig = {
    name: 'dark',
    primary: '#3b82f6',
    secondary: '#94a3b8',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f1f5f9',
    textSecondary: '#cbd5e1'
  };

  constructor(@Inject(PLATFORM_ID) private platformId: any) {
    // Initialize with default light theme first
    this.currentTheme.next(this.lightTheme);
    this.initializeTheme();
  }

  private getDefaultLightTheme(): ThemeConfig {
    return {
      name: 'light',
      primary: '#2563eb',
      secondary: '#64748b',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#0f172a',
      textSecondary: '#475569'
    };
  }

  private initializeTheme() {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('darkTheme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      const isDark = savedTheme ? savedTheme === 'true' : prefersDark;
      this.setTheme(isDark);
    }
  }

  toggleTheme() {
    const newValue = !this.darkTheme.value;
    this.setTheme(newValue);
  }

  private setTheme(isDark: boolean) {
    this.darkTheme.next(isDark);
    const theme = isDark ? this.darkThemeConfig : this.lightTheme;
    this.currentTheme.next(theme);
    this.applyTheme(isDark, theme);
    
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('darkTheme', isDark.toString());
    }
  }

  private applyTheme(isDark: boolean, theme: ThemeConfig) {
    if (isPlatformBrowser(this.platformId)) {
      const root = document.documentElement;
      root.style.setProperty('--bs-primary', theme.primary);
      root.style.setProperty('--bs-primary-rgb', this.hexToRgb(theme.primary));
      root.style.setProperty('--theme-bg', theme.background);
      root.style.setProperty('--theme-surface', theme.surface);
      root.style.setProperty('--theme-text', theme.text);
      root.style.setProperty('--theme-text-secondary', theme.textSecondary);

      if (isDark) {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
    }
  }

  private hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
      `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` 
      : '37, 99, 235';
  }

  // Public getters for themes (if needed elsewhere)
  getLightTheme(): ThemeConfig {
    return { ...this.lightTheme };
  }

  getDarkTheme(): ThemeConfig {
    return { ...this.darkThemeConfig };
  }
}