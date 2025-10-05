import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkTheme = new BehaviorSubject<boolean>(false);
  isDarkTheme$ = this.darkTheme.asObservable();

  constructor() {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('darkTheme');
    if (savedTheme) {
      this.darkTheme.next(savedTheme === 'true');
      this.applyTheme(savedTheme === 'true');
    }
  }

  toggleTheme() {
    const newValue = !this.darkTheme.value;
    this.darkTheme.next(newValue);
    this.applyTheme(newValue);
    localStorage.setItem('darkTheme', newValue.toString());
  }

  private applyTheme(isDark: boolean) {
    if (isDark) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }
}